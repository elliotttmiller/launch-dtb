#!/usr/bin/env python3
"""Analyze DTB catalog economics and recommend evidence-based MVP margin policy.

The canonical WooCommerce CSV stores taxonomy primarily on variable parent rows,
while variations own the actual prices. This analysis therefore resolves brand
and category through the parent for variation rows before building segment
statistics. It never infers missing MAP or COGS and never mutates the catalog.

Policy evidence is restricted to price-owning rows with both positive COGS and
configured MAP. Global and segment recommendations use:

    minimum margin = P25 of eligible MAP gross margins
    target margin  = P50 / median of eligible MAP gross margins

Both are rounded downward to the configured policy increment. MAP remains an
independent hard floor in the runtime pricing engine.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
import statistics
import sys
import tempfile
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation, ROUND_CEILING, ROUND_FLOOR
from pathlib import Path
from typing import Iterable

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent / "catalog"))
from official_catalog_schema import CatalogValidationError, validate_catalog  # noqa: E402

DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = DEFAULT_CATALOG.with_name("dtb_official_catalog.include-gaps.json")
DEFAULT_REPORT = HERE / "results" / "margin" / "margin-policy-analysis.json"
DEFAULT_DETAIL_CSV = HERE / "results" / "margin" / "margin-policy-sku-detail.csv"

REGULAR_FIELD = "Regular price"
SALE_FIELD = "Sale price"
COST_FIELD = "Cost of goods"
MAP_FIELD = "Meta: _dtb_map_price"
BRAND_FIELD = "Brands"
CATEGORY_FIELD = "Categories"
TYPE_FIELD = "Type"
ID_FIELD = "ID"
SKU_FIELD = "SKU"
PARENT_FIELD = "Parent"
NAME_FIELD = "Name"

CENT = Decimal("0.01")
HUNDRED = Decimal("100")
PERCENT_QUANTUM = Decimal("0.01")
PRICE_OWNERS = {"simple", "variation"}


class MarginAnalysisError(RuntimeError):
    """Margin-analysis input or policy error."""


def parse_decimal(
    value: str | None,
    *,
    field: str,
    sku: str,
    allow_blank: bool = True,
    allow_zero: bool = False,
) -> Decimal | None:
    raw = (value or "").strip()
    if not raw and allow_blank:
        return None
    try:
        amount = Decimal(raw)
    except InvalidOperation as exc:
        raise MarginAnalysisError(f"{sku}: invalid {field} value {value!r}") from exc
    if not amount.is_finite() or amount < 0 or (amount == 0 and not allow_zero):
        qualifier = "non-negative" if allow_zero else "positive"
        raise MarginAnalysisError(f"{sku}: {field} must be a {qualifier} amount")
    return amount


def money(value: Decimal | None) -> str:
    return "" if value is None else format(value.quantize(CENT), "f")


def percent(value: Decimal | None) -> str:
    return "" if value is None else format(value.quantize(PERCENT_QUANTUM), "f")


def gross_profit(price: Decimal | None, cost: Decimal | None) -> Decimal | None:
    return None if price is None or cost is None else price - cost


def gross_margin_pct(price: Decimal | None, cost: Decimal | None) -> Decimal | None:
    if price is None or cost is None or price <= 0:
        return None
    return ((price - cost) / price) * HUNDRED


def markup_pct(price: Decimal | None, cost: Decimal | None) -> Decimal | None:
    if price is None or cost is None or cost <= 0:
        return None
    return ((price - cost) / cost) * HUNDRED


def target_price(cost: Decimal | None, target_margin_pct: Decimal) -> Decimal | None:
    if cost is None or cost <= 0 or target_margin_pct <= 0 or target_margin_pct >= HUNDRED:
        return None
    raw = cost / (Decimal("1") - (target_margin_pct / HUNDRED))
    return raw.quantize(CENT, rounding=ROUND_CEILING)


def allowable_cost(price: Decimal | None, target_margin_pct: Decimal) -> Decimal | None:
    if price is None or price <= 0:
        return None
    return (price * (Decimal("1") - (target_margin_pct / HUNDRED))).quantize(CENT)


def percentile(values: list[Decimal], probability: Decimal) -> Decimal | None:
    if not values:
        return None
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    position = probability * Decimal(len(ordered) - 1)
    lower = int(position.to_integral_value(rounding=ROUND_FLOOR))
    upper = int(math.ceil(float(position)))
    if lower == upper:
        return ordered[lower]
    fraction = position - Decimal(lower)
    return ordered[lower] + (ordered[upper] - ordered[lower]) * fraction


def round_policy_down(value: Decimal, increment: Decimal) -> Decimal:
    if increment <= 0:
        raise MarginAnalysisError("Policy increment must be positive")
    units = (value / increment).to_integral_value(rounding=ROUND_FLOOR)
    return (units * increment).quantize(PERCENT_QUANTUM)


def describe(values: Iterable[Decimal]) -> dict[str, object]:
    ordered = sorted(list(values))
    if not ordered:
        return {"count": 0}
    mean = sum(ordered, Decimal("0")) / Decimal(len(ordered))
    median = Decimal(str(statistics.median([float(value) for value in ordered])))
    return {
        "count": len(ordered),
        "min": percent(ordered[0]),
        "p10": percent(percentile(ordered, Decimal("0.10"))),
        "p25": percent(percentile(ordered, Decimal("0.25"))),
        "median_p50": percent(median),
        "mean": percent(mean),
        "p75": percent(percentile(ordered, Decimal("0.75"))),
        "p90": percent(percentile(ordered, Decimal("0.90"))),
        "max": percent(ordered[-1]),
    }


def policy_from_map_margins(
    values: list[Decimal],
    *,
    minimum_sample_size: int,
    increment: Decimal,
) -> dict[str, object]:
    distribution = describe(values)
    count = len(values)
    if count < minimum_sample_size:
        return {
            "status": "INSUFFICIENT_EVIDENCE",
            "eligible_count": count,
            "minimum_sample_size": minimum_sample_size,
            "distribution": distribution,
            "recommended_minimum_margin_pct": None,
            "recommended_target_margin_pct": None,
        }

    p25 = percentile(values, Decimal("0.25"))
    p50 = percentile(values, Decimal("0.50"))
    assert p25 is not None and p50 is not None
    minimum = round_policy_down(max(Decimal("0"), p25), increment)
    target = round_policy_down(max(minimum, p50), increment)
    return {
        "status": "EVIDENCE_AVAILABLE",
        "eligible_count": count,
        "minimum_sample_size": minimum_sample_size,
        "method": {
            "minimum_margin": "P25 of eligible MAP gross margins, rounded down",
            "target_margin": "P50/median of eligible MAP gross margins, rounded down",
            "policy_increment_pct": percent(increment),
            "primary_evidence": "configured MAP + positive COGS on price-owning rows",
        },
        "distribution": distribution,
        "recommended_minimum_margin_pct": percent(minimum),
        "recommended_target_margin_pct": percent(target),
    }


def category_labels(raw: str) -> list[str]:
    return [value.strip() for value in raw.split(",") if value.strip()]


def build_indexes(rows: list[dict[str, str]]) -> tuple[dict[str, dict[str, str]], dict[str, dict[str, str]]]:
    by_sku: dict[str, dict[str, str]] = {}
    by_id: dict[str, dict[str, str]] = {}
    for row in rows:
        sku = (row.get(SKU_FIELD) or "").strip()
        row_id = (row.get(ID_FIELD) or "").strip()
        if sku:
            by_sku[sku] = row
        if row_id:
            by_id[row_id] = row
    return by_sku, by_id


def resolve_parent(
    row: dict[str, str],
    by_sku: dict[str, dict[str, str]],
    by_id: dict[str, dict[str, str]],
) -> dict[str, str] | None:
    if (row.get(TYPE_FIELD) or "").strip() != "variation":
        return None
    token = (row.get(PARENT_FIELD) or "").strip()
    return by_sku.get(token) or by_id.get(token) if token else None


def effective_taxonomy(
    row: dict[str, str],
    parent: dict[str, str] | None,
    field: str,
) -> tuple[str, str]:
    direct = (row.get(field) or "").strip()
    if direct:
        return direct, "row"
    inherited = (parent.get(field) or "").strip() if parent else ""
    if inherited:
        return inherited, "parent"
    return "", "missing"


def read_rows(path: Path) -> list[dict[str, str]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                raise MarginAnalysisError(f"{path}: missing CSV header")
            required = {
                TYPE_FIELD,
                ID_FIELD,
                SKU_FIELD,
                PARENT_FIELD,
                NAME_FIELD,
                REGULAR_FIELD,
                SALE_FIELD,
                COST_FIELD,
                MAP_FIELD,
                BRAND_FIELD,
                CATEGORY_FIELD,
            }
            missing = sorted(required - set(reader.fieldnames))
            if missing:
                raise MarginAnalysisError(f"{path}: missing fields: {', '.join(missing)}")
            return list(reader)
    except (OSError, UnicodeError, csv.Error) as exc:
        raise MarginAnalysisError(f"Cannot read {path}: {exc}") from exc


def analyze_rows(
    rows: list[dict[str, str]],
    *,
    comparison_target_margin: Decimal,
    minimum_sample_size: int,
    policy_increment: Decimal,
) -> tuple[list[dict[str, str]], dict[str, object]]:
    counts: Counter[str] = Counter()
    details: list[dict[str, str]] = []
    overall_map_margins: list[Decimal] = []
    by_brand: defaultdict[str, list[Decimal]] = defaultdict(list)
    by_category: defaultdict[str, list[Decimal]] = defaultdict(list)
    current_margins: list[Decimal] = []
    by_sku, by_id = build_indexes(rows)

    for row in rows:
        kind = (row.get(TYPE_FIELD) or "").strip()
        if kind == "variable":
            counts["variable_parents_excluded"] += 1
            continue
        if kind not in PRICE_OWNERS:
            counts["unsupported_type_excluded"] += 1
            continue

        counts["price_owning_rows"] += 1
        sku = (row.get(SKU_FIELD) or "").strip()
        name = (row.get(NAME_FIELD) or "").strip()
        parent = resolve_parent(row, by_sku, by_id)
        brand_raw, brand_source = effective_taxonomy(row, parent, BRAND_FIELD)
        categories_raw, category_source = effective_taxonomy(row, parent, CATEGORY_FIELD)
        brand = brand_raw or "(Unknown)"
        categories = category_labels(categories_raw)

        if category_source == "parent":
            counts["category_inherited_from_parent"] += 1
        elif category_source == "missing":
            counts["missing_effective_category"] += 1
        if brand_source == "parent":
            counts["brand_inherited_from_parent"] += 1
        elif brand_source == "missing":
            counts["missing_effective_brand"] += 1
        if kind == "variation" and parent is None:
            counts["variation_parent_unresolved"] += 1

        regular = parse_decimal(row.get(REGULAR_FIELD), field="regular price", sku=sku, allow_zero=True)
        sale = parse_decimal(row.get(SALE_FIELD), field="sale price", sku=sku, allow_zero=True)
        cost = parse_decimal(row.get(COST_FIELD), field="cost of goods", sku=sku)
        map_price = parse_decimal(row.get(MAP_FIELD), field="MAP", sku=sku)
        effective = sale if sale is not None and sale > 0 else regular

        if regular is not None:
            counts["with_regular_price"] += 1
        if cost is not None:
            counts["with_cogs"] += 1
        if map_price is not None:
            counts["with_map"] += 1
        if cost is not None and map_price is not None:
            counts["eligible_map_cost"] += 1

        current_margin = gross_margin_pct(effective, cost)
        regular_margin = gross_margin_pct(regular, cost)
        map_margin = gross_margin_pct(map_price, cost)
        current_markup = markup_pct(effective, cost)
        current_profit = gross_profit(effective, cost)
        target = target_price(cost, comparison_target_margin)
        allowable = allowable_cost(effective, comparison_target_margin)
        cost_gap = (cost - allowable) if cost is not None and allowable is not None else None

        if current_margin is not None:
            current_margins.append(current_margin)
        if map_margin is not None:
            overall_map_margins.append(map_margin)
            by_brand[brand].append(map_margin)
            for category in categories:
                by_category[category].append(map_margin)

        map_violation = map_price is not None and (
            (regular is not None and regular < map_price)
            or (sale is not None and sale < map_price)
        )
        if map_violation:
            counts["map_violations"] += 1

        details.append(
            {
                "sku": sku,
                "name": name,
                "type": kind,
                "parent": (row.get(PARENT_FIELD) or "").strip(),
                "brand": brand,
                "brand_source": brand_source,
                "categories": " | ".join(categories),
                "category_source": category_source,
                "regular_price": money(regular),
                "sale_price": money(sale),
                "effective_price": money(effective),
                "cogs": money(cost),
                "map_price": money(map_price),
                "gross_profit": money(current_profit),
                "current_gross_margin_pct": percent(current_margin),
                "regular_gross_margin_pct": percent(regular_margin),
                "current_markup_pct": percent(current_markup),
                "map_gross_margin_pct": percent(map_margin),
                "comparison_target_margin_pct": percent(comparison_target_margin),
                "target_margin_price": money(target),
                "allowable_cost_at_current_price": money(allowable),
                "cost_gap_vs_target": money(cost_gap),
                "map_violation": "1" if map_violation else "0",
            }
        )

    brand_policy = {
        key: policy_from_map_margins(
            values,
            minimum_sample_size=minimum_sample_size,
            increment=policy_increment,
        )
        for key, values in sorted(by_brand.items())
    }
    category_policy = {
        key: policy_from_map_margins(
            values,
            minimum_sample_size=minimum_sample_size,
            increment=policy_increment,
        )
        for key, values in sorted(by_category.items())
    }

    report: dict[str, object] = {
        "schema_version": 2,
        "scope": "price-owning simple products and variations; variation taxonomy inherited from parent; variable parents excluded as price records",
        "counts": dict(sorted(counts.items())),
        "comparison_target_margin_pct": percent(comparison_target_margin),
        "current_effective_margin_distribution": describe(current_margins),
        "map_margin_distribution": describe(overall_map_margins),
        "recommended_global_policy": policy_from_map_margins(
            overall_map_margins,
            minimum_sample_size=minimum_sample_size,
            increment=policy_increment,
        ),
        "brand_policies": brand_policy,
        "category_policies": category_policy,
        "interpretation": {
            "taxonomy": "Blank variation Brands/Categories inherit from the variable parent before segment analysis.",
            "map_margin": "Gross margin available when selling at configured official MAP.",
            "minimum_margin": "Evidence-derived lower guardrail candidate; not a substitute for MAP.",
            "target_margin": "Evidence-derived central margin objective candidate; not permission to lower a higher current price.",
            "current_margin": "Uses active sale price when a positive sale price exists; otherwise regular price.",
            "allowable_cost": "Maximum COGS supported by the current effective price at the comparison target margin.",
            "cost_gap": "Positive means actual COGS exceeds allowable cost at the current effective price; negative means cost headroom remains.",
        },
    }
    return details, report


def write_json_atomic(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        newline="\n",
        delete=False,
        dir=path.parent,
        prefix=path.name + ".",
        suffix=".tmp",
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


def write_detail_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        raise MarginAnalysisError("No price-owning rows available for detail report")
    handle = tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8-sig",
        newline="",
        delete=False,
        dir=path.parent,
        prefix=path.name + ".",
        suffix=".tmp",
    )
    temp = Path(handle.name)
    try:
        with handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0]), lineterminator="\r\n")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temp, path)
    except Exception:
        temp.unlink(missing_ok=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--detail-csv", type=Path, default=DEFAULT_DETAIL_CSV)
    parser.add_argument(
        "--comparison-target-margin",
        default="30.00",
        help="Existing/proposed target margin used for target-price and cost-gap comparisons; default: 30.00",
    )
    parser.add_argument(
        "--minimum-sample-size",
        type=int,
        default=5,
        help="Minimum eligible MAP+COGS observations required before recommending a policy; default: 5",
    )
    parser.add_argument(
        "--policy-increment",
        default="0.50",
        help="Percentage-point increment used to round evidence-derived policy downward; default: 0.50",
    )
    args = parser.parse_args()

    if args.minimum_sample_size < 2:
        raise MarginAnalysisError("Minimum sample size must be at least 2")
    try:
        comparison_target = Decimal(str(args.comparison_target_margin))
        policy_increment = Decimal(str(args.policy_increment))
    except InvalidOperation as exc:
        raise MarginAnalysisError("Margin and policy increment arguments must be numeric") from exc
    if comparison_target <= 0 or comparison_target >= HUNDRED:
        raise MarginAnalysisError("Comparison target margin must be greater than 0 and less than 100")
    if policy_increment <= 0:
        raise MarginAnalysisError("Policy increment must be positive")

    catalog = args.catalog.resolve()
    validate_catalog(catalog, DEFAULT_GAPS)
    rows = read_rows(catalog)
    details, report = analyze_rows(
        rows,
        comparison_target_margin=comparison_target,
        minimum_sample_size=args.minimum_sample_size,
        policy_increment=policy_increment,
    )
    report["catalog"] = str(catalog)
    report["minimum_sample_size"] = args.minimum_sample_size
    report["policy_increment_pct"] = percent(policy_increment)
    write_json_atomic(args.report.resolve(), report)
    write_detail_csv(args.detail_csv.resolve(), details)

    policy = report["recommended_global_policy"]
    assert isinstance(policy, dict)
    print(
        "Margin policy analysis: "
        f"price_owners={report['counts'].get('price_owning_rows', 0)}, "
        f"map+cogs={report['counts'].get('eligible_map_cost', 0)}, "
        f"map_violations={report['counts'].get('map_violations', 0)}, "
        f"category_inherited={report['counts'].get('category_inherited_from_parent', 0)}, "
        f"missing_effective_category={report['counts'].get('missing_effective_category', 0)}, "
        f"policy_status={policy.get('status')}, "
        f"minimum={policy.get('recommended_minimum_margin_pct')}, "
        f"target={policy.get('recommended_target_margin_pct')}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (MarginAnalysisError, CatalogValidationError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
