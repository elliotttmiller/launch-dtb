# DTB Competitor Catalog + Market Pricing Intelligence

This working toolset is a local, read-only competitor catalog and observed market-pricing workflow for:

- Al's Taping Tools — `https://www.alstapingtools.com/`
- Wall Tools — `https://walltools.com/`
- All-Wall — `https://www.all-wall.com/`

It does **not** update WooCommerce, Veeqo, QuickBooks, MAP, canonical DTB identifiers, or storefront prices. Competitor data is research evidence only.

## Sources and ownership

Canonical DTB identity and current DTB selling prices come from:

```text
products/launch/official/dtb_official_catalog.csv
```

Raw competitor evidence comes from the per-site exports under:

```text
reports/competitor-catalog/
```

The public competitor CSV contract remains:

```text
Brand
Product Name
SKU
Product Price
Product Description
```

WooCommerce remains the commerce authority. These reports never become an alternate price source of truth.

## Competitor identifier contract

The exported `SKU` field has site-specific semantics:

- **All-Wall:** manufacturer part number / MPN. Store SKU is not substituted when MPN is absent.
- **Al's Taping Tools:** storefront SKU as exposed.
- **Wall Tools:** storefront SKU with only verified prefixes `LEV5-`, `DURA-`, `SURP-`, `TAPE-`, and `COLM-` stripped case-insensitively. Unknown prefixes remain unchanged.

SKU is not globally unique. Verified identity is manufacturer scoped:

```text
identity_key = canonical_brand + "::" + canonical_identifier
```

Automatic verification requires a known manufacturer, matching manufacturer scope, an exact protected identifier or explicitly approved brand-scoped alias, and no title/variation contradiction.

Identifier punctuation is preserved by default. Approved aliases live in `competitor_identifier_aliases.csv`. Unresolved formatting collisions remain distinct. Fuzzy or near-identical title matches are review-only.

Structured variation checks guard dimensions, ranges, handedness, pack counts, generation, length class, product family, and model-token contradictions. These checks exist to prevent different products or variations from entering the same price comparison.

## Pricing target scope

Only independently purchasable DTB rows participate in SKU-level pricing:

```text
simple     -> included
variation  -> included
variable   -> excluded
```

Variable parents are family containers and are excluded from market-price establishment, unmatched counts, and price-gap reporting.

## Site-level price resolution

Each competitor is resolved independently before any market-price decision.

A competitor contributes at most one verified price for a product. When the same retailer exposes duplicate verified rows:

- identical duplicate prices count as one retailer observation;
- differing duplicate prices become a retailer conflict;
- duplicate prices are never averaged, median-collapsed, or otherwise synthesized.

## Market Price contract

The workflow treats competitor prices as explicit observations, not a statistical sample.

A `Market Price` exists only when independently verified competitors publish the **exact same price** for the same verified product.

States:

```text
MARKET_PRICE_VERIFIED_3_OF_3
MARKET_PRICE_VERIFIED_2_OF_3
MARKET_PRICE_SINGLE_SOURCE
MARKET_PRICE_CONFLICT
NO_MARKET_EVIDENCE
```

`MARKET_PRICE_VERIFIED_3_OF_3` means all three competitors publish the same verified price.

`MARKET_PRICE_VERIFIED_2_OF_3` means exactly two verified competitors publish the same price and there is no verified conflicting third price.

`MARKET_PRICE_SINGLE_SOURCE` retains one verified retailer price as evidence but does not promote it to Market Price.

`MARKET_PRICE_CONFLICT` means two or more verified retailer prices differ. Market Price remains blank. The workflow does not choose the majority price and does not calculate an average, median, midpoint, tolerance, or fallback price.

`NO_MARKET_EVIDENCE` means no verified priced competitor evidence exists.

Normal retailer price differences are allowed. A conflict does not need to be explained or solved before the system can represent it correctly.

## Identifier collision audit

`analyze_identifier_collision_evidence.py` audits unresolved separator-format collisions and never writes aliases automatically.

Repository evidence may identify alias candidates, but approval still requires an explicit entry in `competitor_identifier_aliases.csv`. Price similarity or disagreement is never alias evidence.

## Price conflict report

`analyze_competitor_price_conflicts.py` produces one concise diagnostic report for `MARKET_PRICE_CONFLICT` rows. It groups common conflict shapes such as two-source disagreement, three-way disagreement, two-agree/one-outlier, and retailer duplicate-price conflict.

This report is diagnostic only. It does not create another pricing authority and does not attempt to reconcile normal retailer price differences.

## DTB versus market semantics

When and only when Market Price is established:

```text
DTB vs Market Price = DTB effective price - Market Price
DTB vs Market Price % = (DTB effective price - Market Price) / Market Price * 100
```

Positive means DTB is higher, negative means DTB is lower, and zero means aligned. No DTB-versus-market delta is emitted for single-source or conflicting observations.

## Description quality

Known generic storefront boilerplate is quarantined from semantic matching evidence. Raw scrape records remain unchanged.

## All-Wall products without MPN

All-Wall remains MPN-strict. A product without an MPN is never assigned an All-Wall store SKU for automatic matching. Manual-only evidence remains outside automatic identity matching.

## Installation and execution

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
python run_competitor_pricing_pipeline.py
```

The normal pricing pipeline is deliberately small:

```text
finalize_scrape_outputs.py
filter_current_dtb_brands.py
create_competitor_price_comparison.py
analyze_identifier_collision_evidence.py
analyze_competitor_price_conflicts.py
match_official_catalog_to_competitors.py
create_friendly_match_report.py
```

A full scrape is not required merely because downstream matching or report logic changes. Existing scrape evidence can be reprocessed deterministically.

## Primary generated reports

- `current_dtb_brand_competitor_products.csv` — competitor rows assigned to supported DTB brands.
- `competitor_price_comparison_by_sku.csv` — manufacturer-scoped cross-retailer comparison.
- `competitor_price_comparison_review.csv` — rows without a safe automatic identity.
- `competitor_identifier_collision_audit.csv` — strict/resolved identifier collision review.
- `competitor_identifier_collision_evidence.csv` — evidence disposition for unresolved collisions.
- `competitor_price_conflict_audit.csv` — concise price-conflict diagnostic ledger.
- `dtb_official_competitor_matches.csv` — candidate evidence ledger.
- `dtb_official_competitor_best_matches.csv` — one aggregate row per eligible DTB pricing target.
- `dtb_official_competitor_unmatched.csv` — eligible targets without verified or review candidate evidence.
- `competitor_match_reader_view.csv` — business-facing market-price view.
- `competitor_match_price_gaps.csv` — only products with an established Market Price.
- `competitor_match_review_queue.csv` — identity review candidates and verified price conflicts.
- `competitor_match_report_summary.md` / `competitor_match_report.html` — readable summaries.

## Tests

Regression coverage is intentionally centered on the durable contract: manufacturer-scoped identity, approved aliases, unresolved formatting variants, cross-brand collisions, unknown-brand identifiers, title/identifier contradictions, structured variation conflicts, fuzzy review-only behavior, DTB effective-price selection, variable-parent exclusion, exact 3/3 and 2/3 Market Price agreement, single-source non-promotion, retailer price conflict, duplicate-site handling, description quarantine, and canonical brand aliases.

## Safety boundary

This workflow is read-only competitor research. It does not mutate WooCommerce, orders, payments, inventory, fulfillment, accounting, protected identifiers, or the canonical catalog.

Any future price write must remain inside the owning commerce system with explicit authorization, validation, applicable manufacturer/MAP handling, approval, audit, and rollback semantics.
