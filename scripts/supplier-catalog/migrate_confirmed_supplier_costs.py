#!/usr/bin/env python3
"""Project exact or reviewed TSW descriptions and costs into the launch catalog."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import sys
import tempfile
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "catalog"))
from official_catalog_schema import (  # noqa: E402
    CatalogValidationError,
    create_catalog_backup,
    validate_catalog,
)


DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_SOURCE = HERE / "results" / "cost" / "tsw-costs.csv"
DEFAULT_APPROVALS = HERE / "approved-launch-catalog-matches.json"
DEFAULT_GAPS = DEFAULT_CATALOG.with_name("dtb_official_catalog.include-gaps.json")
DEFAULT_REPORT = HERE / "results" / "cost" / "tsw-supplier-cost-migration-report.json"
COST_FIELD = "Cost of goods"
DESCRIPTION_FIELD = "Description"
IDENTIFIER_FIELDS = ("SKU", "Meta: schema_mpn", "Meta: _dtb_manufacturer_sku", "Meta: _dtb_mpn", "meta:model")


class MigrationError(RuntimeError):
    pass


def clean(value: object) -> str:
    return " ".join(str(value or "").replace("\ufeff", "").split())


def normalize_identifier(value: object) -> str:
    return re.sub(r"[\s\-_./]+", "", clean(value)).upper()


def exact_identifier(value: object) -> str:
    return clean(value).casefold()


def normalize_brand(value: object) -> str:
    token = re.sub(r"[^a-z0-9]+", "", clean(value).casefold())
    aliases = {
        "columbia": "columbia", "columbiatools": "columbia", "columbiatapingtools": "columbia",
        "tapetech": "tapetech", "tapetechtoolcompanyinc": "tapetech",
        "durastilts": "durastilts", "surpro": "surpro",
        "usgsheetrocktools": "usgsheetrocktools",
    }
    return aliases.get(token, token)


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                raise MigrationError(f"{path}: missing CSV header")
            return list(reader.fieldnames), list(reader)
    except OSError as exc:
        raise MigrationError(f"Cannot read {path}: {exc}") from exc


def parse_cost(value: str, *, supplier_sku: str) -> str:
    try:
        cost = Decimal(value.strip())
    except InvalidOperation as exc:
        raise MigrationError(f"{supplier_sku}: invalid supplier cost {value!r}") from exc
    if not cost.is_finite() or cost <= 0:
        raise MigrationError(f"{supplier_sku}: supplier cost must be positive")
    return format(cost.quantize(Decimal("0.01")), ".2f")


def load_source(path: Path) -> tuple[dict[tuple[str, str], dict[str, str]], int]:
    fields, rows = read_csv(path)
    required = {"brand", "sku", "supplier_cost", "product_description_html"}
    if missing := sorted(required - set(fields)):
        raise MigrationError(f"{path}: missing supplier fields: {', '.join(missing)}")
    records: dict[tuple[str, str], dict[str, str]] = {}
    duplicate_rows = 0
    for row_number, row in enumerate(rows, start=2):
        key = (normalize_brand(row["brand"]), normalize_identifier(row["sku"]))
        if not all(key):
            raise MigrationError(f"{path}:{row_number}: brand and SKU are required")
        cost = parse_cost(row["supplier_cost"], supplier_sku=row["sku"])
        description = row["product_description_html"].strip()
        if not description:
            raise MigrationError(f"{path}:{row_number}: TSW description is empty for {row['sku']}")
        product = {"brand": row["brand"].strip(), "sku": row["sku"].strip(), "cost": cost, "description": description}
        previous = records.get(key)
        if previous:
            if (previous["cost"], previous["description"]) != (cost, description):
                raise MigrationError(f"{path}:{row_number}: conflicting duplicate supplier record {row['brand']} / {row['sku']}")
            duplicate_rows += 1
            continue
        records[key] = product
    return records, duplicate_rows


def load_approvals(path: Path) -> dict[tuple[str, str], str]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError) as exc:
        raise MigrationError(f"Cannot read reviewed mappings {path}: {exc}") from exc
    if not isinstance(payload, dict) or payload.get("schema_version") != 1 or not isinstance(payload.get("matches"), list):
        raise MigrationError(f"{path}: expected schema_version 1 and matches array")
    result: dict[tuple[str, str], str] = {}
    for entry in payload["matches"]:
        key = (normalize_brand(entry.get("supplier_brand")), normalize_identifier(entry.get("supplier_sku")))
        target = clean(entry.get("catalog_sku"))
        if not all(key) or not target:
            raise MigrationError(f"{path}: incomplete reviewed mapping")
        if key in result and result[key] != target:
            raise MigrationError(f"{path}: conflicting reviewed mappings for {key}")
        result[key] = target
    return result


def catalog_candidates(rows: list[dict[str, str]]) -> tuple[
    dict[tuple[str, str], set[str]], dict[tuple[str, str], set[str]],
    dict[tuple[str, str], set[str]], dict[str, dict[str, str]]
]:
    sku_index: dict[tuple[str, str], set[str]] = defaultdict(set)
    exact_index: dict[tuple[str, str], set[str]] = defaultdict(set)
    normalized_index: dict[tuple[str, str], set[str]] = defaultdict(set)
    by_sku: dict[str, dict[str, str]] = {}
    for row in rows:
        sku = clean(row.get("SKU"))
        if not sku:
            raise MigrationError("Official catalog contains a row without SKU")
        if sku in by_sku:
            raise MigrationError(f"Official catalog contains duplicate SKU {sku}")
        by_sku[sku] = row
        brand = normalize_brand(row.get("Brands") or row.get("Meta: _dtb_brand"))
        sku_literal = exact_identifier(sku)
        if brand and sku_literal:
            sku_index[(brand, sku_literal)].add(sku)
        for field in IDENTIFIER_FIELDS:
            raw_identifier = row.get(field)
            exact = exact_identifier(raw_identifier)
            normalized = normalize_identifier(raw_identifier)
            if brand and exact:
                exact_index[(brand, exact)].add(sku)
            if brand and normalized:
                normalized_index[(brand, normalized)].add(sku)
    return sku_index, exact_index, normalized_index, by_sku


def resolve_targets(
    source: dict[tuple[str, str], dict[str, str]],
    sku_index: dict[tuple[str, str], set[str]],
    exact_index: dict[tuple[str, str], set[str]],
    normalized_index: dict[tuple[str, str], set[str]],
    by_sku: dict[str, dict[str, str]],
    approvals: dict[tuple[str, str], str],
) -> tuple[dict[str, dict[str, str]], dict[str, object]]:
    candidates: dict[str, list[dict[str, str]]] = defaultdict(list)
    ambiguous_sources: list[dict[str, str]] = []
    unmatched_source: list[dict[str, str]] = []
    match_basis = Counter()
    for key, product in source.items():
        literal_key = (key[0], exact_identifier(product["sku"]))
        exact = sku_index.get(literal_key, set())
        if not exact:
            exact = exact_index.get(literal_key, set())
        if not exact:
            exact = normalized_index.get(key, set())
        if len(exact) == 1:
            target = next(iter(exact))
            basis = "brand_scoped_exact_identifier"
        elif len(exact) > 1:
            ambiguous_sources.append({"supplier_brand": product["brand"], "supplier_sku": product["sku"], "candidate_catalog_skus": sorted(exact)})
            continue
        elif key in approvals:
            target = approvals[key]
            if target not in by_sku:
                raise MigrationError(f"Reviewed mapping target does not exist: {product['brand']} / {product['sku']} -> {target}")
            catalog_brand = normalize_brand(by_sku[target].get("Brands") or by_sku[target].get("Meta: _dtb_brand"))
            if catalog_brand != key[0]:
                raise MigrationError(f"Reviewed mapping crosses brand boundary: {product['brand']} / {product['sku']} -> {target}")
            basis = "reviewed_explicit_mapping"
        else:
            unmatched_source.append({"supplier_brand": product["brand"], "supplier_sku": product["sku"]})
            continue
        candidates[target].append({**product, "match_basis": basis})
        match_basis[basis] += 1

    resolved: dict[str, dict[str, str]] = {}
    target_conflicts: list[dict[str, object]] = []
    for target, products in candidates.items():
        unique_data = {(item["cost"], item["description"]) for item in products}
        if len(unique_data) != 1:
            target_conflicts.append({
                "catalog_sku": target,
                "source_records": [{"supplier_brand": item["brand"], "supplier_sku": item["sku"]} for item in products],
            })
            continue
        first = products[0]
        resolved[target] = first
    return resolved, {
        "match_basis_counts": dict(sorted(match_basis.items())),
        "ambiguous_source_rows": ambiguous_sources,
        "unmatched_source_rows": unmatched_source,
        "conflicting_catalog_targets": target_conflicts,
    }


def write_csv_atomic(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    handle = tempfile.NamedTemporaryFile("w", encoding="utf-8-sig", newline="", delete=False, dir=path.parent, prefix=path.name + ".", suffix=".tmp")
    temp_path = Path(handle.name)
    try:
        with handle:
            writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\r\n", extrasaction="raise")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temp_path, path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def write_report(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="\n", delete=False, dir=path.parent, prefix=path.name + ".", suffix=".tmp")
    temp = Path(handle.name)
    try:
        with handle:
            handle.write(json.dumps(payload, indent=2, sort_keys=True) + "\n")
        os.replace(temp, path)
    except Exception:
        temp.unlink(missing_ok=True)
        raise


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--approvals", type=Path, default=DEFAULT_APPROVALS)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--apply", action="store_true", help="Write matched TSW descriptions and costs; otherwise preview")
    args = parser.parse_args()
    catalog_path = args.catalog.resolve()
    validate_catalog(catalog_path, DEFAULT_GAPS)
    before = sha256(catalog_path)
    fields, rows = read_csv(catalog_path)
    for field in (COST_FIELD, DESCRIPTION_FIELD):
        if field not in fields:
            raise MigrationError(f"Official catalog is missing required field {field!r}")
    source, duplicate_rows = load_source(args.source.resolve())
    approvals = load_approvals(args.approvals.resolve())
    sku_index, exact_index, normalized_index, by_sku = catalog_candidates(rows)
    resolved, resolution_report = resolve_targets(source, sku_index, exact_index, normalized_index, by_sku, approvals)

    cost_changes = 0
    description_changes = 0
    for row in rows:
        desired = resolved.get(clean(row.get("SKU")))
        if not desired:
            continue
        if (row.get(COST_FIELD) or "").strip() != desired["cost"]:
            row[COST_FIELD] = desired["cost"]
            cost_changes += 1
        if (row.get(DESCRIPTION_FIELD) or "").strip() != desired["description"]:
            row[DESCRIPTION_FIELD] = desired["description"]
            description_changes += 1

    changed = cost_changes + description_changes > 0
    backup = None
    if args.apply and changed:
        if sha256(catalog_path) != before:
            raise MigrationError("Official catalog changed during migration; refusing to overwrite concurrent changes")
        backup = str(create_catalog_backup(catalog_path))
        write_csv_atomic(catalog_path, fields, rows)
        validate_catalog(catalog_path, DEFAULT_GAPS)

    row_skus = {clean(row.get("SKU")) for row in rows}
    report: dict[str, object] = {
        "schema_version": 2,
        "mode": "apply" if args.apply else "preview",
        "catalog": str(catalog_path),
        "source": str(args.source.resolve()),
        "source_unique_brand_sku_rows": len(source),
        "source_duplicate_identical_rows_collapsed": duplicate_rows,
        "confirmed_catalog_targets": len(resolved),
        "catalog_rows": len(rows),
        "catalog_rows_without_resolved_tsw_match": len(row_skus - set(resolved)),
        "costs_changed": cost_changes,
        "descriptions_changed": description_changes,
        "catalog_rows_with_resolved_source_data": len(resolved),
        "catalog_rows_without_tsw_cost_or_description_source": len(rows) - len(resolved),
        "resolved_mappings": [
            {
                "supplier_brand": product["brand"],
                "supplier_sku": product["sku"],
                "catalog_sku": sku,
                "match_basis": product["match_basis"],
            }
            for sku, product in sorted(resolved.items())
        ],
        "source_sha256": sha256(args.source.resolve()),
        "catalog_sha256_before": before,
        "catalog_sha256_after": sha256(catalog_path) if args.apply and changed else before,
        "rollback_snapshot": backup,
        "would_change_catalog": changed,
        **resolution_report,
    }
    write_report(args.report.resolve(), report)
    print(json.dumps({key: value for key, value in report.items() if key not in {"resolved_mappings", "ambiguous_source_rows", "unmatched_source_rows", "conflicting_catalog_targets"}} | {
        "ambiguous_source_count": len(report["ambiguous_source_rows"]),
        "unmatched_source_count": len(report["unmatched_source_rows"]),
        "conflicting_catalog_target_count": len(report["conflicting_catalog_targets"]),
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (MigrationError, CatalogValidationError, OSError, csv.Error) as exc:
        raise SystemExit(f"ERROR: {exc}")
