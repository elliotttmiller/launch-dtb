#!/usr/bin/env python3
"""Consolidate the legacy editorial catalog into the canonical launch catalog.

The canonical WooCommerce CSV is always the base authority. The legacy content/
SEO CSV may contribute only allowlisted editorial fields after exact SKU identity
reconciliation and protected-identity checks. Taxonomy is rebuilt only from the
universal navigation policy. Preview is the default; mutation requires --apply.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import tempfile
from collections import Counter
from pathlib import Path

from catalog_taxonomy_policy import CATEGORY_FIELD, DISPLAY_FIELD, PARENT_FIELD, canonical_values
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
IDENTITY_MATCH_FIELDS = (
    "Type",
    "Name",
    "Brands",
    "Meta: _dtb_mpn",
    "Meta: _dtb_manufacturer_sku",
    PARENT_FIELD,
)


def clean(value: object) -> str:
    return str(value or "").strip()


def repo_path(path: Path) -> str:
    resolved = path.resolve()
    return resolved.relative_to(ROOT).as_posix() if resolved.is_relative_to(ROOT) else str(resolved)


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def index_by_sku(rows: list[dict[str, str]], label: str) -> tuple[dict[str, dict[str, str]], int]:
    result: dict[str, dict[str, str]] = {}
    duplicates: list[str] = []
    blank = 0
    for row in rows:
        sku = clean(row.get("SKU")).upper()
        if not sku:
            blank += 1
            continue
        if sku in result:
            duplicates.append(sku)
        else:
            result[sku] = row
    if duplicates:
        sample = ", ".join(sorted(set(duplicates))[:20])
        raise ValueError(f"{label} contains duplicate SKU(s): {sample}")
    return result, blank


def identity_conflicts(main: dict[str, str], seo: dict[str, str]) -> list[dict[str, str]]:
    conflicts: list[dict[str, str]] = []
    for field in IDENTITY_MATCH_FIELDS:
        if field not in seo:
            continue
        left, right = clean(main.get(field)), clean(seo.get(field))
        if right and left != right:
            conflicts.append({"field": field, "main": left, "seo": right})
    return conflicts


def build_plan(main_rows: list[dict[str, str]], seo_rows: list[dict[str, str]]) -> dict[str, object]:
    main_by_sku, main_blank = index_by_sku(main_rows, "canonical catalog")
    seo_by_sku, seo_blank = index_by_sku(seo_rows, "content/SEO catalog")
    if main_blank:
        raise ValueError(f"canonical catalog contains {main_blank} blank SKU row(s)")

    common = sorted(set(main_by_sku) & set(seo_by_sku))
    main_only = sorted(set(main_by_sku) - set(seo_by_sku))
    seo_only = sorted(set(seo_by_sku) - set(main_by_sku))
    content_changes: list[dict[str, str]] = []
    rejected_content: list[dict[str, str]] = []

    for sku in common:
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

    for sku, row in main_by_sku.items():
        if clean(row.get("Type")).lower() != "variation":
            continue
        parent_sku = clean(row.get(PARENT_FIELD) or row.get("Parent")).upper()
        parent = main_by_sku.get(parent_sku)
        if not parent:
            unresolved.append({
                "sku": sku,
                "name": clean(row.get("Name")),
                "type": "variation",
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
                "sku": sku,
                "name": clean(row.get("Name")),
                "type": "variation",
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

    source_identity_complete = (
        seo_blank == 0
        and len(seo_by_sku) == len(main_by_sku)
        and len(common) == len(main_by_sku)
        and not main_only
        and not seo_only
        and not rejected_content
    )
    return {
        "main_rows": len(main_rows),
        "seo_rows": len(seo_rows),
        "main_indexed_skus": len(main_by_sku),
        "seo_indexed_skus": len(seo_by_sku),
        "seo_blank_sku_rows": seo_blank,
        "common_skus": len(common),
        "main_only_skus": main_only,
        "seo_only_skus": seo_only,
        "source_identity_complete": source_identity_complete,
        "content_changes": content_changes,
        "rejected_content": rejected_content,
        "taxonomy_changes": taxonomy_changes,
        "unresolved_taxonomy": unresolved,
    }


def retirement_ready(plan: dict[str, object]) -> bool:
    return bool(
        plan["source_identity_complete"]
        and not plan["content_changes"]
        and not plan["rejected_content"]
        and not plan["taxonomy_changes"]
        and not plan["unresolved_taxonomy"]
    )


def apply_plan(rows: list[dict[str, str]], plan: dict[str, object]) -> None:
    by_sku, blank = index_by_sku(rows, "canonical catalog")
    if blank:
        raise ValueError("canonical catalog contains blank SKU rows")
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
        temp.unlink(missing_ok=True)


def summarize(plan: dict[str, object]) -> dict[str, object]:
    taxonomy = plan["taxonomy_changes"]  # type: ignore[index]
    content = plan["content_changes"]  # type: ignore[index]
    return {
        "main_rows": plan["main_rows"],
        "seo_rows": plan["seo_rows"],
        "main_indexed_skus": plan["main_indexed_skus"],
        "seo_indexed_skus": plan["seo_indexed_skus"],
        "seo_blank_sku_rows": plan["seo_blank_sku_rows"],
        "common_skus": plan["common_skus"],
        "main_only_skus": len(plan["main_only_skus"]),  # type: ignore[arg-type]
        "seo_only_skus": len(plan["seo_only_skus"]),  # type: ignore[arg-type]
        "source_identity_complete": plan["source_identity_complete"],
        "content_changes": len(content),
        "content_changed_skus": len({item["sku"] for item in content}),
        "content_rejected_conflicts": len(plan["rejected_content"]),  # type: ignore[arg-type]
        "taxonomy_changes": len(taxonomy),
        "taxonomy_changed_skus": len({item["sku"] for item in taxonomy}),
        "taxonomy_by_field": dict(Counter(item["field"] for item in taxonomy)),
        "unresolved_taxonomy": len(plan["unresolved_taxonomy"]),  # type: ignore[arg-type]
        "seo_source_retirement_ready": retirement_ready(plan),
    }


def write_report(
    output: Path,
    original_plan: dict[str, object],
    current_plan: dict[str, object],
    *,
    applied: bool,
    retired: bool,
    validation: dict[str, object],
    gap_audit: Path,
) -> None:
    output.mkdir(parents=True, exist_ok=True)
    summary = {
        "schema_version": 3,
        "mutates_catalog": applied,
        "seo_source_retired": retired,
        **summarize(original_plan),
        "post_apply": summarize(current_plan) if applied else None,
        "seo_source_retirement_ready": retirement_ready(current_plan),
        "structural_validation": validation,
        "include_gap_audit": {
            "path": repo_path(gap_audit),
            "present": gap_audit.is_file(),
            "mode": "reviewed_gap_audit" if gap_audit.is_file() else "strict_no_approved_gaps",
        },
    }
    (output / "consolidation-summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    (output / "consolidation-plan.json").write_text(
        json.dumps(original_plan, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(json.dumps(summary, indent=2, sort_keys=True))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--seo-catalog", type=Path, default=DEFAULT_SEO)
    parser.add_argument("--include-gap-audit", type=Path, default=DEFAULT_GAPS)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--apply", action="store_true", help="Apply a fully reconciled consolidation plan.")
    parser.add_argument(
        "--retire-seo-source",
        action="store_true",
        help="Delete the legacy SEO CSV only after a validated, fully reconciled apply.",
    )
    args = parser.parse_args()

    if args.retire_seo_source and not args.apply:
        raise ValueError("--retire-seo-source requires --apply")

    catalog = args.catalog.resolve()
    seo = args.seo_catalog.resolve()
    gaps = args.include_gap_audit.resolve()
    output = args.output_dir.resolve()
    validation = validate_catalog(catalog, gaps)
    fields, rows = read_csv(catalog)
    _seo_fields, seo_rows = read_csv(seo)
    plan = build_plan(rows, seo_rows)

    blockers: list[str] = []
    if not plan["source_identity_complete"]:
        blockers.append("legacy SEO source does not reconcile one-to-one by SKU and protected identity")
    if plan["unresolved_taxonomy"]:
        blockers.append(f"{len(plan['unresolved_taxonomy'])} taxonomy row(s) remain unresolved")

    if args.apply and blockers:
        write_report(output, plan, plan, applied=False, retired=False, validation=validation, gap_audit=gaps)
        raise ValueError("Refusing apply: " + "; ".join(blockers))

    applied = False
    retired = False
    current_plan = plan
    if args.apply:
        create_catalog_backup(catalog)
        apply_plan(rows, plan)
        atomic_write(catalog, fields, rows)
        validation = validate_catalog(catalog, gaps)
        _fields, applied_rows = read_csv(catalog)
        current_plan = build_plan(applied_rows, seo_rows)
        if current_plan["taxonomy_changes"] or current_plan["unresolved_taxonomy"] or current_plan["content_changes"]:
            raise ValueError("Post-apply consolidation did not converge; restore the generated rollback snapshot")
        applied = True
        if args.retire_seo_source:
            if not retirement_ready(current_plan):
                raise ValueError("Refusing SEO source retirement: reconciliation is not complete")
            seo.unlink()
            retired = True

    write_report(output, plan, current_plan, applied=applied, retired=retired, validation=validation, gap_audit=gaps)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (CatalogValidationError, OSError, csv.Error, ValueError) as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
