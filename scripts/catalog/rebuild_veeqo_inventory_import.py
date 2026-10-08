#!/usr/bin/env python3
"""Build the Veeqo product-import projection from the official WooCommerce catalog."""

from __future__ import annotations

import argparse
import csv
import html
import json
import os
import re
import sys
import tempfile
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/catalog"))
from official_catalog_schema import CatalogValidationError, validate_catalog  # noqa: E402


DEFAULT_CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
DEFAULT_OUTPUT = ROOT / "products/launch/official/veeqo_inventory.csv"
DEFAULT_STOCK_OUTPUT = ROOT / "products/launch/official/veeqo_stock_levels.csv"
DEFAULT_GAPS = ROOT / "products/launch/official/dtb_official_catalog.include-gaps.json"
MN_STATE_TAX_RATE = Decimal("0.06875")
STOCK_HEADERS = ("SKU", "total-qty")
HEADERS = (
    "sku_code", "product_title", "variant_title", "sales_price", "tax_rate",
    "cost_price", "description", "brand", "upc_code", "image_url", "weight",
    "weight_unit", "width", "depth", "height", "dimensions_unit", "variant_options", "total_qty",
)


def clean_text(value: str) -> str:
    value = re.sub(r"<\s*br\s*/?\s*>|</\s*(p|div|li|h[1-6])\s*>", " ", value or "", flags=re.I)
    value = re.sub(r"<[^>]*>", " ", value)
    return " ".join(html.unescape(value).split())


def price_for(row: dict[str, str], today: date) -> str:
    sale = (row.get("Sale price") or "").strip()
    if sale:
        starts = (row.get("Date sale price starts") or "").strip()
        ends = (row.get("Date sale price ends") or "").strip()
        starts_on = date.fromisoformat(starts[:10]) if starts else None
        ends_on = date.fromisoformat(ends[:10]) if ends else None
        if (starts_on is None or starts_on <= today) and (ends_on is None or ends_on >= today):
            value = sale
        else:
            value = (row.get("Regular price") or "").strip()
    else:
        value = (row.get("Regular price") or "").strip()
    if not value:
        # Veeqo's import projection uses an explicit zero placeholder when
        # WooCommerce has no price. This does not write a price to the catalog.
        return "0.00"
    try:
        amount = Decimal(value)
    except InvalidOperation as exc:
        raise ValueError(f"{row.get('SKU', '<no SKU>')}: invalid catalog price {value!r}") from exc
    if not amount.is_finite() or amount <= 0:
        raise ValueError(f"{row.get('SKU', '<no SKU>')}: price must be positive, found {value!r}")
    return format(amount.quantize(Decimal("0.01")), "f")


def optional_decimal(row: dict[str, str], field: str, sku: str) -> str:
    value = (row.get(field) or "").strip()
    if not value:
        return ""
    try:
        amount = Decimal(value)
    except InvalidOperation as exc:
        raise ValueError(f"{sku}: invalid {field} value {value!r}") from exc
    if not amount.is_finite() or amount < 0:
        raise ValueError(f"{sku}: invalid {field} value {value!r}")
    return format(amount, "f")


def load_catalog(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"Catalog has no header: {path}")
        return list(reader)


def build_rows(catalog: list[dict[str, str]], today: date) -> tuple[list[dict[str, str]], dict[str, object]]:
    by_sku = {(row.get("SKU") or "").strip(): row for row in catalog}
    result: list[dict[str, str]] = []
    placeholder_prices: list[str] = []
    for row in catalog:
        kind = (row.get("Type") or "").strip()
        sku = (row.get("SKU") or "").strip()
        if kind not in {"simple", "variation", "variable"}:
            raise ValueError(f"{sku}: unsupported WooCommerce type {kind!r}")
        if not sku:
            raise ValueError("Official catalog row has no SKU")
        stock_quantity = (row.get("Stock") or "").strip()
        if kind in {"simple", "variation"} and not stock_quantity.isdigit():
            raise ValueError(f"{sku}: Veeqo import requires a non-negative integer opening Stock quantity")
        if kind == "variable" and stock_quantity:
            raise ValueError(f"{sku}: variable parent stock must be carried by its variation SKUs")
        if kind == "variation":
            parent_sku = (row.get("Parent") or "").strip()
            parent = by_sku.get(parent_sku)
            if not parent or parent.get("Type") != "variable":
                raise ValueError(f"{sku}: variation parent {parent_sku!r} is missing or not variable")
            product_title = (parent.get("Name") or "").strip()
            variant_title = (row.get("Attribute 1 value(s)") or "").strip()
            attribute = (row.get("Attribute 1 name") or "").strip()
            variant_options = json.dumps({attribute: variant_title}, ensure_ascii=False, separators=(",", ":"))
        elif kind == "variable":
            product_title = (row.get("Name") or "").strip()
            attribute = (row.get("Attribute 1 name") or "").strip()
            values = (row.get("Attribute 1 value(s)") or "").strip()
            variant_title = values or "default"
            variant_options = json.dumps({attribute: values}, ensure_ascii=False, separators=(",", ":")) if attribute and values else "{}"
        else:
            product_title = (row.get("Name") or "").strip()
            variant_title = "default"
            variant_options = "{}"
        if not product_title or not variant_title:
            raise ValueError(f"{sku}: Veeqo requires a product title and variant title")
        price = price_for(row, today)
        if price == "0.00":
            placeholder_prices.append(sku)
        tax_status = (row.get("Tax status") or "").strip().casefold()
        if tax_status not in {"", "taxable"}:
            raise ValueError(f"{sku}: catalog tax status does not support the Minnesota standard rate")
        image = (row.get("Images") or "").split(",", 1)[0].strip()
        if not image and kind == "variation":
            image = (by_sku[(row.get("Parent") or "").strip()].get("Images") or "").split(",", 1)[0].strip()
        record = {
            "sku_code": sku,
            "product_title": product_title,
            "variant_title": variant_title,
            "sales_price": price,
            "tax_rate": format(MN_STATE_TAX_RATE, "f"),
            "cost_price": optional_decimal(row, "Cost of goods", sku),
            "description": clean_text(row.get("Description") or row.get("Short description") or ""),
            "brand": (row.get("Brands") or "").strip() or (by_sku.get((row.get("Parent") or "").strip(), {}).get("Brands") or "").strip(),
            "upc_code": (row.get("GTIN, UPC, EAN, or ISBN") or "").strip(),
            "image_url": image,
            "weight": optional_decimal(row, "Weight (lbs)", sku),
            "weight_unit": "lbs" if (row.get("Weight (lbs)") or "").strip() else "",
            "width": optional_decimal(row, "Width (in)", sku),
            "depth": optional_decimal(row, "Length (in)", sku),
            "height": optional_decimal(row, "Height (in)", sku),
            "dimensions_unit": "in" if any((row.get(field) or "").strip() for field in ("Length (in)", "Width (in)", "Height (in)")) else "",
            "variant_options": variant_options,
            # Veeqo's documented product CSV importer maps total_qty to the
            # selected warehouse's stock quantity. Variable parents are not
            # sellable stock units; simple products and variations carry the
            # catalog's explicit opening quantity.
            "total_qty": stock_quantity if kind in {"simple", "variation"} else "",
        }
        result.append(record)
    skus = [row["sku_code"] for row in result]
    if len(skus) != len(set(skus)) or len(result) != len(catalog):
        raise ValueError("Veeqo projection must contain each official catalog SKU exactly once")
    return result, {
        "output_rows": len(result),
        "placeholder_price_rows": len(placeholder_prices),
        "placeholder_price_skus": placeholder_prices,
    }


