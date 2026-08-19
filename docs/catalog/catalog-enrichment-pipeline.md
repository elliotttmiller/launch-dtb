# Official Catalog Enrichment Pipeline

## Production command

Use one command for the routine official-catalog run:

```powershell
.\scripts\catalog\run-official-catalog-enrichment.ps1
```

Default mode is deterministic and non-mutating:

```text
dtb_official_catalog.csv
  -> structural validation
  -> actionable enrichment audit
  -> catalog-remediation.csv
  -> SEO/content evidence preparation
  -> run-summary.json
```

When reviewed deterministic safe fixes are required, use the same entrypoint explicitly:

```powershell
.\scripts\catalog\run-official-catalog-enrichment.ps1 -ApplySafeFixes
```

`-ApplySafeFixes` is opt-in because it may mutate the canonical CSV. The safe-fix sequence is bounded and explicit:

```text
structural validation
  -> stale SEO canonical cleanup
  -> deterministic taxonomy safe fixes only
  -> structural revalidation
  -> enrichment audit
  -> SEO/content preparation
```

The two mutation stages write separate reports: `seo-canonical-safe-fixes.json` and `taxonomy-safe-fixes.json`.

## Ownership

- `products/launch/official/dtb_official_catalog.csv` is the canonical launch catalog.
- WooCommerce owns runtime commerce product/variation records.
- Veeqo owns inventory, allocation, fulfillment, shipping, and tracking.
- Pricing, competitor research, media processing, schematics, and supplier acquisition remain separate workflows.
- `scripts/catalog/` contains deterministic catalog tooling only; generated run artifacts live under `products/dev/catalog-enrichment/` and are ignored by Git.

## Universal taxonomy contract

Taxonomy is universal across manufacturers. Brand identity is not a classification input.

- `Brands` owns manufacturer identity.
- `Meta: _dtb_category_key` is the broad DTB functional category.
- `Meta: _dtb_display_category_key` is a customer-facing discovery/filtering class and may also represent a cross-cutting merchandising or product-family grouping.
- Broad category, display category, product family, and manufacturer are separate dimensions.
- A deterministic product semantic maps identically across Columbia Tools, TapeTech, LEVEL5, Platinum, SurPro, Dura-Stilts, and future brands.
- Brand-specific and SKU-specific taxonomy mapping rules are prohibited.
- Unknown or ambiguous classifications remain unchanged and enter review instead of being guessed.

Deterministic examples:

| Semantic | Broad category | Display category |
| --- | --- | --- |
| `product_kind=toolset` | `taping` | `toolsets` |
| automatic taper | `taping` | `automatic_tapers` |
| finishing box | `finishing` | `finishing_boxes` |
| handle | `handles` | `handles` |
| pump | `mudboxes` | `pumps` |
| corner tool | `corner` | `corner_tools` |
| compound tube | `corner` | `compound_tubes` |
| `product_kind=part` | `parts` | `parts` |
| stilts | `stilts` | `stilts` |

Cross-cutting display values such as `predator_family`, `toolsets` without `product_kind=toolset`, and `accessories` do **not** independently determine the broad functional category.

`scripts/catalog/catalog_taxonomy_policy.py` owns the deterministic catalog-tooling policy. `scripts/catalog/normalize_official_taxonomy.py` previews/applies only mutation-safe results. The runtime `DTB_CategoryNormalizer` remains the application-side resolver and must stay semantically aligned. The React storefront consumes backend category/display-category DTOs; it does not own classification truth.

## Taxonomy finding classes

The audit separates taxonomy findings by mutation safety:

- `taxonomy_deterministic_mismatch` — a stronger semantic policy establishes the broad category and the current broad category disagrees. This is the **only taxonomy finding class writable by `-ApplySafeFixes`**.
- `taxonomy_ambiguous_review` — the display/family grouping is cross-cutting and cannot establish the broad category. Review only.
- `display_taxonomy_mismatch` — the broad category already matches deterministic policy but the display value differs or is missing. Review only; the safe-fix runner does not write it.

