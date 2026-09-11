#!/usr/bin/env python3
"""Create business-facing market evidence, price-gap, review, HTML, and Markdown reports."""
from __future__ import annotations

import csv
import html
from collections import Counter
from decimal import Decimal
from pathlib import Path

from competitor_pricing_core import SITE_LABELS, decimal_price

ROOT = Path(__file__).resolve().parent
REPORT_DIR = ROOT / "reports" / "competitor-catalog"
MATCHES_CSV = REPORT_DIR / "dtb_official_competitor_matches.csv"
MARKET_CSV = REPORT_DIR / "dtb_official_competitor_best_matches.csv"
UNMATCHED_CSV = REPORT_DIR / "dtb_official_competitor_unmatched.csv"

OUTPUT_SUMMARY_MD = REPORT_DIR / "competitor_match_report_summary.md"
OUTPUT_HTML = REPORT_DIR / "competitor_match_report.html"
OUTPUT_READER_CSV = REPORT_DIR / "competitor_match_reader_view.csv"
OUTPUT_PRICE_GAPS_CSV = REPORT_DIR / "competitor_match_price_gaps.csv"
OUTPUT_REVIEW_CSV = REPORT_DIR / "competitor_match_review_queue.csv"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, str]], fields: list[str] | None = None) -> None:
    if fields is None:
        fields = list(rows[0].keys()) if rows else []
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader(); writer.writerows(rows)


def display_money(value: str) -> str:
    amount = decimal_price(value)
    if amount is None:
        return ""
    sign = "-" if amount < 0 else ""
    return f"{sign}${abs(amount):,.2f}"


def reader_row(row: dict[str, str]) -> dict[str, str]:
    out = {
        "Status": row.get("Recommended Review Status", ""),
        "DTB Product": row.get("DTB Product", ""),
        "DTB SKU": row.get("DTB SKU", ""),
        "DTB Brand": row.get("DTB Brand", ""),
        "DTB Effective Price": display_money(row.get("DTB Effective Price", "")),
        "DTB Price Basis": row.get("DTB Price Basis", ""),
        "Verified Competitors": row.get("Verified Competitor Count", "0"),
        "Lowest Verified Price": display_money(row.get("Lowest Verified Price", "")),
        "Highest Verified Price": display_money(row.get("Highest Verified Price", "")),
        "Median Verified Price": display_money(row.get("Median Verified Price", "")),
        "DTB vs Lowest": display_money(row.get("DTB vs Lowest", "")),
        "DTB vs Median": display_money(row.get("DTB vs Median", "")),
        "Review Candidates": row.get("Review Candidate Count", "0"),
    }
    for label in SITE_LABELS.values():
        out[f"{label} Verified"] = row.get(f"{label} Verified", "")
        out[f"{label} SKU"] = row.get(f"{label} SKU", "")
        out[f"{label} Price"] = display_money(row.get(f"{label} Price", ""))
        out[f"{label} Product"] = row.get(f"{label} Product", "")
        out[f"{label} Evidence Quality"] = row.get(f"{label} Evidence Quality", "")
    return out


def table_html(rows: list[dict[str, str]], fields: list[str]) -> str:
    head = "".join(f"<th>{html.escape(field)}</th>" for field in fields)
    body = []
    for row in rows:
        body.append("<tr>" + "".join(f"<td>{html.escape(row.get(field, ''))}</td>" for field in fields) + "</tr>")
    return f"<table><thead><tr>{head}</tr></thead><tbody>{''.join(body)}</tbody></table>"


