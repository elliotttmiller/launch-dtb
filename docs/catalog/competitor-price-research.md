# Competitor Price Research

## Purpose

`scripts/catalog/competitor_price_research.py` is read-only operational tooling for competitor market-price research against the canonical DTB launch catalog.

Production research scope is intentionally limited to:

- Al's Taping Tools — `https://www.alstapingtools.com/`
- All-Wall — `https://www.all-wall.com/`
- Wall Tools — `https://walltools.com/`

CSR Building Supplies is not part of the active research workflow and cannot be selected through `--sites`.

The tool never updates WooCommerce, Veeqo, QuickBooks, MAP, protected identifiers, or `products/launch/official/dtb_official_catalog.csv`.

## Source of truth

Input defaults to `products/launch/official/dtb_official_catalog.csv`. The catalog supplies DTB product identity, brand, SKU/MPN/GTIN, and DTB selling price. Competitor data is research evidence only.

Validate the catalog before a research run:

```powershell
python scripts/catalog/validate_official_catalog.py
```

## Install and validation

```powershell
python -m venv .venv-market
.\.venv-market\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r scripts/catalog/competitor_price_research.requirements.txt
python -m unittest scripts/catalog/tests/test_competitor_price_research.py
python -m unittest scripts/catalog/tests/test_competitor_price_streaming.py
```

## Standard run

```powershell
python scripts/catalog/competitor_price_research.py --verbose
```

Default output directory: `reports/pricing/competitor-market/`.

All three active competitors run by default. A subset can be selected explicitly:

```powershell
python scripts/catalog/competitor_price_research.py --sites als_taping_tools wall_tools --verbose
```

Valid site keys are only `als_taping_tools`, `all_wall`, and `wall_tools`.

## Throughput model

The scraper is network-I/O bound and uses a bounded `ThreadPoolExecutor` rather than multiprocessing.

Defaults:

- 10 concurrent product-page workers for the active competitor;
- one persistent `cloudscraper` session per worker thread;
- minimum 0.20 seconds between request starts to the same host;
- 20 second request timeout;
- 2 bounded retries for transient HTTP/network failures;
- maximum 16 workers accepted by the CLI.

Competitor sites are processed sequentially. Multi-site parallel crawling is intentionally not enabled because the single-site executor already overlaps network latency while keeping persistence and rate ownership simple.

## Streaming persistence

After each successful in-scope product extraction the scraper immediately appends normalized evidence to `competitor_scrape_evidence.jsonl`, matches only the new listing(s), and appends accepted rows to `competitor_price_matches.csv`.

Every attempted product URL is also appended to `competitor_processed_urls.jsonl` and flushed immediately. Successful products, non-product pages, and failed requests are all checkpointed so a restart does not repeat work unnecessarily.

Aggregate reports and `run_summary.json` are checkpointed every 100 successful product pages, approximately every 30 seconds while results are arriving, at the end of each competitor, and on normal completion or interruption. Progress telemetry is emitted every 100 processed candidate URLs.

## Durable resume

On startup the scraper loads resume state before opening any research artifact for writing. It:

1. reads the previous `run_summary.json`;
2. reloads valid evidence for the three active competitors;
3. reloads processed URL identities;
4. reconstructs internal matches from restored evidence;
5. rewrites the concise match CSV from that deduplicated state;
6. skips already attempted URLs and continues remaining work.

### Legacy checkpoint safety

Older checkpoints created before `competitor_processed_urls.jsonl` can identify a site whose crawl reached `fetched_urls >= allowed_urls`. That summary metadata is not sufficient by itself to restore pricing data.

A legacy completed-site marker is therefore honored only when evidence for that site was also successfully restored from `competitor_scrape_evidence.jsonl`. If the summary says a site completed but its evidence is missing or empty, the marker is invalidated and the site is rerun. The log reports:

```text
legacy_resume_invalidated site=<site> reason=completed_summary_without_restored_evidence rerun_required=true
```

This prevents a completed-site flag from producing a false zero-listing/zero-match result after evidence was lost or truncated.

