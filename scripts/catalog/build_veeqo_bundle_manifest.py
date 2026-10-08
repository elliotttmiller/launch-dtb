#!/usr/bin/env python3
"""Build a catalog-backed Veeqo kit composition source CSV.

This SKU-keyed composition file is not a Veeqo product-CSV import. Veeqo's
documented bundle UI/API must be used to create bundle contents; the API needs
live Veeqo sellable IDs that are intentionally not inferred from local files.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
DEFAULT_VEEQO_PRODUCTS = ROOT / "products/launch/official/veeqo_inventory.csv"
DEFAULT_OUTPUT = ROOT / "products/launch/official/veeqo_bundle_reconciliation_only.csv"
QUANTITY_PREFIX = re.compile(r"^\s*(\d+)\s*[x×]\s*(.*?)\s*$", re.IGNORECASE)
HEADERS = (
    "kit_sku",
    "kit_title",
    "kit_variant_title",
    "kit_catalog_type",
    "kit_catalog_published",
    "component_sku",
    "component_title",
    "component_veeqo_product_title",
    "component_quantity",
    "component_source_index",
)


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"CSV has no header row: {path}")
        return reader.fieldnames, list(reader)


def component_parts(name: str, sku: str, kit_sku: str, index: int) -> tuple[str, int]:
    if not sku:
        raise ValueError(f"{kit_sku}: component {index} has no component SKU")
    match = QUANTITY_PREFIX.match(name)
    if not match:
        raise ValueError(
            f"{kit_sku}: component {index} ({sku}) has no explicit quantity prefix: {name!r}"
        )
    quantity = int(match.group(1))
    title = match.group(2).strip()
    if quantity < 1 or not title:
        raise ValueError(f"{kit_sku}: invalid component definition at index {index}")
    return title, quantity


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--veeqo-products", type=Path, default=DEFAULT_VEEQO_PRODUCTS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    catalog_headers, catalog_rows = read_csv(args.catalog)
    veeqo_headers, veeqo_rows = read_csv(args.veeqo_products)
    required_catalog = {"Type", "SKU", "Name", "Published"}
    if missing := required_catalog - set(catalog_headers):
        raise ValueError(f"Official catalog is missing required columns: {sorted(missing)}")
    if not {"sku_code", "product_title", "variant_title"}.issubset(veeqo_headers):
        raise ValueError("Veeqo product import is missing sku_code/product_title/variant_title columns")

    veeqo_by_sku: dict[str, list[dict[str, str]]] = {}
    for row in veeqo_rows:
        sku = (row.get("sku_code") or "").strip()
        if sku:
            veeqo_by_sku.setdefault(sku, []).append(row)

    errors: list[str] = []
    output_rows: list[dict[str, str]] = []
    kit_skus: set[str] = set()
    component_skus: set[str] = set()
    component_lines_in_catalog = 0
    omitted_variable_parents = 0

    for row in catalog_rows:
        source_type = (row.get("Type") or "").strip().lower()
        kit_sku = (row.get("SKU") or "").strip()
        definitions: list[tuple[int, str, str]] = []
        for index in range(1, len(catalog_headers) + 1):
            name = (row.get(f"Meta: _includes_{index}_name") or "").strip()
            sku = (row.get(f"Meta: _includes_{index}_sku") or "").strip()
            if name or sku:
                definitions.append((index, name, sku))
        if not definitions:
            continue
        component_lines_in_catalog += len(definitions)
        if source_type == "variable":
            omitted_variable_parents += 1
            continue
        if source_type not in {"simple", "variation"}:
            errors.append(f"{kit_sku or '<blank SKU>'}: unsupported sellable catalog type {source_type!r}")
            continue
        if not kit_sku:
            errors.append(f"Catalog row {row.get('Name')!r} has components but no kit SKU")
            continue
        if kit_sku in kit_skus:
            errors.append(f"Duplicate kit SKU in official catalog: {kit_sku}")
            continue
        kit_skus.add(kit_sku)

        kit_matches = veeqo_by_sku.get(kit_sku, [])
        if len(kit_matches) != 1:
            errors.append(f"{kit_sku}: expected exactly one Veeqo product-import row, found {len(kit_matches)}")
            kit_import = {}
        else:
            kit_import = kit_matches[0]

        # Repeated references to the same component SKU become one API/UI component with summed qty.
        aggregated: dict[str, dict[str, object]] = {}
        for index, raw_name, component_sku in definitions:
            try:
                title, quantity = component_parts(raw_name, component_sku, kit_sku, index)
            except ValueError as exc:
                errors.append(str(exc))
                continue
            component_skus.add(component_sku)
            if component_sku not in aggregated:
                aggregated[component_sku] = {"title": title, "quantity": 0, "indices": []}
            entry = aggregated[component_sku]
            entry["quantity"] = int(entry["quantity"]) + quantity
            entry["indices"].append(str(index))  # type: ignore[union-attr]

        if len(aggregated) > 25:
            errors.append(f"{kit_sku}: {len(aggregated)} distinct components exceeds Veeqo's documented 25-item limit")
        for component_sku, entry in aggregated.items():
            component_matches = veeqo_by_sku.get(component_sku, [])
            if len(component_matches) != 1:
                errors.append(
                    f"{kit_sku}: component {component_sku} must match exactly one Veeqo product row; found {len(component_matches)}"
                )
                component_import = {}
            else:
                component_import = component_matches[0]
            output_rows.append(
                {
                    "kit_sku": kit_sku,
                    "kit_title": (row.get("Name") or "").strip(),
                    "kit_variant_title": (kit_import.get("variant_title") or "").strip(),
                    "kit_catalog_type": source_type,
                    "kit_catalog_published": (row.get("Published") or "").strip(),
                    "component_sku": component_sku,
                    "component_title": str(entry["title"]),
                    "component_veeqo_product_title": (component_import.get("product_title") or "").strip(),
                    "component_quantity": str(entry["quantity"]),
                    "component_source_index": ";".join(entry["indices"]),  # type: ignore[arg-type]
                }
            )

    overlap = sorted(kit_skus & component_skus)
    if overlap:
        errors.append("Kit SKU(s) also appear as component SKU(s); Veeqo does not support nested bundles: " + ", ".join(overlap))
    missing_skus = sorted(sku for sku in kit_skus | component_skus if not veeqo_by_sku.get(sku))
    duplicate_skus = sorted(sku for sku in kit_skus | component_skus if len(veeqo_by_sku.get(sku, [])) > 1)
    if missing_skus:
        errors.append("SKU(s) missing from current Veeqo product import: " + ", ".join(missing_skus))
    if duplicate_skus:
        errors.append("SKU(s) duplicated in current Veeqo product import: " + ", ".join(duplicate_skus))
    if errors:
        raise ValueError("Bundle composition validation failed:\n- " + "\n- ".join(errors))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=HEADERS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(output_rows)

    report = {
        "composition_source_csv": str(args.output.relative_to(ROOT)) if args.output.is_relative_to(ROOT) else str(args.output),
        "catalog_source": str(args.catalog.relative_to(ROOT)) if args.catalog.is_relative_to(ROOT) else str(args.catalog),
        "veeqo_product_projection_checked": str(args.veeqo_products.relative_to(ROOT)) if args.veeqo_products.is_relative_to(ROOT) else str(args.veeqo_products),
        "sellable_kits": len(kit_skus),
        "component_rows": len(output_rows),
        "unique_component_skus": len(component_skus),
        "catalog_component_lines_including_nonsellable_variable_parent": component_lines_in_catalog,
        "nonsellable_variable_parents_omitted": omitted_variable_parents,
        "all_kit_and_component_skus_match_exactly_one_veeqo_import_row": True,
        "all_component_quantities_explicit_in_catalog": True,
        "stock_quantities_included": False,
        "veeqo_variant_ids_included": False,
        "directly_importable_in_veeqo_product_csv_wizard": False,
        "next_step": "Create each kit using Veeqo bundle UI or API; resolve live sellable IDs before API mutation.",
    }
    report_path = args.output.with_suffix(".report.json")
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, csv.Error) as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)
