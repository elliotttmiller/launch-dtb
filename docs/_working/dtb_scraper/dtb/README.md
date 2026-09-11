# DTB Competitor Catalog + Pricing Intelligence

This working toolset is a local, read-only competitor catalog and market-pricing workflow for:

- Al's Taping Tools — `https://www.alstapingtools.com/`
- Wall Tools — `https://walltools.com/`
- All-Wall — `https://www.all-wall.com/`

It does **not** update WooCommerce, Veeqo, QuickBooks, MAP, canonical DTB product identifiers, or storefront prices. Competitor data is research evidence only.

## Source boundaries

Canonical DTB product identity and DTB selling prices come from:

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

## Competitor identifier contract

The exported column is named `SKU`, but its source is competitor-specific:

- **All-Wall:** manufacturer part number / MPN. The All-Wall store SKU is never substituted when MPN is absent.
- **Al's Taping Tools:** storefront SKU exactly as exposed.
- **Wall Tools:** storefront SKU with only the verified prefixes `LEV5-`, `DURA-`, `SURP-`, `TAPE-`, and `COLM-` stripped case-insensitively. Unknown prefixes are preserved.

## Market identity contract

Downstream matching no longer treats SKU as globally unique.

The authoritative comparison key is:

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

The matcher extracts and compares identity-critical product features before fuzzy evidence can be considered, including:

- inch measurements and mixed fractions;
- size ranges;
- left/right handedness;
- pack/count quantities;
- short / standard / long / XL / mini qualifiers;
- generation markers;
- controlled product-family terms such as taper, flat box, corner finisher, handle, blade, washer, bolt, pump, and stilt.

For example, `1/2"` and `1-1/2"` fasteners cannot become near-identical matches simply because the remaining title text is similar.

## DTB effective-price semantics

Pricing analysis uses:

```text
Sale price, when present
otherwise Regular price
```

The aggregate report includes `DTB Price Basis` and flags a sale price above regular price for review.

`DTB vs Lowest` and `DTB vs Median` are:

```text
DTB effective price - competitor price
```

A positive value means DTB is more expensive. A negative value means DTB is less expensive.

## Evidence aggregation

The old arbitrary `best_by_official` winner model has been removed.

Every candidate observation is preserved in the technical evidence ledger. Verified observations are aggregated per competitor, then across competitors.

For each DTB product the market report includes:

```text
DTB SKU
DTB Brand
DTB Product
DTB Effective Price
DTB Price Basis

All-Wall verified identity / price / quality
Al's verified identity / price / quality
Wall Tools verified identity / price / quality

Verified Competitor Count
Review Candidate Count
Lowest Verified Price
Highest Verified Price
Median Verified Price
DTB vs Lowest
DTB vs Median
Recommended Review Status
```

If the same competitor exposes duplicate rows for one verified identity, duplicates are **not overwritten**. They are retained, counted, checked for title conflicts, and deterministically collapsed to a site median only when the duplicate evidence remains compatible.

## Description quality

Known generic Al's and Wall Tools storefront boilerplate is quarantined from matching evidence. Raw five-column scrape CSVs are preserved; downstream analysis emits cleaned descriptions and description-quality classifications instead of using generic store marketing copy as semantic evidence.

## Discovery rejection vs product failure

`finalize_scrape_outputs.py` separates obvious non-product crawl candidates from true product failures:

```text
<site>/non_product_candidates.jsonl
<site>/product_failures.jsonl
<site>/quality_summary.json
<site>/catalog_quality.jsonl
```

Examples such as `/about-us`, `/brands`, `/privacy-policy`, brand landing pages, and API endpoints no longer need to be interpreted as failed product extractions in quality reporting.

The original `failures.jsonl` remains unchanged as source evidence.

## All-Wall products without MPN

All-Wall MPN strictness is retained. A product without MPN is never assigned the All-Wall store SKU for automatic identity matching.

