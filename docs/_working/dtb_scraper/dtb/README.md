# DTB Competitor Catalog + Pricing Intelligence

This working toolset is a local, read-only competitor catalog and market-pricing workflow for:

- Al's Taping Tools — `https://www.alstapingtools.com/`
- Wall Tools — `https://walltools.com/`
- All-Wall — `https://www.all-wall.com/`

It does **not** update WooCommerce, Veeqo, QuickBooks, MAP, canonical DTB product identifiers, or storefront prices. Competitor data is research evidence only.

## Sources and ownership

Canonical DTB identity and DTB selling prices come from:

```text
products/launch/official/dtb_official_catalog.csv
```

Raw competitor evidence comes from the three per-site catalog exports under:

```text
reports/competitor-catalog/
```

The five-column scrape contract remains:

```text
Brand
Product Name
SKU
Product Price
Product Description
```

The tooling is deterministic operational research. WooCommerce remains the commerce authority and no report in this directory is allowed to become an alternate price source of truth.

## Competitor identifier contract

The exported column is named `SKU`, but its source is competitor-specific:

- **All-Wall:** manufacturer part number / MPN. The All-Wall store SKU is never substituted when MPN is absent.
- **Al's Taping Tools:** storefront SKU exactly as exposed.
- **Wall Tools:** storefront SKU with only the verified prefixes `LEV5-`, `DURA-`, `SURP-`, `TAPE-`, and `COLM-` stripped case-insensitively. Unknown prefixes are preserved.

## Product pricing scope

Competitor price research operates on **sellable SKU-level DTB rows**.

WooCommerce `variable` rows are family/container products. Their prices belong to child variations, so variable parents are excluded from SKU-level competitor pricing conclusions. Their `variation` children remain in scope. Simple and other non-variable sellable rows also remain in scope.

For a variation, parent product naming context may be appended to the child name for matching. The child SKU/MPN remains the identity authority; the parent never replaces the child identifier.

This prevents synthetic family SKUs such as variable-parent identifiers from inflating unmatched counts or generating invalid price comparisons.

## Market identity contract

SKU is never treated as globally unique. The authoritative comparison key is:

```text
identity_key = canonical_brand + "::" + canonical_identifier
```

Examples:

```text
tapetech::10116
columbia::10116
```

Those are distinct product identities even though the identifier text is the same.

An automatic verified match requires all of the following:

1. canonical competitor manufacturer/brand is known;
2. canonical competitor manufacturer/brand equals the DTB manufacturer/brand;
3. competitor identifier equals a DTB SKU/MPN/manufacturer identifier;
4. no independent title-identifier contradiction exists;
5. no structured variation contradiction exists.

Unknown-brand identifier matches, cross-brand identifier matches, title/identifier conflicts, dimensional differences, range differences, left/right differences, pack-count differences, generation differences, length-class differences, and product-family conflicts are review-only.

**Fuzzy and near-identical title matches are never auto-accepted.**

## Structured variation guardrails

The matcher compares identity-critical product features before fuzzy evidence can be considered, including:

- inch measurements and mixed fractions;
- size ranges;
- left/right handedness;
- pack/count quantities;
- short / standard / long / XL / mini qualifiers;
- generation markers;
- controlled product-family terms such as taper, flat box, corner finisher, handle, blade, washer, bolt, pump, and stilt.

For example, `1/2"` and `1-1/2"` fasteners cannot become near-identical matches because the remaining title text is similar.

## DTB effective-price semantics

Pricing analysis uses:

```text
Sale price, when present
otherwise Regular price
```

The aggregate report includes `DTB Price Basis` and flags a populated sale price above regular price for review.

All DTB-versus-market deltas use this sign convention:

```text
DTB effective price - competitor / market reference price
```

A positive value means DTB is more expensive. A negative value means DTB is less expensive.

## Observed competitor price consensus

The three competitor sites commonly publish the **same price for the same verified manufacturer identity**. That is expected and is now modeled explicitly instead of being treated as an uninteresting zero spread.

For each DTB pricing target the pipeline reports:

```text
Verified Competitor Count
Distinct Verified Prices
Price Consensus
Consensus Price
Price Spread
Market Reference Price
Market Reference Basis
```

Consensus states are:

- `exact_price_consensus` — two or more verified competitor sources publish the exact same price;
- `single_verified_price` — only one verified competitor price is available;
- `price_dispersion` — verified competitor sources publish different prices;
- `no_verified_price` — no verified priced competitor evidence exists.

