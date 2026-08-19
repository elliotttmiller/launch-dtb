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
2. catalog taxonomy metadata is normalized through the universal cross-brand taxonomy policy.

Do not add additional PowerShell wrappers for individual core stages unless they represent a genuinely separate operational workflow.

## Universal taxonomy contract

Catalog classification is based on product semantics, never manufacturer identity. Every brand uses the same mapping contract.

- `Brands` owns manufacturer identity. Brand names must not become category namespaces.
- `Meta: _dtb_category_key` is the broad DTB functional category.
- `Meta: _dtb_display_category_key` is the customer-facing functional class used for catalog discovery/filtering.
- The two fields are intentionally not always identical. For example, every brand's toolset maps to broad `taping` and display `toolsets`.
- Brand-specific or SKU-specific taxonomy maps are prohibited. New brands must work without taxonomy code changes.
- Unknown classifications remain unchanged and are surfaced for review rather than guessed.

Examples of universal mappings:

| Product/display semantic | Broad category key | Display category key |
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

The runtime backend `DTB_CategoryNormalizer` remains the application-side category resolver. Catalog tooling must stay semantically aligned with that contract; the frontend consumes the backend category/display-category DTOs and does not become a classification authority.

## Core internal modules

These files implement the unified run and are not separate product-data authorities:

- `official_catalog_schema.py` — canonical ordered schema and blocking validation rules.
- `validate_official_catalog.py` — CLI entrypoint for structural validation.
- `catalog_taxonomy_policy.py` — universal brand-independent broad/display taxonomy policy.
- `normalize_official_taxonomy.py` — preview/apply deterministic taxonomy normalizer used by the unified runner.
- `audit_official_catalog_enrichment.py` — actionable quality audit and universal taxonomy-consistency validation.
- `catalog_seo_pre_generation.py` — evidence-bounded SEO/content preparation.
- `clear_legacy_seo_canonicals.py` — narrow deterministic canonical safe-fix implementation used by the unified runner.
- `catalog-write-guard.ps1` — reusable validation/rollback guard for explicit catalog mutations.

## Specialized operational tools

Keep specialized tools separate when they have distinct authorities or failure modes, including:

- Veeqo shipping/inventory projection tooling;
- competitor price research and endpoint diagnostics;
- media cleanup/conversion/gallery synchronization;
- schematic mapping/reconciliation;
- WooCommerce export/gallery normalization.

These tools are not automatically part of the full enrichment run.

## Lifecycle rule

One-off repair/migration scripts should not accumulate indefinitely in this directory. After a narrowly scoped migration is completed and no active workflow imports or invokes it, remove the script and retain the durable contract in validation, normalization, tests, or documentation as appropriate.

Generated reports and research artifacts belong under `products/dev/` or another documented derived-data location, not in `scripts/catalog/`.
