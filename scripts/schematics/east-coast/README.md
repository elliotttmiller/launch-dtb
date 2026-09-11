# East Coast schematic scraper

Read-only operational tooling for extracting public interactive schematic data from East Coast Drywall in one deterministic workflow.

The scraper never writes DTB canonical catalog or schematic data. East Coast product URLs, Shopify product IDs, variant IDs, and source handles are provenance only.

## Requirements

- Node.js 20+
- Playwright Chromium
- Public network access to `https://eastcoastdrywall.com`

Install:

```bash
npm install
npm run install-browser
```

## One supported workflow

Run the default TapeTech and Columbia brand indexes:

```bash
npm run scrape
```

Run a specific schematic for diagnosis:

```bash
npm run scrape -- \
  --url https://eastcoastdrywall.com/pages/schematic/col-3-ah \
  --fail-on-incomplete
```

Run explicit brand/index seeds:

```bash
npm run scrape -- \
  --brand-url https://eastcoastdrywall.com/pages/schematic-list/schematics \
  --brand-url https://eastcoastdrywall.com/pages/schematic-list/tape-tech \
  --brand-url https://eastcoastdrywall.com/pages/schematic-list/columbia \
  --max-pages 250 \
  --fail-on-incomplete
```

## Pipeline

One browser session performs the full operation:

```text
discover schematic pages
  -> load schematic
  -> extract page/image metadata
  -> extract overlay callouts + source geometry
  -> resolve unique /products/<handle>.js records
  -> join occurrence -> source part -> source product/variant
  -> validate coverage and integrity
  -> persist normalized source dataset + raw provenance
```

The primary extraction contract is East Coast's rendered schematic markup:

- `[data-schematic-canvas]`
- `[data-canvas-page]`
- `.interactable-schematic-image`
- `.interactable-schematic-overlay`
- `.interactable-schematic-overlay > a[href*="/products/"]`
- `.interactable-schematic-overlay .schematic-link a[href*="/products/"]`
- `.schematic-overlay-text[data-product-handle]`

If that contract changes, validation must fail rather than silently inventing data.

## Geometry

East Coast positions callout rectangles directly over each diagram using CSS percentage `left`, `top`, `width`, and `height` values. Those values are retained verbatim as source geometry.

The scraper also derives a center-based normalized rectangle suitable for later DTB reconciliation:

```text
x_pct = left_pct + width_pct / 2
y_pct = top_pct + height_pct / 2
```

Both source and derived geometry are preserved. The scraper does not write either form into canonical DTB schematic files.

## Product resolution

For every unique overlay product handle, the scraper explicitly requests the same public Shopify contract East Coast uses:

```text
/products/<handle>.js
```

It captures public product metadata including product ID, title, vendor, product type, description, images, options, variants, SKU, barcode, price, and availability where exposed.

A schematic occurrence without an online product is still retained as a legitimate source part occurrence. Missing commerce data must not cause the schematic part to disappear.

## Output

Each run writes to local `output/<run-id>/`:

```text
manifest.json
schematics.json
products.json
validation.json
failures.json
diagnostics.json
raw/
  pages/
  products/
```

`output/` is ignored by Git.

### `manifest.json`

Run identity, safety boundaries, coverage counts, and overall `PASS`, `PASS_WITH_WARNINGS`, or `FAIL` status.

### `schematics.json`

Joined source records containing diagram pages, images, hotspot/callout occurrences, source part numbers, source/normalized geometry, source product resolution, and exact variant-SKU matches.

### `products.json`

One deduplicated record per East Coast source product handle.

### `validation.json`

Per-schematic validation. Hard failures include missing pages, zero callouts, page-count mismatch, missing geometry, and invalid percentage ranges. Warnings include unresolved products and resolved products without an exact variant-SKU match.

### `failures.json`

Navigation and coverage failures.

### `diagnostics.json`

Non-schematic pages encountered during discovery. This is diagnostic evidence only and is not the principal extraction dataset.

### `raw/`

Sanitized page/product evidence with SHA-256 provenance. Token/secret/password/authorization/cookie/API-key-shaped object fields are redacted before page snapshots are persisted.

## Options

```text
--brand-url URL       Seed schematic-list URL; repeatable
--url URL             Direct schematic URL; repeatable
--out DIR             Output root
--headed              Run visible Chromium
--timeout-ms N        Navigation timeout, 1,000-120,000
--settle-ms N         Post-load settle delay, 0-30,000
--max-pages N         Crawl bound, 1-250
--fail-on-incomplete  Return non-zero when validation fails
```

## Reconciliation into DTB

This tool stops at source extraction and validation. Canonical promotion remains a separate reviewed data operation:

```text
scrape
  -> review validation
  -> reconcile exact brand + manufacturer part number against DTB catalog
  -> validate every canonical part_ref
  -> visual overlay QA
  -> explicit promotion into DTB schema v2
```

Never auto-link cross-brand parts from fuzzy names, never use East Coast/Shopify IDs as DTB product identity, and never let this script become an alternate catalog or schematic application service.
