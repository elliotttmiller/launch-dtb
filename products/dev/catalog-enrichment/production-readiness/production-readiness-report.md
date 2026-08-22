# DTB Official Catalog Production-Readiness Audit

Generated: `2026-08-22T11:55:11.788569+00:00`

Catalog: `products/launch/official/dtb_official_catalog.csv`  
Catalog SHA-256 (working bytes): `edaf3920230944bb23044a1e5bf1bbd15b58ad5f676a66d9b08321058afd0e6d`

Catalog SHA-256 (normalized LF): `9cd39f821485409c53d09306177487cee40a2a5a936882147c741e4e2253ea79`

## Verdict

**NOT READY FOR PRODUCTION IMPORT** — 54 blocker finding rows across 54 product SKUs.

The CSV is structurally valid, but it is not approved for production import until production URL and commerce-mode blockers are resolved and the approved result is revalidated.

## Evidence summary

- Rows: 755
- Columns: 127
- Structural validator: passed
- Owner rows: 444
- Variation rows: 311
- Total consolidated findings: 4901
- Blocker findings: 54
- Review findings: 4847
- Catalog file mutated by this audit: no
- Existing sibling backup matches the audited catalog: true

## Highest-volume findings

| Finding | Count |
| --- | ---: |
| `description_long_for_class` | 702 |
| `repetitive_language:job_site` | 429 |
| `compatibility_proposal_exact` | 422 |
| `claim_needs_evidence:oem_or_genuine` | 386 |
| `part_family_without_compatibility_or_replacement` | 314 |
| `claim_needs_evidence:industrial_grade` | 304 |
| `shippable_missing_weight` | 295 |
| `repetitive_language:downtime` | 275 |
| `claim_needs_evidence:precision_manufacturing` | 267 |
| `claim_needs_evidence:material_quality` | 263 |
| `claim_needs_evidence:guarantee` | 221 |
| `repetitive_language:professional_drywall` | 218 |
| `repetitive_language:vital` | 148 |
| `claim_needs_evidence:universal_fit` | 146 |
| `seo_title_long` | 87 |
| `claim_needs_evidence:performance_superlative` | 69 |
| `claim_needs_evidence:productivity_claim` | 68 |
| `production_image_candidate_invalid` | 53 |
| `repetitive_language:demanding_environment` | 42 |
| `shippable_missing_dimensions` | 34 |

## Previous-version consolidation

- Baseline commit: `563b05c6fbc2d1716055dfd7750a4d6516a848d3`
- Catalog-change commit: `157dbebe8cfb506b48f41381a91e42c6734339a2`
- Added/removed SKUs: 1/0
- Changed SKUs / field values: 754/3112
- Protected identifier changes: 307
- Field changes: {"Categories": 722, "Images": 753, "Meta: _dtb_category_key": 333, "Meta: _dtb_commerce_mode": 645, "Meta: _dtb_display_category_key": 323, "Meta: _dtb_product_kind": 307, "Meta: _includes_10_sku": 2, "Meta: _includes_11_sku": 2, "Meta: _includes_12_name": 1, "Meta: _includes_12_sku": 1, "Meta: _includes_14_name": 1, "Meta: _includes_14_sku": 1, "Meta: _includes_15_name": 1, "Meta: _includes_15_sku": 1, "Meta: _includes_3_sku": 3, "Meta: _includes_4_sku": 1, "Meta: _includes_5_sku": 1, "Meta: _includes_7_sku": 1, "Meta: _includes_8_sku": 3, "Meta: _includes_9_sku": 2, "Published": 1, "Regular price": 6, "Visibility in catalog": 1}

The historical enrichment baseline was taxonomy-only. The current comparison additionally includes the bounded P0 schematic-URL, attribute-default, and image-inheritance corrections; row count, schema, SKU population, and protected identifiers remain preserved. Current taxonomy preview reports zero changes and zero unresolved rows.

## Production evidence and ownership gaps