def write_atomic(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    os.close(fd)
    temporary = Path(temporary_name)
    try:
        with temporary.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=HEADERS, extrasaction="raise", lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def write_stock_atomic(path: Path, rows: list[dict[str, str]]) -> None:
    """Write Veeqo's stock-level-only import shape for a warehouse upload."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    os.close(fd)
    temporary = Path(temporary_name)
    try:
        with temporary.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=STOCK_HEADERS, extrasaction="raise", lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--stock-output", type=Path, default=DEFAULT_STOCK_OUTPUT)
    parser.add_argument("--apply", action="store_true", help="Write the generated CSV; otherwise preview only")
    args = parser.parse_args()
    catalog_path = args.catalog.resolve()
    output_path = args.output.resolve()
    stock_output_path = args.stock_output.resolve()
    if not catalog_path.is_file():
        raise ValueError(f"Official catalog does not exist: {catalog_path}")
    try:
        validate_catalog(catalog_path, DEFAULT_GAPS)
    except CatalogValidationError as exc:
        raise ValueError(f"Official catalog structural validation failed: {exc}") from exc
    catalog = load_catalog(catalog_path)
    rows, counts = build_rows(catalog, date.today())
    stock_rows = [
        {"SKU": row["sku_code"], "total-qty": row["total_qty"]}
        for row in rows
        if row["total_qty"] != ""
    ]
    if len({row["SKU"] for row in stock_rows}) != len(stock_rows):
        raise ValueError("Veeqo stock-level projection contains duplicate SKUs")
    changed = not output_path.is_file() or output_path.read_bytes() != _serialize(rows)
    stock_changed = not stock_output_path.is_file() or stock_output_path.read_bytes() != _serialize_stock(stock_rows)
    summary = {
        "mode": "apply" if args.apply else "preview",
        "catalog_rows": len(catalog),
        "output_rows": counts["output_rows"],
        "all_catalog_rows_included": counts["output_rows"] == len(catalog),
        "zero_placeholder_sales_price_rows": counts["placeholder_price_rows"],
        "zero_placeholder_sales_price_sku_sample": counts["placeholder_price_skus"][:20],
        "inventory_fields_included": True,
        "stock_quantity_rows": sum(1 for row in rows if row["total_qty"] != ""),
        "stock_levels_output": str(stock_output_path),
        "stock_levels_rows": len(stock_rows),
        "stock_levels_would_change": stock_changed,
        "tax_rate": str(MN_STATE_TAX_RATE),
        "would_change_file": changed,
    }
    if args.apply and changed:
        write_atomic(output_path, rows)
    if args.apply and stock_changed:
        write_stock_atomic(stock_output_path, stock_rows)
    print(json.dumps(summary, sort_keys=True))
    return 0


def _serialize(rows: list[dict[str, str]]) -> bytes:
    from io import StringIO

    buffer = StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=HEADERS, extrasaction="raise", lineterminator="\r\n")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue().encode("utf-8")


def _serialize_stock(rows: list[dict[str, str]]) -> bytes:
    from io import StringIO

    buffer = StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=STOCK_HEADERS, extrasaction="raise", lineterminator="\r\n")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue().encode("utf-8")


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, csv.Error) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
