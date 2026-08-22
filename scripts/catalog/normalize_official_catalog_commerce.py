#!/usr/bin/env python3
"""Normalize Woo publication and DTB commerce-mode contracts deterministically."""

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
DEPRECATED_MODES = {"deprecated"}
LEGACY_ACTIVE_MODES = {"standard", "standard-catalog", "parent_container"}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def transform(rows: list[dict[str, str]]) -> tuple[list[dict[str, str]], dict[str, int]]:
    counts = {"commerce_mode": 0, "published": 0, "visibility": 0}
    for row in rows:
        mode = row["Meta: _dtb_commerce_mode"].strip()
        type_ = row["Type"].strip()
        priced = bool(row["Regular price"].strip() or row["Sale price"].strip())
        if mode in DEPRECATED_MODES:
            expected_mode, expected_published, expected_visibility = "hidden_reference", "0", "hidden"
        elif mode in LEGACY_ACTIVE_MODES or (mode == "quote_only" and (priced or type_ == "variable")):
            expected_mode, expected_published, expected_visibility = "purchasable", row["Published"], row["Visibility in catalog"]
        else:
            expected_mode, expected_published, expected_visibility = mode, row["Published"], row["Visibility in catalog"]
        for field, expected, key in (
            ("Meta: _dtb_commerce_mode", expected_mode, "commerce_mode"),
            ("Published", expected_published, "published"),
            ("Visibility in catalog", expected_visibility, "visibility"),
        ):
            if row[field] != expected:
                row[field] = expected
                counts[key] += 1
    return rows, counts


def write_atomic(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
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
    total = sum(changes.values())
    result = {"rows": len(rows), "changes": changes, "total_changes": total, "before_sha256": before, "applied": False}
    if args.apply and total:
        backup = catalog.with_name(catalog.name + ".bak")
        temp_backup = backup.with_name(backup.name + ".tmp")
        shutil.copy2(catalog, temp_backup)
        os.replace(temp_backup, backup)
        if sha256(backup) != before:
            raise RuntimeError("backup hash does not match mutation input")
        write_atomic(catalog, fields, rows)
        result.update({"applied": True, "backup_sha256": sha256(backup), "after_sha256": sha256(catalog)})
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
