# Competitor Commercial Offer Equivalence Contract

## Purpose

This document defines how Drywall Toolbox audits whether materially different competitor prices represent comparable commercial offers.

The owning tooling is under:

```text
docs/_working/dtb_scraper/dtb/
```

This audit is read-only research tooling. It does not mutate WooCommerce, DTB catalog prices, competitor observations, protected identifiers, market-price status, inventory, orders, fulfillment, or accounting.

## Scope

Commercial-offer equivalence is evaluated only after all earlier correctness gates have succeeded:

```text
verified manufacturer-scoped identity
+
MARKET_PRICE_CONFLICT with exactly two priced retailers
+
normalized price semantic agreement
+
relative price spread > 10%
```

Therefore the audit currently targets only:

```text
P0_gt_25pct
P1_10_to_25pct
```

Lower-spread disagreements remain valid conflicts but are not the first offer-equivalence audit surface.

## Evidence authority

The audit joins the derived price-provenance ledger back to the scraper's internal `products.jsonl` evidence. The public five-column competitor CSV contract remains unchanged.

Stored offer evidence may include:

```text
title
description
category
manufacturer identifier
current observed price
canonical product URL
retrieval timestamp
```

The audit reuses the canonical structured variation parser already used by competitor identity matching. This includes measurements, ranges, handedness, pack counts, length classes, generations, product-family terms, and model-token contradictions.

Commercial-offer evidence adds conservative extraction for:

```text
explicit pack/package/count quantities
pair
single / each / individual
kit
set
component-only wording
assembly wording as descriptive evidence
```

## Classification contract

The audit may emit:

```text
OFFER_EQUIVALENT_PRICE_DISAGREEMENT
PACK_QUANTITY_MISMATCH
VARIANT_MISMATCH
OFFER_SCOPE_MISMATCH
OFFER_EQUIVALENCE_UNRESOLVED
```

### OFFER_EQUIVALENT_PRICE_DISAGREEMENT

The same verified manufacturer identity has the same normalized price semantic and stored offer evidence exposes no structural mismatch.

This classification means **no mismatch was detected in retained evidence**. It does not prove that every live storefront option, quantity break, or hidden variant was identical at scrape time. It never authorizes averaging, tolerance pricing, or selection of one retailer amount.

### PACK_QUANTITY_MISMATCH

Both retailer observations expose explicit quantity evidence and the quantities differ, for example one item versus a pair or a 5-pack versus a single.

The observations are not comparable for market-price agreement until the offer units are normalized by source evidence. The audit itself performs no unit-price conversion.

### VARIANT_MISMATCH

Structured variation evidence conflicts, such as different dimensions, ranges, handedness, generation, length class, or other guarded variation semantics.

The observations must be quarantined from offer equivalence.

### OFFER_SCOPE_MISMATCH

Both sides expose explicit incompatible commercial scope, such as a bundle/kit/set versus an explicitly single or component-only offer.

### OFFER_EQUIVALENCE_UNRESOLVED

Only one side exposes material quantity/scope evidence, or required raw offer evidence is missing. The audit fails closed rather than assuming equivalence.

## Evidence strength

Each classification also records an evidence-strength reason such as:

```text
explicit_structured_contradiction
explicit_quantity_contradiction
explicit_scope_contradiction
one_sided_offer_evidence
matching_explicit_quantity
matching_explicit_scope
verified_identity_no_structural_mismatch_detected
raw_offer_record_missing
```

Evidence strength is diagnostic only.

## Market-price boundary

This audit does not change the competitor market-price contract.

A market price still requires exact observed price agreement across independently verified comparable retailer observations. No average, median, midpoint, tolerance, unit-price synthesis, or majority fallback is introduced.

If a structural offer mismatch is found, the correct action is to quarantine or correct the underlying observation with source evidence. It is not to coerce prices into agreement.

If an observation is classified `OFFER_EQUIVALENT_PRICE_DISAGREEMENT`, the differing retailer amounts remain a genuine observed `MARKET_PRICE_CONFLICT` unless later source evidence proves one observation was wrong.

## Required outputs

The commercial-offer audit emits:

```text
reports/competitor-catalog/competitor_commercial_offer_equivalence_audit.csv
reports/competitor-catalog/competitor_commercial_offer_equivalence_summary.csv
```

The detailed report retains identity, retailer pair, spread, classification, evidence strength, contradictions, and per-retailer offer evidence. The summary reports classification, evidence-strength, retailer-pair, brand, and priority counts.
