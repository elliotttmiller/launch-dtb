# Frontend catalog search

## Ownership

- WooCommerce remains the product system of record.
- `frontend/src/services/catalog.js` owns the cached storefront catalog projection.
- Base UI Autocomplete owns desktop input, popup, keyboard navigation, highlighting, and accessibility behavior.
- `match-sorter` owns client-side fuzzy result ranking.
- The React storefront owns search presentation and product navigation.

No separate search index, database, AJAX engine, or browser-owned catalog authority is introduced.

## Runtime flow

1. The existing catalog prewarm loads the published catalog through the DTB/WooCommerce API and IndexedDB cache.
2. `StorefrontCatalogAutocomplete` receives the cached catalog.
3. `match-sorter` ranks product name, brand, SKU, part number, UPC, slug, category, and short-description fields.
4. Base UI limits and renders the first six accessible autocomplete items.
5. Selecting an item navigates to its canonical React product route.
6. “View all results” routes the original query to the products catalog page.

The responsive mobile search overlay continues to use the same canonical catalog service.

## Legacy NivoSearch transition

The React storefront no longer calls NivoSearch AJAX or exposes the former Nivo configuration REST route. The regular NivoSearch plugin may be deactivated by an operator after confirming no non-DTB theme surface depends on it. Vendor-markup suppression remains temporarily defensive until that operator step is complete.
