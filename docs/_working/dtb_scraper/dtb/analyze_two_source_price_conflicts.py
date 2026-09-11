#!/usr/bin/env python3
"""Audit true two-source retailer price disagreements.

Consumes the contradiction-aware cross-retailer comparison and produces focused
pair/brand/spread diagnostics for MARKET_PRICE_CONFLICT rows with exactly two
priced retailer observations. No prices are synthesized and no source evidence
is mutated.
"""
from __future__ import annotations

import csv
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
INPUT = REPORT_DIR / "competitor_price_comparison_by_sku.csv"
OUTPUT = REPORT_DIR / "competitor_two_source_price_conflict_audit.csv"
SUMMARY = REPORT_DIR / "competitor_two_source_price_conflict_summary.csv"

SITES = ("All-Wall", "Al's Taping Tools", "Wall Tools")


def decimal_price(value: str) -> Decimal | None:
    raw = (value or "").strip().replace("$", "").replace(",", "")
    if not raw:
        return None
    try:
        amount = Decimal(raw)
    except InvalidOperation:
        return None
    return amount if amount.is_finite() and amount >= 0 else None


def money(value: Decimal | None) -> str:
    return "" if value is None else f"{value:.2f}"


def pct(value: Decimal | None) -> str:
    return "" if value is None else f"{value:.2f}"


def spread_bucket(relative_pct: Decimal | None) -> str:
    if relative_pct is None:
        return "unknown"
    if relative_pct <= Decimal("0.25"):
        return "<=0.25%"
    if relative_pct <= Decimal("1"):
        return "0.25-1%"
    if relative_pct <= Decimal("5"):
        return "1-5%"
    if relative_pct <= Decimal("10"):
        return "5-10%"
    if relative_pct <= Decimal("25"):
        return "10-25%"
    return ">25%"


def cents_bucket(spread: Decimal) -> str:
    if spread <= Decimal("0.05"):
        return "<=0.05"
    if spread <= Decimal("0.25"):
        return "0.06-0.25"
    if spread <= Decimal("1.00"):
        return "0.26-1.00"
    if spread <= Decimal("5.00"):
        return "1.01-5.00"
    if spread <= Decimal("25.00"):
        return "5.01-25.00"
    return ">25.00"


def main() -> int:
    audit_rows: list[dict[str, str]] = []
    pair_counts: Counter[str] = Counter()
    brand_counts: Counter[str] = Counter()
    missing_counts: Counter[str] = Counter()
    relative_counts: Counter[str] = Counter()
    absolute_counts: Counter[str] = Counter()
    lower_retailer_counts: Counter[str] = Counter()

    with INPUT.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            if row.get("Market Price Status") != "MARKET_PRICE_CONFLICT":
                continue
            prices = {
                site: decimal_price(row.get(f"{site} Price", ""))
                for site in SITES
            }
            available = {site: amount for site, amount in prices.items() if amount is not None}
            if len(available) != 2 or len(set(available.values())) != 2:
                continue

            ordered_sites = [site for site in SITES if site in available]
            pair = " vs ".join(ordered_sites)
            missing = next(site for site in SITES if site not in available)
            low_site, low_price = min(available.items(), key=lambda item: item[1])
            high_site, high_price = max(available.items(), key=lambda item: item[1])
            spread = high_price - low_price
            relative = (spread / low_price * Decimal("100")) if low_price > 0 else None

            pair_counts[pair] += 1
            brand_counts[row.get("Canonical Brand", "") or "unknown"] += 1
            missing_counts[missing] += 1
            relative_counts[spread_bucket(relative)] += 1
            absolute_counts[cents_bucket(spread)] += 1
            lower_retailer_counts[low_site] += 1

            out = {
                "Identity Key": row.get("Identity Key", ""),
                "Canonical Brand": row.get("Canonical Brand", ""),
                "Canonical Identifier": row.get("Canonical Identifier", ""),
                "Retailer Pair": pair,
                "Missing Retailer": missing,
                "Lower-Priced Retailer": low_site,
                "Lower Price": money(low_price),
                "Higher-Priced Retailer": high_site,
                "Higher Price": money(high_price),
                "Absolute Spread": money(spread),
                "Spread % vs Lowest": pct(relative),
                "Absolute Spread Bucket": cents_bucket(spread),
                "Relative Spread Bucket": spread_bucket(relative),
                "Uses Approved Identifier Alias": row.get("Uses Approved Identifier Alias", "no"),
            }
            for site in SITES:
                out[f"{site} Price"] = row.get(f"{site} Price", "")
                out[f"{site} Evidence Quality"] = row.get(f"{site} Evidence Quality", "")
                out[f"{site} Product Name"] = row.get(f"{site} Product Name", "")
                out[f"{site} Strict Identifiers"] = row.get(f"{site} Strict Identifiers", "")
            audit_rows.append(out)

    audit_rows.sort(key=lambda row: (
        -Decimal(row["Spread % vs Lowest"] or "0"),
        row["Canonical Brand"].casefold(),
        row["Canonical Identifier"],
    ))
    fields = list(audit_rows[0].keys()) if audit_rows else []
    with OUTPUT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader(); writer.writerows(audit_rows)

    with SUMMARY.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["metric", "value", "count"])
        writer.writerow(["two_source_conflicts", "all", len(audit_rows)])
        for value, count in sorted(pair_counts.items()):
            writer.writerow(["retailer_pair", value, count])
        for value, count in sorted(missing_counts.items()):
            writer.writerow(["missing_retailer", value, count])
        for value, count in sorted(lower_retailer_counts.items()):
            writer.writerow(["lower_priced_retailer", value, count])
        for value, count in sorted(relative_counts.items()):
            writer.writerow(["relative_spread_bucket", value, count])
        for value, count in sorted(absolute_counts.items()):
            writer.writerow(["absolute_spread_bucket", value, count])
        for value, count in sorted(brand_counts.items()):
            writer.writerow(["canonical_brand", value, count])

    print(f"Audited {len(audit_rows)} two-source price conflicts to {OUTPUT}")
    for value, count in sorted(pair_counts.items()):
        print(f"Two-source retailer pair: {value}={count}")
    for value, count in sorted(missing_counts.items()):
        print(f"Missing retailer: {value}={count}")
    for value, count in sorted(relative_counts.items()):
        print(f"Relative spread: {value}={count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
