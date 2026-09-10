#!/usr/bin/env python3
"""Create reader-friendly competitor match reports from technical match CSVs."""

from __future__ import annotations

import csv
import html
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
MATCHES_CSV = REPORT_DIR / "dtb_official_competitor_matches.csv"
BEST_CSV = REPORT_DIR / "dtb_official_competitor_best_matches.csv"
UNMATCHED_CSV = REPORT_DIR / "dtb_official_competitor_unmatched.csv"
SUMMARY_CSV = REPORT_DIR / "dtb_official_competitor_match_summary.csv"

OUTPUT_SUMMARY_MD = REPORT_DIR / "competitor_match_report_summary.md"
OUTPUT_HTML = REPORT_DIR / "competitor_match_report.html"
OUTPUT_READER_CSV = REPORT_DIR / "competitor_match_reader_view.csv"
OUTPUT_PRICE_GAPS_CSV = REPORT_DIR / "competitor_match_price_gaps.csv"
OUTPUT_REVIEW_CSV = REPORT_DIR / "competitor_match_review_queue.csv"


STATUS_LABELS = {
    "exact_identifier": "Confirmed Match",
    "near_identical_title": "Confirmed Match",
    "high_confidence_fuzzy_title": "Likely Match",
    "medium_confidence_fuzzy_title": "Needs Review",
    "exact_identifier_brand_conflict": "Needs Review",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def metric(summary: list[dict[str, str]], name: str, value: str = "all") -> int:
    for row in summary:
        if row.get("metric") == name and row.get("value") == value:
            return int(row.get("count") or 0)
    return 0


def money_decimal(value: str) -> Decimal | None:
    raw = (value or "").strip().replace("$", "").replace(",", "")
    if not raw:
        return None
    try:
        return Decimal(raw)
    except InvalidOperation:
        return None


def money(value: Decimal | None) -> str:
    if value is None:
        return ""
    if value < 0:
        return f"-${abs(value):,.2f}"
    return f"${value:,.2f}"


def pct(numerator: int, denominator: int) -> str:
    if not denominator:
        return "0%"
    return f"{(numerator / denominator) * 100:.0f}%"


def friendly_status(row: dict[str, str]) -> str:
    return STATUS_LABELS.get(row.get("Match Method", ""), "Needs Review")


def plain_reason(row: dict[str, str]) -> str:
    method = row.get("Match Method", "")
    if method == "exact_identifier":
        return "SKU or manufacturer part number matched exactly."
    if method == "near_identical_title":
        return "Product names are nearly identical after brand/name cleanup."
    if method == "high_confidence_fuzzy_title":
        return "Product name and brand are highly similar, but should be reviewed before automated pricing use."
    if method == "medium_confidence_fuzzy_title":
        return "Product appears similar, but size, variation, or naming differences need review."
    if method == "exact_identifier_brand_conflict":
        return "Identifier matched, but the competitor brand label looks inconsistent."
    return "Match needs review."


def reader_row(row: dict[str, str]) -> dict[str, str]:
    our_price = money_decimal(row.get("DTB Regular Price", ""))
    competitor_price = money_decimal(row.get("Competitor Price", ""))
    delta = None
    if our_price is not None and competitor_price is not None:
        delta = competitor_price - our_price
    if delta is None:
        price_position = ""
    elif delta < 0:
        price_position = "Competitor is lower"
    elif delta > 0:
        price_position = "DTB is lower"
    else:
        price_position = "Same price"

    return {
        "Status": friendly_status(row),
        "DTB Product": row.get("DTB Name", ""),
        "DTB SKU": row.get("DTB SKU", ""),
        "DTB Brand": row.get("DTB Brand", ""),
        "Our Price": money(our_price),
        "Competitor": row.get("Competitor Source", ""),
        "Competitor Product": row.get("Competitor Product Name", ""),
        "Competitor SKU": row.get("Competitor SKU", ""),
        "Competitor Price": money(competitor_price),
        "Price Difference": money(delta),
        "Price Position": price_position,
        "Why It Matched": plain_reason(row),
        "Match Score": row.get("Match Score", ""),
    }


def write_csv(path: Path, rows: list[dict[str, str]], fields: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def table_html(rows: list[dict[str, str]], fields: list[str]) -> str:
    head = "".join(f"<th>{html.escape(field)}</th>" for field in fields)
    body = []
    for row in rows:
        body.append("<tr>" + "".join(f"<td>{html.escape(row.get(field, ''))}</td>" for field in fields) + "</tr>")
    return f"<table><thead><tr>{head}</tr></thead><tbody>{''.join(body)}</tbody></table>"


def main() -> int:
    matches = read_csv(MATCHES_CSV)
    best = read_csv(BEST_CSV)
    unmatched = read_csv(UNMATCHED_CSV)
    summary = read_csv(SUMMARY_CSV)

    official_rows = metric(summary, "official_rows")
    matched_products = metric(summary, "official_rows_with_match")
    unmatched_products = metric(summary, "official_rows_unmatched")
    match_rows = metric(summary, "match_rows")
    auto_accept = metric(summary, "match_status", "auto_accept")
    review = metric(summary, "match_status", "review")

    reader_rows = [reader_row(row) for row in best]
    reader_fields = list(reader_rows[0].keys()) if reader_rows else []
    write_csv(OUTPUT_READER_CSV, reader_rows, reader_fields)

    price_gap_rows = [
        row for row in reader_rows
        if row["Price Difference"] and row["Price Position"] in {"Competitor is lower", "DTB is lower"}
    ]
    price_gap_rows.sort(
        key=lambda row: abs(money_decimal(row["Price Difference"]) or Decimal("0")),
        reverse=True,
    )
    write_csv(OUTPUT_PRICE_GAPS_CSV, price_gap_rows, reader_fields)

    review_rows = [reader_row(row) for row in matches if friendly_status(row) == "Needs Review"]
    write_csv(OUTPUT_REVIEW_CSV, review_rows, reader_fields)

    status_counts = Counter(row["Status"] for row in reader_rows)
    competitor_counts = Counter(row["Competitor"] for row in reader_rows)

    summary_md = f"""# Competitor Match Report

## What We Learned

- We reviewed **{official_rows:,}** official DTB catalog products.
- We found competitor matches for **{matched_products:,} products**, or about **{pct(matched_products, official_rows)}** of the catalog.
- **{unmatched_products:,} products** still need more competitor research or manual lookup.
- The matcher found **{match_rows:,} total competitor match rows** across All-Wall, Al's Taping Tools, and Wall Tools.
- **{auto_accept:,} matches** are strong enough to use as confirmed evidence.
- **{review:,} matches** should be reviewed before they are used for pricing decisions.

## Plain-English Statuses

- **Confirmed Match**: SKU/MPN matched exactly, or the product names are nearly identical.
- **Likely Match**: brand and title are strongly similar, but a person should still spot-check before pricing use.
- **Needs Review**: the identifier, brand, title, or variation has something inconsistent.
- **No Match Found**: no reliable competitor match was found for that DTB product.

## Best Next Uses

1. Use `competitor_match_reader_view.csv` as the main business-facing view.
2. Use `competitor_match_price_gaps.csv` to find pricing opportunities.
3. Use `competitor_match_review_queue.csv` as the manual cleanup queue.
4. Use `dtb_official_competitor_matches.csv` only when an audit trail is needed.

## Best-Match Status Breakdown

| Status | Products |
|---|---:|
| Confirmed Match | {status_counts.get("Confirmed Match", 0):,} |
| Likely Match | {status_counts.get("Likely Match", 0):,} |
| Needs Review | {status_counts.get("Needs Review", 0):,} |
| No Match Found | {unmatched_products:,} |

## Best-Match Competitor Breakdown

| Competitor | Best Matches |
|---|---:|
| All-Wall | {competitor_counts.get("All-Wall", 0):,} |
| Al's Taping Tools | {competitor_counts.get("Al's Taping Tools", 0):,} |
| Wall Tools | {competitor_counts.get("Wall Tools", 0):,} |
"""
    OUTPUT_SUMMARY_MD.write_text(summary_md, encoding="utf-8")

    top_gaps = price_gap_rows[:20]
    top_review = review_rows[:20]
    html_doc = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>DTB Competitor Match Report</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }}
    h1, h2 {{ color: #111827; }}
    .cards {{ display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 12px; margin: 20px 0; }}
    .card {{ border: 1px solid #d1d5db; border-radius: 8px; padding: 14px; background: #f9fafb; }}
    .card strong {{ display: block; font-size: 24px; color: #0f766e; }}
    table {{ border-collapse: collapse; width: 100%; margin: 14px 0 28px; font-size: 13px; }}
    th, td {{ border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }}
    th {{ background: #eef2f7; }}
    .note {{ background: #fffbeb; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; }}
  </style>
</head>
<body>
  <h1>DTB Competitor Match Report</h1>
  <p>This report translates the technical matching results into plain-language pricing and review views.</p>
  <div class="cards">
    <div class="card"><strong>{official_rows:,}</strong> official products reviewed</div>
    <div class="card"><strong>{matched_products:,}</strong> products with matches</div>
    <div class="card"><strong>{pct(matched_products, official_rows)}</strong> catalog coverage</div>
    <div class="card"><strong>{unmatched_products:,}</strong> products unmatched</div>
  </div>
  <div class="note">
    <strong>How to read this:</strong> Confirmed matches can support pricing work now. Likely matches and Needs Review rows should be checked before decisions.
  </div>
  <h2>Status Breakdown</h2>
  {table_html([
      {"Status": "Confirmed Match", "Products": f'{status_counts.get("Confirmed Match", 0):,}'},
      {"Status": "Likely Match", "Products": f'{status_counts.get("Likely Match", 0):,}'},
      {"Status": "Needs Review", "Products": f'{status_counts.get("Needs Review", 0):,}'},
      {"Status": "No Match Found", "Products": f'{unmatched_products:,}'},
  ], ["Status", "Products"])}
  <h2>Largest Price Gaps</h2>
  {table_html(top_gaps, ["Status", "DTB Product", "DTB SKU", "Our Price", "Competitor", "Competitor Product", "Competitor Price", "Price Difference", "Price Position"])}
  <h2>Top Review Queue</h2>
  {table_html(top_review, ["Status", "DTB Product", "DTB SKU", "Competitor", "Competitor Product", "Competitor SKU", "Competitor Price", "Why It Matched"])}
</body>
</html>
"""
    OUTPUT_HTML.write_text(html_doc, encoding="utf-8")

    print(f"Wrote {OUTPUT_SUMMARY_MD}")
    print(f"Wrote {OUTPUT_HTML}")
    print(f"Wrote {OUTPUT_READER_CSV}")
    print(f"Wrote {OUTPUT_PRICE_GAPS_CSV}")
    print(f"Wrote {OUTPUT_REVIEW_CSV}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
