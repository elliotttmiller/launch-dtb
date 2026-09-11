#!/usr/bin/env python3
"""Classify cross-retailer price conflicts without synthesizing a market price.

This diagnostic consumes the manufacturer-scoped comparison report and explains
*how* verified retailer prices disagree. It never mutates raw scrape evidence,
never chooses a winner, and never manufactures a replacement market price.

Primary goals:
- distinguish two-agree/one-outlier conflicts from all-distinct conflicts;
- identify which retailer is the outlier when two verified retailers agree;
- surface same-retailer duplicate-price conflicts;
- flag exact multiplicative relationships that commonly indicate pack/unit issues;
- quantify absolute and relative spread for targeted extractor review.
"""
from __future__ import annotations

import csv
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
INPUT = REPORT_DIR / "competitor_price_comparison_by_sku.csv"
OUTPUT = REPORT_DIR / "competitor_price_conflict_audit.csv"
SUMMARY = REPORT_DIR / "competitor_price_conflict_summary.csv"

SITE_COLUMNS = {
    "All-Wall": "All-Wall Price",
    "Al's Taping Tools": "Al's Taping Tools Price",
    "Wall Tools": "Wall Tools Price",
}
QUALITY_COLUMNS = {
    "All-Wall": "All-Wall Evidence Quality",
    "Al's Taping Tools": "Al's Taping Tools Evidence Quality",
    "Wall Tools": "Wall Tools Evidence Quality",
}
COMMON_PACK_FACTORS = {
    Decimal("2"), Decimal("3"), Decimal("4"), Decimal("5"), Decimal("6"),
    Decimal("8"), Decimal("10"), Decimal("12"), Decimal("20"), Decimal("24"),
    Decimal("25"), Decimal("50"), Decimal("100"),
}


def price(value: str) -> Decimal | None:
    raw = (value or "").strip().replace("$", "").replace(",", "")
    if not raw:
        return None
    try:
        amount = Decimal(raw)
    except InvalidOperation:
        return None
    if not amount.is_finite() or amount < 0:
        return None
    return amount


def money(value: Decimal | None) -> str:
    return "" if value is None else f"{value:.2f}"


def pct(value: Decimal | None) -> str:
    return "" if value is None else f"{value:.2f}"


def exact_pack_factor(values: list[Decimal]) -> str:
    nonzero = sorted({value for value in values if value > 0})
    if len(nonzero) < 2:
        return ""
    low = nonzero[0]
    factors: list[str] = []
    for value in nonzero[1:]:
        ratio = value / low
        rounded = ratio.quantize(Decimal("1"))
        if ratio == rounded and rounded in COMMON_PACK_FACTORS:
            factors.append(f"{money(low)}x{int(rounded)}={money(value)}")
    return " | ".join(factors)


