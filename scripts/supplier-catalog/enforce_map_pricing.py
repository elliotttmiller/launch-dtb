#!/usr/bin/env python3
"""Audit and optionally remediate MAP-configured prices in the official catalog.

This is a deterministic operational tool for the MVP pricing rollout. It only
acts on catalog rows that already have a positive `Meta: _dtb_map_price` value.
Rows without MAP remain untouched until official MAP evidence is configured.

Pricing contract for MAP-configured rows:

    gross_profit = price - cost
    gross_margin = (price - cost) / price
    target_price = cost / (1 - target_margin)
    optimization_floor = max(MAP, target_price) when COGS exists, otherwise MAP
    recommended_regular = max(current_regular, optimization_floor)
    recommended_sale = max(current_sale, MAP) when a sale price exists

Target-price calculations round upward to the next cent so rounding can never
place the recommendation below the requested target margin. MAP is an absolute
floor for both regular and sale prices. Existing prices above the calculated
floor are never lowered by this MVP operation.

Preview is the default. Pass `--apply` to mutate the canonical catalog after a
rollback snapshot is created and the full catalog validates successfully.
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
DEFAULT_REPORT = HERE / "results" / "map" / "map-pricing-optimization-report.json"
MAP_FIELD = "Meta: _dtb_map_price"
REGULAR_FIELD = "Regular price"
SALE_FIELD = "Sale price"
COST_FIELD = "Cost of goods"
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


def parse_positive_money(value: str, *, field: str, sku: str, allow_blank: bool = True) -> Decimal | None:
    raw = value.strip()
    if not raw and allow_blank:
        return None
    try:
        amount = Decimal(raw)
    except InvalidOperation as exc:
        raise PricingError(f"{sku}: invalid {field} value {value!r}") from exc
    if not amount.is_finite() or amount <= 0:
        raise PricingError(f"{sku}: {field} must be a positive amount")
    return amount.quantize(CENT)


def parse_margin(value: str) -> Decimal:
    try:
        margin = Decimal(value)
    except InvalidOperation as exc:
        raise PricingError(f"Invalid target margin {value!r}") from exc
    if not margin.is_finite() or margin <= 0 or margin >= HUNDRED:
        raise PricingError("Target margin must be greater than 0 and less than 100")
    return margin


def target_margin_price(cost: Decimal, target_margin: Decimal) -> Decimal:
    raw = cost / (Decimal("1") - (target_margin / HUNDRED))
    return raw.quantize(CENT, rounding=ROUND_CEILING)


def gross_margin(price: Decimal | None, cost: Decimal | None) -> str | None:
    if price is None or cost is None or price <= 0:
        return None
    margin = ((price - cost) / price) * HUNDRED
    return format(margin.quantize(Decimal("0.01")), "f")


def money(value: Decimal | None) -> str:
    return "" if value is None else format(value.quantize(CENT), "f")


def write_csv_atomic(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    handle = tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8-sig",
        newline="",
        delete=False,
        dir=path.parent,
        prefix=path.name + ".",
        suffix=".tmp",
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
        "w",
        encoding="utf-8",
        newline="\n",
        delete=False,
        dir=path.parent,
        prefix=path.name + ".",
        suffix=".tmp",
    )
    temp_path = Path(handle.name)
    try:
        with handle:
            json.dump(payload, handle, indent=2, sort_keys=True)
            handle.write("\n")
        os.replace(temp_path, path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def audit_rows(rows: list[dict[str, str]], target_margin: Decimal) -> tuple[list[dict[str, object]], Counter[str]]:
    findings: list[dict[str, object]] = []
    counts: Counter[str] = Counter()

    for row_number, row in enumerate(rows, start=2):
        sku = (row.get("SKU") or "").strip()
        map_raw = (row.get(MAP_FIELD) or "").strip()
        if not map_raw:
            counts["map_not_configured"] += 1
            continue

        map_price = parse_positive_money(map_raw, field="MAP", sku=sku, allow_blank=False)
        regular = parse_positive_money(row.get(REGULAR_FIELD, ""), field="regular price", sku=sku)
        sale = parse_positive_money(row.get(SALE_FIELD, ""), field="sale price", sku=sku)
        cost = parse_positive_money(row.get(COST_FIELD, ""), field="cost of goods", sku=sku)
        assert map_price is not None

        counts["map_configured"] += 1
        if cost is not None:
            counts["map_with_cost"] += 1
        else:
            counts["map_missing_cost"] += 1

        target = target_margin_price(cost, target_margin) if cost is not None else None
        floor = max(value for value in (map_price, target) if value is not None)

        if regular is None:
            counts["map_missing_regular_price"] += 1
            findings.append(
                {
                    "row": row_number,
                    "sku": sku,
                    "status": "blocked",
                    "reason_code": "MISSING_PRICE",
                    "map_price": money(map_price),
                    "cost": money(cost),
                    "current_regular": "",
                    "current_sale": money(sale),
                    "target_margin": format(target_margin, "f"),
                    "target_price": money(target),
                    "optimization_floor": money(floor),
                    "recommended_regular": "",
                    "recommended_sale": money(max(sale, map_price)) if sale is not None else "",
                    "current_margin": None,
                    "recommended_margin": None,
                }
            )
            continue

        recommended_regular = max(regular, floor)
        recommended_sale = max(sale, map_price) if sale is not None else None
        regular_below_map = regular < map_price
        sale_below_map = sale is not None and sale < map_price
        regular_change = recommended_regular != regular
        sale_change = recommended_sale is not None and sale is not None and recommended_sale != sale

        if regular_below_map or sale_below_map:
            status = "optimize"
            reason_code = "MAP_FLOOR_VIOLATION"
            counts["map_violations"] += 1
        elif regular_change:
            status = "optimize"
            reason_code = "BELOW_TARGET_MARGIN"
            counts["below_target_margin"] += 1
        else:
            status = "hold"
            reason_code = "PRICE_HEALTHY" if cost is not None else "MISSING_COGS"
            counts["hold"] += 1

        if regular_change:
            counts["regular_prices_to_raise"] += 1
        if sale_change:
            counts["sale_prices_to_raise"] += 1

        findings.append(
            {
                "row": row_number,
                "sku": sku,
                "status": status,
                "reason_code": reason_code,
                "map_price": money(map_price),
                "cost": money(cost),
                "current_regular": money(regular),
                "current_sale": money(sale),
                "target_margin": format(target_margin, "f"),
                "target_price": money(target),
                "optimization_floor": money(floor),
                "recommended_regular": money(recommended_regular),
                "recommended_sale": money(recommended_sale),
                "current_margin": gross_margin(sale if sale is not None else regular, cost),
                "recommended_margin": gross_margin(recommended_sale if recommended_sale is not None else recommended_regular, cost),
            }
        )

    counts["rows_scanned"] = len(rows)
    counts["optimizer_actions"] = sum(1 for finding in findings if finding["status"] == "optimize")
    return findings, counts


def apply_findings(rows: list[dict[str, str]], findings: list[dict[str, object]]) -> None:
    by_row = {int(finding["row"]): finding for finding in findings}
    for row_number, row in enumerate(rows, start=2):
        finding = by_row.get(row_number)
        if not finding or finding["status"] == "blocked":
            continue
        recommended_regular = str(finding["recommended_regular"] or "")
        recommended_sale = str(finding["recommended_sale"] or "")
        if recommended_regular:
            row[REGULAR_FIELD] = recommended_regular
        if (row.get(SALE_FIELD) or "").strip() and recommended_sale:
            row[SALE_FIELD] = recommended_sale


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--target-margin", default="30.00", help="Target gross margin percentage; default: 30.00")
    parser.add_argument("--apply", action="store_true", help="Apply recommended raises to the catalog. Preview is default.")
    args = parser.parse_args()

    catalog_path = args.catalog.resolve()
    report_path = args.report.resolve()
    target_margin = parse_margin(str(args.target_margin))

    validate_catalog(catalog_path, DEFAULT_GAPS)
    before_sha = sha256(catalog_path)
    fields, rows = read_csv(catalog_path)
    required_fields = {"SKU", REGULAR_FIELD, SALE_FIELD, COST_FIELD, MAP_FIELD}
    if missing := sorted(required_fields - set(fields)):
        raise PricingError(f"{catalog_path}: missing pricing fields: {', '.join(missing)}")

    findings, counts = audit_rows(rows, target_margin)
    rollback_path = None

    if args.apply:
        rollback_path = create_catalog_backup(catalog_path)
        apply_findings(rows, findings)
        write_csv_atomic(catalog_path, fields, rows)
        validate_catalog(catalog_path, DEFAULT_GAPS)

        # Fail closed if an applied catalog still carries a configured MAP
        # violation. The audit is recalculated from the actual written file.
        _, written_rows = read_csv(catalog_path)
        post_findings, post_counts = audit_rows(written_rows, target_margin)
        if post_counts.get("map_violations", 0):
            raise PricingError(
                f"Applied catalog still contains {post_counts['map_violations']} MAP-configured violation(s)"
            )
        post_actionable = [f for f in post_findings if f["status"] == "optimize"]
    else:
        post_counts = counts.copy()
        post_actionable = [f for f in findings if f["status"] == "optimize"]

    after_sha = sha256(catalog_path)
    payload: dict[str, object] = {
        "schema_version": 1,
        "catalog": str(catalog_path),
        "mode": "apply" if args.apply else "preview",
        "pricing_policy": {
            "target_margin_percent": format(target_margin, "f"),
            "target_price_formula": "cost / (1 - target_margin)",
            "target_price_rounding": "ROUND_CEILING to 0.01",
            "map_rule": "regular and sale prices may never be below configured MAP",
            "regular_recommendation": "max(current_regular, MAP, target_price when COGS exists)",
            "sale_recommendation": "max(current_sale, MAP)",
            "map_missing_behavior": "leave unchanged; not optimizer-eligible",
        },
        "counts": dict(sorted(counts.items())),
        "post_apply_counts": dict(sorted(post_counts.items())),
        "catalog_sha256_before": before_sha,
        "catalog_sha256_after": after_sha,
        "rollback_snapshot": str(rollback_path) if rollback_path else None,
        "remaining_actionable_after_run": len(post_actionable),
        "findings": findings,
    }
    write_json_atomic(report_path, payload)

    print(
        "MAP pricing audit: "
        f"configured={counts.get('map_configured', 0)}, "
        f"violations={counts.get('map_violations', 0)}, "
        f"regular_raises={counts.get('regular_prices_to_raise', 0)}, "
        f"sale_raises={counts.get('sale_prices_to_raise', 0)}, "
        f"missing_map={counts.get('map_not_configured', 0)}, "
        f"mode={'apply' if args.apply else 'preview'}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (PricingError, CatalogValidationError) as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
