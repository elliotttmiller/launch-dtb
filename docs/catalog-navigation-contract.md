# Catalog Navigation Contract

## Authority

WooCommerce `product_cat` is the runtime source of truth for customer-facing product navigation hierarchy.

Canonical catalog source material under `products/` defines the import hierarchy. WooCommerce owns the resulting runtime product/category records. The React storefront does not classify products into Automatic or Semi-Automatic systems and must not reconstruct that hierarchy from product names, SKU patterns, or merchandising metadata.

`_dtb_display_category_key` and the `displayCategoriesByBrand` facet remain supported for merchandising/filtering compatibility. They are not authoritative for primary storefront navigation.

## Canonical hierarchy

The primary drywall finishing tool hierarchy is:

```text
Drywall Finishing Tools
  Automatic Taping Tools
    <functional child categories>
  Semi-Automatic Taping Tools
    <functional child categories>
  Parts

Stilts & Accessories
  <functional child categories>
```

The exact child categories are read from active WooCommerce taxonomy terms. Frontend code must not maintain a duplicate hardcoded child-category list.

## Facets API

`GET /wp-json/dtb/v1/catalog/facets` exposes the existing facet fields plus:

```json
{
  "navigationGroups": [
    {
      "key": "automatic-taping-tools",
      "label": "Automatic Taping Tools",
      "slug": "automatic-taping-tools",
      "productCount": 0,
      "children": [
        {
          "key": "flat-boxes",
          "label": "Flat Boxes",
          "slug": "flat-boxes",
          "productCount": 0
        }
      ]
    }
  ]
}
```

`navigationGroups` is derived from the active `product_cat` ancestry of published catalog products. Replacement parts are intentionally excluded because Parts has its own storefront navigation surface.

The supported navigation group order is:

1. Automatic Taping Tools
2. Semi-Automatic Taping Tools
3. Stilts & Accessories

Only groups and children with active catalog membership are returned.

## Product filtering

The existing `category` query parameter on catalog endpoints now resolves a matching WooCommerce `product_cat` slug first. Taxonomy matches use `include_children=true`, so selecting `automatic-taping-tools` returns products in its functional descendants.

If no matching `product_cat` term exists, the repository preserves the legacy `_dtb_category_key` metadata lookup for compatibility with older callers.

Examples:

```text
/products?category=automatic-taping-tools
/products?category=flat-boxes
/products?category=semi-automatic-taping-tools
/products?category=compound-applicators
```

## Frontend contract

`StorefrontHeader` consumes `navigationGroups` from `useCatalogFacets()` and passes the hierarchy unchanged to desktop and mobile navigation presentation.

Desktop renders parent system groups with their child categories inside the All Products dropdown. Mobile renders the same data and links; there is no separate mobile taxonomy.

A compatibility fallback to the older flat display-category facet is retained only for staged deployment resilience when the frontend and backend are temporarily on different versions. Once `navigationGroups` is present, the canonical taxonomy is always preferred.

## Cache contract

Changes to the facets response schema require a storefront catalog cache version increment so persisted browser facet data cannot mask the new hierarchy. The navigation-group rollout increments that cache namespace from `v9` to `v10`.

## Security and ownership

The catalog facets and product listing endpoints remain intentional public storefront reads. They continue to enforce DTB origin validation. This navigation change adds no authentication bypass and does not change commerce, inventory, order, payment, fulfillment, accounting, or identifier ownership.

## Operational requirements

Catalog imports must preserve the canonical category paths in `products/launch/official/dtb_official_catalog.csv`. Brand names belong in the WooCommerce Brands field and must not be inserted as intermediate product-category terms.

After catalog/category imports or taxonomy changes, invalidate any server/object cache used by the catalog platform and deploy a frontend bundle using the matching facets contract. Do not hand-maintain primary navigation labels independently of WooCommerce taxonomy.
