#!/usr/bin/env python3
"""Create business-facing market-price, gap, review, HTML, and Markdown reports."""
from __future__ import annotations

import csv
import html
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

from competitor_pricing_core import SITE_LABELS

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
        writer.writeheader()
        writer.writerows(rows)


def signed_decimal(value: str) -> Decimal | None:
    raw = (value or "").strip().replace("$", "").replace(",", "").replace("%", "")
    if not raw:
        return None
    try:
        amount = Decimal(raw)
    except InvalidOperation:
        return None
    return amount if amount.is_finite() else None


def display_money(value: str) -> str:
    amount = signed_decimal(value)
    if amount is None:
        return ""
    sign = "-" if amount < 0 else ""
    return f"{sign}${abs(amount):,.2f}"


def display_percent(value: str) -> str:
    amount = signed_decimal(value)
    if amount is None:
        return ""
    sign = "+" if amount > 0 else ""
    return f"{sign}{amount:.2f}%"


def display_market_status(value: str) -> str:
    labels = {
        "MARKET_PRICE_VERIFIED_3_OF_3": "Verified market price — 3/3 competitors",
        "MARKET_PRICE_VERIFIED_2_OF_3": "Verified market price — 2/3 competitors",
        "MARKET_PRICE_SINGLE_SOURCE": "Single-source observation — not market price",
        "MARKET_PRICE_CONFLICT": "Price conflict — review required",
        "NO_MARKET_EVIDENCE": "No verified market evidence",
    }
    return labels.get(value, value)


