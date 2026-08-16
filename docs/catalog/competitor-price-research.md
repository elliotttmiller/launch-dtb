# Competitor Price Research

## Purpose

`scripts/catalog/competitor_price_research.py` is read-only operational tooling for market-price research against the canonical DTB launch catalog.

It currently targets:

- Al's Taping Tools — `https://www.alstapingtools.com/`
- All-Wall — `https://www.all-wall.com/`
- Wall Tools — `https://walltools.com/`
- CSR Building Supplies US storefront — `https://csrbuilding.com/en-us`

The script does **not** update WooCommerce, Veeqo, QuickBooks, product identifiers, MAP data, or `products/launch/official/dtb_official_catalog.csv`.

## Source of truth

The input catalog defaults to:

`products/launch/official/dtb_official_catalog.csv`

Before a production research run, validate that file with the existing canonical validator:

```powershell
python scripts/catalog/validate_official_catalog.py
```

The scraper derives its product/brand scope from priced, published catalog rows. Variable parents without a price are naturally excluded; priced simple products and variations are analyzed independently.

## Installation

Use an isolated Python virtual environment.

```powershell
python -m venv .venv-market
.\.venv-market\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r scripts/catalog/competitor_price_research.requirements.txt
```

## Standard run

```powershell
python scripts/catalog/validate_official_catalog.py
python scripts/catalog/competitor_price_research.py
```

Default output directory:

`reports/pricing/competitor-market/`

The default crawl interval is 1.25 seconds per host, with bounded retries and robots.txt enforcement.

## Scoped runs

Limit research to specific DTB brands:

```powershell
python scripts/catalog/competitor_price_research.py --brands TapeTech "Columbia Tools" LEVEL5 SurPro
```

Limit research to selected competitor adapters:

```powershell
python scripts/catalog/competitor_price_research.py --sites wall_tools csr_building
```

Useful diagnostic run:

```powershell
python scripts/catalog/competitor_price_research.py `
  --sites csr_building `
  --brands LEVEL5 TapeTech Columbia `
  --max-urls-per-site 1000 `
  --verbose
```

## Collection architecture

The scraper uses `cloudscraper` for standard HTTP requests but does not authenticate, use proxies, solve CAPTCHAs, or attempt to defeat login/paywall controls.

For each target storefront it:

1. Loads advertised sitemaps from `robots.txt` plus platform-specific sitemap candidates.
2. Recursively follows bounded sitemap indexes.
3. Filters to plausible product URLs for that platform.
4. Fetches public product pages with per-host throttling.
5. Extracts structured product facts in this precedence order:
   - Schema.org JSON-LD (`Product` / `ProductGroup` / offers)
   - Shopify embedded product/variant JSON for CSR
   - bounded DOM/meta fallbacks for BigCommerce/Magento/theme variants
6. Rejects listings outside the DTB brand scope.
7. Deduplicates structured evidence by site, URL, identifier, variant, and current price.

Every accepted evidence row includes `retrieved_at`, `parse_method`, the source URL, and a SHA-256 hash of the fetched HTML. Raw HTML is intentionally not persisted.

## Matching contract

Competitor records are matched to DTB catalog rows conservatively:

1. Exact normalized GTIN / UPC / EAN
2. Exact normalized MPN / manufacturer SKU
3. Competitor SKU equal to DTB MPN / manufacturer SKU
4. Exact normalized DTB SKU
5. Brand-scoped name matching only when the RapidFuzz score is at least 91 by default and the best candidate is clearly separated from the runner-up

A fuzzy match never wins across conflicting brands. Ambiguous results are written to the unmatched report instead of being silently accepted.

Use `--fuzzy-threshold` only when reviewing the resulting evidence manually. Lowering it increases false-positive risk.

## Output files

### `competitor_price_analysis.csv`

One row per analyzed DTB SKU. Includes:

- DTB current selling price
- DTB MAP price when present
- accepted competitor observation count
- distinct competitor-site count
- market low / high / mean / median
- market spread percentage
- DTB delta from market median
- market-position classification
- MAP-floor status
- lowest observed competitor and evidence URL

`market_position` is an analysis label, not an automatic pricing recommendation:

- `no_market_data`
- `single_source_only`
- `below_market_median`
- `market_aligned`
- `above_market_median`

The aligned band is ±5% of the accepted multi-source market median.

### `competitor_price_matches.csv`

Long-form accepted matches. This is the primary review file when validating identity and price evidence.

It includes the match method and confidence score together with both DTB and competitor identifiers.

### `competitor_scrape_evidence.jsonl`

Normalized public facts collected from competitor pages before catalog matching. Useful for reproducing or auditing parser/matcher decisions.

### `unmatched_competitor_listings.csv`

Listings collected for an in-scope brand but not matched safely to one DTB catalog row.

These should be reviewed before relaxing matching rules.

### `unmatched_catalog_products.csv`

Priced DTB catalog rows for which no competitor listing was safely matched.

A missing match does not mean a competitor does not sell the product; it means the current run did not produce sufficiently strong public evidence.

### `run_summary.json`

Machine-readable run configuration, crawl counts, error counts, match counts, and output paths.

## Price semantics

DTB current price is `Sale price` when a positive sale price is present; otherwise `Regular price`.

Competitor current price prefers an observed sale price when the source exposes both regular and sale prices. JSON-LD aggregate offers preserve low/high values when available.

Only USD observations are included in market aggregates. Non-USD evidence remains reviewable in the long-form evidence/match artifacts but is not mixed into USD statistics without an explicit FX conversion layer.

No currency-conversion authority is implemented by this script.

## MAP

`Meta: _dtb_map_price` remains canonical DTB catalog data. The script reports whether the current DTB selling price is below the configured MAP floor, but it does not change price or MAP.

Competitor prices below a DTB MAP floor are market evidence only. They must not be treated as authorization to violate a manufacturer pricing agreement.

## Crawl controls

Important options:

- `--request-interval` — minimum seconds between requests to the same host
- `--timeout` — request timeout
- `--retries` — bounded retries for transient HTTP errors
- `--max-urls-per-site` — hard safety cap per competitor
- `--max-sitemap-documents` — hard sitemap-recursion cap
- `--fuzzy-threshold` — minimum brand-scoped fuzzy match confidence
- `--ignore-robots` — disables robots.txt checks and should only be used after confirming permission/terms for the target

A target site can change markup, sitemap routes, anti-bot configuration, or pricing presentation at any time. A parser failure is therefore surfaced in run statistics rather than converted into guessed pricing.

## Ownership and downstream use

This tool belongs in `scripts/catalog/` because it performs deterministic operational market research.

It is not an application service and must not become an alternate authority for:

- WooCommerce product prices
- sale schedules
- cost
- MAP
- SKU / MPN / GTIN
- Veeqo inventory
- fulfillment
- QuickBooks accounting

Any later pricing change must go through the catalog/WooCommerce pricing workflow with explicit review and identifier validation.
