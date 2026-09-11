#!/usr/bin/env python3
"""Audit commercial-offer equivalence for material two-source price conflicts.

Scope is intentionally limited to P0/P1 (>10%) two-source disagreements whose
stored price provenance already resolves to the same normalized price semantic.
The audit is diagnostic only: it never changes identity, observed prices, or
market-price state.
"""
from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path

from analyze_price_provenance import LABEL_TO_KEY, load_provenance_index, choose_record, decimal_price
from competitor_offer import classify_offer_equivalence, extract_offer_signature
from competitor_pricing_core import SITE_KEYS, SITE_LABELS, clean_description

ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
INPUT = REPORT_DIR / "competitor_price_provenance_audit.csv"
OUTPUT = REPORT_DIR / "competitor_commercial_offer_equivalence_audit.csv"
SUMMARY = REPORT_DIR / "competitor_commercial_offer_equivalence_summary.csv"
SITE_LABEL_ORDER = tuple(SITE_LABELS[key] for key in SITE_KEYS)
MATERIAL_PRIORITIES = {"P0_gt_25pct", "P1_10_to_25pct"}


def main() -> int:
    provenance = load_provenance_index()
    rows: list[dict[str, str]] = []
    classification_counts: Counter[str] = Counter()
    strength_counts: Counter[str] = Counter()
    pair_counts: Counter[str] = Counter()
    brand_counts: Counter[str] = Counter()
    priority_counts: Counter[str] = Counter()
    missing_records = 0

    with INPUT.open(newline="", encoding="utf-8-sig") as handle:
        for conflict in csv.DictReader(handle):
            priority = conflict.get("Priority", "")
            if priority not in MATERIAL_PRIORITIES:
                continue
            if conflict.get("Price Semantic Classification") != "SAME_PRICE_SEMANTIC_DIFFERENT_AMOUNT":
                continue

            pair = [part.strip() for part in conflict.get("Retailer Pair", "").split(" vs ") if part.strip()]
            if len(pair) != 2:
                continue
            identity = conflict.get("Identity Key", "")
            records: dict[str, dict[str, object]] = {}
            for label in pair:
                site_key = LABEL_TO_KEY.get(label, "")
                observed = decimal_price(conflict.get(f"{label} Observed Price", ""))
                record = choose_record(provenance.get((site_key, identity), []), observed) if site_key else None
                if record is None:
                    missing_records += 1
                    records[label] = {}
                else:
                    records[label] = record

            left_label, right_label = pair
            left = records[left_label]
            right = records[right_label]
            if not left or not right:
                classification = "OFFER_EQUIVALENCE_UNRESOLVED"
                evidence_strength = "raw_offer_record_missing"
                contradictions = ("raw_offer_record_missing",)
            else:
                left_description, left_quality = clean_description(str(left.get("description") or ""))
                right_description, right_quality = clean_description(str(right.get("description") or ""))
                decision = classify_offer_equivalence(
                    str(left.get("title") or ""),
                    str(right.get("title") or ""),
                    left_description=left_description,
                    right_description=right_description,
                    left_category=str(left.get("category") or ""),
                    right_category=str(right.get("category") or ""),
                )
                classification = decision.classification
                evidence_strength = decision.evidence_strength
                contradictions = decision.contradictions

            classification_counts[classification] += 1
            strength_counts[evidence_strength] += 1
            pair_counts[conflict.get("Retailer Pair", "") or "unknown"] += 1
            brand_counts[conflict.get("Canonical Brand", "") or "unknown"] += 1
            priority_counts[priority] += 1

            out: dict[str, str] = {
                "Identity Key": identity,
                "Canonical Brand": conflict.get("Canonical Brand", ""),
                "Canonical Identifier": conflict.get("Canonical Identifier", ""),
                "Priority": priority,
                "Retailer Pair": conflict.get("Retailer Pair", ""),
                "Missing Retailer": conflict.get("Missing Retailer", ""),
                "Spread % vs Lowest": conflict.get("Spread % vs Lowest", ""),
                "Absolute Spread": conflict.get("Absolute Spread", ""),
                "Offer Equivalence Classification": classification,
                "Offer Evidence Strength": evidence_strength,
                "Offer Contradictions": " | ".join(contradictions),
            }

            for label in SITE_LABEL_ORDER:
                record = records.get(label, {})
                if not record:
                    out[f"{label} Observed Price"] = conflict.get(f"{label} Observed Price", "")
                    out[f"{label} Product Name"] = ""
                    out[f"{label} Category"] = ""
                    out[f"{label} Description Quality"] = ""
                    out[f"{label} Explicit Quantity"] = ""
                    out[f"{label} Quantity Basis"] = ""
                    out[f"{label} Commercial Scope"] = ""
                    out[f"{label} Scope Basis"] = ""
                    out[f"{label} Product URL"] = conflict.get(f"{label} Product URL", "")
                    out[f"{label} Retrieved At"] = conflict.get(f"{label} Retrieved At", "")
                    continue

                description, quality = clean_description(str(record.get("description") or ""))
                signature = extract_offer_signature(
                    str(record.get("title") or ""),
                    description,
                    str(record.get("category") or ""),
                )
                out[f"{label} Observed Price"] = conflict.get(f"{label} Observed Price", "")
                out[f"{label} Product Name"] = str(record.get("title") or "")
                out[f"{label} Category"] = str(record.get("category") or "")
                out[f"{label} Description Quality"] = quality
                out[f"{label} Explicit Quantity"] = "" if signature.explicit_quantity is None else str(signature.explicit_quantity)
                out[f"{label} Quantity Basis"] = signature.quantity_basis
                out[f"{label} Commercial Scope"] = signature.commercial_scope
                out[f"{label} Scope Basis"] = signature.scope_basis
                out[f"{label} Product URL"] = str(record.get("canonical_url") or record.get("url") or "")
                out[f"{label} Retrieved At"] = str(record.get("retrieved_at") or "")

            rows.append(out)

    rows.sort(key=lambda row: (
        0 if row["Priority"] == "P0_gt_25pct" else 1,
        row["Offer Equivalence Classification"],
        row["Canonical Brand"].casefold(),
        row["Canonical Identifier"],
    ))

    base_fields = [
        "Identity Key", "Canonical Brand", "Canonical Identifier", "Priority", "Retailer Pair",
        "Missing Retailer", "Spread % vs Lowest", "Absolute Spread", "Offer Equivalence Classification",
        "Offer Evidence Strength", "Offer Contradictions",
    ]
    site_suffixes = (
        "Observed Price", "Product Name", "Category", "Description Quality", "Explicit Quantity",
        "Quantity Basis", "Commercial Scope", "Scope Basis", "Product URL", "Retrieved At",
    )
    fields = base_fields + [f"{label} {suffix}" for label in SITE_LABEL_ORDER for suffix in site_suffixes]
    with OUTPUT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    with SUMMARY.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["metric", "value", "count"])
        writer.writerow(["material_conflicts_audited", "all", len(rows)])
        writer.writerow(["missing_raw_offer_records", "all", missing_records])
        for value, count in sorted(priority_counts.items()):
            writer.writerow(["priority", value, count])
        for value, count in sorted(classification_counts.items()):
            writer.writerow(["offer_equivalence_classification", value, count])
        for value, count in sorted(strength_counts.items()):
            writer.writerow(["offer_evidence_strength", value, count])
        for value, count in sorted(pair_counts.items()):
            writer.writerow(["retailer_pair", value, count])
        for value, count in sorted(brand_counts.items()):
            writer.writerow(["canonical_brand", value, count])

    print(f"Audited commercial offer equivalence for {len(rows)} >10% two-source conflicts to {OUTPUT}")
    for value, count in sorted(classification_counts.items()):
        print(f"Offer equivalence classification: {value}={count}")
    for value, count in sorted(strength_counts.items()):
        print(f"Offer evidence strength: {value}={count}")
    print(f"Missing raw offer records: {missing_records}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