- Catalog image assignments: 1754 across 1021 unique URLs; all populated assignments still use `elliottm4.sg-host.com`.
- Production media candidates: 964 valid and 57 invalid by HTTP status/content type.
- Local media coverage: 1021 of 1021 catalog basenames present; 7 local files unused.
- Physical data coverage: 354 rows with weight; 160 rows with all dimensions; shipping class is unconfirmed catalog-wide.
- Generated Veeqo bootstrap projection comparison: 649 shared, 1 catalog-only, 0 projection-only; direct source-field differences: {"price": 84}.
- `veeqo_inventory.csv` is a generated bootstrap/import projection, not a live Veeqo export or synchronization authority. Do not import it over the already-configured live Veeqo catalog; validate bundle composition and stock through read-only live reconciliation.
- Compatibility research: 422 exact proposals across 236 parts/27 schematics; 2764 unresolved evidence rows remain.
- Content review: 1192 accuracy findings across 637 SKUs; 1962 editorial findings; no automatic copy application is approved.

## Exact bounded exception sets

- `production_image_candidate_invalid` (53 SKUs): `88TTE`, `CC`, `CFB11A`, `CFB15`, `CFB4`, `CFB4-7`, `CFB4-8`, `CFB5B`, `CFB7`, `CFB7-7`, `CFB7-8`, `CMH`, `CR`, `CR4`, `CT-SPROCKET`, `CT104`, `CT105`, `CT10A`, `CT112`, `CT13`, `CT132`, `CT42A`, `CT45`, `CT47`, `CT50`, `CT71`, `CT77`, `CT78`, `CT86`, `FA259`, `FA292`, `FA311`, `FA315`, `FFB16`, `FFB17`, `FFB32`, `HH9`, `HNS-DOOR-SPRING`, `HNS10`, `HNS10A`, `HNS15`, `HNS15-2`, `HNS15-3`, `HNS4`, `HNS4-2`, `HNS4-3`, `MH16`, `MH5`, `MH7`, `PCLT42`, `PCMT42`, `PHMP`, `SAT`
- `missing_image` (1 SKUs): `HH19`
- `structured_part_number_identity_mismatch` (1 SKUs): `PT-CP`
- `variation_gallery_equals_parent_without_inheritance` (29 SKUs): `4-777`, `42BH`, `4BH`, `5-777`, `5BH`, `6BH`, `BH9-3`, `BH9-4`, `BH9-42`, `BH9-5`, `BH9-6`, `CFB7-7`, `CFB7-8`, `CT29`, `CT3`, `CT4`, `CT71`, `D14-22`, `D18-30`, `D24-40`, `FFB11-10`, `FFB11-12`, `FFB11-8`, `FFB25-10`, `FFB25-12`, `FFB7`, `HFFB3`, `HFFB3A`, `HH17A`

## Mutation-workflow safety

The bounded P0 correction workflow created and hash-verified the required sibling `dtb_official_catalog.csv.bak` immediately before its write. The generic manifest apply runner remains unauthorized until its separate backup and semantic-validation gaps are addressed.
The sibling backup is the pre-P0 rollback snapshot and is therefore expected not to match the successfully mutated current catalog.
- `manifest_blank_erasure_risk`: The generic manifest applier can accept a blank proposed value and overwrite a populated catalog cell without field-specific evidence or an explicit clear-value operation.
- `mutation_runner_backup_contract_gap`: The runner uses a disposable rollback directory and invokes child appliers with --no-backup; it does not retain the user-required sibling dtb_official_catalog.csv.bak.
- `apply_taxonomy_validation_gap`: The non-taxonomy mutation path does not make the taxonomy validator a mandatory post-write gate.
- `generated_output_containment_gap`: The enrichment runner removes and recreates generated output paths without an explicit resolved-path containment assertion.
- `manifest_semantic_validation_gap`: The generic applier validates compatibility semantics but does not enforce equivalent media, shipping, commerce-mode, pricing, or editorial field contracts before writing.

## Required disposition order

1. Decide and document the canonical `_dtb_commerce_mode` mapping, including whether priced `quote_only` parts are intended to be purchasable.
2. Verify every referenced media asset on the production host, then replace staging-host URLs through an exact-SKU approved manifest.
3. Resolve objective price/MAP/publication blockers and confirm shipping/inventory ownership and runtime projections.
4. Resolve the single missing-image SKU using authoritative media.
5. Complete claim-accuracy review before editorial/SEO rewriting.
6. Review compatibility proposals; do not apply generated proposals without approval.
7. Re-run the full audit, structural validation, taxonomy preview, and catalog test suite before any WooCommerce import.

## Scope boundaries

This audit establishes CSV and repository evidence only. It does not prove WooCommerce import behavior, live payment/cart behavior, Veeqo synchronization, deployment, or production rendering.
