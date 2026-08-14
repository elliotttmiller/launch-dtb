#!/usr/bin/env python3
"""Make every variation attribute an exact member of its variable parent's options."""

from __future__ import annotations

import argparse
import csv
import io
import os
import re
import tempfile
from pathlib import Path

from official_catalog_schema import EXPECTED_COLUMNS, create_catalog_backup


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"


def comparison_key(value: str) -> str:
    """Normalize typography only for deterministic candidate resolution."""
    normalized = value.strip().replace("“", '"').replace("”", '"')
    normalized = re.sub(r"\s+", "", normalized)
    normalized = re.sub(r"in\.?$", '"', normalized, flags=re.IGNORECASE)
    return normalized.casefold()


def encode_row(values: list[str]) -> str:
    buffer = io.StringIO(newline="")
    csv.writer(buffer, lineterminator="\r\n").writerow(values)
    return buffer.getvalue()


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
        raise RuntimeError("Targeted normalization requires one physical line per CSV record")
    if tuple(records[0]) != EXPECTED_COLUMNS:
        raise RuntimeError("Catalog header does not match the canonical schema")

    rows = [dict(zip(EXPECTED_COLUMNS, values)) for values in records[1:]]
    by_sku = {row["SKU"]: row for row in rows}
    s1x_parent = by_sku.get("SP-S1X-A")
    if s1x_parent is None or s1x_parent["Attribute 1 value(s)"] != '26"-40"':
        raise RuntimeError("SP-S1X-A does not match the reviewed incomplete-parent signature")
    s1x_parent["Attribute 1 value(s)"] = '21"-31", 26"-40"'

    corrected_variations: list[str] = []
    for row in rows:
        if row["Type"] != "variation":
            continue
        parent = by_sku.get(row["Parent"])
        if parent is None or parent["Type"] != "variable":
            raise RuntimeError(f"{row['SKU']}: missing variable parent {row['Parent']!r}")
        options = [option.strip() for option in parent["Attribute 1 value(s)"].split(",")]
        current = row["Attribute 1 value(s)"].strip()
        if current in options:
            continue
        matches = [option for option in options if comparison_key(option) == comparison_key(current)]
        if len(matches) != 1:
            raise RuntimeError(
                f"{row['SKU']}: {current!r} does not resolve uniquely within parent options {options!r}"
            )
        canonical = matches[0]
        row["Attribute 1 value(s)"] = canonical
        corrected_variations.append(row["SKU"])

    expected_count = 27
    if len(corrected_variations) != expected_count:
        raise RuntimeError(
            f"Expected {expected_count} mismatched variations, corrected {len(corrected_variations)}"
        )

    row_indexes = {values[EXPECTED_COLUMNS.index("SKU")]: index for index, values in enumerate(records[1:], start=1)}
    changed_skus = ["SP-S1X-A", *corrected_variations]
    for sku in changed_skus:
        row = by_sku[sku]
        physical_lines[row_indexes[sku]] = encode_row([row[field] for field in EXPECTED_COLUMNS])

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
    print(
        ("Applied" if args.apply else "Verified")
        + f": parent_options=1 variation_values={len(corrected_variations)} resolved_issues=28"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
