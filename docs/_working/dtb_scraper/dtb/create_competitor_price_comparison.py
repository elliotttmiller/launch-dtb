#!/usr/bin/env python3
"""Create manufacturer-scoped cross-competitor observed-price comparisons.

Identity is separator preserving and contradiction aware. Exact strict identifiers
remain authoritative by default; only explicitly approved brand-scoped aliases
may collapse formatting variants to one protected identifier. Market price is
never averaged or median-derived.
"""
from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

from competitor_identity import (
    canonical_identifier,
    identity_key,
    legacy_compact_identifier,
    normalization_collisions,
    resolved_identifier,
)
from competitor_pricing_core import (
    SITE_KEYS,
    SITE_LABELS,
    canonical_brand,
    canonical_brand_label,
    clean_description,
    decimal_price,
    extract_variation_signature,
    identifier_title_contradictions,
    market_price_decision,
    money,
    variation_contradictions,
)

ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
OUTPUT_CSV = REPORT_DIR / "competitor_price_comparison_by_sku.csv"
OUTPUT_REVIEW = REPORT_DIR / "competitor_price_comparison_review.csv"
OUTPUT_COLLISIONS = REPORT_DIR / "competitor_identifier_collision_audit.csv"


def load_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for site_key in SITE_KEYS:
        path = REPORT_DIR / site_key / "catalog.csv"
        with path.open(newline="", encoding="utf-8-sig") as handle:
            for index, row in enumerate(csv.DictReader(handle), start=1):
                title = (row.get("Product Name") or "").strip()
                identifier = (row.get("SKU") or "").strip()
                brand_key = canonical_brand(row.get("Brand", ""), title)
                strict_identifier = canonical_identifier(identifier)
                resolved = resolved_identifier(brand_key, identifier)
                description, description_quality = clean_description(row.get("Product Description", ""))
                contradictions = identifier_title_contradictions(identifier, title, brand_key)
                rows.append({
                    **row,
                    "_site_key": site_key,
                    "_site_label": SITE_LABELS[site_key],
                    "_row": str(index),
                    "_brand_key": brand_key,
                    "_strict_identifier_key": strict_identifier,
                    "_identifier_key": resolved,
                    "_legacy_identifier_key": legacy_compact_identifier(identifier),
                    "_identity_key": identity_key(brand_key, identifier),
                    "_alias_applied": "yes" if strict_identifier and resolved != strict_identifier else "no",
                    "_description": description,
                    "_description_quality": description_quality,
                    "_identity_contradictions": " | ".join(contradictions),
                })
    return rows


def resolve_site(rows: list[dict[str, str]]) -> dict[str, str]:
    prices = tuple(
        price for price in (decimal_price(row.get("Product Price", "")) for row in rows)
        if price is not None
    )
    names = sorted({
        (row.get("Product Name") or "").strip()
        for row in rows
        if (row.get("Product Name") or "").strip()
    })
    strict_ids = sorted({row.get("_strict_identifier_key", "") for row in rows if row.get("_strict_identifier_key", "")})
    distinct = sorted(set(prices))
    if not prices:
        resolved_price, quality = None, "missing_price"
    elif len(distinct) > 1:
        resolved_price, quality = None, "conflicting_duplicate_prices"
    else:
        resolved_price = distinct[0]
        quality = "single_observation" if len(rows) == 1 else "duplicate_same_price"
    return {
        "price": money(resolved_price),
        "duplicate_count": str(max(0, len(rows) - 1)),
        "observed_prices": " | ".join(money(price) for price in prices),
        "product": " | ".join(names[:3]),
        "quality": quality,
        "strict_identifiers": " | ".join(strict_ids),
        "alias_applied": "yes" if any(row.get("_alias_applied") == "yes" for row in rows) else "no",
    }


def cross_site_title_contradictions(site_resolved: dict[str, dict[str, str]]) -> list[str]:
    titles = [
        (site, data.get("product", ""))
        for site, data in site_resolved.items()
        if data.get("product", "")
    ]
    contradictions: list[str] = []
    for index, (left_site, left_title) in enumerate(titles):
        left = extract_variation_signature(left_title)
        for right_site, right_title in titles[index + 1:]:
            mismatch = variation_contradictions(left, extract_variation_signature(right_title))
            contradictions.extend(f"{left_site}_vs_{right_site}:{item}" for item in mismatch)
    return contradictions


