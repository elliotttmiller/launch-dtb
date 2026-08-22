# DTB Official Catalog Production-Readiness Audit

Generated: `2026-08-22T08:21:10.102763+00:00`  
Catalog: `products/launch/official/dtb_official_catalog.csv`  
Catalog SHA-256 (working bytes): `135fe0ec8d4f53dca485b2af12b2949de950916576b0325e6021dfba10994b4d`  
Catalog SHA-256 (normalized LF): `667b3929e049f67a284f7db74d190407e28c4829212be7080dc7844360347758`

## Verdict

**NOT READY FOR PRODUCTION IMPORT** — 1424 blocker finding rows across 755 product SKUs.

The CSV is structurally valid, but it is not approved for production import until production URL and commerce-mode blockers are resolved and the approved result is revalidated.

## Evidence summary

- Rows: 755
- Columns: 127
- Structural validator: passed
- Owner rows: 442
- Variation rows: 313
- Total consolidated findings: 6102
- Blocker findings: 1424
- Review findings: 4678
- Catalog file mutated by this audit: no
- Existing sibling backup matches the audited catalog: false

## Highest-volume findings

| Finding | Count |
| --- | ---: |
| `staging_or_local_url` | 754 |
| `description_long_for_class` | 702 |
| `repetitive_language:job_site` | 429 |
| `compatibility_proposal_exact` | 422 |
| `claim_needs_evidence:oem_or_genuine` | 386 |
| `quote_only_with_price` | 358 |
| `part_family_without_compatibility_or_replacement` | 314 |
| `claim_needs_evidence:industrial_grade` | 304 |
| `repetitive_language:downtime` | 275 |
| `claim_needs_evidence:precision_manufacturing` | 267 |
| `unsupported_commerce_mode` | 263 |
| `claim_needs_evidence:material_quality` | 263 |
| `claim_needs_evidence:guarantee` | 221 |
| `repetitive_language:professional_drywall` | 218 |
| `repetitive_language:vital` | 148 |
| `claim_needs_evidence:universal_fit` | 146 |
| `shippable_missing_weight` | 126 |
| `seo_title_long` | 87 |
| `claim_needs_evidence:performance_superlative` | 69 |
| `claim_needs_evidence:productivity_claim` | 68 |

## Previous-version consolidation

- Baseline commit: `401abd8e7339a09093de24da03442912eaf20e60`
- Catalog-change commit: `843491aef56adbbedf3a7510eef9f111fdc10e5f`
- Added/removed SKUs: 0/0
- Changed SKUs / field values: 377/655
- Protected identifier changes: 0
- Field changes: {"Categories": 367, "Meta: _dtb_category_key": 114, "Meta: _dtb_display_category_key": 174}

The prior catalog enhancement was a taxonomy-only consolidation: row count, schema, SKU population, and protected identifiers were preserved. Current taxonomy preview reports zero changes and zero unresolved rows.

## Production evidence and ownership gaps

- Catalog image assignments: 1751 across 1016 unique URLs; all populated assignments still use `elliottm4.sg-host.com`.
- Production media candidates: 1006 valid and 10 invalid by HTTP status/content type.
- Local media coverage: 1016 of 1016 catalog basenames present; 7 local files unused.
- Physical data coverage: 353 rows with weight; 159 rows with all dimensions; shipping class is unconfirmed catalog-wide.
- Veeqo identity comparison: 649 shared, 0 catalog-only, 0 Veeqo-only; direct source-field differences: {"price": 84}.
- Veeqo rebuild preview passed structural checks and would change the projection; runtime inventory synchronization remains outside CSV-only proof.
- Compatibility research: 422 exact proposals across 236 parts/27 schematics; 2764 unresolved evidence rows remain.
- Content review: 1192 accuracy findings across 637 SKUs; 1962 editorial findings; no automatic copy application is approved.

## Exact bounded exception sets

- `production_image_candidate_invalid` (18 SKUs): `4-755`, `42BH`, `4BH`, `5BH`, `6BH`, `8034TT`, `COL-180-GRIP-FLAT-BOX-HANDLE`, `COL-BOX-FILLER`, `CR`, `LV5-NAIL-SPOTTER`, `PT-10FB`, `PT-CT42`, `PT-FB`, `S2X-A-3852`, `SP-S2X-A`, `TBBF`, `TT-FLAT-BOX-HANDLE`, `TTCFS-M`
- `nonpositive_gross_margin` (6 SKUs): `5.5FBB`, `BH1`, `COBCRE`, `CR1`, `CT120`, `CT77`
- `include_target_absent` (12 SKUs): `4-600P`, `4-677P`, `TTBBS`, `TTBTS`, `TTCFS`, `TTCFS-M`, `TTPFB`, `TTPPS`, `TTPPS-EF`, `TTPSS`, `TTSFS`, `TTSFS-2`
- `invalid_parent_attribute_default` (2 SKUs): `AH8-CLIP`, `AH9-CLIP`
- `missing_image` (1 SKUs): `HH19`
- `structured_part_number_identity_mismatch` (1 SKUs): `PT-CP`
- `inherit_parent_image_on_nonvariation` (2 SKUs): `TTSFS`, `TTSFS-2`
- `variation_gallery_equals_parent_without_inheritance` (29 SKUs): `4-777`, `42BH`, `4BH`, `5-777`, `5BH`, `6BH`, `BH9-3`, `BH9-4`, `BH9-42`, `BH9-5`, `BH9-6`, `CFB7-7`, `CFB7-8`, `CT29`, `CT3`, `CT4`, `CT71`, `D14-22`, `D18-30`, `D24-40`, `FFB11-10`, `FFB11-12`, `FFB11-8`, `FFB25-10`, `FFB25-12`, `FFB7`, `HFFB3`, `HFFB3A`, `HH17A`

## Mutation-workflow safety

No catalog mutation is authorized through the generic apply runner until its backup and semantic-validation gaps are addressed. A retained sibling `dtb_official_catalog.csv.bak` must be created and verified immediately before any approved write.
The existing ignored sibling backup predates this audit and does not match the current catalog hash; this audit did not overwrite it because it made no catalog change.
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
