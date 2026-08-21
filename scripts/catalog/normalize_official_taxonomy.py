#!/usr/bin/env python3
"""Normalize canonical catalog taxonomy with one brand-independent policy.

Preview is the default. --apply may remove recognized legacy brand path segments
and may mutate taxonomy metadata only for deterministic policy mismatches.
Ambiguous and display-only findings remain review-only.

Standalone --apply creates a rollback snapshot. The unified catalog runner uses
--no-backup after creating one run-level snapshot for the complete safe-fix set.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

from catalog_taxonomy_policy import taxonomy_state
from official_catalog_schema import (
    CatalogValidationError,
    create_catalog_backup,
    validate_catalog,
    write_catalog_atomic,
)

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.include-gaps.json"

CATEGORY_FIELD = "Meta: _dtb_category_key"
DISPLAY_FIELD = "Meta: _dtb_display_category_key"
PRODUCT_KIND_FIELD = "Meta: _dtb_product_kind"


def value(row: dict[str, str], field: str) -> str:
    return (row.get(field) or "").strip()


def strip_brand_from_categories(raw: str, brand: str) -> str:
    """Remove a legacy brand segment only from the expected hierarchy position."""
    if not raw.strip() or not brand.strip():
        return raw.strip()

    recognized_roots = {"drywall finishing tools", "stilts & accessories"}
    normalized_paths: list[str] = []
    brand_folded = brand.strip().casefold()

    for path in raw.split(","):
        segments = [segment.strip() for segment in path.split(">") if segment.strip()]
        if (
            len(segments) >= 2
            and segments[0].casefold() in recognized_roots
            and segments[1].casefold() == brand_folded
        ):
            segments = [segments[0], *segments[2:]]

        cleaned = " > ".join(segments)
        if cleaned and cleaned not in normalized_paths:
            normalized_paths.append(cleaned)

    return ", ".join(normalized_paths)


def build_changes(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    """Return only mutation-safe changes; review-only taxonomy is excluded."""
    changes: list[dict[str, str]] = []
    for row in rows:
        sku = value(row, "SKU")
        brand = value(row, "Brands")
        current_categories = value(row, "Categories")
        normalized_categories = strip_brand_from_categories(current_categories, brand)
        if normalized_categories != current_categories:
            changes.append(
                {
                    "sku": sku,
                    "brand": brand,
                    "field": "Categories",
                    "current": current_categories,
                    "expected": normalized_categories,
                    "reason": "legacy brand segment removed from root-level product taxonomy path",
                    "finding": "taxonomy_deterministic_mismatch",
                }
            )

        state = taxonomy_state(
            product_kind=value(row, PRODUCT_KIND_FIELD),
            category_key=value(row, CATEGORY_FIELD),
            display_category_key=value(row, DISPLAY_FIELD),
        )
        if state["disposition"] != "deterministic_mismatch":
            continue

        expected_category = str(state["expected_category_key"] or "")
        expected_display = str(state["expected_display_category_key"] or "")
        normalized_category = value(row, CATEGORY_FIELD).lower().replace("-", "_").replace(" ", "_")
        normalized_display = value(row, DISPLAY_FIELD).lower().replace("-", "_").replace(" ", "_")
        if normalized_category != expected_category:
            changes.append(
                {
                    "sku": sku,
                    "brand": brand,
                    "field": CATEGORY_FIELD,
                    "current": value(row, CATEGORY_FIELD),
                    "expected": expected_category,
                    "reason": str(state["reason"] or "deterministic taxonomy policy"),
                    "finding": "taxonomy_deterministic_mismatch",
                }
            )
        if expected_display and normalized_display != expected_display:
            changes.append(
                {
                    "sku": sku,
                    "brand": brand,
                    "field": DISPLAY_FIELD,
                    "current": value(row, DISPLAY_FIELD),
                    "expected": expected_display,
                    "reason": str(state["reason"] or "deterministic taxonomy policy"),
                    "finding": "taxonomy_deterministic_mismatch",
                }
            )
    return changes


def review_counts(rows: list[dict[str, str]]) -> dict[str, int]:
    counts = {"taxonomy_ambiguous_review": 0, "display_taxonomy_mismatch": 0}
    for row in rows:
        state = taxonomy_state(
            product_kind=value(row, PRODUCT_KIND_FIELD),
            category_key=value(row, CATEGORY_FIELD),
            display_category_key=value(row, DISPLAY_FIELD),
        )
        if state["disposition"] == "ambiguous_review":
            counts["taxonomy_ambiguous_review"] += 1
        elif state["disposition"] == "display_mismatch":
            counts["display_taxonomy_mismatch"] += 1
    return counts


def apply_changes(rows: list[dict[str, str]], changes: list[dict[str, str]]) -> None:
    by_sku = {value(row, "SKU"): row for row in rows}
    for change in changes:
        by_sku[change["sku"]][change["field"]] = change["expected"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--include-gap-audit", type=Path, default=DEFAULT_GAPS)
    parser.add_argument("--report", type=Path)
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

    changes = build_changes(rows)
    reviews = review_counts(rows)
    report = {
        "schema_version": 3,
        "catalog": catalog.relative_to(ROOT).as_posix() if catalog.is_relative_to(ROOT) else str(catalog),
        "applied": False,
        "backup_created": False,
        "safe_fix_finding": "taxonomy_deterministic_mismatch",
        "change_count": len(changes),
        "changed_skus": len({change["sku"] for change in changes}),
        "review_only": reviews,
        "by_field": {
            field: sum(1 for change in changes if change["field"] == field)
            for field in ("Categories", CATEGORY_FIELD, DISPLAY_FIELD)
        },
        "changes": changes,
    }

    if args.apply and changes:
        if not args.no_backup:
            create_catalog_backup(catalog)
            report["backup_created"] = True
        apply_changes(rows, changes)
        write_catalog_atomic(catalog, fieldnames, rows)
        validate_catalog(catalog, gaps)
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
