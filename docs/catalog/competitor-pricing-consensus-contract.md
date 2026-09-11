# Competitor Market Price Contract

## Purpose

This document defines the durable interpretation contract for the full-catalog competitor pricing workflow under:

```text
docs/_working/dtb_scraper/dtb/
```

The workflow is read-only research tooling. It does not own or mutate WooCommerce pricing.

## Pricing target scope

SKU-level competitor pricing evaluates only canonical DTB rows that can represent an independently purchasable price:

```text
simple     -> included
variation  -> included
variable   -> excluded
```

WooCommerce `variable` parent rows are product-family containers and are excluded completely from competitor matching, unmatched counts, review queues, market-price establishment, and price-gap reporting.

A variation may use its parent product name as additional candidate-discovery context, but the child SKU/MPN/manufacturer identifier remains authoritative. Parent identifiers must never replace child identity.

## Identity authority

A competitor product is automatically verified only when:

```text
identity_key = canonical_brand + "::" + canonical_identifier
```

and all of the following hold:

1. competitor manufacturer/brand is known;
2. competitor manufacturer/brand agrees with the DTB product;
3. the competitor identifier agrees with a DTB SKU/MPN/manufacturer identifier;
4. no title-extracted identifier contradicts the exported identifier;
5. no structured variation evidence contradicts the match.

SKU alone is never a global join key. Unknown-brand exact identifiers, cross-brand collisions, dimensional conflicts, handedness conflicts, pack/count conflicts, generation conflicts, product-family conflicts, fuzzy matches, and near-identical title matches remain review-only.

## Site-level evidence

All-Wall, Al's Taping Tools, and Wall Tools are resolved independently before any cross-retailer market-price decision is made.

A retailer contributes at most one verified observed price for a DTB product.

If one retailer exposes duplicate rows for the same verified identity:

- duplicate rows with the same valid price are accepted as one retailer observation;
- duplicate rows with different prices are a `conflicting_price_duplicates` condition;
- conflicting duplicate prices are never averaged, median-collapsed, or otherwise synthesized;
- a retailer with unresolved duplicate-price conflict does not contribute a market-price observation until reviewed.

Identity conflicts, materially conflicting duplicate titles, and missing prices likewise cannot become a verified priced retailer observation.

## Market price authority

The three competitor prices are observations, not samples for statistical aggregation.

The workflow must never calculate an arithmetic mean, median, midpoint, weighted average, majority-derived amount, or other synthetic value and call it the market price.

An observed `Market Price` is established only through exact agreement among independently verified retailer prices for the same verified product.

The states are:

```text
MARKET_PRICE_VERIFIED_3_OF_3
MARKET_PRICE_VERIFIED_2_OF_3
MARKET_PRICE_SINGLE_SOURCE
MARKET_PRICE_CONFLICT
NO_MARKET_EVIDENCE
```

### MARKET_PRICE_VERIFIED_3_OF_3

All three competitors have a verified priced identity and all three prices are identical.

The shared observed amount is the market price.

### MARKET_PRICE_VERIFIED_2_OF_3

Exactly two competitors contribute verified priced observations, both prices are identical, and there is no verified conflicting third price.

The shared observed amount is the market price with two-source corroboration.

This state is weaker than 3/3 and must remain distinguishable in reporting.

### MARKET_PRICE_SINGLE_SOURCE

Only one competitor contributes a verified priced observation.

The observed retailer price is retained as evidence but is not promoted to `Market Price`.

### MARKET_PRICE_CONFLICT

Two or more verified competitor observations expose different prices.

`Market Price` must remain blank. The product enters review with each retailer's actual observed price preserved. The workflow must not choose a majority price or synthesize a median/average fallback.

### NO_MARKET_EVIDENCE

No verified priced competitor observation exists.

## Required product-level market view

Each pricing target should expose:

```text
DTB SKU
DTB Brand
DTB Product
DTB Product Type
DTB Parent SKU
DTB Effective Price
DTB Price Basis

All-Wall Verified
All-Wall Identity
All-Wall SKU
All-Wall Product
All-Wall Price
All-Wall Evidence Quality

Al's Taping Tools Verified
Al's Taping Tools Identity
Al's Taping Tools SKU
Al's Taping Tools Product
Al's Taping Tools Price
Al's Taping Tools Evidence Quality

Wall Tools Verified
Wall Tools Identity
Wall Tools SKU
Wall Tools Product
Wall Tools Price
Wall Tools Evidence Quality

Verified Competitor Count
Distinct Verified Prices
Market Price Status
Market Price
Market Price Evidence Count
Observed Price Spread
DTB vs Market Price
DTB vs Market Price %
Review Candidate Count
Recommended Review Status
```

`Observed Price Spread` is diagnostic conflict telemetry only. It never determines market price.

## Example: three-retailer agreement

If the same verified Columbia Automatic Taper is observed at `$1,649.29` on all three competitor sites:

```text
All-Wall:             1649.29
Al's Taping Tools:    1649.29
Wall Tools:           1649.29

Verified Competitor Count: 3
Distinct Verified Prices: 1
Market Price Status: MARKET_PRICE_VERIFIED_3_OF_3
Market Price: 1649.29
Market Price Evidence Count: 3
Observed Price Spread: 0.00
```

No statistical calculation is required. The market price is the common observed retailer price.

## Example: conflict

If the verified observations are:

```text
All-Wall:             1649.29
Al's Taping Tools:    1649.29
Wall Tools:           1549.29
```

then:

```text
Verified Competitor Count: 3
Distinct Verified Prices: 2
Market Price Status: MARKET_PRICE_CONFLICT
Market Price: [blank]
Observed Price Spread: 100.00
Review Required: yes
```

The two agreeing prices do not override the verified conflicting third observation.

## DTB comparison semantics

The DTB effective selling price is:

```text
Sale price when populated and positive
otherwise Regular price
```

When and only when an observed `Market Price` is established:

```text
DTB vs Market Price = DTB effective price - Market Price
```

and:

```text
DTB vs Market Price % = (DTB effective price - Market Price) / Market Price * 100
```

Positive means DTB is higher. Negative means DTB is lower. Zero means DTB is aligned with the observed market price.

No DTB-vs-market delta is emitted for single-source or conflicting evidence because no market price has been established.

## Policy interpretation

Identical retailer prices must not be labeled MAP, MSRP, manufacturer-enforced pricing, or another pricing policy unless that policy is independently sourced. The competitor workflow proves only what was observed on the retailer sites.

## Ownership and safety

These reports are evidence for pricing review only. WooCommerce remains the commerce pricing authority. Any future automated price mutation requires a separate authorized workflow with validation, manufacturer/MAP policy handling where applicable, approval, auditability, rollback, and explicit ownership boundaries.
