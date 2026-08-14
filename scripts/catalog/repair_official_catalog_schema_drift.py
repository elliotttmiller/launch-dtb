#!/usr/bin/env python3
"""Repair the three verified rows written against superseded catalog layouts."""

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

REPAIRS = {
    "AH8-CLIP": {
        "mpn": "AH8",
        "default_variation": "AH8A",
        "spec_source": "Meta: _includes_1_sku",
    },
    "AH9-CLIP": {
        "mpn": "AH9",
        "default_variation": "AH9A",
        "spec_source": "Meta: _includes_1_name",
    },
}


def repair_row(row: dict[str, str]) -> dict[str, str]:
    sku = row["SKU"]
    if sku == "14TT":
        if row["Meta: _dtb_specs_json"] or not row["Meta: _includes_0_name"].startswith("["):
            raise RuntimeError("14TT no longer matches the reviewed schema-drift signature")
        row["Meta: _dtb_specs_json"] = row["Meta: _includes_0_name"]
        row["Meta: _includes_0_name"] = ""
        return row

    config = REPAIRS[sku]
    spec_source = config["spec_source"]
    specs = row[spec_source]
    if not specs.startswith("["):
        raise RuntimeError(f"{sku} no longer matches the reviewed schema-drift signature")

    # Clear only the current metadata span. WooCommerce core fields and the trailing
    # SEO/slug/family fields were already aligned and are intentionally preserved.
    first = EXPECTED_COLUMNS.index("Meta: schema_brand")
    last = EXPECTED_COLUMNS.index("Meta: _dtb_schematic_url")
    for field in EXPECTED_COLUMNS[first : last + 1]:
        row[field] = ""

    row.update({
        "Meta: schema_brand": "Columbia Tools",
        "Meta: schema_mpn": config["mpn"],
        "Meta: schema_condition": "NewCondition",
        "Meta: _dtb_brand_key": "columbia-tools",
        "Meta: _dtb_brand_label": "Columbia Tools",
        "Meta: _dtb_product_kind": "part",
        "Meta: _dtb_commerce_mode": "quote_only",
        "Meta: _dtb_category_key": "parts",
        "Meta: _dtb_display_category_key": "parts",
        "Meta: _dtb_is_parts": "1",
        "Meta: _dtb_variation_axis": "Model",
        "Meta: _dtb_default_variation_sku": config["default_variation"],
        "Meta: _dtb_inherit_parent_image": "0",
        "Meta: _dtb_schematic_brand": "columbia-tools",
        "Meta: _dtb_schematic_group": "columbia-angle-head",
        "Meta: _dtb_brand": "Columbia Tools",
        "Meta: _dtb_specs_json": specs,
    })
    return row


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    path = args.catalog.resolve()

    raw = path.read_text(encoding="utf-8-sig")
    physical_lines = raw.splitlines(keepends=True)
    parsed = list(csv.reader(io.StringIO(raw, newline="")))
    if len(parsed) != len(physical_lines):
        raise RuntimeError("Targeted repair requires one physical line per CSV record")
    if tuple(parsed[0]) != EXPECTED_COLUMNS:
        raise RuntimeError("Catalog header does not match the canonical schema")

    targets = {"AH8-CLIP", "AH9-CLIP", "14TT"}
    repaired: list[str] = []
    for index, values in enumerate(parsed[1:], start=1):
        if len(values) != len(EXPECTED_COLUMNS):
            raise RuntimeError(f"CSV record {index + 1} has {len(values)} columns")
        row = dict(zip(EXPECTED_COLUMNS, values))
        if row["SKU"] not in targets:
            continue
        repair_row(row)
        buffer = io.StringIO(newline="")
        csv.writer(buffer, lineterminator="\r\n").writerow([row[field] for field in EXPECTED_COLUMNS])
        physical_lines[index] = buffer.getvalue()
        repaired.append(row["SKU"])

    if set(repaired) != targets:
        raise RuntimeError(f"Expected {sorted(targets)}, found {sorted(repaired)}")
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
    print(("Applied" if args.apply else "Verified") + ": " + ", ".join(sorted(repaired)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
