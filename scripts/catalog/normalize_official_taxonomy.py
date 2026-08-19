#!/usr/bin/env python3
"""Normalize canonical catalog taxonomy with one brand-independent policy.

Preview is the default. --apply mutates only Categories, Meta: _dtb_category_key,
and Meta: _dtb_display_category_key, creates the standard sibling rollback
snapshot, and re-validates the complete canonical catalog.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import tempfile
from pathlib import Path

from catalog_taxonomy_policy import expected_taxonomy
from official_catalog_schema import CatalogValidationError, create_catalog_backup, validate_catalog

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.include-gaps.json"

CATEGORY_FIELD = "Meta: _dtb_category_key"
DISPLAY_FIELD = "Meta: _dtb_display_category_key"
PRODUCT_KIND_FIELD = "Meta: _dtb_product_kind"


def value(row: dict[str, str], field: str) -> str:
    return (row.get(field) or "").strip()


def strip_brand_from_categories(raw: str, brand: str) -> str:
    """Remove a legacy brand segment only from the expected hierarchy position.

    Brand identity belongs in the dedicated Brands field. To avoid deleting a
    legitimate functional category that happens to equal a manufacturer name,
    only strip the brand when it is the second path segment beneath a recognized
    catalog root, matching the legacy `Root > Brand > ...` structure.
    """

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
                }
            )

        expectation = expected_taxonomy(
            product_kind=value(row, PRODUCT_KIND_FIELD),
            display_category_key=value(row, DISPLAY_FIELD),
        )
        if expectation is None:
            continue
        if value(row, CATEGORY_FIELD).lower() != expectation.category_key:
            changes.append(
                {
                    "sku": sku,
                    "brand": brand,
                    "field": CATEGORY_FIELD,
                    "current": value(row, CATEGORY_FIELD),
                    "expected": expectation.category_key,
                    "reason": expectation.reason,
                }
            )
        if value(row, DISPLAY_FIELD).lower() != expectation.display_category_key:
            changes.append(
                {
                    "sku": sku,
                    "brand": brand,
                    "field": DISPLAY_FIELD,
                    "current": value(row, DISPLAY_FIELD),
                    "expected": expectation.display_category_key,
                    "reason": expectation.reason,
                }
            )
    return changes


def apply_changes(rows: list[dict[str, str]], changes: list[dict[str, str]]) -> None:
    by_sku = {value(row, "SKU"): row for row in rows}
    for change in changes:
        row = by_sku[change["sku"]]
        row[change["field"]] = change["expected"]


def write_catalog(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    """Atomically replace the CSV using the canonical writer convention."""
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    os.close(fd)
    temp_path = Path(temp_name)
    try:
        with temp_path.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=fieldnames,
                extrasaction="raise",
                lineterminator="\n",
            )
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temp_path, path)
    finally:
        if temp_path.exists():
            temp_path.unlink()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--include-gap-audit", type=Path, default=DEFAULT_GAPS)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--apply", action="store_true", help="Apply reviewed universal taxonomy fixes. Default is preview-only.")
    args = parser.parse_args()

    catalog = args.catalog.resolve()
    gaps = args.include_gap_audit.resolve()
    validate_catalog(catalog, gaps)
    with catalog.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)

    changes = build_changes(rows)
    report = {
        "schema_version": 1,
        "catalog": catalog.relative_to(ROOT).as_posix() if catalog.is_relative_to(ROOT) else str(catalog),
        "applied": False,
        "change_count": len(changes),
        "changed_skus": len({change["sku"] for change in changes}),
        "by_field": {
            field: sum(1 for change in changes if change["field"] == field)
            for field in ("Categories", CATEGORY_FIELD, DISPLAY_FIELD)
        },
        "changes": changes,
    }

    if args.apply and changes:
        create_catalog_backup(catalog)
        apply_changes(rows, changes)
        write_catalog(catalog, fieldnames, rows)
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
