#!/usr/bin/env python3
"""Consolidate DTB official catalog content and rebuild canonical navigation taxonomy.

The canonical commerce CSV is always the base authority. The legacy content/SEO
CSV may contribute only allowlisted editorial fields for SKUs whose protected
identity matches. It can never create products or overwrite commerce, identity,
taxonomy, routing, compatibility, media, pricing, or inventory fields.

Taxonomy is rebuilt from the universal navigation policy. Variations inherit
parent taxonomy. Unknown/ambiguous navigation blocks --apply.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import tempfile
from collections import Counter
from pathlib import Path

from catalog_taxonomy_policy import (
    CATEGORY_FIELD,
    DISPLAY_FIELD,
    PARENT_FIELD,
    canonical_values,
)
from official_catalog_schema import CatalogValidationError, create_catalog_backup, validate_catalog

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_SEO = ROOT / "products" / "launch" / "official" / "dtb_official_catalog_content_seo.csv"
DEFAULT_GAPS = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.include-gaps.json"
DEFAULT_OUTPUT = ROOT / "products" / "dev" / "catalog-consolidation"

CONTENT_ALLOWLIST = (
    "Short description",
    "Description",
    "Meta: _dtb_seo_title",
    "Meta: _dtb_seo_description",
    "Meta: _dtb_seo_focus_kw",
)
# Matching these fields is required before SEO/editorial copy is trusted for a SKU.
IDENTITY_MATCH_FIELDS = (
    "Type",
    "Name",
    "Brands",
    "Meta: _dtb_mpn",
    "Meta: _dtb_manufacturer_sku",
    PARENT_FIELD,
)
NEVER_IMPORT_FROM_SEO = {
    "SKU", "GTIN, UPC, EAN, or ISBN", "Slug", "Categories",
    CATEGORY_FIELD, DISPLAY_FIELD, "Meta: _dtb_seo_canonical",
    "Meta: _dtb_seo_noindex", "Images", "Regular price", "Sale price",
    "Stock", "In stock?", "Meta: _dtb_compatible_tool_skus",
    "Meta: _dtb_replacement_part_for", "Meta: _dtb_schematic_id",
    "Meta: _dtb_specs_json",
}


def clean(value: object) -> str:
    return str(value or "").strip()


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def index_by_sku(rows: list[dict[str, str]], label: str) -> dict[str, dict[str, str]]:
    result: dict[str, dict[str, str]] = {}
    duplicates: list[str] = []
    for row in rows:
        sku = clean(row.get("SKU")).upper()
        if not sku:
            continue
        if sku in result:
            duplicates.append(sku)
        else:
            result[sku] = row
    if duplicates:
        raise ValueError(f"{label} contains duplicate SKU(s): {', '.join(sorted(set(duplicates))[:20])}")
    return result


def identity_conflicts(main: dict[str, str], seo: dict[str, str]) -> list[dict[str, str]]:
    conflicts: list[dict[str, str]] = []
    for field in IDENTITY_MATCH_FIELDS:
        if field not in seo:
            continue
        left, right = clean(main.get(field)), clean(seo.get(field))
        # A blank secondary value carries no authority and is not a conflict.
        if right and left != right:
            conflicts.append({"field": field, "main": left, "seo": right})
    return conflicts


def build_plan(main_rows: list[dict[str, str]], seo_rows: list[dict[str, str]]) -> dict[str, object]:
    main_by_sku = index_by_sku(main_rows, "canonical catalog")
    seo_by_sku = index_by_sku(seo_rows, "content/SEO catalog")

    content_changes: list[dict[str, str]] = []
    rejected_content: list[dict[str, str]] = []
    seo_only = sorted(set(seo_by_sku) - set(main_by_sku))

    for sku in sorted(set(main_by_sku) & set(seo_by_sku)):
        main = main_by_sku[sku]
        seo = seo_by_sku[sku]
        conflicts = identity_conflicts(main, seo)
        if conflicts:
            for conflict in conflicts:
                rejected_content.append({"sku": sku, **conflict})
            continue
        for field in CONTENT_ALLOWLIST:
            if field not in seo:
                continue
            candidate = clean(seo.get(field))
            current = clean(main.get(field))
            if candidate and candidate != current:
                content_changes.append({
                    "sku": sku,
                    "field": field,
                    "current": current,
                    "expected": candidate,
                    "source": "content_seo",
                })

    taxonomy_changes: list[dict[str, str]] = []
    unresolved: list[dict[str, str]] = []

    # Parents/simple products establish taxonomy first.
    for sku, row in main_by_sku.items():
        if clean(row.get("Type")).lower() == "variation":
            continue
        expected = canonical_values(row)
        if expected is None:
            unresolved.append({
                "sku": sku,
                "name": clean(row.get("Name")),
                "type": clean(row.get("Type")),
                "product_kind": clean(row.get("Meta: _dtb_product_kind")),
                "categories": clean(row.get("Categories")),
                "category_key": clean(row.get(CATEGORY_FIELD)),
                "display_category_key": clean(row.get(DISPLAY_FIELD)),
                "reason": "no unique canonical navigation taxon",
            })
            continue
        for field, candidate in expected.items():
            current = clean(row.get(field))
            if current != candidate:
                taxonomy_changes.append({
                    "sku": sku,
                    "field": field,
                    "current": current,
                    "expected": candidate,
                    "source": "universal_navigation_policy",
                })

    # Variations inherit their parent's exact navigation/facet identity.
    for sku, row in main_by_sku.items():
        if clean(row.get("Type")).lower() != "variation":
            continue
        parent_sku = clean(row.get(PARENT_FIELD) or row.get("Parent")).upper()
        parent = main_by_sku.get(parent_sku)
        if not parent:
            unresolved.append({
                "sku": sku, "name": clean(row.get("Name")), "type": "variation",
                "product_kind": clean(row.get("Meta: _dtb_product_kind")),
                "categories": clean(row.get("Categories")),
                "category_key": clean(row.get(CATEGORY_FIELD)),
                "display_category_key": clean(row.get(DISPLAY_FIELD)),
                "reason": f"parent SKU {parent_sku or '(blank)'} not found",
            })
            continue
        expected = canonical_values(row, parent)
        if expected is None:
            unresolved.append({
                "sku": sku, "name": clean(row.get("Name")), "type": "variation",
                "product_kind": clean(row.get("Meta: _dtb_product_kind")),
                "categories": clean(row.get("Categories")),
                "category_key": clean(row.get(CATEGORY_FIELD)),
                "display_category_key": clean(row.get(DISPLAY_FIELD)),
                "reason": f"parent {parent_sku} has unresolved navigation taxonomy",
            })
            continue
        for field, candidate in expected.items():
            current = clean(row.get(field))
            if current != candidate:
                taxonomy_changes.append({
                    "sku": sku,
                    "field": field,
                    "current": current,
                    "expected": candidate,
                    "source": "parent_taxonomy_inheritance",
                })

    return {
        "main_rows": len(main_rows),
        "seo_rows": len(seo_rows),
        "common_skus": len(set(main_by_sku) & set(seo_by_sku)),
        "main_only_skus": len(set(main_by_sku) - set(seo_by_sku)),
        "seo_only_skus": seo_only,
        "content_changes": content_changes,
        "rejected_content": rejected_content,
        "taxonomy_changes": taxonomy_changes,
        "unresolved_taxonomy": unresolved,
    }


def apply_plan(rows: list[dict[str, str]], plan: dict[str, object]) -> None:
    by_sku = index_by_sku(rows, "canonical catalog")
    for group in ("content_changes", "taxonomy_changes"):
        for change in plan[group]:  # type: ignore[index]
            by_sku[str(change["sku"]).upper()][str(change["field"])] = str(change["expected"])


def atomic_write(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    os.close(fd)
    temp = Path(temp_name)
    try:
        with temp.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="raise", lineterminator="\n")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temp, path)
    finally:
        if temp.exists():
            temp.unlink()


def write_report(output: Path, plan: dict[str, object], applied: bool) -> None:
    output.mkdir(parents=True, exist_ok=True)
    taxonomy = plan["taxonomy_changes"]  # type: ignore[index]
    content = plan["content_changes"]  # type: ignore[index]
    summary = {
        "schema_version": 1,
        "mutates_catalog": applied,
        "main_rows": plan["main_rows"],
        "seo_rows": plan["seo_rows"],
        "common_skus": plan["common_skus"],
        "main_only_skus": plan["main_only_skus"],
        "seo_only_skus": len(plan["seo_only_skus"]),  # type: ignore[arg-type]
        "content_changes": len(content),
        "content_changed_skus": len({item["sku"] for item in content}),
        "content_rejected_conflicts": len(plan["rejected_content"]),  # type: ignore[arg-type]
        "taxonomy_changes": len(taxonomy),
        "taxonomy_changed_skus": len({item["sku"] for item in taxonomy}),
        "taxonomy_by_field": dict(Counter(item["field"] for item in taxonomy)),
        "unresolved_taxonomy": len(plan["unresolved_taxonomy"]),  # type: ignore[arg-type]
        "seo_source_retirement_ready": not plan["unresolved_taxonomy"],
    }
    (output / "consolidation-summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    (output / "consolidation-plan.json").write_text(json.dumps(plan, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--seo-catalog", type=Path, default=DEFAULT_SEO)
    parser.add_argument("--include-gap-audit", type=Path, default=DEFAULT_GAPS)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--retire-seo-source", action="store_true", help="Delete the duplicate SEO CSV after a successful validated apply.")
    args = parser.parse_args()

    catalog = args.catalog.resolve()
    seo = args.seo_catalog.resolve()
    gaps = args.include_gap_audit.resolve()
    validate_catalog(catalog, gaps)
    fields, rows = read_csv(catalog)
    _seo_fields, seo_rows = read_csv(seo)
    plan = build_plan(rows, seo_rows)

    if args.apply and plan["unresolved_taxonomy"]:
        write_report(args.output_dir.resolve(), plan, False)
        raise ValueError(f"Refusing apply: {len(plan['unresolved_taxonomy'])} taxonomy row(s) remain unresolved")

    applied = False
    if args.apply:
        create_catalog_backup(catalog)
        apply_plan(rows, plan)
        atomic_write(catalog, fields, rows)
        validate_catalog(catalog, gaps)
        # Re-plan against the resulting file. Taxonomy must converge to zero.
        _fields, applied_rows = read_csv(catalog)
        post = build_plan(applied_rows, seo_rows)
        if post["taxonomy_changes"] or post["unresolved_taxonomy"]:
            raise ValueError("Post-apply taxonomy did not converge; restore the generated rollback snapshot")
        applied = True
        if args.retire_seo_source:
            seo.unlink()

    write_report(args.output_dir.resolve(), plan, applied)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (CatalogValidationError, OSError, csv.Error, ValueError) as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
