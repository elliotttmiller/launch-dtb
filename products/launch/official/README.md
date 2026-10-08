# Official Launch Catalog

`dtb_official_catalog.csv` is the canonical launch catalog source under `products/`. WooCommerce owns the runtime product and variation records imported from this source.

## Authority boundaries

- The official CSV owns canonical launch product content and identifiers represented in the export.
- SKU, MPN/manufacturer SKU, GTIN, brand identity, taxonomy identity, compatibility relationships, and external IDs are protected business data.
- Veeqo remains authoritative for inventory, allocation, fulfillment, shipping, and tracking. The official catalog does not seed Veeqo stock quantities or stock value.
- Pricing follows WooCommerce/runtime pricing ownership; enrichment does not create another price authority.
- Derived research, comparison, and run-report files are not canonical product truth.

## Veeqo launch product import

Build the product setup import from the canonical catalog with:

```powershell
.\scripts\catalog\rebuild-veeqo-inventory-import.ps1 -Apply
```

The generated `veeqo_inventory.csv` includes every official catalog row and SKU regardless of WooCommerce publish status or product type. Variable parents and variations retain their source titles/options, and draft rows are included. The CSV intentionally omits stock quantities, Veeqo product IDs, and export-only stock-value columns; it creates product records without asserting starting inventory.

WooCommerce is the retail-price authority. When a catalog row has no regular or active sale price, the Veeqo import projection writes `0.00` to `sales_price` as an explicit placeholder for later pricing work. This placeholder exists only in the generated Veeqo CSV and does not write or assert a WooCommerce catalog price. The generator reports the placeholder count and a short SKU sample; replace these values with reviewed prices before treating them as customer-facing retail prices.

WooCommerce remains the price and checkout-tax authority. The Veeqo `tax_rate` import field is populated with Minnesota's 6.875% state general sales-tax rate as a decimal (`0.06875`), from the Minnesota Department of Revenue's [Taxes and Rates guide](https://www.revenue.state.mn.us/guide/taxes-and-rates). Minnesota transaction tax can also include applicable local taxes, and the final tax calculation remains transaction/destination-specific in WooCommerce.

The Veeqo product `description` and `cost_price` are projected from the official catalog's `Description` and `Cost of goods` fields. TSW supplier evidence may populate those fields only after a unique brand-scoped identifier match or an explicit reviewed mapping; unmatched or conflicting products remain unchanged.

## One official catalog run

Use:

```powershell
.\scripts\catalog\run-official-catalog-enrichment.ps1
```

The default run is non-mutating and performs:

1. structural validation;
2. actionable enrichment audit;
3. SKU/family remediation manifest generation;
4. evidence-bounded SEO/content preparation;
5. unified run manifest generation.

Outputs are written under `products/dev/catalog-enrichment/` and ignored by Git.

For reviewed deterministic safe fixes, use the same command explicitly:

```powershell
.\scripts\catalog\run-official-catalog-enrichment.ps1 -ApplySafeFixes
```

The current safe fix clears stale explicit PDP canonical overrides so the React storefront can own `/products/:slug`. The run records the mutation and validates the catalog afterward.

## Actionable audit policy

The remediation CSV is deliberately narrower than raw completeness metrics.

It creates work for:

- missing item-level MPNs;
- missing customer-facing media;
- classification/taxonomy inconsistencies on rows that own classification;
- compatibility/replacement research at the simple-part or variable-part-family level.

It does not create default remediation work merely because:

- a variable family parent has no MPN while its variations own item identifiers;
- GTIN is absent and no authoritative requirement/source is established;
- a variation inherits category/display-category from its parent;
- a child part variation can inherit or refine compatibility after its family is researched.

GTIN is retained as an informational coverage metric.

## Structural contract

The canonical schema is owned by `scripts/catalog/official_catalog_schema.py` and executed by `scripts/catalog/validate_official_catalog.py`.

It validates the ordered schema, SKU uniqueness, synchronized brand fields, manufacturer identifiers, structured-spec JSON shape, variation/parent integrity, default variations, and reviewed include-name gaps.

## Enrichment rules

Use this sequence:

1. **Clean** demonstrated errors and duplicate/inconsistent representations.
2. **Normalize** deterministic values and controlled vocabularies.
3. **Identify actionable gaps** against actual B2C storefront/catalog requirements.
4. **Acquire evidence** only for those gaps.
5. **Validate** identity, relationships, units, taxonomy, and cross-field consistency.
6. **Write back** only evidence-backed facts to the canonical catalog.
7. **Rerun** the unified catalog pipeline.

A missing value is preferable to an invented product fact. Fuzzy matching, OCR, extraction, competitor data, and generated text can produce candidates but cannot silently rewrite protected identifiers or compatibility.

## Structured specifications

`Meta: _dtb_specs_json` is the canonical customer-facing structured-spec payload. It is a JSON array; each entry requires a non-empty `label` and either a non-empty `value` or non-empty `items` array.

Do not duplicate equivalent attributes merely to increase completeness.

## Product-specific changes

Every row-level enrichment must be attributable to product-specific evidence. Methodology articles and enrichment research define process; they do not establish a DTB SKU's factual value.
