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

`temp/dtb_official_catalog_pricing_only.csv` is a temporary, non-authoritative price-owner view derived from the canonical launch catalog through the committed pricing audit. It intentionally omits variable parent rows that do not independently own prices and keeps only pricing/economic fields plus the identity and inheritance context required to interpret them.

Source lineage:

- Canonical source: `products/launch/official/dtb_official_catalog.csv` (`c1da3a5755f026717d31ea17ab6e4f13ba8715ec`).
- Deterministic projection source: `scripts/supplier-catalog/results/audit/pricing-data-gaps.csv` (`d776d56ada440097467c63b569d3260cb9aa53ac`).
- The temporary file reuses that validated projection blob byte-for-byte; no prices, costs, MAP values, product identities, or audit flags are modified.
- Included fields are `sku`, `name`, `type`, `parent`, `brand`, `effective_categories`, `regular_price`, `sale_price`, `cogs`, `map_price`, `missing_fields`, `map_violation`, and `regular_price_below_cogs`.
- The current projection contains the canonical catalog's 650 price-owning rows. Variable parents remain represented through each price owner's `parent`, effective brand, and effective category context rather than as separate non-priced records.
- This file is for temporary review/filtering only. It must be regenerated from the canonical catalog/audit when pricing data changes and must never be hand-maintained as an independent price source.

## Evaluated but intentionally excluded

- `docs/catalog/competitor-price-research.md` and competitor research outputs: useful market research, but competitor prices are not authoritative DTB supplier/MAP/cost evidence.
- `docs/reference/data/brands/drywall-tools-catalog-2026-08-09.csv`: a historical/derived pricing-strategy snapshot with `Needs Attention` states; useful for research but weaker than the canonical catalog and current committed pricing audits.
- `products/launch/official/dtb_official_catalog_content_seo.csv`: content/SEO derivative; copying it would duplicate the catalog without adding pricing authority.
- `products/launch/official/veeqo_inventory.csv` and `docs/reference/data/brands/veeqo_import.csv`: Veeqo inventory/fulfillment artifacts; Veeqo is not DTB selling-price authority.
- `docs/reference/data/TSW/TSW Product Data - DTB Brands.csv`: useful identity/dimension evidence but the committed CSV does not contain a pricing field.
- Pricing implementation files under `frontend/`, DTB MU plugins, and `scripts/`: they define transport, policy, validation, or mutation behavior, but are not pricing documents/data evidence and therefore are not duplicated here.

## Audit observations

At the audited repository state, the committed pricing-category audit reports 650 price-owning rows: 650 with regular price, 270 with COGS, 157 with configured MAP, and 140 with both MAP and COGS. It reports 493 rows missing MAP and 380 missing COGS. Those gaps are evidence gaps, not permission to infer values.

The committed margin-policy analysis explicitly restricts policy evidence to price-owning rows with both positive COGS and configured MAP. The production pricing documentation similarly states that missing MAP is never inferred and that WooCommerce remains runtime price authority.

## Maintenance rule

When a source file changes, do not hand-edit its copy here. Re-copy the exact reviewed source blob and update this manifest SHA/classification. If a source becomes stale or superseded, preserve provenance in Git history and replace the manifest entry with the current reviewed source rather than creating competing truth.
