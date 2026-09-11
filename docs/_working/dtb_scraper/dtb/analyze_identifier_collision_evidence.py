#!/usr/bin/env python3
"""Audit unresolved separator-format collisions against repository evidence.

This script is diagnostic only. It never mutates the approved alias registry and
never treats destructive compact normalization as identity. It looks for direct,
brand-scoped repository evidence that an unresolved retailer identifier variant
was previously mapped to a protected DTB identifier.
"""
from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path

from competitor_identity import canonical_identifier

ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
COLLISION_INPUT = REPORT_DIR / "competitor_identifier_collision_audit.csv"
OUTPUT = REPORT_DIR / "competitor_identifier_collision_evidence.csv"
SUMMARY = REPORT_DIR / "competitor_identifier_collision_evidence_summary.csv"

OFFICIAL_RELATIVE = Path("products") / "launch" / "official" / "dtb_official_catalog.csv"
BACKFILL_RELATIVE = Path("docs") / "pricing_engine" / "reports" / "columbia_price_backfill_report.csv"
REPO_ROOT = next(path for path in [ROOT, *ROOT.parents] if (path / OFFICIAL_RELATIVE).exists())
OFFICIAL = REPO_ROOT / OFFICIAL_RELATIVE
BACKFILL = REPO_ROOT / BACKFILL_RELATIVE

BRAND_KEYS = {
    "Columbia Tools": "columbia",
    "TapeTech": "tapetech",
    "LEVEL5": "level5",
    "SurPro": "surpro",
    "Dura-Stilts": "dura-stilts",
    "Platinum Drywall Tools": "platinum",
    "USG Sheetrock Tools": "usg-sheetrock",
}


def official_brand(row: dict[str, str]) -> str:
    return (
        row.get("Brands")
        or row.get("Meta: _dtb_brand_label")
        or row.get("Meta: _dtb_brand")
        or row.get("Meta: schema_brand")
        or ""
    ).strip()


def load_official_ids() -> dict[str, set[str]]:
    ids: dict[str, set[str]] = {value: set() for value in BRAND_KEYS.values()}
    with OFFICIAL.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            label = official_brand(row)
            brand = BRAND_KEYS.get(label, "")
            if not brand:
                continue
            for field in ("SKU", "Meta: schema_mpn", "Meta: _dtb_mpn", "Meta: _dtb_manufacturer_sku"):
                value = canonical_identifier(row.get(field, ""))
                if value:
                    ids.setdefault(brand, set()).add(value)
    return ids


def load_direct_backfill_pairs() -> dict[tuple[str, str], list[dict[str, str]]]:
    """Load explicit Columbia normalized source→DTB mappings already recorded in repo."""
    pairs: dict[tuple[str, str], list[dict[str, str]]] = {}
    if not BACKFILL.exists():
        return pairs
    with BACKFILL.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            if (row.get("matched_on") or "").strip().casefold() != "norm":
                continue
            dtb = canonical_identifier(row.get("sku", ""))
            source = canonical_identifier(row.get("source_sku_code", ""))
            if not dtb or not source or dtb == source:
                continue
            pairs.setdefault((source, dtb), []).append(row)
            pairs.setdefault((dtb, source), []).append(row)
    return pairs


def split_values(value: str) -> list[str]:
    return [item.strip() for item in (value or "").split("|") if item.strip()]


def main() -> int:
    official_ids = load_official_ids()
    direct_pairs = load_direct_backfill_pairs()
    rows: list[dict[str, str]] = []

    with COLLISION_INPUT.open(newline="", encoding="utf-8-sig") as handle:
        for source in csv.DictReader(handle):
            if source.get("Disposition") == "approved_alias_equivalence":
                continue
            brand_label = source.get("Canonical Brand", "")
            brand_key = BRAND_KEYS.get(brand_label, "")
            strict_ids = split_values(source.get("Distinct Strict Identifiers", ""))
            official_matches = sorted(value for value in strict_ids if value in official_ids.get(brand_key, set()))

            evidence_rows: list[dict[str, str]] = []
            for i, left in enumerate(strict_ids):
                for right in strict_ids[i + 1:]:
                    evidence_rows.extend(direct_pairs.get((left, right), []))

            evidence_rows_unique = {
                (
                    row.get("sku", ""),
                    row.get("source_sku_code", ""),
                    row.get("source_title", ""),
                    row.get("matched_on", ""),
                )
                for row in evidence_rows
            }

            if evidence_rows_unique:
                disposition = "repository_supported_alias_candidate"
                evidence_strength = "direct_existing_normalized_mapping"
            elif len(official_matches) == 1:
                disposition = "official_anchor_only_review"
                evidence_strength = "protected_identifier_present_without_direct_alias_proof"
            elif len(official_matches) > 1:
                disposition = "multiple_official_identifiers_review"
                evidence_strength = "collision_contains_multiple_protected_identifiers"
            else:
                disposition = "insufficient_repository_evidence"
                evidence_strength = "none"

            mapped_pairs = sorted({f"{a} -> {b}" for a, b, _title, _mode in evidence_rows_unique})
            mapped_titles = sorted({title for _a, _b, title, _mode in evidence_rows_unique if title})
            rows.append({
                "Canonical Brand": brand_label,
                "Legacy Compact Key": source.get("Legacy Compact Key", ""),
                "Distinct Strict Identifiers": source.get("Distinct Strict Identifiers", ""),
                "Raw Identifiers": source.get("Raw Identifiers", ""),
                "Competitors": source.get("Competitors", ""),
                "Official Identifier Matches": " | ".join(official_matches),
                "Repository Mapping Evidence": " | ".join(mapped_pairs),
                "Repository Mapping Titles": " | ".join(mapped_titles),
                "Evidence Strength": evidence_strength,
                "Recommended Disposition": disposition,
                "Automatic Alias Approval": "no",
            })

    fields = list(rows[0].keys()) if rows else [
        "Canonical Brand", "Legacy Compact Key", "Distinct Strict Identifiers", "Raw Identifiers",
        "Competitors", "Official Identifier Matches", "Repository Mapping Evidence",
        "Repository Mapping Titles", "Evidence Strength", "Recommended Disposition",
        "Automatic Alias Approval",
    ]
    with OUTPUT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader(); writer.writerows(rows)

    counts = Counter(row["Recommended Disposition"] for row in rows)
    with SUMMARY.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["metric", "value", "count"])
        writer.writerow(["unresolved_collisions_audited", "all", len(rows)])
        for value, count in sorted(counts.items()):
            writer.writerow(["recommended_disposition", value, count])

    print(f"Audited {len(rows)} unresolved identifier collisions to {OUTPUT}")
    for value, count in sorted(counts.items()):
        print(f"Identifier collision disposition: {value}={count}")
    print("No aliases were auto-approved or written.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
