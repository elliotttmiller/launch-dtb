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

The scraper is network-I/O bound, so it uses a bounded `ThreadPoolExecutor` rather than multiprocessing.

Production defaults:

- 10 concurrent product-page workers for the active competitor;
- one persistent `cloudscraper` session per worker thread;
- minimum 0.20 seconds between request starts to the same host;
- 20 second request timeout;
- 2 bounded retries for transient HTTP/network failures;
- maximum 16 workers accepted by the CLI.

The shared host gate lets workers overlap network latency without creating an uncontrolled burst. The default 0.20-second interval caps request starts at approximately five per second to one competitor host.

Competitor sites are processed sequentially. Multi-site parallel crawling is intentionally not enabled because the current simpler single-site executor already provides bounded concurrency and keeps persistence/state ownership straightforward.

If a target becomes unstable or starts returning 403/429 responses, reduce concurrency or increase the interval instead of increasing retries.

## Hot-path persistence

The scraper does not wait for the complete crawl before saving important research data.

After every successful in-scope product extraction it immediately:

1. appends normalized scrape evidence to `competitor_scrape_evidence.jsonl`;
2. matches only the newly scraped listing(s) against the DTB catalog;
3. appends new accepted product-vs-product matches to `competitor_price_matches.csv`.

The evidence and primary match files stay open for the lifetime of the run and are flushed after successful writes. This avoids repeated Windows open/close overhead while preserving live durability.

`run_summary.json` and the aggregate CSV reports are not rewritten after every product. They are checkpointed:

- every 100 successful product pages; or
- after approximately 30 seconds when successful results are arriving more slowly;
- at the end of each competitor;
- on normal completion or interruption.

Progress telemetry is emitted every 100 processed candidate URLs and includes both total accepted match observations and unique matched DTB SKUs.

This is deliberately less frequent than the previous 50-page / 10-second checkpoint behavior. Fewer aggregate rewrites reduce disk and CPU overhead; they do not affect immediate evidence and primary-match persistence.

### Windows file locks

Diagnostic/aggregate report locks must not terminate the crawl. If Windows temporarily locks `run_summary.json`, replacement is retried briefly and then skipped with a warning. Aggregate CSV checkpoint writes that are locked are also skipped with a warning. The scraper continues collecting evidence and primary matches.

Avoid opening live output files in applications that take exclusive write locks during a run.

## Discovery

The scraper does not blindly fetch every storefront URL. It:

1. reads configured/advertised sitemaps;
2. recursively follows bounded sitemap indexes;
3. keeps structurally plausible product URLs;
4. scores URLs against the active DTB catalog using protected identifiers, brand aliases, and meaningful product-name/model tokens;
5. keeps high-confidence candidates plus a small deterministic fallback pool;
6. fetches only selected product pages.

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

The current BeautifulSoup parser remains unchanged. Parser replacement with `lxml` should be benchmarked before adding another runtime dependency because network latency and filesystem churn are currently the larger measured architectural bottlenecks.

## Matching

Competitor listings are matched conservatively:

1. exact normalized GTIN / UPC / EAN;
2. exact normalized MPN / manufacturer SKU;
3. competitor SKU equal to DTB MPN / manufacturer SKU;
4. exact DTB SKU;
5. brand-scoped fuzzy product-name match at the configured confidence threshold.

Cross-brand conflicts and ambiguous fuzzy results remain unmatched.

`matches` means accepted competitor observation rows. One DTB SKU may have multiple observations from different competitor pages/sites. `matched_skus` / `matched_catalog_products` is the unique DTB SKU count.

## Primary output

### `competitor_price_matches.csv`

Concise product-vs-product pricing report:

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

Normalized scraped facts and provenance before/alongside catalog matching.

### `unmatched_competitor_listings.csv`

In-scope competitor products that could not be mapped safely to one DTB catalog product.

### `unmatched_catalog_products.csv`

DTB catalog products with no accepted competitor match in the current run.

### `run_summary.json`

Checkpointed run status, configuration, product/listing/match counts, crawl statistics, and artifact paths.

## HTTP behavior

Permanent HTTP failures such as ordinary 404 responses fail immediately. Transient 403/408/425/429 and selected 5xx responses use bounded retries. `Retry-After` is honored when available. Network/TLS/timeout failures use bounded retries.

robots.txt is honored by default. `--ignore-robots` exists only for cases where permission/terms have been independently verified.

## Useful runs

Al's only:

```powershell
python scripts/catalog/competitor_price_research.py --sites als_taping_tools --verbose
```

Selected brands:

```powershell
python scripts/catalog/competitor_price_research.py --brands TapeTech "Columbia Tools" LEVEL5 SurPro Dura-Stilt Platinum --verbose
```

If a local machine and target site remain stable, a bounded diagnostic can test 12 workers:

```powershell
python scripts/catalog/competitor_price_research.py --workers 12 --request-interval 0.20 --verbose
```

Do not exceed 16 workers through this script.

## Ownership

This tool belongs in `scripts/catalog/` as deterministic operational research tooling. It is not an application service and must not become an alternate authority for WooCommerce pricing, MAP, protected product identifiers, inventory, fulfillment, or accounting.
