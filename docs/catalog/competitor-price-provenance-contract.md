# Competitor Price Provenance Contract

## Purpose

This document defines how Drywall Toolbox audits the source semantics behind competitor price disagreements. It supplements `docs/catalog/competitor-pricing-consensus-contract.md` and does not change the exact-agreement market-price rule.

The owning tooling is under:

```text
docs/_working/dtb_scraper/dtb/
```

The workflow is read-only research tooling. It does not mutate WooCommerce, DTB catalog prices, inventory, orders, or protected identifiers.

## Raw evidence authority

The public competitor catalog CSV contract remains exactly five business fields:

```text
Brand
Product Name
SKU
Product Price
Product Description
```

Price provenance is retained separately in each scraper site's internal `products.jsonl` record. That internal evidence may include:

```text
url
canonical_url
price
regular_price
sale_price
currency
availability
parse_method
retrieved_at
source_hash
```

The public five-column CSV must not be expanded merely to support diagnostics.

## Provenance audit

`analyze_price_provenance.py` joins verified two-source price conflicts back to the internal raw scraper evidence through the same manufacturer-scoped resolved identity contract used by pricing intelligence.

The audit records, per retailer observation:

```text
observed comparison price
raw field matches
normalized price semantic
raw price field
raw regular price field
raw sale price field
currency
availability
parse method
retrieval timestamp
canonical product URL
source hash
```

Raw field names and commercial semantics are deliberately separate. A storefront may duplicate the same amount into both `price` and `regular_price`; that is raw-field duplication, not proof that its commercial meaning differs from another storefront exposing only `price`.

Normalized semantics are:

```text
CURRENT_PRICE
SALE_PRICE
REGULAR_PRICE
NOT_RECONCILED_TO_RAW_FIELDS
OBSERVED_PRICE_MISSING
```

`SALE_PRICE` and `REGULAR_PRICE` require a distinct stored sale-versus-regular relationship. When no distinct sale amount exists, an observed amount that reconciles to `price`, `regular_price`, or both is treated as `CURRENT_PRICE` for provenance comparison. This normalization is diagnostic only and does not alter the observed amount.

The audit never changes the observed price and never selects a preferred retailer amount.

## Priority bands

Two-source price conflicts are operationally prioritized by relative spread against the lower observed price:

```text
P0_gt_25pct
P1_10_to_25pct
P2_1_to_10pct
P3_lte_1pct
```

Priority is a review-order diagnostic only. It does not determine market price or correctness.

## Price-semantic classifications

The provenance audit may classify a disagreement as:

```text
PROVENANCE_INCOMPLETE
RAW_FIELD_RECONCILIATION_REQUIRED
SAME_PRICE_SEMANTIC_DIFFERENT_AMOUNT
SALE_VS_REGULAR_PRICE
SALE_VS_CURRENT_PRICE
REGULAR_VS_CURRENT_PRICE
DIFFERENT_NORMALIZED_PRICE_SEMANTICS
```

These classifications describe what the stored raw evidence supports. They must not be interpreted as permission to rewrite a retailer price.

A disagreement may be corrected only when source evidence proves that the extracted observation used the wrong commercial offer, wrong variant, wrong price field, wrong quantity/unit context, or otherwise did not represent the intended retailer offer.

Normal retailer price differences remain valid observations and stay `MARKET_PRICE_CONFLICT` under the market-price contract.

## Identifier aliases

Brand-scoped identifier aliases are governed separately by `competitor_identifier_aliases.csv` and the main competitor pricing consensus contract. Alias approval requires explicit evidence; price proximity or disagreement is never evidence that two identifiers are equivalent.

Repository-supported aliases may be approved only when protected DTB identity plus direct repository mapping evidence establishes the equivalence. Unresolved separator collisions remain quarantined.

## Required outputs

The provenance workflow emits:

```text
reports/competitor-catalog/competitor_price_provenance_audit.csv
reports/competitor-catalog/competitor_price_provenance_summary.csv
```

These reports are diagnostic evidence for extraction and offer-semantic review. They are not a commerce price source of truth.
