# Competitor Endpoint Probe

## Purpose

`scripts/catalog/competitor_endpoint_probe.py` is read-only diagnostic tooling used to determine the most efficient public product-data extraction path for each competitor storefront before changing the production price-research scraper.

It does not update the canonical catalog, WooCommerce, Veeqo, QuickBooks, pricing, MAP, inventory, or protected identifiers.

The probe answers three questions per competitor:

1. What network requests does a real product page make in Chromium?
2. Does the storefront expose a smaller structured product endpoint such as Shopify `.js`, JSON, fetch/XHR, or another public API response?
3. Which observed/probed endpoint contains enough product identity and price fields to replace full HTML scraping safely?

## Why a browser observer is used

A normal HTTP client can inspect HTML and static assets, but it cannot see requests initiated by storefront JavaScript after page load. Playwright is used only for this diagnostic because Chromium exposes the actual response stream for document, script, fetch, XHR, JSON, image, and third-party requests.

The production price scraper remains cloudscraper-based. Playwright is not added to its runtime path.

## Install

Use an isolated environment:

```powershell
python -m venv .venv-endpoint-probe
.\.venv-endpoint-probe\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r scripts/catalog/competitor_endpoint_probe.requirements.txt
python -m playwright install chromium
```

## Standard run

```powershell
python scripts/catalog/competitor_endpoint_probe.py
```

The default representative pages cover:

- Al's Taping Tools
- All-Wall
- Wall Tools
- CSR Building Supplies US

Probe only selected sites:

```powershell
python scripts/catalog/competitor_endpoint_probe.py --sites csr_building all_wall
```

Override a representative product page without editing the script:

```powershell
python scripts/catalog/competitor_endpoint_probe.py `
  --url csr_building=https://csrbuilding.com/en-us/collections/columbia/products/columbia-corner-roller-cr
```

Use `--headed` when you want to watch Chromium during diagnosis.

## Output

Default directory:

`reports/pricing/competitor-endpoint-probe/`

### `network_observations.csv`

One row per observed browser response plus the small set of direct GET probes. Fields include:

- site key
- observation source (`browser` or `direct_probe`)
- HTTP method
- browser resource type
- status
- redacted URL
- content type
- content length when known
- same-origin flag
- whether the response parsed as structured JSON
- product-data score
- storefront/platform hint
- direct-probe elapsed time when available

The CSV is intentionally metadata-only. Request bodies and response bodies are not persisted.

### `site_recommendations.csv`

One concise row per competitor with:

- recommended extraction method
- concrete successful endpoint
- reusable endpoint template where identifiable
- product-data score
- content type and response size
- status
- confidence
- fallback recommendation

### `endpoint_probe.json`

Machine-readable summary of the same recommendations plus artifact locations and explicit security assertions.

## Ranking

The probe scores structured payloads by the presence of product-research fields such as:

- title/name
- handle
- vendor/brand
- SKU
- MPN
- barcode/GTIN
- price
- compare-at price
- variants
- availability

Preference order is intentionally simple:

1. Shopify product `.js` when it returns strong product data;
2. observed same-page fetch/XHR structured responses;
3. other successful structured JSON GET responses;
4. existing HTML/JSON-LD extraction as fallback.

A structured endpoint recommendation does not automatically modify `competitor_price_research.py`. It should first be validated across several products from that competitor so endpoint behavior, currency, variants, identifiers, and rate limits are understood.

## CSR market rule

CSR is researched as a US/USD competitor. The probe therefore derives CSR product API candidates only from the `/en-us/products/<handle>` storefront and does not intentionally probe the root Canadian `/products/<handle>` endpoint.

For a CSR collection URL such as:

```text
https://csrbuilding.com/en-us/collections/columbia/products/columbia-corner-roller-cr
```

the direct candidates are based on:

```text
https://csrbuilding.com/en-us/products/columbia-corner-roller-cr.js
https://csrbuilding.com/en-us/products/columbia-corner-roller-cr.json
```

This protects the research workflow from mixing CAD and USD product pricing.

## Security and data handling

The probe operates only against public storefront pages and uses GET requests for its direct endpoint tests.

It does **not** persist:

- cookies
- authorization headers
- request bodies
- response bodies
- browser storage
- tokens or secrets

Common token/signature/key query values are redacted before URLs are written to disk.

Do not extend this tool to authenticate into competitor accounts, bypass access controls, solve CAPTCHAs, or replay private customer/session APIs. The objective is only to identify public product-data interfaces already used by the storefront.

## Interpreting results

A high-confidence structured endpoint is a candidate for a dedicated site adapter in `competitor_price_research.py`. The preferred production pattern is:

```text
site adapter
  -> lightweight structured product GET
  -> validate market/currency + identity + price
  -> normalize Listing
  -> existing catalog matcher
  -> HTML/JSON-LD fallback on endpoint failure
```

Do not force all competitors through one endpoint convention. Shopify `.js` is appropriate where available, while other storefront platforms may expose different public JSON/fetch interfaces or may still be best handled by HTML/JSON-LD.