def main() -> int:
    matches = read_csv(MATCHES_CSV)
    market = read_csv(MARKET_CSV)
    unmatched = read_csv(UNMATCHED_CSV)

    reader_rows = [reader_row(row) for row in market]
    reader_fields = list(reader_rows[0].keys()) if reader_rows else []
    write_csv(OUTPUT_READER_CSV, reader_rows, reader_fields)

    price_gap_rows = [
        row for row in reader_rows
        if int(row.get("Verified Competitors") or 0) > 0 and row.get("DTB vs Median")
    ]
    price_gap_rows.sort(
        key=lambda row: abs(decimal_price(row.get("DTB vs Median", "")) or Decimal("0")),
        reverse=True,
    )
    write_csv(OUTPUT_PRICE_GAPS_CSV, price_gap_rows, reader_fields)

    review_rows = [row for row in matches if row.get("Match Status") == "review"]
    review_fields = [
        "Match Method", "Evidence Quality", "Match Score", "Contradictions",
        "DTB Product", "DTB SKU", "DTB Brand", "DTB Effective Price",
        "Competitor Source", "Competitor Product Name", "Competitor SKU", "Competitor Price",
        "Variation Compatible", "Description Quality",
    ]
    normalized_review: list[dict[str, str]] = []
    for row in review_rows:
        normalized_review.append({
            "Match Method": row.get("Match Method", ""),
            "Evidence Quality": row.get("Evidence Quality", ""),
            "Match Score": row.get("Match Score", ""),
            "Contradictions": row.get("Contradictions", ""),
            "DTB Product": row.get("DTB Name", ""),
            "DTB SKU": row.get("DTB SKU", ""),
            "DTB Brand": row.get("DTB Brand", ""),
            "DTB Effective Price": display_money(row.get("DTB Effective Price", "")),
            "Competitor Source": row.get("Competitor Source", ""),
            "Competitor Product Name": row.get("Competitor Product Name", ""),
            "Competitor SKU": row.get("Competitor SKU", ""),
            "Competitor Price": display_money(row.get("Competitor Price", "")),
            "Variation Compatible": row.get("Variation Compatible", ""),
            "Description Quality": row.get("Description Quality", ""),
        })
    normalized_review.sort(key=lambda r: (-int(r.get("Match Score") or 0), r["DTB Brand"], r["DTB Product"]))
    write_csv(OUTPUT_REVIEW_CSV, normalized_review, review_fields)

    status_counts = Counter(row.get("Status", "") for row in reader_rows)
    verified_products = sum(1 for row in reader_rows if int(row.get("Verified Competitors") or 0) > 0)
    multi_source = sum(1 for row in reader_rows if int(row.get("Verified Competitors") or 0) >= 2)
    review_only = sum(1 for row in reader_rows if int(row.get("Verified Competitors") or 0) == 0 and int(row.get("Review Candidates") or 0) > 0)
    fully_unmatched = len(unmatched)

    summary_md = f"""# DTB Competitor Market Evidence Report

## Executive Summary

- Official DTB products evaluated: **{len(market):,}**
- Products with at least one verified competitor identity: **{verified_products:,}**
- Products with verified evidence from two or more competitors: **{multi_source:,}**
- Products with review candidates but no verified evidence: **{review_only:,}**
- Products with no candidate evidence: **{fully_unmatched:,}**
- Candidate evidence rows requiring review: **{len(normalized_review):,}**

## Identity Contract

A competitor record is automatically verified only when **canonical manufacturer/brand + canonical identifier** match the DTB product and no structured contradiction is present. SKU values are never treated as globally unique. Unknown competitor brands, brand conflicts, identifier/title conflicts, dimensional conflicts, handedness conflicts, pack-count conflicts, generation conflicts, and product-family conflicts are review-only.

Fuzzy and near-identical title matches are **never auto-accepted**.

## Price Semantics

`DTB Effective Price` uses the sale price when a sale price is present, otherwise the regular price. `DTB vs Lowest` and `DTB vs Median` are calculated as **DTB effective price minus competitor price**; positive values mean DTB is higher.

## Status Breakdown

"""
    for status, count in sorted(status_counts.items()):
        summary_md += f"- **{status or 'Unknown'}:** {count:,}\n"
    summary_md += """

## Report Usage

- `competitor_match_reader_view.csv` is the business-facing market evidence view.
- `competitor_match_price_gaps.csv` contains only products with verified competitor evidence.
- `competitor_match_review_queue.csv` contains contradiction, brand-uncertain, and fuzzy candidates that must not drive automated pricing.
- `dtb_official_competitor_matches.csv` is the full technical evidence ledger.
- `dtb_official_competitor_best_matches.csv` is retained for compatibility but now contains one **aggregated market-evidence row per DTB product**, not an arbitrary single “best” competitor.
"""
    OUTPUT_SUMMARY_MD.write_text(summary_md, encoding="utf-8")

    top_gaps = price_gap_rows[:30]
    top_review = normalized_review[:30]
    html_doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DTB Competitor Market Evidence</title>
<style>
body{{font-family:Inter,Arial,sans-serif;margin:32px;color:#172033;background:#fff;line-height:1.45}}
main{{max-width:1500px;margin:auto}} h1,h2{{color:#0f172a}} .cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}}
.card{{border:1px solid #dbe3ed;border-radius:10px;padding:16px;background:#f8fafc}} .card strong{{display:block;font-size:26px;color:#0f766e}}
.note{{background:#fffbeb;border:1px solid #f59e0b;padding:14px;border-radius:8px}} .table-wrap{{overflow:auto}}
table{{border-collapse:collapse;width:100%;font-size:13px;margin:12px 0 28px}} th,td{{border-bottom:1px solid #dbe3ed;padding:8px;text-align:left;vertical-align:top;white-space:nowrap}} th{{background:#f1f5f9;position:sticky;top:0}}
</style></head><body><main>
<h1>DTB Competitor Market Evidence</h1>
<p>Manufacturer-scoped, contradiction-aware competitor pricing evidence. Fuzzy matches are review-only.</p>
<div class="cards"><div class="card"><strong>{len(market):,}</strong>DTB products</div><div class="card"><strong>{verified_products:,}</strong>with verified evidence</div><div class="card"><strong>{multi_source:,}</strong>multi-source verified</div><div class="card"><strong>{fully_unmatched:,}</strong>fully unmatched</div></div>
<div class="note"><strong>Pricing guardrail:</strong> Only verified identity evidence participates in market low/high/median calculations. Positive DTB-vs-market values mean DTB is priced higher.</div>
<h2>Largest Verified Median Price Gaps</h2><div class="table-wrap">{table_html(top_gaps,["Status","DTB Product","DTB SKU","DTB Effective Price","Verified Competitors","Lowest Verified Price","Median Verified Price","DTB vs Median"])}</div>
<h2>Highest-Priority Review Candidates</h2><div class="table-wrap">{table_html(top_review,["Match Method","Contradictions","DTB Product","DTB SKU","Competitor Source","Competitor Product Name","Competitor SKU","Competitor Price"])}</div>
</main></body></html>"""
    OUTPUT_HTML.write_text(html_doc, encoding="utf-8")

    print(f"Wrote {OUTPUT_READER_CSV}")
    print(f"Wrote {OUTPUT_PRICE_GAPS_CSV}")
    print(f"Wrote {OUTPUT_REVIEW_CSV}")
    print(f"Wrote {OUTPUT_SUMMARY_MD}")
    print(f"Wrote {OUTPUT_HTML}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
