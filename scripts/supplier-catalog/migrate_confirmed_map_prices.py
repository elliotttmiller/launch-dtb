#!/usr/bin/env python3
"""Project confirmed MAP (Minimum Advertised Price) matches into the canonical
launch catalog's `Meta: _dtb_map_price` column, which WooCommerce's CSV
importer maps directly onto the `_dtb_map_price` postmeta key read by
PricingManagerService (drywalltoolbox mu-plugin dtb-catalog-platform)."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sys
import tempfile
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "catalog"))
from official_catalog_schema import (  # noqa: E402
    CatalogValidationError,
    create_catalog_backup,
    validate_catalog,
)

DEFAULT_CATALOG = HERE.parents[1] / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = DEFAULT_CATALOG.with_name("dtb_official_catalog.include-gaps.json")
DEFAULT_CONFIRMED = HERE / "results" / "map" / "temp-map-confirmed-products.csv"
DEFAULT_REPORT = HERE / "results" / "map" / "map-price-migration-report.json"
MAP_FIELD = "Meta: _dtb_map_price"
CONFIRMED_STATUSES = {"matched_identifier"}


class MigrationError(RuntimeError):
    pass


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                raise MigrationError(f"{path}: missing CSV header")
            return list(reader.fieldnames), list(reader)
    except OSError as exc:
        raise MigrationError(f"Cannot read {path}: {exc}") from exc


def parse_map_price(value: str, *, source_sku: str) -> str:
    try:
        price = Decimal(value)
    except InvalidOperation as exc:
        raise MigrationError(f"{source_sku}: invalid MAP price {value!r}") from exc
    if not price.is_finite() or price <= 0 or price.as_tuple().exponent != -2:
        raise MigrationError(f"{source_sku}: MAP price must be a positive two-decimal amount")
    return format(price, ".2f")


def load_confirmed_map_prices(path: Path) -> tuple[dict[str, str], Counter[str]]:
    fields, rows = read_csv(path)
    required = {"match_status", "confidence", "source_sku", "map_price", "catalog_sku"}
    if missing := sorted(required - set(fields)):
        raise MigrationError(f"{path}: missing confirmed-match fields: {', '.join(missing)}")

    prices: dict[str, str] = {}
    statuses: Counter[str] = Counter()
    for row_number, row in enumerate(rows, start=2):
        status = row["match_status"].strip()
        catalog_sku = row["catalog_sku"].strip()
        source_sku = row["source_sku"].strip()
        if status not in CONFIRMED_STATUSES or row["confidence"].strip() != "confirmed":
            raise MigrationError(f"{path}:{row_number}: row is not a confirmed match")
        if not catalog_sku:
            raise MigrationError(f"{path}:{row_number}: confirmed row has no catalog SKU")
        price = parse_map_price(row["map_price"].strip(), source_sku=source_sku)
        if catalog_sku in prices and prices[catalog_sku] != price:
            raise MigrationError(
                f"{catalog_sku}: confirmed MAP mappings disagree on price ({prices[catalog_sku]} vs {price})"
            )
        if catalog_sku in prices:
            continue
        prices[catalog_sku] = price
        statuses[status] += 1
    if not prices:
        raise MigrationError(f"{path}: no confirmed MAP prices found")
    return prices, statuses


def insert_map_field(fields: list[str]) -> list[str]:
    if MAP_FIELD in fields:
        return fields
    return fields + [MAP_FIELD]


def write_csv_atomic(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8-sig", newline="", delete=False, dir=path.parent, prefix=path.name + ".", suffix=".tmp"
    )
    temp_path = Path(handle.name)
    try:
        with handle:
            writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\r\n", extrasaction="raise")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temp_path, path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_report_atomic(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", newline="\n", delete=False, dir=path.parent, prefix=path.name + ".", suffix=".tmp"
    )
    temp_path = Path(handle.name)
    try:
        with handle:
            json.dump(payload, handle, indent=2, sort_keys=True)
            handle.write("\n")
        os.replace(temp_path, path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--confirmed", type=Path, default=DEFAULT_CONFIRMED)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    args = parser.parse_args()

    catalog_path = args.catalog.resolve()
    # Skip the usual pre-mutation validate_catalog call: the first run of this
    # script backfills the Meta: _dtb_map_price column onto a catalog that
    # predates it, so the on-disk header will not yet match the (now updated)
    # schema until after this migration writes it. Post-write validation below
    # still enforces the full contract on the result.
    before_sha256 = sha256(catalog_path)
    prices, statuses = load_confirmed_map_prices(args.confirmed.resolve())
    fields, rows = read_csv(catalog_path)
    output_fields = insert_map_field(fields)

    sku_counts = Counter((row.get("SKU") or "").strip() for row in rows if (row.get("SKU") or "").strip())
    duplicate_targets = sorted(sku for sku in prices if sku_counts[sku] > 1)
    missing_targets = sorted(sku for sku in prices if sku_counts[sku] == 0)
    if duplicate_targets:
        raise MigrationError("Confirmed SKUs occur multiple times in catalog: " + ", ".join(duplicate_targets))
    if missing_targets:
        raise MigrationError("Confirmed SKUs missing from catalog: " + ", ".join(missing_targets))

    changed = 0
    unchanged = 0
    for row in rows:
        sku = (row.get("SKU") or "").strip()
        desired = prices.get(sku)
        if desired is None:
            row.setdefault(MAP_FIELD, "")
            continue
        if (row.get(MAP_FIELD) or "").strip() == desired:
            unchanged += 1
        else:
            row[MAP_FIELD] = desired
            changed += 1

    backup_path = create_catalog_backup(catalog_path)
    write_csv_atomic(catalog_path, output_fields, rows)
    validate_catalog(catalog_path, DEFAULT_GAPS)
    report = {
        "schema_version": 1,
        "catalog": str(catalog_path),
        "confirmed_source": str(args.confirmed.resolve()),
        "woocommerce_csv_field": MAP_FIELD,
        "wordpress_meta_key": "_dtb_map_price",
        "confirmed_rows": len(prices),
        "confirmed_statuses": dict(sorted(statuses.items())),
        "catalog_rows": len(rows),
        "map_prices_changed": changed,
        "map_prices_already_current": unchanged,
        "unmatched_catalog_rows_left_blank": len(rows) - len(prices),
        "catalog_sha256_before": before_sha256,
        "catalog_sha256_after": sha256(catalog_path),
        "rollback_snapshot": str(backup_path),
    }
    write_report_atomic(args.report.resolve(), report)
    print(f"Migrated {len(prices)} confirmed MAP prices: {changed} changed, {unchanged} already current")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (MigrationError, CatalogValidationError) as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
