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
  -> universal cross-brand taxonomy normalization
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
- Brand names must not create per-manufacturer category namespaces.
- `Meta: _dtb_category_key` is the broad DTB functional category.
- `Meta: _dtb_display_category_key` is the customer-facing functional class used for catalog discovery and filtering.
- A given product semantic maps to the same broad/display pair for Columbia Tools, TapeTech, LEVEL5, Platinum, SurPro, Dura-Stilts, and future brands.
- Brand-specific and SKU-specific taxonomy mapping rules are prohibited.
- Unknown classifications remain unchanged and enter review instead of being guessed.

Examples:

| Semantic | Broad category | Display category |
| --- | --- | --- |
| toolset | `taping` | `toolsets` |
| automatic taper | `taping` | `automatic_tapers` |
| finishing box | `finishing` | `finishing_boxes` |
| handle | `handles` | `handles` |
| pump | `mudboxes` | `pumps` |
| corner tool | `corner` | `corner_tools` |
| compound tube | `corner` | `compound_tubes` |
| replacement part | `parts` | `parts` |
| stilts | `stilts` | `stilts` |

`scripts/catalog/catalog_taxonomy_policy.py` owns the deterministic catalog-tooling policy. `scripts/catalog/normalize_official_taxonomy.py` previews/applies it. The runtime `DTB_CategoryNormalizer` remains the application-side resolver and must stay semantically aligned. The React storefront consumes backend category/display-category DTOs; it does not own classification truth.

## Core stages

### Structural validation

`scripts/catalog/validate_official_catalog.py` and `official_catalog_schema.py` enforce the blocking schema and identity contract.

### Actionable enrichment audit

`scripts/catalog/audit_official_catalog_enrichment.py` reports quality without manufacturing missing data.

The default remediation queue includes only actionable work:

- missing item-level MPN where the row owns an item identifier;
- missing customer-facing image;
- universal taxonomy-mapping inconsistency on classification-owning rows;
- compatibility/replacement research once per simple part or variable part family.

The audit intentionally does **not** create default work items for:

- variable-family parents without an MPN when their child items own the manufacturer identifiers;
- missing GTIN where no catalog policy requires it;
- variation category/display-category blanks inherited from the parent;
- child part variations when compatibility can first be researched at the family level.

GTIN remains a coverage metric and may be researched separately when authoritative data is available.

Headline classification coverage is calculated against category-owning rows, not variations. Item-MPN coverage excludes variable family parents.

Taxonomy consistency is evaluated through the same brand-independent policy used by the deterministic normalizer. For example, every `product_kind=toolset` expects broad `category_key=taping` and `display_category_key=toolsets`, regardless of manufacturer.

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
2. the source is authoritative for that field;
3. the target SKU/product resolves deterministically;
4. writable fields are allowlisted;
5. missing source values cannot erase known values accidentally;
6. a rollback path exists for destructive/bulk changes;
7. the canonical validator passes afterward; and
8. the operation emits an auditable result.

Fuzzy matching, OCR, extraction, competitor copy, and generated text may produce candidates; none may silently become protected product truth.

## Specialized tools retained outside the core run

The following concerns deliberately remain separate because they have different authorities and failure modes:

- supplier/Veeqo shipping projections;
- competitor price research and endpoint diagnostics;
- media cleanup/conversion/gallery synchronization;
- schematic reconciliation/mapping;
- WooCommerce export normalization.

Do not fold these into one unattended enrichment command.
