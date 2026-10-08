#!/usr/bin/env python3
"""Build a Veeqo /kits batch CSV from the official catalog and Veeqo export.

The generated three-column CSV matches the input expected by the referenced
Veeqo kit API example. It is not a Veeqo product-importer CSV and performs no
API calls. The export's product_id values must be confirmed as sellable IDs
before the CSV is submitted to the API.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import sys
import tempfile
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products/launch/official/dtb_official_catalog.csv"
DEFAULT_SELLABLES = ROOT / "products/launch/official/sellables_export_2770278192-f6f5ffd2dc459320261008-24-6fqkyj_original.csv"
DEFAULT_OUTPUT = ROOT / "products/launch/official/veeqo_bundle_api_import_candidate.csv"
DEFAULT_AUDIT = ROOT / "products/launch/official/veeqo_bundle_api_import_candidate_audit.csv"
DEFAULT_REPORT = ROOT / "products/launch/official/veeqo_bundle_api_import_candidate.report.json"
QUANTITY_PREFIX = re.compile(r"^\s*(\d+)\s*[x×]\s*(.*?)\s*$", re.IGNORECASE)
INCLUDE_NAME = re.compile(r"^Meta: _includes_(\d+)_name$")
API_HEADERS = ("product_id", "component_id", "quantity")
AUDIT_HEADERS = ("product_id", "kit_sku", "component_id", "component_sku", "quantity")


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"CSV has no header row: {path}")
        return reader.fieldnames, list(reader)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_csv_atomic(path: Path, headers: tuple[str, ...], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", newline="", dir=path.parent,
            prefix=f".{path.name}.", suffix=".tmp", delete=False,
        ) as handle:
            temp_name = handle.name
            writer = csv.DictWriter(handle, fieldnames=headers, lineterminator="\n", extrasaction="raise")
            writer.writeheader()
            writer.writerows(rows)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
    finally:
        if temp_name and os.path.exists(temp_name):
            os.unlink(temp_name)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--sellables-export", type=Path, default=DEFAULT_SELLABLES)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--audit-output", type=Path, default=DEFAULT_AUDIT)
    parser.add_argument("--report-output", type=Path, default=DEFAULT_REPORT)
    args = parser.parse_args()

    catalog_headers, catalog_rows = read_csv(args.catalog)
    sellable_headers, sellable_rows = read_csv(args.sellables_export)
    required_catalog = {"Type", "SKU", "Name"}
    if missing := required_catalog - set(catalog_headers):
        raise ValueError(f"Official catalog is missing required columns: {sorted(missing)}")
    required_sellables = {"sku_code", "product_id"}
    if missing := required_sellables - set(sellable_headers):
        raise ValueError(f"Veeqo sellables export is missing columns: {sorted(missing)}")
    component_indices = sorted(
        int(match.group(1)) for header in catalog_headers
        if (match := INCLUDE_NAME.fullmatch(header))
    )
    if not component_indices:
        raise ValueError("Official catalog has no Meta: _includes_N_name component columns")

    sellables_by_sku: dict[str, list[dict[str, str]]] = defaultdict(list)
    seen_ids: dict[str, str] = {}
    for line_number, row in enumerate(sellable_rows, start=2):
        sku = (row.get("sku_code") or "").strip()
        product_id = (row.get("product_id") or "").strip()
        if not sku:
            raise ValueError(f"Sellables export row {line_number} has a blank SKU")
        if not product_id.isdigit() or int(product_id) <= 0:
            raise ValueError(f"Sellables export row {line_number} has an invalid product_id for SKU {sku!r}")
        if product_id in seen_ids and seen_ids[product_id] != sku:
            raise ValueError(f"Veeqo ID {product_id} is assigned to multiple SKUs: {seen_ids[product_id]} and {sku}")
        seen_ids[product_id] = sku
        sellables_by_sku[sku].append(row)

    errors: list[str] = []
    kit_skus: set[str] = set()
    component_skus: set[str] = set()
    compositions: list[tuple[str, str, int]] = []
    for row_number, row in enumerate(catalog_rows, start=2):
        product_type = (row.get("Type") or "").strip().lower()
        kit_sku = (row.get("SKU") or "").strip()
        definitions: list[tuple[int, str, str]] = []
        for index in component_indices:
            name = (row.get(f"Meta: _includes_{index}_name") or "").strip()
            sku = (row.get(f"Meta: _includes_{index}_sku") or "").strip()
            if name or sku:
                definitions.append((index, name, sku))
        if not definitions:
            continue
        if product_type == "variable":
            # Variable parents are not sellables; their concrete variations are.
            continue
        if product_type not in {"simple", "variation"}:
            errors.append(f"Catalog row {row_number} ({kit_sku or 'blank SKU'}): unsupported type {product_type!r}")
            continue
        if not kit_sku:
            errors.append(f"Catalog row {row_number}: kit has components but no SKU")
            continue
        if kit_sku in kit_skus:
            errors.append(f"Duplicate kit SKU in official catalog: {kit_sku}")
            continue
        kit_skus.add(kit_sku)
        for index, name, component_sku in definitions:
            match = QUANTITY_PREFIX.fullmatch(name)
            if not component_sku or not match or not match.group(2).strip():
                errors.append(f"{kit_sku}: component index {index} needs a SKU and explicit '<quantity>x <name>'")
                continue
            quantity = int(match.group(1))
            if quantity < 1:
                errors.append(f"{kit_sku}: component {component_sku} has non-positive quantity {quantity}")
                continue
            component_skus.add(component_sku)
            compositions.append((kit_sku, component_sku, quantity))

    overlap = sorted(kit_skus & component_skus)
    if overlap:
        errors.append("Nested kit/component SKU(s) are not supported: " + ", ".join(overlap))
    for sku in sorted(kit_skus | component_skus):
        matches = sellables_by_sku.get(sku, [])
        if len(matches) != 1:
            errors.append(f"SKU {sku}: expected exactly one Veeqo sellable export row, found {len(matches)}")
    if errors:
        raise ValueError("Bundle API CSV validation failed:\n- " + "\n- ".join(errors))

    api_rows: list[dict[str, str]] = []
    audit_rows: list[dict[str, str]] = []
    per_kit: dict[str, int] = defaultdict(int)
    for kit_sku, component_sku, quantity in compositions:
        kit_id = (sellables_by_sku[kit_sku][0]["product_id"]).strip()
        component_id = (sellables_by_sku[component_sku][0]["product_id"]).strip()
        api_rows.append({"product_id": kit_id, "component_id": component_id, "quantity": str(quantity)})
        audit_rows.append({
            "product_id": kit_id,
            "kit_sku": kit_sku,
            "component_id": component_id,
            "component_sku": component_sku,
            "quantity": str(quantity),
        })
        per_kit[kit_sku] += 1
    excessive = {sku: count for sku, count in per_kit.items() if count > 25}
    if excessive:
        raise ValueError("Bundle exceeds Veeqo's 25-component limit: " + ", ".join(f"{sku}={count}" for sku, count in excessive.items()))

    write_csv_atomic(args.output, API_HEADERS, api_rows)
    write_csv_atomic(args.audit_output, AUDIT_HEADERS, audit_rows)
    report = {
        "api_csv": str(args.output.relative_to(ROOT)) if args.output.is_relative_to(ROOT) else str(args.output),
        "audit_csv": str(args.audit_output.relative_to(ROOT)) if args.audit_output.is_relative_to(ROOT) else str(args.audit_output),
        "source_catalog": str(args.catalog.relative_to(ROOT)) if args.catalog.is_relative_to(ROOT) else str(args.catalog),
        "source_sellables_export": str(args.sellables_export.relative_to(ROOT)) if args.sellables_export.is_relative_to(ROOT) else str(args.sellables_export),
        "source_sha256": {"catalog": sha256(args.catalog), "sellables_export": sha256(args.sellables_export)},
        "kit_count": len(kit_skus),
        "component_line_count": len(api_rows),
        "unique_component_sku_count": len(component_skus),
        "all_referenced_skus_resolve_to_one_numeric_veeqo_id": True,
        "veeqo_ids_unique_across_referenced_skus": True,
        "stock_fields_included": False,
        "prices_or_costs_included": False,
        "direct_veeqo_product_csv_import": False,
        "intended_consumer": "Bulk /kits API script that expects product_id, component_id, quantity columns",
        "source_id_column": "product_id from the supplied Veeqo sellables export",
        "api_id_semantics": "The Veeqo POST /kits endpoint requires product_variant_id values. This CSV puts export product_id values in the linked community script's product_id/component_id columns; confirm the export IDs are sellable IDs before any API submission.",
        "api_id_type_verified": False,
        "requires_live_preflight_before_submission": True,
        "live_api_mutation_performed": False,
        "operational_note": "POST /kits converts the kit sellable into a bundle; inspect existing bundles and open orders before any live submission. The referenced community script posts each kit and is not an idempotent reconciliation tool.",
    }
    args.report_output.parent.mkdir(parents=True, exist_ok=True)
    args.report_output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, csv.Error) as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)
