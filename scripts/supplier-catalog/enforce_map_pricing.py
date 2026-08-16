#!/usr/bin/env python3
"""Audit and optionally remediate canonical catalog pricing against DTB policy.

This deterministic operational tool mirrors the production pricing principles
without becoming runtime commerce authority. It uses the committed margin-policy
analysis to resolve category -> brand -> global minimum/target margins, enforces
COGS/minimum-margin/MAP hard floors when those inputs exist, never infers MAP,
and never lowers existing prices.

Preview is the default. Pass --apply to write only upward regular/sale price
changes after validating the proposed result, creating a rollback snapshot, and
revalidating the complete canonical catalog.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sys
import tempfile
from collections import Counter
from decimal import Decimal, InvalidOperation, ROUND_CEILING
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent / "catalog"))
from official_catalog_schema import (  # noqa: E402
    CatalogValidationError,
    create_catalog_backup,
    validate_catalog,
)

DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = DEFAULT_CATALOG.with_name("dtb_official_catalog.include-gaps.json")
DEFAULT_POLICY_REPORT = HERE / "results" / "margin" / "margin-policy-analysis.json"
DEFAULT_REPORT = HERE / "results" / "map" / "map-pricing-optimization-report.json"

TYPE_FIELD = "Type"
SKU_FIELD = "SKU"
PARENT_FIELD = "Parent"
BRAND_FIELD = "Brands"
CATEGORY_FIELD = "Categories"
MAP_FIELD = "Meta: _dtb_map_price"
REGULAR_FIELD = "Regular price"
SALE_FIELD = "Sale price"
COST_FIELD = "Cost of goods"
PRICE_OWNERS = {"simple", "variation"}
CENT = Decimal("0.01")
HUNDRED = Decimal("100")


class PricingError(RuntimeError):
    pass


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                raise PricingError(f"{path}: missing CSV header")
            return list(reader.fieldnames), list(reader)
    except (OSError, UnicodeError, csv.Error) as exc:
        raise PricingError(f"Cannot read {path}: {exc}") from exc


def parse_money(
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
        raise PricingError(f"{sku}: invalid {field} value {value!r}") from exc
    if not amount.is_finite() or amount < 0 or (amount == 0 and not allow_zero):
        qualifier = "non-negative" if allow_zero else "positive"
        raise PricingError(f"{sku}: {field} must be a {qualifier} amount")
    return amount.quantize(CENT)


def parse_margin(value: object, *, label: str) -> Decimal:
    try:
        margin = Decimal(str(value))
    except InvalidOperation as exc:
        raise PricingError(f"Invalid {label} {value!r}") from exc
    if not margin.is_finite() or margin <= 0 or margin >= HUNDRED:
        raise PricingError(f"{label} must be greater than 0 and less than 100")
    return margin


def margin_price(cost: Decimal, margin: Decimal) -> Decimal:
    raw = cost / (Decimal("1") - (margin / HUNDRED))
    return raw.quantize(CENT, rounding=ROUND_CEILING)


def gross_margin(price: Decimal | None, cost: Decimal | None) -> str | None:
    if price is None or cost is None or price <= 0:
        return None
    return format((((price - cost) / price) * HUNDRED).quantize(Decimal("0.01")), "f")


def money(value: Decimal | None) -> str:
    return "" if value is None else format(value.quantize(CENT), "f")


def category_paths(raw: str | None) -> list[str]:
    return [part.strip() for part in (raw or "").split(",") if part.strip()]


def load_policy(path: Path) -> dict[str, object]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PricingError(f"Cannot load pricing policy analysis {path}: {exc}") from exc

    global_policy = payload.get("recommended_global_policy")
    if not isinstance(global_policy, dict) or global_policy.get("status") != "EVIDENCE_AVAILABLE":
        raise PricingError(f"{path}: global pricing policy is not evidence-backed")

    minimum = parse_margin(global_policy.get("recommended_minimum_margin_pct"), label="global minimum margin")
    target = parse_margin(global_policy.get("recommended_target_margin_pct"), label="global target margin")
    if target < minimum:
        target = minimum

    def supported(source: object) -> dict[str, dict[str, object]]:
        if not isinstance(source, dict):
            return {}
        result: dict[str, dict[str, object]] = {}
        for key, value in source.items():
            if not isinstance(value, dict) or value.get("status") != "EVIDENCE_AVAILABLE":
                continue
            rule_min = parse_margin(value.get("recommended_minimum_margin_pct"), label=f"{key} minimum margin")
            rule_target = parse_margin(value.get("recommended_target_margin_pct"), label=f"{key} target margin")
            result[str(key)] = {
                "minimum_margin": rule_min,
                "target_margin": max(rule_min, rule_target),
                "evidence_count": int(value.get("eligible_count") or 0),
            }
        return result

    return {
        "global": {
            "minimum_margin": minimum,
            "target_margin": target,
            "evidence_count": int(global_policy.get("eligible_count") or 0),
        },
        "brands": supported(payload.get("brand_policies")),
        "categories": supported(payload.get("category_policies")),
    }


def build_parent_index(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    return {(row.get(SKU_FIELD) or "").strip(): row for row in rows if (row.get(SKU_FIELD) or "").strip()}


def effective_value(row: dict[str, str], parent: dict[str, str] | None, field: str) -> str:
    direct = (row.get(field) or "").strip()
    if direct:
        return direct
    return (parent.get(field) or "").strip() if parent else ""


def resolve_policy(
    row: dict[str, str],
    by_sku: dict[str, dict[str, str]],
    policy: dict[str, object],
) -> dict[str, object]:
    parent = None
    if (row.get(TYPE_FIELD) or "").strip() == "variation":
        parent = by_sku.get((row.get(PARENT_FIELD) or "").strip())

    categories = category_paths(effective_value(row, parent, CATEGORY_FIELD))
    category_rules = policy["categories"]
    assert isinstance(category_rules, dict)
    supported_categories = [path for path in categories if path in category_rules]
    if supported_categories:
        selected = sorted(supported_categories, key=lambda value: (value.count(">"), value), reverse=True)[0]
        rule = category_rules[selected]
        assert isinstance(rule, dict)
        return {"source": "category", "source_label": selected, **rule}

    brand = effective_value(row, parent, BRAND_FIELD)
    brand_rules = policy["brands"]
    assert isinstance(brand_rules, dict)
    if brand in brand_rules:
        rule = brand_rules[brand]
        assert isinstance(rule, dict)
        return {"source": "brand", "source_label": brand, **rule}

    rule = policy["global"]
    assert isinstance(rule, dict)
    return {"source": "global", "source_label": "Global launch policy", **rule}


def write_csv_atomic(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8-sig", newline="", delete=False,
        dir=path.parent, prefix=path.name + ".", suffix=".tmp"
    )
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


def write_json_atomic(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", newline="\n", delete=False,
        dir=path.parent, prefix=path.name + ".", suffix=".tmp"
    )
    temp_path = Path(handle.name)
    try:
        with handle:
            json.dump(payload, handle, indent=2, sort_keys=True, default=str)
            handle.write("\n")
        os.replace(temp_path, path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def audit_rows(
    rows: list[dict[str, str]],
    policy: dict[str, object],
    *,
    global_minimum_override: Decimal | None = None,
    global_target_override: Decimal | None = None,
) -> tuple[list[dict[str, object]], Counter[str]]:
    findings: list[dict[str, object]] = []
    counts: Counter[str] = Counter()
    by_sku = build_parent_index(rows)

    for row_number, row in enumerate(rows, start=2):
        kind = (row.get(TYPE_FIELD) or "").strip()
        if kind not in PRICE_OWNERS:
            continue

        counts["price_owners"] += 1
        sku = (row.get(SKU_FIELD) or "").strip()
        regular = parse_money(row.get(REGULAR_FIELD), field="regular price", sku=sku, allow_zero=True)
        sale = parse_money(row.get(SALE_FIELD), field="sale price", sku=sku, allow_zero=True)
        cost = parse_money(row.get(COST_FIELD), field="cost of goods", sku=sku)
        map_price = parse_money(row.get(MAP_FIELD), field="MAP", sku=sku)
        resolved = resolve_policy(row, by_sku, policy)
        minimum_margin = Decimal(str(resolved["minimum_margin"]))
        target_margin = Decimal(str(resolved["target_margin"]))
        if resolved["source"] == "global":
            minimum_margin = global_minimum_override or minimum_margin
            target_margin = global_target_override or target_margin
            target_margin = max(minimum_margin, target_margin)

        if cost is not None:
            counts["with_cogs"] += 1
        else:
            counts["missing_cogs"] += 1
        if map_price is not None:
            counts["with_map"] += 1
        else:
            counts["missing_map"] += 1

        minimum_price = margin_price(cost, minimum_margin) if cost is not None else None
        target_price = margin_price(cost, target_margin) if cost is not None else None
        hard_candidates = [value for value in (cost, minimum_price, map_price) if value is not None]
        hard_floor = max(hard_candidates) if hard_candidates else None
        preferred_candidates = [value for value in (hard_floor, target_price, map_price) if value is not None]
        preferred = max(preferred_candidates) if preferred_candidates else None

        recommended_regular = max(regular, preferred) if regular is not None and preferred is not None else regular
        recommended_sale = max(sale, hard_floor) if sale is not None and hard_floor is not None else sale

        regular_below_cogs = cost is not None and regular is not None and regular < cost
        sale_below_cogs = cost is not None and sale is not None and sale < cost
        regular_below_minimum = minimum_price is not None and regular is not None and regular < minimum_price
        sale_below_minimum = minimum_price is not None and sale is not None and sale < minimum_price
        regular_below_map = map_price is not None and regular is not None and regular < map_price
        sale_below_map = map_price is not None and sale is not None and sale < map_price
        below_cogs = regular_below_cogs or sale_below_cogs
        below_minimum = regular_below_minimum or sale_below_minimum
        map_violation = regular_below_map or sale_below_map
        regular_change = regular is not None and recommended_regular is not None and recommended_regular > regular
        sale_change = sale is not None and recommended_sale is not None and recommended_sale > sale

        if below_cogs:
            counts["below_cogs"] += 1
        if below_minimum:
            counts["below_minimum_margin"] += 1
        if map_violation:
            counts["map_violations"] += 1
        if regular_change:
            counts["regular_prices_to_raise"] += 1
        if sale_change:
            counts["sale_prices_to_raise"] += 1

        if regular is None:
            status, reason = "blocked", "MISSING_PRICE"
            counts["missing_regular_price"] += 1
        elif below_cogs:
            status, reason = "optimize", "SALE_BELOW_COGS" if sale_below_cogs else "REGULAR_BELOW_COGS"
        elif map_violation:
            status, reason = "optimize", "MAP_FLOOR_VIOLATION"
        elif below_minimum:
            status, reason = "optimize", "BELOW_MINIMUM_MARGIN"
        elif cost is None:
            status, reason = "hold", "MISSING_COGS"
        elif regular_change:
            status, reason = "optimize", "BELOW_TARGET_MARGIN"
        else:
            status, reason = "hold", "PRICE_HEALTHY"

        current_effective = sale if sale is not None and sale > 0 else regular
        recommended_effective = recommended_sale if sale is not None and recommended_sale is not None else recommended_regular
        findings.append({
            "row": row_number,
            "sku": sku,
            "status": status,
            "reason_code": reason,
            "policy_source": resolved["source"],
            "policy_source_label": resolved["source_label"],
            "policy_evidence_count": resolved["evidence_count"],
            "minimum_margin": format(minimum_margin, "f"),
            "target_margin": format(target_margin, "f"),
            "cost": money(cost),
            "map_price": money(map_price),
            "current_regular": money(regular),
            "current_sale": money(sale),
            "minimum_price": money(minimum_price),
            "target_price": money(target_price),
            "hard_floor": money(hard_floor),
            "recommended_regular": money(recommended_regular),
            "recommended_sale": money(recommended_sale),
            "current_margin": gross_margin(current_effective, cost),
            "recommended_margin": gross_margin(recommended_effective, cost),
        })

    counts["optimizer_actions"] = sum(1 for finding in findings if finding["status"] == "optimize")
    return findings, counts


def apply_findings(rows: list[dict[str, str]], findings: list[dict[str, object]]) -> None:
    by_row = {int(finding["row"]): finding for finding in findings}
    for row_number, row in enumerate(rows, start=2):
        finding = by_row.get(row_number)
        if not finding:
            continue
        recommended_regular = str(finding["recommended_regular"] or "")
        recommended_sale = str(finding["recommended_sale"] or "")
        if recommended_regular and (row.get(REGULAR_FIELD) or "").strip():
            row[REGULAR_FIELD] = recommended_regular
        if recommended_sale and (row.get(SALE_FIELD) or "").strip():
            row[SALE_FIELD] = recommended_sale


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--policy-report", type=Path, default=DEFAULT_POLICY_REPORT)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--minimum-margin", default=None, help="Optional global-fallback minimum-margin override.")
    parser.add_argument("--target-margin", default=None, help="Optional global-fallback target-margin override; category/brand policies remain evidence-derived.")
    parser.add_argument("--apply", action="store_true", help="Apply upward regular/sale changes. Preview is default.")
    args = parser.parse_args()

    catalog_path = args.catalog.resolve()
    policy_path = args.policy_report.resolve()
    report_path = args.report.resolve()
    global_minimum_override = parse_margin(args.minimum_margin, label="minimum margin") if args.minimum_margin is not None else None
    global_target_override = parse_margin(args.target_margin, label="target margin") if args.target_margin is not None else None
    if global_minimum_override is not None and global_target_override is not None and global_target_override < global_minimum_override:
        raise PricingError("Global target-margin override must be greater than or equal to the minimum-margin override")

    validate_catalog(catalog_path, DEFAULT_GAPS)
    before_sha = sha256(catalog_path)
    fields, rows = read_csv(catalog_path)
    required_fields = {TYPE_FIELD, SKU_FIELD, PARENT_FIELD, BRAND_FIELD, CATEGORY_FIELD, REGULAR_FIELD, SALE_FIELD, COST_FIELD, MAP_FIELD}
    if missing := sorted(required_fields - set(fields)):
        raise PricingError(f"{catalog_path}: missing pricing fields: {', '.join(missing)}")

    policy = load_policy(policy_path)
    findings, counts = audit_rows(
        rows,
        policy,
        global_minimum_override=global_minimum_override,
        global_target_override=global_target_override,
    )
    rollback_path = None

    if args.apply:
        apply_findings(rows, findings)
        proposed_findings, proposed_counts = audit_rows(
            rows,
            policy,
            global_minimum_override=global_minimum_override,
            global_target_override=global_target_override,
        )
        hard_failures = [
            finding for finding in proposed_findings
            if finding["reason_code"] in {"REGULAR_BELOW_COGS", "SALE_BELOW_COGS", "BELOW_MINIMUM_MARGIN", "MAP_FLOOR_VIOLATION"}
        ]
        if hard_failures:
            raise PricingError(
                "Refusing to write catalog: proposed result still contains hard pricing violation(s): "
                + ", ".join(str(finding["sku"]) for finding in hard_failures[:25])
            )

        rollback_path = create_catalog_backup(catalog_path)
        write_csv_atomic(catalog_path, fields, rows)
        validate_catalog(catalog_path, DEFAULT_GAPS)
        _, written_rows = read_csv(catalog_path)
        _, post_counts = audit_rows(
            written_rows,
            policy,
            global_minimum_override=global_minimum_override,
            global_target_override=global_target_override,
        )
    else:
        post_counts = counts.copy()

    after_sha = sha256(catalog_path)
    payload: dict[str, object] = {
        "schema_version": 2,
        "catalog": str(catalog_path),
        "policy_report": str(policy_path),
        "mode": "apply" if args.apply else "preview",
        "pricing_policy": {
            "policy_resolution": "deepest evidence-backed category -> brand -> global",
            "hard_floor": "max(COGS, COGS/(1-minimum_margin), MAP when configured)",
            "recommended_regular": "max(current_regular, hard_floor, COGS/(1-target_margin))",
            "recommended_sale": "max(current_sale, hard_floor)",
            "rounding": "ROUND_CEILING to 0.01 for margin-derived prices",
            "map_missing_behavior": "do not infer MAP; continue economic optimization when COGS exists",
            "price_direction": "raise-only",
        },
        "counts": dict(sorted(counts.items())),
        "post_apply_counts": dict(sorted(post_counts.items())),
        "catalog_sha256_before": before_sha,
        "catalog_sha256_after": after_sha,
        "rollback_snapshot": str(rollback_path) if rollback_path else None,
        "findings": findings,
    }
    write_json_atomic(report_path, payload)

    print(
        "Pricing policy audit: "
        f"price_owners={counts.get('price_owners', 0)}, "
        f"below_cogs={counts.get('below_cogs', 0)}, "
        f"below_minimum={counts.get('below_minimum_margin', 0)}, "
        f"map_violations={counts.get('map_violations', 0)}, "
        f"regular_raises={counts.get('regular_prices_to_raise', 0)}, "
        f"sale_raises={counts.get('sale_prices_to_raise', 0)}, "
        f"mode={'apply' if args.apply else 'preview'}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (PricingError, CatalogValidationError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
