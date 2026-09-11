#!/usr/bin/env python3
"""Match DTB official catalog rows to competitor scrape rows.

The output is intentionally reviewable: exact identifier matches are separated
from near-identical and fuzzy title matches, with source and price retained.
"""

from __future__ import annotations

import csv
import re
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path

from rapidfuzz import fuzz


ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
OFFICIAL_RELATIVE = Path("products") / "launch" / "official" / "dtb_official_catalog.csv"
REPO_ROOT = next(path for path in [ROOT, *ROOT.parents] if (path / OFFICIAL_RELATIVE).exists())
OFFICIAL_CATALOG = REPO_ROOT / OFFICIAL_RELATIVE
OUTPUT_MATCHES = REPORT_DIR / "dtb_official_competitor_matches.csv"
OUTPUT_BEST = REPORT_DIR / "dtb_official_competitor_best_matches.csv"
OUTPUT_UNMATCHED = REPORT_DIR / "dtb_official_competitor_unmatched.csv"
OUTPUT_SUMMARY = REPORT_DIR / "dtb_official_competitor_match_summary.csv"

SITES = [
    ("all_wall", "All-Wall"),
    ("als_taping_tools", "Al's Taping Tools"),
    ("wall_tools", "Wall Tools"),
]

BRAND_ALIASES = {
    "columbia": "columbia",
    "columbia tools": "columbia",
    "columbia taping tools": "columbia",
    "columbia drywall tools": "columbia",
    "columbia parts": "columbia",
    "tapetech": "tapetech",
    "tape tech": "tapetech",
    "tapetech parts": "tapetech",
    "tape tech parts": "tapetech",
    "level5": "level5",
    "level 5": "level5",
    "level-5": "level5",
    "level 5 parts": "level5",
    "surpro": "surpro",
    "sur pro": "surpro",
    "sur-pro": "surpro",
    "sur": "surpro",
    "dura stilts": "dura-stilts",
    "dura-stilts": "dura-stilts",
    "dura stilt": "dura-stilts",
    "dura-stilt": "dura-stilts",
    "platinum": "platinum",
    "platinum drywall tools": "platinum",
    "usg": "usg-sheetrock",
    "usg sheetrock": "usg-sheetrock",
    "usg-sheetrock": "usg-sheetrock",
    "usg sheetrock tools": "usg-sheetrock",
    "sheetrock tools": "usg-sheetrock",
}

BRAND_WORDS = {
    "columbia", "tools", "taping", "tapetech", "tape", "tech", "level", "level5",
    "surpro", "sur", "pro", "dura", "stilts", "stilt", "platinum", "drywall",
    "usg", "sheetrock", "parts",
}

STOPWORDS = {
    "and", "or", "the", "for", "with", "w", "a", "an", "in", "inch", "inches",
    "pack", "set", "kit", "tool", "tools", "part", "parts", "replacement",
}

GENERIC_HARDWARE_WORDS = {
    "washer", "screw", "nut", "bolt", "pin", "spring", "bearing", "bushing",
    "gasket", "seal", "clip", "ring", "o", "flat", "lock", "hex", "socket",
}

BRAND_TITLE_PATTERNS = [
    (re.compile(r"\bcolumbia(?:\s+(?:tools|taping|drywall\s+tools|one))?\b", re.I), "columbia"),
    (re.compile(r"\btape\s*tech\b|\btapetech\b", re.I), "tapetech"),
    (re.compile(r"\blevel\s*-?\s*5\b|\blevel5\b", re.I), "level5"),
    (re.compile(r"\bsur\s*-?\s*pro\b|\bsurpro\b|\bsur\s*-?\s*stilt\b|\bquadlock\b", re.I), "surpro"),
    (re.compile(r"\bdura\s*-?\s*stilts?\b", re.I), "dura-stilts"),
    (re.compile(r"\bplatinum(?:\s+drywall\s+tools)?\b", re.I), "platinum"),
    (re.compile(r"\busg\s+sheetrock\b|\bsheetrock\s+tools\b", re.I), "usg-sheetrock"),
]

NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")


def compact_id(value: str) -> str:
    return NON_ALNUM_RE.sub("", (value or "").casefold())


def words(value: str) -> list[str]:
    normalized = NON_ALNUM_RE.sub(" ", (value or "").casefold())
    return [token for token in normalized.split() if token]


def normalize_brand(value: str) -> str:
    key = " ".join(words(value))
    if key.endswith(" parts"):
        key = key[:-6]
    return BRAND_ALIASES.get(key, key)


def brand_from_text(value: str) -> str:
    for pattern, brand in BRAND_TITLE_PATTERNS:
        if pattern.search(value or ""):
            return brand
    return ""


def canonical_text(value: str, *, remove_brand: bool = False) -> str:
    tokens = words(value)
    cleaned = []
    for token in tokens:
        if remove_brand and token in BRAND_WORDS:
            continue
        if token in STOPWORDS:
            continue
        cleaned.append(token)
    return " ".join(cleaned)


def token_key(value: str) -> set[str]:
    return {token for token in canonical_text(value, remove_brand=True).split() if len(token) >= 3}


def price_decimal(value: str) -> Decimal | None:
    raw = (value or "").strip().replace("$", "").replace(",", "")
    if not raw:
        return None
    try:
        return Decimal(raw)
    except InvalidOperation:
        return None


def money(value: Decimal | None) -> str:
    return "" if value is None else f"{value:.2f}"


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
    seen = set()
    ids = []
    for value in values:
        key = compact_id(value)
        if key and key not in seen:
            seen.add(key)
            ids.append(value.strip())
    return ids


def load_official() -> list[dict[str, str]]:
    with OFFICIAL_CATALOG.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    for index, row in enumerate(rows, start=1):
        row["_row_number"] = str(index)
        row["_brand_key"] = normalize_brand(official_brand(row))
        row["_title_key"] = canonical_text(row.get("Name", ""), remove_brand=False)
        row["_title_no_brand"] = canonical_text(row.get("Name", ""), remove_brand=True)
        row["_tokens"] = token_key(row.get("Name", ""))
        row["_ids"] = official_ids(row)
    return rows


def load_competitors() -> list[dict[str, str]]:
    rows = []
    for site_key, site_label in SITES:
        path = REPORT_DIR / site_key / "catalog.csv"
        with path.open(newline="", encoding="utf-8-sig") as handle:
            for index, row in enumerate(csv.DictReader(handle), start=1):
                row["_source_key"] = site_key
                row["_source_label"] = site_label
                row["_source_row"] = str(index)
                row["_brand_key"] = normalize_brand(row.get("Brand", "")) or brand_from_text(row.get("Product Name", ""))
                row["_title_key"] = canonical_text(row.get("Product Name", ""), remove_brand=False)
                row["_title_no_brand"] = canonical_text(row.get("Product Name", ""), remove_brand=True)
                row["_tokens"] = token_key(row.get("Product Name", ""))
                row["_sku_key"] = compact_id(row.get("SKU", ""))
                rows.append(row)
    return rows


def score_title(official: dict[str, str], competitor: dict[str, str]) -> tuple[int, int, int, int]:
    a = official["_title_no_brand"] or official["_title_key"]
    b = competitor["_title_no_brand"] or competitor["_title_key"]
    wratio = fuzz.WRatio(a, b)
    token_set = fuzz.token_set_ratio(a, b)
    token_sort = fuzz.token_sort_ratio(a, b)
    simple = fuzz.ratio(a, b)
    return int(max(wratio, token_set, token_sort, simple)), int(wratio), int(token_set), int(simple)


def brand_compatible(official: dict[str, str], competitor: dict[str, str]) -> bool:
    comp_brand = competitor["_brand_key"]
    if not comp_brand:
        return True
    if official["_brand_key"] == comp_brand:
        return True
    return False


