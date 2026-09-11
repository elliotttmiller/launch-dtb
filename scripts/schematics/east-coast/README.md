# East Coast schematic scraper

Production-oriented, read-only operational tooling for extracting public interactive schematic data from East Coast Drywall through Browserless.

The scraper never writes DTB canonical catalog or schematic data. East Coast product URLs, Shopify product IDs, variant IDs, and source handles are provenance only.

## Architecture

The operator still runs one command, but the implementation is separated internally by concern:

```text
scrape.mjs
  -> lib/browserless.mjs   Browserless transport/session configuration
  -> lib/source.mjs        East Coast schematic DOM contract + geometry
  -> lib/products.mjs      deduplicated product queue/cache/retries
  -> lib/validation.mjs    PASS / PASS_WITH_WARNINGS / INCOMPLETE / FAIL
  -> lib/io.mjs            sanitized persistence + checksums
```

Browserless is the browser execution authority for this tooling only. It does not become a DTB runtime dependency and it owns no catalog, product, schematic, or commerce data.

## Requirements

- Node.js 20+
- Browserless account/API token
- public access to `https://eastcoastdrywall.com`

Install dependencies:

```bash
npm install
npm run check
```

The scraper uses `playwright-core`; no local Chromium installation is required.

## Browserless configuration

Copy `.env.example` values into your shell/environment. Do not commit a real token.

Required:

```text
BROWSERLESS_TOKEN
```

Optional:

```text
BROWSERLESS_WS_ENDPOINT=wss://production-sfo.browserless.io
BROWSERLESS_PROXY=residential
BROWSERLESS_PROXY_COUNTRY=us
BROWSERLESS_PROXY_STICKY=true
BROWSERLESS_STEALTH=false
BROWSERLESS_SESSION_TIMEOUT_MS=120000
```

The Browserless token is inserted only into the in-memory WebSocket connection URL. It is never written to manifests, diagnostics, raw page snapshots, or logs.

The scraper connects through Playwright CDP and deliberately uses Browserless's default browser context so Browserless proxy/session launch settings remain effective.

## One supported workflow

Default TapeTech + Columbia crawl:

```bash
npm run scrape -- --fail-on-incomplete
```

Target one schematic:

```bash
npm run scrape -- \
  --url https://eastcoastdrywall.com/pages/schematic/col-3-ah \
  --fail-on-incomplete
```

Explicit seeds:

```bash
npm run scrape -- \
  --brand-url https://eastcoastdrywall.com/pages/schematic-list/schematics \
  --brand-url https://eastcoastdrywall.com/pages/schematic-list/tape-tech \
  --brand-url https://eastcoastdrywall.com/pages/schematic-list/columbia \
  --max-pages 250 \
  --fail-on-incomplete
```

## Browserless session model

Browserless sessions have plan-dependent lifetime limits, so the scraper never assumes one browser can process the complete workload.

Discovery rotates to a new Browserless session after a bounded number of page navigations (`--page-batch-size`, default 8).

Product resolution is globally deduplicated and resolved in bounded Browserless sessions (`--product-batch-size`, default 75). A sticky proxy is retained inside each session by default; opening the next session obtains a fresh Browserless session/proxy identity. Sustained HTTP 429 responses cause the current product session to be abandoned early and retried once in a fresh session.

## Pipeline

```text
discover schematic pages
  -> extract all schematic page/image metadata
  -> extract overlay callouts + source geometry
  -> classify source part/product handles
  -> reject obvious annotations/malformed handles
  -> globally deduplicate valid handles
  -> consult local positive/404 cache
  -> resolve /products/<handle>.js sequentially through Browserless
  -> honor Retry-After / exponential backoff + jitter
  -> rotate Browserless sessions on sustained throttling
  -> join occurrence -> source part -> source product
  -> validate
  -> persist normalized source dataset + raw provenance
```

## East Coast source contract

The primary extraction contract is rendered East Coast markup:

- `[data-schematic-canvas]`
- `[data-canvas-page]`
- `.interactable-schematic-image`
- `.interactable-schematic-overlay`
- `.interactable-schematic-overlay > a[href*="/products/"]`
- `.interactable-schematic-overlay .schematic-link a[href*="/products/"]`
- `.schematic-overlay-text[data-product-handle]`

If the structural contract changes, validation must surface incomplete or failed extraction rather than inventing values.

## Geometry

East Coast positions callout rectangles with CSS percentage `left`, `top`, `width`, and `height` values. Those source values are retained unchanged.

