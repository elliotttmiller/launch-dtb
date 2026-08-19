#!/usr/bin/env python3
"""Report non-blocking enrichment quality for the canonical DTB launch catalog.

This audit complements ``validate_official_catalog.py``. Structural contract
violations remain blocking in ``official_catalog_schema.validate_catalog``;
this tool reports completeness and relationship gaps without mutating product
facts or inventing values.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path
from typing import Iterable

from official_catalog_schema import CatalogValidationError, validate_catalog


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.include-gaps.json"

MPN_FIELDS = (
    "Meta: schema_mpn",
    "Meta: _dtb_manufacturer_sku",
    "Meta: _dtb_mpn",
)
COMPATIBILITY_FIELDS = (
    "Meta: _dtb_compatible_tool_skus",
    "Meta: _dtb_replacement_part_for",
)
TRUTHY = {"1", "true", "yes", "y"}


def _value(row: dict[str, str], field: str) -> str:
    return (row.get(field) or "").strip()


def _is_published(row: dict[str, str]) -> bool:
    return _value(row, "Published").lower() in TRUTHY


def _is_part(row: dict[str, str]) -> bool:
    return _value(row, "Meta: _dtb_is_parts").lower() in TRUTHY


def _has_mpn(row: dict[str, str]) -> bool:
    return any(_value(row, field) for field in MPN_FIELDS)


def _decode_sku_list(raw: str) -> list[str]:
    raw = raw.strip()
    if not raw:
        return []

    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = None
        if isinstance(parsed, list):
            return [str(value).strip() for value in parsed if str(value).strip()]

    return [value.strip() for value in raw.split(",") if value.strip()]


def _coverage(rows: list[dict[str, str]], predicate) -> dict[str, int | float]:
    total = len(rows)
    populated = sum(1 for row in rows if predicate(row))
    return {
        "populated": populated,
        "total": total,
        "percent": round((populated / total) * 100, 2) if total else 100.0,
    }


def _sample_findings(skus: Iterable[str], limit: int = 25) -> dict[str, object]:
    unique = sorted({sku for sku in skus if sku})
    return {
        "count": len(unique),
        "sample_skus": unique[:limit],
    }


def _safe_specs(row: dict[str, str]) -> list[object] | None:
    raw = _value(row, "Meta: _dtb_specs_json")
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, list) else None


def _has_structured_specs(row: dict[str, str]) -> bool:
    specs = _safe_specs(row)
    return isinstance(specs, list) and len(specs) > 0


def audit_rows(rows: list[dict[str, str]]) -> dict[str, object]:
    """Return deterministic, non-blocking enrichment metrics for catalog rows."""
    sku_set = {_value(row, "SKU") for row in rows if _value(row, "SKU")}

    coverage = {
        "name": _coverage(rows, lambda row: bool(_value(row, "Name"))),
        "brand": _coverage(rows, lambda row: bool(_value(row, "Brands"))),
        "category": _coverage(rows, lambda row: bool(_value(row, "Categories"))),
        "category_key": _coverage(rows, lambda row: bool(_value(row, "Meta: _dtb_category_key"))),
        "display_category_key": _coverage(
            rows, lambda row: bool(_value(row, "Meta: _dtb_display_category_key"))
        ),
        "mpn": _coverage(rows, _has_mpn),
        "gtin": _coverage(rows, lambda row: bool(_value(row, "GTIN, UPC, EAN, or ISBN"))),
        "images": _coverage(rows, lambda row: bool(_value(row, "Images"))),
        "short_description": _coverage(rows, lambda row: bool(_value(row, "Short description"))),
        "description": _coverage(rows, lambda row: bool(_value(row, "Description"))),
        "structured_specs": _coverage(rows, _has_structured_specs),
    }

    malformed_specs: list[str] = []
    duplicate_spec_labels: list[str] = []
    total_spec_entries = 0

    for row in rows:
        sku = _value(row, "SKU")
        specs = _safe_specs(row)
        if specs is None:
            # The structural validator catches malformed JSON/non-array values.
            continue

        labels: list[str] = []
        for spec in specs:
            total_spec_entries += 1
            if not isinstance(spec, dict):
                malformed_specs.append(sku)
                continue

            label = str(spec.get("label") or "").strip()
            value = spec.get("value")
            items = spec.get("items")
            has_value = value is not None and str(value).strip() != ""
            has_items = isinstance(items, list) and len(items) > 0

            if not label or not (has_value or has_items):
                malformed_specs.append(sku)
                continue
            labels.append(label.casefold())

        if len(labels) != len(set(labels)):
            duplicate_spec_labels.append(sku)

    part_rows = [row for row in rows if _is_part(row)]
    part_relationship_coverage = _coverage(
        part_rows,
        lambda row: any(_value(row, field) for field in COMPATIBILITY_FIELDS),
    )

    unresolved_compatible_refs: list[str] = []
    unresolved_replacement_refs: list[str] = []
    compatible_ref_count = 0
    replacement_ref_count = 0

    for row in rows:
        owner_sku = _value(row, "SKU")
        compatible = _decode_sku_list(_value(row, "Meta: _dtb_compatible_tool_skus"))
        replacements = _decode_sku_list(_value(row, "Meta: _dtb_replacement_part_for"))
        compatible_ref_count += len(compatible)
        replacement_ref_count += len(replacements)

        if any(ref not in sku_set for ref in compatible):
            unresolved_compatible_refs.append(owner_sku)
        if any(ref not in sku_set for ref in replacements):
            unresolved_replacement_refs.append(owner_sku)

    return {
        "rows": len(rows),
        "parts": len(part_rows),
        "coverage": coverage,
        "relationships": {
            "part_rows_with_compatibility_or_replacement": part_relationship_coverage,
            "compatible_tool_reference_count": compatible_ref_count,
            "replacement_reference_count": replacement_ref_count,
        },
        "structured_specs": {
            "total_entries": total_spec_entries,
        },
        "findings": {
            "malformed_spec_entries": _sample_findings(malformed_specs),
            "duplicate_spec_labels": _sample_findings(duplicate_spec_labels),
            "unresolved_compatible_tool_references": _sample_findings(
                unresolved_compatible_refs
            ),
            "unresolved_replacement_references": _sample_findings(
                unresolved_replacement_refs
            ),
        },
    }


def _load_rows(catalog_path: Path) -> list[dict[str, str]]:
    try:
        with catalog_path.open("r", encoding="utf-8-sig", newline="") as handle:
            return list(csv.DictReader(handle))
    except (OSError, UnicodeError, csv.Error) as exc:
        raise CatalogValidationError(f"Cannot parse {catalog_path}: {exc}") from exc


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--include-gap-audit", type=Path, default=DEFAULT_GAPS)
    parser.add_argument(
        "--all",
        action="store_true",
        help="Audit every catalog row instead of the published B2C storefront scope.",
    )
    args = parser.parse_args()

    catalog_path = args.catalog.resolve()
    gap_path = args.include_gap_audit.resolve()

    structural = validate_catalog(catalog_path, gap_path)
    all_rows = _load_rows(catalog_path)
    scoped_rows = all_rows if args.all else [row for row in all_rows if _is_published(row)]

    report = {
        "scope": "all" if args.all else "published",
        "structural_validation": structural,
        "quality": audit_rows(scoped_rows),
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except CatalogValidationError as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
