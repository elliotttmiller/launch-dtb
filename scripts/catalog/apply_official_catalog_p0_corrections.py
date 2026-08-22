#!/usr/bin/env python3
"""Apply the deterministic P0 corrections to the official Woo catalog.

Preview is the default.  --apply creates an exact sibling .bak of the input
before replacing the catalog atomically.  The write preserves UTF-8 BOM, CRLF,
column order, row order, and every field outside the explicit correction set.
"""

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
SCHEMATIC_URL = "Meta: _dtb_schematic_url"
INHERIT_IMAGE = "Meta: _dtb_inherit_parent_image"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError("Catalog has no header")
        return list(reader.fieldnames), list(reader)


def corrections(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    changes: list[dict[str, str]] = []
    by_sku = {row["SKU"]: row for row in rows}

    for row in rows:
        before = row.get(SCHEMATIC_URL, "")
        after = before.replace("&amp;", "&")
        if before != after:
            row[SCHEMATIC_URL] = after
            changes.append({"sku": row["SKU"], "field": SCHEMATIC_URL, "before": before, "after": after})

    expected_defaults = {"AH8-CLIP": '3.5"', "AH9-CLIP": '3.5"'}
    for sku, after in expected_defaults.items():
        row = by_sku[sku]
        before = row["Attribute 1 default"]
        if before != after:
            if before not in {'3.5",Columbia AH8', '3.5",Columbia AH9'}:
                raise ValueError(f"Unexpected {sku} default: {before!r}")
            if after not in [part.strip() for part in row["Attribute 1 value(s)"].split(",")]:
                raise ValueError(f"Corrected default is not a declared value for {sku}")
            row["Attribute 1 default"] = after
            changes.append({"sku": sku, "field": "Attribute 1 default", "before": before, "after": after})

    for sku in ("TTSFS", "TTSFS-2"):
        row = by_sku[sku]
        if row["Type"] != "simple":
            raise ValueError(f"Expected {sku} to remain simple")
        before = row[INHERIT_IMAGE]
        if before != "0":
            if before != "1":
                raise ValueError(f"Unexpected {sku} inheritance value: {before!r}")
            row[INHERIT_IMAGE] = "0"
            changes.append({"sku": sku, "field": INHERIT_IMAGE, "before": before, "after": "0"})

    return changes


def write_atomic(path: Path, fields: list[str], rows: list[dict[str, str]], expected_hash: str) -> None:
    fd, name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="raise", lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)
            handle.flush()
            os.fsync(handle.fileno())
        if digest(path) != expected_hash:
            raise RuntimeError("Catalog changed after it was loaded; refusing to overwrite concurrent work")
        os.replace(name, path)
    except Exception:
        try:
            os.unlink(name)
        except FileNotFoundError:
            pass
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    catalog = args.catalog.resolve()
    before_hash = digest(catalog)
    fields, rows = load(catalog)
    changes = corrections(rows)
    result: dict[str, object] = {
        "mode": "apply" if args.apply else "preview",
        "catalog": str(catalog),
        "before_sha256": before_hash,
        "change_count": len(changes),
        "changes_by_field": {},
    }
    for change in changes:
        field = change["field"]
        result["changes_by_field"][field] = result["changes_by_field"].get(field, 0) + 1

    if args.apply and changes:
        backup = Path(f"{catalog}.bak")
        if backup.exists() and digest(backup) != before_hash:
            archive = backup.with_name(f"{catalog.name}.previous-{digest(backup)[:12]}.bak")
            if not archive.exists():
                shutil.copy2(backup, archive)
            result["previous_backup_archive"] = str(archive)
        shutil.copy2(catalog, backup)
        if digest(backup) != before_hash:
            raise RuntimeError("Backup hash does not match the pre-mutation catalog")
        write_atomic(catalog, fields, rows, before_hash)
        result["backup"] = str(backup)
        result["backup_sha256"] = digest(backup)
        result["after_sha256"] = digest(catalog)

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
