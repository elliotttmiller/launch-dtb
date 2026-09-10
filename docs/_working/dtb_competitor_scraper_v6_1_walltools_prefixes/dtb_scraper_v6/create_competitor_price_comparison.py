#!/usr/bin/env python3
"""Create a source-aware price comparison report from per-site catalog exports."""

from __future__ import annotations

import csv
from collections import defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
OUTPUT_CSV = REPORT_DIR / "competitor_price_comparison_by_sku.csv"

SITES = [
    ("all_wall", "All-Wall"),
    ("als_taping_tools", "Al's Taping Tools"),
    ("wall_tools", "Wall Tools"),
]


def normalize_sku(value: str) -> str:
    return " ".join((value or "").strip().casefold().split())


def parse_price(value: str) -> Decimal | None:
    cleaned = (value or "").strip().replace("$", "").replace(",", "")
    if not cleaned:
        return None
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def money(value: Decimal | None) -> str:
    if value is None:
        return ""
    return f"{value:.2f}"


def main() -> int:
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    display_skus: dict[str, str] = {}

    for site_key, site_label in SITES:
        path = REPORT_DIR / site_key / "catalog.csv"
        with path.open(newline="", encoding="utf-8-sig") as handle:
            for row in csv.DictReader(handle):
                sku = (row.get("SKU") or "").strip()
                key = normalize_sku(sku)
                if not key:
                    continue
                display_skus.setdefault(key, sku)
                row["_source_key"] = site_key
                row["_source_label"] = site_label
                grouped[key].append(row)

    fields = [
        "SKU",
        "Source Count",
        "Sources",
        "Lowest Price",
        "Highest Price",
        "Price Spread",
        "All-Wall Price",
        "All-Wall Brand",
        "All-Wall Product Name",
        "Al's Taping Tools Price",
        "Al's Taping Tools Brand",
        "Al's Taping Tools Product Name",
        "Wall Tools Price",
        "Wall Tools Brand",
        "Wall Tools Product Name",
    ]

    rows: list[dict[str, str]] = []
    for key, records in grouped.items():
        source_labels = sorted({record["_source_label"] for record in records})
        if len(source_labels) < 2:
            continue

        by_site = {record["_source_key"]: record for record in records}
        prices = [parse_price(record.get("Product Price", "")) for record in records]
        prices = [price for price in prices if price is not None]
        low = min(prices) if prices else None
        high = max(prices) if prices else None
        spread = (high - low) if low is not None and high is not None else None

        output = {
            "SKU": display_skus[key],
            "Source Count": str(len(source_labels)),
            "Sources": " | ".join(source_labels),
            "Lowest Price": money(low),
            "Highest Price": money(high),
            "Price Spread": money(spread),
        }

        for site_key, site_label in SITES:
            record = by_site.get(site_key, {})
            output[f"{site_label} Price"] = money(parse_price(record.get("Product Price", "")))
            output[f"{site_label} Brand"] = (record.get("Brand") or "").strip()
            output[f"{site_label} Product Name"] = (record.get("Product Name") or "").strip()

        rows.append(output)

    rows.sort(
        key=lambda row: (
            -Decimal(row["Price Spread"] or "0"),
            row["SKU"].casefold(),
        )
    )

    with OUTPUT_CSV.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} multi-source SKU comparisons to {OUTPUT_CSV}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
