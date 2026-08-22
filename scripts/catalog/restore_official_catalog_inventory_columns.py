#!/usr/bin/env python3
"""Restore official Woo inventory columns from a verified same-SKU snapshot."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
INVENTORY_FIELDS = ("In stock?", "Stock", "Low stock amount", "Backorders allowed?")
INSERT_BEFORE = "Sold individually?"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or ()), list(reader)


def write(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    fd, name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    os.close(fd)
    temp = Path(name)
    try:
        with temp.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="raise", lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--source-snapshot", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    catalog = args.catalog.resolve()
    source = (args.source_snapshot or catalog.with_name(catalog.name + ".bak")).resolve()
    fields, rows = read(catalog)
    source_fields, source_rows = read(source)
    if not set(INVENTORY_FIELDS).issubset(source_fields):
        raise RuntimeError("source snapshot does not contain the complete Woo inventory schema")
    source_by_sku = {row["SKU"].strip(): row for row in source_rows}
    if set(source_by_sku) != {row["SKU"].strip() for row in rows}:
        raise RuntimeError("source snapshot SKU set does not match current catalog")
    if any(field in fields for field in INVENTORY_FIELDS):
        raise RuntimeError("one or more inventory fields already exist; refusing a partial restore")
    insert_at = fields.index(INSERT_BEFORE)
    output_fields = fields[:insert_at] + list(INVENTORY_FIELDS) + fields[insert_at:]
    for row in rows:
        source_row = source_by_sku[row["SKU"].strip()]
        for field in INVENTORY_FIELDS:
            row[field] = source_row[field]
    before = sha256(catalog)
    result = {"rows": len(rows), "columns": len(output_fields), "restored_fields": list(INVENTORY_FIELDS), "before_sha256": before, "applied": False}
    if args.apply:
        rollback = catalog.with_name(catalog.name + ".bak")
        rollback_temp = rollback.with_name(rollback.name + ".tmp")
        shutil.copy2(catalog, rollback_temp)
        os.replace(rollback_temp, rollback)
        if sha256(rollback) != before:
            raise RuntimeError("fresh rollback backup does not match current catalog")
        write(catalog, output_fields, rows)
        result.update({"applied": True, "backup_sha256": sha256(rollback), "after_sha256": sha256(catalog)})
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
