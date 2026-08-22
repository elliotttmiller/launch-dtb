#!/usr/bin/env python3
"""Normalize semantic product kinds independently of Woo product type."""

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
ALIASES = {"drywall-finishing-tool": "tool", "kit": "toolset"}
ALLOWED = {"tool", "part", "accessory", "toolset", "stilt"}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def transform(rows: list[dict[str, str]]) -> tuple[list[dict[str, str]], int]:
    owners = {row["SKU"].strip(): row for row in rows if row["Type"].strip() != "variation"}
    changes = 0
    for row in rows:
        current = row["Meta: _dtb_product_kind"].strip()
        if row["Type"].strip() == "variation":
            parent_sku = row["Parent"].strip()
            if parent_sku not in owners:
                raise ValueError(f"variation {row['SKU']} references missing owner {parent_sku}")
            expected = ALIASES.get(owners[parent_sku]["Meta: _dtb_product_kind"].strip(), owners[parent_sku]["Meta: _dtb_product_kind"].strip())
        else:
            category = row.get("Categories", "").strip()
            if category.startswith("Stilts & Accessories > Stilts"):
                expected = "stilt"
            elif category == "Replacement Parts":
                expected = "part"
            elif category.endswith(" > Tool Sets"):
                expected = "toolset"
            elif category.endswith("Tool Storage & Cases"):
                expected = "accessory"
            else:
                expected = ALIASES.get(current, current)
        if expected not in ALLOWED:
            raise ValueError(f"{row['SKU']}: unsupported product kind {expected!r}")
        if current != expected:
            row["Meta: _dtb_product_kind"] = expected
            changes += 1
    return rows, changes


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
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    catalog = args.catalog.resolve()
    with catalog.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fields, rows = list(reader.fieldnames or ()), list(reader)
    before = sha256(catalog)
    rows, changes = transform(rows)
    result = {"rows": len(rows), "product_kind_changes": changes, "before_sha256": before, "applied": False}
    if args.apply and changes:
        backup = catalog.with_name(catalog.name + ".bak")
        temp_backup = backup.with_name(backup.name + ".tmp")
        shutil.copy2(catalog, temp_backup)
        os.replace(temp_backup, backup)
        if sha256(backup) != before:
            raise RuntimeError("backup hash does not match mutation input")
        write(catalog, fields, rows)
        result.update({"applied": True, "backup_sha256": sha256(backup), "after_sha256": sha256(catalog)})
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
