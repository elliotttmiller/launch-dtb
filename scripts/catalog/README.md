# Catalog Tooling

## Production entrypoint

Use one command for routine official-catalog quality/enrichment preparation:

```powershell
.\scripts\catalog\run-official-catalog-enrichment.ps1
```

Default mode is non-mutating. To apply reviewed deterministic safe fixes before the audit/preparation stages:

```powershell
.\scripts\catalog\run-official-catalog-enrichment.ps1 -ApplySafeFixes
```

`-ApplySafeFixes` applies only bounded deterministic mutations before revalidation:

1. stale explicit SEO canonical overrides are cleared so the active storefront route remains canonical authority;
2. only mutation-safe deterministic taxonomy mismatches are normalized through the universal cross-brand taxonomy policy.

Ambiguous taxonomy and display-only findings remain review-only. Do not add additional PowerShell wrappers for individual core stages unless they represent a genuinely separate operational workflow.

## Universal taxonomy contract

Catalog classification is based on product semantics, never manufacturer identity. Every brand uses the same mapping contract.

- `Brands` owns manufacturer identity. Brand names must not become category namespaces.
- `Meta: _dtb_category_key` is the broad DTB functional category.
- `Meta: _dtb_display_category_key` is the customer-facing discovery/filtering class and may also represent a cross-cutting family or merchandising grouping.
- Broad category, display category, product family, and manufacturer are separate dimensions.
- Brand-specific or SKU-specific taxonomy maps are prohibited. New brands must work without taxonomy code changes.
- Unknown or ambiguous classifications remain unchanged and are surfaced for review rather than guessed.

The runtime backend `DTB_CategoryNormalizer` remains the application-side category resolver. Catalog tooling must stay semantically aligned with that contract; the frontend consumes backend category/display-category DTOs and does not become a classification authority.

## Core internal modules

These files implement the unified run and are not separate product-data authorities:

- `official_catalog_schema.py` — canonical ordered schema and blocking validation rules.
- `validate_official_catalog.py` — CLI entrypoint for structural validation.
- `catalog_taxonomy_policy.py` — universal brand-independent taxonomy validation/mutation policy.
- `normalize_official_taxonomy.py` — preview/apply deterministic taxonomy normalizer used by the unified runner.
- `audit_official_catalog_enrichment.py` — actionable quality audit and taxonomy review classification.
- `catalog_seo_pre_generation.py` — evidence-bounded SEO/content preparation.
- `clear_legacy_seo_canonicals.py` — narrow deterministic canonical safe-fix implementation used by the unified runner.
- `catalog-write-guard.ps1` — reusable validation/rollback guard for explicit catalog mutations.

## Schematic compatibility proposal workflow

Compatibility enrichment is a separate evidence workflow because it depends on authoritative schematic identity and can create many-to-many product relationships. The routine enrichment runner measures the gap but does not invent or write compatibility.

Prepare Columbia proposals with:

```powershell
python .\scripts\catalog\prepare_schematic_compatibility_proposals.py
```

The script is read-only and combines:

1. canonical product identity from `products/launch/official/dtb_official_catalog.csv`;
2. exact part-to-schematic occurrences from `products/launch/universal_parts/references/all_brands_schematic_parts_master.csv`;
3. purchasable product-to-schematic identity from `frontend/src/data/productSchematicLinks.generated.js`.

It never fuzzy-matches part names. Tool variations collapse to a valid non-part family parent where possible. Proposals are classified as:

- `proposal_exact` — exact canonical part SKU plus one canonical tool family share a schematic identity;
- `review_multi_tool` — the schematic maps to multiple canonical tool families;
- `review_no_tool` — the part occurrence is known but no canonical non-part tool SKU resolves for that schematic;
- `already_populated` — the canonical part already contains compatibility/replacement metadata.

Generated artifacts live under:

```text
products/dev/catalog-enrichment/compatibility/
├── schematic-compatibility-proposals.csv
└── schematic-compatibility-summary.json
```

These are proposals only. A separate reviewed apply step must validate the target tool SKUs and allowlist only `Meta: _dtb_compatible_tool_skus` / `Meta: _dtb_replacement_part_for` before catalog mutation.

## Specialized operational tools

Keep specialized tools separate when they have distinct authorities or failure modes, including:

- schematic compatibility proposal/reconciliation;
- Veeqo shipping/inventory projection tooling;
- competitor price research and endpoint diagnostics;
- media cleanup/conversion/gallery synchronization;
- schematic mapping/reconciliation;
- WooCommerce export/gallery normalization.

These tools are not automatically part of the full enrichment run.

## Lifecycle rule

One-off repair/migration scripts should not accumulate indefinitely in this directory. After a narrowly scoped migration is completed and no active workflow imports or invokes it, remove the script and retain the durable contract in validation, normalization, tests, or documentation as appropriate.

Generated reports and research artifacts belong under `products/dev/` or another documented derived-data location, not in `scripts/catalog/`.
