# Catalog Navigation Contract

## Authority

WooCommerce `product_cat` is the runtime source of truth for customer-facing product navigation hierarchy.

`products/launch/official/dtb_official_catalog.csv` is the **only canonical launch catalog CSV**. It defines the WooCommerce import hierarchy and preserves commerce/product identity. WooCommerce owns the resulting runtime products and category terms.

The React storefront consumes backend navigation/facet contracts. It must not classify products into systems/categories from product names, SKU patterns, brands, product families, or an independent hardcoded category map.

`Meta: _dtb_category_key` and `Meta: _dtb_display_category_key` are compatibility/merchandising facets derived from the canonical navigation identity. They are not parallel primary taxonomies.

Brand and product family are orthogonal dimensions. Brand names and family names such as Predator must never be inserted as `product_cat` hierarchy nodes.

## Canonical hierarchy

```text
Drywall Finishing Tools
  Automatic Taping Tools
    Automatic Tapers
    Flat Boxes
    Flat Box Handles
    Angle Heads
    Corner Rollers
    Nail Spotters
    Loading Pumps
    Box Fillers
    Goosenecks
    Automatic Taping Tool Sets
    Extendable Handles
    Fixed Handles
    Tool Cases
    Smoothing Blades
    Accessories & Adapters
  Semi-Automatic Taping Tools
    Semi-Automatic Tapers
    Compound Tubes
    Compound Applicators
    Corner Flushers
  Parts

Stilts & Accessories
  Stilts
  Accessories
    Extension Tubes & Clamps
    Legs & Brackets
    Hardware
    Springs & Bearings
    Straps & Buckles
    Soles & Floor Plates
  Parts
```

The universal registry for this hierarchy is `scripts/catalog/catalog_taxonomy_policy.py`. It is brand-independent. A new manufacturer using an existing functional product class requires no taxonomy code change.

## Canonical metadata derivation

Each canonical navigation taxon defines exactly one compatibility tuple:

```text
Woo product_cat path
  -> Meta: _dtb_category_key
  -> Meta: _dtb_display_category_key
```

Examples:

```text
... > Flat Boxes          -> finishing -> finishing_boxes
... > Flat Box Handles    -> handles   -> handles
... > Angle Heads         -> corner    -> corner_tools
... > Loading Pumps       -> mudboxes  -> pumps
... > Compound Tubes      -> corner    -> compound_tubes
... > Parts               -> parts     -> parts
Stilts & Accessories > Stilts -> stilts -> stilts
```

Metadata slugs use lowercase snake_case. Hyphenated historical values such as `corner-tools`, `finishing-boxes`, and `nail-spotters` are migration inputs, not canonical outputs.

## Parent / variation contract

A variable parent owns navigation classification. Every variation inherits the parent's exact:

- `Categories`
- `Meta: _dtb_category_key`
- `Meta: _dtb_display_category_key`

Variation-specific category drift is invalid. If two choices require materially different navigation identities, they are not valid variations of one product family.

## Official catalog consolidation

`dtb_official_catalog_content_seo.csv` is a legacy secondary content artifact, not a catalog authority. Consolidation uses `dtb_official_catalog.csv` as the base and may import only allowlisted editorial fields when protected identity matches:

- `Short description`
- `Description`
- `Meta: _dtb_seo_title`
- `Meta: _dtb_seo_description`
- `Meta: _dtb_seo_focus_kw`

The secondary CSV may never create products or overwrite SKU, GTIN, MPN, brand, slug, category, parent/variation identity, canonical URL, noindex, pricing, inventory, media, specs, compatibility, or schematic identity.

After a successful validated consolidation the duplicate content/SEO CSV is retired so `products/launch/official/` contains one catalog authority.

Preview:

```powershell
python .\scripts\catalog\consolidate_official_catalog.py
```

Validated apply and duplicate-source retirement:

```powershell
python .\scripts\catalog\consolidate_official_catalog.py --apply --retire-seo-source
```

Apply refuses to run while any product has ambiguous/unrecognized navigation taxonomy. It creates the standard catalog rollback snapshot, writes atomically, validates the 127-column canonical schema, and verifies taxonomy convergence before retiring the secondary source.

## Facets API and frontend

`GET /wp-json/dtb/v1/catalog/facets` derives `navigationGroups` from active WooCommerce `product_cat` ancestry. Replacement parts remain a separate storefront navigation surface.

Supported navigation groups are ordered:

1. Automatic Taping Tools
2. Semi-Automatic Taping Tools
3. Stilts & Accessories

The frontend renders these backend-owned groups unchanged. Any CSV parser or legacy category mapper is a compatibility transport only and must prefer explicit canonical DTB metadata; it must not become a semantic taxonomy authority.

## Runtime fallback

`DTB_CategoryNormalizer` resolves explicit `_dtb_category_key` first. Its Woo category-name map is intentionally conservative and contains functional leaf names only. Generic labels such as `Accessories`, `Tool Sets`, and family labels such as `Predator Family` do not infer an unrelated broad category.

## Security and ownership

This taxonomy contract changes catalog classification only. It does not modify order, payment, pricing, tax, inventory, fulfillment, accounting, authentication, REST authorization, or provider ownership boundaries.
