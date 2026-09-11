#!/usr/bin/env python3
"""Filter competitor rows to DTB-held brands without cross-brand SKU contamination."""
from __future__ import annotations

import csv
from collections import Counter, defaultdict
from pathlib import Path

from competitor_pricing_core import (
    CANONICAL_BRAND_LABELS,
    canonical_brand,
    clean_description,
    compact_identifier,
)

ROOT = Path(__file__).resolve().parent
INPUT_CSV = ROOT / "reports" / "competitor-catalog" / "all_competitor_products.csv"
OUTPUT_CSV = ROOT / "reports" / "competitor-catalog" / "current_dtb_brand_competitor_products.csv"
SUMMARY_CSV = ROOT / "reports" / "competitor-catalog" / "current_dtb_brand_filter_summary.csv"
OFFICIAL_RELATIVE = Path("products") / "launch" / "official" / "dtb_official_catalog.csv"
REPO_ROOT = next(path for path in [ROOT, *ROOT.parents] if (path / OFFICIAL_RELATIVE).exists())
OFFICIAL_CATALOG = REPO_ROOT / OFFICIAL_RELATIVE


def official_brand(row: dict[str, str]) -> str:
    return (
        row.get("Brands")
        or row.get("Meta: _dtb_brand_label")
        or row.get("Meta: _dtb_brand")
        or row.get("Meta: schema_brand")
        or ""
    ).strip()


def load_held_identity_index():
    held_brands: set[str] = set()
    identifier_brands: dict[str, set[str]] = defaultdict(set)
    with OFFICIAL_CATALOG.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            brand_key = canonical_brand(official_brand(row), row.get("Name", ""))
            if not brand_key:
                continue
            held_brands.add(brand_key)
            for field in ("SKU", "Meta: schema_mpn", "Meta: _dtb_mpn", "Meta: _dtb_manufacturer_sku"):
                identifier = compact_identifier(row.get(field, ""))
                if identifier:
                    identifier_brands[identifier].add(brand_key)
    return held_brands, identifier_brands


def classify_row(row: dict[str, str], held_brands: set[str], identifier_brands: dict[str, set[str]]):
    title = row.get("Product Name", "")
    brand_key = canonical_brand(row.get("Brand", ""), title)
    sku_key = compact_identifier(row.get("SKU", ""))

    if brand_key and brand_key in held_brands:
        if sku_key and sku_key in identifier_brands and brand_key not in identifier_brands[sku_key]:
            return "", "brand_identifier_conflict", "0.00"
        return brand_key, "canonical_brand_evidence", "1.00"

    # SKU alone cannot establish manufacturer identity. It can only support a
    # brand already established independently from the competitor row.
    if sku_key and sku_key in identifier_brands:
        if len(identifier_brands[sku_key]) == 1:
            return "", "identifier_without_brand_evidence", "0.00"
        return "", "identifier_cross_brand_collision", "0.00"
    return "", "not_current_dtb_brand", "0.00"


def main() -> int:
    held_brands, identifier_brands = load_held_identity_index()
    rows: list[dict[str, str]] = []
    rejected = Counter()
    methods = Counter()

    with INPUT_CSV.open(newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        base_fields = list(reader.fieldnames or [])
        audit_fields = [
            "Matched DTB Brand", "DTB Brand Match Method", "DTB Brand Match Confidence",
            "Description Quality",
        ]
        output_fields = base_fields + audit_fields
        for row in reader:
            brand_key, method, confidence = classify_row(row, held_brands, identifier_brands)
            if not brand_key:
                rejected[method] += 1
                continue
            cleaned_description, description_quality = clean_description(row.get("Product Description", ""))
            row["Product Description"] = cleaned_description
            row["Matched DTB Brand"] = CANONICAL_BRAND_LABELS.get(brand_key, brand_key)
            row["DTB Brand Match Method"] = method
            row["DTB Brand Match Confidence"] = confidence
            row["Description Quality"] = description_quality
            rows.append(row)
            methods[method] += 1

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8-sig") as target:
        writer = csv.DictWriter(target, fieldnames=output_fields)
        writer.writeheader(); writer.writerows(rows)

    by_brand = Counter(row["Matched DTB Brand"] for row in rows)
    with SUMMARY_CSV.open("w", newline="", encoding="utf-8") as target:
        writer = csv.writer(target)
        writer.writerow(["metric", "value", "count"])
        writer.writerow(["output_rows", "all", len(rows)])
        writer.writerow(["rejected_rows", "all", sum(rejected.values())])
        for brand, count in sorted(by_brand.items()):
            writer.writerow(["matched_brand", brand, count])
        for method, count in sorted(methods.items()):
            writer.writerow(["match_method", method, count])
        for reason, count in sorted(rejected.items()):
            writer.writerow(["rejection_reason", reason, count])

    print(f"Wrote {len(rows)} manufacturer-supported DTB-brand competitor rows to {OUTPUT_CSV}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
