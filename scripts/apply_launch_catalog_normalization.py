#!/usr/bin/env python3
"""Apply the reviewed launch-catalog stock, taxonomy, and Sawed-Off Taper changes.

This script is intentionally deterministic and idempotent. It operates only on the
launch catalog/import assets and the two catalog-filter source files identified by
the production audit.
"""

from __future__ import annotations

import csv
import hashlib
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "products/launch/official/dtb_woocommerce_official_catalog.csv"
VEEQO = ROOT / "products/launch/official/veeqo_inventory_import.csv"
MEDIA_DIR = ROOT / "products/dev/media/Sawed Off Taper"
CATEGORY_NORMALIZER = ROOT / "drywalltoolbox/wp/wp-content/mu-plugins/dtb-catalog-platform/Services/CategoryNormalizer.php"
CATALOG_CACHE = ROOT / "frontend/src/services/catalogPlatformCache.js"
MEDIA_BASE_URL = "https://drywalltoolbox.com/wp-content/uploads/2026/media"

MEDIA_RENAMES = {
    "TAPER 1.webp": "columbia_tools_staper_01.webp",
    "TAPER 2.webp": "columbia_tools_staper_02.webp",
    "sawedofftaper.webp": "columbia_tools_staper_03.webp",
    "taperhead.webp": "columbia_tools_staper_04.webp",
}

STAPER_URLS = [f"{MEDIA_BASE_URL}/{name}" for name in MEDIA_RENAMES.values()]

# Functional storefront category corrections. Predator Family remains a product
# family/tag concept; functional display categories must drive category filters.
CATEGORY_FIXES = {
    "PTAPER": ("automatic-tapers", "automatic_tapers"),
    "PHMP": ("pumps", "pumps"),
    "COL-PREDATOR-MATRIX-HANDLE": ("handles", "handles"),
    "COL-PREDATOR-ONE-HANDLE": ("handles", "handles"),
    "PCLT42": ("corner-tools", "compound_tubes"),
    "PCMT42": ("corner-tools", "compound_tubes"),
    "4-741": ("corner", "compound_tubes"),
    "4-772": ("corner", "compound_tubes"),
    "5-311": ("taping", "semi_automatic_tapers"),
    "ATX01TT": ("taping", "accessories"),
}


def deterministic_stock(sku: str) -> int:
    """Return a stable pseudo-random launch quantity in the inclusive 10..100 range."""
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


def normalize_media() -> None:
    for source_name, target_name in MEDIA_RENAMES.items():
        source = MEDIA_DIR / source_name
        target = MEDIA_DIR / target_name
        if target.exists():
            if source.exists() and source.resolve() != target.resolve():
                raise RuntimeError(f"Both source and normalized media exist: {source} / {target}")
            continue
        if not source.exists():
            raise RuntimeError(f"Expected Sawed Off Taper media is missing: {source}")
        source.rename(target)


def normalize_catalog() -> dict[str, int]:
    fieldnames, rows = read_csv(CATALOG)
    required = {"Type", "SKU", "In stock?", "Stock", "Images", "Meta: _dtb_category_key", "Meta: _dtb_display_category_key"}
    missing = required.difference(fieldnames)
    if missing:
        raise RuntimeError(f"Catalog missing required columns: {sorted(missing)}")

    normalized: list[dict[str, str]] = []
    sellable_stock: dict[str, int] = {}
    staper_seen = False

    for row in rows:
        sku = (row.get("SKU") or "").strip()
        product_type = (row.get("Type") or "").strip().lower()

        # Remove the duplicate Predator Sawed Off product completely. STAPER remains
        # the single canonical Sawed Off 39 in. variation under COL-AUTOMATIC-TAPER.
        if sku == "SPTAPER":
            continue

        if product_type in {"simple", "variation"}:
            if not sku:
                raise RuntimeError(f"Sellable catalog row is missing SKU: {row.get('Name', '')}")
            stock = deterministic_stock(sku)
            row["In stock?"] = "1"
            row["Stock"] = str(stock)
            sellable_stock[sku] = stock

        if sku == "STAPER":
            row["Images"] = ", ".join(STAPER_URLS)
            row["Meta: _dtb_inherit_parent_image"] = "0"
            staper_seen = True

        if sku in CATEGORY_FIXES:
            category_key, display_key = CATEGORY_FIXES[sku]
            row["Meta: _dtb_category_key"] = category_key
            row["Meta: _dtb_display_category_key"] = display_key

        normalized.append(row)

    if not staper_seen:
        raise RuntimeError("STAPER variation was not found in the launch catalog")
    if any((row.get("SKU") or "").strip() == "SPTAPER" for row in normalized):
        raise RuntimeError("SPTAPER removal failed")

    for row in normalized:
        if (row.get("Type") or "").strip().lower() in {"simple", "variation"}:
            qty = int(row["Stock"])
            if not 10 <= qty <= 100 or row["In stock?"] != "1":
                raise RuntimeError(f"Invalid managed stock projection for SKU {row.get('SKU')}")

    write_csv(CATALOG, fieldnames, normalized)
    return sellable_stock


