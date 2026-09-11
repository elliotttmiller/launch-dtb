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

Each run gets its own immutable-style directory under `output/<run-id>/`:

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

### `manifest.json`

Coverage and safety metadata: seeds, pages visited, navigation errors, counts, limits, and whether authentication/canonical writes were used.

### `endpoints.json`

Observed endpoint signatures sorted by hotspot/part signal strength. This is the quickest way to identify the actual East Coast application/API backend after a run.

Example fields:

```json
{
  "endpoint": "GET https://some-app.example/api/schematics",
  "captures": 12,
  "maxSignalScore": 72,
  "exampleUrls": ["..."]
}
```

The endpoint list is evidence from the captured browser session. It is not hard-coded into the scraper.

### `responses.json`

Provenance index for every persisted response. Sensitive request headers such as cookies, authorization, CSRF/XSRF tokens, Shopify access tokens, and API keys are excluded.

### `candidates.json`

Review candidates extracted recursively from JSON payloads, embedded JSON, and relevant DOM elements. Candidate geometry remains in the source representation. The extractor does **not** convert a DOM bounding box, CSS `left/top`, SVG coordinate, or source JSON coordinate into DTB `x_pct/y_pct` until its coordinate system and anchor semantics are verified.

## Identifying the real hotspot endpoint

After a run:

1. Open `endpoints.json`.
2. Inspect endpoints with the highest `maxSignalScore`.
3. Open the referenced `raw/responses/<sha>.json` payloads from `responses.json`.
4. Confirm which payload contains the complete schematic list, part records, and per-occurrence hotspot/callout geometry.
5. Record the source contract before writing a deterministic normalizer for that specific payload shape.

This two-stage design is intentional. It survives undocumented Shopify/app changes better than guessing a permanent endpoint from URL naming.

## Promotion into DTB

Do not copy raw East Coast records directly into canonical schematics.

The required promotion flow is:

```text
capture
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
- Maximum 250 pages per run.
- Maximum 12 MiB per captured textual response.
- Deliberate delay between page navigations.
- No login or authentication flow.
- No access-control bypass.
- No write requests are initiated by the extractor itself.
- Cookies/authentication headers are never persisted.
- Raw bodies are content-addressed by SHA-256 for reproducibility and change detection.
- Service workers are blocked so browser response observation is deterministic.

## Useful options

```text
--brand-url URL   Seed URL; repeatable
--out DIR         Output root
--headed          Run visible Chromium for inspection
--timeout-ms N    Navigation timeout (1,000–120,000)
--settle-ms N     Post-load settle delay
--max-pages N     Crawl safety bound (1–250)
```

## Failure semantics

A navigation error is recorded per page and does not cause silent omission of already captured evidence. A completely empty crawl exits non-zero. Endpoint/payload changes should therefore surface as changed checksums, lower signal counts, navigation errors, or missing candidates rather than silently rewriting DTB data.