def overlap_ratio(official: dict[str, str], competitor: dict[str, str]) -> tuple[float, int, int]:
    a = set(official["_tokens"])
    b = set(competitor["_tokens"])
    if not a or not b:
        return 0.0, 0, min(len(a), len(b))
    shared = a & b
    distinctive_shared = {token for token in shared if token not in GENERIC_HARDWARE_WORDS}
    denominator = max(1, min(len(a), len(b)))
    return len(shared) / denominator, len(distinctive_shared), len(shared)


def classify_match(
    official: dict[str, str],
    competitor: dict[str, str],
    id_match: bool,
) -> tuple[str, str, int, int, int, int]:
    title_score, wratio, token_set, simple = score_title(official, competitor)
    compatible = brand_compatible(official, competitor)
    overlap, distinctive_shared, shared = overlap_ratio(official, competitor)

    if id_match and compatible:
        return "exact_identifier", "auto_accept", 100, wratio, token_set, simple
    if id_match:
        return "exact_identifier_brand_conflict", "review", 92, wratio, token_set, simple

    if not compatible:
        return "", "", title_score, wratio, token_set, simple

    if title_score >= 97 and simple >= 94 and overlap >= 0.75:
        return "near_identical_title", "auto_accept", title_score, wratio, token_set, simple
    if wratio >= 92 and simple >= 88 and overlap >= 0.65 and (distinctive_shared >= 1 or shared >= 3):
        return "high_confidence_fuzzy_title", "review", title_score, wratio, token_set, simple
    if compatible and wratio >= 88 and simple >= 84 and overlap >= 0.75 and (distinctive_shared >= 1 or shared >= 4):
        return "medium_confidence_fuzzy_title", "review", title_score, wratio, token_set, simple
    return "", "", title_score, wratio, token_set, simple


def build_candidate_indexes(competitors: list[dict[str, str]]):
    by_sku: dict[str, list[dict[str, str]]] = defaultdict(list)
    by_brand: dict[str, list[dict[str, str]]] = defaultdict(list)
    by_token: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in competitors:
        if row["_sku_key"]:
            by_sku[row["_sku_key"]].append(row)
        by_brand[row["_brand_key"]].append(row)
        for token in row["_tokens"]:
            by_token[token].append(row)
    return by_sku, by_brand, by_token


def candidate_rows(official: dict[str, str], by_sku, by_brand, by_token) -> dict[int, tuple[dict[str, str], bool]]:
    candidates: dict[int, tuple[dict[str, str], bool]] = {}
    for identifier in official["_ids"]:
        for row in by_sku.get(compact_id(identifier), []):
            candidates[id(row)] = (row, True)

    for row in by_brand.get(official["_brand_key"], []):
        candidates.setdefault(id(row), (row, False))

    for token in official["_tokens"]:
        bucket = by_token.get(token, [])
        if len(bucket) > 500:
            continue
        for row in bucket:
            candidates.setdefault(id(row), (row, False))
    return candidates


def output_row(
    official: dict[str, str],
    competitor: dict[str, str],
    method: str,
    status: str,
    score: int,
    wratio: int,
    token_set: int,
    simple: int,
) -> dict[str, str]:
    official_price = price_decimal(official.get("Regular price", "")) or price_decimal(official.get("Sale price", ""))
    competitor_price = price_decimal(competitor.get("Product Price", ""))
    price_delta = None
    if official_price is not None and competitor_price is not None:
        price_delta = competitor_price - official_price

    return {
        "Match Status": status,
        "Match Method": method,
        "Match Score": str(score),
        "WRatio": str(wratio),
        "Token Set Ratio": str(token_set),
        "Simple Ratio": str(simple),
        "DTB Row": official["_row_number"],
        "DTB SKU": official.get("SKU", ""),
        "DTB Identifiers": " | ".join(official["_ids"]),
        "DTB Name": official.get("Name", ""),
        "DTB Brand": official_brand(official),
        "DTB Regular Price": official.get("Regular price", ""),
        "Competitor Source": competitor["_source_label"],
        "Competitor Brand": competitor.get("Brand", ""),
        "Competitor Product Name": competitor.get("Product Name", ""),
        "Competitor SKU": competitor.get("SKU", ""),
        "Competitor Price": competitor.get("Product Price", ""),
        "Price Delta vs DTB": money(price_delta),
        "Competitor Description": competitor.get("Product Description", ""),
    }


