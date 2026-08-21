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

## Legacy secondary catalog artifacts

`products/launch/official/dtb_official_catalog_content_seo.csv` is a legacy secondary artifact and **must not be used as a catalog authority or mutation source**. The prior consolidation workflow has been retired because it duplicated identity/taxonomy mutation logic outside the supported catalog runner.

Until that legacy file is archived or removed in a separately reviewed data-retention change:

- do not import products from it;
- do not copy protected identity, taxonomy, pricing, inventory, media, compatibility, or schematic fields from it;
- do not treat its presence as evidence that a second official catalog exists;
- use `dtb_official_catalog.csv` plus the supported review/evidence workflows for all new catalog work.

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
