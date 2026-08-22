#!/usr/bin/env python3
"""Normalize reviewed toolset component aliases to canonical sellable SKUs.

Preview is the default. ``--apply`` creates a verified sibling backup and
atomically updates only ``Meta: _includes_*_sku`` values. Product SKUs,
component display names, quantities, row order, schema, UTF-8 BOM, and CRLF
line endings remain unchanged.
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
ALIASES = {"85TT": "85T", "90TT": "90T"}
EXPECTED_COUNTS = {"85TT": 6, "90TT": 9}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError("Catalog has no header")
        return list(reader.fieldnames), list(reader)


def build_changes(fields: list[str], rows: list[dict[str, str]]) -> list[dict[str, str]]:
    include_fields = [field for field in fields if field.startswith("Meta: _includes_") and field.endswith("_sku")]
    catalog_skus = {row.get("SKU", "").strip() for row in rows}
    missing_targets = sorted(set(ALIASES.values()) - catalog_skus)
    if missing_targets:
        raise ValueError(f"Canonical alias targets are absent from the catalog: {missing_targets}")

    changes: list[dict[str, str]] = []
    for row in rows:
        for field in include_fields:
            before = row.get(field, "").strip()
            after = ALIASES.get(before)
            if after:
                changes.append({"sku": row["SKU"], "field": field, "before": before, "after": after})

    counts = {source: sum(change["before"] == source for change in changes) for source in ALIASES}
    remaining = {
        source: sum(row.get(field, "").strip() == source for row in rows for field in include_fields)
        for source in ALIASES
    }
    for source, expected in EXPECTED_COUNTS.items():
        if counts[source] not in {0, expected}:
            raise ValueError(f"Unexpected {source} alias count: {counts[source]} (expected {expected} or 0)")
        if counts[source] == 0 and remaining[source] != 0:
            raise ValueError(f"Unprocessed {source} aliases remain")
    return changes


def write_atomic(path: Path, fields: list[str], rows: list[dict[str, str]], expected_hash: str) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="raise", lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)
            handle.flush()
            os.fsync(handle.fileno())
        if digest(path) != expected_hash:
            raise RuntimeError("Catalog changed after loading; refusing concurrent overwrite")
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    catalog = args.catalog.resolve()
    before_hash = digest(catalog)
    fields, rows = load(catalog)
    changes = build_changes(fields, rows)
    result: dict[str, object] = {
        "mode": "apply" if args.apply else "preview",
        "catalog": str(catalog.relative_to(ROOT)).replace("\\", "/"),
        "before_sha256": before_hash,
        "change_count": len(changes),
        "changed_products": len({change["sku"] for change in changes}),
        "aliases": {
            source: {
                "canonical": target,
                "change_count": sum(change["before"] == source for change in changes),
            }
            for source, target in ALIASES.items()
        },
    }
    if args.apply and changes:
        backup = Path(f"{catalog}.bak")
        if backup.exists() and digest(backup) != before_hash:
            archive = backup.with_name(f"{catalog.name}.previous-{digest(backup)[:12]}.bak")
            if not archive.exists():
                shutil.copy2(backup, archive)
            result["previous_backup_archive"] = str(archive.relative_to(ROOT)).replace("\\", "/")
        shutil.copy2(catalog, backup)
        if digest(backup) != before_hash:
            raise RuntimeError("Backup hash does not match mutation input")
        by_sku = {row["SKU"]: row for row in rows}
        for change in changes:
            by_sku[change["sku"]][change["field"]] = change["after"]
        write_atomic(catalog, fields, rows, before_hash)
        result.update({
            "backup": str(backup.relative_to(ROOT)).replace("\\", "/"),
            "backup_sha256": digest(backup),
            "after_sha256": digest(catalog),
        })
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
