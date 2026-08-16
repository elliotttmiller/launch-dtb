# Competitor Price Research

## Purpose

`scripts/catalog/competitor_price_research.py` is read-only operational tooling for market-price research against the canonical DTB launch catalog.

It targets:

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

The scraper derives its product, identifier, brand, and pricing scope from priced, published catalog rows. Product identifiers remain catalog-owned and are used only for matching and discovery relevance.

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
python -m unittest scripts/catalog/tests/test_competitor_price_research.py
python scripts/catalog/competitor_price_research.py
```

Default output directory:

`reports/pricing/competitor-market/`

The default request interval is 1.25 seconds per host, with bounded retries and robots.txt enforcement.

## Optimized discovery architecture

The scraper does **not** blindly fetch every product URL exposed by a competitor sitemap.

Collection is split into two phases:

1. **Cheap sitemap discovery** — retrieve sitemap documents and collect structurally valid product URLs.
2. **Catalog-aware prefetch scoring** — compare the URL itself with canonical DTB product evidence before issuing a product-page request.

The discovery index is built from the active DTB catalog scope and includes:

- normalized GTIN / UPC / EAN values;
- normalized MPN values;
- manufacturer SKU values;
- DTB SKUs;
- normalized brand aliases;
- meaningful product-name tokens;
- canonical product slug tokens.

URL scoring uses high-recall signals:

- exact protected-identifier occurrence — dominant signal;
- in-scope brand occurrence;
- two or more meaningful product-name/slug tokens;
- model-like URL tokens as supporting evidence only.

An unrelated root-level retailer product with no catalog signal is rejected before fetch. This is especially important for BigCommerce storefronts such as Al's Taping Tools and Wall Tools, where thousands of products can live at root-level slugs.

### Bounded uncertain fallback

URL prefiltering is intentionally not a hard exact-match gate. Some legitimate competitor product URLs may omit brand or manufacturer identifiers.

The script therefore retains a deterministic bounded fallback pool controlled by:

`--uncertain-fallback-cap`

The default is 150 URLs per site. Weak-signal URLs are preferred before zero-signal URLs.

This preserves recall without reverting to an unbounded full-site crawl.

### Discovery telemetry

Each site's run statistics expose:

- `sitemaps_attempted`
- `sitemap_failures`
- `sitemap_product_urls`
- `url_prefilter_matched`
- `url_prefilter_fallback`
- `url_prefilter_rejected`
- `identifier_url_hits`
- `brand_url_hits`
- `name_url_hits`
- `candidate_urls`
- `fetched_urls`
- `product_pages`
- `listings`
- `errors`
- `robots_skips`

Expected log shape:

```text
INFO discovery_filter site=als_taping_tools sitemap_product_urls=3247 relevant=... rejected=... fallback=... id_hits=... brand_hits=... name_hits=...
INFO site_start key=als_taping_tools candidates=... discovered=3247 prefilter_rejected=... fallback=...
```

The important distinction is:

`discovered URLs != fetched product pages != accepted listings != matched DTB SKUs`

Those stages must remain independently observable.

## HTTP retry policy

Permanent HTTP failures are never retried.

The effective policy is:

- `2xx` / `3xx` — accept normal response behavior;
- `400`, `401`, `404`, and other non-transient `4xx` — fail immediately;
- `403`, `408`, `425`, `429` — bounded retry;
- `500`, `502`, `503`, `504` — bounded retry;
- network / timeout / TLS failures — bounded retry.

`Retry-After` is honored when it can be parsed. Otherwise exponential delays are bounded.

This means a missing fallback sitemap such as `/sitemap.xml` produces one failure and discovery immediately continues to the next advertised/configured sitemap. A permanent 404 no longer burns the full retry schedule.

The final run summary includes HTTP counters:

- total requests;
- retries;
- transient HTTP retries;
- network retries;
- permanent HTTP failures.

## Scoped runs

Limit research to specific DTB brands:

```powershell
python scripts/catalog/competitor_price_research.py --brands TapeTech "Columbia Tools" LEVEL5 SurPro
```

Because the catalog scope now drives discovery scoring, `--brands` reduces both the matching scope **and** the URL prefetch relevance index.

Limit research to selected competitor adapters:

```powershell
python scripts/catalog/competitor_price_research.py --sites wall_tools csr_building
```

Useful Al's diagnostic run:

```powershell
python scripts/catalog/competitor_price_research.py `
  --sites als_taping_tools `
  --brands TapeTech "Columbia Tools" LEVEL5 SurPro Dura-Stilt Platinum `
  --max-urls-per-site 1000 `
  --verbose
```

Useful CSR diagnostic run:

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
3. Filters to structurally plausible product URLs for that platform.
4. Scores those URLs against the actual DTB catalog scope.
5. Keeps high-confidence URLs plus the bounded fallback pool.
6. Fetches public product pages with per-host throttling.
7. Extracts structured product facts in this precedence order:
   - Schema.org JSON-LD (`Product` / `ProductGroup` / offers)
   - Shopify embedded product/variant JSON for CSR
   - bounded DOM/meta fallbacks for BigCommerce/Magento/theme variants
8. Rejects listings outside the DTB brand scope.
9. Deduplicates structured evidence by site, URL, identifier, variant, and current price.

Every accepted evidence row includes `retrieved_at`, `parse_method`, source URL, SHA-256 hash of the fetched HTML, discovery relevance score, and discovery reason summary. Raw HTML is intentionally not persisted.

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

Machine-readable run configuration, discovery counts, crawl counts, HTTP retry counters, match counts, and output paths.

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

- `--request-interval` — minimum seconds between requests to the same host;
- `--timeout` — request timeout;
- `--retries` — bounded retry count for transient HTTP/network failures;
- `--max-urls-per-site` — hard cap on product pages actually fetched;
- `--max-discovered-urls-per-site` — hard cap on sitemap product URLs considered before prefiltering;
- `--max-sitemap-documents` — hard sitemap-recursion cap;
- `--url-prefilter-min-score` — minimum catalog-relevance score required for the primary fetch set;
- `--uncertain-fallback-cap` — bounded per-site fallback pool for weak/zero-signal product URLs;
- `--fuzzy-threshold` — minimum brand-scoped post-fetch fuzzy match confidence;
- `--ignore-robots` — disables robots.txt checks and should only be used after confirming permission/terms for the target.

A target site can change markup, sitemap routes, anti-bot configuration, or pricing presentation at any time. A parser failure is surfaced in run statistics rather than converted into guessed pricing.

## Validation

Before using the reports for a pricing decision:

```powershell
python scripts/catalog/validate_official_catalog.py
python -m unittest scripts/catalog/tests/test_competitor_price_research.py
```

The regression suite covers:

- URL sitemap parsing;
- sitemap-index parsing;
- Product JSON-LD extraction;
- Shopify variant/cents parsing;
- GTIN match precedence;
- conflicting-brand rejection;
- permanent 404 no-retry behavior;
- transient HTTP retry/recovery behavior;
- protected-identifier URL discovery;
- brand/name URL discovery;
- unrelated product rejection;
- brand normalization;
- tracking-parameter removal.

Because competitor HTML and HTTP behavior are external runtime dependencies, passing unit tests is necessary but not sufficient. After pulling the branch, run one scoped live adapter test first and review `discovery_filter`, `site_done`, and `run_summary.json` before launching the all-site crawl.

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
