# Catalog Tooling

## Production entrypoint

Use one command for routine official-catalog quality/enrichment preparation:

```powershell
.\scripts\catalog\run-official-catalog-enrichment.ps1
```

Default mode is non-mutating. To apply only reviewed deterministic safe fixes before the audit/preparation stages:

```powershell
.\scripts\catalog\run-official-catalog-enrichment.ps1 -ApplySafeFixes
```

Do not add additional PowerShell wrappers for individual core stages unless they represent a genuinely separate operational workflow.

## Core internal modules

These files implement the unified run and are not separate product-data authorities:

- `official_catalog_schema.py` — canonical ordered schema and blocking validation rules.
- `validate_official_catalog.py` — CLI entrypoint for structural validation.
- `audit_official_catalog_enrichment.py` — actionable quality audit and remediation manifest.
- `catalog_seo_pre_generation.py` — evidence-bounded SEO/content preparation.
- `clear_legacy_seo_canonicals.py` — narrow deterministic safe-fix implementation used by the unified runner.
- `catalog-write-guard.ps1` — reusable validation/rollback guard for explicit catalog mutations.

## Specialized operational tools

Keep specialized tools separate when they have distinct authorities or failure modes, including:

- Veeqo shipping/inventory projection tooling;
- competitor price research and endpoint diagnostics;
- media cleanup/conversion/gallery synchronization;
- category architecture normalization;
- schematic mapping/reconciliation;
- WooCommerce export/gallery normalization.

These tools are not automatically part of the full enrichment run.

## Lifecycle rule

One-off repair/migration scripts should not accumulate indefinitely in this directory. After a narrowly scoped migration is completed and no active workflow imports or invokes it, remove the script and retain the durable contract in validation, normalization, tests, or documentation as appropriate.

Generated reports and research artifacts belong under `products/dev/` or another documented derived-data location, not in `scripts/catalog/`.
