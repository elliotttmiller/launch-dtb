#!/usr/bin/env python3
"""Build contradiction-aware DTB-to-competitor evidence and market aggregates."""
from __future__ import annotations

import csv
from collections import Counter, defaultdict
from pathlib import Path

from competitor_pricing_core import (
    SITE_KEYS,
    SITE_LABELS,
    canonical_brand,
    clean_description,
    compact_identifier,
    decimal_price,
    effective_dtb_price,
    market_status,
    median_decimal,
    money,
    resolve_site_evidence,
    token_key,
    classify_match,
)

ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
OFFICIAL_RELATIVE = Path("products") / "launch" / "official" / "dtb_official_catalog.csv"
REPO_ROOT = next(path for path in [ROOT, *ROOT.parents] if (path / OFFICIAL_RELATIVE).exists())
OFFICIAL_CATALOG = REPO_ROOT / OFFICIAL_RELATIVE

OUTPUT_MATCHES = REPORT_DIR / "dtb_official_competitor_matches.csv"
OUTPUT_MARKET = REPORT_DIR / "dtb_official_competitor_best_matches.csv"  # compatibility filename; now aggregate evidence
OUTPUT_UNMATCHED = REPORT_DIR / "dtb_official_competitor_unmatched.csv"
OUTPUT_SUMMARY = REPORT_DIR / "dtb_official_competitor_match_summary.csv"


def official_brand(row: dict[str, str]) -> str:
    return (
        row.get("Brands")
        or row.get("Meta: _dtb_brand_label")
        or row.get("Meta: _dtb_brand")
        or row.get("Meta: schema_brand")
        or ""
    ).strip()


def official_ids(row: dict[str, str]) -> list[str]:
    values = [
        row.get("SKU", ""),
        row.get("Meta: schema_mpn", ""),
        row.get("Meta: _dtb_mpn", ""),
        row.get("Meta: _dtb_manufacturer_sku", ""),
    ]
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        key = compact_identifier(value)
        if key and key not in seen:
            seen.add(key)
            result.append((value or "").strip())
    return result


def load_official() -> list[dict[str, str]]:
    with OFFICIAL_CATALOG.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    for index, row in enumerate(rows, start=1):
        row["_row_number"] = str(index)
        row["_brand_key"] = canonical_brand(official_brand(row), row.get("Name", ""))
        row["_ids"] = official_ids(row)
        row["_tokens"] = token_key(row.get("Name", ""))
        price, basis, warnings = effective_dtb_price(row)
        row["_effective_price"] = money(price)
        row["_price_basis"] = basis
        row["_price_warnings"] = " | ".join(warnings)
    return rows


def load_competitors() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for site_key in SITE_KEYS:
        path = REPORT_DIR / site_key / "catalog.csv"
        with path.open(newline="", encoding="utf-8-sig") as handle:
            for index, row in enumerate(csv.DictReader(handle), start=1):
                title = row.get("Product Name", "")
                raw_brand = row.get("Brand", "")
                description, description_quality = clean_description(row.get("Product Description", ""))
                row["_source_key"] = site_key
                row["_source_label"] = SITE_LABELS[site_key]
                row["_source_row"] = str(index)
                row["_brand_key"] = canonical_brand(raw_brand, title)
                row["_sku_key"] = compact_identifier(row.get("SKU", ""))
                row["_tokens"] = token_key(title)
                row["_description_clean"] = description
                row["_description_quality"] = description_quality
                rows.append(row)
    return rows


def candidate_indexes(competitors: list[dict[str, str]]):
    by_identifier: dict[str, list[dict[str, str]]] = defaultdict(list)
    by_brand: dict[str, list[dict[str, str]]] = defaultdict(list)
    by_brand_token: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    for row in competitors:
        if row["_sku_key"]:
            by_identifier[row["_sku_key"]].append(row)
        if row["_brand_key"]:
            by_brand[row["_brand_key"]].append(row)
            for token in row["_tokens"]:
                by_brand_token[(row["_brand_key"], token)].append(row)
    return by_identifier, by_brand, by_brand_token


