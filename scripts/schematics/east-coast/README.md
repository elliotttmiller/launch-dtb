# East Coast schematic extractor

Read-only research tooling for discovering and capturing the public data that East Coast Drywall sends to a browser for interactive schematic pages.

## Why browser/network capture

East Coast exposes `Interactable Schematics` on its parts collections, but the public search crawler does not expose a stable documented hotspot API. The extractor therefore observes the actual browser network contract instead of hard-coding an unverified endpoint. Any XHR/fetch/JSON/app-proxy response with schematic, part, callout, product, or coordinate signals is persisted with source URL, request fingerprint, checksum, and page provenance.

This is deliberately a staging tool. It never writes to `frontend/public/brands/**/schematic_data.json` or WordPress.

## Requirements

- Node.js 20+
- Chromium installed by Playwright
- Public network access to `https://eastcoastdrywall.com`

Install in this directory:

```bash
npm install
npm run install-browser
```

## Run TapeTech and Columbia

```bash
npm run extract
```

The default seeds are:

- `https://eastcoastdrywall.com/pages/schematic-list/tape-tech`
- `https://eastcoastdrywall.com/pages/schematic-list/columbia`

The crawler follows public same-site links under `/pages/schematic-list/` and schematic-like page paths discovered from those pages.

## Run the global schematic index

To enumerate every brand exposed by East Coast, seed its global schematic index as well:

```bash
npm run extract -- \
  --brand-url https://eastcoastdrywall.com/pages/schematic-list/schematics \
  --brand-url https://eastcoastdrywall.com/pages/schematic-list/tape-tech \
  --brand-url https://eastcoastdrywall.com/pages/schematic-list/columbia \
  --max-pages 250
```

If East Coast changes the global index route, pass the replacement public index with `--brand-url`; do not modify canonical DTB data to compensate.

## Output

Each run gets its own local directory under `output/<run-id>/`:

```text
manifest.json
endpoints.json
responses.json
candidates.json
raw/
  pages/
    <page>.json
  responses/
    <sha256>.json
    <sha256>.txt
```

`output/` is intentionally ignored by Git. Research captures can contain large third-party payloads and browser-delivered token-shaped configuration fields and must not be committed.

### `manifest.json`

Coverage and safety metadata: seeds, pages visited, navigation errors, counts, limits, and whether authentication/canonical writes were used.

### `endpoints.json`

Observed endpoint signatures sorted by hotspot/part signal strength. This is the quickest way to identify the actual East Coast application/API backend after a run.

### `responses.json`

Provenance index for every persisted response. Sensitive request headers such as cookies, authorization, CSRF/XSRF tokens, Shopify access tokens, and API keys are excluded.

### `candidates.json`

Review candidates extracted recursively from JSON payloads, embedded JSON, and relevant DOM elements. Candidate geometry remains in the source representation. The extractor does **not** convert a DOM bounding box, CSS `left/top`, SVG coordinate, or source JSON coordinate into DTB `x_pct/y_pct` until its coordinate system and anchor semantics are verified.

## Deterministic schematic part and product enrichment

The schematic pages expose part occurrences directly through the rendered schematic overlay. Online parts are linked as `/products/<handle>` and the East Coast page's own JavaScript resolves those links through Shopify's public `/products/<handle>.js` endpoint.

After the capture pass, run:

```bash
npm run enrich-products -- \
  --run ./output/<run-id>
```

The enrichment pass only revisits public `/pages/schematic/*` URLs already present in the selected run. It extracts each rendered overlay occurrence and explicitly fetches every unique linked product's public Shopify JSON record.

It writes:

```text
schematic-parts-products.json
enrichment-summary.json
enrichment-failures.json
source-products.json
```

### `schematic-parts-products.json`

Per-schematic joined source evidence containing:

