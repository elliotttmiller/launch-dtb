# Competitor Price Research

## Purpose

`scripts/catalog/competitor_price_research.py` is read-only operational tooling for competitor market-price research against the canonical DTB launch catalog.

Targets:

- Al's Taping Tools — `https://www.alstapingtools.com/`
- All-Wall — `https://www.all-wall.com/`
- Wall Tools — `https://walltools.com/`
- CSR Building Supplies US — `https://csrbuilding.com/en-us`

It never updates WooCommerce, Veeqo, QuickBooks, MAP, protected identifiers, or `products/launch/official/dtb_official_catalog.csv`.

## Source of truth

Input defaults to:

`products/launch/official/dtb_official_catalog.csv`

Validate before a pricing-research run:

```powershell
python scripts/catalog/validate_official_catalog.py
```

The catalog supplies DTB product identity, brand, SKU/MPN/GTIN, and DTB selling price. Competitor data is research evidence only.

## Install

```powershell
python -m venv .venv-market
.\.venv-market\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r scripts/catalog/competitor_price_research.requirements.txt
```

## Validation

```powershell
python -m unittest scripts/catalog/tests/test_competitor_price_research.py
python -m unittest scripts/catalog/tests/test_competitor_price_streaming.py
```

## Standard run

```powershell
python scripts/catalog/competitor_price_research.py --verbose
```

Default output directory:

`reports/pricing/competitor-market/`

## Throughput model

The scraper is network-I/O bound, so it uses a small bounded `ThreadPoolExecutor` rather than multiprocessing.

Production defaults:

- 8 concurrent product-page workers per competitor;
- one persistent `cloudscraper` session per worker thread;
- minimum 0.20 seconds between request starts to the same host;
- 20 second request timeout;
- 2 bounded retries for transient HTTP/network failures;
- maximum 16 workers accepted by the CLI.

The shared host gate means additional workers overlap network latency but do not create an uncontrolled burst of requests. The default 0.20-second interval caps request starts at approximately five per second per competitor host.

If a target becomes unstable or starts returning 403/429 responses, reduce concurrency or increase the interval rather than increasing retries.

Example conservative run:

```powershell
python scripts/catalog/competitor_price_research.py --workers 4 --request-interval 0.35
```

Example faster local diagnostic run:

```powershell
python scripts/catalog/competitor_price_research.py --workers 10 --request-interval 0.20
```

Do not exceed 16 workers through this script.

## Live persistence

The scraper does not wait for the complete crawl before saving results.

After every successful in-scope product extraction it immediately:

1. appends normalized scrape evidence to `competitor_scrape_evidence.jsonl`;
2. matches only the newly scraped listing(s) against the DTB catalog;
3. appends new accepted product-vs-product matches to `competitor_price_matches.csv`;
4. updates `run_summary.json`.

The expensive aggregate reports are rebuilt only at lightweight checkpoints: every 50 successful product pages, after roughly 10 seconds when results are flowing more slowly, at the end of each competitor, and on normal/interrupted exit.

This avoids the previous performance problem where every successful page rematched all accumulated listings and rewrote every report from scratch.

If the process is interrupted with `Ctrl+C`, evidence and primary matches already written remain usable and the aggregate reports are checkpointed before exit.

## Discovery

The scraper does not blindly fetch every storefront URL. It:

1. reads configured/advertised sitemaps;
2. recursively follows bounded sitemap indexes;
3. keeps structurally plausible product URLs;
4. scores URLs against the active DTB catalog using protected identifiers, brand aliases, and meaningful product-name/model tokens;
5. keeps high-confidence candidates plus a small deterministic fallback pool;
6. fetches only the selected product pages.

Default discovery controls:

- URL prefilter score: 38;
- uncertain fallback: 50 URLs per competitor;
- maximum product fetches per competitor: 5,000;
- maximum discovered product URLs considered: 50,000;
- maximum sitemap documents: 100.

## Extraction

For each fetched product page extraction prefers:

1. Schema.org JSON-LD `Product` / `ProductGroup` data;
2. Shopify embedded product/variant JSON for CSR;
3. conservative storefront DOM/meta selectors.

Rich internal listing evidence includes identifiers, regular/sale/current price, currency, availability, variant, parser source, retrieval timestamp, discovery score/reasons, source URL, and an HTML SHA-256 hash. Raw HTML is not persisted.

## Matching

Competitor listings are matched conservatively:

1. exact normalized GTIN / UPC / EAN;
2. exact normalized MPN / manufacturer SKU;
3. competitor SKU equal to DTB MPN / manufacturer SKU;
4. exact DTB SKU;
5. brand-scoped fuzzy product-name match at the configured confidence threshold.

Cross-brand conflicts and ambiguous fuzzy results remain unmatched.

## Primary output

### `competitor_price_matches.csv`

This is the concise human-facing product-vs-product pricing report.

Exact columns:

```text
dtb_sku,dtb_name,price_delta,dtb_price,competitor_sku,competitor_title,competitor_price,competitor_url
```

`price_delta` is:

```text
DTB price - competitor price
```

Therefore:

- positive: DTB is more expensive;
- negative: DTB is cheaper;
- `0.00`: same observed price.

Rich fields such as GTIN, MPN, parser source, match method/score, discovery reasons, timestamps, hashes, availability, and variants remain internal/evidence data and are intentionally excluded from this primary report.

## Aggregate output

### `competitor_price_analysis.csv`

One row per analyzed DTB SKU with market-level statistics including competitor count, site count, market low/high/mean/median, market spread, DTB-vs-market-median, market position, MAP status, and lowest observed competitor.

This is analysis only and never reprices the catalog automatically.

## Diagnostic outputs

### `competitor_scrape_evidence.jsonl`

Normalized scraped facts and provenance before/alongside catalog matching. This is the detailed audit trail when a match or price needs investigation.

### `unmatched_competitor_listings.csv`

In-scope competitor products that could not be mapped safely to one DTB catalog product.

### `unmatched_catalog_products.csv`

DTB catalog products with no accepted competitor match in the current run.

### `run_summary.json`

Live run status, configuration, product/listing/match counts, crawl statistics, and artifact paths.

## HTTP behavior

Permanent HTTP failures such as ordinary 404 responses fail immediately. Transient 403/408/425/429 and selected 5xx responses use bounded retries. `Retry-After` is honored when available. Network/TLS/timeout failures use bounded retries.

robots.txt is honored by default. `--ignore-robots` exists only for cases where permission/terms have been independently verified.

## Useful scoped runs

Al's only:

```powershell
python scripts/catalog/competitor_price_research.py --sites als_taping_tools --verbose
```

Selected brands:

```powershell
python scripts/catalog/competitor_price_research.py --brands TapeTech "Columbia Tools" LEVEL5 SurPro Dura-Stilt Platinum --verbose
```

Selected competitors:

```powershell
python scripts/catalog/competitor_price_research.py --sites wall_tools csr_building --verbose
```

## Ownership

This tool belongs in `scripts/catalog/` as deterministic operational research tooling. It is not an application service and must not become an alternate authority for WooCommerce pricing, MAP, protected product identifiers, inventory, fulfillment, or accounting.