For runs created by the current implementation, `competitor_processed_urls.jsonl` provides URL-level resume and does not depend on legacy site-completion inference.

Prior evidence from sites outside the active three-site scope is ignored.

To intentionally start a completely fresh research dataset, archive or remove the contents of `reports/pricing/competitor-market/` before running the scraper.

## Windows file locks

A temporary Windows lock on `run_summary.json` or an aggregate CSV must not terminate the crawl. Summary replacement is retried briefly and then skipped with a warning. Locked aggregate checkpoints are also skipped while evidence, processed-URL checkpoints, and primary matches continue to be collected.

Avoid opening live output files in applications that take exclusive write locks.

## Discovery

The scraper reads configured and advertised sitemaps, follows bounded sitemap indexes, keeps structurally plausible product URLs, scores URLs against the active DTB catalog, retains relevant candidates plus a small deterministic fallback pool, and fetches only selected candidates.

Default discovery controls:

- URL prefilter score: 38;
- uncertain fallback: 50 URLs per competitor;
- maximum product fetches per competitor: 5,000;
- maximum discovered product URLs considered: 50,000;
- maximum sitemap documents: 100.

### All-Wall product URLs

All-Wall's current sitemap publishes product pages as root-level slugs such as:

```text
https://www.all-wall.com/TapeTech-EasyClean-Automatic-Taper
```

They do not require a `.html` suffix. The production entrypoint therefore removes the stale `.html` product-path constraint for All-Wall while retaining the shared catalog-aware relevance scoring and bounded fallback behavior.

## Extraction

For fetched product pages extraction currently prefers Schema.org JSON-LD `Product` / `ProductGroup` data and then conservative storefront DOM/meta selectors.

Rich internal evidence contains identifiers, regular/sale/current price, currency, availability, variant, parser source, retrieval timestamp, discovery score/reasons, source URL, and source SHA-256. Raw HTML is not persisted.

## Matching

Competitor listings are matched conservatively in this order:

1. exact normalized GTIN / UPC / EAN;
2. exact normalized MPN / manufacturer SKU;
3. competitor SKU equal to DTB MPN / manufacturer SKU;
4. exact DTB SKU;
5. brand-scoped fuzzy product-name match at the configured threshold.

Cross-brand conflicts and ambiguous fuzzy results remain unmatched.

`matches` means accepted competitor observation rows. One DTB SKU may have multiple observations. `matched_skus` / `matched_catalog_products` is the unique DTB SKU count.

## Outputs

`competitor_price_matches.csv` contains:

```text
dtb_sku,dtb_name,price_delta,dtb_price,competitor_sku,competitor_title,competitor_price,competitor_url
```

`price_delta` is `DTB price - competitor price`: positive means DTB is more expensive, negative means DTB is cheaper, and `0.00` means the observed prices are equal.

Other artifacts are:

- `competitor_price_analysis.csv` — aggregate market statistics per DTB SKU;
- `competitor_scrape_evidence.jsonl` — normalized competitor evidence;
- `competitor_processed_urls.jsonl` — durable per-URL resume checkpoint;
- `unmatched_competitor_listings.csv` — competitor listings not safely mapped to one DTB SKU;
- `unmatched_catalog_products.csv` — DTB SKUs with no accepted competitor observation;
- `run_summary.json` — checkpointed run status, configuration, counts, crawl statistics, resume state, and artifact paths.

## HTTP behavior

Permanent HTTP failures such as ordinary 404 responses fail immediately. Transient 403/408/425/429 and selected 5xx responses use bounded retries. `Retry-After` is honored when available. Network/TLS/timeout failures use bounded retries.

robots.txt is honored by default. `--ignore-robots` exists only for cases where permission and terms have been independently verified.

## Ownership

This tool belongs in `scripts/catalog/` as deterministic operational research tooling. It is not an application service and must not become an alternate authority for WooCommerce pricing, MAP, protected product identifiers, inventory, fulfillment, or accounting.