This distinction prevents customer-facing groupings from silently becoming a second authority for functional taxonomy.

## Core stages

### Structural validation

`scripts/catalog/validate_official_catalog.py` and `official_catalog_schema.py` enforce the blocking schema and identity contract.

### Actionable enrichment audit

`scripts/catalog/audit_official_catalog_enrichment.py` reports quality without manufacturing missing data.

The default remediation queue includes only actionable work:

- missing item-level MPN where the row owns an item identifier;
- missing customer-facing image;
- taxonomy findings classified by mutation safety;
- compatibility/replacement research once per simple part or variable part family.

The audit intentionally does **not** create default work items for:

- variable-family parents without an MPN when their child items own the manufacturer identifiers;
- missing GTIN where no catalog policy requires it;
- variation category/display-category blanks inherited from the parent;
- child part variations when compatibility can first be researched at the family level.

GTIN remains a coverage metric and may be researched separately when authoritative data is available.

Headline classification coverage is calculated against category-owning rows, not variations. Item-MPN coverage excludes variable family parents.

### SEO/content preparation

`scripts/catalog/catalog_seo_pre_generation.py` remains non-generative and non-mutating. It prepares evidence packets and separates findings into:

- `blocking` — deterministic routing/canonical conflicts;
- `accuracy_review` — claims requiring authoritative evidence;
- `evidence_review` — insufficient structured evidence;
- `editorial_review` — length, repetition, metadata, and copy-quality observations.

Editorial findings do not block the catalog pipeline.

## Outputs

`products/dev/catalog-enrichment/` contains disposable run artifacts:

- `catalog-enrichment-audit.json`
- `catalog-remediation.csv`
- `seo-canonical-safe-fixes.json` when `-ApplySafeFixes` is used
- `taxonomy-safe-fixes.json` when `-ApplySafeFixes` is used
- `seo-pre-generation/generation-packets.jsonl`
- `seo-pre-generation/pre-generation-findings.csv`
- `seo-pre-generation/pre-generation-summary.json`
- `run-summary.json`

`taxonomy-safe-fixes.json` records the writable deterministic changes plus counts for review-only `taxonomy_ambiguous_review` and `display_taxonomy_mismatch` rows that were intentionally not mutated.

`run-summary.json` is the operational manifest. It records the input catalog SHA-256, repository commit, timestamps, stage results, separate canonical/taxonomy safe-fix outcomes, actionable remediation counts, operational coverage dimensions, GTIN/media/spec coverage, compatibility relationship counts, and SEO workflow counts. It does not expose an opaque A/B catalog-readiness grade.

## External evidence

Run external integrations only when the remediation queue requires their evidence domain:

```text
supplier/manufacturer source
  -> evidence
  -> deterministic identity match
  -> review if ambiguous
  -> field-specific apply
  -> structural validation
  -> rerun unified enrichment pipeline
```

Competitor pricing remains research evidence only. Supplier access remains field-scoped. Media processing remains a media workflow. Veeqo live inventory remains Veeqo-owned.

## Mutation rule

A catalog mutation is allowed only when:

1. the field belongs in the canonical catalog;
2. the source/policy is authoritative for that field;
3. the target SKU/product resolves deterministically;
4. the classification is not ambiguous;
5. writable fields are allowlisted;
6. missing source values cannot erase known values accidentally;
7. a rollback path exists for destructive/bulk changes;
8. the canonical validator passes afterward; and
9. the operation emits an auditable result.

Fuzzy matching, OCR, extraction, competitor copy, generated text, and cross-cutting display groupings may produce candidates; none may silently become protected product truth.

## Specialized tools retained outside the core run

The following concerns deliberately remain separate because they have different authorities and failure modes:

- supplier/Veeqo shipping projections;
- competitor price research and endpoint diagnostics;
- media cleanup/conversion/gallery synchronization;
- schematic reconciliation/mapping;
- WooCommerce export normalization.

Do not fold these into one unattended enrichment command.
