#!/usr/bin/env python3
"""Finalize scrape diagnostics without mutating raw business catalog files.

Responsibilities:
- reclassify obvious non-product discovery candidates separately from true failures;
- produce description-quality diagnostics and quarantine fingerprints downstream;
- retain All-Wall no-MPN products as a separate manual-pricing evidence set;
- enrich run_summary.json with quality telemetry.

The five-column per-site catalog CSVs remain unchanged as raw scrape evidence.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

from competitor_pricing_core import BRAND_ALIASES, clean_description

GENERIC_SLUGS = {
    "about", "about-us", "account", "address-book", "brands", "brand", "buy-again",
    "cart", "checkout", "closeouts", "contact", "contact-us", "dashboard", "faqs",
    "finishing-tools", "finishing-hanging-tools", "jobsite-equipment", "most-popular-manufacturers",
    "privacy-policy", "returns", "search", "shipping", "terms", "terms-and-conditions",
    "automatic-taping-tools", "drywall-sanding", "drywall-dust-control-containment",
}
BRAND_SLUGS = {
    re.sub(r"[^a-z0-9]+", "-", alias).strip("-")
    for alias in BRAND_ALIASES
}
BRAND_SLUGS |= {"dewalt", "graco", "festool", "kraft", "marshalltown", "porter-cable", "trim-tex", "ames"}


def read_jsonl(path: Path):
    if not path.exists():
        return []
    rows = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def write_jsonl(path: Path, rows) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")


def likely_non_product_candidate(row: dict) -> tuple[bool, str]:
    url = str(row.get("url") or "")
    parsed = urlparse(url)
    path = parsed.path.strip("/").casefold()
    segments = [segment for segment in path.split("/") if segment]
    slug = segments[-1] if segments else ""
    error = str(row.get("error") or "").casefold()
    error_type = str(row.get("error_type") or "").casefold()

    if path.startswith("api/"):
        return True, "api_endpoint_not_product"
    if slug in GENERIC_SLUGS:
        return True, "known_non_product_route"
    if slug in BRAND_SLUGS and ("identifier" in error or "title" in error):
        return True, "brand_landing_page"
    if any(token in f"/{path}/" for token in ("/category/", "/categories/", "/brands/", "/pages/")):
        return True, "category_or_content_route"
    if error_type == "valueerror" and "no authoritative product identifier" in error:
        return False, "identifier_extraction_failure"
    return False, ""


def build_manual_all_wall_evidence(output_dir: Path, refresh: bool) -> int:
    target = output_dir / "all_wall" / "manual_pricing_evidence.csv"
    fields = ["Brand", "Product Name", "Store SKU", "Product Price", "Product Description", "Product URL", "Evidence Status"]
    rows: list[dict[str, str]] = []

    for failure in read_jsonl(output_dir / "all_wall" / "failures.jsonl"):
        if failure.get("error_type") == "no_mpn":
            rows.append({
                "Brand": "", "Product Name": "", "Store SKU": "", "Product Price": "",
                "Product Description": "", "Product URL": str(failure.get("url") or ""),
                "Evidence Status": "missing_mpn_requires_manual_identity",
            })

    if refresh:
        import cloudscraper
        from competitor_catalog_scraper import SITES, record_from_suitecommerce_item

        site = SITES["all_wall"]
        endpoint = site.base_url.rstrip("/") + "/api/cacheable/items"
        scraper = cloudscraper.create_scraper(browser={"browser": "chrome", "platform": "windows", "mobile": False})
        offset = 0
        limit = 100
        refreshed: list[dict[str, str]] = []
        while True:
            url = f"{endpoint}?fieldset=details&limit={limit}&offset={offset}"
            response = scraper.get(url, timeout=20)
            response.raise_for_status()
            payload = response.json()
            items = payload.get("items") if isinstance(payload, dict) else None
            if not isinstance(items, list) or not items:
                break
            for item in items:
                if not isinstance(item, dict):
                    continue
                record = record_from_suitecommerce_item(site, endpoint, item)
                price = record.sale_price or record.price or record.regular_price
                if record.title and price and not record.mpn:
                    cleaned, _quality = clean_description(record.description)
                    refreshed.append({
                        "Brand": record.brand,
                        "Product Name": record.title,
                        "Store SKU": record.sku,
                        "Product Price": price,
                        "Product Description": cleaned,
                        "Product URL": record.url,
                        "Evidence Status": "manual_only_missing_mpn",
                    })
            offset += len(items)
            total = payload.get("total") if isinstance(payload, dict) else None
            if len(items) < limit or (isinstance(total, int) and offset >= total):
                break
        if refreshed:
            rows = refreshed

    deduped: dict[tuple[str, str], dict[str, str]] = {}
    for row in rows:
        key = (row["Product URL"].casefold(), row["Store SKU"].casefold())
        prior = deduped.get(key)
        if prior is None or (not prior["Product Price"] and row["Product Price"]):
            deduped[key] = row
    final_rows = sorted(deduped.values(), key=lambda r: (r["Brand"].casefold(), r["Product Name"].casefold(), r["Product URL"]))
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader(); writer.writerows(final_rows)
    return len(final_rows)


def process_site(output_dir: Path, site_key: str) -> dict[str, int]:
    site_dir = output_dir / site_key
    failures = read_jsonl(site_dir / "failures.jsonl")
    non_products = []
    product_failures = []
    reasons = Counter()
    for row in failures:
        is_non_product, reason = likely_non_product_candidate(row)
        enriched = dict(row)
        enriched["classification"] = "non_product_candidate" if is_non_product else "product_failure"
        enriched["classification_reason"] = reason or "runtime_or_extraction_failure"
        reasons[enriched["classification_reason"]] += 1
        (non_products if is_non_product else product_failures).append(enriched)
    write_jsonl(site_dir / "non_product_candidates.jsonl", non_products)
    write_jsonl(site_dir / "product_failures.jsonl", product_failures)

    quality_rows = []
    quality = Counter()
    catalog = site_dir / "catalog.csv"
    if catalog.exists():
        with catalog.open(newline="", encoding="utf-8-sig") as handle:
            for row in csv.DictReader(handle):
                _cleaned, description_quality = clean_description(row.get("Product Description", ""))
                quality[description_quality] += 1
                quality_rows.append({
                    "competitor": site_key,
                    "sku": row.get("SKU", ""),
                    "description_quality": description_quality,
                })
    write_jsonl(site_dir / "catalog_quality.jsonl", quality_rows)

    summary = {
        "legacy_failure_rows": len(failures),
        "non_product_candidates": len(non_products),
        "product_failures": len(product_failures),
        "description_product_specific": quality["product_specific"],
        "description_quarantined": quality["quarantined_storefront_boilerplate"],
        "description_missing": quality["missing"],
        "description_low_information": quality["low_information"],
    }
    (site_dir / "quality_summary.json").write_text(json.dumps({**summary, "classification_reasons": dict(reasons)}, indent=2), encoding="utf-8")
    return summary


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=Path("reports/competitor-catalog"))
    parser.add_argument("--refresh-all-wall-manual-evidence", action="store_true")
    args = parser.parse_args(argv)

    site_summaries = {site: process_site(args.output_dir, site) for site in ("als_taping_tools", "wall_tools", "all_wall")}
    manual_count = build_manual_all_wall_evidence(args.output_dir, args.refresh_all_wall_manual_evidence)

    run_summary_path = args.output_dir / "run_summary.json"
    run_summary = {}
    if run_summary_path.exists():
        try:
            run_summary = json.loads(run_summary_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            run_summary = {}
    run_summary["quality"] = {
        "sites": site_summaries,
        "all_wall_manual_pricing_evidence": manual_count,
        "note": "non_product_candidates are excluded from true product-failure counts; manual All-Wall evidence is never auto-matched without MPN",
    }
    run_summary_path.write_text(json.dumps(run_summary, indent=2), encoding="utf-8")
    print(json.dumps(run_summary["quality"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