def candidates_for(official: dict[str, str], by_identifier, by_brand, by_brand_token):
    candidates: dict[int, dict[str, str]] = {}
    for identifier in official["_ids"]:
        for row in by_identifier.get(compact_identifier(identifier), []):
            candidates[id(row)] = row

    brand = official["_brand_key"]
    if brand:
        for token in official["_tokens"]:
            bucket = by_brand_token.get((brand, token), [])
            if len(bucket) <= 500:
                for row in bucket:
                    candidates.setdefault(id(row), row)
        if len(candidates) < 10 and len(by_brand.get(brand, [])) <= 1000:
            for row in by_brand.get(brand, []):
                candidates.setdefault(id(row), row)
    return candidates.values()


def match_output_row(official: dict[str, str], competitor: dict[str, str], decision) -> dict[str, str]:
    competitor_price = decimal_price(competitor.get("Product Price", ""))
    dtb_price = decimal_price(official.get("_effective_price", ""))
    delta = competitor_price - dtb_price if competitor_price is not None and dtb_price is not None else None
    return {
        "Match Status": decision.status,
        "Match Method": decision.method,
        "Evidence Quality": decision.evidence_quality,
        "Match Score": str(decision.score),
        "WRatio": str(decision.wratio),
        "Token Set Ratio": str(decision.token_set),
        "Simple Ratio": str(decision.simple),
        "Variation Compatible": "yes" if decision.variation_compatible else "no",
        "Contradictions": " | ".join(decision.contradictions),
        "Identity Key": decision.identity_key,
        "DTB Row": official["_row_number"],
        "DTB SKU": official.get("SKU", ""),
        "DTB Identifiers": " | ".join(official["_ids"]),
        "DTB Name": official.get("Name", ""),
        "DTB Brand": official_brand(official),
        "DTB Brand Key": official["_brand_key"],
        "DTB Effective Price": official.get("_effective_price", ""),
        "DTB Price Basis": official.get("_price_basis", ""),
        "DTB Price Warnings": official.get("_price_warnings", ""),
        "Competitor Source": competitor["_source_label"],
        "Competitor Source Key": competitor["_source_key"],
        "Competitor Brand": competitor.get("Brand", ""),
        "Competitor Brand Key": competitor["_brand_key"],
        "Competitor Product Name": competitor.get("Product Name", ""),
        "Competitor SKU": competitor.get("SKU", ""),
        "Competitor Price": money(competitor_price),
        "Price Delta vs DTB": money(delta),
        "Description Quality": competitor["_description_quality"],
        "Competitor Description": competitor["_description_clean"],
    }


def aggregate_row(official: dict[str, str], observations: list[dict[str, str]]) -> dict[str, str]:
    by_site: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in observations:
        by_site[row["Competitor Source Key"]].append(row)
    site_evidence = [resolve_site_evidence(key, by_site.get(key, [])) for key in SITE_KEYS]
    verified_prices = [item.price for item in site_evidence if item.verified and item.price is not None]
    low = min(verified_prices) if verified_prices else None
    high = max(verified_prices) if verified_prices else None
    median = median_decimal(verified_prices)
    dtb_price = decimal_price(official.get("_effective_price", ""))
    review_count = sum(1 for row in observations if row["Match Status"] == "review")

    out = {
        "DTB Row": official["_row_number"],
        "DTB SKU": official.get("SKU", ""),
        "DTB Brand": official_brand(official),
        "DTB Product": official.get("Name", ""),
        "DTB Effective Price": official.get("_effective_price", ""),
        "DTB Price Basis": official.get("_price_basis", ""),
        "DTB Price Warnings": official.get("_price_warnings", ""),
        "Verified Competitor Count": str(len(verified_prices)),
        "Review Candidate Count": str(review_count),
        "Lowest Verified Price": money(low),
        "Highest Verified Price": money(high),
        "Median Verified Price": money(median),
        "DTB vs Lowest": money(dtb_price - low if dtb_price is not None and low is not None else None),
        "DTB vs Median": money(dtb_price - median if dtb_price is not None and median is not None else None),
        "Recommended Review Status": market_status(site_evidence, review_count),
    }
    for evidence in site_evidence:
        label = evidence.source_label
        out[f"{label} Verified"] = "yes" if evidence.verified else "no"
        out[f"{label} Identity"] = evidence.identity_key
        out[f"{label} SKU"] = evidence.identifier
        out[f"{label} Product"] = evidence.product_name
        out[f"{label} Price"] = money(evidence.price)
        out[f"{label} Price Low"] = money(evidence.price_low)
        out[f"{label} Price High"] = money(evidence.price_high)
        out[f"{label} Duplicate Count"] = str(evidence.duplicate_count)
        out[f"{label} Evidence Quality"] = evidence.quality
    return out


