# Catalog Pricing Review

This directory contains human-review artifacts for validating the temporary pricing-only catalog extract.

## Purpose

These files make the pricing extract easier for a nontechnical reviewer to inspect product-by-product without creating another pricing authority.

The pricing source remains:

`../temp/dtb_official_catalog_pricing_only.csv`

The source columns are exactly:

`Brand, Name, SKU, COG, Regular Price, Sale, MAP Price`

Review status and reviewer notes are annotations only. They do not update WooCommerce, WordPress, the canonical launch catalog, Veeqo, QuickBooks, or the source CSV.

## Recommended review interface

Open:

`dtb_catalog_pricing_review.html`

When served from `docs/catalog_prices/`, the page automatically loads `../temp/dtb_official_catalog_pricing_only.csv`.

If the HTML file is opened directly from a local filesystem and the browser blocks relative file loading, click **Open CSV** and choose `docs/catalog_prices/temp/dtb_official_catalog_pricing_only.csv`.

### Review workflow

1. Use **Review one by one** for sequential product validation.
2. Validate COG, Regular Price, Sale Price, and MAP Price against the approved evidence available to the reviewer.
3. Set one review decision:
   - `Unreviewed`
   - `Correct`
   - `Needs Correction`
   - `Needs Research`
4. Add a reviewer note when a correction or additional evidence is required.
5. Use search and brand/status filters to revisit products efficiently.
6. Use **Export Review** to save review annotations as JSON. The export contains SKU identity, review status, and reviewer notes; it does not mutate pricing data.
7. Use **Import Review** to restore or transfer those annotations into another browser session.

The interface also supports:

- Previous/next navigation.
- Left/right arrow navigation when focus is not inside an input.
- `/` to focus search.
- Catalog-list view.
- Review progress tracking.
- Print-friendly current-product output.
- Deterministic warning filters for missing values and observable price relationships.

## Pricing warning semantics

Warnings are factual review cues only. They do not prescribe replacement prices and do not declare a price invalid without human evidence review.

The current checks are:

- Missing COG.
- Missing Regular Price.
- Missing MAP.
- Sale Price Present.
- Regular Price below COG.
- Regular Price below MAP.
- MAP below COG.

Missing values remain unknown. The review tooling never infers MAP, cost, sale price, or any other economic field.

## Generate self-contained HTML and Excel workbook

Run from the repository root:

```bash
python docs/catalog_prices/generate_pricing_review.py
```

The generator validates the exact seven-column CSV schema, rejects missing or duplicate SKUs, validates numeric pricing fields, and writes:

- `docs/catalog_prices/review/dtb_catalog_pricing_review.html`
- `docs/catalog_prices/review/dtb_catalog_pricing_review.xlsx`

The generated HTML embeds the current CSV rows so it can be distributed as a single offline file.

The generated Excel workbook contains:

`# | Brand | Product | SKU | COG | Regular Price | Sale Price | MAP Price | Warnings | Review Status | Reviewer Note`

`Review Status` uses a controlled list with the four review states above. The pricing columns are copied from the CSV; the two reviewer columns are separate annotation fields.

## Regeneration rule

Do not manually maintain duplicated pricing values in review artifacts.

When `../temp/dtb_official_catalog_pricing_only.csv` changes, regenerate the artifacts from that CSV. The CSV remains the working pricing projection; generated HTML/XLSX files remain human-review derivatives only.
