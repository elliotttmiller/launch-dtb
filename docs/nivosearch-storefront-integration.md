# NivoSearch Storefront Integration

## Authority

Drywall Toolbox uses NivoSearch preset `930` as the predictive-search execution authority for the global storefront search experience.

NivoSearch owns:

- AJAX query execution and product indexing
- typo correction and fuzzy fallback provided by the installed plugin
- preset search fields, result limit, minimum characters, and related search policy
- SKU / variation-SKU matching supported by the plugin
- category/tag matches and `did_you_mean` output
- NivoSearch result caching and index invalidation

DTB owns:

- the existing React desktop expandable search input and dropdown
- the existing React mobile search dock and overlay
- storefront routing and product navigation
- accessibility and responsive interaction states
- bounded catalog-facet suggestion/correction enrichment
- graceful fallback to the existing DTB catalog search only when NivoSearch is unavailable or a confirmed corrected term still needs product resolution
- the read-safe runtime integration boundary

Do not enable NivoSearch **Replace theme search form** for the React storefront. Do not render the Nivo shortcode/widget in the React header. Do not modify vendor plugin files to customize DTB presentation.

## Runtime Flow

```text
StorefrontHeader desktop/mobile controlled input
        |
        | one owning debounced effect per surface
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
        +--> bounded DTB catalog-facet suggestion/correction enrichment
        |
        v
StorefrontHeader state
        |
        +--> existing desktop dropdown: Products + Suggestions
        |
        +--> existing mobile StorefrontSearchOverlay: Products + Suggestions
```

There is no standalone NivoSearch runtime bridge and no second per-keystroke search effect. `StorefrontHeader.jsx` is the single interactive search owner for both presentation and request lifecycle.

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

Search execution is not reimplemented in DTB. `StorefrontHeader` calls the NivoSearch WooCommerce AJAX action through `frontend/src/api/nivoSearch.js`.

## Frontend Ownership

Primary owner:

```text
frontend/src/components/storefront/StorefrontHeader.jsx
```

Supporting search client/intelligence:

```text
frontend/src/api/nivoSearch.js
frontend/src/api/searchSuggestions.js
```

Mobile presentation:

```text
frontend/src/components/storefront/StorefrontSearchOverlay.jsx
```

Search-result styling:

```text
frontend/src/styles/storefront-nivo-runtime-bridge.css
frontend/src/styles/storefront-nivo-vendor-suppression.css
```

The `storefront-nivo-runtime-bridge.css` filename is retained as a compatibility stylesheet name, but there is no runtime bridge component. Its classes now style DTB-owned result content rendered directly by `StorefrontHeader` and `StorefrontSearchOverlay`.

## Request, Concurrency, and Failure Contract

Desktop and mobile each have exactly one debounced request effect in `StorefrontHeader`.

Each surface:

1. increments a request generation ID;
2. aborts the previous Nivo request with `AbortController`;
3. waits its established debounce interval;
4. executes one Nivo request;
5. rejects stale/aborted responses before state mutation;
6. follows at most one Nivo/catalog correction inside the Nivo client;
7. falls back to DTB catalog search only on Nivo failure or confirmed corrected-term product resolution;
8. never runs the retired legacy search effect in parallel with a second Nivo bridge request.

A stale Nivo nonce is refreshed once and retried once. There is no unbounded retry loop.

## Suggestions and Typo Handling

Suggestion priority is:

1. Nivo `did_you_mean` correction;
2. Nivo categories;
3. Nivo tags;
4. categories attached to Nivo product results;
5. bounded backend-owned catalog brand/category/display-category terms.

The bounded DTB correction helper does not replace Nivo fuzzy search. It exists only for known catalog vocabulary when Nivo's index does not emit a correction. Multiword facet labels are compared by both full label and individual significant tokens, so a known brand such as `Columbia Tools` can resolve a one-edit typo such as `collumbia` to `Columbia` before the corrected query is executed through Nivo.

## Failure and Rollback

Failure behavior:

1. NivoSearch config unavailable -> use DTB catalog fallback.
2. NivoSearch request fails -> use DTB catalog fallback.
3. Stale/invalid Nivo nonce -> refresh config once and retry.
4. Corrected Nivo term has no products -> resolve the confirmed corrected term against the existing DTB catalog cache/service.
5. All search paths fail -> render an empty/error-safe result state; checkout, catalog browsing, and product pages remain unaffected.

Rollback is file-level and non-destructive. Restoring the prior `StorefrontHeader` search effects does not require catalog data migration.

## Operational Requirements

- Keep NivoSearch plugin activated.
- Keep preset `930` published.
- Keep **Replace theme search form** disabled for the React storefront.
- Rebuild the NivoSearch product index after large catalog imports when required by the plugin.
- Purge frontend/static caches after deploying a rebuilt React bundle.
- Do not edit NivoSearch vendor files; plugin updates must remain replaceable.
