# Catalog Pricing Evidence Library

This directory is a curated copy of committed pricing evidence and validated pricing-analysis outputs discovered during the repository audit on 2026-09-05.

## Authority boundary

This directory does **not** create a new pricing system of record.

- WooCommerce remains authoritative for persisted runtime regular, sale, and effective product prices and native Cost of Goods.
- `products/launch/official/dtb_official_catalog.csv` remains the canonical launch catalog source artifact under `products/`.
- Supplier documents and exports are evidence for MAP/MSRP/cost facts; they do not override runtime pricing by existing merely in this documentation directory.
- `scripts/supplier-catalog/` outputs are deterministic derived evidence/audit artifacts, not runtime commerce authority.
- Missing MAP, COGS, MSRP, or supplier pricing must remain unknown unless supported by authoritative evidence. Do not infer or synthesize missing values.

All copied evidence files below reuse the exact Git blob from their original repository path. Their content is byte-identical at the audited commit; the source path remains the provenance record.

## Human pricing review package

`review/` contains a nontechnical review experience for checking the temporary pricing extract product-by-product.

Primary files:

- `review/dtb_catalog_pricing_review.html` — browser-based sequential review interface with search, brand/status filters, review progress, deterministic pricing warnings, print support, local review annotations, and JSON export/import.
- `review/README.md` — reviewer instructions and regeneration rules.
- `generate_pricing_review.py` — deterministic standard-library generator that validates the current seven-column CSV and can produce a fully self-contained HTML review book plus an `.xlsx` review workbook.

The review interface and generated workbook are **human-review derivatives only**. Reviewer decisions and notes never mutate WooCommerce, the canonical launch catalog, or `temp/dtb_official_catalog_pricing_only.csv`.

## Included files

### Canonical catalog snapshot

| Copied path | Source path | Classification | Git blob SHA |
|---|---|---|---|
| `official/dtb_official_catalog.csv` | `products/launch/official/dtb_official_catalog.csv` | Canonical launch catalog artifact containing WooCommerce pricing fields and pricing evidence fields | `c1da3a5755f026717d31ea17ab6e4f13ba8715ec` |

### Supplier-origin pricing evidence

| Copied path | Source path | Classification | Git blob SHA |
|---|---|---|---|
| `supplier_sources/tsw/2025 Mapp Pricing - TapeTech - EIFS - Decorative - Asgard - FINAL 092425.xlsx` | `docs/reference/data/TSW/2025 Mapp Pricing - TapeTech - EIFS - Decorative - Asgard - FINAL 092425.xlsx` | Dated MAP workbook; primary supplier/manufacturer pricing evidence | `9b86f4f4a83a4a31dc078e96c249beea4cb4a825` |
| `supplier_sources/tsw/TSW MAPS US HT June 26.pdf` | `docs/reference/data/TSW/TSW MAPS US HT June 26.pdf` | Dated MAP document; primary supplier/manufacturer pricing evidence | `f5b30b5b9764ace8c3ac7ce74e55e5ef95bef2bd` |
| `supplier_sources/tsw/US MAP MAR26.pdf` | `docs/reference/data/TSW/US MAP MAR26.pdf` | Dated MAP document; primary supplier/manufacturer pricing evidence | `38be4b3e45f4beb8720a8dbf85e59c09ba0cfb8f` |
| `supplier_sources/tsw/TSW Product Data.xlsx` | `docs/reference/data/TSW/TSW Product Data.xlsx` | Supplier product-data workbook used as pricing/cost provenance where populated | `3c22e256fb5549a4ff0f66d0c687cac8da2aadb3` |
| `supplier_sources/tsw/TSW Product Data - TapeTech Parts - Enriched.csv` | `docs/reference/data/TSW/TSW Product Data - TapeTech Parts - Enriched.csv` | Supplier-derived TapeTech part data with populated COGS on supported rows | `f000da9abcea44f9ef0fd33415522560464bbbb3` |
| `supplier_sources/level5/level5_order_input_level5.csv` | `docs/reference/data/brands/level5_order_input_level5.csv` | LEVEL5 order form containing SKU, MSRP, MAPP, and dealer `Your Price` | `44a27942effeb55de964daf3338798fc076d090e` |
| `supplier_sources/level5/level5_order_input_individual_parts.csv` | `products/launch/universal_parts/references/level5_order_input_individual_parts.csv` | LEVEL5 parts order form containing SKU, MSRP, MAPP, and dealer `Your Price` | `f96a0c598e77ee1723d6ae144e7d7895f1d1c335` |
| `supplier_sources/level5/level5_catalog_minimal_with_pricing.csv` | `docs/reference/data/brands/level5_catalog_minimal_with_pricing.csv` | Normalized LEVEL5 pricing extract with MSRP, MAPP, and COGS | `6d9e7778de0b3ec6cc3e0bab5072ded513a898ac` |

### Validated and derived pricing evidence

