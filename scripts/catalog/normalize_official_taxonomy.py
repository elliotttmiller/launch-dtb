#!/usr/bin/env python3
"""Normalize every official-catalog row with one brand-independent policy.

Preview is the default. Owners resolve from the canonical product_cat registry;
variations inherit the exact owner tuple. An unresolved owner or parent blocks
all writes so a partial taxonomy migration cannot be published.

Standalone --apply creates a rollback snapshot. The unified catalog runner uses
--no-backup after creating one run-level snapshot for the complete safe-fix set.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

from catalog_taxonomy_policy import CATEGORY_FIELD, DISPLAY_FIELD, canonical_values, taxon_for_path
from official_catalog_schema import (
    CatalogValidationError,
    create_catalog_backup,
    validate_catalog,
    validate_catalog_taxonomy,
    validate_taxonomy_rows,
    write_catalog_atomic,
)

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.include-gaps.json"

def value(row: dict[str, str], field: str) -> str:
    return (row.get(field) or "").strip()


def parse_assignments(raw_assignments: list[str], by_sku: dict[str, dict[str, str]]) -> dict[str, str]:
    assignments: dict[str, str] = {}
    for raw in raw_assignments:
        sku, separator, path = raw.partition("=")
        sku = sku.strip()
        path = path.strip()
        if not separator or not sku or not path:
            raise CatalogValidationError("--assignment must use SKU=canonical product_cat path")
        row = by_sku.get(sku)
        if row is None:
            raise CatalogValidationError(f"taxonomy assignment SKU is absent: {sku}")
        if value(row, "Type").casefold() == "variation":
            raise CatalogValidationError(f"taxonomy assignment must target an owner row, not variation {sku}")
        taxon = taxon_for_path(path)
        if taxon is None or taxon.path != path:
            raise CatalogValidationError(f"taxonomy assignment is not an exact canonical path: {sku}={path}")
        if sku in assignments and assignments[sku] != path:
            raise CatalogValidationError(f"conflicting taxonomy assignments for {sku}")
        assignments[sku] = path
    return assignments


def build_changes(
    rows: list[dict[str, str]], assignments: dict[str, str] | None = None
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    """Return deterministic changes and any rows that prevent a complete run."""
    changes: list[dict[str, str]] = []
    unresolved: list[dict[str, str]] = []
    by_sku = {value(row, "SKU"): row for row in rows}
    assignments = assignments or {}

    for row in rows:
        sku = value(row, "SKU")
        parent_sku = value(row, "Parent") or value(row, "Meta: _dtb_parent_product_sku")
        parent = by_sku.get(parent_sku) if value(row, "Type").casefold() == "variation" else None
        policy_row = dict(row)
        if sku in assignments:
            policy_row["Categories"] = assignments[sku]
        policy_parent = dict(parent) if parent else None
        if policy_parent and parent_sku in assignments:
            policy_parent["Categories"] = assignments[parent_sku]
        expected = canonical_values(policy_row, policy_parent)
        if expected is None:
            unresolved.append(
                {
                    "sku": sku,
                    "type": value(row, "Type"),
                    "parent_sku": parent_sku,
                    "categories": value(row, "Categories"),
                    "reason": "missing parent" if parent_sku and parent is None else "navigation path is not in the canonical registry",
                }
            )
            continue
        for field, expected_value in expected.items():
            current = value(row, field)
            if current == expected_value:
                continue
            changes.append(
                {
                    "sku": sku,
                    "brand": value(row, "Brands"),
                    "type": value(row, "Type"),
                    "parent_sku": parent_sku,
                    "field": field,
                    "current": current,
                    "expected": expected_value,
                    "reason": "exact parent inheritance" if parent else "canonical navigation registry",
                    "finding": "taxonomy_deterministic_mismatch",
                }
            )
    return changes, unresolved


def apply_changes(rows: list[dict[str, str]], changes: list[dict[str, str]]) -> None:
    by_sku = {value(row, "SKU"): row for row in rows}
    for change in changes:
        by_sku[change["sku"]][change["field"]] = change["expected"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--include-gap-audit", type=Path, default=DEFAULT_GAPS)
    parser.add_argument("--report", type=Path)
    parser.add_argument(
        "--assignment",
        action="append",
        default=[],
        metavar="SKU=PATH",
        help="Reviewed owner-row correction to an exact canonical product_cat path; may be repeated.",
    )
    parser.add_argument("--apply", action="store_true", help="Apply deterministic taxonomy fixes only. Default is preview-only.")
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Skip the standalone rollback snapshot. Intended only for an orchestrator that already created one.",
    )
    args = parser.parse_args()

    catalog = args.catalog.resolve()
    gaps = args.include_gap_audit.resolve()
    validate_catalog(catalog, gaps)
    with catalog.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)

    by_sku = {value(row, "SKU"): row for row in rows}
    assignments = parse_assignments(args.assignment, by_sku)
    changes, unresolved = build_changes(rows, assignments)
    report = {
        "schema_version": 3,
        "catalog": catalog.relative_to(ROOT).as_posix() if catalog.is_relative_to(ROOT) else str(catalog),
        "applied": False,
        "backup_created": False,
        "safe_fix_finding": "taxonomy_deterministic_mismatch",
        "change_count": len(changes),
        "changed_skus": len({change["sku"] for change in changes}),
        "unresolved_count": len(unresolved),
        "unresolved": unresolved,
        "reviewed_assignments": assignments,
        "by_field": {
            field: sum(1 for change in changes if change["field"] == field)
            for field in ("Categories", CATEGORY_FIELD, DISPLAY_FIELD)
        },
        "changes": changes,
    }

    if args.apply and unresolved:
        raise CatalogValidationError(
            f"taxonomy apply blocked: {len(unresolved)} unresolved row(s); review the preview report"
        )
    if args.apply and changes:
        if not args.no_backup:
            create_catalog_backup(catalog)
            report["backup_created"] = True
        apply_changes(rows, changes)
        validate_taxonomy_rows(rows)
        write_catalog_atomic(catalog, fieldnames, rows)
        validate_catalog(catalog, gaps)
        report["taxonomy_validation"] = validate_catalog_taxonomy(catalog)
        report["applied"] = True
    elif args.apply:
        report["applied"] = True

    payload = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.report:
        report_path = args.report.resolve()
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(payload, encoding="utf-8")
    print(payload, end="")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (CatalogValidationError, OSError, csv.Error) as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
