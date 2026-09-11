#!/usr/bin/env python3
"""Audit raw price/offer provenance for two-source competitor price conflicts.

This script joins the derived two-source conflict report back to the scraper's
internal ``products.jsonl`` evidence. The public five-column catalog contract is
left unchanged. Provenance is diagnostic only and never mutates competitor or
DTB prices.
"""
from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path

from competitor_catalog_scraper import output_identifier
from competitor_identity import identity_key
from competitor_pricing_core import SITE_KEYS, SITE_LABELS, canonical_brand

ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
INPUT = REPORT_DIR / "competitor_two_source_price_conflict_audit.csv"
OUTPUT = REPORT_DIR / "competitor_price_provenance_audit.csv"
SUMMARY = REPORT_DIR / "competitor_price_provenance_summary.csv"

SITE_LABEL_ORDER = tuple(SITE_LABELS[key] for key in SITE_KEYS)
LABEL_TO_KEY = {label: key for key, label in SITE_LABELS.items()}
PROVENANCE_SUFFIXES = (
    "Observed Price", "Raw Price Basis", "Raw Price", "Regular Price", "Sale Price",
    "Currency", "Availability", "Parse Method", "Retrieved At", "Product URL", "Source Hash",
)


def decimal_price(value: object) -> Decimal | None:
    raw = str(value or "").strip().replace("$", "").replace(",", "")
    if not raw:
        return None
    try:
        amount = Decimal(raw)
    except InvalidOperation:
        return None
    return amount if amount.is_finite() and amount >= 0 else None


def money(value: Decimal | None) -> str:
    return "" if value is None else f"{value:.2f}"


def raw_price_basis(record: dict[str, object], observed: Decimal | None) -> str:
    if observed is None:
        return "observed_price_missing"
    price = decimal_price(record.get("price"))
    regular = decimal_price(record.get("regular_price"))
    sale = decimal_price(record.get("sale_price"))
    matches: list[str] = []
    if sale is not None and sale == observed:
        matches.append("sale_price")
    if regular is not None and regular == observed:
        matches.append("regular_price")
    if price is not None and price == observed:
        matches.append("price")
    if not matches:
        return "not_reconciled_to_raw_fields"
    if sale is not None and regular is not None and sale != regular and "sale_price" in matches:
        return "sale_price"
    if sale is not None and regular is not None and sale != regular and "regular_price" in matches:
        return "regular_price"
    return "+".join(matches)


def load_provenance_index() -> dict[tuple[str, str], list[dict[str, object]]]:
    index: dict[tuple[str, str], list[dict[str, object]]] = defaultdict(list)
    for site_key in SITE_KEYS:
        path = REPORT_DIR / site_key / "products.jsonl"
        if not path.exists():
            continue
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue
                title = str(record.get("title") or "")
                brand_key = canonical_brand(str(record.get("brand") or ""), title)
                identifier = output_identifier(site_key, record)
                key = identity_key(brand_key, identifier)
                if key:
                    index[(site_key, key)].append(record)
    return index


def choose_record(records: list[dict[str, object]], observed: Decimal | None) -> dict[str, object] | None:
    if not records:
        return None
    if observed is not None:
        matching = []
        for record in records:
            values = {
                decimal_price(record.get("price")),
                decimal_price(record.get("regular_price")),
                decimal_price(record.get("sale_price")),
            }
            if observed in values:
                matching.append(record)
        if matching:
            records = matching
    return max(records, key=lambda row: str(row.get("retrieved_at") or ""))


def pair_semantics(left_basis: str, right_basis: str, left_found: bool, right_found: bool) -> str:
    if not left_found or not right_found:
        return "PROVENANCE_INCOMPLETE"
    if "not_reconciled" in left_basis or "not_reconciled" in right_basis:
        return "RAW_FIELD_RECONCILIATION_REQUIRED"
    if {left_basis, right_basis} == {"sale_price", "regular_price"}:
        return "SALE_VS_REGULAR_FIELD"
    if left_basis == right_basis:
        return "SAME_PRICE_FIELD_SEMANTIC_DIFFERENT_AMOUNT"
    return "DIFFERENT_RAW_PRICE_FIELD_SEMANTICS"


def empty_provenance() -> dict[str, str]:
    return {
        "found": "no", "basis": "not_in_conflict_pair", "url": "", "canonical_url": "",
        "raw_price": "", "regular_price": "", "sale_price": "", "currency": "",
        "availability": "", "parse_method": "", "retrieved_at": "", "source_hash": "",
    }


