#!/usr/bin/env python3
"""Create manufacturer-scoped cross-competitor observed-price comparisons.

This report never groups on SKU alone and never averages or median-collapses
prices. Each retailer is resolved independently. A market price exists only when
multiple verified retailer observations for the same manufacturer identity expose
the exact same price. Any disagreement remains an explicit conflict.
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
    market_price_decision,
    money,
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
    prices = tuple(
        price for price in (decimal_price(row.get("Product Price", "")) for row in rows)
        if price is not None
    )
    names = sorted({
        (row.get("Product Name") or "").strip()
        for row in rows
        if (row.get("Product Name") or "").strip()
    })
    distinct = sorted(set(prices))

    if not prices:
        resolved_price = None
        quality = "missing_price"
    elif len(distinct) > 1:
        resolved_price = None
        quality = "conflicting_duplicate_prices"
    else:
        resolved_price = distinct[0]
        quality = "single_observation" if len(rows) == 1 else "duplicate_same_price"

    return {
        "price": money(resolved_price),
        "duplicate_count": str(max(0, len(rows) - 1)),
        "observed_prices": " | ".join(money(price) for price in prices),
        "product": " | ".join(names[:3]),
        "quality": quality,
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
        "Identity Key",
        "Canonical Brand",
        "Canonical Identifier",
        "Source Count",
        "Observation Count",
        "Verified Price Source Count",
        "Distinct Verified Prices",
        "Market Price Status",
        "Market Price",
        "Observed Price Spread",
    ]
    for site_key in SITE_KEYS:
        label = SITE_LABELS[site_key]
        fields.extend([
            f"{label} Price",
            f"{label} Duplicate Count",
            f"{label} Observed Duplicate Prices",
            f"{label} Evidence Quality",
            f"{label} Product Name",
        ])

    output_rows: list[dict[str, str]] = []
    for key, records in grouped.items():
        by_site: dict[str, list[dict[str, str]]] = defaultdict(list)
        for record in records:
            by_site[record["_site_key"]].append(record)
        if len(by_site) < 2:
            continue

        site_resolved = {site: resolve_site(rows) for site, rows in by_site.items()}
        verified_site_prices = [
            price for price in (
                decimal_price(resolved.get("price", ""))
                for resolved in site_resolved.values()
            )
            if price is not None
        ]
        has_site_conflict = any(
            resolved.get("quality", "").startswith("conflicting_")
            for resolved in site_resolved.values()
        )
        market = market_price_decision(verified_site_prices, has_conflict=has_site_conflict)
        first = records[0]
        row = {
            "Identity Key": key,
            "Canonical Brand": canonical_brand_label(first["_brand_key"]) or first["_brand_key"],
            "Canonical Identifier": first.get("SKU", ""),
            "Source Count": str(len(by_site)),
            "Observation Count": str(len(records)),
            "Verified Price Source Count": str(market.verified_source_count),
            "Distinct Verified Prices": str(market.distinct_price_count),
            "Market Price Status": market.status,
            "Market Price": money(market.market_price),
            "Observed Price Spread": money(market.price_spread),
        }
        for site_key in SITE_KEYS:
            label = SITE_LABELS[site_key]
            resolved = site_resolved.get(site_key, {})
            row[f"{label} Price"] = resolved.get("price", "")
            row[f"{label} Duplicate Count"] = resolved.get("duplicate_count", "0")
            row[f"{label} Observed Duplicate Prices"] = resolved.get("observed_prices", "")
            row[f"{label} Evidence Quality"] = resolved.get("quality", "")
            row[f"{label} Product Name"] = resolved.get("product", "")
        output_rows.append(row)

    status_priority = {
        "MARKET_PRICE_CONFLICT": 0,
        "MARKET_PRICE_SINGLE_SOURCE": 1,
        "MARKET_PRICE_VERIFIED_2_OF_3": 2,
        "MARKET_PRICE_VERIFIED_3_OF_3": 3,
        "NO_MARKET_EVIDENCE": 4,
    }
    output_rows.sort(key=lambda row: (
        status_priority.get(row["Market Price Status"], 9),
        -(decimal_price(row["Observed Price Spread"]) or 0),
        row["Canonical Brand"].casefold(),
        row["Canonical Identifier"].casefold(),
    ))

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(output_rows)

    review_fields = ["Competitor", "Brand", "Product Name", "SKU", "Product Price", "Reason"]
    with OUTPUT_REVIEW.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=review_fields)
        writer.writeheader()
        writer.writerows(review_rows)

    verified_3 = sum(1 for row in output_rows if row["Market Price Status"] == "MARKET_PRICE_VERIFIED_3_OF_3")
    verified_2 = sum(1 for row in output_rows if row["Market Price Status"] == "MARKET_PRICE_VERIFIED_2_OF_3")
    conflicts = sum(1 for row in output_rows if row["Market Price Status"] == "MARKET_PRICE_CONFLICT")
    print(f"Wrote {len(output_rows)} manufacturer-scoped multi-source comparisons to {OUTPUT_CSV}")
    print(f"Verified market prices: 3/3={verified_3}; 2/3={verified_2}; conflicts={conflicts}")
    print(f"Wrote {len(review_rows)} unscoped rows to {OUTPUT_REVIEW}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
