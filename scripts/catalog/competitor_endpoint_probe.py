#!/usr/bin/env python3
"""Inspect competitor storefront network traffic and rank structured product endpoints.

This is read-only diagnostic tooling. It opens one representative public product page
per configured competitor in Chromium, records network metadata, probes a small set of
safe GET-only structured endpoint candidates, and recommends the lightest stable
product-data path for future market research.

It deliberately does not persist cookies, authorization headers, request bodies,
response bodies, tokens, or other session material.
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
except ImportError as exc:  # pragma: no cover - exercised by operator environment
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
PRODUCT_FIELD_WEIGHTS = {
    "title": 2,
    "name": 2,
    "handle": 2,
    "vendor": 1,
    "brand": 1,
    "sku": 4,
    "mpn": 4,
    "barcode": 4,
    "gtin": 4,
    "price": 4,
    "price_min": 2,
    "price_max": 2,
    "compare_at_price": 2,
    "variants": 3,
    "available": 1,
    "availability": 1,
}

# Representative pages are diagnostics only. Operators can override any sample with
# --url site_key=https://... without changing code.
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
    product_score: int
    platform_hint: str
    elapsed_ms: int | None = None


@dataclass
class SiteRecommendation:
    site_key: str
    sample_url: str
    final_page_url: str
    platform_hint: str
    recommended_method: str
    recommended_url: str
    endpoint_template: str
    product_score: int
    content_type: str
    content_length: int | None
    status: int
    confidence: str
    html_fallback: bool
    notes: str


def redact_url(url: str) -> str:
    """Remove query values that could contain credentials/session material."""
    parsed = urlparse(url)
    cleaned: list[tuple[str, str]] = []
    for key, value in parse_qsl(parsed.query, keep_blank_values=True):
        if key.lower() in SENSITIVE_QUERY_KEYS:
            cleaned.append((key, "[REDACTED]"))
        else:
            cleaned.append((key, value))
    return urlunparse(parsed._replace(query=urlencode(cleaned, doseq=True), fragment=""))


def same_origin(left: str, right: str) -> bool:
    a, b = urlparse(left), urlparse(right)
    return (a.scheme.lower(), a.netloc.lower()) == (b.scheme.lower(), b.netloc.lower())


def normalize_content_type(value: str) -> str:
    return (value or "").split(";", 1)[0].strip().lower()


def platform_hint(headers: dict[str, str], url: str, body_text: str = "") -> str:
    lowered_headers = {str(k).lower(): str(v).lower() for k, v in headers.items()}
    joined = " ".join(f"{k}:{v}" for k, v in lowered_headers.items())
    haystack = f"{joined} {url.lower()} {body_text[:2000].lower()}"
    if "shopify" in haystack or "x-shopid" in haystack or "shopify-complexity" in haystack:
        return "shopify"
    if "bigcommerce" in haystack or "stencil" in haystack or "x-bc-" in haystack:
        return "bigcommerce"
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
    likely_json = (
        content_type in {"application/json", "application/ld+json", "text/json"}
        or stripped.startswith("{")
        or stripped.startswith("[")
    )
    if not likely_json:
        return None
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        return None


def walk_keys(value: Any) -> set[str]:
    keys: set[str] = set()
    if isinstance(value, dict):
        for key, child in value.items():
            keys.add(str(key).lower())
            keys.update(walk_keys(child))
    elif isinstance(value, list):
        for child in value[:50]:
            keys.update(walk_keys(child))
    return keys


def product_score(payload: Any | None) -> int:
    if payload is None:
        return 0
    keys = walk_keys(payload)
    return sum(weight for field, weight in PRODUCT_FIELD_WEIGHTS.items() if field in keys)


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
    if not handle:
        return None
    prefix = "/" + "/".join(parts[:index]) if index else ""
    return prefix, handle


def direct_probe_candidates(site_key: str, page_url: str) -> list[str]:
    """Generate a deliberately small set of safe GET-only product endpoint probes."""
    parsed = urlparse(page_url)
    base = urlunparse(parsed._replace(query="", fragment=""))
    candidates: list[str] = []

    product = canonical_product_handle(base)
    if product:
        prefix, handle = product
        product_base = f"{parsed.scheme}://{parsed.netloc}{prefix}/products/{handle}"
        candidates.extend([f"{product_base}.js", f"{product_base}.json"])

        # CSR market research is US/USD only. Never probe the root Canadian product
        # endpoint when the representative page is localized under /en-us.
        if site_key == "csr_building":
            candidates = [
                f"{parsed.scheme}://{parsed.netloc}/en-us/products/{handle}.js",
                f"{parsed.scheme}://{parsed.netloc}/en-us/products/{handle}.json",
            ]
    else:
        trimmed = base.rstrip("/")
        candidates.extend([f"{trimmed}.json", f"{trimmed}.js"])

    # Keep order stable and avoid probing the HTML page itself.
    return list(dict.fromkeys(candidate for candidate in candidates if candidate != base))


def endpoint_template(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path
    match = re.search(r"(?P<prefix>/products/)(?P<handle>[^/?]+)(?P<suffix>\.(?:js|json))?$", path, re.I)
    if match:
        suffix = match.group("suffix") or ""
        path = path[: match.start("handle")] + "{handle}" + suffix
    return urlunparse(parsed._replace(path=path, query="", fragment=""))


def method_name(observation: NetworkObservation) -> str:
    path = urlparse(observation.url).path.lower()
    if observation.platform_hint == "shopify" and path.endswith(".js"):
        return "shopify_product_js"
    if observation.structured and observation.resource_type in {"xhr", "fetch"}:
        return "observed_fetch_xhr"
    if observation.structured:
        return "structured_json_get"
    return "html"


def rank_observation(observation: NetworkObservation) -> tuple[int, int, int, int, int]:
    method = method_name(observation)
    method_rank = {
        "shopify_product_js": 5,
        "observed_fetch_xhr": 4,
        "structured_json_get": 3,
        "html": 0,
    }[method]
    status_rank = 1 if 200 <= observation.status < 300 else 0
    same_origin_rank = 1 if observation.same_origin else 0
    size_rank = 1 if observation.content_length is not None and observation.content_length <= 250_000 else 0
    return (method_rank, observation.product_score, status_rank, same_origin_rank, size_rank)


def choose_recommendation(
    site_key: str,
    sample_url: str,
    final_page_url: str,
    observations: Sequence[NetworkObservation],
) -> SiteRecommendation:
    candidates = [
        item for item in observations
        if item.structured and item.product_score >= 6 and 200 <= item.status < 300
    ]
    best = max(candidates, key=rank_observation) if candidates else None
    if best is None:
        return SiteRecommendation(
            site_key=site_key,
            sample_url=sample_url,
            final_page_url=final_page_url,
            platform_hint="unknown",
            recommended_method="html_jsonld_fallback",
            recommended_url=final_page_url,
            endpoint_template=final_page_url,
            product_score=0,
            content_type="text/html",
            content_length=None,
            status=200,
            confidence="low",
            html_fallback=True,
            notes="No high-confidence structured product endpoint observed or safely probed.",
        )

    confidence = "high" if best.product_score >= 14 else "medium"
    return SiteRecommendation(
        site_key=site_key,
        sample_url=sample_url,
        final_page_url=final_page_url,
        platform_hint=best.platform_hint,
        recommended_method=method_name(best),
        recommended_url=best.url,
        endpoint_template=endpoint_template(best.url),
        product_score=best.product_score,
        content_type=best.content_type,
        content_length=best.content_length,
        status=best.status,
        confidence=confidence,
        html_fallback=True,
        notes="Structured endpoint preferred; retain existing HTML/JSON-LD parser as fallback until multi-product validation passes.",
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
    if content_type in {"application/json", "application/ld+json", "text/json", "text/javascript", "application/javascript"}:
        try:
            body = response.body()
            if len(body) <= MAX_STRUCTURED_SAMPLE_BYTES:
                body_text = body.decode("utf-8", errors="replace")
                payload = parse_structured_payload(body_text, content_type)
                if content_length is None:
                    content_length = len(body)
        except Exception:
            pass

    hint = platform_hint(headers, response.url, body_text)
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
        product_score=product_score(payload),
        platform_hint=hint,
    )


def probe_direct(context: BrowserContext, site_key: str, page_url: str, url: str, timeout_ms: int) -> NetworkObservation:
    started = time.monotonic()
    try:
        response = context.request.get(url, timeout=timeout_ms, fail_on_status_code=False)
        headers = {str(k).lower(): str(v) for k, v in response.headers.items()}
        content_type = normalize_content_type(headers.get("content-type", ""))
        body = response.body()
        content_length = len(body)
        body_text = body[:MAX_STRUCTURED_SAMPLE_BYTES].decode("utf-8", errors="replace")
        payload = parse_structured_payload(body_text, content_type)
        return NetworkObservation(
            site_key=site_key,
            source="direct_probe",
            method="GET",
            resource_type="probe",
            status=response.status,
            url=redact_url(response.url),
            content_type=content_type,
            content_length=content_length,
            same_origin=same_origin(page_url, response.url),
            structured=payload is not None,
            product_score=product_score(payload),
            platform_hint=platform_hint(headers, response.url, body_text),
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
            product_score=0,
            platform_hint="unknown",
            elapsed_ms=round((time.monotonic() - started) * 1000),
        )


def inspect_site(
    context: BrowserContext,
    site_key: str,
    sample_url: str,
    timeout_ms: int,
    settle_ms: int,
) -> tuple[list[NetworkObservation], SiteRecommendation]:
    page: Page = context.new_page()
    observations: list[NetworkObservation] = []

    def on_response(response: Response) -> None:
        try:
            observations.append(response_observation(site_key, sample_url, response, "browser"))
        except Exception:
            # Network diagnostics must not fail a site because one third-party response
            # has unusual headers/body behavior.
            return

    page.on("response", on_response)
    try:
        page.goto(sample_url, wait_until="domcontentloaded", timeout=timeout_ms)
        page.wait_for_timeout(settle_ms)
        final_url = page.url
        for candidate in direct_probe_candidates(site_key, final_url):
            observations.append(probe_direct(context, site_key, final_url, candidate, timeout_ms))
        recommendation = choose_recommendation(site_key, sample_url, final_url, observations)
        return observations, recommendation
    finally:
        page.close()


def parse_url_overrides(values: Sequence[str]) -> dict[str, str]:
    result: dict[str, str] = {}
    valid_sites = {site.key for site in core.SITES}
    for value in values:
        if "=" not in value:
            raise SystemExit(f"ERROR: --url must use site_key=https://... syntax: {value}")
        site_key, url = value.split("=", 1)
        site_key = site_key.strip()
        url = url.strip()
        if site_key not in valid_sites:
            raise SystemExit(f"ERROR: unknown site key for --url: {site_key}")
        if urlparse(url).scheme not in {"http", "https"}:
            raise SystemExit(f"ERROR: --url requires an http(s) URL: {url}")
        result[site_key] = url
    return result


def write_outputs(
    output_dir: Path,
    observations: Sequence[NetworkObservation],
    recommendations: Sequence[SiteRecommendation],
) -> dict[str, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    network_path = output_dir / "network_observations.csv"
    recommendations_path = output_dir / "site_recommendations.csv"
    report_path = output_dir / "endpoint_probe.json"

    network_fields = list(NetworkObservation.__dataclass_fields__)
    with network_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=network_fields)
        writer.writeheader()
        for item in observations:
            writer.writerow(asdict(item))

    recommendation_fields = list(SiteRecommendation.__dataclass_fields__)
    with recommendations_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=recommendation_fields)
        writer.writeheader()
        for item in recommendations:
            writer.writerow(asdict(item))

    payload = {
        "schema_version": 1,
        "generated_at_epoch": int(time.time()),
        "recommendations": [asdict(item) for item in recommendations],
        "network_observation_count": len(observations),
        "outputs": {
            "network_observations": str(network_path),
            "site_recommendations": str(recommendations_path),
        },
        "security": {
            "request_bodies_persisted": False,
            "response_bodies_persisted": False,
            "cookies_persisted": False,
            "authorization_headers_persisted": False,
            "sensitive_query_values_redacted": True,
        },
    }
    report_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return {
        "network": network_path,
        "recommendations": recommendations_path,
        "report": report_path,
    }


def selected_site_keys(values: Sequence[str] | None) -> list[str]:
    all_keys = [site.key for site in core.SITES]
    return all_keys if not values else [key for key in all_keys if key in set(values)]


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sites", nargs="*", choices=[site.key for site in core.SITES])
    parser.add_argument(
        "--url",
        action="append",
        default=[],
        metavar="SITE_KEY=URL",
        help="Override a representative product URL; may be repeated.",
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--timeout-ms", type=int, default=30_000)
    parser.add_argument("--settle-ms", type=int, default=3_000)
    parser.add_argument("--headed", action="store_true", help="Show Chromium for interactive diagnostics.")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    overrides = parse_url_overrides(args.url)
    site_keys = selected_site_keys(args.sites)

    sample_urls: dict[str, str] = {}
    for site_key in site_keys:
        sample_url = overrides.get(site_key) or DEFAULT_SAMPLE_URLS.get(site_key)
        if not sample_url:
            raise SystemExit(f"ERROR: no representative product URL configured for {site_key}; provide --url")
        sample_urls[site_key] = sample_url

    observations: list[NetworkObservation] = []
    recommendations: list[SiteRecommendation] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not args.headed)
        try:
            for site_key in site_keys:
                context = browser.new_context(
                    locale="en-US",
                    user_agent=core.DEFAULT_USER_AGENT.replace("2.0", "EndpointProbe/1.0"),
                    extra_http_headers={"DNT": "1"},
                )
                try:
                    site_observations, recommendation = inspect_site(
                        context,
                        site_key,
                        sample_urls[site_key],
                        args.timeout_ms,
                        args.settle_ms,
                    )
                    observations.extend(site_observations)
                    recommendations.append(recommendation)
                    print(
                        f"{site_key}: {recommendation.recommended_method} "
                        f"score={recommendation.product_score} url={recommendation.recommended_url}"
                    )
                finally:
                    context.close()
        finally:
            browser.close()

    paths = write_outputs(args.output_dir.resolve(), observations, recommendations)
    print(json.dumps({key: str(path) for key, path in paths.items()}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
