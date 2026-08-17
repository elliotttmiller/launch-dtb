#!/usr/bin/env python3
"""Inventory public commerce JSON/JS/API/fetch structures used by competitor storefronts.

This is read-only diagnostic tooling. It opens representative public product pages in
Chromium, records the complete browser response stream, isolates commerce-relevant
structured endpoints, safely probes a bounded set of public GET-only product endpoints,
and exports reusable endpoint patterns for production scraper integration.

It deliberately does not rank endpoints, recommend a preferred method, authenticate,
bypass access controls, or persist cookies, authorization headers, request bodies,
response bodies, tokens, or browser storage.
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
MAX_REPLAY_ENDPOINTS_PER_PAGE = 12
SENSITIVE_QUERY_KEYS = {
    "access_token", "api_key", "apikey", "auth", "authorization", "code", "key",
    "password", "secret", "session", "sig", "signature", "token",
}
PRODUCT_FIELDS = {
    "title", "name", "handle", "vendor", "brand", "sku", "mpn", "barcode", "gtin",
    "price", "price_min", "price_max", "compare_at_price", "variants", "available",
    "availability", "currency", "product", "products", "item", "items",
}
COMMERCE_PATH_MARKERS = (
    "/api/", "/graphql", "/services/", "/service.", "/scs/services/", "/products/",
    "/product/", "/variants/", "/items", "/catalog", "/search", "/recommend/",
    "/cart.js", "/cart.json",
)
NOISE_HOST_SUFFIXES = (
    "analytics.google.com", "google-analytics.com", "googletagmanager.com", "doubleclick.net",
    "facebook.net", "facebook.com", "pinterest.com", "bing.com", "clarity.ms", "hotjar.com",
    "tiktok.com", "snapchat.com", "segment.io", "segment.com", "newrelic.com", "nr-data.net",
    "sentry.io", "datadoghq.com", "mouseflow.com", "fullstory.com", "trustpilot.com",
)
NOISE_PATH_MARKERS = (
    "/collect", "/g/collect", "/pageview", "/page_view", "/track", "/tracking",
    "/pixel", "/events", "/event", "/monorail", "/metrics", "/logs", "/telemetry",
    "/beacon", "/nobot", "/challenge-platform/",
)
STATIC_RESOURCE_TYPES = {"stylesheet", "image", "font", "media"}
STATIC_CONTENT_TYPES = {
    "text/css", "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
    "font/woff", "font/woff2", "application/font-woff",
}
QUERY_PLACEHOLDERS = {
    "url": "{product_slug}", "slug": "{product_slug}", "handle": "{handle}",
    "id": "{id}", "itemid": "{product_id}", "item_id": "{product_id}",
    "productid": "{product_id}", "product_id": "{product_id}", "variant": "{variant_id}",
    "variantid": "{variant_id}", "variant_id": "{variant_id}", "sku": "{sku}",
    "country": "{country}", "currency": "{currency}", "lang": "{locale}",
    "language": "{locale}", "locale": "{locale}", "fieldset": "{fieldset}",
    "pricelevel": "{price_level}", "c": "{site_id}", "n": "{site_id}",
}
DEFAULT_SAMPLE_URLS = {
    "als_taping_tools": "https://www.alstapingtools.com/columbia-10-fat-boy-drywall-flat-finishing-box/",
    "all_wall": "https://www.all-wall.com/TapeTech-EasyClean-Automatic-Taper",
    "wall_tools": "https://walltools.com/columbia-taping-tools-12-in-quick-clean-flat-box-COLM-12ffb/",
    "csr_building": "https://csrbuilding.com/en-us/collections/columbia/products/columbia-corner-roller-cr",
}


@dataclass
class NetworkObservation:
    site_key: str
    sample_url: str
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
    resource_types: str
    platform_hints: str
    observed_count: int
    successful_count: int
    structured_count: int
    direct_fetch_confirmed: bool
    example_url: str
    detected_fields: str
    json_keys: str


def redact_url(url: str) -> str:
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
    if not (stripped.startswith("{") or stripped.startswith("[")):
        return None
    if content_type not in {
        "application/json", "application/ld+json", "text/json", "text/javascript",
        "application/javascript", "application/x-javascript", "",
    }:
        return None
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        return None


def walk_keys(value: Any, *, limit: int = 300) -> set[str]:
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
            for child in node[:75]:
                visit(child)
                if len(keys) >= limit:
                    return

    visit(value)
    return keys


def structured_metadata(payload: Any | None) -> tuple[str, str]:
    if payload is None:
        return "", ""
    keys = walk_keys(payload)
    return "|".join(sorted(keys & PRODUCT_FIELDS)), "|".join(sorted(keys))


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
    """Bounded public GET probes derived only from the product URL."""
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


def semantic_query_placeholder(key: str) -> str:
    return QUERY_PLACEHOLDERS.get(key.lower(), "{value}")


def endpoint_template(url: str) -> str:
    """Generalize dynamic product/id/query values while preserving endpoint semantics."""
    parsed = urlparse(url)
    parts = [part for part in parsed.path.split("/") if part]
    generalized: list[str] = []
    previous = ""

    for part in parts:
        lower = part.lower()
        suffix = ""
        stem = part
        if lower.endswith(".json"):
            stem, suffix = part[:-5], ".json"
        elif lower.endswith(".js"):
            stem, suffix = part[:-3], ".js"

        if previous == "products":
            generalized.append("{handle}" + suffix)
        elif previous == "variants" and stem.isdigit():
            generalized.append("{variant_id}" + suffix)
        elif re.fullmatch(r"\d{4,}", stem):
            generalized.append("{id}" + suffix)
        elif re.fullmatch(r"[0-9a-f]{8}-[0-9a-f-]{27,}", stem, re.I):
            generalized.append("{uuid}" + suffix)
        else:
            generalized.append(part)
        previous = lower

    path = "/" + "/".join(generalized)
    query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
    query = urlencode([(key, semantic_query_placeholder(key)) for key, _ in query_pairs], doseq=True)
    return urlunparse(parsed._replace(path=path, query=query, fragment=""))


def is_noise_url(url: str) -> bool:
    parsed = urlparse(url)
    host = parsed.netloc.lower().split(":", 1)[0]
    path = parsed.path.lower()
    if any(host == suffix or host.endswith("." + suffix) for suffix in NOISE_HOST_SUFFIXES):
        return True
    if any(marker in path for marker in NOISE_PATH_MARKERS):
        return True
    return False


def has_commerce_path(url: str) -> bool:
    path = urlparse(url).path.lower()
    return any(marker in path for marker in COMMERCE_PATH_MARKERS)


def endpoint_kind(observation: NetworkObservation) -> str:
    path = urlparse(observation.url).path.lower()
    if observation.source == "direct_product_probe":
        if path.endswith(".js"):
            return "direct_product_js"
        if path.endswith(".json"):
            return "direct_product_json"
        return "direct_product_probe"
    if observation.source == "platform_probe":
        return "platform_probe"
    if observation.source == "direct_replay":
        return "direct_replay"
    if observation.resource_type in {"xhr", "fetch"}:
        return f"browser_{observation.resource_type}"
    if path.endswith(".json"):
        return "json_endpoint"
    if path.endswith(".js") and observation.structured:
        return "structured_js_endpoint"
    if observation.structured:
        return "structured_response"
    return "commerce_endpoint"


def is_endpoint_finding(observation: NetworkObservation) -> bool:
    """Keep commerce/API findings; leave static/analytics noise only in raw observations."""
    if observation.status < 200 or observation.status >= 300:
        return False
    if is_noise_url(observation.url):
        return False
    if observation.resource_type in STATIC_RESOURCE_TYPES or observation.content_type in STATIC_CONTENT_TYPES:
        return False

    if observation.source in {"direct_product_probe", "platform_probe", "direct_replay"}:
        return observation.structured or bool(observation.detected_fields)

    if observation.structured:
        if observation.detected_fields:
            return True
        if observation.resource_type in {"xhr", "fetch"}:
            return True
        if observation.same_origin and has_commerce_path(observation.url):
            return True

    if observation.method == "GET" and observation.resource_type in {"xhr", "fetch"}:
        return observation.same_origin and has_commerce_path(observation.url)

    path = urlparse(observation.url).path.lower()
    return observation.structured and (path.endswith(".json") or path.endswith(".js"))


def response_observation(site_key: str, sample_url: str, response: Response, source: str = "browser") -> NetworkObservation:
    request = response.request
    headers = response.headers
    content_type = normalize_content_type(headers.get("content-type", ""))
    try:
        content_length = int(headers.get("content-length", "")) if headers.get("content-length") else None
    except ValueError:
        content_length = None

    payload = None
    body_text = ""
    should_inspect = request.resource_type in {"xhr", "fetch"} or content_type in {
        "application/json", "application/ld+json", "text/json", "text/javascript",
        "application/javascript", "application/x-javascript",
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
        sample_url=sample_url,
        source=source,
        method=request.method,
        resource_type=request.resource_type,
        status=response.status,
        url=redact_url(response.url),
        content_type=content_type,
        content_length=content_length,
        same_origin=same_origin(sample_url, response.url),
        structured=payload is not None,
        platform_hint=platform_hint(headers, response.url, body_text),
        detected_fields=detected_fields,
        json_keys=json_keys,
    )


def probe_get(
    context: BrowserContext,
    site_key: str,
    sample_url: str,
    url: str,
    timeout_ms: int,
    source: str,
) -> NetworkObservation:
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
            sample_url=sample_url,
            source=source,
            method="GET",
            resource_type="probe",
            status=response.status,
            url=redact_url(response.url),
            content_type=content_type,
            content_length=len(body),
            same_origin=same_origin(sample_url, response.url),
            structured=payload is not None,
            platform_hint=platform_hint(headers, response.url, body_text),
            detected_fields=detected_fields,
            json_keys=json_keys,
            elapsed_ms=round((time.monotonic() - started) * 1000),
        )
    except Exception:
        return NetworkObservation(
            site_key=site_key,
            sample_url=sample_url,
            source=source,
            method="GET",
            resource_type="probe",
            status=0,
            url=redact_url(url),
            content_type="",
            content_length=None,
            same_origin=same_origin(sample_url, url),
            structured=False,
            platform_hint="unknown",
            elapsed_ms=round((time.monotonic() - started) * 1000),
        )


def detected_platforms(observations: Sequence[NetworkObservation]) -> set[str]:
    return {item.platform_hint for item in observations if item.platform_hint != "unknown"}


def extract_bigcommerce_product_ids(page: Page) -> list[str]:
    """Read public product IDs already rendered into BigCommerce product markup."""
    ids: set[str] = set()
    selectors = (
        "[data-product-id]", "input[name='product_id']", "input[name='productId']",
        "input[data-product-id]",
    )
    for selector in selectors:
        try:
            for element in page.query_selector_all(selector):
                for attribute in ("data-product-id", "value"):
                    value = element.get_attribute(attribute)
                    if value and value.isdigit():
                        ids.add(value)
        except Exception:
            continue
    return sorted(ids)


def platform_probe_candidates(
    site_key: str,
    final_url: str,
    platforms: set[str],
    bigcommerce_product_ids: Sequence[str],
) -> list[str]:
    """Small public GET-only platform probes. No auth headers or private APIs."""
    parsed = urlparse(final_url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    candidates: list[str] = []

    if "shopify" in platforms or site_key == "csr_building":
        candidates.extend(direct_probe_candidates(site_key, final_url))

    if "bigcommerce" in platforms:
        for product_id in list(bigcommerce_product_ids)[:3]:
            candidates.extend(
                (
                    f"{origin}/api/storefront/products/{product_id}",
                    f"{origin}/api/storefront/products/{product_id}/attributes",
                )
            )

    return list(dict.fromkeys(candidates))


def replay_candidates(observations: Sequence[NetworkObservation]) -> list[str]:
    """Confirm public GET structured endpoints observed during page load without inventing APIs."""
    candidates: list[str] = []
    for item in observations:
        if item.source != "browser" or item.method != "GET" or item.status < 200 or item.status >= 300:
            continue
        if "%5BREDACTED%5D" in item.url or "[REDACTED]" in item.url or is_noise_url(item.url):
            continue
        if item.resource_type not in {"xhr", "fetch"}:
            continue
        if not (item.structured or item.detected_fields or (item.same_origin and has_commerce_path(item.url))):
            continue
        candidates.append(item.url)
        if len(candidates) >= MAX_REPLAY_ENDPOINTS_PER_PAGE:
            break
    return list(dict.fromkeys(candidates))


def inspect_page(
    context: BrowserContext,
    site_key: str,
    sample_url: str,
    timeout_ms: int,
    settle_ms: int,
) -> tuple[list[NetworkObservation], str, set[str]]:
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
        platforms = detected_platforms(observations)
        bigcommerce_ids = extract_bigcommerce_product_ids(page) if "bigcommerce" in platforms else []

        for candidate in direct_probe_candidates(site_key, final_url):
            observations.append(
                probe_get(context, site_key, sample_url, candidate, timeout_ms, "direct_product_probe")
            )

        for candidate in platform_probe_candidates(site_key, final_url, platforms, bigcommerce_ids):
            if candidate not in direct_probe_candidates(site_key, final_url):
                observations.append(
                    probe_get(context, site_key, sample_url, candidate, timeout_ms, "platform_probe")
                )

        for candidate in replay_candidates(observations):
            observations.append(
                probe_get(context, site_key, sample_url, candidate, timeout_ms, "direct_replay")
            )

        return observations, final_url, detected_platforms(observations)
    finally:
        page.close()


def build_patterns(findings: Sequence[NetworkObservation]) -> list[EndpointPattern]:
    grouped: dict[tuple[str, str, str, str, bool], list[NetworkObservation]] = {}
    for item in findings:
        key = (item.site_key, endpoint_kind(item), item.method, endpoint_template(item.url), item.same_origin)
        grouped.setdefault(key, []).append(item)

    patterns: list[EndpointPattern] = []
    for (site_key, kind, method, template, same), items in grouped.items():
        fields = sorted({field for item in items for field in item.detected_fields.split("|") if field})
        keys = sorted({key for item in items for key in item.json_keys.split("|") if key})
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
                resource_types="|".join(sorted({item.resource_type for item in items})),
                platform_hints="|".join(sorted({item.platform_hint for item in items if item.platform_hint != "unknown"})),
                observed_count=len(items),
                successful_count=sum(1 for item in items if 200 <= item.status < 300),
                structured_count=sum(1 for item in items if item.structured),
                direct_fetch_confirmed=any(item.source in {"direct_product_probe", "platform_probe", "direct_replay"} and 200 <= item.status < 300 and item.structured for item in items),
                example_url=items[0].url,
                detected_fields="|".join(fields),
                json_keys="|".join(keys),
            )
        )
    return sorted(patterns, key=lambda item: (item.site_key, item.endpoint_kind, item.endpoint_template))


def parse_url_overrides(values: Sequence[str]) -> dict[str, list[str]]:
    overrides: dict[str, list[str]] = {}
    for value in values:
        if "=" not in value:
            raise SystemExit(f"ERROR: --url must use site_key=https://... format: {value}")
        site_key, url = value.split("=", 1)
        site_key, url = site_key.strip(), url.strip()
        if site_key not in DEFAULT_SAMPLE_URLS:
            raise SystemExit(f"ERROR: unknown site key in --url: {site_key}")
        if urlparse(url).scheme not in {"http", "https"}:
            raise SystemExit(f"ERROR: invalid URL for {site_key}: {url}")
        overrides.setdefault(site_key, []).append(url)
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
    parser.add_argument(
        "--url", action="append", default=[],
        help="Add/override representative page as site_key=https://...; repeat for multiple products per site",
    )
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

    for legacy_name in ("site_recommendations.csv",):
        legacy = output_dir / legacy_name
        if legacy.exists():
            legacy.unlink()

    observations: list[NetworkObservation] = []
    final_pages: dict[str, list[str]] = {site_key: [] for site_key in selected}
    platforms_by_site: dict[str, set[str]] = {site_key: set() for site_key in selected}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not args.headed)
        context = browser.new_context(
            user_agent=core.DEFAULT_USER_AGENT.replace("2.0", "EndpointProbe/3.0"),
            locale="en-US",
        )
        try:
            for site_key in selected:
                sample_urls = overrides.get(site_key) or [DEFAULT_SAMPLE_URLS[site_key]]
                for sample_url in sample_urls:
                    page_observations, final_url, platforms = inspect_page(
                        context, site_key, sample_url, args.timeout_ms, args.settle_ms
                    )
                    observations.extend(page_observations)
                    final_pages[site_key].append(final_url)
                    platforms_by_site[site_key].update(platforms)
                    findings = [item for item in page_observations if is_endpoint_finding(item)]
                    print(json.dumps({
                        "site": site_key,
                        "sample_url": sample_url,
                        "platforms": sorted(platforms),
                        "network_observations": len(page_observations),
                        "commerce_endpoint_findings": len(findings),
                        "structured_findings": sum(1 for item in findings if item.structured),
                        "direct_confirmations": sum(1 for item in findings if item.source in {"direct_product_probe", "platform_probe", "direct_replay"}),
                    }, sort_keys=True))
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
        "schema_version": 3,
        "generated_at_epoch": int(time.time()),
        "sites": selected,
        "final_pages": final_pages,
        "platforms": {site: sorted(values) for site, values in platforms_by_site.items()},
        "network_observation_count": len(observations),
        "commerce_endpoint_finding_count": len(findings),
        "endpoint_pattern_count": len(patterns),
        "per_site": {
            site_key: {
                "network_observations": sum(1 for item in observations if item.site_key == site_key),
                "commerce_endpoint_findings": sum(1 for item in findings if item.site_key == site_key),
                "structured_findings": sum(1 for item in findings if item.site_key == site_key and item.structured),
                "direct_confirmations": sum(1 for item in findings if item.site_key == site_key and item.source in {"direct_product_probe", "platform_probe", "direct_replay"}),
                "detected_fields": sorted({field for item in findings if item.site_key == site_key for field in item.detected_fields.split("|") if field}),
                "endpoint_patterns": [asdict(pattern) for pattern in patterns if pattern.site_key == site_key],
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
            "direct_probes_get_only": True,
        },
    }
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(json.dumps({
        "status": "completed",
        "network_observations": len(observations),
        "commerce_endpoint_findings": len(findings),
        "endpoint_patterns": len(patterns),
        "output_dir": str(output_dir),
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
