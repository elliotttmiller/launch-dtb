#!/usr/bin/env python3
"""Remove reviewed unsupported LEVEL5 toolset component references.

Preview is the default. ``--apply`` creates a verified sibling backup and
atomically rewrites only the numbered include name/SKU pairs for the two
approved toolsets. Remaining components are compacted without reordering.
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
REMOVALS = {
    "4-600P": {"5-623": "1× Bonus Hand Tool Set"},
    "4-677P": {
        "4-862": "1× Outsider Wheel Kit",
        "5-623": "1× Bonus Hand Tool Set",
    },
}
SLOTS = 20


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError("Catalog has no header")
        return list(reader.fieldnames), list(reader)


def components(row: dict[str, str]) -> list[tuple[str, str]]:
    result: list[tuple[str, str]] = []
    seen_blank = False
    for slot in range(SLOTS):
        name = row.get(f"Meta: _includes_{slot}_name", "")
        sku = row.get(f"Meta: _includes_{slot}_sku", "")
        if name or sku:
            if seen_blank:
                raise ValueError(f"{row['SKU']}: non-contiguous include data at slot {slot}")
            if not name or not sku:
                raise ValueError(f"{row['SKU']}: incomplete include pair at slot {slot}")
            result.append((name, sku))
        else:
            seen_blank = True
    return result


def build_changes(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    by_sku = {row["SKU"].strip(): row for row in rows}
    changes: list[dict[str, object]] = []
    for product_sku, expected_removals in REMOVALS.items():
        row = by_sku.get(product_sku)
        if row is None:
            raise ValueError(f"Missing reviewed toolset {product_sku}")
        before = components(row)
        observed = {sku: name for name, sku in before if sku in expected_removals}
        if observed and observed != expected_removals:
            raise ValueError(f"Unexpected removal identities for {product_sku}: {observed}")
        if not observed:
            continue
        after = [(name, sku) for name, sku in before if sku not in expected_removals]
        changes.append({
            "sku": product_sku,
            "before_count": len(before),
            "after_count": len(after),
            "removed": [{"name": name, "sku": sku} for name, sku in before if sku in expected_removals],
            "remaining": after,
        })
    return changes


def apply_changes(rows: list[dict[str, str]], changes: list[dict[str, object]]) -> None:
    by_sku = {row["SKU"].strip(): row for row in rows}
    for change in changes:
        row = by_sku[str(change["sku"])]
        remaining = list(change["remaining"])
        for slot in range(SLOTS):
            name, sku = remaining[slot] if slot < len(remaining) else ("", "")
            row[f"Meta: _includes_{slot}_name"] = name
            row[f"Meta: _includes_{slot}_sku"] = sku


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
            raise RuntimeError("Catalog changed after loading; refusing concurrent overwrite")
        os.replace(name, path)
    except Exception:
        try:
            os.unlink(name)
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
    changes = build_changes(rows)
    result: dict[str, object] = {
        "mode": "apply" if args.apply else "preview",
        "catalog": str(catalog.relative_to(ROOT)).replace("\\", "/"),
        "before_sha256": before_hash,
        "changed_products": len(changes),
        "removed_components": sum(len(change["removed"]) for change in changes),
        "changes": [{key: value for key, value in change.items() if key != "remaining"} for change in changes],
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
        apply_changes(rows, changes)
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