def write_collision_audit(rows: list[dict[str, str]]) -> tuple[int, int]:
    scoped = [row for row in rows if row["_brand_key"] and row["_strict_identifier_key"]]
    collisions = normalization_collisions(scoped, brand_field="_brand_key", identifier_field="SKU")
    audit_rows: list[dict[str, str]] = []
    approved_equivalences = 0
    unresolved_collisions = 0
    for (brand_key, legacy_key), strict_ids in sorted(collisions.items()):
        affected = [
            row for row in scoped
            if row["_brand_key"] == brand_key and row["_legacy_identifier_key"] == legacy_key
        ]
        resolved_ids = {
            resolved_identifier(brand_key, identifier)
            for identifier in strict_ids
            if identifier
        }
        if len(resolved_ids) == 1:
            disposition = "approved_alias_equivalence"
            approved_equivalences += 1
        else:
            disposition = "unresolved_format_collision_review"
            unresolved_collisions += 1
        audit_rows.append({
            "Canonical Brand": canonical_brand_label(brand_key) or brand_key,
            "Legacy Compact Key": legacy_key,
            "Distinct Strict Identifiers": " | ".join(sorted(strict_ids)),
            "Resolved Identifiers": " | ".join(sorted(resolved_ids)),
            "Raw Identifiers": " | ".join(sorted({(row.get("SKU") or "").strip() for row in affected})),
            "Competitors": " | ".join(sorted({row["_site_label"] for row in affected})),
            "Observation Count": str(len(affected)),
            "Disposition": disposition,
        })
    fields = [
        "Canonical Brand", "Legacy Compact Key", "Distinct Strict Identifiers",
        "Resolved Identifiers", "Raw Identifiers", "Competitors", "Observation Count", "Disposition",
    ]
    with OUTPUT_COLLISIONS.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(audit_rows)
    return approved_equivalences, unresolved_collisions


