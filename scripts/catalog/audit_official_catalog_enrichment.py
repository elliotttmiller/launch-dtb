#!/usr/bin/env python3
"""Audit enrichment quality for the canonical DTB launch catalog.

Structural validation remains the blocking contract. This module reports
customer-facing coverage, catalog-policy inconsistencies, and targeted research
work without inventing missing product facts or mutating the canonical CSV.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable

from catalog_taxonomy_policy import taxonomy_state
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
REMEDIATION_FIELDS = (
    "sku", "name", "type", "brand", "product_kind", "category_key",
    "display_category_key", "finding", "workflow", "field", "current_value",
)


def _value(row: dict[str, str], field: str) -> str:
    return (row.get(field) or "").strip()


def _is_published(row: dict[str, str]) -> bool:
    return _value(row, "Published").lower() in TRUTHY


def _is_part(row: dict[str, str]) -> bool:
    return _value(row, "Meta: _dtb_is_parts").lower() in TRUTHY


def _type(row: dict[str, str]) -> str:
    return _value(row, "Type").lower()


def _is_variation(row: dict[str, str]) -> bool:
    return _type(row) == "variation"


def _is_variable_parent(row: dict[str, str]) -> bool:
    return _type(row) == "variable"


def _owns_classification(row: dict[str, str]) -> bool:
    return not _is_variation(row)


def _owns_item_identifier(row: dict[str, str]) -> bool:
    return not _is_variable_parent(row)


def _owns_compatibility_research(row: dict[str, str]) -> bool:
    return _is_part(row) and not _is_variation(row)


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
    return {"count": len(unique), "sample_skus": unique[:limit]}


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


def _identity(row: dict[str, str]) -> dict[str, str]:
    return {
        "sku": _value(row, "SKU"),
        "name": _value(row, "Name"),
        "type": _value(row, "Type"),
        "brand": _value(row, "Brands"),
        "product_kind": _value(row, "Meta: _dtb_product_kind"),
        "category_key": _value(row, "Meta: _dtb_category_key"),
        "display_category_key": _value(row, "Meta: _dtb_display_category_key"),
    }


def _remediation(row: dict[str, str], *, finding: str, workflow: str, field: str, current_value: str | None = None) -> dict[str, str]:
    return {
        **_identity(row),
        "finding": finding,
        "workflow": workflow,
        "field": field,
        "current_value": _value(row, field) if current_value is None else current_value,
    }


def _segmented_coverage(rows: list[dict[str, str]]) -> dict[str, object]:
    dimensions = {
        "category": lambda row: bool(_value(row, "Categories")),
        "display_category_key": lambda row: bool(_value(row, "Meta: _dtb_display_category_key")),
        "mpn": _has_mpn,
        "gtin": lambda row: bool(_value(row, "GTIN, UPC, EAN, or ISBN")),
        "images": lambda row: bool(_value(row, "Images")),
    }
    result: dict[str, object] = {}
    for segment_name, key_fn in (
        ("type", lambda row: _value(row, "Type") or "(blank)"),
        ("product_kind", lambda row: _value(row, "Meta: _dtb_product_kind") or "(blank)"),
    ):
        groups: dict[str, list[dict[str, str]]] = defaultdict(list)
        for row in rows:
            groups[key_fn(row)].append(row)
        result[segment_name] = {
            key: {
                "rows": len(group),
                "coverage": {name: _coverage(group, predicate) for name, predicate in dimensions.items()},
            }
            for key, group in sorted(groups.items())
        }
    return result


def _taxonomy_consistency(row: dict[str, str]) -> tuple[bool, str]:
    if _is_variation(row):
        return True, ""
    state = taxonomy_state(
        product_kind=_value(row, "Meta: _dtb_product_kind"),
        category_key=_value(row, "Meta: _dtb_category_key"),
        display_category_key=_value(row, "Meta: _dtb_display_category_key"),
    )
    if not state["known"] or state["consistent"]:
        return True, ""
    return False, (
        f"category_key={state['category_key'] or '(blank)'}; "
        f"display_category_key={state['display_category_key'] or '(blank)'}; "
        f"expected_category_key={state['expected_category_key']}; "
        f"expected_display_category_key={state['expected_display_category_key']}; "
        f"policy={state['reason']}"
    )


def audit_rows(rows: list[dict[str, str]], *, reference_skus: set[str] | None = None) -> dict[str, object]:
    """Return deterministic, non-blocking enrichment metrics for catalog rows."""
    sku_set = reference_skus or {_value(row, "SKU") for row in rows if _value(row, "SKU")}
    classification_rows = [row for row in rows if _owns_classification(row)]
    item_identifier_rows = [row for row in rows if _owns_item_identifier(row)]

    coverage = {
        "name": _coverage(rows, lambda row: bool(_value(row, "Name"))),
        "brand": _coverage(rows, lambda row: bool(_value(row, "Brands"))),
        "category_key": _coverage(rows, lambda row: bool(_value(row, "Meta: _dtb_category_key"))),
        "images": _coverage(rows, lambda row: bool(_value(row, "Images"))),
        "short_description": _coverage(rows, lambda row: bool(_value(row, "Short description"))),
        "description": _coverage(rows, lambda row: bool(_value(row, "Description"))),
        "structured_specs": _coverage(rows, _has_structured_specs),
        "gtin": _coverage(rows, lambda row: bool(_value(row, "GTIN, UPC, EAN, or ISBN"))),
    }
    operational_coverage = {
        "category_owning_rows": _coverage(classification_rows, lambda row: bool(_value(row, "Categories"))),
        "display_category_owning_rows": _coverage(classification_rows, lambda row: bool(_value(row, "Meta: _dtb_display_category_key"))),
        "item_mpn": _coverage(item_identifier_rows, _has_mpn),
    }

    malformed_specs: list[str] = []
    duplicate_spec_labels: list[str] = []
    taxonomy_inconsistent: list[str] = []
    total_spec_entries = 0
    remediation: list[dict[str, str]] = []

    for row in rows:
        sku = _value(row, "SKU")
        specs = _safe_specs(row)
        if specs is not None:
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

        taxonomy_ok, taxonomy_state_text = _taxonomy_consistency(row)
        if not taxonomy_ok:
            taxonomy_inconsistent.append(sku)
            remediation.append(_remediation(
                row,
                finding="taxonomy_mapping_inconsistent",
                workflow="classification_review",
                field="Meta: _dtb_category_key / Meta: _dtb_display_category_key",
                current_value=taxonomy_state_text,
            ))
        elif _owns_classification(row):
            if not _value(row, "Categories"):
                remediation.append(_remediation(row, finding="missing_category", workflow="classification_review", field="Categories"))
            if not _value(row, "Meta: _dtb_display_category_key"):
                remediation.append(_remediation(row, finding="missing_display_category_key", workflow="classification_review", field="Meta: _dtb_display_category_key"))

        if _owns_item_identifier(row) and not _has_mpn(row):
            remediation.append(_remediation(row, finding="missing_mpn", workflow="authoritative_identifier_research", field="Meta: _dtb_mpn"))
        if not _value(row, "Images"):
            remediation.append(_remediation(row, finding="missing_image", workflow="media_research", field="Images"))

    part_rows = [row for row in rows if _is_part(row)]
    part_research_rows = [row for row in rows if _owns_compatibility_research(row)]
    part_relationship_coverage = _coverage(part_rows, lambda row: any(_value(row, field) for field in COMPATIBILITY_FIELDS))
    primary_part_relationship_coverage = _coverage(part_research_rows, lambda row: any(_value(row, field) for field in COMPATIBILITY_FIELDS))

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
        if _owns_compatibility_research(row) and not compatible and not replacements:
            remediation.append(_remediation(
                row,
                finding="part_family_without_compatibility_or_replacement",
                workflow="compatibility_research",
                field="Meta: _dtb_compatible_tool_skus",
            ))

    remediation_counts = dict(sorted(Counter(item["finding"] for item in remediation).items()))
    workflow_counts = dict(sorted(Counter(item["workflow"] for item in remediation).items()))

    return {
        "rows": len(rows),
        "parts": len(part_rows),
        "coverage": coverage,
        "operational_coverage": operational_coverage,
        "segmented_coverage": _segmented_coverage(rows),
        "relationships": {
            "part_rows_with_compatibility_or_replacement": part_relationship_coverage,
            "primary_part_families_with_compatibility_or_replacement": primary_part_relationship_coverage,
            "primary_part_research_rows": len(part_research_rows),
            "compatible_tool_reference_count": compatible_ref_count,
            "replacement_reference_count": replacement_ref_count,
        },
        "structured_specs": {"total_entries": total_spec_entries},
        "findings": {
            "malformed_spec_entries": _sample_findings(malformed_specs),
            "duplicate_spec_labels": _sample_findings(duplicate_spec_labels),
            "taxonomy_inconsistent": _sample_findings(taxonomy_inconsistent),
            "unresolved_compatible_tool_references": _sample_findings(unresolved_compatible_refs),
            "unresolved_replacement_references": _sample_findings(unresolved_replacement_refs),
        },
        "remediation": {
            "count": len(remediation),
            "by_finding": remediation_counts,
            "by_workflow": workflow_counts,
            "items": remediation,
        },
    }


def _load_rows(catalog_path: Path) -> list[dict[str, str]]:
    try:
        with catalog_path.open("r", encoding="utf-8-sig", newline="") as handle:
            return list(csv.DictReader(handle))
    except (OSError, UnicodeError, csv.Error) as exc:
        raise CatalogValidationError(f"Cannot parse {catalog_path}: {exc}") from exc


def _write_remediation_csv(path: Path, items: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=REMEDIATION_FIELDS)
        writer.writeheader()
        writer.writerows(items)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--include-gap-audit", type=Path, default=DEFAULT_GAPS)
    parser.add_argument("--all", action="store_true", help="Audit every catalog row instead of the published B2C storefront scope.")
    parser.add_argument("--report-json", type=Path, help="Write the complete audit report to this path in addition to stdout.")
    parser.add_argument("--remediation-csv", type=Path, help="Write actionable SKU/family remediation items to this CSV path.")
    args = parser.parse_args()

    catalog_path = args.catalog.resolve()
    gap_path = args.include_gap_audit.resolve()
    structural = validate_catalog(catalog_path, gap_path)
    all_rows = _load_rows(catalog_path)
    scoped_rows = all_rows if args.all else [row for row in all_rows if _is_published(row)]
    all_skus = {_value(row, "SKU") for row in all_rows if _value(row, "SKU")}

    report = {
        "scope": "all" if args.all else "published",
        "structural_validation": structural,
        "quality": audit_rows(scoped_rows, reference_skus=all_skus),
    }
    payload = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.report_json:
        report_path = args.report_json.resolve()
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(payload, encoding="utf-8")
    if args.remediation_csv:
        _write_remediation_csv(args.remediation_csv.resolve(), report["quality"]["remediation"]["items"])
    print(payload, end="")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except CatalogValidationError as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
