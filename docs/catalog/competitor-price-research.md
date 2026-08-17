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

## Active site selection

All three active competitors run by default. A subset can be selected explicitly:

```powershell
python scripts/catalog/competitor_price_research.py --sites als_taping_tools wall_tools --verbose
```

Valid site keys are only:

```text
als_taping_tools
all_wall
wall_tools
```

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

Important research data is written while the crawl is running.

After each successful in-scope product extraction the scraper immediately:

1. appends normalized evidence to `competitor_scrape_evidence.jsonl`;
2. matches only the new listing(s) against the DTB catalog;
3. appends accepted rows to `competitor_price_matches.csv`.

Evidence and match files remain open during the run and are flushed after writes.

Aggregate reports and `run_summary.json` are checkpointed:

- every 100 successful product pages; or
- approximately every 30 seconds while results are arriving;
- at the end of each competitor;
- on normal completion or interruption.

Progress telemetry is emitted every 100 processed candidate URLs.

## Durable resume

Interrupted runs are resumable. Stopping the process with `Ctrl+C` writes the current reports and preserves enough state for the next invocation to continue rather than start over.

Resume state is built from:

- `competitor_scrape_evidence.jsonl` — previously collected normalized listings;
- `competitor_processed_urls.jsonl` — every attempted product URL and its completion state;
- `run_summary.json` — run/site completion metadata and migration support for older checkpoints.

On startup the scraper:

1. reloads prior evidence for the three active competitors;
2. reconstructs rich internal matches from that evidence;
3. rewrites the concise match CSV from the reconstructed deduplicated match set;
4. reloads processed URL identities;
5. skips URLs already attempted;
6. continues with remaining candidate URLs.

`competitor_processed_urls.jsonl` is append-only during a run and is flushed after each processed URL, including unsuccessful requests. This prevents a restart from repeatedly spending time on known 404/499/other failed candidates.

### Compatibility with checkpoints created before processed-URL tracking

Older interrupted runs do not contain `competitor_processed_urls.jsonl`. For those runs, the scraper reads the previous `run_summary.json` and treats a non-empty site as completed when `fetched_urls >= allowed_urls`.

This allows a run that already completed Al's and Wall Tools before interruption to resume without crawling those sites again. Zero-candidate sites are not automatically treated as completed because future discovery changes may make them productive.

Prior evidence from sites outside the active three-site scope is ignored during resume.

To intentionally start a completely fresh research dataset, archive or remove the contents of `reports/pricing/competitor-market/` before running the scraper.

## Windows file locks

A temporary Windows lock on `run_summary.json` or an aggregate CSV must not terminate the crawl. Summary replacement is retried briefly and then skipped with a warning. Locked aggregate report checkpoints are also skipped with a warning while evidence, processed-URL checkpoints, and primary matches continue to be collected.

Avoid opening live output files in applications that take exclusive write locks.

## Discovery

The scraper does not blindly fetch every storefront URL. It:

1. reads configured and advertised sitemaps;
2. recursively follows bounded sitemap indexes;
3. keeps structurally plausible product URLs;
4. scores URLs against the active DTB catalog using identifiers, brand aliases, product-name tokens, and model tokens;
5. keeps relevant candidates plus a small deterministic fallback pool;
6. fetches only selected candidate product pages.

Default discovery controls:

- URL prefilter score: 38;
- uncertain fallback: 50 URLs per competitor;
- maximum product fetches per competitor: 5,000;
- maximum discovered product URLs considered: 50,000;
- maximum sitemap documents: 100.

## Extraction

For fetched product pages extraction currently prefers:

1. Schema.org JSON-LD `Product` / `ProductGroup` data;
2. conservative storefront DOM/meta selectors.

Rich internal evidence contains identifiers, regular/sale/current price, currency, availability, variant, parser source, retrieval timestamp, discovery score/reasons, source URL, and source SHA-256. Raw HTML is not persisted.

## Matching

Competitor listings are matched conservatively:

1. exact normalized GTIN / UPC / EAN;
2. exact normalized MPN / manufacturer SKU;
3. competitor SKU equal to DTB MPN / manufacturer SKU;
4. exact DTB SKU;
5. brand-scoped fuzzy product-name match at the configured threshold.

Cross-brand conflicts and ambiguous fuzzy results remain unmatched.

`matches` means accepted competitor observation rows. One DTB SKU may have multiple observations. `matched_skus` / `matched_catalog_products` is the unique DTB SKU count.

## Primary output

`competitor_price_matches.csv` contains:

```text
dtb_sku,dtb_name,price_delta,dtb_price,competitor_sku,competitor_title,competitor_price,competitor_url
```

`price_delta` is `DTB price - competitor price`:

- positive: DTB is more expensive;
- negative: DTB is cheaper;
- `0.00`: same observed price.

Rich fields such as GTIN, MPN, parser source, match method/score, discovery reasons, timestamps, hashes, availability, and variants remain in internal/evidence data rather than the primary report.

## Other outputs

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
