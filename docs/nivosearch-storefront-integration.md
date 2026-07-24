# NivoSearch Storefront Integration

## Authority

Drywall Toolbox uses NivoSearch preset `930` as the predictive-search execution authority for the global storefront search experience.

NivoSearch owns:

- AJAX query execution and product indexing
- typo correction and fuzzy fallback provided by the installed plugin
- preset search fields, result limit, minimum characters, and delay
- SKU / variation-SKU matching supported by the plugin
- category/tag matches and `did_you_mean` output
- NivoSearch result caching and index invalidation

DTB owns:

- React desktop and mobile search presentation
- storefront routing and product navigation
- accessibility and responsive interaction states
- graceful fallback to the existing DTB catalog search when NivoSearch is unavailable
- the read-safe runtime integration boundary

Do not enable NivoSearch **Replace theme search form** for the React storefront. Do not modify vendor plugin files to customize DTB presentation.

## Runtime Flow

```text
Desktop or mobile DTB search input
        |
        v
GET /wp-json/dtb/v1/catalog/search/nivo-config
        |
        | preset 930 + WC AJAX endpoint + short-lived WP nonce
        v
POST ?wc-ajax=nivo_search
        |
        v
NivoSearch preset 930 / search algorithm / index
        |
        v
products + categories + tags + did_you_mean
        |
        v
DTB React Products + Suggestions presentation
```

The browser never receives WooCommerce application passwords, consumer secrets, or integration credentials. The exposed WordPress nonce is the anti-CSRF token required by NivoSearch's public unauthenticated AJAX search action; it is not an authentication credential.

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

Search execution is not reimplemented in DTB. The React client posts directly to the NivoSearch WooCommerce AJAX action returned by the configuration route.

## Frontend Integration

Client:

```text
frontend/src/api/nivoSearch.js
```

Presentation:

```text
frontend/src/components/storefront/NivoSearchPresentation.jsx
frontend/src/styles/storefront-nivo-search.css
```

Mount point:

```text
frontend/src/components/shell/Header.jsx
```

The integration portals DTB-owned search presentation into the existing desktop and mobile header search slots. While the integration is mounted, the legacy StorefrontHeader search inputs are hidden and therefore do not issue duplicate per-keystroke searches.

The existing `searchProducts()` catalog service remains unchanged and is used only as graceful degradation if NivoSearch or preset `930` is unavailable. It is not the normal predictive-search authority.

## Failure and Rollback

Failure behavior:

1. NivoSearch config unavailable -> use DTB catalog fallback.
2. NivoSearch request fails -> use DTB catalog fallback.
3. Stale/invalid Nivo nonce -> refresh config once and retry.
4. Both search paths fail -> render an empty/error-safe result state; checkout, catalog browsing, and product pages remain unaffected.

Rollback is file-level and non-destructive. Removing `NivoSearchPresentation` from `frontend/src/components/shell/Header.jsx` restores the legacy header search UI. No catalog data migration is required.

## Operational Requirements

- Keep NivoSearch plugin activated.
- Keep preset `930` published.
- Keep **Replace theme search form** disabled for the React storefront.
- Rebuild the NivoSearch product index after large catalog imports when required by the plugin.
- Purge frontend/static caches after deploying a rebuilt React bundle.
- Do not edit NivoSearch vendor files; plugin updates must remain replaceable.
