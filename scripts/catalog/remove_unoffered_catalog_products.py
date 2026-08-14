#!/usr/bin/env python3
"""Remove explicitly unoffered products from active launch catalog projections."""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import tempfile
from pathlib import Path

from official_catalog_schema import create_catalog_backup, validate_catalog


ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
GAPS = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.include-gaps.json"
PROJECTIONS = (
    (ROOT / "products" / "launch" / "official" / "veeqo_inventory_import.csv", "sku_code"),
    (ROOT / "products" / "launch" / "official" / "dtb_pricing_research.csv", "sku"),
)
UNSUPPORTED_SKUS = frozenset({"PTS", "TS", "TWS"})


def without_csv_rows(path: Path, sku_field: str) -> tuple[str, list[str]]:
    raw = path.read_text(encoding="utf-8-sig")
    physical = raw.splitlines(keepends=True)
    records = list(csv.reader(io.StringIO(raw, newline="")))
    if len(records) != len(physical):
        raise RuntimeError(f"{path}: targeted removal requires one physical line per CSV record")
    header = records[0]
    if sku_field not in header:
        raise RuntimeError(f"{path}: missing SKU field {sku_field!r}")
    sku_index = header.index(sku_field)
    removed: list[str] = []
    kept = [physical[0]]
    for line, record in zip(physical[1:], records[1:]):
        if len(record) != len(header):
            raise RuntimeError(f"{path}: malformed {len(record)}-column row")
        if record[sku_index].strip() in UNSUPPORTED_SKUS:
            removed.append(record[sku_index].strip())
        else:
            kept.append(line)
    if set(removed) != UNSUPPORTED_SKUS:
        raise RuntimeError(f"{path}: expected {sorted(UNSUPPORTED_SKUS)}, found {sorted(removed)}")
    return "".join(kept), removed


def stage(path: Path, content: str, *, encoding: str) -> Path:
    with tempfile.NamedTemporaryFile(
        "w", encoding=encoding, newline="", delete=False, dir=path.parent,
        prefix=path.name + ".", suffix=".tmp"
    ) as handle:
        handle.write(content)
        return Path(handle.name)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    validate_catalog(CATALOG, GAPS)
    staged: dict[Path, Path] = {}
    removals: dict[str, list[str]] = {}
    for path, field in ((CATALOG, "SKU"), *PROJECTIONS):
        content, removed = without_csv_rows(path, field)
        staged[path] = stage(path, content, encoding="utf-8-sig")
        removals[str(path.relative_to(ROOT))] = removed

    gap_payload = json.loads(GAPS.read_text(encoding="utf-8"))
    gap_payload["entries"] = [
        entry for entry in gap_payload["entries"]
        if entry["product_sku"] not in UNSUPPORTED_SKUS
    ]
    if gap_payload["entries"]:
        raise RuntimeError("Unexpected include-gap entries remain after unsupported-product removal")
    staged[GAPS] = stage(GAPS, json.dumps(gap_payload, indent=2) + "\n", encoding="utf-8")

    if not args.apply:
        for temp in staged.values():
            temp.unlink(missing_ok=True)
        print(json.dumps(removals, sort_keys=True))
        return 0

    backup_path: Path | None = None
    try:
        backup_path = create_catalog_backup(CATALOG)
        for path, temp in staged.items():
            os.replace(temp, path)
        validate_catalog(CATALOG, GAPS)
    except Exception:
        for temp in staged.values():
            temp.unlink(missing_ok=True)
        raise
    print(json.dumps({"removed": removals, "backup": str(backup_path)}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
