#!/usr/bin/env python3
"""Inventory public JSON/JS/API/fetch structures used by competitor storefronts.

This is read-only diagnostic tooling. It opens one representative public product page
per configured competitor in Chromium, records network response metadata, identifies
structured/network endpoints, safely probes a small set of GET-only product-derived
`.js` / `.json` candidates, and exports endpoint structures for manual analysis.

It deliberately does not rank endpoints, recommend a preferred method, persist cookies,
authorization headers, request bodies, response bodies, tokens, or browser storage.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable, Sequence
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import competitor_price_research_core as core

try:
    from playwright.sync_api import BrowserContext, Page, Response, sync_playwright
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "ERROR: playwright is required. Install scripts/catalog/competitor_endpoint_probe.requirements.txt "
        "and run: python -m playwright install chromium"
    ) from exc


DEFAULT_OUTPUT_DIR = core.ROOT / "reports" / "pricing" / "competitor-endpoint-probe"
MAX_STRUCTURED_SAMPLE_BYTES = 512_000
SENSITIVE_QUERY_KEYS = {
    "access_token", "api_key", "apikey", "auth", "authorization", "code", "key",
    "password", "secret", "session", "sig", "signature", "token",
}
PRODUCT_FIELDS = {
    "title", "name", "handle", "vendor", "brand", "sku", "mpn", "barcode", "gtin",
    "price", "price_min", "price_max", "compare_at_price", "variants", "available",
    "availability", "currency",
}
API_PATH_MARKERS = (
    "/api/", "/graphql", "/services/", "/service.", "/ajax/", "/ajax_", "/products/",
    "/variants/", "/cart.js", "/cart.json", "/search", "/recommend/",
)
DEFAULT_SAMPLE_URLS = {
    "als_taping_tools": "https://www.alstapingtools.com/columbia-10-fat-boy-drywall-flat-finishing-box/",
    "all_wall": "https://www.all-wall.com/TapeTech-EasyClean-Automatic-Taper",
    "wall_tools": "https://walltools.com/columbia-taping-tools-12-in-quick-clean-flat-box-COLM-12ffb/",
    "csr_building": "https://csrbuilding.com/en-us/collections/columbia/products/columbia-corner-roller-cr",
}


@dataclass
class NetworkObservation:
    site_key: str
    source: str
    method: str
    resource_type: str
    status: int
    url: str
    content_type: str
    content_length: int | None
    same_origin: bool
    structured: bool
    platform_hint: str
    detected_fields: str = ""
    json_keys: str = ""
    elapsed_ms: int | None = None


@dataclass
class EndpointPattern:
    site_key: str
    endpoint_kind: str
    method: str
    endpoint_template: str
    same_origin: bool
    content_types: str
    statuses: str
    sources: str
    platform_hints: str
    observed_count: int
    example_url: str
    detected_fields: str


def redact_url(url: str) -> str:
    """Redact potentially sensitive query values while retaining endpoint structure."""
    parsed = urlparse(url)
    cleaned: list[tuple[str, str]] = []
    for key, value in parse_qsl(parsed.query, keep_blank_values=True):
        cleaned.append((key, "[REDACTED]" if key.lower() in SENSITIVE_QUERY_KEYS else value))
    return urlunparse(parsed._replace(query=urlencode(cleaned, doseq=True), fragment=""))


def same_origin(left: str, right: str) -> bool:
    a, b = urlparse(left), urlparse(right)
    return (a.scheme.lower(), a.netloc.lower()) == (b.scheme.lower(), b.netloc.lower())


def normalize_content_type(value: str) -> str:
    return (value or "").split(";", 1)[0].strip().lower()


def platform_hint(headers: dict[str, str], url: str, body_text: str = "") -> str:
    lowered = {str(k).lower(): str(v).lower() for k, v in headers.items()}
    haystack = " ".join(f"{k}:{v}" for k, v in lowered.items()) + " " + url.lower() + " " + body_text[:2000].lower()
    if "shopify" in haystack or "shopify-complexity" in haystack or "x-shopid" in haystack:
        return "shopify"
    if "bigcommerce" in haystack or "stencil" in haystack or "x-bc-" in haystack:
        return "bigcommerce"
    if "netsuite" in haystack or "suitecommerce" in haystack or "/scs/" in haystack:
        return "suitecommerce"
    if "magento" in haystack or "mage-cache" in haystack:
        return "magento"
    if "woocommerce" in haystack or "wc-ajax" in haystack or "wp-json/wc" in haystack:
        return "woocommerce"
    return "unknown"


def parse_structured_payload(text: str, content_type: str) -> Any | None:
    if not text:
        return None
    stripped = text.lstrip()
    if len(stripped.encode("utf-8", errors="ignore")) > MAX_STRUCTURED_SAMPLE_BYTES:
        return None
    if not (
        content_type in {"application/json", "application/ld+json", "text/json", "text/javascript", "application/javascript"}
        or stripped.startswith("{")
        or stripped.startswith("[")
    ):
        return None
    if not (stripped.startswith("{") or stripped.startswith("[")):
        return None
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        return None


def walk_keys(value: Any, *, limit: int = 200) -> set[str]:
    keys: set[str] = set()

    def visit(node: Any) -> None:
        if len(keys) >= limit:
            return
        if isinstance(node, dict):
            for key, child in node.items():
                keys.add(str(key).lower())
                visit(child)
                if len(keys) >= limit:
                    return
        elif isinstance(node, list):
            for child in node[:50]:
                visit(child)
                if len(keys) >= limit:
                    return

    visit(value)
    return keys


def structured_metadata(payload: Any | None) -> tuple[str, str]:
    if payload is None:
        return "", ""
    keys = walk_keys(payload)
    fields = sorted(keys & PRODUCT_FIELDS)
    return "|".join(fields), "|".join(sorted(keys))


def canonical_product_handle(url: str) -> tuple[str, str] | None:
    parsed = urlparse(url)
    parts = [part for part in parsed.path.split("/") if part]
    try:
        index = parts.index("products")
    except ValueError:
        return None
    if index + 1 >= len(parts):
        return None
    handle = parts[index + 1]
    prefix = "/" + "/".join(parts[:index]) if index else ""
    return (prefix, handle) if handle else None


def direct_probe_candidates(site_key: str, page_url: str) -> list[str]:
    """Return a small, deterministic set of safe GET-only structured product probes."""
    parsed = urlparse(page_url)
    base = urlunparse(parsed._replace(query="", fragment=""))
    product = canonical_product_handle(base)
    candidates: list[str] = []

    if product:
        prefix, handle = product
        if site_key == "csr_building":
            prefix = "/en-us"
        product_base = f"{parsed.scheme}://{parsed.netloc}{prefix}/products/{handle}"
        candidates.extend((f"{product_base}.js", f"{product_base}.json"))
    else:
        trimmed = base.rstrip("/")
        candidates.extend((f"{trimmed}.json", f"{trimmed}.js"))

    return list(dict.fromkeys(candidate for candidate in candidates if candidate != base))


def endpoint_template(url: str) -> str:
    """Generalize dynamic product/id/query values while preserving endpoint shape."""
    parsed = urlparse(url)
    parts = [part for part in parsed.path.split("/") if part]
    generalized: list[str] = []
    index = 0
    while index < len(parts):
        part = parts[index]
        lower = part.lower()
        generalized.append(part)
        if lower == "products" and index + 1 < len(parts):
            value = parts[index + 1]
            suffix = ""
            if value.lower().endswith(".json"):
                suffix = ".json"
            elif value.lower().endswith(".js"):
                suffix = ".js"
            generalized.append("{handle}" + suffix)
            index += 2
            continue
        if re.fullmatch(r"\d{4,}", part):
            generalized[-1] = "{id}"
        elif re.fullmatch(r"[0-9a-f]{8}-[0-9a-f-]{27,}", part, re.I):
            generalized[-1] = "{uuid}"
        index += 1

    path = "/" + "/".join(generalized)
    query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
    query = urlencode([(key, "{value}") for key, _ in query_pairs], doseq=True)
    return urlunparse(parsed._replace(path=path, query=query, fragment=""))


def endpoint_kind(observation: NetworkObservation) -> str:
    path = urlparse(observation.url).path.lower()
    if observation.source == "direct_probe":
        if path.endswith(".js"):
            return "direct_product_js"
        if path.endswith(".json"):
            return "direct_product_json"
        return "direct_probe"
    if observation.resource_type in {"xhr", "fetch"}:
        return f"browser_{observation.resource_type}"
    if path.endswith(".json"):
        return "json_endpoint"
    if path.endswith(".js") and observation.structured:
        return "structured_js_endpoint"
    if any(marker in path for marker in API_PATH_MARKERS):
        return "api_like_endpoint"
    if observation.structured:
        return "structured_response"
    return "network_response"


def is_endpoint_finding(observation: NetworkObservation) -> bool:
    path = urlparse(observation.url).path.lower()
    return (
        observation.source == "direct_probe"
        or observation.resource_type in {"xhr", "fetch"}
        or observation.structured
        or path.endswith(".json")
        or (path.endswith(".js") and any(marker in path for marker in ("/products/", "/cart", "/api/")))
        or any(marker in path for marker in API_PATH_MARKERS)
    )


def response_observation(site_key: str, page_url: str, response: Response, source: str) -> NetworkObservation:
    request = response.request
    headers = response.headers
    content_type = normalize_content_type(headers.get("content-type", ""))
    length_value = headers.get("content-length", "")
    try:
        content_length = int(length_value) if length_value else None
    except ValueError:
        content_length = None

    payload = None
    body_text = ""
    should_inspect = request.resource_type in {"xhr", "fetch"} or content_type in {
        "application/json", "application/ld+json", "text/json", "text/javascript", "application/javascript"
    }
    if should_inspect:
        try:
            body = response.body()
            if len(body) <= MAX_STRUCTURED_SAMPLE_BYTES:
                body_text = body.decode("utf-8", errors="replace")
                payload = parse_structured_payload(body_text, content_type)
                if content_length is None:
                    content_length = len(body)
        except Exception:
            pass

    detected_fields, json_keys = structured_metadata(payload)
    return NetworkObservation(
        site_key=site_key,
        source=source,
        method=request.method,
        resource_type=request.resource_type,
        status=response.status,
        url=redact_url(response.url),
        content_type=content_type,
        content_length=content_length,
        same_origin=same_origin(page_url, response.url),
        structured=payload is not None,
        platform_hint=platform_hint(headers, response.url, body_text),
        detected_fields=detected_fields,
        json_keys=json_keys,
    )


def probe_direct(context: BrowserContext, site_key: str, page_url: str, url: str, timeout_ms: int) -> NetworkObservation:
    started = time.monotonic()
    try:
        response = context.request.get(url, timeout=timeout_ms, fail_on_status_code=False)
        headers = {str(k).lower(): str(v) for k, v in response.headers.items()}
        content_type = normalize_content_type(headers.get("content-type", ""))
        body = response.body()
        body_text = body[:MAX_STRUCTURED_SAMPLE_BYTES].decode("utf-8", errors="replace")
        payload = parse_structured_payload(body_text, content_type)
        detected_fields, json_keys = structured_metadata(payload)
        return NetworkObservation(
            site_key=site_key,
            source="direct_probe",
            method="GET",
            resource_type="probe",
            status=response.status,
            url=redact_url(response.url),
            content_type=content_type,
            content_length=len(body),
            same_origin=same_origin(page_url, response.url),
            structured=payload is not None,
            platform_hint=platform_hint(headers, response.url, body_text),
            detected_fields=detected_fields,
            json_keys=json_keys,
            elapsed_ms=round((time.monotonic() - started) * 1000),
        )
    except Exception:
        return NetworkObservation(
            site_key=site_key,
            source="direct_probe",
            method="GET",
            resource_type="probe",
            status=0,
            url=redact_url(url),
            content_type="",
            content_length=None,
            same_origin=same_origin(page_url, url),
            structured=False,
            platform_hint="unknown",
            elapsed_ms=round((time.monotonic() - started) * 1000),
        )


def inspect_site(
    context: BrowserContext,
    site_key: str,
    sample_url: str,
    timeout_ms: int,
    settle_ms: int,
) -> tuple[list[NetworkObservation], str]:
    page: Page = context.new_page()
    observations: list[NetworkObservation] = []

    def on_response(response: Response) -> None:
        try:
            observations.append(response_observation(site_key, sample_url, response, "browser"))
        except Exception:
            return

    page.on("response", on_response)
    try:
        page.goto(sample_url, wait_until="domcontentloaded", timeout=timeout_ms)
        page.wait_for_timeout(settle_ms)
        final_url = page.url
        for candidate in direct_probe_candidates(site_key, final_url):
            observations.append(probe_direct(context, site_key, final_url, candidate, timeout_ms))
        return observations, final_url
    finally:
        page.close()


def build_patterns(findings: Sequence[NetworkObservation]) -> list[EndpointPattern]:
    grouped: dict[tuple[str, str, str, str, bool], list[NetworkObservation]] = {}
    for item in findings:
        key = (item.site_key, endpoint_kind(item), item.method, endpoint_template(item.url), item.same_origin)
        grouped.setdefault(key, []).append(item)

    patterns: list[EndpointPattern] = []
    for (site_key, kind, method, template, same), items in grouped.items():
        patterns.append(
            EndpointPattern(
                site_key=site_key,
                endpoint_kind=kind,
                method=method,
                endpoint_template=template,
                same_origin=same,
                content_types="|".join(sorted({item.content_type for item in items if item.content_type})),
                statuses="|".join(str(value) for value in sorted({item.status for item in items})),
                sources="|".join(sorted({item.source for item in items})),
                platform_hints="|".join(sorted({item.platform_hint for item in items if item.platform_hint != "unknown"})),
                observed_count=len(items),
                example_url=items[0].url,
                detected_fields="|".join(sorted({field for item in items for field in item.detected_fields.split("|") if field})),
            )
        )
    return sorted(patterns, key=lambda item: (item.site_key, item.endpoint_kind, item.endpoint_template))


def parse_url_overrides(values: Sequence[str]) -> dict[str, str]:
    overrides: dict[str, str] = {}
    for value in values:
        if "=" not in value:
            raise SystemExit(f"ERROR: --url must use site_key=https://... format: {value}")
        site_key, url = value.split("=", 1)
        site_key = site_key.strip()
        url = url.strip()
        if site_key not in DEFAULT_SAMPLE_URLS:
            raise SystemExit(f"ERROR: unknown site key in --url: {site_key}")
        if urlparse(url).scheme not in {"http", "https"}:
            raise SystemExit(f"ERROR: invalid URL for {site_key}: {url}")
        overrides[site_key] = url
    return overrides


def write_csv(path: Path, rows: Iterable[Any], fieldnames: Sequence[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            data = asdict(row) if hasattr(row, "__dataclass_fields__") else dict(row)
            writer.writerow({name: data.get(name, "") for name in fieldnames})


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sites", nargs="*", choices=sorted(DEFAULT_SAMPLE_URLS))
    parser.add_argument("--url", action="append", default=[], help="Override sample page as site_key=https://...")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--timeout-ms", type=int, default=30_000)
    parser.add_argument("--settle-ms", type=int, default=5_000)
    parser.add_argument("--headed", action="store_true")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    selected = args.sites or list(DEFAULT_SAMPLE_URLS)
    overrides = parse_url_overrides(args.url)
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    legacy = output_dir / "site_recommendations.csv"
    if legacy.exists():
        legacy.unlink()

    observations: list[NetworkObservation] = []
    final_pages: dict[str, str] = {}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not args.headed)
        context = browser.new_context(
            user_agent=core.DEFAULT_USER_AGENT.replace("2.0", "EndpointProbe/2.0"),
            locale="en-US",
        )
        try:
            for site_key in selected:
                sample_url = overrides.get(site_key, DEFAULT_SAMPLE_URLS[site_key])
                site_observations, final_url = inspect_site(
                    context, site_key, sample_url, args.timeout_ms, args.settle_ms
                )
                observations.extend(site_observations)
                final_pages[site_key] = final_url
                findings = [item for item in site_observations if is_endpoint_finding(item)]
                print(
                    json.dumps(
                        {
                            "site": site_key,
                            "network_observations": len(site_observations),
                            "endpoint_findings": len(findings),
                            "structured_responses": sum(1 for item in findings if item.structured),
                        },
                        sort_keys=True,
                    )
                )
        finally:
            context.close()
            browser.close()

    findings = [item for item in observations if is_endpoint_finding(item)]
    patterns = build_patterns(findings)

    network_path = output_dir / "network_observations.csv"
    findings_path = output_dir / "structured_endpoints.csv"
    patterns_path = output_dir / "endpoint_patterns.csv"
    summary_path = output_dir / "endpoint_probe.json"

    observation_fields = [field.name for field in NetworkObservation.__dataclass_fields__.values()]
    pattern_fields = [field.name for field in EndpointPattern.__dataclass_fields__.values()]
    write_csv(network_path, observations, observation_fields)
    write_csv(findings_path, findings, observation_fields)
    write_csv(patterns_path, patterns, pattern_fields)

    summary = {
        "schema_version": 2,
        "generated_at_epoch": int(time.time()),
        "sites": selected,
        "final_pages": final_pages,
        "network_observation_count": len(observations),
        "endpoint_finding_count": len(findings),
        "endpoint_pattern_count": len(patterns),
        "per_site": {
            site_key: {
                "network_observations": sum(1 for item in observations if item.site_key == site_key),
                "endpoint_findings": sum(1 for item in findings if item.site_key == site_key),
                "structured_responses": sum(1 for item in findings if item.site_key == site_key and item.structured),
                "endpoint_patterns": [
                    asdict(pattern) for pattern in patterns if pattern.site_key == site_key
                ],
            }
            for site_key in selected
        },
        "outputs": {
            "network_observations": str(network_path),
            "structured_endpoints": str(findings_path),
            "endpoint_patterns": str(patterns_path),
        },
        "security": {
            "authorization_headers_persisted": False,
            "cookies_persisted": False,
            "request_bodies_persisted": False,
            "response_bodies_persisted": False,
            "browser_storage_persisted": False,
            "sensitive_query_values_redacted": True,
        },
    }
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(json.dumps({
        "status": "completed",
        "network_observations": len(observations),
        "endpoint_findings": len(findings),
        "endpoint_patterns": len(patterns),
        "output_dir": str(output_dir),
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
