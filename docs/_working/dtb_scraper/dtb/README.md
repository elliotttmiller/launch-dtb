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

Raw competitor evidence comes from the three per-site catalog exports under:

```text
reports/competitor-catalog/
```

The raw five-column scrape contract remains:

```text
Brand
Product Name
SKU
Product Price
Product Description
```

WooCommerce remains the commerce authority. These reports are research evidence and never become an alternate price source of truth.

## Competitor identifier contract

The exported `SKU` column has site-specific semantics:

- **All-Wall:** manufacturer part number / MPN. All-Wall store SKU is never substituted when MPN is absent.
- **Al's Taping Tools:** storefront SKU exactly as exposed.
- **Wall Tools:** storefront SKU with only verified prefixes `LEV5-`, `DURA-`, `SURP-`, `TAPE-`, and `COLM-` stripped case-insensitively. Unknown prefixes remain unchanged.

## Pricing target scope

Only independently purchasable DTB rows participate in SKU-level pricing:

```text
simple     -> included
variation  -> included
variable   -> excluded
```

WooCommerce variable parents are product-family containers. They are excluded from matching, unmatched counts, review queues, market-price establishment, and price-gap reporting.

A variation may use its parent product name as extra matching context, but the variation's own SKU/MPN/manufacturer identifier remains authoritative.

## Product identity contract

SKU is never globally unique. The authoritative identity key is:

```text
identity_key = canonical_brand + "::" + canonical_identifier
```

Examples:

```text
tapetech::10116
columbia::10116
```

An automatic verified match requires:

1. known canonical competitor manufacturer/brand;
2. competitor manufacturer equals DTB manufacturer;
3. competitor identifier equals a DTB SKU/MPN/manufacturer identifier;
4. no title-extracted identifier contradiction;
5. no structured variation contradiction.

Unknown-brand identifier matches, cross-brand collisions, dimensional differences, range differences, left/right differences, pack-count differences, generation differences, length-class differences, and product-family conflicts remain review-only.

**Fuzzy and near-identical title matches are never auto-accepted.**

## Structured variation guardrails

Identity checks include:

- inch measurements and mixed fractions;
- size ranges;
- handedness;
- pack/count quantities;
- short / standard / long / XL / mini qualifiers;
- generation markers;
- controlled product-family terms such as taper, flat box, corner finisher, handle, blade, washer, bolt, pump, and stilt.

For example, `1/2"` and `1-1/2"` fasteners cannot become equivalent merely because the rest of the title is similar.

## DTB effective price

The DTB price used for comparison is:

```text
positive Sale price, when populated
otherwise Regular price
```

The aggregate output records `DTB Price Basis` and flags a sale price above regular price.

## Site-level price resolution

Each competitor is resolved independently before any market-price decision.

A competitor contributes at most one verified price for a DTB product.

If the same site exposes duplicate verified rows:

- identical duplicate prices are accepted as one site observation;
- differing duplicate prices become `conflicting_price_duplicates`;
- duplicate prices are never averaged, median-collapsed, or otherwise synthesized;
- a conflicted site does not contribute a price until reviewed.

## Observed market price contract

The three competitor prices are explicit observations, not a statistical sample.

The workflow **does not calculate an average, median, midpoint, weighted average, or majority-derived market price**.

A `Market Price` exists only when independently verified competitor prices for the same product agree exactly and there is no verified conflicting retailer price.

States:

```text
MARKET_PRICE_VERIFIED_3_OF_3
MARKET_PRICE_VERIFIED_2_OF_3
MARKET_PRICE_SINGLE_SOURCE
MARKET_PRICE_CONFLICT
NO_MARKET_EVIDENCE
```

### MARKET_PRICE_VERIFIED_3_OF_3

All-Wall, Al's, and Wall Tools all resolve to the same verified product and publish the same price. That common observed amount is the market price.

### MARKET_PRICE_VERIFIED_2_OF_3

Exactly two competitors provide verified priced observations, both are identical, and there is no verified conflicting third observation. The shared amount is the market price with two-source evidence.

### MARKET_PRICE_SINGLE_SOURCE

One verified competitor price exists. It is retained as evidence but is not promoted to market price.

### MARKET_PRICE_CONFLICT

Two or more verified retailer prices differ. `Market Price` remains blank and the product is sent to review. The pipeline does not select the majority value and does not calculate a median or average fallback.

### NO_MARKET_EVIDENCE

No verified priced competitor evidence exists.

Example:

```text
All-Wall             1649.29
Al's Taping Tools    1649.29
Wall Tools           1649.29

Market Price Status  MARKET_PRICE_VERIFIED_3_OF_3
Market Price         1649.29
Evidence Count       3
```

If one verified site shows a different amount, the result is `MARKET_PRICE_CONFLICT` and `Market Price` is blank.

Identical retailer prices prove observed agreement only. They must not be labeled MAP, MSRP, or manufacturer-enforced pricing unless independent policy evidence establishes that.

## Conflict diagnosis

`analyze_competitor_price_conflicts.py` runs immediately after the cross-retailer comparison and classifies every `MARKET_PRICE_CONFLICT` without changing its market-price status.

It distinguishes:

