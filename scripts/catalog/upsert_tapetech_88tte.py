#!/usr/bin/env python3
"""Idempotently add the manufacturer-confirmed TapeTech 88TTE catalog record."""

from __future__ import annotations

import argparse
import csv
import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
ASSIGNMENTS = ROOT / "products/catalog/source/product_categories.csv"
SKU = "88TTE"


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\r\n")
        writer.writeheader()
        writer.writerows(rows)


def product_row(fields: list[str]) -> dict[str, str]:
    row = dict.fromkeys(fields, "")
    row.update(
        {
            "Type": "simple",
            "SKU": SKU,
            "GTIN, UPC, EAN, or ISBN": "873876000739",
            "Name": "TapeTech XTender Finishing Box Handle",
            "Published": "1",
            "Is featured?": "0",
            "Visibility in catalog": "visible",
            "Short description": (
                "The TapeTech XTender Finishing Box Handle extends from 41 to 63 inches "
                "and connects to TapeTech EasyClean, EasyClean High Capacity, and Power "
                "Assist finishing boxes for adjustable professional reach."
            ),
            "Description": (
                "<p>The TapeTech XTender Finishing Box Handle (88TTE) gives professional "
                "finishers adjustable reach without changing between fixed-length handles. "
                "Its telescoping anodized-aluminum body extends from 41 to 63 inches for wall "
                "and ceiling joint work.</p><h3>Features</h3><ul>"
                "<li><strong>Adjustable reach:</strong> Extends from 41 to 63 inches.</li>"
                "<li><strong>Finishing-box compatibility:</strong> Attaches to TapeTech EasyClean, "
                "EasyClean High Capacity, and Power Assist finishing boxes.</li>"
                "<li><strong>Anodized-aluminum construction:</strong> Built for regular professional "
                "finishing work.</li></ul>"
            ),
            "Tax status": "taxable",
            "In stock?": "1",
            "Backorders allowed?": "0",
            "Sold individually?": "0",
            "Weight (lbs)": "5",
            "Length (in)": "40",
            "Width (in)": "6",
            "Height (in)": "7",
            "Allow customer reviews?": "0",
            "Regular price": "378.00",
            "Cost of goods": "259.39",
            "Categories": "Taping & Finishing Tools > Automatic Taping Tools > Handles & Extensions",
            "Tags": "Drywall Finishing Tools, TapeTech",
            "Images": ",".join(
                f"https://drywalltoolbox.com/wp/wp-content/uploads/2026/media/tapetech_88tte_0{i}.webp"
                for i in range(1, 6)
            ),
            "Brands": "TapeTech",
            "Meta: schema_brand": "TapeTech",
            "Meta: schema_mpn": SKU,
            "Meta: _dtb_manufacturer_sku": SKU,
            "Meta: _dtb_mpn": SKU,
            "Meta: schema_condition": "NewCondition",
            "Meta: _dtb_brand_key": "tapetech",
            "Meta: _dtb_brand_label": "TapeTech",
            "Meta: _dtb_product_kind": "tool",
            "Meta: _dtb_commerce_mode": "purchasable",
            "Meta: _dtb_category_key": "automatic_taping_tools",
            "Meta: _dtb_display_category_key": "automatic_handles_extensions",
            "Meta: _dtb_is_parts": "0",
            "Meta: _dtb_schematic_brand": "TapeTech",
            "Meta: _dtb_brand": "TapeTech",
            "Meta: _dtb_specs_json": json.dumps(
                [
                    {"label": "Brand", "value": "TapeTech"},
                    {"label": "Part Number", "value": SKU},
                    {"label": "Model", "value": SKU},
                    {"label": "Adjustable Length", "value": "41-63 in"},
                ],
                separators=(",", ":"),
            ),
            "Meta: _dtb_schematic_id": "tapetech-88tte",
            "Meta: _dtb_schematic_category": "Handles",
            "Meta: _dtb_schematic_url": (
                "/schematics?brand=tapetech&category=Handles&schematic=tapetech-88tte"
            ),
            "Meta: _dtb_seo_title": "TapeTech XTender Finishing Box Handle 88TTE | 41-63 in",
            "Meta: _dtb_seo_description": (
                "Shop the TapeTech 88TTE XTender finishing box handle with adjustable "
                "41-to-63-inch reach for EasyClean and Power Assist finishing boxes."
            ),
            "Meta: _dtb_seo_focus_kw": "TapeTech 88TTE XTender finishing box handle",
            "Slug": "tapetech-xtender-finishing-box-handle-88tte",
            "meta:product_family": "TapeTech Handles",
            "meta:series": "XTender Finishing Box Handles",
            "meta:model": SKU,
            "Meta: _dtb_map_price": "378.00",
        }
    )
    return row


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    fields, original_rows = read_csv(CATALOG)
    rows = [dict(row) for row in original_rows]
    replacement = product_row(fields)
    existing = [index for index, row in enumerate(rows) if row.get("SKU") == SKU]
    if len(existing) > 1:
        raise SystemExit(f"duplicate {SKU} records found")
    if existing:
        rows[existing[0]] = replacement
    else:
        anchor = next(index for index, row in enumerate(rows) if row.get("SKU") == "8072TT")
        rows.insert(anchor + 1, replacement)

    assignment_fields, original_assignments = read_csv(ASSIGNMENTS)
    assignments = [dict(row) for row in original_assignments]
    assignment = {
        "sku": SKU,
        "taxon_key": "automatic_handles_extensions",
        "position": "10",
        "evidence": "TapeTech manufacturer product page and exact catalog path",
        "review_status": "approved",
    }
    matching = [index for index, row in enumerate(assignments) if row.get("sku") == SKU]
    if len(matching) > 1:
        raise SystemExit(f"duplicate {SKU} category assignments found")
    if matching:
        assignments[matching[0]] = assignment
    else:
        assignments.append(assignment)
        assignments.sort(key=lambda row: row["sku"].casefold())

    changed = rows != original_rows or assignments != original_assignments
    print(
        f"mode={'apply' if args.apply else 'preview'} sku={SKU} catalog_rows={len(rows)} "
        f"assignments={len(assignments)} changed={str(changed).lower()}"
    )
    if not args.apply:
        return 0

    if not changed:
        print("no changes required")
        return 0

    shutil.copy2(CATALOG, CATALOG.with_suffix(".csv.bak"))
    shutil.copy2(ASSIGNMENTS, ASSIGNMENTS.with_suffix(".csv.bak"))
    write_csv(CATALOG, fields, rows)
    write_csv(ASSIGNMENTS, assignment_fields, assignments)
    print(f"wrote={CATALOG}")
    print(f"wrote={ASSIGNMENTS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
