# DTB Competitor Market Price Report

## Executive Summary

- Sellable DTB pricing targets evaluated: **651**
- Products with at least one verified competitor identity and price: **497**
- Products with an established observed market price: **48**
- Market prices verified by all three competitors: **13**
- Market prices verified by two of three competitors: **35**
- Products with verified competitor price conflicts: **247**
- Products with only one verified competitor price: **202**
- Products with review candidates but no verified priced evidence: **33**
- Products with no candidate evidence: **121**
- Review queue rows: **428**

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

- **Identity Review Required:** 33
- **No Market Evidence:** 121
- **Price Conflict - Review Required:** 247
- **Single-Source Evidence:** 147
- **Single-Source Evidence + Review Candidates:** 55
- **Verified Market Price - 2/3:** 29
- **Verified Market Price - 2/3 + Review Candidates:** 6
- **Verified Market Price - 3/3:** 13


## Report Usage

- `competitor_match_reader_view.csv` is the business-facing product-by-product market-price view.
- `competitor_match_price_gaps.csv` contains only products for which an observed market price was actually established.
- `competitor_match_review_queue.csv` includes both identity-review candidates and verified price conflicts.
- `dtb_official_competitor_matches.csv` is the technical candidate evidence ledger.
- `dtb_official_competitor_best_matches.csv` is retained for compatibility but contains one aggregate row per eligible DTB pricing target; it does not select an arbitrary competitor.