| Copied path | Source path | Classification | Git blob SHA |
|---|---|---|---|
| `validated/tsw-costs.csv` | `scripts/supplier-catalog/results/cost/tsw-costs.csv` | Supplier-cost extract used by deterministic catalog tooling | `3db9d236c223287da214e698203cc27466de9a12` |
| `validated/tsw-supplier-cost-migration-report.json` | `scripts/supplier-catalog/results/cost/tsw-supplier-cost-migration-report.json` | Validation/migration report; records 273 confirmed rows, 272 identifier matches + 1 approved manual match, and zero required cost changes in that run | `d10b3bab2e06c9834b69560ffc00ff699e01c187` |
| `validated/pricing-category-audit.json` | `scripts/supplier-catalog/results/audit/pricing-category-audit.json` | Canonical catalog pricing-evidence coverage audit | `6c3d1a1f36dfe8514da391b94bbf3f39f3a09496` |
| `validated/pricing-data-gaps.csv` | `scripts/supplier-catalog/results/audit/pricing-data-gaps.csv` | SKU-level missing COGS/MAP and hard-floor issue inventory | `d776d56ada440097467c63b569d3260cb9aa53ac` |
| `validated/margin-policy-sku-detail.csv` | `scripts/supplier-catalog/results/margin/margin-policy-sku-detail.csv` | SKU-level regular/effective price, COGS, MAP, and computed margin evidence | `7628de01e6b0aa003b5237d0220823140c0f3f8e` |
| `validated/margin-policy-analysis.json` | `scripts/supplier-catalog/results/margin/margin-policy-analysis.json` | Evidence-bounded category/brand margin-policy analysis using only rows with positive COGS + configured MAP | `9034f8e32f46d3b99c52b8593423e95ed23af9c7` |
| `validated/map-pricing-optimization-report.json` | `scripts/supplier-catalog/results/map/map-pricing-optimization-report.json` | Deterministic MAP/margin optimization run report; useful as an audit snapshot, not source pricing truth | `585bbd26f064f90c1ee47f8c4c722f7288219f60` |

### Temporary pricing-only working extract

`temp/dtb_official_catalog_pricing_only.csv` is the temporary human-review pricing projection currently used by the review package. It is non-authoritative and intentionally contains only seven columns:

`Brand, Name, SKU, COG, Regular Price, Sale, MAP Price`

Current working-state characteristics:

- It contains 651 product/SKU rows at repository head `c6e62b7c68981bf6bd9f8110f61caeb7073fd0f5`.
- Blank COG, Sale, and MAP cells remain blank; the review tooling does not infer missing values.
- The checkpoint at that head added `LEVEL5 Entry to Automatic Finishing Set` (`LV5-ENTRY-FINISHING-SET`) with blank pricing fields.
- `temp/dtb_official_catalog_pricing_only.csv.bak` preserves the prior 650-row seven-column snapshot. It is historical backup material, not the active review source.
- The working extract is for human validation/filtering only and must not become an independent pricing system of record.

Canonical lineage remains anchored in `products/launch/official/dtb_official_catalog.csv`. Validated pricing audit files under `validated/` remain evidence/audit surfaces. If a human review identifies a correction, that correction must be applied through the owning catalog/WooCommerce pricing workflow rather than by treating the review document as runtime truth.

## Evaluated but intentionally excluded

- `docs/catalog/competitor-price-research.md` and competitor research outputs: useful market research, but competitor prices are not authoritative DTB supplier/MAP/cost evidence.
- `docs/reference/data/brands/drywall-tools-catalog-2026-08-09.csv`: a historical/derived pricing-strategy snapshot with `Needs Attention` states; useful for research but weaker than the canonical catalog and current committed pricing audits.
- `products/launch/official/dtb_official_catalog_content_seo.csv`: content/SEO derivative; copying it would duplicate the catalog without adding pricing authority.
- `products/launch/official/veeqo_inventory.csv` and `docs/reference/data/brands/veeqo_import.csv`: Veeqo inventory/fulfillment artifacts; Veeqo is not DTB selling-price authority.
- `docs/reference/data/TSW/TSW Product Data - DTB Brands.csv`: useful identity/dimension evidence but the committed CSV does not contain a pricing field.
- Pricing implementation files under `frontend/`, DTB MU plugins, and `scripts/`: they define transport, policy, validation, or mutation behavior, but are not pricing documents/data evidence and therefore are not duplicated here.

## Audit observations

At the audited repository state, the committed pricing-category audit reports 650 price-owning rows: 650 with regular price, 270 with COGS, 157 with configured MAP, and 140 with both MAP and COGS. It reports 493 rows missing MAP and 380 missing COGS. Those counts describe the committed audit snapshot, not the later 651-row temporary working extract.

The committed margin-policy analysis explicitly restricts policy evidence to price-owning rows with both positive COGS and configured MAP. The production pricing documentation similarly states that missing MAP is never inferred and that WooCommerce remains runtime price authority.

## Maintenance rule

When a copied source-evidence file changes, do not hand-edit its evidence copy here. Re-copy the exact reviewed source blob and update this manifest SHA/classification.

When the temporary seven-column pricing review CSV changes, regenerate the human-review artifacts with:

```bash
python docs/catalog_prices/generate_pricing_review.py
```

Generated HTML/XLSX review artifacts remain derivatives. Reviewer annotations must remain separate from price authority and must never be used as a parallel mutation path for commerce data.
