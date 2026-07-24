#!/usr/bin/env python3
"""Normalize DTB launch inventory and Sawed Off Taper catalog assets.

This is a local, deterministic, idempotent data-migration script. It modifies only:
- products/launch/official/dtb_woocommerce_official_catalog.csv
- products/launch/official/veeqo_inventory_import.csv
- products/dev/media/Sawed Off Taper/*.webp filenames

It does not modify PHP/React source, create GitHub Actions workflows, call external
APIs, deploy files, or mutate live WooCommerce/Veeqo data.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "products/launch/official/dtb_woocommerce_official_catalog.csv"
VEEQO_PATH = ROOT / "products/launch/official/veeqo_inventory_import.csv"
SAWED_OFF_MEDIA_DIR = ROOT / "products/dev/media/Sawed Off Taper"
MEDIA_BASE_URL = "https://drywalltoolbox.com/wp-content/uploads/2026/media"
SPTAPER_SKU = "SPTAPER"
STAPER_SKU = "STAPER"
SELLABLE_TYPES = {"simple", "variation"}

MEDIA_RENAMES = {
    "TAPER 1.webp": "columbia_tools_staper_01.webp",
    "TAPER 2.webp": "columbia_tools_staper_02.webp",
    "sawedofftaper.webp": "columbia_tools_staper_03.webp",
    "taperhead.webp": "columbia_tools_staper_04.webp",
}
STAPER_IMAGE_URLS = [f"{MEDIA_BASE_URL}/{name}" for name in MEDIA_RENAMES.values()]

CATEGORY_FIXES = {
    "ATX01TT": ("taping", "accessories"),
    "COL-PREDATOR-MATRIX-HANDLE": ("handles", "handles"),
    "COL-PREDATOR-ONE-HANDLE": ("handles", "handles"),
    "PHMP": ("pumps", "pumps"),
    "PCLT42": ("corner-tools", "compound_tubes"),
    "PCMT42": ("corner-tools", "compound_tubes"),
    "4-741": ("corner", "compound_tubes"),
    "5-311": ("taping", "semi_automatic_tapers"),
}


def deterministic_stock(sku: str) -> int:
    digest = hashlib.sha256(sku.encode("utf-8")).digest()
    return 10 + (int.from_bytes(digest[:4], "big") % 91)


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise RuntimeError(f"CSV has no header: {path}")
        return list(reader.fieldnames), list(reader)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="raise", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def parse_decimal(value: str) -> Decimal:
    try:
        return Decimal((value or "").strip() or "0")
    except InvalidOperation:
        return Decimal("0")


def normalize_media(*, dry_run: bool) -> int:
    renamed = 0
    for legacy_name, normalized_name in MEDIA_RENAMES.items():
        legacy = SAWED_OFF_MEDIA_DIR / legacy_name
        normalized = SAWED_OFF_MEDIA_DIR / normalized_name
        if normalized.exists():
            if legacy.exists():
                raise RuntimeError(f"Both legacy and normalized media exist: {legacy} / {normalized}")
            continue
        if not legacy.exists():
            raise RuntimeError(f"Required Sawed Off Taper image is missing: {legacy}")
        renamed += 1
        if not dry_run:
            legacy.rename(normalized)
    return renamed


def normalize_catalog(*, dry_run: bool) -> tuple[dict[str, int], dict[str, int]]:
    fieldnames, rows = read_csv(CATALOG_PATH)
    required = {"Type", "SKU", "In stock?", "Stock", "Images", "Meta: _dtb_category_key", "Meta: _dtb_display_category_key"}
    missing = required.difference(fieldnames)
    if missing:
        raise RuntimeError(f"Woo catalog missing required columns: {sorted(missing)}")

    output: list[dict[str, str]] = []
    stock_by_sku: dict[str, int] = {}
    stats = {"sellable_stocked": 0, "removed_sptaper": 0, "category_fixed": 0}
    staper_count = 0

    for row in rows:
        sku = (row.get("SKU") or "").strip()
        product_type = (row.get("Type") or "").strip().lower()

        if sku == SPTAPER_SKU:
            stats["removed_sptaper"] += 1
            continue

        if product_type in SELLABLE_TYPES:
            if not sku:
                raise RuntimeError(f"Sellable Woo row is missing SKU: {row.get('Name', '')}")
            qty = deterministic_stock(sku)
            row["In stock?"] = "1"
            row["Stock"] = str(qty)
            stock_by_sku[sku] = qty
            stats["sellable_stocked"] += 1

        if sku == STAPER_SKU:
            staper_count += 1
            row["Images"] = ", ".join(STAPER_IMAGE_URLS)
            if "Meta: _dtb_inherit_parent_image" in row:
                row["Meta: _dtb_inherit_parent_image"] = "0"

        if sku in CATEGORY_FIXES:
            category_key, display_key = CATEGORY_FIXES[sku]
            if row.get("Meta: _dtb_category_key") != category_key or row.get("Meta: _dtb_display_category_key") != display_key:
                stats["category_fixed"] += 1
            row["Meta: _dtb_category_key"] = category_key
            row["Meta: _dtb_display_category_key"] = display_key

        output.append(row)

    if staper_count != 1:
        raise RuntimeError(f"Expected exactly one STAPER variation, found {staper_count}")
    if any((row.get("SKU") or "").strip() == SPTAPER_SKU for row in output):
        raise RuntimeError("SPTAPER removal validation failed")

    if not dry_run:
        write_csv(CATALOG_PATH, fieldnames, output)
    return stock_by_sku, stats


def normalize_veeqo(stock_by_sku: dict[str, int], *, dry_run: bool) -> dict[str, int]:
    fieldnames, rows = read_csv(VEEQO_PATH)
    required = {"sku_code", "qty_on_hand", "total_qty", "total_stock_value", "sales_price", "cost_price", "image_url"}
    missing = required.difference(fieldnames)
    if missing:
        raise RuntimeError(f"Veeqo import missing required columns: {sorted(missing)}")

    output: list[dict[str, str]] = []
    stats = {"rows_stocked": 0, "removed_sptaper": 0}

    for row in rows:
        sku = (row.get("sku_code") or "").strip()
        if not sku:
            raise RuntimeError("Veeqo import contains a row with an empty sku_code")
        if sku == SPTAPER_SKU:
            stats["removed_sptaper"] += 1
            continue

        qty = stock_by_sku.get(sku, deterministic_stock(sku))
        row["qty_on_hand"] = str(qty)
        row["total_qty"] = str(qty)
        cost = parse_decimal(row.get("cost_price", ""))
        sales = parse_decimal(row.get("sales_price", ""))
        unit_value = cost if cost > 0 else sales
        row["total_stock_value"] = f"{unit_value * Decimal(qty):.2f}"
        if sku == STAPER_SKU:
            row["image_url"] = STAPER_IMAGE_URLS[0]
        stats["rows_stocked"] += 1
        output.append(row)

    if not dry_run:
        write_csv(VEEQO_PATH, fieldnames, output)
    return stats


def verify_written_state(*, dry_run: bool) -> None:
    if dry_run:
        return
    for legacy_name, normalized_name in MEDIA_RENAMES.items():
        if (SAWED_OFF_MEDIA_DIR / legacy_name).exists():
            raise RuntimeError(f"Legacy media filename remains: {legacy_name}")
        if not (SAWED_OFF_MEDIA_DIR / normalized_name).is_file():
            raise RuntimeError(f"Normalized media file missing: {normalized_name}")

    _, catalog_rows = read_csv(CATALOG_PATH)
    staper_rows = [row for row in catalog_rows if (row.get("SKU") or "").strip() == STAPER_SKU]
    if len(staper_rows) != 1:
        raise RuntimeError(f"Expected exactly one STAPER row after write, found {len(staper_rows)}")
    gallery = [part.strip() for part in staper_rows[0]["Images"].split(",") if part.strip()]
    if gallery != STAPER_IMAGE_URLS:
        raise RuntimeError(f"STAPER gallery mismatch: {gallery}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Validate intended changes without writing files.")
    args = parser.parse_args()

    renamed = normalize_media(dry_run=args.dry_run)
    stock_by_sku, catalog_stats = normalize_catalog(dry_run=args.dry_run)
    veeqo_stats = normalize_veeqo(stock_by_sku, dry_run=args.dry_run)
    verify_written_state(dry_run=args.dry_run)

    mode = "DRY RUN" if args.dry_run else "UPDATED"
    print(f"[{mode}] Woo sellable SKUs stocked: {catalog_stats['sellable_stocked']}")
    print(f"[{mode}] Woo SPTAPER rows removed: {catalog_stats['removed_sptaper']}")
    print(f"[{mode}] Woo category rows corrected: {catalog_stats['category_fixed']}")
    print(f"[{mode}] Veeqo rows stocked: {veeqo_stats['rows_stocked']}")
    print(f"[{mode}] Veeqo SPTAPER rows removed: {veeqo_stats['removed_sptaper']}")
    print(f"[{mode}] Sawed Off Taper media files renamed: {renamed}")
    print(f"[{mode}] STAPER gallery: {', '.join(STAPER_IMAGE_URLS)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
