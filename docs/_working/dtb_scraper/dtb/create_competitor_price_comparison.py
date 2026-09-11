#!/usr/bin/env python3
"""Create manufacturer-scoped cross-competitor price comparisons.

Unlike the legacy report, this script never groups on SKU alone. Records are
compared only when canonical manufacturer/brand and canonical identifier agree.
Same-site duplicates are retained, audited, and deterministically collapsed to a
median site price instead of being overwritten by dictionary iteration order.
"""
from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

from competitor_pricing_core import (
    SITE_KEYS,
    SITE_LABELS,
    canonical_brand,
    canonical_brand_label,
    clean_description,
    compact_identifier,
    decimal_price,
    identity_key,
    median_decimal,
    money,
    price_consensus,
)

ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
OUTPUT_CSV = REPORT_DIR / "competitor_price_comparison_by_sku.csv"
OUTPUT_REVIEW = REPORT_DIR / "competitor_price_comparison_review.csv"


def load_rows():
    for site_key in SITE_KEYS:
        path = REPORT_DIR / site_key / "catalog.csv"
        with path.open(newline="", encoding="utf-8-sig") as handle:
            for index, row in enumerate(csv.DictReader(handle), start=1):
                title = (row.get("Product Name") or "").strip()
                identifier = (row.get("SKU") or "").strip()
                brand_key = canonical_brand(row.get("Brand", ""), title)
                description, description_quality = clean_description(row.get("Product Description", ""))
                yield {
                    **row,
                    "_site_key": site_key,
                    "_site_label": SITE_LABELS[site_key],
                    "_row": str(index),
                    "_brand_key": brand_key,
                    "_identifier_key": compact_identifier(identifier),
                    "_identity_key": identity_key(brand_key, identifier),
                    "_description": description,
                    "_description_quality": description_quality,
                }


def resolve_site(rows: list[dict[str, str]]) -> dict[str, str]:
    prices = [decimal_price(row.get("Product Price", "")) for row in rows]
    prices = [price for price in prices if price is not None]
    names = sorted({(row.get("Product Name") or "").strip() for row in rows if (row.get("Product Name") or "").strip()})
    return {
        "price": money(median_decimal(prices)),
        "price_low": money(min(prices) if prices else None),
        "price_high": money(max(prices) if prices else None),
        "duplicate_count": str(max(0, len(rows) - 1)),
        "product": " | ".join(names[:3]),
        "quality": "single_observation" if len(rows) == 1 else "duplicate_collapsed_median",
    }


def main() -> int:
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    review_rows: list[dict[str, str]] = []
    for row in load_rows():
        if not row["_brand_key"] or not row["_identifier_key"]:
            review_rows.append({
                "Competitor": row["_site_label"],
                "Brand": row.get("Brand", ""),
                "Product Name": row.get("Product Name", ""),
                "SKU": row.get("SKU", ""),
                "Product Price": row.get("Product Price", ""),
                "Reason": "canonical_brand_unknown" if not row["_brand_key"] else "identifier_missing",
            })
            continue
        grouped[row["_identity_key"]].append(row)

    fields = [
        "Identity Key", "Canonical Brand", "Canonical Identifier", "Source Count",
        "Observation Count", "Distinct Price Count", "Price Consensus", "Consensus Price",
        "Lowest Price", "Highest Price", "Median Price", "Price Spread",
    ]
    for site_key in SITE_KEYS:
        label = SITE_LABELS[site_key]
        fields.extend([
            f"{label} Price", f"{label} Price Low", f"{label} Price High",
            f"{label} Duplicate Count", f"{label} Evidence Quality", f"{label} Product Name",
        ])

    output_rows: list[dict[str, str]] = []
    for key, records in grouped.items():
        by_site: dict[str, list[dict[str, str]]] = defaultdict(list)
        for record in records:
            by_site[record["_site_key"]].append(record)
        if len(by_site) < 2:
            continue
        site_resolved = {site: resolve_site(rows) for site, rows in by_site.items()}
        site_prices = [decimal_price(value["price"]) for value in site_resolved.values()]
        site_prices = [price for price in site_prices if price is not None]
        consensus = price_consensus(site_prices)
        first = records[0]
        row = {
            "Identity Key": key,
            "Canonical Brand": canonical_brand_label(first["_brand_key"]) or first["_brand_key"],
            "Canonical Identifier": first.get("SKU", ""),
            "Source Count": str(len(by_site)),
            "Observation Count": str(len(records)),
            "Distinct Price Count": str(consensus.distinct_price_count),
            "Price Consensus": consensus.status,
            "Consensus Price": money(consensus.consensus_price),
            "Lowest Price": money(consensus.low),
            "Highest Price": money(consensus.high),
            "Median Price": money(consensus.median),
            "Price Spread": money(consensus.spread),
        }
        for site_key in SITE_KEYS:
            label = SITE_LABELS[site_key]
            resolved = site_resolved.get(site_key, {})
            row[f"{label} Price"] = resolved.get("price", "")
            row[f"{label} Price Low"] = resolved.get("price_low", "")
            row[f"{label} Price High"] = resolved.get("price_high", "")
            row[f"{label} Duplicate Count"] = resolved.get("duplicate_count", "0")
            row[f"{label} Evidence Quality"] = resolved.get("quality", "")
            row[f"{label} Product Name"] = resolved.get("product", "")
        output_rows.append(row)

    output_rows.sort(key=lambda row: (
        0 if row["Price Consensus"] == "price_dispersion" else 1,
        -(decimal_price(row["Price Spread"]) or 0),
        row["Canonical Brand"].casefold(), row["Canonical Identifier"].casefold(),
    ))
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader(); writer.writerows(output_rows)

    review_fields = ["Competitor", "Brand", "Product Name", "SKU", "Product Price", "Reason"]
    with OUTPUT_REVIEW.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=review_fields)
        writer.writeheader(); writer.writerows(review_rows)

    exact_consensus = sum(1 for row in output_rows if row["Price Consensus"] == "exact_price_consensus")
    dispersion = sum(1 for row in output_rows if row["Price Consensus"] == "price_dispersion")
    print(f"Wrote {len(output_rows)} manufacturer-scoped multi-source comparisons to {OUTPUT_CSV}")
    print(f"Observed exact price consensus: {exact_consensus}; price dispersion: {dispersion}")
    print(f"Wrote {len(review_rows)} unscoped rows to {OUTPUT_REVIEW}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
