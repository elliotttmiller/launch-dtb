# Competitor Pricing Consensus Contract

## Purpose

This document defines the durable interpretation contract for the full-catalog competitor pricing workflow under:

```text
docs/_working/dtb_scraper/dtb/
```

The workflow is read-only research tooling. It does not own or mutate WooCommerce pricing.

## Sellable pricing targets

SKU-level competitor price analysis evaluates DTB rows that can represent a purchasable price.

WooCommerce `variable` parent rows are product-family containers and are excluded from competitor pricing conclusions. Their child `variation` rows remain pricing targets. Simple and other non-variable sellable rows remain in scope.

A variation may use its parent product name as additional matching context, but the child SKU/MPN/manufacturer identifier remains authoritative. Parent identifiers must never replace child identity.

This prevents family/container SKUs from creating false unmatched results or invalid price comparisons.

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

SKU alone is never a global join key. Unknown-brand exact identifiers, cross-brand collisions, dimensional conflicts, handedness conflicts, pack/count conflicts, generation conflicts, family conflicts, fuzzy matches, and near-identical title matches remain review-only.

## Site-level evidence

Each competitor site is resolved independently before cross-site aggregation.

If one site exposes duplicate observations for a verified identity, those observations are retained and audited. Compatible duplicates are collapsed deterministically to a site median. Conflicting identity or title duplicates are not allowed to become verified market evidence.

## Observed price consensus

The three active competitor retailers frequently publish the same price for the same verified manufacturer product. Exact equality is a first-class market condition, not noise.

For verified site prices, the pipeline emits:

```text
Verified Competitor Count
Distinct Verified Prices
Price Consensus
Consensus Price
Price Spread
Lowest Verified Price
Highest Verified Price
Median Verified Price
Market Reference Price
Market Reference Basis
```

The current states are:

```text
exact_price_consensus
single_verified_price
price_dispersion
no_verified_price
```

`exact_price_consensus` means two or more verified competitor sites expose the exact same product price. The common amount is the market reference price.

`single_verified_price` means only one verified site price is available. That amount is retained as a single-source reference and must not be represented as multi-source consensus.

`price_dispersion` means verified sites expose different prices. The median verified site price is used as the neutral market reference while low, high, and spread remain visible.

`no_verified_price` means there is no verified priced competitor evidence.

Matching prices must not be labeled MAP, MSRP, manufacturer-enforced pricing, or another pricing policy unless that policy is independently sourced. Identical retailer pricing alone proves only observed price consensus.

## DTB comparison semantics

The DTB effective selling price is:

```text
Sale price when populated and positive
otherwise Regular price
```

All DTB-versus-market deltas use:

```text
DTB effective price - market price
```

Positive means DTB is higher. Negative means DTB is lower. Zero means DTB equals the observed market reference.

When exact observed consensus exists, `DTB vs Market Reference` compares directly to the common consensus price. When price dispersion exists, it compares to the median verified site price.

## Example

If All-Wall, Al's Taping Tools, and Wall Tools each expose the same verified TapeTech automatic taper at `$1,295.00`, the pricing model records:

```text
Verified Competitor Count: 3
Distinct Verified Prices: 1
Price Consensus: exact_price_consensus
Consensus Price: 1295.00
Lowest Verified Price: 1295.00
Highest Verified Price: 1295.00
Median Verified Price: 1295.00
Price Spread: 0.00
Market Reference Price: 1295.00
Market Reference Basis: exact_price_consensus
```

That is one market reference supported by three verified retailer observations.

## Ownership and safety

These reports are evidence for pricing review only. WooCommerce remains the commerce pricing authority. Any future automated price mutation requires a separate authorized workflow with validation, manufacturer/MAP policy handling where applicable, approval, auditability, rollback, and explicit ownership boundaries.