def reader_row(row: dict[str, str]) -> dict[str, str]:
    out = {
        "Status": row.get("Recommended Review Status", ""),
        "DTB Product": row.get("DTB Product", ""),
        "DTB SKU": row.get("DTB SKU", ""),
        "DTB Product Type": row.get("DTB Product Type", ""),
        "DTB Parent SKU": row.get("DTB Parent SKU", ""),
        "DTB Brand": row.get("DTB Brand", ""),
        "DTB Effective Price": display_money(row.get("DTB Effective Price", "")),
        "DTB Price Basis": row.get("DTB Price Basis", ""),
        "Verified Competitors": row.get("Verified Competitor Count", "0"),
        "Distinct Verified Prices": row.get("Distinct Verified Prices", "0"),
        "Market Price Status": display_market_status(row.get("Market Price Status", "")),
        "Market Price": display_money(row.get("Market Price", "")),
        "Market Price Evidence Count": row.get("Market Price Evidence Count", "0"),
        "Observed Price Spread": display_money(row.get("Observed Price Spread", "")),
        "DTB vs Market Price": display_money(row.get("DTB vs Market Price", "")),
        "DTB vs Market Price %": display_percent(row.get("DTB vs Market Price %", "")),
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


def identity_review_rows(matches: list[dict[str, str]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for row in matches:
        if row.get("Match Status") != "review":
            continue
        rows.append({
            "Review Type": "identity_candidate",
            "Review Reason": row.get("Contradictions", "") or row.get("Match Method", ""),
            "Match Method": row.get("Match Method", ""),
            "Evidence Quality": row.get("Evidence Quality", ""),
            "Match Score": row.get("Match Score", ""),
            "DTB Product": row.get("DTB Name", ""),
            "DTB SKU": row.get("DTB SKU", ""),
            "DTB Brand": row.get("DTB Brand", ""),
            "DTB Effective Price": display_money(row.get("DTB Effective Price", "")),
            "All-Wall Price": "",
            "Al's Taping Tools Price": "",
            "Wall Tools Price": "",
            "Competitor Source": row.get("Competitor Source", ""),
            "Competitor Product Name": row.get("Competitor Product Name", ""),
            "Competitor SKU": row.get("Competitor SKU", ""),
            "Competitor Price": display_money(row.get("Competitor Price", "")),
            "Variation Compatible": row.get("Variation Compatible", ""),
            "Description Quality": row.get("Description Quality", ""),
        })
    return rows


def market_conflict_review_rows(market: list[dict[str, str]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for row in market:
        if row.get("Market Price Status") != "MARKET_PRICE_CONFLICT":
            continue
        rows.append({
            "Review Type": "market_price_conflict",
            "Review Reason": "verified competitor prices disagree; no market price established",
            "Match Method": "",
            "Evidence Quality": "verified_identity_price_conflict",
            "Match Score": "",
            "DTB Product": row.get("DTB Product", ""),
            "DTB SKU": row.get("DTB SKU", ""),
            "DTB Brand": row.get("DTB Brand", ""),
            "DTB Effective Price": display_money(row.get("DTB Effective Price", "")),
            "All-Wall Price": display_money(row.get("All-Wall Price", "")),
            "Al's Taping Tools Price": display_money(row.get("Al's Taping Tools Price", "")),
            "Wall Tools Price": display_money(row.get("Wall Tools Price", "")),
            "Competitor Source": "",
            "Competitor Product Name": "",
            "Competitor SKU": "",
            "Competitor Price": "",
            "Variation Compatible": "",
            "Description Quality": "",
        })
    return rows


def main() -> int:
    matches = read_csv(MATCHES_CSV)
    market = read_csv(MARKET_CSV)
    unmatched = read_csv(UNMATCHED_CSV)

    reader_rows = [reader_row(row) for row in market]
    reader_fields = list(reader_rows[0].keys()) if reader_rows else []
    write_csv(OUTPUT_READER_CSV, reader_rows, reader_fields)

    price_gap_rows = [
        row for row in reader_rows
        if row.get("Market Price") and row.get("DTB vs Market Price")
    ]
    price_gap_rows.sort(
        key=lambda row: abs(signed_decimal(row.get("DTB vs Market Price", "")) or Decimal("0")),
        reverse=True,
    )
    write_csv(OUTPUT_PRICE_GAPS_CSV, price_gap_rows, reader_fields)

    normalized_review = identity_review_rows(matches) + market_conflict_review_rows(market)
    review_fields = [
        "Review Type", "Review Reason", "Match Method", "Evidence Quality", "Match Score",
        "DTB Product", "DTB SKU", "DTB Brand", "DTB Effective Price",
        "All-Wall Price", "Al's Taping Tools Price", "Wall Tools Price",
        "Competitor Source", "Competitor Product Name", "Competitor SKU", "Competitor Price",
        "Variation Compatible", "Description Quality",
    ]
    normalized_review.sort(key=lambda row: (
        0 if row["Review Type"] == "market_price_conflict" else 1,
        -int(row.get("Match Score") or 0),
        row["DTB Brand"],
        row["DTB Product"],
    ))
    write_csv(OUTPUT_REVIEW_CSV, normalized_review, review_fields)

    status_counts = Counter(row.get("Status", "") for row in reader_rows)
    verified_identity_products = sum(1 for row in reader_rows if int(row.get("Verified Competitors") or 0) > 0)
    verified_market_prices = sum(1 for row in reader_rows if row.get("Market Price"))
    verified_3 = sum(1 for row in market if row.get("Market Price Status") == "MARKET_PRICE_VERIFIED_3_OF_3")
    verified_2 = sum(1 for row in market if row.get("Market Price Status") == "MARKET_PRICE_VERIFIED_2_OF_3")
    conflicts = sum(1 for row in market if row.get("Market Price Status") == "MARKET_PRICE_CONFLICT")
    single_source = sum(1 for row in market if row.get("Market Price Status") == "MARKET_PRICE_SINGLE_SOURCE")
    review_only = sum(
        1 for row in reader_rows
        if int(row.get("Verified Competitors") or 0) == 0 and int(row.get("Review Candidates") or 0) > 0
    )
    fully_unmatched = len(unmatched)

    summary_md = f"""# DTB Competitor Market Price Report

## Executive Summary

- Sellable DTB pricing targets evaluated: **{len(market):,}**
- Products with at least one verified competitor identity and price: **{verified_identity_products:,}**
- Products with an established observed market price: **{verified_market_prices:,}**
- Market prices verified by all three competitors: **{verified_3:,}**
- Market prices verified by two of three competitors: **{verified_2:,}**
- Products with verified competitor price conflicts: **{conflicts:,}**
- Products with only one verified competitor price: **{single_source:,}**
- Products with review candidates but no verified priced evidence: **{review_only:,}**
- Products with no candidate evidence: **{fully_unmatched:,}**
- Review queue rows: **{len(normalized_review):,}**

## Product Scope

WooCommerce `variable` parent rows are excluded completely from SKU-level competitor pricing. Only `simple` products and purchasable `variation` rows are pricing targets. Variations may use parent naming context for candidate discovery, but child SKU/MPN/manufacturer identifiers remain authoritative.

## Identity Contract

A competitor record is automatically verified only when **canonical manufacturer/brand + canonical identifier** agree with the DTB product and no structured contradiction is present. SKU values are never treated as globally unique. Unknown-brand identifier matches, cross-brand conflicts, title/identifier conflicts, dimensional conflicts, handedness conflicts, pack-count conflicts, generation conflicts, and product-family conflicts remain review-only.

Fuzzy and near-identical title matches are **never auto-accepted**.

## Market Price Contract

The workflow does **not** calculate an average, median, midpoint, or majority-derived market price.

Each competitor is resolved independently. An observed `Market Price` is established only when at least two verified competitor sites expose the exact same price for the same verified product and there is no verified conflicting site price.

- `MARKET_PRICE_VERIFIED_3_OF_3`: all three competitor prices are verified and identical; that common amount is the market price.
- `MARKET_PRICE_VERIFIED_2_OF_3`: two verified competitor prices are available and identical, with no verified conflicting third price; that common amount is the market price with two-source evidence.
- `MARKET_PRICE_SINGLE_SOURCE`: one verified price exists; it is retained as evidence but is **not** promoted to market price.
- `MARKET_PRICE_CONFLICT`: two or more verified competitor prices disagree; market price remains blank and the product enters review.
- `NO_MARKET_EVIDENCE`: no verified priced competitor evidence exists.

Same-site duplicate listings are also never averaged. If duplicate observations for one retailer disagree on price, that retailer's price is treated as conflicting evidence and excluded from market-price establishment until reviewed.

Identical retailer prices are observed market evidence only; the workflow does not infer MAP, MSRP, or manufacturer-enforced pricing without independent policy evidence.

## DTB Price Semantics

`DTB Effective Price` uses the sale price when a positive sale price is populated, otherwise the regular price. `DTB vs Market Price` is **DTB effective price minus established market price**. Positive means DTB is higher; negative means DTB is lower; zero means DTB is aligned with the observed market price.

## Status Breakdown

"""
    for status, count in sorted(status_counts.items()):
        summary_md += f"- **{status or 'Unknown'}:** {count:,}\n"
    summary_md += """

## Report Usage

- `competitor_match_reader_view.csv` is the business-facing product-by-product market-price view.
- `competitor_match_price_gaps.csv` contains only products for which an observed market price was actually established.
- `competitor_match_review_queue.csv` includes both identity-review candidates and verified price conflicts.
- `dtb_official_competitor_matches.csv` is the technical candidate evidence ledger.
- `dtb_official_competitor_best_matches.csv` is retained for compatibility but contains one aggregate row per eligible DTB pricing target; it does not select an arbitrary competitor.
"""
    OUTPUT_SUMMARY_MD.write_text(summary_md, encoding="utf-8")

    top_gaps = price_gap_rows[:30]
    top_review = normalized_review[:30]
    html_doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DTB Competitor Market Price</title>
<style>
body{{font-family:Inter,Arial,sans-serif;margin:32px;color:#172033;background:#fff;line-height:1.45}}
main{{max-width:1500px;margin:auto}} h1,h2{{color:#0f172a}} .cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}}
.card{{border:1px solid #dbe3ed;border-radius:10px;padding:16px;background:#f8fafc}} .card strong{{display:block;font-size:26px;color:#0f766e}}
.note{{background:#fffbeb;border:1px solid #f59e0b;padding:14px;border-radius:8px}} .table-wrap{{overflow:auto}}
table{{border-collapse:collapse;width:100%;font-size:13px;margin:12px 0 28px}} th,td{{border-bottom:1px solid #dbe3ed;padding:8px;text-align:left;vertical-align:top;white-space:nowrap}} th{{background:#f1f5f9;position:sticky;top:0}}
</style></head><body><main>
<h1>DTB Competitor Market Price</h1>
<p>Manufacturer-scoped, contradiction-aware observed market pricing. No average or median market prices are synthesized.</p>
<div class="cards"><div class="card"><strong>{len(market):,}</strong>pricing targets</div><div class="card"><strong>{verified_market_prices:,}</strong>market prices established</div><div class="card"><strong>{verified_3:,}</strong>verified 3/3</div><div class="card"><strong>{verified_2:,}</strong>verified 2/3</div><div class="card"><strong>{conflicts:,}</strong>price conflicts</div><div class="card"><strong>{fully_unmatched:,}</strong>fully unmatched</div></div>
<div class="note"><strong>Market-price guardrail:</strong> A market price exists only when verified competitor observations agree exactly. Any verified disagreement leaves Market Price blank and enters review.</div>
<h2>Largest DTB vs Market Price Gaps</h2><div class="table-wrap">{table_html(top_gaps,["Status","DTB Product","DTB SKU","DTB Effective Price","Verified Competitors","Market Price Status","Market Price","DTB vs Market Price","DTB vs Market Price %"])}</div>
<h2>Highest-Priority Review Items</h2><div class="table-wrap">{table_html(top_review,["Review Type","Review Reason","DTB Product","DTB SKU","All-Wall Price","Al's Taping Tools Price","Wall Tools Price","Competitor Source","Competitor Product Name","Competitor SKU","Competitor Price"])}</div>
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