def main() -> int:
    rows = load_rows()
    approved_equivalences, unresolved_collisions = write_collision_audit(rows)
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    review_rows: list[dict[str, str]] = []

    for row in rows:
        reason = ""
        if not row["_brand_key"]:
            reason = "canonical_brand_unknown"
        elif not row["_identifier_key"]:
            reason = "identifier_missing"
        elif row["_identity_contradictions"]:
            reason = "title_identifier_contradiction"
        if reason:
            review_rows.append({
                "Competitor": row["_site_label"],
                "Brand": row.get("Brand", ""),
                "Product Name": row.get("Product Name", ""),
                "SKU": row.get("SKU", ""),
                "Strict Identifier": row.get("_strict_identifier_key", ""),
                "Resolved Identifier": row.get("_identifier_key", ""),
                "Alias Applied": row.get("_alias_applied", "no"),
                "Product Price": row.get("Product Price", ""),
                "Reason": reason,
                "Contradictions": row["_identity_contradictions"],
            })
            continue
        grouped[row["_identity_key"]].append(row)

    fields = [
        "Identity Key", "Canonical Brand", "Canonical Identifier", "Source Count", "Observation Count",
        "Alias Applied", "Strict Identifiers", "Verified Price Source Count", "Distinct Verified Prices",
        "Identity Status", "Identity Contradictions", "Market Price Status", "Market Price", "Observed Price Spread",
    ]
    for site_key in SITE_KEYS:
        label = SITE_LABELS[site_key]
        fields.extend([
            f"{label} Price", f"{label} Duplicate Count", f"{label} Observed Duplicate Prices",
            f"{label} Evidence Quality", f"{label} Product Name", f"{label} Strict Identifiers",
            f"{label} Alias Applied",
        ])

    output_rows: list[dict[str, str]] = []
    for key, records in grouped.items():
        by_site: dict[str, list[dict[str, str]]] = defaultdict(list)
        for record in records:
            by_site[record["_site_key"]].append(record)
        if len(by_site) < 2:
            continue
        site_resolved = {site: resolve_site(site_rows) for site, site_rows in by_site.items()}
        title_conflicts = cross_site_title_contradictions(site_resolved)
        verified_site_prices = [
            price for price in (
                decimal_price(item.get("price", ""))
                for item in site_resolved.values()
            )
            if price is not None
        ]
        has_site_conflict = any(
            item.get("quality", "").startswith("conflicting_")
            for item in site_resolved.values()
        )
        if title_conflicts:
            market_status, market_price, spread = "IDENTITY_CONFLICT", None, None
            verified_count, distinct_count = 0, 0
        else:
            market = market_price_decision(verified_site_prices, has_conflict=has_site_conflict)
            market_status, market_price, spread = market.status, market.market_price, market.price_spread
            verified_count, distinct_count = market.verified_source_count, market.distinct_price_count
        first = records[0]
        strict_ids = sorted({row["_strict_identifier_key"] for row in records if row["_strict_identifier_key"]})
        row = {
            "Identity Key": key,
            "Canonical Brand": canonical_brand_label(first["_brand_key"]) or first["_brand_key"],
            "Canonical Identifier": first["_identifier_key"],
            "Source Count": str(len(by_site)),
            "Observation Count": str(len(records)),
            "Alias Applied": "yes" if any(record["_alias_applied"] == "yes" for record in records) else "no",
            "Strict Identifiers": " | ".join(strict_ids),
            "Verified Price Source Count": str(verified_count),
            "Distinct Verified Prices": str(distinct_count),
            "Identity Status": "conflict" if title_conflicts else "verified",
            "Identity Contradictions": " | ".join(title_conflicts),
            "Market Price Status": market_status,
            "Market Price": money(market_price),
            "Observed Price Spread": money(spread),
        }
        for site_key in SITE_KEYS:
            label = SITE_LABELS[site_key]
            resolved = site_resolved.get(site_key, {})
            row[f"{label} Price"] = resolved.get("price", "")
            row[f"{label} Duplicate Count"] = resolved.get("duplicate_count", "0")
            row[f"{label} Observed Duplicate Prices"] = resolved.get("observed_prices", "")
            row[f"{label} Evidence Quality"] = resolved.get("quality", "")
            row[f"{label} Product Name"] = resolved.get("product", "")
            row[f"{label} Strict Identifiers"] = resolved.get("strict_identifiers", "")
            row[f"{label} Alias Applied"] = resolved.get("alias_applied", "no")
        output_rows.append(row)

    output_rows.sort(key=lambda row: (
        row["Market Price Status"],
        row["Canonical Brand"].casefold(),
        row["Canonical Identifier"],
    ))
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(output_rows)

    review_fields = [
        "Competitor", "Brand", "Product Name", "SKU", "Strict Identifier",
        "Resolved Identifier", "Alias Applied", "Product Price", "Reason", "Contradictions",
    ]
    with OUTPUT_REVIEW.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=review_fields)
        writer.writeheader()
        writer.writerows(review_rows)

    verified_3 = sum(row["Market Price Status"] == "MARKET_PRICE_VERIFIED_3_OF_3" for row in output_rows)
    verified_2 = sum(row["Market Price Status"] == "MARKET_PRICE_VERIFIED_2_OF_3" for row in output_rows)
    conflicts = sum(row["Market Price Status"] == "MARKET_PRICE_CONFLICT" for row in output_rows)
    identity_conflicts = sum(row["Market Price Status"] == "IDENTITY_CONFLICT" for row in output_rows)
    alias_groups = sum(row["Alias Applied"] == "yes" for row in output_rows)
    print(f"Wrote {len(output_rows)} manufacturer-scoped multi-source comparisons to {OUTPUT_CSV}")
    print(
        f"Verified market prices: 3/3={verified_3}; 2/3={verified_2}; "
        f"price_conflicts={conflicts}; identity_conflicts={identity_conflicts}"
    )
    print(f"Multi-source groups using approved identifier aliases: {alias_groups}")
    print(
        f"Legacy compact collisions: approved_alias_equivalence={approved_equivalences}; "
        f"unresolved_review={unresolved_collisions}"
    )
    print(f"Wrote {len(review_rows)} unscoped or identity-invalid rows to {OUTPUT_REVIEW}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
