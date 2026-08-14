#!/usr/bin/env python3
"""Project confirmed TSW shipping measurements into the canonical launch catalog."""

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
DEFAULT_CONFIRMED = HERE / "results" / "shipping" / "temp-tsw-launch-confirmed-products.csv"
DEFAULT_REPORT = HERE / "results" / "shipping" / "tsw-shipping-spec-migration-report.json"
CONFIRMED_STATUSES = {"matched_identifier", "approved_manual_match"}
MEASUREMENT_FIELDS = {
    "supplier_weight": "Weight (lbs)",
    "supplier_length": "Length (in)",
    "supplier_width": "Width (in)",
    "supplier_height": "Height (in)",
}


class MigrationError(RuntimeError):
    pass


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                raise MigrationError(f"{path}: missing CSV header")
            fields = list(reader.fieldnames)
            if len(fields) != len(set(fields)):
                raise MigrationError(f"{path}: duplicate CSV columns")
            return fields, list(reader)
    except OSError as exc:
        raise MigrationError(f"Cannot read {path}: {exc}") from exc


def normalize_measurement(value: str, *, supplier_sku: str, field: str) -> tuple[str, bool]:
    raw = value.strip()
    if not raw:
        return "", False
    try:
        measurement = Decimal(raw)
    except InvalidOperation as exc:
        raise MigrationError(f"{supplier_sku}: invalid {field} value {value!r}") from exc
    if not measurement.is_finite() or measurement < 0:
        raise MigrationError(f"{supplier_sku}: {field} must be finite and nonnegative")
    if measurement == 0:
        return "", True
    return format(measurement.normalize(), "f"), False


def load_confirmed_specs(
    path: Path,
) -> tuple[dict[str, dict[str, str]], Counter[str], Counter[str], Counter[str]]:
    fields, rows = read_csv(path)
    required = {"match_status", "confidence", "supplier_sku", "catalog_sku", *MEASUREMENT_FIELDS}
    if missing := sorted(required - set(fields)):
        raise MigrationError(f"{path}: missing confirmed-match fields: {', '.join(missing)}")

    specs: dict[str, dict[str, str]] = {}
    statuses: Counter[str] = Counter()
    populated: Counter[str] = Counter()
    suppressed_zeroes: Counter[str] = Counter()
    for row_number, row in enumerate(rows, start=2):
        status = row["match_status"].strip()
        confidence = row["confidence"].strip()
        supplier_sku = row["supplier_sku"].strip()
        catalog_sku = row["catalog_sku"].strip()
        if status not in CONFIRMED_STATUSES or confidence != "confirmed":
            raise MigrationError(f"{path}:{row_number}: row is not a confirmed match")
        if not supplier_sku or not catalog_sku:
            raise MigrationError(f"{path}:{row_number}: confirmed row has a blank supplier or catalog SKU")
        if catalog_sku in specs:
            raise MigrationError(f"{catalog_sku}: duplicate confirmed catalog target")

        measurements = {}
        for supplier_field, catalog_field in MEASUREMENT_FIELDS.items():
            value, suppressed_zero = normalize_measurement(
                row[supplier_field], supplier_sku=supplier_sku, field=supplier_field
            )
            measurements[catalog_field] = value
            if suppressed_zero:
                suppressed_zeroes[catalog_field] += 1
        for field, value in measurements.items():
            if value:
                populated[field] += 1
        specs[catalog_sku] = measurements
        statuses[status] += 1

    if not specs:
        raise MigrationError(f"{path}: no confirmed mappings found")
    return specs, statuses, populated, suppressed_zeroes


def write_csv_atomic(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8-sig", newline="", delete=False, dir=path.parent,
        prefix=path.name + ".", suffix=".tmp"
    )
    temp_path = Path(handle.name)
    try:
        with handle:
            writer = csv.DictWriter(
                handle, fieldnames=fields, lineterminator="\r\n", extrasaction="raise"
            )
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temp_path, path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def write_report_atomic(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", newline="\n", delete=False, dir=path.parent,
        prefix=path.name + ".", suffix=".tmp"
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


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def measurements_equal(current: str, desired: str) -> bool:
    if not current:
        return False
    try:
        return Decimal(current) == Decimal(desired)
    except InvalidOperation:
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--confirmed", type=Path, default=DEFAULT_CONFIRMED)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument(
        "--apply", action="store_true",
        help="write validated shipping measurements into the catalog; otherwise preview only",
    )
    args = parser.parse_args()

    catalog_path = args.catalog.resolve()
    confirmed_path = args.confirmed.resolve()
    report_path = args.report.resolve()
    if catalog_path in {confirmed_path, report_path} or confirmed_path == report_path:
        raise MigrationError("Catalog, confirmed input, and report paths must be distinct")

    before_sha256 = sha256(catalog_path)
    specs, statuses, populated, suppressed_zeroes = load_confirmed_specs(confirmed_path)
    fields, rows = read_csv(catalog_path)
    required_catalog_fields = {"SKU", *MEASUREMENT_FIELDS.values()}
    if missing := sorted(required_catalog_fields - set(fields)):
        raise MigrationError(f"{catalog_path}: missing catalog fields: {', '.join(missing)}")

    sku_counts = Counter(
        (row.get("SKU") or "").strip() for row in rows if (row.get("SKU") or "").strip()
    )
    duplicate_targets = sorted(sku for sku in specs if sku_counts[sku] > 1)
    missing_targets = sorted(sku for sku in specs if sku_counts[sku] == 0)
    if duplicate_targets:
        raise MigrationError("Confirmed SKUs occur multiple times in catalog: " + ", ".join(duplicate_targets))
    if missing_targets:
        raise MigrationError("Confirmed SKUs missing from catalog: " + ", ".join(missing_targets))

    field_updates: Counter[str] = Counter()
    field_unchanged: Counter[str] = Counter()
    changed_skus: list[str] = []
    for row in rows:
        sku = (row.get("SKU") or "").strip()
        desired = specs.get(sku)
        if desired is None:
            continue
        product_changed = False
        for field, value in desired.items():
            if not value:
                continue
            current = (row.get(field) or "").strip()
            if measurements_equal(current, value):
                field_unchanged[field] += 1
                continue
            row[field] = value
            field_updates[field] += 1
            product_changed = True
        if product_changed:
            changed_skus.append(sku)

    if args.apply:
        write_csv_atomic(catalog_path, fields, rows)
    after_sha256 = sha256(catalog_path)
    report = {
        "schema_version": 1,
        "mode": "applied" if args.apply else "preview",
        "catalog": str(catalog_path),
        "confirmed_source": str(confirmed_path),
        "confirmed_rows": len(specs),
        "confirmed_statuses": dict(sorted(statuses.items())),
        "source_measurements_populated": dict(sorted(populated.items())),
        "source_zero_measurements_suppressed": dict(sorted(suppressed_zeroes.items())),
        "field_updates": dict(sorted(field_updates.items())),
        "field_values_already_current": dict(sorted(field_unchanged.items())),
        "products_changed": len(changed_skus),
        "changed_catalog_skus": changed_skus,
        "catalog_sha256_before": before_sha256,
        "catalog_sha256_after": after_sha256,
    }
    write_report_atomic(report_path, report)
    print(
        f"{'Applied' if args.apply else 'Previewed'} shipping specs for {len(specs)} confirmed products: "
        f"{len(changed_skus)} products, {sum(field_updates.values())} fields changed"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except MigrationError as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
