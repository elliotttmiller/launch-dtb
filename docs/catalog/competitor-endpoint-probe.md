# Competitor Endpoint Probe

## Purpose

`scripts/catalog/competitor_endpoint_probe.py` is read-only diagnostic tooling that inventories the public JSON, JavaScript product endpoints, fetch/XHR requests, and API-like network structures used by the configured competitor storefronts.

It does not rank endpoints, recommend a preferred extraction method, modify the production price scraper, or update the canonical catalog, WooCommerce, Veeqo, QuickBooks, pricing, MAP, inventory, or protected identifiers.

The probe answers:

1. What network requests does a real public product page make in Chromium?
2. Which responses are fetch/XHR, JSON, parseable JavaScript product payloads, or API-like routes?
3. What reusable endpoint structures/templates exist on each storefront?
4. Do safe product-derived `.js` or `.json` GET endpoints exist?

## Why Chromium is used

A normal HTTP client cannot see requests initiated by storefront JavaScript after page load. Playwright is isolated to this diagnostic so Chromium can observe the real public browser response stream. The production competitor price-research script remains cloudscraper-based.

The probe does not execute authenticated workflows or attempt to bypass access controls.

## Install

```powershell
python -m venv .venv-endpoint-probe
.\.venv-endpoint-probe\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r scripts/catalog/competitor_endpoint_probe.requirements.txt
python -m playwright install chromium
```

## Run

All configured competitors:

```powershell
python scripts/catalog/competitor_endpoint_probe.py
```

Selected sites:

```powershell
python scripts/catalog/competitor_endpoint_probe.py --sites csr_building all_wall
```

Override a representative public product page:

```powershell
python scripts/catalog/competitor_endpoint_probe.py `
  --url csr_building=https://csrbuilding.com/en-us/collections/columbia/products/columbia-corner-roller-cr
```

Use `--headed` to watch Chromium.

## Output

Default directory:

`reports/pricing/competitor-endpoint-probe/`

The probe intentionally exports inventory rather than recommendations.

### `network_observations.csv`

All observed browser responses plus the small direct-probe set. This is the raw network metadata audit.

Fields include:

- site key
- source (`browser` or `direct_probe`)
- method
- resource type
- status
- redacted URL
- content type
- response length when known
- same-origin flag
- whether the body parsed as JSON-compatible structured data
- platform hint
- detected product-related JSON field names
- observed JSON keys
- direct-probe elapsed time

### `structured_endpoints.csv`

A filtered endpoint inventory containing responses that meet at least one of these structural conditions:

- browser `fetch`
- browser `xhr`
- parseable JSON/structured response
- direct `.js` / `.json` product probe
- `.json` URL
- product/API/service/search/recommendation-like route
- structured product `.js` response

This file does **not** imply that any endpoint is authoritative or preferred. It is simply the complete candidate inventory produced by the scan.

### `endpoint_patterns.csv`

Deduplicated reusable endpoint structures. Dynamic product handles, long numeric IDs, UUID-like path segments, and query values are generalized where possible.

Examples:

```text
https://csrbuilding.com/en-us/products/{handle}.js
```

```text
https://www.all-wall.com/api/cacheable/items?country={value}&currency={value}&url={value}
```

Each pattern also reports:

- endpoint kind
- HTTP method
- same-origin status
- observed content types
- observed status codes
- observation sources
- platform hints
- number of observations
- one concrete redacted example URL
- product-related fields seen in structured payloads

There is no ranking or confidence field.

### `endpoint_probe.json`

Machine-readable run summary containing counts and the full endpoint-pattern inventory grouped by site.

It contains no recommendation section.

## Direct product probes

The diagnostic performs only a small bounded set of GET-only product-derived probes.

For a URL containing `/products/<handle>`, it tests:

```text
/products/<handle>.js
/products/<handle>.json
```

For a non-`/products/` page it tests the page URL with `.js` and `.json` suffixes.

These probes are diagnostic only; failures are recorded rather than treated as errors for the overall scan.

## CSR US market rule

CSR research is US/USD scoped. For a page such as:

```text
https://csrbuilding.com/en-us/collections/columbia/products/columbia-corner-roller-cr
```

the explicit direct probes are constrained to:

```text
https://csrbuilding.com/en-us/products/columbia-corner-roller-cr.js
https://csrbuilding.com/en-us/products/columbia-corner-roller-cr.json
```

The browser observation file may still show other requests made by CSR's own page JavaScript. Those are observations, not endorsements. The diagnostic does not rank them or substitute them for the US endpoint.

## Endpoint pattern interpretation

The probe deliberately separates discovery from architectural decisions.

A finding such as:

```text
/api/cacheable/items?... 
```

means only that the public storefront used or exposed that network structure during the observed page load.

A finding such as:

```text
/recommend/...
```

is still retained because it is a real endpoint, even if it belongs to a recommendation/search provider rather than the authoritative product catalog.

This is intentional. The purpose of the diagnostic is to expose **all relevant JSON/JS/API/fetch structures**, not decide which one should be used by production code.

## Security and data handling

The probe operates against public storefront pages and uses GET requests for direct endpoint tests.

It does not persist:

- cookies
- authorization headers
- request bodies
- response bodies
- browser storage
- tokens or secrets

Potentially sensitive query values are redacted before URLs are written to disk.

Do not extend this tool to authenticate into competitor accounts, bypass access controls, solve CAPTCHAs, or replay private customer/session APIs.

## Ownership

This tool belongs in `scripts/catalog/` as deterministic operational research tooling. It discovers public endpoint structures only. Any subsequent production scraper change must be separately validated for identity, currency, pricing semantics, variants, availability, rate limits, and fallback behavior before becoming an extraction contract.
