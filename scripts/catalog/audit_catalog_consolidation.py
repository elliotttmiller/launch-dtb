#!/usr/bin/env python3
"""Audit DTB official catalog consolidation and navigation taxonomy without mutating data.

This tool compares the canonical commerce catalog with the legacy content/SEO
catalog and inventories every current WooCommerce product_cat path plus DTB
taxonomy metadata. It is intentionally read-only.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MAIN = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_SEO = ROOT / "products" / "launch" / "official" / "dtb_official_catalog_content_seo.csv"
DEFAULT_OUTPUT = ROOT / "products" / "dev" / "catalog-consolidation"

PROTECTED_FIELDS = (
    "Type",
    "SKU",
    "GTIN, UPC, EAN, or ISBN",
    "Name",
    "Brands",
    "Meta: schema_brand",
    "Meta: schema_mpn",
    "Meta: _dtb_manufacturer_sku",
    "Meta: _dtb_mpn",
    "Meta: _dtb_brand_key",
    "Meta: _dtb_product_kind",
    "Meta: _dtb_parent_product_sku",
    "Meta: _dtb_variation_axis",
    "Meta: _dtb_variation_value",
    "Meta: _dtb_default_variation_sku",
    "Meta: _dtb_schematic_id",
    "Slug",
)
CONTENT_FIELDS = (
    "Short description",
    "Description",
    "Meta: _dtb_seo_title",
    "Meta: _dtb_seo_description",
    "Meta: _dtb_seo_focus_kw",
    "Meta: _dtb_seo_canonical",
    "Meta: _dtb_seo_noindex",
)
TAXONOMY_FIELDS = (
    "Categories",
    "Meta: _dtb_category_key",
    "Meta: _dtb_display_category_key",
)

CANONICAL_ROOTS = {"Drywall Finishing Tools", "Stilts & Accessories"}
CANONICAL_GROUPS = {
    "Drywall Finishing Tools": {"Automatic Taping Tools", "Semi-Automatic Taping Tools", "Parts"},
    "Stilts & Accessories": {"Stilts", "Accessories", "Parts"},
}


def clean(value: object) -> str:
    return str(value or "").strip()


def read_catalog(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def by_sku(rows: list[dict[str, str]]) -> tuple[dict[str, dict[str, str]], list[str]]:
    result: dict[str, dict[str, str]] = {}
    duplicates: list[str] = []
    for row in rows:
        sku = clean(row.get("SKU")).upper()
        if not sku:
            continue
        if sku in result:
            duplicates.append(sku)
        else:
            result[sku] = row
    return result, sorted(set(duplicates))


def category_segments(raw: str) -> list[str]:
    return [clean(part) for part in raw.split(">") if clean(part)]


def category_shape(raw: str) -> str:
    parts = category_segments(raw)
    if not parts:
        return "blank"
    if parts[0] not in CANONICAL_ROOTS:
        return "invalid_root"
    if len(parts) == 1:
        return "root_only"
    if parts[1] not in CANONICAL_GROUPS.get(parts[0], set()):
        return "invalid_group"
    if parts[1] == "Parts":
        return "parts"
    if len(parts) >= 3:
        return "leaf"
    return "group_only"


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--main-catalog", type=Path, default=DEFAULT_MAIN)
    parser.add_argument("--seo-catalog", type=Path, default=DEFAULT_SEO)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    main_headers, main_rows = read_catalog(args.main_catalog.resolve())
    seo_headers, seo_rows = read_catalog(args.seo_catalog.resolve())
    main_map, main_dupes = by_sku(main_rows)
    seo_map, seo_dupes = by_sku(seo_rows)

    common_skus = sorted(set(main_map) & set(seo_map))
    main_only = sorted(set(main_map) - set(seo_map))
    seo_only = sorted(set(seo_map) - set(main_map))

    protected_conflicts: list[dict[str, object]] = []
    content_differences = Counter()
    taxonomy_differences = Counter()

    for sku in common_skus:
        left, right = main_map[sku], seo_map[sku]
        for field in PROTECTED_FIELDS:
            if field not in main_headers or field not in seo_headers:
                continue
            lv, rv = clean(left.get(field)), clean(right.get(field))
            if lv != rv:
                protected_conflicts.append({
                    "sku": sku, "field": field, "main_value": lv, "seo_value": rv
                })
        for field in CONTENT_FIELDS:
            if field in main_headers and field in seo_headers and clean(left.get(field)) != clean(right.get(field)):
                content_differences[field] += 1
        for field in TAXONOMY_FIELDS:
            if field in main_headers and field in seo_headers and clean(left.get(field)) != clean(right.get(field)):
                taxonomy_differences[field] += 1

    matrix = Counter()
    brands_by_path: dict[tuple[str, str, str, str], set[str]] = defaultdict(set)
    path_shape = Counter()
    variation_mismatches: list[dict[str, object]] = []
    blank_taxonomy: list[str] = []

    for row in main_rows:
        sku = clean(row.get("SKU"))
        path = clean(row.get("Categories"))
        category_key = clean(row.get("Meta: _dtb_category_key"))
        display_key = clean(row.get("Meta: _dtb_display_category_key"))
        kind = clean(row.get("Meta: _dtb_product_kind"))
        type_ = clean(row.get("Type"))
        brand = clean(row.get("Brands"))
        key = (path, category_key, display_key, kind)
        matrix[key] += 1
        brands_by_path[key].add(brand)
        path_shape[category_shape(path)] += 1
        if not path or not category_key or not display_key:
            blank_taxonomy.append(sku)

        if type_ == "variation":
            parent_sku = clean(row.get("Meta: _dtb_parent_product_sku") or row.get("Parent")).upper()
            parent = main_map.get(parent_sku)
            if parent:
                mismatched_fields = []
                for field in TAXONOMY_FIELDS:
                    if clean(row.get(field)) != clean(parent.get(field)):
                        mismatched_fields.append(field)
                if mismatched_fields:
                    variation_mismatches.append({
                        "sku": sku,
                        "parent_sku": parent_sku,
                        "fields": "|".join(mismatched_fields),
                        "child_categories": path,
                        "parent_categories": clean(parent.get("Categories")),
                        "child_category_key": category_key,
                        "parent_category_key": clean(parent.get("Meta: _dtb_category_key")),
                        "child_display_key": display_key,
                        "parent_display_key": clean(parent.get("Meta: _dtb_display_category_key")),
                    })

    category_rows: list[dict[str, object]] = []
    for (path, category_key, display_key, kind), count in sorted(matrix.items()):
        segments = category_segments(path)
        category_rows.append({
            "categories": path,
            "root": segments[0] if segments else "",
            "group": segments[1] if len(segments) > 1 else "",
            "leaf": segments[-1] if len(segments) > 2 else "",
            "shape": category_shape(path),
            "category_key": category_key,
            "display_category_key": display_key,
            "product_kind": kind,
            "rows": count,
            "brands": "|".join(sorted(v for v in brands_by_path[(path, category_key, display_key, kind)] if v)),
        })

    output = args.output_dir.resolve()
    output.mkdir(parents=True, exist_ok=True)
    write_csv(
        output / "category-matrix.csv",
        category_rows,
        ["categories", "root", "group", "leaf", "shape", "category_key", "display_category_key", "product_kind", "rows", "brands"],
    )
    write_csv(
        output / "protected-conflicts.csv",
        protected_conflicts,
        ["sku", "field", "main_value", "seo_value"],
    )
    write_csv(
        output / "variation-taxonomy-mismatches.csv",
        variation_mismatches,
        ["sku", "parent_sku", "fields", "child_categories", "parent_categories",
         "child_category_key", "parent_category_key", "child_display_key", "parent_display_key"],
    )

    summary = {
        "schema_version": 1,
        "mutates_catalog": False,
        "main": {
            "rows": len(main_rows),
            "columns": len(main_headers),
            "duplicate_skus": main_dupes,
        },
        "seo": {
            "rows": len(seo_rows),
            "columns": len(seo_headers),
            "duplicate_skus": seo_dupes,
        },
        "sku_sets": {
            "common": len(common_skus),
            "main_only": len(main_only),
            "seo_only": len(seo_only),
            "main_only_sample": main_only[:25],
            "seo_only_sample": seo_only[:25],
        },
        "protected_conflicts": {
            "rows": len(protected_conflicts),
            "unique_skus": len({r["sku"] for r in protected_conflicts}),
            "by_field": dict(sorted(Counter(str(r["field"]) for r in protected_conflicts).items())),
        },
        "content_differences": dict(sorted(content_differences.items())),
        "taxonomy_differences": dict(sorted(taxonomy_differences.items())),
        "taxonomy": {
            "distinct_combinations": len(category_rows),
            "path_shape": dict(sorted(path_shape.items())),
            "blank_taxonomy_rows": len(blank_taxonomy),
            "blank_taxonomy_sample": blank_taxonomy[:25],
            "variation_mismatch_rows": len(variation_mismatches),
        },
        "outputs": {
            "category_matrix": "products/dev/catalog-consolidation/category-matrix.csv",
            "protected_conflicts": "products/dev/catalog-consolidation/protected-conflicts.csv",
            "variation_taxonomy_mismatches": "products/dev/catalog-consolidation/variation-taxonomy-mismatches.csv",
        },
    }
    (output / "audit-summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
