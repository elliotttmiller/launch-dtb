#!/usr/bin/env python3
"""Apply reviewed variation attribute corrections without rewriting unrelated rows."""

from __future__ import annotations

import argparse
import csv
import io
import os
import tempfile
from pathlib import Path

from official_catalog_schema import EXPECTED_COLUMNS, create_catalog_backup


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
CORRECTIONS = {
    "STAPER": ("Sawed Off 39 in.", 'Sawed Off 39"'),
    "4-701": ('7"', "7”"),
    "4-794": ('31"-50"', "31”- 50”"),
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    path = args.catalog.resolve()

    raw = path.read_text(encoding="utf-8-sig")
    physical_lines = raw.splitlines(keepends=True)
    records = list(csv.reader(io.StringIO(raw, newline="")))
    if len(records) != len(physical_lines):
        raise RuntimeError("Targeted correction requires one physical line per CSV record")
    if tuple(records[0]) != EXPECTED_COLUMNS:
        raise RuntimeError("Catalog header does not match the canonical schema")

    sku_index = EXPECTED_COLUMNS.index("SKU")
    value_index = EXPECTED_COLUMNS.index("Attribute 1 value(s)")
    corrected: list[str] = []
    for index, values in enumerate(records[1:], start=1):
        sku = values[sku_index]
        if sku not in CORRECTIONS:
            continue
        expected_before, expected_after = CORRECTIONS[sku]
        if values[value_index] != expected_before:
            raise RuntimeError(
                f"{sku}: expected reviewed value {expected_before!r}, found {values[value_index]!r}"
            )
        values[value_index] = expected_after
        buffer = io.StringIO(newline="")
        csv.writer(buffer, lineterminator="\r\n").writerow(values)
        physical_lines[index] = buffer.getvalue()
        corrected.append(sku)

    if set(corrected) != set(CORRECTIONS):
        raise RuntimeError(f"Expected {sorted(CORRECTIONS)}, corrected {sorted(corrected)}")

    if args.apply:
        with tempfile.NamedTemporaryFile(
            "w", encoding="utf-8-sig", newline="", delete=False, dir=path.parent,
            prefix=path.name + ".", suffix=".tmp"
        ) as handle:
            temp_path = Path(handle.name)
            handle.write("".join(physical_lines))
        backup_path = create_catalog_backup(path)
        os.replace(temp_path, path)
        print(f"Rollback snapshot: {backup_path}")
    print(("Applied" if args.apply else "Verified") + ": " + ", ".join(sorted(corrected)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