def main() -> int:
    provenance = load_provenance_index()
    rows: list[dict[str, str]] = []
    semantic_counts: Counter[str] = Counter()
    basis_counts: Counter[str] = Counter()
    priority_counts: Counter[str] = Counter()
    missing_provenance = 0

    with INPUT.open(newline="", encoding="utf-8-sig") as handle:
        for conflict in csv.DictReader(handle):
            relative = decimal_price(conflict.get("Spread % vs Lowest", ""))
            if relative is None:
                priority = "unknown"
            elif relative > Decimal("25"):
                priority = "P0_gt_25pct"
            elif relative > Decimal("10"):
                priority = "P1_10_to_25pct"
            elif relative > Decimal("1"):
                priority = "P2_1_to_10pct"
            else:
                priority = "P3_lte_1pct"
            priority_counts[priority] += 1

            identity = conflict.get("Identity Key", "")
            pair = [part.strip() for part in conflict.get("Retailer Pair", "").split(" vs ") if part.strip()]
            if len(pair) != 2:
                continue
            site_data: dict[str, dict[str, str]] = {label: empty_provenance() for label in SITE_LABEL_ORDER}
            for label in pair:
                site_key = LABEL_TO_KEY.get(label, "")
                observed = decimal_price(conflict.get(f"{label} Price", ""))
                candidates = provenance.get((site_key, identity), []) if site_key else []
                record = choose_record(candidates, observed)
                if record is None:
                    missing_provenance += 1
                    site_data[label]["basis"] = "provenance_missing"
                    continue
                basis = raw_price_basis(record, observed)
                basis_counts[f"{label}:{basis}"] += 1
                site_data[label] = {
                    "found": "yes", "basis": basis,
                    "url": str(record.get("url") or ""),
                    "canonical_url": str(record.get("canonical_url") or ""),
                    "raw_price": money(decimal_price(record.get("price"))),
                    "regular_price": money(decimal_price(record.get("regular_price"))),
                    "sale_price": money(decimal_price(record.get("sale_price"))),
                    "currency": str(record.get("currency") or ""),
                    "availability": str(record.get("availability") or ""),
                    "parse_method": str(record.get("parse_method") or ""),
                    "retrieved_at": str(record.get("retrieved_at") or ""),
                    "source_hash": str(record.get("source_hash") or ""),
                }

            left, right = pair
            semantic = pair_semantics(
                site_data[left]["basis"], site_data[right]["basis"],
                site_data[left]["found"] == "yes", site_data[right]["found"] == "yes",
            )
            semantic_counts[semantic] += 1
            out = {
                "Identity Key": identity,
                "Canonical Brand": conflict.get("Canonical Brand", ""),
                "Canonical Identifier": conflict.get("Canonical Identifier", ""),
                "Priority": priority,
                "Retailer Pair": conflict.get("Retailer Pair", ""),
                "Missing Retailer": conflict.get("Missing Retailer", ""),
                "Spread % vs Lowest": conflict.get("Spread % vs Lowest", ""),
                "Absolute Spread": conflict.get("Absolute Spread", ""),
                "Price Semantic Classification": semantic,
            }
            for label in SITE_LABEL_ORDER:
                data = site_data[label]
                out[f"{label} Observed Price"] = conflict.get(f"{label} Price", "")
                out[f"{label} Raw Price Basis"] = data["basis"]
                out[f"{label} Raw Price"] = data["raw_price"]
                out[f"{label} Regular Price"] = data["regular_price"]
                out[f"{label} Sale Price"] = data["sale_price"]
                out[f"{label} Currency"] = data["currency"]
                out[f"{label} Availability"] = data["availability"]
                out[f"{label} Parse Method"] = data["parse_method"]
                out[f"{label} Retrieved At"] = data["retrieved_at"]
                out[f"{label} Product URL"] = data["canonical_url"] or data["url"]
                out[f"{label} Source Hash"] = data["source_hash"]
            rows.append(out)

    rows.sort(key=lambda row: (
        {"P0_gt_25pct": 0, "P1_10_to_25pct": 1, "P2_1_to_10pct": 2, "P3_lte_1pct": 3}.get(row["Priority"], 4),
        -Decimal(row["Spread % vs Lowest"] or "0"),
        row["Identity Key"],
    ))
    base_fields = [
        "Identity Key", "Canonical Brand", "Canonical Identifier", "Priority", "Retailer Pair",
        "Missing Retailer", "Spread % vs Lowest", "Absolute Spread", "Price Semantic Classification",
    ]
    fields = base_fields + [f"{label} {suffix}" for label in SITE_LABEL_ORDER for suffix in PROVENANCE_SUFFIXES]
    with OUTPUT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader(); writer.writerows(rows)

    with SUMMARY.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["metric", "value", "count"])
        writer.writerow(["audited_two_source_conflicts", "all", len(rows)])
        writer.writerow(["missing_provenance_observations", "all", missing_provenance])
        for value, count in sorted(priority_counts.items()):
            writer.writerow(["priority", value, count])
        for value, count in sorted(semantic_counts.items()):
            writer.writerow(["price_semantic_classification", value, count])
        for value, count in sorted(basis_counts.items()):
            writer.writerow(["retailer_raw_price_basis", value, count])

    print(f"Audited raw price provenance for {len(rows)} two-source conflicts to {OUTPUT}")
    for value, count in sorted(priority_counts.items()):
        print(f"Price provenance priority: {value}={count}")
    for value, count in sorted(semantic_counts.items()):
        print(f"Price semantic classification: {value}={count}")
    print(f"Missing raw provenance observations: {missing_provenance}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
