# Official Launch Catalog

`dtb_official_catalog.csv` is the canonical launch catalog source under `products/`.
WooCommerce owns the runtime product and variation records imported from this source.

## Authority boundaries

- `dtb_official_catalog.csv` owns canonical launch product content and identifiers represented in this export.
- SKU, MPN/manufacturer SKU, GTIN, brand identity, taxonomy identity, compatibility relationships, and external IDs are protected business data. Do not infer or rewrite them as incidental cleanup.
- Veeqo remains authoritative for inventory, allocation, fulfillment, shipping, and tracking. Files in this directory that project Veeqo data do not make the catalog authoritative for inventory.
- Pricing artifacts must follow the repository's pricing/commerce ownership. Do not treat catalog enrichment as permission to create an alternate price authority.
- Derived, research, deduplicated, comparison, or run-report files are not automatically canonical.

## Catalog quality workflow

Run the deterministic full preparation workflow with:

```powershell
.\scripts\catalog\run-official-catalog-enrichment.ps1
```

The command is non-mutating and performs:

1. structural validation;
2. enrichment-quality audit;
3. SKU-level remediation manifest generation;
4. evidence-bounded content/SEO preparation.

Generated outputs live under `products/dev/catalog-enrichment/` and are ignored by Git. `run-summary.json` records the repository commit, source catalog SHA-256, timestamps, stage outcomes, remediation counts, blocking findings, and relative artifact paths.

### Structural validation

Run independently with:

```powershell
python scripts/catalog/validate_official_catalog.py
```

This is the blocking catalog contract. It validates the canonical ordered schema, SKU uniqueness, synchronized brand fields, protected manufacturer identifiers, structured-spec JSON shape, variation/parent integrity, and reviewed include-name gaps. It does not enrich or mutate the catalog.

### Enrichment-quality audit

Run independently with:

```powershell
python scripts/catalog/audit_official_catalog_enrichment.py
```

The default scope is published B2C storefront products. Use `--all` to include unpublished rows.

The audit is non-blocking. It reports aggregate and segmented coverage plus SKU-level work items for:

- product identity and classification coverage;
- MPN and optional GTIN research;
- customer-facing media gaps;
- structured specification shape;
- replacement-part/compatible-tool relationship coverage;
- compatibility references that do not resolve to a canonical catalog SKU.

Variation rows are segmented separately so inherited parent taxonomy/display context is not automatically mislabeled as a product-level defect.

## Canonical PDP URL policy

The React storefront owns product-detail canonical URLs at `/products/:slug`. Normal published/indexable PDPs should use the runtime-derived canonical rather than an explicit `Meta: _dtb_seo_canonical` override.

Preview stale/redundant canonical cleanup with:

```powershell
.\scripts\catalog\clear-legacy-seo-canonicals.ps1
```

Apply only after reviewing the report:

```powershell
.\scripts\catalog\clear-legacy-seo-canonicals.ps1 -Apply
```

The apply workflow creates a rollback snapshot and clears only the explicit canonical override for eligible PDP rows. It does not modify slugs, identifiers, taxonomy, product copy, prices, or compatibility.

## Enrichment rules

Use this sequence when improving the catalog:

1. **Clean** existing records: correct demonstrated errors, duplicates, and inconsistent representations.
2. **Normalize** deterministic representations: attribute names, units, booleans, and controlled values.
3. **Identify gaps** against the product/category requirements actually used by the DTB B2C storefront.
4. **Enrich from evidence**: add missing facts only when supported by an appropriate source.
5. **Validate** identifiers, relationships, units, variation structure, and cross-field consistency.
6. **Write back to the canonical catalog** rather than hiding durable product facts in downstream transforms.

A missing value is preferable to an invented technical fact. Fuzzy matching, OCR, extraction, or generative assistance may identify candidates, but none of those mechanisms may silently rewrite protected identifiers or compatibility relationships.

## Structured specifications

`Meta: _dtb_specs_json` is the canonical structured-spec payload consumed by the storefront. It is a JSON array. Each customer-facing entry should have a non-empty `label` and either a non-empty `value` or a non-empty `items` array.

Do not duplicate the same customer-facing specification under multiple labels merely to increase completeness. Normalize equivalent attribute names before adding additional values.

## Changes

Any row-level enrichment must be attributable to product-specific evidence. Methodology articles, glossary definitions, competitor copy, and inferred similarities are research inputs; they are not authoritative evidence for changing a DTB product fact.