def classify(row: dict[str, str]) -> dict[str, str] | None:
    if row.get("Market Price Status") != "MARKET_PRICE_CONFLICT":
        return None

    site_prices = {
        site: price(row.get(column, ""))
        for site, column in SITE_COLUMNS.items()
    }
    available = {site: value for site, value in site_prices.items() if value is not None}
    values = list(available.values())
    distinct = sorted(set(values))

    same_site_conflicts = [
        site for site, quality_column in QUALITY_COLUMNS.items()
        if "conflicting" in (row.get(quality_column, "") or "").casefold()
    ]

    pattern = "unknown_conflict"
    agreed_price: Decimal | None = None
    outlier_site = ""
    outlier_price: Decimal | None = None

    if same_site_conflicts:
        pattern = "retailer_duplicate_price_conflict"
    elif len(values) == 3 and len(distinct) == 2:
        counts = Counter(values)
        common = [value for value, count in counts.items() if count == 2]
        if common:
            pattern = "two_retailers_agree_one_outlier"
            agreed_price = common[0]
            outlier_value = next(value for value, count in counts.items() if count == 1)
            outlier_price = outlier_value
            outlier_site = next(site for site, value in available.items() if value == outlier_value)
    elif len(values) == 3 and len(distinct) == 3:
        pattern = "all_three_prices_distinct"
    elif len(values) == 2 and len(distinct) == 2:
        pattern = "two_source_disagreement"
    elif len(values) >= 2:
        pattern = "multi_source_disagreement"

    low = min(values) if values else None
    high = max(values) if values else None
    spread = high - low if low is not None and high is not None else None
    spread_pct = (spread / low * Decimal("100")) if spread is not None and low not in {None, Decimal("0")} else None
    pack_factor = exact_pack_factor(values)

    if pack_factor:
        probable_cause = "possible_pack_or_unit_multiplier"
    elif same_site_conflicts:
        probable_cause = "same_retailer_duplicate_price_disagreement"
    elif spread_pct is not None and spread_pct <= Decimal("1"):
        probable_cause = "small_price_drift_or_rounding"
    elif spread_pct is not None and spread_pct <= Decimal("10"):
        probable_cause = "possible_sale_or_stale_price"
    elif pattern == "two_retailers_agree_one_outlier":
        probable_cause = "single_retailer_price_outlier"
    else:
        probable_cause = "requires_source_price_review"

    return {
        "Identity Key": row.get("Identity Key", ""),
        "Canonical Brand": row.get("Canonical Brand", ""),
        "Canonical Identifier": row.get("Canonical Identifier", ""),
        "Conflict Pattern": pattern,
        "Probable Cause": probable_cause,
        "Outlier Retailer": outlier_site,
        "Agreed Price": money(agreed_price),
        "Outlier Price": money(outlier_price),
        "All-Wall Price": row.get("All-Wall Price", ""),
        "Al's Taping Tools Price": row.get("Al's Taping Tools Price", ""),
        "Wall Tools Price": row.get("Wall Tools Price", ""),
        "Absolute Spread": money(spread),
        "Spread % vs Lowest": pct(spread_pct),
        "Possible Pack Factor": pack_factor,
        "All-Wall Evidence Quality": row.get("All-Wall Evidence Quality", ""),
        "Al's Taping Tools Evidence Quality": row.get("Al's Taping Tools Evidence Quality", ""),
        "Wall Tools Evidence Quality": row.get("Wall Tools Evidence Quality", ""),
        "All-Wall Product": row.get("All-Wall Product Name", ""),
        "Al's Taping Tools Product": row.get("Al's Taping Tools Product Name", ""),
        "Wall Tools Product": row.get("Wall Tools Product Name", ""),
    }


def main() -> int:
    with INPUT.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))

    conflicts = [result for row in rows if (result := classify(row)) is not None]
    conflicts.sort(key=lambda row: (
        0 if row["Conflict Pattern"] == "two_retailers_agree_one_outlier" else 1,
        -(price(row["Absolute Spread"]) or Decimal("0")),
        row["Canonical Brand"].casefold(),
        row["Canonical Identifier"].casefold(),
    ))

    fields = list(conflicts[0].keys()) if conflicts else [
        "Identity Key", "Canonical Brand", "Canonical Identifier", "Conflict Pattern",
        "Probable Cause", "Outlier Retailer", "Agreed Price", "Outlier Price",
        "All-Wall Price", "Al's Taping Tools Price", "Wall Tools Price",
        "Absolute Spread", "Spread % vs Lowest", "Possible Pack Factor",
        "All-Wall Evidence Quality", "Al's Taping Tools Evidence Quality",
        "Wall Tools Evidence Quality", "All-Wall Product", "Al's Taping Tools Product",
        "Wall Tools Product",
    ]
    with OUTPUT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(conflicts)

    pattern_counts = Counter(row["Conflict Pattern"] for row in conflicts)
    cause_counts = Counter(row["Probable Cause"] for row in conflicts)
    outlier_counts = Counter(row["Outlier Retailer"] for row in conflicts if row["Outlier Retailer"])
    summary_rows: list[tuple[str, str, int]] = [("metric", "value", len(conflicts))]
    summary_rows.extend(("conflict_pattern", value, count) for value, count in sorted(pattern_counts.items()))
    summary_rows.extend(("probable_cause", value, count) for value, count in sorted(cause_counts.items()))
    summary_rows.extend(("outlier_retailer", value, count) for value, count in sorted(outlier_counts.items()))
    summary_rows.append(("possible_pack_factor", "present", sum(1 for row in conflicts if row["Possible Pack Factor"])))

    with SUMMARY.open("w", newline="", encoding="utf-8") as handle:
        csv.writer(handle).writerows(summary_rows)

    print(f"Audited {len(conflicts)} market-price conflicts to {OUTPUT}")
    for value, count in pattern_counts.most_common():
        print(f"Conflict pattern: {value}={count}")
    for value, count in outlier_counts.most_common():
        print(f"Outlier retailer: {value}={count}")
    print(f"Possible pack/unit multipliers: {sum(1 for row in conflicts if row['Possible Pack Factor'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
