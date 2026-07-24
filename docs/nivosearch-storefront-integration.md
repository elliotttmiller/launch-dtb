# NivoSearch Storefront Integration

## Authority

Drywall Toolbox uses NivoSearch preset `930` as the primary predictive-search execution authority for the global storefront search experience.

NivoSearch owns:

- AJAX query execution and product indexing
- typo correction and fuzzy fallback emitted by the installed plugin
- preset search fields, result limit, and minimum characters
- SKU / variation-SKU matching supported by the plugin
- category/tag matches and `did_you_mean` output
- NivoSearch result caching and index invalidation

DTB owns:

- the existing React desktop expandable search bar
- the existing React mobile search dock and search overlay
- storefront routing and product navigation
- accessibility and responsive interaction states
- normalization of Nivo results into DTB presentation DTOs
- bounded catalog-facet suggestions/correction fallback when the installed Nivo index does not emit a correction
- graceful product-search fallback when NivoSearch is unavailable
- the read-safe runtime integration boundary

Do not enable NivoSearch **Replace theme search form** for the React storefront. Do not render the Nivo shortcode/widget as a competing storefront UI and do not modify vendor plugin files.

## Runtime Flow

```text
Existing DTB desktop/mobile search input
        |
        v
NivoSearchRuntimeBridge (headless presentation adapter)
        |
        v
GET /wp-json/dtb/v1/catalog/search/nivo-config
        |
        | preset 930 + WC AJAX endpoint + WP nonce
        v
POST ?wc-ajax=nivo_search
        |
        v
NivoSearch preset 930 / search algorithm / index
        |
        v
products + categories + tags + did_you_mean
        |
        +---- if Nivo emits correction ----> execute corrected term once through Nivo
        |
        +---- if no correction/results ----> bounded DTB catalog-facet spelling candidate
        |                                    then execute candidate once through Nivo
        v
Existing DTB results containers
Products + Suggestions + Did-you-mean
```

The browser never receives WooCommerce application passwords, consumer secrets, or integration credentials. The exposed WordPress nonce is the anti-CSRF token required by NivoSearch's public AJAX search action; it is not an authentication credential.

## Backend Integration

Controller:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-catalog-platform/Rest/NivoSearchConfigController.php
```

Public route:

```text
GET /dtb/v1/catalog/search/nivo-config
```

The route is intentionally read-safe and same-origin guarded. It returns non-cacheable runtime configuration only when the installed NivoSearch plugin and published preset `930` are available.

The route must remain `Cache-Control: no-store` because it returns a WordPress nonce.

Search execution is not duplicated in DTB. The React client posts to the NivoSearch WooCommerce AJAX action returned by the configuration route. DTB's bounded catalog-term correction exists only as resilience when the installed Nivo index does not emit `did_you_mean`; corrected product execution still goes back through Nivo first.

## Frontend Integration

Nivo client:

```text
frontend/src/api/nivoSearch.js
```

Catalog suggestion fallback:

```text
frontend/src/api/searchSuggestions.js
```

Runtime presentation adapter:

```text
frontend/src/components/storefront/NivoSearchRuntimeBridge.jsx
frontend/src/styles/storefront-nivo-runtime-bridge.css
```

Existing UI authority remains:

```text
frontend/src/components/storefront/StorefrontHeader.jsx
frontend/src/components/storefront/StorefrontSearchDock.jsx
frontend/src/components/storefront/StorefrontSearchOverlay.jsx
```

Mount point:

```text
frontend/src/components/shell/Header.jsx
```

The bridge does **not** create another search input, backdrop, fullscreen overlay, or header shell. It observes the established DTB desktop/mobile inputs, executes NivoSearch, and portals only result content into the established DTB results containers. This preserves the existing desktop expansion animation, mobile dock styling, overlay geometry, and close/navigation behavior.

The retired `NivoSearchPresentation.jsx` replacement surface and its styling were removed because they competed with the established DTB search presentation and caused the mobile/header takeover regression.

## Suggestions and typo behavior

Suggestion order is bounded and deduplicated:

1. Nivo `did_you_mean`
2. Nivo category matches
3. Nivo tag matches
4. categories attached to returned Nivo products
5. DTB catalog facet terms used only to fill missing suggestion coverage

For a typo such as `collumbia`:

1. Nivo is queried with the original term.
2. If Nivo emits `did_you_mean`, that correction is authoritative and is executed once.
3. If Nivo returns no products and no correction, DTB compares the query only against the bounded catalog brand/category facet vocabulary (including individual words in multiword labels).
4. A close candidate such as `Columbia` is executed once through Nivo.
5. If the corrected Nivo query still has no product rows but the correction is valid, DTB's cached catalog search may supply product rows while preserving the correction and suggestion set.

This is intentionally not a general-purpose fuzzy search engine. It is a bounded resilience layer over catalog-controlled terms so Nivo remains the primary search engine.

## Failure and Rollback

Failure behavior:

1. NivoSearch config unavailable -> existing DTB catalog product fallback remains usable.
2. NivoSearch request fails -> DTB catalog product fallback.
3. Stale/invalid Nivo nonce -> refresh config once and retry once.
4. Catalog facets unavailable -> Nivo still operates; supplemental suggestions/correction fallback is skipped.
5. Both product paths fail -> empty/error-safe result state; checkout, catalog browsing, and product pages remain unaffected.

Rollback is file-level and non-destructive. Removing `NivoSearchRuntimeBridge` from `frontend/src/components/shell/Header.jsx` restores the pre-Nivo runtime behavior without changing catalog data.

## Operational Requirements

- Keep NivoSearch plugin activated.
- Keep preset `930` published.
- Keep **Replace theme search form** disabled for the React storefront.
- Keep Nivo AJAX enabled and `Did You Mean` enabled in Nivo settings.
- Rebuild the NivoSearch product index after large catalog imports or search-field changes.
- Purge frontend/static caches after deploying a rebuilt React bundle.
- Do not edit NivoSearch vendor files; plugin updates must remain replaceable.
