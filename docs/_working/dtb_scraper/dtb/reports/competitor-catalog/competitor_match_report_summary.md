# DTB Competitor Market Evidence Report

## Executive Summary

- Official DTB products evaluated: **756**
- Products with at least one verified competitor identity: **524**
- Products with verified evidence from two or more competitors: **301**
- Products with review candidates but no verified evidence: **56**
- Products with no candidate evidence: **176**
- Candidate evidence rows requiring review: **291**

## Identity Contract

A competitor record is automatically verified only when **canonical manufacturer/brand + canonical identifier** match the DTB product and no structured contradiction is present. SKU values are never treated as globally unique. Unknown competitor brands, brand conflicts, identifier/title conflicts, dimensional conflicts, handedness conflicts, pack-count conflicts, generation conflicts, and product-family conflicts are review-only.

Fuzzy and near-identical title matches are **never auto-accepted**.

## Price Semantics

`DTB Effective Price` uses the sale price when a sale price is present, otherwise the regular price. `DTB vs Lowest` and `DTB vs Median` are calculated as **DTB effective price minus competitor price**; positive values mean DTB is higher and negative values mean DTB is lower.

## Status Breakdown

- **No Match Found:** 176
- **Review Required:** 56
- **Verified Market Evidence:** 225
- **Verified Market Evidence + Review Candidates:** 76
- **Verified Single-Source:** 159
- **Verified Single-Source + Review Candidates:** 64


## Report Usage

- `competitor_match_reader_view.csv` is the business-facing market evidence view.
- `competitor_match_price_gaps.csv` contains only products with verified competitor evidence.
- `competitor_match_review_queue.csv` contains contradiction, brand-uncertain, and fuzzy candidates that must not drive automated pricing.
- `dtb_official_competitor_matches.csv` is the full technical evidence ledger.
- `dtb_official_competitor_best_matches.csv` is retained for compatibility but now contains one **aggregated market-evidence row per DTB product**, not an arbitrary single “best” competitor.
