#!/usr/bin/env python3
"""Project confirmed TSW supplier costs into the canonical launch catalog."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import tempfile
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path


HERE = Path(__file__).resolve().parent
DEFAULT_CATALOG = HERE.parents[1] / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_CONFIRMED = HERE / "results" / "temp-tsw-launch-confirmed-products.csv"
DEFAULT_REPORT = HERE / "results" / "tsw-supplier-cost-migration-report.json"
COST_FIELD = "Cost of goods"
CONFIRMED_STATUSES = {"matched_identifier", "approved_manual_match"}


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


def parse_cost(value: str, *, supplier_sku: str) -> str:
    try:
        cost = Decimal(value)
    except InvalidOperation as exc:
        raise MigrationError(f"{supplier_sku}: invalid supplier cost {value!r}") from exc
    if not cost.is_finite() or cost <= 0 or cost.as_tuple().exponent != -2:
        raise MigrationError(f"{supplier_sku}: supplier cost must be a positive two-decimal amount")
    return format(cost, ".2f")


def load_confirmed_costs(path: Path) -> tuple[dict[str, str], Counter[str]]:
    fields, rows = read_csv(path)
    required = {"match_status", "confidence", "supplier_sku", "supplier_cost", "catalog_sku"}
    if missing := sorted(required - set(fields)):
        raise MigrationError(f"{path}: missing confirmed-match fields: {', '.join(missing)}")

    costs: dict[str, str] = {}
    statuses: Counter[str] = Counter()
    for row_number, row in enumerate(rows, start=2):
        status = row["match_status"].strip()
        catalog_sku = row["catalog_sku"].strip()
        supplier_sku = row["supplier_sku"].strip()
        if status not in CONFIRMED_STATUSES or row["confidence"].strip() != "confirmed":
            raise MigrationError(f"{path}:{row_number}: row is not a confirmed match")
        if not catalog_sku:
            raise MigrationError(f"{path}:{row_number}: confirmed row has no catalog SKU")
        cost = parse_cost(row["supplier_cost"].strip(), supplier_sku=supplier_sku)
        if catalog_sku in costs and costs[catalog_sku] != cost:
            raise MigrationError(
                f"{catalog_sku}: confirmed supplier mappings disagree on cost ({costs[catalog_sku]} vs {cost})"
            )
        if catalog_sku in costs:
            raise MigrationError(f"{catalog_sku}: duplicate confirmed catalog target")
        costs[catalog_sku] = cost
        statuses[status] += 1
    if not costs:
        raise MigrationError(f"{path}: no confirmed costs found")
    return costs, statuses


def insert_cost_field(fields: list[str]) -> list[str]:
    if COST_FIELD in fields:
        return fields
    if "Sale price" not in fields or "Regular price" not in fields:
        raise MigrationError("Catalog must contain Sale price and Regular price columns")
    sale_index = fields.index("Sale price")
    regular_index = fields.index("Regular price")
    if regular_index != sale_index + 1:
        raise MigrationError("Sale price and Regular price must be adjacent before inserting Cost of goods")
    return fields[: regular_index + 1] + [COST_FIELD] + fields[regular_index + 1 :]


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
    before_sha256 = sha256(catalog_path)
    costs, statuses = load_confirmed_costs(args.confirmed.resolve())
    fields, rows = read_csv(catalog_path)
    output_fields = insert_cost_field(fields)

    sku_counts = Counter((row.get("SKU") or "").strip() for row in rows if (row.get("SKU") or "").strip())
    duplicate_targets = sorted(sku for sku in costs if sku_counts[sku] > 1)
    missing_targets = sorted(sku for sku in costs if sku_counts[sku] == 0)
    if duplicate_targets:
        raise MigrationError("Confirmed SKUs occur multiple times in catalog: " + ", ".join(duplicate_targets))
    if missing_targets:
        raise MigrationError("Confirmed SKUs missing from catalog: " + ", ".join(missing_targets))

    changed = 0
    unchanged = 0
    for row in rows:
        sku = (row.get("SKU") or "").strip()
        desired = costs.get(sku)
        if desired is None:
            row.setdefault(COST_FIELD, "")
            continue
        if (row.get(COST_FIELD) or "").strip() == desired:
            unchanged += 1
        else:
            row[COST_FIELD] = desired
            changed += 1

    write_csv_atomic(catalog_path, output_fields, rows)
    report = {
        "schema_version": 1,
        "catalog": str(catalog_path),
        "confirmed_source": str(args.confirmed.resolve()),
        "woocommerce_csv_field": COST_FIELD,
        "woocommerce_product_property": "cogs_value",
        "confirmed_rows": len(costs),
        "confirmed_statuses": dict(sorted(statuses.items())),
        "catalog_rows": len(rows),
        "costs_changed": changed,
        "costs_already_current": unchanged,
        "unmatched_catalog_rows_left_blank": len(rows) - len(costs),
        "catalog_sha256_before": before_sha256,
        "catalog_sha256_after": sha256(catalog_path),
    }
    write_report_atomic(args.report.resolve(), report)
    print(f"Migrated {len(costs)} confirmed costs: {changed} changed, {unchanged} already current")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except MigrationError as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