DTB-style center geometry is derived deterministically:

```text
x_pct = left_pct + width_pct / 2
y_pct = top_pct + height_pct / 2
```

Both forms remain in the source dataset.

## Source part identity

The scraper does not assume overlay text is always a product identifier. It validates East Coast product handles before network lookup and records rejected handles separately.

Obvious annotation/prose/date/encoded-punctuation handles are rejected from the product queue rather than being requested as products.

When a valid handle exists, the manufacturer-facing source part number is derived from the East Coast namespace where applicable:

```text
TT-219080  -> 219080
COL-CFB1A  -> CFB1A
DM-T-163   -> T-163
```

The original callout text and source handle are both preserved.

## Product resolution

Valid handles are resolved through East Coast's public Shopify contract:

```text
/products/<handle>.js
```

Resolution semantics are explicit:

- `resolved`: HTTP 2xx + valid JSON product payload
- `not_published`: HTTP 404; the source schematic part remains valid but has no current online East Coast product
- `rate_limited_retry_exhausted`: HTTP 429 remained after request backoff and one fresh Browserless-session retry
- `upstream_retry_exhausted`: retryable 5xx failure remained
- `retry_exhausted`: network/transport retry remained incomplete
- `http_error` / `non_json_response` / `response_too_large`: terminal source response problem

HTTP 429 is never classified as an ordinary missing product.

### Identity evidence

Variant SKU equality is supporting evidence, not a hard requirement. Resolved source products are evaluated using:

1. normalized East Coast handle/part correspondence;
2. product-title confirmation;
3. variant-SKU confirmation when available.

This avoids false warnings where East Coast uses an internal commerce SKU that differs from the manufacturer schematic identifier.

## Cache

`.cache/products/` is Git-ignored.

Only authoritative terminal outcomes are cached:

- `resolved`: 7-day TTL
- `not_published`: 24-hour TTL

429, 5xx, network, non-JSON, or other transient failures are never cached as truth.

Use `--refresh-products` to bypass the cache.

## Validation states

Per-schematic and run-level validation now uses four states:

- `PASS`: complete structural extraction and product resolution
- `PASS_WITH_WARNINGS`: structurally complete, but legitimate source-only/404 parts, rejected annotations, or ambiguous identity evidence exist
- `INCOMPLETE`: retryable/transient product resolution remains unresolved
- `FAIL`: structural schematic extraction or coverage is invalid

`--fail-on-incomplete` exits non-zero for both `INCOMPLETE` and `FAIL`.

## Output

Each run writes to local `output/<run-id>/`:

```text
manifest.json
schematics.json
products.json
validation.json
failures.json
diagnostics.json
rejected-handles.json
raw/
  pages/
  products/
```

`output/`, `.cache/`, `.env`, and `.env.*` are ignored by Git. `.env.example` is intentionally tracked.

The manifest records Browserless only as non-sensitive transport metadata (provider, endpoint host, proxy type/country, sticky/stealth mode). It never records the Browserless token or a credential-bearing WebSocket URL.

## Useful options

```text
--brand-url URL          Seed schematic-list URL; repeatable
--url URL                Direct schematic URL; repeatable
--out DIR                Output root
--cache-dir DIR          Product cache root
--timeout-ms N           Page/CDP connection timeout
--session-timeout-ms N   Browserless session maximum
--settle-ms N            Post-load settle delay
--nav-delay-ms N         Delay between page navigations
--page-batch-size N      Page navigations per Browserless session
--product-delay-ms N     Minimum delay between product requests
--product-retries N      Retries for 429/5xx/network failures
--product-batch-size N   Product handles per Browserless session
--proxy TYPE             none|datacenter|residential
--proxy-country CC       Browserless proxy country
--proxy-sticky BOOL      Sticky proxy inside a session
--stealth                Use Browserless stealth CDP endpoint
--refresh-products       Ignore product cache
--max-pages N            Crawl bound, 1-250
--fail-on-incomplete     Exit non-zero for INCOMPLETE or FAIL
```

## Reconciliation into DTB

This tool stops at source extraction and validation:

```text
Browserless scrape
  -> review validation
  -> reconcile exact brand + manufacturer part number against DTB catalog
  -> validate canonical part_ref relationships
  -> visual overlay QA
  -> explicit promotion into DTB schema v2
```

Never use East Coast/Shopify IDs as DTB business identity, never auto-link cross-brand parts from fuzzy names, and never allow this tooling to become an alternate catalog or schematic application service.
