# Catalog Runtime Integrity

Last updated: 2026-07-23.

## Authority

WooCommerce remains the system of record for products. Public DTB catalog routes execute inside the same WordPress/WooCommerce runtime and therefore must not require a self-HTTP round trip through WooCommerce REST consumer credentials merely to read local product data.

## Public storefront contract

The customer-facing path is:

```text
React storefront
  -> GET /wp-json/dtb/v1/catalog/products
     or GET /wp-json/dtb/v1/catalog/facets
  -> DTB catalog platform queries canonical published product IDs locally
  -> DTB ensures the official WooCommerce REST products controller is available
  -> DTB invokes that controller in-process
  -> DTB normalizes Woo product data into catalog DTOs/facets
  -> frontend renders products, brands, categories, parts filters, and navigation
```

`dtb/v1/catalog/*` public reads must not depend on `WC_PROXY_CONSUMER_KEY` or `WC_PROXY_CONSUMER_SECRET` when reading the local WooCommerce installation.

The public catalog adapter must not fall back to the credential-bearing `drywall/v1` proxy if the Woo REST products controller has not yet been autoloaded. It explicitly loads the official Woo controller from `WC_ABSPATH` when necessary and returns a structured `503` if the local Woo product runtime is genuinely unavailable.

The legacy `drywall/v1` server-side Woo REST proxy remains a separate compatibility/operational surface and may retain its server-only credential contract where explicitly required. Credentials must never be exposed to React, REST responses, logs, or generated assets.

## Source-level invariants

- `Infrastructure/WooProductRepository.php` owns the in-process Woo product read adapter and explicitly ensures the official v3 products controller is loaded.
- The local public catalog adapter never falls back to `dtb_cached_wc_get()` or another credential-bearing self-HTTP path.
- `DTB_CatalogProductRepository` owns indexed/paginated WordPress ID selection and filtering.
- `CatalogProductsController` uses local ID selection plus one batched in-process Woo read.
- `CatalogFacetsController` builds scoped facets from the same local catalog authority and returns an explicit service error rather than silently converting an upstream/runtime failure into an empty catalog.
- `ProductDetailController` uses the same in-process Woo read adapter for parent product reads.
- Public ID reads enforce published-product visibility before returning data.

## Failure behavior

A backend/runtime failure must not masquerade as a legitimate empty catalog.

Bad:

```text
Woo read fails -> brands=[] -> blank Brands page -> header dropdowns disappear
```

Required:

```text
Woo/local catalog read fails
  -> explicit structured 5xx error
  -> frontend retains stable navigation shells
  -> customer sees a recoverable unavailable state
  -> operator logs contain bounded diagnostic context
```

The frontend desktop navigation keeps the known `All Products`, `Brands`, `Parts`, `Repair Services`, and `Schematics` dropdown affordances stable even while dynamic catalog facet data is loading or unavailable. Dynamic menu contents may degrade, but navigation type must not silently change from dropdown to plain link because of a transient API failure.

## Performance and scaling

- Product listing IDs are selected with the repository query layer before hydration.
- Product hydration is batched by ID rather than fetch-per-item.
- Facet aggregation is paginated in bounded batches.
- No external/self-HTTP call is required for the normal local public catalog read path.
- Existing cache layers may cache normalized/facet results, but cache failure must not change source-of-truth ownership.

## Deployment and verification

Deploy catalog runtime changes as a scoped unit. Do not replace unrelated MU-plugin modules.

Verify:

```text
GET /wp-json/dtb/v1/catalog/products?per_page=1
GET /wp-json/dtb/v1/catalog/facets?is_parts=0
GET /wp-json/dtb/v1/catalog/facets?is_parts=1
```

Expected results:

- HTTP 200;
- real normalized products from the first route;
- non-empty canonical brands where matching published products exist;
- display categories grouped under canonical brand keys;
- no `Store backend credentials are not configured` error on these public local catalog routes.

If the local Woo product runtime cannot be loaded, the expected failure is a structured `503 catalog_runtime_unavailable`, never a missing-proxy-credentials error.

Then verify `/products`, `/products/brands`, `/parts`, desktop catalog dropdowns, product detail, and search/filter navigation.