def write_csv(path: Path, rows: list[dict[str, str]], fields: list[str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if fields is None:
        fields = list(rows[0].keys()) if rows else []
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    official_rows = load_official()
    competitors = load_competitors()
    by_identifier, by_brand, by_brand_token = candidate_indexes(competitors)

    all_matches: list[dict[str, str]] = []
    matches_by_official: dict[str, list[dict[str, str]]] = defaultdict(list)

    for official in official_rows:
        for competitor in candidates_for(official, by_identifier, by_brand, by_brand_token):
            decision = classify_match(
                official_name=official.get("Name", ""),
                official_brand_key=official["_brand_key"],
                official_identifiers=official["_ids"],
                competitor_name=competitor.get("Product Name", ""),
                competitor_brand_key=competitor["_brand_key"],
                competitor_identifier=competitor.get("SKU", ""),
            )
            if not decision.method:
                continue
            row = match_output_row(official, competitor, decision)
            all_matches.append(row)
            matches_by_official[official["_row_number"]].append(row)

    all_matches.sort(key=lambda row: (
        row["DTB Brand"].casefold(), row["DTB Name"].casefold(),
        0 if row["Match Status"] == "auto_accept" else 1,
        -int(row["Match Score"]), row["Competitor Source"].casefold(), row["Competitor Product Name"].casefold(),
    ))
    match_fields = list(all_matches[0].keys()) if all_matches else []
    write_csv(OUTPUT_MATCHES, all_matches, match_fields)

    market_rows = [aggregate_row(row, matches_by_official.get(row["_row_number"], [])) for row in official_rows]
    write_csv(OUTPUT_MARKET, market_rows)

    unmatched = [
        row for row in market_rows
        if row["Verified Competitor Count"] == "0" and row["Review Candidate Count"] == "0"
    ]
    unmatched_fields = ["DTB Row", "DTB SKU", "DTB Brand", "DTB Product", "DTB Effective Price", "DTB Price Basis", "Recommended Review Status"]
    write_csv(OUTPUT_UNMATCHED, [{field: row.get(field, "") for field in unmatched_fields} for row in unmatched], unmatched_fields)

    method_counts = Counter(row["Match Method"] for row in all_matches)
    status_counts = Counter(row["Match Status"] for row in all_matches)
    source_counts = Counter(row["Competitor Source"] for row in all_matches)
    aggregate_status_counts = Counter(row["Recommended Review Status"] for row in market_rows)
    verified_products = sum(1 for row in market_rows if int(row["Verified Competitor Count"]) > 0)
    review_only_products = sum(1 for row in market_rows if int(row["Verified Competitor Count"]) == 0 and int(row["Review Candidate Count"]) > 0)

    summary_rows = [
        ["metric", "value", "count"],
        ["official_rows", "all", len(official_rows)],
        ["competitor_rows", "all", len(competitors)],
        ["candidate_match_rows", "all", len(all_matches)],
        ["official_rows_with_verified_evidence", "all", verified_products],
        ["official_rows_review_only", "all", review_only_products],
        ["official_rows_unmatched", "all", len(unmatched)],
    ]
    for value, count in sorted(method_counts.items()):
        summary_rows.append(["match_method", value, count])
    for value, count in sorted(status_counts.items()):
        summary_rows.append(["match_status", value, count])
    for value, count in sorted(source_counts.items()):
        summary_rows.append(["competitor_source", value, count])
    for value, count in sorted(aggregate_status_counts.items()):
        summary_rows.append(["market_status", value, count])
    with OUTPUT_SUMMARY.open("w", newline="", encoding="utf-8") as handle:
        csv.writer(handle).writerows(summary_rows)

    print(f"Wrote {len(all_matches)} candidate evidence rows to {OUTPUT_MATCHES}")
    print(f"Wrote {len(market_rows)} market aggregate rows to {OUTPUT_MARKET}")
    print(f"Verified evidence for {verified_products}/{len(official_rows)} DTB rows; {len(unmatched)} fully unmatched")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