- schematic page and title;
- page number where determinable;
- callout/part number text rendered on the diagram;
- East Coast product handle and product URL when present;
- the overlay/link element's source attributes and datasets;
- source-native inline CSS and rendered rectangles;
- CSS percentage geometry when the page supplies percentage `left/top/width/height` values;
- source product ID/title resolution;
- exact Shopify variant-SKU matches to the rendered callout when available.

Coordinate anchor semantics remain `unverified`; the enrichment command does not promote CSS or rendered DOM coordinates into canonical DTB coordinates.

### `source-products.json`

One record per unique linked East Coast product with public Shopify product data including product ID, title, vendor, product type, availability, description, images, options, variants, variant SKU, barcode, price, and availability where Shopify exposes them.

East Coast/Shopify identifiers are provenance only. They are not DTB product identity.

### Unavailable/offline parts

The East Coast page converts product links that return unavailable product data into `.schematic-overlay-text` nodes. Those occurrences are retained with their callout text and `no_online_product_link`/unresolved status rather than discarded or guessed.

## Identifying the real hotspot endpoint

After a run:

1. Open `endpoints.json`.
2. Inspect endpoints with the highest `maxSignalScore`.
3. Open the referenced `raw/responses/<sha>.json` payloads from `responses.json`.
4. Confirm which payload contains the complete schematic list, part records, and per-occurrence hotspot/callout geometry.
5. Record the source contract before writing a deterministic normalizer for that specific payload shape.

The enrichment pass complements this network evidence. It uses the rendered overlay and the exact public Shopify product endpoint East Coast itself uses, so missing product metadata does not depend on idle-request timing during the initial capture.

## Promotion into DTB

Do not copy raw East Coast records directly into canonical schematics.

The required promotion flow is:

```text
capture
  -> enrich source part/product relationships
  -> identify authoritative source payload
  -> normalize without inventing values
  -> reconcile brand + manufacturer part number against DTB catalog
  -> validate every hotspot part_ref
  -> verify coordinate system/anchor semantics
  -> visual overlay QA
  -> explicit canonical promotion
```

DTB's native target remains schematic schema v2 (`parts_catalog` + per-occurrence `hotspots`). One manufacturer part may have multiple hotspot occurrences.

## Product linking rules

East Coast product URLs, Shopify product IDs, and variant IDs are source provenance only. They must never become DTB product identity.

Reconciliation priority should be:

1. exact brand + manufacturer part number;
2. documented normalized manufacturer identifier;
3. existing DTB external-ID mapping;
4. exact normalized name + brand as review candidate;
5. fuzzy matching only as `review_required`.

Never auto-link a cross-brand common part solely because its name is similar.

## Operational safeguards

- HTTPS and `eastcoastdrywall.com` seeds only.
- Maximum 250 pages per capture run.
- Maximum 12 MiB per captured textual response.
- Deliberate delay between page navigations.
- No login or authentication flow.
- No access-control bypass.
- No write requests are initiated by the tooling.
- Cookies/authentication headers are never persisted.
- Raw bodies are content-addressed by SHA-256 for reproducibility and change detection.
- Service workers are blocked so browser response observation is deterministic.
- Generated `output/` directories are excluded from Git.

## Useful options

Capture:

```text
--brand-url URL   Seed URL; repeatable
--out DIR         Output root
--headed          Run visible Chromium for inspection
--timeout-ms N    Navigation timeout (1,000–120,000)
--settle-ms N     Post-load settle delay
--max-pages N     Crawl safety bound (1–250)
```

Enrichment:

```text
--run DIR         Existing extractor run directory; required
--headed          Run visible Chromium for inspection
--timeout-ms N    Navigation timeout (1,000–120,000)
```

## Failure semantics

A navigation error is recorded per page and does not cause silent omission of already captured evidence. A completely empty crawl exits non-zero. Enrichment records failed navigations and unresolved product fetches separately. Endpoint/payload changes should therefore surface as changed checksums, lower signal counts, navigation errors, missing candidates, or unresolved source products rather than silently rewriting DTB data.
