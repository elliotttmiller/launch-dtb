# Live Competitor Price Research

The standard operator entrypoint remains:

```powershell
python scripts/catalog/competitor_price_research.py
```

This script is intentionally a small, read-only cloudscraper research utility. It reads the canonical DTB launch catalog, discovers likely matching competitor product URLs, extracts public pricing/product evidence, matches that evidence back to DTB SKUs, and writes market-analysis artifacts. It never changes WooCommerce, catalog pricing, MAP, Veeqo, or QuickBooks.

## Live persistence

The output directory is created immediately when a run starts:

`reports/pricing/competitor-market/`

These files exist from startup and remain usable if the process is interrupted:

- `competitor_scrape_evidence.jsonl`
- `competitor_price_matches.csv`
- `competitor_price_analysis.csv`
- `unmatched_competitor_listings.csv`
- `unmatched_catalog_products.csv`
- `run_summary.json`

After every successfully parsed in-scope competitor product page, normalized evidence is appended and flushed to `competitor_scrape_evidence.jsonl`. The current matches, market analysis, and unmatched reports are then refreshed from the evidence collected so far. `run_summary.json` is atomically replaced and reports `running`, `completed`, `interrupted`, or `failed`.

Pressing `Ctrl+C` therefore preserves the products successfully collected before interruption.

## Throughput

Product-page retrieval is network-I/O bound, so the script uses a bounded `ThreadPoolExecutor` rather than multiprocessing. Each worker receives its own cloudscraper session while all workers share a small per-host request gate.

Defaults:

- `--workers 4`
- `--request-interval 0.35`
- `--timeout 25`
- `--retries 2`
- `--url-prefilter-min-score 38`
- `--uncertain-fallback-cap 50`

The four-worker default is intentionally modest. It gives parallel network utilization without opening an excessive number of connections or creating an uncontrolled burst crawler. The shared host gate spaces request starts even when several workers are ready at once.

For a slower target, reduce concurrency:

```powershell
python scripts/catalog/competitor_price_research.py --workers 2 --request-interval 0.75
```

For a scoped validation run:

```powershell
python scripts/catalog/competitor_price_research.py --sites als_taping_tools --brands TapeTech "Columbia Tools" LEVEL5 SurPro Dura-Stilt Platinum --verbose
```

Do not raise worker counts aggressively. Four workers should be the normal production research setting; six is a reasonable upper diagnostic bound only when the target is responding normally.

## Discovery tuning

The catalog-aware URL prefilter now defaults to 38 instead of 30, and the uncertain fallback pool defaults to 50 instead of 150. This reduces broad retailer crawling while retaining exact SKU/MPN/GTIN hits and strong brand/product-name evidence.

Use the default settings first. Only lower the score threshold or enlarge the fallback pool when the unmatched DTB report demonstrates a real coverage problem.

## Validation

Run both suites before a production research run:

```powershell
python -m unittest scripts/catalog/tests/test_competitor_price_research.py
python -m unittest scripts/catalog/tests/test_competitor_price_streaming.py
```

The test scripts validate behavior only; they do not perform the live competitor crawl or generate production market data.