def main() -> int:
    official_rows = load_official()
    competitor_rows = load_competitors()
    by_sku, by_brand, by_token = build_candidate_indexes(competitor_rows)

    matches: list[dict[str, str]] = []
    best_by_official: dict[str, dict[str, str]] = {}
    matched_official = set()

    for official in official_rows:
        for competitor, id_match in candidate_rows(official, by_sku, by_brand, by_token).values():
            method, status, score, wratio, token_set, simple = classify_match(official, competitor, id_match)
            if not method:
                continue
            row = output_row(official, competitor, method, status, score, wratio, token_set, simple)
            matches.append(row)
            matched_official.add(official["_row_number"])
            current = best_by_official.get(official["_row_number"])
            if current is None or int(row["Match Score"]) > int(current["Match Score"]):
                best_by_official[official["_row_number"]] = row

    matches.sort(
        key=lambda row: (
            row["DTB Brand"].casefold(),
            row["DTB Name"].casefold(),
            -int(row["Match Score"]),
            row["Competitor Source"].casefold(),
            row["Competitor Price"],
        )
    )
    best_rows = sorted(
        best_by_official.values(),
        key=lambda row: (row["DTB Brand"].casefold(), row["DTB Name"].casefold(), row["Competitor Source"].casefold()),
    )

    fields = list(output_row(official_rows[0], competitor_rows[0], "", "", 0, 0, 0, 0).keys())
    with OUTPUT_MATCHES.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(matches)

    with OUTPUT_BEST.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(best_rows)

    unmatched_fields = ["DTB Row", "DTB SKU", "DTB Identifiers", "DTB Name", "DTB Brand", "DTB Regular Price"]
    with OUTPUT_UNMATCHED.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=unmatched_fields)
        writer.writeheader()
        for row in official_rows:
            if row["_row_number"] in matched_official:
                continue
            writer.writerow({
                "DTB Row": row["_row_number"],
                "DTB SKU": row.get("SKU", ""),
                "DTB Identifiers": " | ".join(row["_ids"]),
                "DTB Name": row.get("Name", ""),
                "DTB Brand": official_brand(row),
                "DTB Regular Price": row.get("Regular price", ""),
            })

    method_counts = Counter(row["Match Method"] for row in matches)
    status_counts = Counter(row["Match Status"] for row in matches)
    source_counts = Counter(row["Competitor Source"] for row in matches)
    with OUTPUT_SUMMARY.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["metric", "value", "count"])
        writer.writerow(["official_rows", "all", len(official_rows)])
        writer.writerow(["competitor_rows", "all", len(competitor_rows)])
        writer.writerow(["match_rows", "all", len(matches)])
        writer.writerow(["official_rows_with_match", "all", len(matched_official)])
        writer.writerow(["official_rows_unmatched", "all", len(official_rows) - len(matched_official)])
        for value, count in sorted(method_counts.items()):
            writer.writerow(["match_method", value, count])
        for value, count in sorted(status_counts.items()):
            writer.writerow(["match_status", value, count])
        for value, count in sorted(source_counts.items()):
            writer.writerow(["competitor_source", value, count])

    print(f"Wrote {len(matches)} match rows to {OUTPUT_MATCHES}")
    print(f"Wrote {len(best_rows)} best-match rows to {OUTPUT_BEST}")
    print(f"Wrote summary to {OUTPUT_SUMMARY}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
