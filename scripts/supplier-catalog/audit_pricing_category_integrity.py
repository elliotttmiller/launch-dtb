#!/usr/bin/env python3
"""Audit DTB official catalog pricing completeness and effective category mappings.

The WooCommerce export/import shape stores taxonomy primarily on variable parent
rows while child variations own prices. This audit therefore resolves effective
brand/category data through the parent before evaluating price-owning rows.

The script is read-only and writes deterministic JSON/CSV reports. It does not
infer MAP or supplier cost and does not mutate the canonical catalog.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import tempfile
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent / "catalog"))
from official_catalog_schema import CatalogValidationError, validate_catalog  # noqa: E402

DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = DEFAULT_CATALOG.with_name("dtb_official_catalog.include-gaps.json")
RESULT_DIR = HERE / "results" / "audit"
DEFAULT_REPORT = RESULT_DIR / "pricing-category-audit.json"
DEFAULT_PRODUCTS = RESULT_DIR / "pricing-data-gaps.csv"
DEFAULT_CATEGORIES = RESULT_DIR / "category-coverage.csv"
DEFAULT_CATEGORY_ISSUES = RESULT_DIR / "category-mapping-issues.csv"

TYPE = "Type"
ID = "ID"
SKU = "SKU"
PARENT = "Parent"
NAME = "Name"
BRANDS = "Brands"
CATEGORIES = "Categories"
REGULAR = "Regular price"
SALE = "Sale price"
COGS = "Cost of goods"
MAP = "Meta: _dtb_map_price"

PRICE_OWNERS = {"simple", "variation"}
CANONICAL_ROOTS = {"Drywall Finishing Tools", "Stilts & Accessories"}


class AuditError(RuntimeError):
    pass


def parse_decimal(value: str | None) -> Decimal | None:
    raw = (value or "").strip()
    if not raw:
        return None
    try:
        parsed = Decimal(raw)
    except InvalidOperation:
        return None
    return parsed if parsed.is_finite() else None


def split_paths(value: str | None) -> list[str]:
    return [part.strip() for part in (value or "").split(",") if part.strip()]


def effective_value(row: dict[str, str], parent: dict[str, str] | None, field: str) -> str:
    value = (row.get(field) or "").strip()
    if value:
        return value
    return (parent.get(field) or "").strip() if parent else ""


def build_parent_indexes(rows: list[dict[str, str]]) -> tuple[dict[str, dict[str, str]], dict[str, dict[str, str]]]:
    by_sku: dict[str, dict[str, str]] = {}
    by_id: dict[str, dict[str, str]] = {}
    for row in rows:
        sku = (row.get(SKU) or "").strip()
        row_id = (row.get(ID) or "").strip()
        if sku:
            by_sku[sku] = row
        if row_id:
            by_id[row_id] = row
    return by_sku, by_id


def resolve_parent(row: dict[str, str], by_sku: dict[str, dict[str, str]], by_id: dict[str, dict[str, str]]) -> dict[str, str] | None:
    if (row.get(TYPE) or "").strip() != "variation":
        return None
    token = (row.get(PARENT) or "").strip()
    if not token:
        return None
    return by_sku.get(token) or by_id.get(token)


def category_issue_codes(row: dict[str, str], parent: dict[str, str] | None, effective_categories: list[str]) -> list[str]:
    issues: list[str] = []
    kind = (row.get(TYPE) or "").strip()
    raw_categories = split_paths(row.get(CATEGORIES))

    if kind == "variation" and parent is None:
        issues.append("MISSING_PARENT_REFERENCE")
    if kind in PRICE_OWNERS and not effective_categories:
        issues.append("MISSING_EFFECTIVE_CATEGORY")
    if kind == "variation" and not raw_categories and effective_categories:
        # Expected WooCommerce inheritance; informational, not a defect.
        issues.append("CATEGORY_INHERITED_FROM_PARENT")

    for path in effective_categories:
        segments = [segment.strip() for segment in path.split(">") if segment.strip()]
        if not segments:
            issues.append("EMPTY_CATEGORY_PATH")
            continue
        if segments[0] not in CANONICAL_ROOTS:
            issues.append("NONCANONICAL_CATEGORY_ROOT")
        if any(segment in {"Columbia Tools", "Dura-Stilts", "LEVEL5", "Platinum Drywall Tools", "SurPro", "TapeTech"} for segment in segments):
            issues.append("BRAND_EMBEDDED_IN_CATEGORY")
        if path.endswith("Automatic Taping Tools") or path.endswith("Semi-Automatic Taping Tools"):
            issues.append("PARENT_ONLY_FUNCTIONAL_CATEGORY")

    return sorted(set(issues))


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8-sig", newline="", delete=False,
        dir=path.parent, prefix=path.name + ".", suffix=".tmp"
    )
    temp = Path(handle.name)
    try:
        with handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temp, path)
    except Exception:
        temp.unlink(missing_ok=True)
        raise


def write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", newline="\n", delete=False,
        dir=path.parent, prefix=path.name + ".", suffix=".tmp"
    )
    temp = Path(handle.name)
    try:
        with handle:
            json.dump(payload, handle, indent=2, sort_keys=True)
            handle.write("\n")
        os.replace(temp, path)
    except Exception:
        temp.unlink(missing_ok=True)
        raise


def audit(rows: list[dict[str, str]]) -> tuple[dict[str, object], list[dict[str, object]], list[dict[str, object]], list[dict[str, object]]]:
    by_sku, by_id = build_parent_indexes(rows)
    counts: Counter[str] = Counter()
    gap_rows: list[dict[str, object]] = []
    issue_rows: list[dict[str, object]] = []
    category_stats: defaultdict[str, Counter[str]] = defaultdict(Counter)

    for row in rows:
        kind = (row.get(TYPE) or "").strip()
        if kind not in PRICE_OWNERS:
            continue

        counts["price_owning_rows"] += 1
        parent = resolve_parent(row, by_sku, by_id)
        sku = (row.get(SKU) or "").strip()
        name = (row.get(NAME) or "").strip()
        brand = effective_value(row, parent, BRANDS)
        category_value = effective_value(row, parent, CATEGORIES)
        categories = split_paths(category_value)

        regular = parse_decimal(row.get(REGULAR))
        sale = parse_decimal(row.get(SALE))
        cogs = parse_decimal(row.get(COGS))
        map_price = parse_decimal(row.get(MAP))

        if regular is not None and regular >= 0:
            counts["with_regular_price"] += 1
        else:
            counts["missing_regular_price"] += 1
        if cogs is not None and cogs > 0:
            counts["with_cogs"] += 1
        else:
            counts["missing_cogs"] += 1
        if map_price is not None and map_price > 0:
            counts["with_map"] += 1
        else:
            counts["missing_map"] += 1
        if cogs is not None and cogs > 0 and map_price is not None and map_price > 0:
            counts["with_map_and_cogs"] += 1
        if not brand:
            counts["missing_effective_brand"] += 1
        if not categories:
            counts["missing_effective_category"] += 1

        map_violation = False
        if map_price is not None and map_price > 0:
            if regular is not None and regular < map_price:
                map_violation = True
            if sale is not None and sale < map_price:
                map_violation = True
        if map_violation:
            counts["map_violations"] += 1

        if cogs is not None and regular is not None and regular < cogs:
            counts["regular_price_below_cogs"] += 1

        missing_fields: list[str] = []
        if regular is None:
            missing_fields.append("regular_price")
        if cogs is None or cogs <= 0:
            missing_fields.append("cogs")
        if map_price is None or map_price <= 0:
            missing_fields.append("map")
        if not brand:
            missing_fields.append("brand")
        if not categories:
            missing_fields.append("category")

        if missing_fields or map_violation or (cogs is not None and regular is not None and regular < cogs):
            gap_rows.append({
                "sku": sku,
                "name": name,
                "type": kind,
                "parent": (row.get(PARENT) or "").strip(),
                "brand": brand,
                "effective_categories": " | ".join(categories),
                "regular_price": "" if regular is None else str(regular),
                "sale_price": "" if sale is None else str(sale),
                "cogs": "" if cogs is None else str(cogs),
                "map_price": "" if map_price is None else str(map_price),
                "missing_fields": "|".join(missing_fields),
                "map_violation": int(map_violation),
                "regular_price_below_cogs": int(cogs is not None and regular is not None and regular < cogs),
            })

        issues = category_issue_codes(row, parent, categories)
        actionable_issues = [code for code in issues if code != "CATEGORY_INHERITED_FROM_PARENT"]
        if actionable_issues:
            counts["category_mapping_issue_rows"] += 1
            issue_rows.append({
                "sku": sku,
                "name": name,
                "type": kind,
                "parent": (row.get(PARENT) or "").strip(),
                "raw_categories": (row.get(CATEGORIES) or "").strip(),
                "effective_categories": " | ".join(categories),
                "issues": "|".join(actionable_issues),
            })

        for category in categories:
            stat = category_stats[category]
            stat["products"] += 1
            if cogs is not None and cogs > 0:
                stat["with_cogs"] += 1
            if map_price is not None and map_price > 0:
                stat["with_map"] += 1
            if cogs is not None and cogs > 0 and map_price is not None and map_price > 0:
                stat["with_map_and_cogs"] += 1
            if map_violation:
                stat["map_violations"] += 1

    category_rows: list[dict[str, object]] = []
    for category, stat in sorted(category_stats.items()):
        products = stat["products"]
        category_rows.append({
            "category": category,
            "price_owning_products": products,
            "with_cogs": stat["with_cogs"],
            "with_map": stat["with_map"],
            "with_map_and_cogs": stat["with_map_and_cogs"],
            "missing_cogs": products - stat["with_cogs"],
            "missing_map": products - stat["with_map"],
            "map_violations": stat["map_violations"],
            "pricing_evidence_coverage_pct": round((stat["with_map_and_cogs"] / products) * 100, 2) if products else 0,
        })

    report = {
        "schema_version": 1,
        "scope": "effective WooCommerce price-owning products; variation taxonomy inherits from parent",
        "counts": dict(sorted(counts.items())),
        "derived_counts": {
            "missing_both_map_and_cogs": counts["price_owning_rows"] - counts["with_cogs"] - counts["with_map"] + counts["with_map_and_cogs"],
            "cogs_without_map": counts["with_cogs"] - counts["with_map_and_cogs"],
            "map_without_cogs": counts["with_map"] - counts["with_map_and_cogs"],
        },
        "category_count": len(category_rows),
        "notes": [
            "Variation rows inherit Categories and Brands from their variable parent when blank.",
            "Missing MAP is reported as launch-pricing incompleteness, not automatically treated as a catalog defect.",
            "Category coverage counts all price-owning products, while pricing-evidence coverage counts only products with both positive COGS and MAP.",
        ],
    }
    return report, gap_rows, category_rows, issue_rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--pricing-gaps", type=Path, default=DEFAULT_PRODUCTS)
    parser.add_argument("--category-coverage", type=Path, default=DEFAULT_CATEGORIES)
    parser.add_argument("--category-issues", type=Path, default=DEFAULT_CATEGORY_ISSUES)
    args = parser.parse_args()

    catalog = args.catalog.resolve()
    validate_catalog(catalog, DEFAULT_GAPS)
    with catalog.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise AuditError("Catalog has no header")
        required = {TYPE, ID, SKU, PARENT, NAME, BRANDS, CATEGORIES, REGULAR, SALE, COGS, MAP}
        missing = sorted(required - set(reader.fieldnames))
        if missing:
            raise AuditError(f"Catalog missing required fields: {', '.join(missing)}")
        rows = list(reader)

    report, gaps, categories, issues = audit(rows)
    report["catalog"] = str(catalog)
    write_json(args.report.resolve(), report)
    write_csv(args.pricing_gaps.resolve(), gaps, [
        "sku", "name", "type", "parent", "brand", "effective_categories",
        "regular_price", "sale_price", "cogs", "map_price", "missing_fields",
        "map_violation", "regular_price_below_cogs",
    ])
    write_csv(args.category_coverage.resolve(), categories, [
        "category", "price_owning_products", "with_cogs", "with_map",
        "with_map_and_cogs", "missing_cogs", "missing_map", "map_violations",
        "pricing_evidence_coverage_pct",
    ])
    write_csv(args.category_issues.resolve(), issues, [
        "sku", "name", "type", "parent", "raw_categories",
        "effective_categories", "issues",
    ])

    counts = report["counts"]
    print(
        "Pricing/category audit: "
        f"price_owners={counts.get('price_owning_rows', 0)}, "
        f"with_cogs={counts.get('with_cogs', 0)}, "
        f"with_map={counts.get('with_map', 0)}, "
        f"map+cogs={counts.get('with_map_and_cogs', 0)}, "
        f"missing_category={counts.get('missing_effective_category', 0)}, "
        f"category_issues={counts.get('category_mapping_issue_rows', 0)}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AuditError, CatalogValidationError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
