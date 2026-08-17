# Competitor Endpoint Probe

## Purpose

`scripts/catalog/competitor_endpoint_probe.py` is the final read-only diagnostic used before integrating structured competitor fetching into `competitor_price_research.py`.

It inventories public commerce JSON, JavaScript product payloads, fetch/XHR requests, storefront APIs, and reusable endpoint structures. It does not rank endpoints or choose a preferred production adapter.

The probe is intentionally complete enough that the next step after one clean run is implementation in the production research scraper, not another probe redesign.

## Scope

The probe:

1. opens representative public product pages in Chromium;
2. records the full browser response stream for auditability;
3. isolates commerce-relevant structured endpoints from analytics/static noise;
4. performs bounded GET-only product-derived probes;
5. detects Shopify, BigCommerce, SuiteCommerce/NetSuite, Magento, and WooCommerce hints;
6. performs safe platform-aware probes where a public product identifier is already rendered;
7. replays a bounded set of observed public GET fetch/XHR endpoints to confirm they are directly fetchable;
8. exports reusable endpoint templates and observed JSON schema keys.

It never updates the DTB catalog, WooCommerce, Veeqo, QuickBooks, pricing, inventory, MAP, or protected identifiers.

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

Add one or more representative pages for the same site by repeating `--url`:

```powershell
python scripts/catalog/competitor_endpoint_probe.py `
  --sites csr_building `
  --url csr_building=https://csrbuilding.com/en-us/products/product-a `
  --url csr_building=https://csrbuilding.com/en-us/products/product-b
```

When any `--url` values are supplied for a site, those pages replace that site's built-in representative page for the run.

Use `--headed` to watch Chromium.

## Outputs

Default directory:

`reports/pricing/competitor-endpoint-probe/`

### `network_observations.csv`

Raw response metadata for every observed browser response plus explicit product/platform probes and direct replays.

This is the audit trail. It intentionally includes static assets and unrelated third-party traffic so nothing observed by Chromium is hidden.

Fields include:

- site key and representative page;
- source (`browser`, `direct_product_probe`, `platform_probe`, or `direct_replay`);
- method and resource type;
- status;
- redacted URL;
- content type and size;
- same-origin status;
- structured JSON status;
- platform hint;
- detected product/catalog fields;
- observed JSON keys;
- direct-request elapsed time where applicable.

### `structured_endpoints.csv`

This is the actionable endpoint inventory.

Unlike `network_observations.csv`, it excludes known analytics/tracking traffic and static CSS/image/font/script assets unless the response itself is a parseable structured payload relevant to storefront data.

A finding must be an actual successful response and satisfy a commerce/structured condition such as:

- parseable JSON from fetch/XHR;
- product/catalog fields such as SKU, MPN, price, barcode, variants, currency, vendor, or title;
- a same-origin commerce API/service route;
- a successful explicit product `.js` / `.json` probe;
- a successful platform probe;
- a successful direct replay of a structured public GET endpoint.

Third-party search/recommendation APIs remain visible when they return structured product data. They are inventory findings, not endorsements.

### `endpoint_patterns.csv`

Deduplicated reusable endpoint contracts derived from the successful structured findings.

Examples:

```text
https://csrbuilding.com/en-us/products/{handle}.js
```

```text
https://www.all-wall.com/api/cacheable/items?c={site_id}&country={country}&currency={currency}&fieldset={fieldset}&url={product_slug}&pricelevel={price_level}
```

Common query values use semantic placeholders where possible:

- `{product_slug}`
- `{handle}`
- `{product_id}`
- `{variant_id}`
- `{sku}`
- `{country}`
- `{currency}`
- `{locale}`
- `{fieldset}`
- `{price_level}`
- `{site_id}`

Long numeric path IDs and UUIDs are generalized as `{id}` and `{uuid}`.

Pattern metadata includes:

- endpoint kind;
- HTTP method;
- endpoint template;
- same-origin flag;
- content types and status codes;
- observation sources/resource types;
- platform hints;
- observed/successful/structured counts;
- whether a direct GET was confirmed;
- one concrete redacted example URL;
- detected product fields;
- observed JSON keys.

There is no ranking, score, confidence, or recommendation field.

### `endpoint_probe.json`

Schema version 3 is a machine-readable integration inventory. It includes:

- detected platforms by competitor;
- final pages observed;
- raw and filtered counts;
- detected product/catalog fields by site;
- the complete endpoint-pattern inventory;
- output paths;
- explicit security assertions.

## Platform-aware behavior

### Shopify / CSR

CSR is US/USD scoped. Explicit product probes are always constrained to:

```text
https://csrbuilding.com/en-us/products/{handle}.js
https://csrbuilding.com/en-us/products/{handle}.json
```

The browser may independently request other CSR locales. Those remain only in the raw observation stream unless they independently satisfy the filtered endpoint rules.

### BigCommerce / Al's and Wall Tools

The browser network remains the primary source of truth. If the public product page renders a numeric product ID, the probe also safely tests public GET-only storefront product forms:

```text
/api/storefront/products/{product_id}
/api/storefront/products/{product_id}/attributes
```

Failures simply remain raw probe observations; they do not fail the run.

Observed structured BigCommerce fetch/XHR endpoints are also replayed once, subject to the replay cap, so the report records whether the GET structure is directly fetchable in the public browser context.

### SuiteCommerce / All-Wall

The probe does not invent NetSuite endpoints. It records the actual public SuiteCommerce requests emitted by the product page, including `/api/cacheable/items` and `/scs/services/...` structures when observed.

Relevant public GET fetch/XHR endpoints are replayed once to confirm their response structure and schema independently of the page's original request event.

## Noise filtering

Only `structured_endpoints.csv` and `endpoint_patterns.csv` are filtered. `network_observations.csv` remains complete.

The filtered inventory excludes known analytics/telemetry hosts and routes, including common Google Analytics/DoubleClick, Facebook, Pinterest, Bing, TikTok, Hotjar, New Relic, Sentry, and similar tracking traffic.

It also excludes normal stylesheets, images, fonts, and media. JavaScript bundles are excluded unless they parse as structured JSON and meet the commerce finding rules.

This prevents paths such as `webfont.js`, analytics `/collect`, marketing pixels, and static Searchspring bundles from polluting the API inventory while preserving genuine structured Searchspring/Findify product responses.

## Direct replay safety

The scanner only replays observed `GET` fetch/XHR endpoints. It does not replay POST requests or URLs containing redacted sensitive query values.

A maximum of 12 observed endpoints per representative page are replayed. This keeps the diagnostic bounded and prevents the probe from turning into a high-volume crawler.

## Security

The tool operates only against public storefront pages.

It does not persist:

- cookies;
- authorization headers;
- request bodies;
- response bodies;
- browser storage;
- tokens or secrets.

Sensitive query values are redacted before persistence. Explicit probes and replays are GET-only.

Do not extend the tool to authenticate into competitor accounts, bypass access controls, solve CAPTCHAs, or replay private customer/session APIs.

## Integration handoff

After the final probe run, use `endpoint_patterns.csv`, `structured_endpoints.csv`, and `endpoint_probe.json` to implement dedicated site adapters in `competitor_price_research.py`.

The production adapter must still validate, per site:

- product identity;
- US/USD market scope where required;
- SKU/MPN/GTIN semantics;
- current vs regular/sale price semantics;
- variants;
- availability where used;
- response/rate-limit behavior;
- HTML fallback behavior.

The endpoint probe is discovery tooling only. Once this final schema is generated, the next task is the production research-script integration.