- two retailers agree and one retailer is an outlier;
- all three verified prices are distinct;
- two-source disagreements;
- same-retailer duplicate-price conflicts;
- exact multiplicative price relationships commonly associated with pack/unit mismatches;
- small price drift versus larger possible sale/stale-price differences.

The audit identifies the outlier retailer when two sources agree and emits both product-level detail and aggregate counts. These diagnostics are evidence for fixing extraction or offer normalization; they never choose a market price.

## DTB versus market semantics

When and only when a market price is established:

```text
DTB vs Market Price = DTB effective price - Market Price
```

and:

```text
DTB vs Market Price % = (DTB effective price - Market Price) / Market Price * 100
```

Positive means DTB is higher, negative means DTB is lower, and zero means DTB is aligned.

No DTB-versus-market delta is emitted for single-source or conflicting observations because no market price has been established.

## Evidence aggregation

Every candidate observation remains in the technical evidence ledger. Verified observations are resolved per competitor, then evaluated cross-retailer for exact price agreement.

Primary product-level fields include:

```text
DTB SKU
DTB Product Type
DTB Parent SKU
DTB Brand
DTB Product
DTB Effective Price
DTB Price Basis

All-Wall Verified / Identity / SKU / Product / Price / Evidence Quality
Al's Verified / Identity / SKU / Product / Price / Evidence Quality
Wall Tools Verified / Identity / SKU / Product / Price / Evidence Quality

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

## Description quality

Known generic Al's and Wall Tools storefront boilerplate is quarantined from semantic evidence. Raw scrape CSVs remain unchanged.

## Discovery rejection vs product failure

`finalize_scrape_outputs.py` separates obvious non-product crawl candidates from true product failures:

```text
<site>/non_product_candidates.jsonl
<site>/product_failures.jsonl
<site>/quality_summary.json
<site>/catalog_quality.jsonl
```

The original `failures.jsonl` remains unchanged as source evidence.

## All-Wall products without MPN

All-Wall remains MPN-strict. A product without an MPN is never assigned the All-Wall store SKU for automatic matching.

Manual-only evidence is written to:

```text
all_wall/manual_pricing_evidence.csv
```

Refresh it with:

```powershell
python run_competitor_pricing_pipeline.py --refresh-all-wall-manual-evidence
```

Those records never enter automatic identity matching.

## Installation and execution

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
python run_competitor_pricing_pipeline.py
```

The pricing composition root executes:

```text
finalize_scrape_outputs.py
filter_current_dtb_brands.py
create_competitor_price_comparison.py
analyze_competitor_price_conflicts.py
match_official_catalog_to_competitors.py
create_friendly_match_report.py
```

A new full scrape is not required merely because downstream market-price semantics change. Existing raw scrape evidence can be reprocessed deterministically.

## Generated reports

- `current_dtb_brand_competitor_products.csv` — competitor rows assigned to DTB-held brands using independent brand evidence.
- `current_dtb_brand_filter_summary.csv` — accepted/rejected brand-classification telemetry.
- `competitor_price_comparison_by_sku.csv` — manufacturer-scoped cross-retailer observed-price comparison; compatibility filename only, not a global SKU join.
- `competitor_price_comparison_review.csv` — rows lacking a safe manufacturer-scoped identity.
- `competitor_price_conflict_audit.csv` — one row per market-price conflict with conflict pattern, probable cause, outlier retailer, spread, pack-factor diagnostics, retailer prices, and product titles.
- `competitor_price_conflict_summary.csv` — aggregate conflict-pattern, probable-cause, outlier-retailer, and pack-factor counts.
- `dtb_official_competitor_matches.csv` — full technical candidate evidence ledger.
- `dtb_official_competitor_best_matches.csv` — compatibility filename; one aggregate row per eligible DTB pricing target.
- `dtb_official_competitor_unmatched.csv` — eligible DTB targets with no verified or review candidate evidence.
- `dtb_official_competitor_match_summary.csv` — technical counts including excluded parent rows and market-price states.
- `competitor_match_reader_view.csv` — business-facing product-by-product market-price view.
- `competitor_match_price_gaps.csv` — only products with an actually established market price.
- `competitor_match_review_queue.csv` — identity review candidates plus verified price conflicts.
- `competitor_match_report_summary.md` — plain-language market-price summary.
- `competitor_match_report.html` — readable market-price dashboard.

## Tests

```powershell
python -m unittest discover -s tests -v
```

Regression coverage includes manufacturer-scoped identities, cross-brand collisions, unknown-brand identifiers, title/identifier contradictions, dimensional conflicts, fuzzy review-only behavior, sale-price precedence, variable-parent exclusion, 3/3 exact market-price agreement, 2/3 agreement, single-source non-promotion, price conflicts, storefront-boilerplate quarantine, same-site duplicate agreement, same-site duplicate price conflict, and canonical brand aliases.

## Safety boundary

This workflow is read-only competitor research. It does not mutate WooCommerce, orders, payments, inventory, fulfillment, accounting, protected identifiers, or the canonical catalog.

Any future price write must remain inside the system that owns commerce pricing and have explicit authorization, validation, manufacturer/MAP policy handling where applicable, approval, audit, and rollback semantics.
