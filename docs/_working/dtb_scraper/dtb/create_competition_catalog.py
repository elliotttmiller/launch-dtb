#!/usr/bin/env python3
"""Create the simple DTB competition-price catalog.

The output is intentionally narrow: independently purchasable singular products,
variations, accessories/stilts, and replacement parts from the official DTB
catalog. Variable parent rows and tool sets/kits are excluded.

Competitor cells are populated only from verified retailer matches produced by
``match_official_catalog_to_competitors.py``. Unverified or missing retailer
matches remain blank; no price is inferred or synthesized.

After a successful build, the report directory is sanitized to retain only the
final comparison plus the minimal per-retailer scrape evidence required for
repeatable matching and efficient scraper resume.
"""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
OFFICIAL_RELATIVE = Path("products") / "launch" / "official" / "dtb_official_catalog.csv"
REPO_ROOT = next(path for path in [ROOT, *ROOT.parents] if (path / OFFICIAL_RELATIVE).exists())
OFFICIAL_CATALOG = REPO_ROOT / OFFICIAL_RELATIVE
MATCHED_CATALOG = REPORT_DIR / "dtb_official_competitor_best_matches.csv"
OUTPUT = REPORT_DIR / "dtb_competitor_price_catalog.csv"

FIELDS = [
    "SKU",
    "Brand",
    "Product",
    "Regular Price",
    "Sale Price",
    "Al's Taping Tools Price",
    "Wall Tools Price",
    "All-Wall Price",
]

COMPETITOR_COLUMNS = (
    ("Al's Taping Tools", "Al's Taping Tools Price"),
    ("Wall Tools", "Wall Tools Price"),
    ("All-Wall", "All-Wall Price"),
)

EXCLUDED_PRODUCT_KINDS = {"toolset", "kit"}
INCLUDED_WOO_TYPES = {"simple", "variation"}
SITE_DIRS = ("als_taping_tools", "wall_tools", "all_wall")
RETAINED_REPORT_FILES = {
    "dtb_competitor_price_catalog.csv",
    *(f"{site}/catalog.csv" for site in SITE_DIRS),
    *(f"{site}/products.jsonl" for site in SITE_DIRS),
    *(f"{site}/failures.jsonl" for site in SITE_DIRS),
}


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def is_competition_catalog_row(row: dict[str, str]) -> bool:
    """Return True only for independently purchasable non-set catalog rows."""
    product_type = (row.get("Type") or "").strip().casefold()
    if product_type not in INCLUDED_WOO_TYPES:
        return False

    product_kind = (row.get("Meta: _dtb_product_kind") or "").strip().casefold()
    if product_kind in EXCLUDED_PRODUCT_KINDS:
        return False

    category = (row.get("Categories") or "").strip().casefold()
    if category.endswith(" > tool sets") or category.endswith(" > tool sets & kits"):
        return False

    return True


def sanitize_report_directory() -> list[str]:
    """Remove stale/generated diagnostics while preserving required evidence only."""
    removed: list[str] = []
    if not REPORT_DIR.exists():
        return removed

    for path in sorted(REPORT_DIR.rglob("*"), key=lambda item: len(item.parts), reverse=True):
        if path.is_file():
            relative = path.relative_to(REPORT_DIR).as_posix()
            if relative not in RETAINED_REPORT_FILES:
                path.unlink()
                removed.append(relative)
        elif path.is_dir() and path != REPORT_DIR:
            try:
                path.rmdir()
            except OSError:
                pass
    return sorted(removed)


def main() -> int:
    official_rows = load_csv(OFFICIAL_CATALOG)
    matched_rows = load_csv(MATCHED_CATALOG)
    matched_by_row = {
        (row.get("DTB Row") or "").strip(): row
        for row in matched_rows
        if (row.get("DTB Row") or "").strip()
    }

    output_rows: list[dict[str, str]] = []
    excluded_variable = 0
    excluded_toolsets = 0

    for row_number, official in enumerate(official_rows, start=1):
        product_type = (official.get("Type") or "").strip().casefold()
        product_kind = (official.get("Meta: _dtb_product_kind") or "").strip().casefold()
        category = (official.get("Categories") or "").strip().casefold()

        if not is_competition_catalog_row(official):
            if product_type not in INCLUDED_WOO_TYPES:
                excluded_variable += 1
            elif product_kind in EXCLUDED_PRODUCT_KINDS or category.endswith(" > tool sets") or category.endswith(" > tool sets & kits"):
                excluded_toolsets += 1
            continue

        matched = matched_by_row.get(str(row_number), {})
        output = {
            "SKU": (official.get("SKU") or "").strip(),
            "Brand": (
                official.get("Brands")
                or official.get("Meta: _dtb_brand_label")
                or official.get("Meta: _dtb_brand")
                or official.get("Meta: schema_brand")
                or ""
            ).strip(),
            "Product": (official.get("Name") or "").strip(),
            "Regular Price": (official.get("Regular price") or "").strip(),
            "Sale Price": (official.get("Sale price") or "").strip(),
        }
        for label, output_field in COMPETITOR_COLUMNS:
            verified = (matched.get(f"{label} Verified") or "").strip().casefold() == "yes"
            output[output_field] = (matched.get(f"{label} Price") or "").strip() if verified else ""
        output_rows.append(output)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(output_rows)

    populated = {
        output_field: sum(1 for row in output_rows if row[output_field])
        for _, output_field in COMPETITOR_COLUMNS
    }
    removed = sanitize_report_directory()

    print(f"Wrote {len(output_rows)} singular DTB products/parts to {OUTPUT}")
    print(f"Excluded non-purchasable/parent rows: {excluded_variable}; excluded tool sets/kits: {excluded_toolsets}")
    print(
        "Verified competitor prices: "
        + "; ".join(f"{field}={count}" for field, count in populated.items())
    )
    print(f"Sanitized competitor report directory; removed {len(removed)} stale/unnecessary files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