`finalize_scrape_outputs.py` writes:

```text
all_wall/manual_pricing_evidence.csv
```

Without a network refresh, historical `no_mpn` failures are preserved there as manual-identity candidates. To refresh the public SuiteCommerce catalog and retain title, store SKU, price, description, and URL for MPN-less products **strictly as manual evidence**, run:

```powershell
python run_competitor_pricing_pipeline.py --refresh-all-wall-manual-evidence
```

Those records never enter automatic identity matching.

## Installation

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Scrape

Balanced profile:

```powershell
python competitor_catalog_scraper.py --workers 12 --per-host 6 --request-interval 0.15 --verbose
```

Lighter profile:

```powershell
python competitor_catalog_scraper.py --workers 8 --per-host 4 --request-interval 0.20 --verbose
```

The scraper remains resumable and read-only. All-Wall uses its public SuiteCommerce item endpoint first; Al's and Wall Tools use sitemap-first structured product-page extraction.

## Rebuild all pricing intelligence outputs

After a scrape, run one command:

```powershell
python run_competitor_pricing_pipeline.py
```

This executes, in order:

```text
finalize_scrape_outputs.py
filter_current_dtb_brands.py
create_competitor_price_comparison.py
match_official_catalog_to_competitors.py
create_friendly_match_report.py
```

If refreshed All-Wall manual evidence is needed:

```powershell
python run_competitor_pricing_pipeline.py --refresh-all-wall-manual-evidence
```

## Generated reports

Primary outputs are:

- `current_dtb_brand_competitor_products.csv` — competitor rows belonging to DTB-held brands using independent brand evidence; SKU alone cannot assign brand.
- `current_dtb_brand_filter_summary.csv` — accepted/rejected brand classification telemetry.
- `competitor_price_comparison_by_sku.csv` — compatibility filename; now a **manufacturer-scoped identity comparison**, not a global SKU join.
- `competitor_price_comparison_review.csv` — rows lacking a safe manufacturer-scoped identity.
- `dtb_official_competitor_matches.csv` — full candidate evidence ledger with match method, evidence quality, variation compatibility, contradictions, identity key, and effective DTB price.
- `dtb_official_competitor_best_matches.csv` — compatibility filename; now one **aggregated market-evidence row per DTB product**, not an arbitrary best competitor.
- `dtb_official_competitor_unmatched.csv` — DTB rows with no verified or review candidate evidence.
- `dtb_official_competitor_match_summary.csv` — technical counts by method, status, source, and aggregate market status.
- `competitor_match_reader_view.csv` — business-facing market evidence view.
- `competitor_match_price_gaps.csv` — only products with verified competitor evidence, sorted by absolute DTB-vs-median gap.
- `competitor_match_review_queue.csv` — all review-only contradiction, unknown-brand, cross-brand, and fuzzy candidates.
- `competitor_match_report_summary.md` — plain-language market evidence summary.
- `competitor_match_report.html` — readable market evidence dashboard.

## Tests

```powershell
python -m unittest discover -s tests -v
```

The pricing-intelligence tests cover:

- manufacturer-scoped identity keys;
- cross-brand identifier collision rejection;
- unknown-brand exact identifier review;
- explicit title/identifier contradictions such as exported `CT109` with a title identifying `CT114`;
- dimensional conflict rejection such as `1/2"` vs `1-1/2"`;
- near-identical title matches remaining review-only;
- sale-price precedence for DTB effective price;
- storefront boilerplate quarantine;
- explicit same-site duplicate aggregation by median;
- canonical brand aliases.

## Ownership and safety

This directory is deterministic operational research tooling. It does not become a system of record for products or prices and does not mutate WooCommerce, payments, orders, inventory, fulfillment, accounting, or the canonical catalog.

Competitor pricing outputs are evidence for review. Any future price write must remain inside the system that owns commerce pricing and must have its own authorization, validation, MAP/policy, audit, and approval contract.
