#!/usr/bin/env python3
"""Apply verified CSR Columbia repair-part prices to the canonical DTB catalog.

Only ``EXACT_SKU_MATCH`` rows in the CSR cross-reference are eligible.  CSR's
public price becomes WooCommerce ``Sale price``; ``Regular price`` is the
established 10 percent markup, rounded to cents with ROUND_HALF_UP.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import shutil
import tempfile
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
CROSS_REFERENCE = ROOT / "docs/catalog_prices/csrtools/csrtools_columbia_repair_parts_catalog_cross_reference.csv"
AUDIT = ROOT / "docs/catalog_prices/csrtools/csrtools_columbia_repair_parts_catalog_price_application.csv"
SUMMARY = ROOT / "docs/catalog_prices/csrtools/csrtools_columbia_repair_parts_catalog_price_application_summary.json"
TEN_PERCENT_MARKUP = Decimal("1.10")
CENTS = Decimal("0.01")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalized_sku(value: str) -> str:
    return (value or "").strip().casefold()


def money(value: str) -> str:
    amount = Decimal(value)
    if amount < 0:
        raise ValueError(f"Negative CSR price is not valid: {value!r}")
    return format(amount.quantize(CENTS, rounding=ROUND_HALF_UP), ".2f")


def marked_up_price(source_price: str) -> str:
    return format((Decimal(source_price) * TEN_PERCENT_MARKUP).quantize(CENTS, rounding=ROUND_HALF_UP), ".2f")


def read_csv_bytes(path: Path) -> tuple[list[str], list[dict[str, str]], bytes, str]:
    raw = path.read_bytes()
    bom = b"\xef\xbb\xbf" if raw.startswith(b"\xef\xbb\xbf") else b""
    newline = "\r\n" if b"\r\n" in raw else "\n"
    text = raw[len(bom):].decode("utf-8")
    reader = csv.DictReader(io.StringIO(text, newline=""))
    if not reader.fieldnames:
        raise ValueError(f"{path} has no header row")
    return list(reader.fieldnames), list(reader), bom, newline


def write_csv_atomic(path: Path, fields: list[str], rows: list[dict[str, str]], bom: bytes = b"", newline: str = "\n") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("wb", delete=False, dir=path.parent, prefix=f".{path.name}.", suffix=".tmp") as handle:
        temporary_path = Path(handle.name)
        handle.write(bom)
        text_handle = io.TextIOWrapper(handle, encoding="utf-8", newline="")
        writer = csv.DictWriter(text_handle, fieldnames=fields, extrasaction="raise", lineterminator=newline)
        writer.writeheader()
        writer.writerows(rows)
        text_handle.flush()
    temporary_path.replace(path)


def main() -> int:
    cross_fields, cross_rows, _, _ = read_csv_bytes(CROSS_REFERENCE)
    required_cross_fields = {"match_status", "catalog_csv", "manufacturer_part_number", "catalog_sku", "price_usd"}
    missing = required_cross_fields - set(cross_fields)
    if missing:
        raise ValueError(f"Cross-reference is missing required fields: {sorted(missing)}")

    prices_by_sku: dict[str, set[str]] = defaultdict(set)
    source_rows_by_sku: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in cross_rows:
        if row.get("match_status") != "EXACT_SKU_MATCH":
            continue
        if row.get("catalog_csv") != CATALOG.name:
            raise ValueError(f"Unexpected catalog source in approved match: {row.get('catalog_csv')!r}")
        manufacturer_part_number = normalized_sku(row.get("manufacturer_part_number", ""))
        catalog_sku = normalized_sku(row.get("catalog_sku", ""))
        if not manufacturer_part_number or manufacturer_part_number != catalog_sku:
            raise ValueError(f"Invalid exact-match identity: {row.get('manufacturer_part_number')!r} -> {row.get('catalog_sku')!r}")
        source_price = money(row.get("price_usd", ""))
        prices_by_sku[catalog_sku].add(source_price)
        source_rows_by_sku[catalog_sku].append(row)

    # A single official SKU cannot safely receive multiple supplier prices.
    # Retain those rows in the audit, but do not mutate their catalog prices.
    ambiguous = {sku: sorted(prices) for sku, prices in prices_by_sku.items() if len(prices) != 1}
    applicable_prices_by_sku = {
        sku: prices for sku, prices in prices_by_sku.items() if sku not in ambiguous
    }

    fields, catalog_rows, bom, newline = read_csv_bytes(CATALOG)
    required_catalog_fields = {"SKU", "Regular price", "Sale price"}
    missing = required_catalog_fields - set(fields)
    if missing:
        raise ValueError(f"Catalog is missing required fields: {sorted(missing)}")
    catalog_index: dict[str, dict[str, str]] = {}
    for row in catalog_rows:
        key = normalized_sku(row.get("SKU", ""))
        if not key:
            continue
        if key in catalog_index:
            raise ValueError(f"Canonical catalog has duplicate SKU: {row.get('SKU')!r}")
        catalog_index[key] = row
    absent = sorted(set(applicable_prices_by_sku) - set(catalog_index))
    if absent:
        raise ValueError(f"Approved CSR matches are absent from canonical catalog: {absent}")

    source_hash = sha256(CATALOG)
    backup = CATALOG.with_name(f"{CATALOG.name}.before-csr-repair-prices-{source_hash[:12]}.bak")
    if backup.exists():
        if sha256(backup) != source_hash:
            raise ValueError(f"Existing backup does not match current catalog: {backup}")
    else:
        shutil.copy2(CATALOG, backup)
        if sha256(backup) != source_hash:
            raise RuntimeError("Catalog backup hash verification failed")

    checked_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    audit_rows: list[dict[str, str]] = []
    changed = 0
    unchanged = 0
    for key in sorted(applicable_prices_by_sku):
        catalog_row = catalog_index[key]
        sale_price = next(iter(applicable_prices_by_sku[key]))
        regular_price = marked_up_price(sale_price)
        old_sale_price = catalog_row.get("Sale price", "")
        old_regular_price = catalog_row.get("Regular price", "")
        did_change = old_sale_price != sale_price or old_regular_price != regular_price
        catalog_row["Sale price"] = sale_price
        catalog_row["Regular price"] = regular_price
        changed += int(did_change)
        unchanged += int(not did_change)
        audit_rows.append({
            "catalog_sku": catalog_row["SKU"],
            "catalog_product_name": catalog_row.get("Name", ""),
            "catalog_product_type": catalog_row.get("Type", ""),
            "csr_source_rows": str(len(source_rows_by_sku[key])),
            "csr_sale_price_usd": sale_price,
            "old_sale_price": old_sale_price,
            "new_sale_price": sale_price,
            "old_regular_price": old_regular_price,
            "new_regular_price": regular_price,
            "status": "UPDATED" if did_change else "ALREADY_CURRENT",
            "applied_at": checked_at,
        })

    for key in sorted(ambiguous):
        catalog_row = catalog_index.get(key, {})
        audit_rows.append({
            "catalog_sku": catalog_row.get("SKU", key),
            "catalog_product_name": catalog_row.get("Name", ""),
            "catalog_product_type": catalog_row.get("Type", ""),
            "csr_source_rows": str(len(source_rows_by_sku[key])),
            "csr_sale_price_usd": "; ".join(ambiguous[key]),
            "old_sale_price": catalog_row.get("Sale price", ""),
            "new_sale_price": "",
            "old_regular_price": catalog_row.get("Regular price", ""),
            "new_regular_price": "",
            "status": "SKIPPED_CONFLICTING_CSR_PRICES",
            "applied_at": checked_at,
        })

    write_csv_atomic(CATALOG, fields, catalog_rows, bom, newline)
    output_hash = sha256(CATALOG)
    audit_fields = list(audit_rows[0]) if audit_rows else ["catalog_sku"]
    write_csv_atomic(AUDIT, audit_fields, audit_rows)
    summary = {
        "applied_at": checked_at,
        "catalog": str(CATALOG.relative_to(ROOT)).replace("\\", "/"),
        "catalog_sha256_before": source_hash,
        "catalog_sha256_after": output_hash,
        "backup": str(backup.relative_to(ROOT)).replace("\\", "/"),
        "approved_exact_skus": len(prices_by_sku),
        "approved_csr_source_rows": sum(len(rows) for rows in source_rows_by_sku.values()),
        "applied_unambiguous_skus": len(applicable_prices_by_sku),
        "skipped_conflicting_price_skus": {sku: ambiguous[sku] for sku in sorted(ambiguous)},
        "updated_catalog_rows": changed,
        "already_current_catalog_rows": unchanged,
        "sale_price_rule": "CSR verified price",
        "regular_price_rule": "CSR verified price x 1.10, rounded to cents with ROUND_HALF_UP",
    }
    SUMMARY.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, sort_keys=True), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
