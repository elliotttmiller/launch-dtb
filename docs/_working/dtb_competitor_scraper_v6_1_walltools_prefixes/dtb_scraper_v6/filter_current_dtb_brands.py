#!/usr/bin/env python3
"""Filter competitor scrape output to brands currently held in the DTB catalog."""

from __future__ import annotations

import csv
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent
INPUT_CSV = ROOT / "reports" / "competitor-catalog" / "all_competitor_products.csv"
OUTPUT_CSV = ROOT / "reports" / "competitor-catalog" / "current_dtb_brand_competitor_products.csv"
SUMMARY_CSV = ROOT / "reports" / "competitor-catalog" / "current_dtb_brand_filter_summary.csv"
OFFICIAL_CATALOG = Path("products/launch/official/dtb_official_catalog.csv")


CANONICAL_BRANDS = {
    "columbia tools": "Columbia Tools",
    "tapetech": "TapeTech",
    "level 5": "LEVEL5",
    "level5": "LEVEL5",
    "surpro": "SurPro",
    "dura stilts": "Dura-Stilts",
    "dura-stilts": "Dura-Stilts",
    "platinum drywall tools": "Platinum Drywall Tools",
    "platinum": "Platinum Drywall Tools",
    "usg sheetrock tools": "USG Sheetrock Tools",
    "usg sheetrock": "USG Sheetrock Tools",
}

BRAND_ALIASES = {
    "columbia": "Columbia Tools",
    "columbia tools": "Columbia Tools",
    "columbia taping tools": "Columbia Tools",
    "columbia drywall tools": "Columbia Tools",
    "columbia parts": "Columbia Tools",
    "tapetech": "TapeTech",
    "tape tech": "TapeTech",
    "tapetech parts": "TapeTech",
    "tape tech parts": "TapeTech",
    "level 5": "LEVEL5",
    "level5": "LEVEL5",
    "level-5": "LEVEL5",
    "level 5 parts": "LEVEL5",
    "level5 parts": "LEVEL5",
    "surpro": "SurPro",
    "sur pro": "SurPro",
    "sur-pro": "SurPro",
    "dura stilts": "Dura-Stilts",
    "dura-stilts": "Dura-Stilts",
    "dura stilt": "Dura-Stilts",
    "dura-stilt": "Dura-Stilts",
    "platinum": "Platinum Drywall Tools",
    "platinum drywall tools": "Platinum Drywall Tools",
    "platinum parts": "Platinum Drywall Tools",
    "usg": "USG Sheetrock Tools",
    "usg sheetrock": "USG Sheetrock Tools",
    "usg-sheetrock": "USG Sheetrock Tools",
    "usg sheetrock tools": "USG Sheetrock Tools",
    "sheetrock tools": "USG Sheetrock Tools",
}

TITLE_PATTERNS = [
    (re.compile(r"\bcolumbia(?:\s+(?:tools|taping|drywall\s+tools|one))?\b", re.I), "Columbia Tools"),
    (re.compile(r"\btape\s*tech\b|\btapetech\b", re.I), "TapeTech"),
    (re.compile(r"\blevel\s*-?\s*5\b|\blevel5\b", re.I), "LEVEL5"),
    (re.compile(r"\bsur\s*-?\s*pro\b|\bsurpro\b|\bsur\s*-?\s*stilt\b|\bquadlock\b", re.I), "SurPro"),
    (re.compile(r"\bdura\s*-?\s*stilts?\b", re.I), "Dura-Stilts"),
    (re.compile(r"\bplatinum(?:\s+drywall\s+tools)?\b", re.I), "Platinum Drywall Tools"),
    (re.compile(r"\busg\s+sheetrock\b|\bsheetrock\s+tools\b", re.I), "USG Sheetrock Tools"),
]

PARTS_SUFFIX_RE = re.compile(r"\s+parts?\s*$", re.I)
NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")


def normalize(value: str) -> str:
    value = (value or "").replace("&", " and ").lower()
    value = NON_ALNUM_RE.sub(" ", value)
    return " ".join(value.split())


def load_held_skus() -> dict[str, str]:
    skus: dict[str, str] = {}
    with OFFICIAL_CATALOG.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            sku = normalize(row.get("SKU", ""))
            brand = (
                row.get("Brands")
                or row.get("Meta: _dtb_brand_label")
                or row.get("Meta: _dtb_brand")
                or ""
            )
            canonical = CANONICAL_BRANDS.get(normalize(brand))
            if sku and canonical:
                skus[sku] = canonical
    return skus


def match_row(row: dict[str, str], held_skus: dict[str, str]) -> tuple[str, str, str]:
    raw_brand = row.get("Brand", "")
    raw_title = row.get("Product Name", "")
    raw_description = row.get("Product Description", "")
    sku = normalize(row.get("SKU", ""))

    if sku in held_skus:
        return held_skus[sku], "exact_sku_in_official_catalog", "1.00"

    brand_key = normalize(PARTS_SUFFIX_RE.sub("", raw_brand or ""))
    original_brand_key = normalize(raw_brand or "")
    if original_brand_key in BRAND_ALIASES:
        if original_brand_key == "sur":
            search_text = f"{raw_title} {raw_description}"
            if not TITLE_PATTERNS[3][0].search(search_text):
                return "", "", ""
        return BRAND_ALIASES[original_brand_key], "brand_alias", "0.98"
    if brand_key in BRAND_ALIASES:
        return BRAND_ALIASES[brand_key], "brand_alias_without_parts_suffix", "0.96"

    # Blank or noisy competitor brand fields are common. Use title-first matching
    # to avoid generic descriptions that mention every brand in a store blurb.
    for pattern, canonical in TITLE_PATTERNS:
        if pattern.search(raw_title):
            return canonical, "title_brand_pattern", "0.90"

    return "", "", ""


def main() -> int:
    held_skus = load_held_skus()
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)

    with INPUT_CSV.open(newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        fieldnames = list(reader.fieldnames or [])
        audit_fields = ["Matched DTB Brand", "DTB Brand Match Method", "DTB Brand Match Confidence"]
        output_fields = fieldnames + audit_fields
        rows = []
        skipped = 0
        for row in reader:
            brand, method, confidence = match_row(row, held_skus)
            if not brand:
                skipped += 1
                continue
            row["Matched DTB Brand"] = brand
            row["DTB Brand Match Method"] = method
            row["DTB Brand Match Confidence"] = confidence
            rows.append(row)

    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as target:
        writer = csv.DictWriter(target, fieldnames=output_fields)
        writer.writeheader()
        writer.writerows(rows)

    by_brand = Counter(row["Matched DTB Brand"] for row in rows)
    by_method = Counter(row["DTB Brand Match Method"] for row in rows)
    with SUMMARY_CSV.open("w", newline="", encoding="utf-8") as target:
        writer = csv.writer(target)
        writer.writerow(["metric", "value", "count"])
        writer.writerow(["input_rows", "all", len(rows) + skipped])
        writer.writerow(["output_rows", "all", len(rows)])
        writer.writerow(["skipped_rows", "all", skipped])
        for brand, count in sorted(by_brand.items()):
            writer.writerow(["matched_brand", brand, count])
        for method, count in sorted(by_method.items()):
            writer.writerow(["match_method", method, count])

    print(f"Wrote {len(rows)} rows to {OUTPUT_CSV}")
    print(f"Wrote summary to {SUMMARY_CSV}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