def parse_decimal(value: str) -> Decimal:
    try:
        return Decimal((value or "").strip() or "0")
    except InvalidOperation:
        return Decimal("0")


def normalize_veeqo(sellable_stock: dict[str, int]) -> None:
    fieldnames, rows = read_csv(VEEQO)
    required = {"sku_code", "qty_on_hand", "total_qty", "total_stock_value", "sales_price", "cost_price", "image_url"}
    missing = required.difference(fieldnames)
    if missing:
        raise RuntimeError(f"Veeqo import missing required columns: {sorted(missing)}")

    normalized: list[dict[str, str]] = []
    for row in rows:
        sku = (row.get("sku_code") or "").strip()
        if sku == "SPTAPER":
            continue
        if not sku:
            raise RuntimeError("Veeqo inventory row is missing sku_code")

        stock = sellable_stock.get(sku, deterministic_stock(sku))
        row["qty_on_hand"] = str(stock)
        row["total_qty"] = str(stock)

        cost = parse_decimal(row.get("cost_price", ""))
        sales = parse_decimal(row.get("sales_price", ""))
        unit_value = cost if cost > 0 else sales
        row["total_stock_value"] = f"{(unit_value * Decimal(stock)):.2f}"

        if sku == "STAPER":
            row["image_url"] = STAPER_URLS[0]

        if not 10 <= int(row["qty_on_hand"]) <= 100:
            raise RuntimeError(f"Invalid Veeqo launch stock for SKU {sku}")
        normalized.append(row)

    if any((row.get("sku_code") or "").strip() == "SPTAPER" for row in normalized):
        raise RuntimeError("SPTAPER removal from Veeqo import failed")

    write_csv(VEEQO, fieldnames, normalized)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label} replacement, found {count}")
    return text.replace(old, new, 1)


def fix_category_normalizer() -> None:
    text = CATEGORY_NORMALIZER.read_text(encoding="utf-8")
    text = replace_once(
        text,
        "\t\t'predator_family'       => 'Automatic Tapers',",
        "\t\t'predator_family'       => 'Predator Family',",
        "Predator Family display label",
    )
    text = replace_once(
        text,
        "\t\t'predator_family'           => 'automatic_tapers',\n\t\t'predator'                  => 'automatic_tapers',",
        "\t\t'predator_family'           => 'predator_family',\n\t\t'predator'                  => 'predator_family',",
        "Predator Family alias",
    )
    text = replace_once(
        text,
        "\n\t\t\t'predator_family', 'predator family', 'Predator Family',\n\t\t\t'predator-family', 'Predator-Family', 'predator', 'Predator',",
        "",
        "Predator leakage from automatic_tapers raw forms",
    )
    CATEGORY_NORMALIZER.write_text(text, encoding="utf-8")


def fix_catalog_cache_authority() -> None:
    text = CATALOG_CACHE.read_text(encoding="utf-8")
    text = replace_once(text, "const CACHE_VERSION = 'v9';", "const CACHE_VERSION = 'v10';", "catalog cache version")

    old = """export function fetchCatalogProducts(query = {}) {\n  const key = sortedKey(buildCatalogProductParams(query));\n  const cached = getCacheEntry(productCache, key, PRODUCT_STORAGE_PREFIX);\n  if (cached?.data) return Promise.resolve(cached.data);\n\n  if (!productInflight.has(key)) {\n    productInflight.set(\n      key,\n      fetchCatalogProductSnapshot(query)\n        .then((snapshot) => snapshot || apiClient(buildCatalogProductsUrl(query)))\n        .then((data) => setCacheEntry(productCache, key, PRODUCT_STORAGE_PREFIX, data))\n        .finally(() => {\n          productInflight.delete(key);\n        }),\n    );\n  }\n\n  return productInflight.get(key);\n}\n"""
    new = """export function fetchCatalogProducts(query = {}) {\n  const key = sortedKey(buildCatalogProductParams(query));\n\n  // Static snapshots are warm-start data only. The live catalog endpoint is the\n  // authority and must revalidate every requested scope so stale generated\n  // category membership cannot become the final rendered result.\n  if (!productInflight.has(key)) {\n    productInflight.set(\n      key,\n      apiClient(buildCatalogProductsUrl(query))\n        .then((data) => setCacheEntry(productCache, key, PRODUCT_STORAGE_PREFIX, data))\n        .finally(() => {\n          productInflight.delete(key);\n        }),\n    );\n  }\n\n  return productInflight.get(key);\n}\n"""
    text = replace_once(text, old, new, "live catalog authority")
    CATALOG_CACHE.write_text(text, encoding="utf-8")


def main() -> None:
    normalize_media()
    stock = normalize_catalog()
    normalize_veeqo(stock)
    fix_category_normalizer()
    fix_catalog_cache_authority()
    print(f"Normalized {len(stock)} sellable catalog SKUs with deterministic stock 10..100.")
    print(f"STAPER gallery: {', '.join(STAPER_URLS)}")


if __name__ == "__main__":
    main()