When exact consensus exists, the common observed amount becomes the `Market Reference Price`. When verified competitors differ, the median verified site price becomes the market reference.

Important: identical retailer prices are recorded only as **observed price consensus**. The pipeline does not infer that the amount is MAP, MSRP, or another manufacturer policy unless that policy is independently sourced and modeled later.

For a product such as a TapeTech automatic taper where All-Wall, Al's Taping Tools, and Wall Tools all expose the same verified price, the correct result is one market reference price supported by three verified retailer observations—not three different market prices and not an averaged approximation.

## Evidence aggregation

The old arbitrary single `best_by_official` winner model is removed.

Every candidate observation is preserved in the technical evidence ledger. Verified observations are first resolved per competitor, then aggregated across competitors.

If one competitor exposes duplicate rows for the same verified identity, duplicates are retained, counted, checked for title conflicts, and deterministically collapsed to a site median only when the duplicate evidence remains compatible.

Primary market fields include:

```text
DTB SKU
DTB Product Type
DTB Parent SKU
DTB Brand
DTB Product
DTB Effective Price
DTB Price Basis

All-Wall verified identity / price / quality
Al's verified identity / price / quality
Wall Tools verified identity / price / quality

Verified Competitor Count
Distinct Verified Prices
Price Consensus
Consensus Price
Price Spread
Market Reference Price
Market Reference Basis
Lowest Verified Price
Highest Verified Price
Median Verified Price
DTB vs Market Reference
Recommended Review Status
```

## Description quality

Known generic Al's and Wall Tools storefront boilerplate is quarantined from semantic evidence. Raw five-column scrape CSVs are preserved; downstream analysis emits cleaned descriptions and description-quality classifications.

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

All-Wall MPN strictness is retained. A product without MPN is never assigned the All-Wall store SKU for automatic identity matching.

`finalize_scrape_outputs.py` writes manual-only evidence to:

```text
all_wall/manual_pricing_evidence.csv
```

To refresh the public SuiteCommerce catalog and retain MPN-less products strictly as manual evidence:

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

Balanced scrape profile:

```powershell
python competitor_catalog_scraper.py --workers 12 --per-host 6 --request-interval 0.15 --verbose
```

The pricing composition root executes, in order:

```text
finalize_scrape_outputs.py
filter_current_dtb_brands.py
create_competitor_price_comparison.py
match_official_catalog_to_competitors.py
create_friendly_match_report.py
```

## Generated reports

Primary outputs are:

- `current_dtb_brand_competitor_products.csv` — competitor rows belonging to DTB-held brands using independent brand evidence.
- `current_dtb_brand_filter_summary.csv` — accepted/rejected brand classification telemetry.
- `competitor_price_comparison_by_sku.csv` — manufacturer-scoped multi-source identity and price-consensus comparison; the compatibility filename no longer implies a global SKU join.
- `competitor_price_comparison_review.csv` — rows lacking a safe manufacturer-scoped identity.
- `dtb_official_competitor_matches.csv` — full candidate evidence ledger.
- `dtb_official_competitor_best_matches.csv` — compatibility filename; one aggregated market-evidence row per sellable DTB pricing target.
- `dtb_official_competitor_unmatched.csv` — sellable DTB pricing targets with no verified or review candidate evidence.
- `dtb_official_competitor_match_summary.csv` — technical counts including variable-parent exclusions and price-consensus states.
- `competitor_match_reader_view.csv` — business-facing market evidence view.
- `competitor_match_price_gaps.csv` — verified products ranked by absolute DTB-versus-market-reference gap.
- `competitor_match_review_queue.csv` — all review-only contradiction, unknown-brand, cross-brand, and fuzzy candidates.
- `competitor_match_report_summary.md` — plain-language market evidence summary.
- `competitor_match_report.html` — readable market evidence dashboard.

## Tests

```powershell
python -m unittest discover -s tests -v
```

Tests cover manufacturer-scoped identity, cross-brand collisions, unknown-brand exact identifiers, title/identifier contradictions, dimensional conflicts, fuzzy review-only behavior, sale-price precedence, variable-parent exclusion, exact multi-source price consensus, price dispersion, storefront-boilerplate quarantine, same-site duplicate aggregation, and canonical brand aliases.

## Safety boundary

This workflow is read-only competitor research. It does not mutate WooCommerce, payments, orders, inventory, fulfillment, accounting, protected identifiers, or the canonical catalog.

Any future price write must remain inside the system that owns commerce pricing and must have explicit authorization, validation, manufacturer/MAP policy handling where applicable, approval, audit, and rollback semantics.
