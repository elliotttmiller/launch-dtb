# DTB Competitor Catalog Scraper v6

A local, read-only scraper specialized for these three competitor storefronts:

- Al's Taping Tools — `https://www.alstapingtools.com/`
- Wall Tools — `https://walltools.com/`
- All-Wall — `https://www.all-wall.com/`

The scraper is intentionally narrow. It does **not** perform DTB product matching, pricing recommendations, inventory mutation, WooCommerce writes, or any commerce operation.

## Final CSV contract

Every business-facing CSV contains exactly five columns:

```text
Brand
Product Name
SKU
Product Price
Product Description
```

No URLs, images, crawl metadata, GTINs, MPN columns, timestamps, or endpoint details are written into the business CSV.

The scraper writes:

```text
reports/competitor-catalog/
  als_taping_tools/catalog.csv
  wall_tools/catalog.csv
  all_wall/catalog.csv
  all_competitor_products.csv
```

Internal JSONL/audit files remain under each competitor directory only to support resume, diagnostics, and source provenance.

## Authoritative identifier rules

The output column is always named `SKU`, but the source value is competitor-specific.

### All-Wall

Use the **manufacturer part number / MPN** as the exported SKU.

Example:

```text
Mfr: TapeTech
MPN: 07TT-C
SKU: 14767
```

Exports:

```text
SKU = 07TT-C
```

The All-Wall storefront SKU `14767` is internal store data and is never substituted for the MPN in the final CSV.

### Al's Taping Tools

Use the storefront **SKU exactly as exposed**. No normalization or prefix removal is applied.

### Wall Tools

Use the storefront **SKU**, then strip only explicitly verified store/vendor prefixes.

Current verified rule:

```text
LEV5-12345 -> 12345
DURA-ABC123 -> ABC123
SURP-X100   -> X100
TAPE-07TT   -> 07TT
COLM-TAPER  -> TAPER
```

The verified Wall Tools prefix allowlist is exactly `LEV5-`, `DURA-`, `SURP-`, `TAPE-`, and `COLM-`. Matching is case-insensitive. Unknown prefixes are preserved intact rather than guessed away, which protects legitimate manufacturer SKUs that contain hyphens.

## Extraction strategy

### All-Wall

All-Wall is treated as a SuiteCommerce storefront.

Preferred path:

```text
endpoint audit
  -> /api/cacheable/items
  -> /api/items fallback
  -> paginated item catalog JSON
  -> extract title / manufacturer / MPN / price / description
  -> selectively fetch only product pages missing MPN, brand, or description
```

This avoids downloading thousands of client-rendered product shells when the structured catalog endpoint provides the data in bulk.

### Al's Taping Tools and Wall Tools

These storefronts are processed with a sitemap-first BigCommerce-oriented path:

```text
robots.txt
  -> sitemap discovery
  -> sitemap indexes / product URLs
  -> concurrent product retrieval
  -> JSON-LD first
  -> structured DOM / labeled-field fallback
```

The parser explicitly targets product title, brand, SKU/MPN, price, and description. It does not spend time collecting image URLs or unrelated product metadata.

## Endpoint audit

Each run audits the public endpoint surface before collection and writes:

```text
<site>/endpoint_audit.json
```

This includes only diagnostic data such as endpoint status, final URL, content type, response size/hash, detected storefront signals, configured identifier strategy, and preferred catalog strategy.

Endpoint audit data is **not** added to the final CSV.

## Performance characteristics

The scraper uses:

- `cloudscraper`
- one persistent session per worker thread
- bounded `ThreadPoolExecutor` concurrency
- per-host request spacing
- bounded retries
- incremental JSONL writes
- automatic resume
- SuiteCommerce bulk pagination for All-Wall
- selective All-Wall page enrichment only when required
- gzip sitemap support
- query-preserving sitemap request URLs
- safe support for BigCommerce permanent `*.mybigcommerce.com` sitemap hosts while product crawling remains restricted to the configured storefront domain

Recommended balanced profile:

```powershell
python competitor_catalog_scraper.py --workers 12 --per-host 6 --request-interval 0.15 --verbose
```

For a lighter profile:

```powershell
python competitor_catalog_scraper.py --workers 8 --per-host 4 --request-interval 0.20 --verbose
```

## Installation

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Full run

```powershell
python competitor_catalog_scraper.py --workers 12 --per-host 6 --request-interval 0.15 --verbose
```

Run one competitor:

```powershell
python competitor_catalog_scraper.py --site wall_tools --workers 12 --per-host 6 --request-interval 0.15 --verbose
```

Resume is automatic. A prior record only counts as complete when it still satisfies the site's authoritative identifier rule and contains a title and price. This means older All-Wall records containing only the store SKU, or old price-less rows, are reprocessed.

## Tests

```powershell
python -m unittest discover -s tests -v
```

The test suite covers:

- All-Wall MPN-over-store-SKU semantics
- Al's exact SKU preservation
- Wall Tools normalization for `LEV5-`, `DURA-`, `SURP-`, `TAPE-`, and `COLM-`
- case-insensitive prefix handling
- preservation of unknown Wall Tools prefixes
- JSON-LD extraction
- visible labeled SKU/MPN extraction
- BigCommerce price fallback
- SuiteCommerce pricing
- five-column CSV output
- per-site CSV output
- price-aware / identifier-aware resume
- query-preserving request URL normalization
