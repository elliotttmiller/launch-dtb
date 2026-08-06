# Drywall Toolbox — Tech Stack

## Frontend

| Concern | Technology |
|---|---|
| Framework | React 19 |
| Routing | React Router DOM v7 |
| Build | Webpack 5 (CJS config) |
| CSS | Tailwind CSS v4 + PostCSS + flat CSS files per feature |
| Animation | Framer Motion v11 |
| Icons | lucide-react |
| Payments | Stripe (@stripe/react-stripe-js, @stripe/stripe-js) |
| HTTP | axios |
| Real-time | socket.io-client (order/repair event streams) |
| Auth | Custom JWT via WP REST + tokenStore |
| SEO | react-helmet-async |
| Markdown | react-markdown + remark-gfm |
| PWA | Workbox GenerateSW (service worker) |
| Linting | ESLint 9 flat config + eslint-plugin-react-hooks |
| Language | JavaScript (ES2020+, JSX) — no TypeScript |

## Backend

| Concern | Technology |
|---|---|
| CMS/API | WordPress (mu-plugins, no theme rendering) |
| Ecommerce | WooCommerce + WooCommerce Store API |
| Language | PHP (WordPress coding standards) |
| Auth | Custom JWT service + WP session bridge |
| Payments | Stripe (native WooCommerce checkout) |
| Inventory | Veeqo integration |
| Accounting | QuickBooks integration |
| Marketplaces | Amazon SP-API, eBay REST |
| Hosting | SiteGround shared hosting |
| SEO/Sitemap | Custom (`dtb-platform/Seo/SitemapService.php`): rewrite-rule-based `sitemap.xml` + `sitemaps/{type}-{page}.xml`, replaces WP core's `wp_sitemaps_enabled`; `dtb-marketing/Seo/ProductSeoController.php` owns per-product `_dtb_seo_*` post-meta |
| Cache tooling | `dtb-platform/Cache/*` (key builder, invalidation service, purge lock, headers) + admin UI (`CacheToolsPage.php`, `AdminCacheToolbar.php`) |

## Build Commands (run from `frontend/`)

```bash
npm run dev                  # Webpack dev server on :5173, proxies /wp-json to live backend
npm run build                # Production build → dist/ (root)
npm run lint                 # ESLint src/
npm run reviews-server       # Local Express reviews server
ANALYZE=true npm run build   # Bundle analyzer
```

## Environment Variables (frontend)

All prefixed `REACT_APP_*`, statically replaced by Webpack DefinePlugin at compile time.

Key variables (per `frontend/.env.example`; verified against actual `process.env.REACT_APP_*` usage in `frontend/src`):
- `REACT_APP_API_BASE_URL`, `REACT_APP_WP_BASE_URL`, `REACT_APP_WP_API_BASE` — backend/WordPress base URLs
- `REACT_APP_DTB_API_BASE` — DTB REST namespace base (`/wp-json/dtb/v1`)
- `REACT_APP_WC_BASE_URL`, `REACT_APP_WC_API_BASE`, `REACT_APP_STORE_API_BASE` — WooCommerce REST / Store API bases
- `REACT_APP_JWT_AUTH_ENDPOINT`, `REACT_APP_JWT_ENDPOINT` — JWT auth endpoint (path and full URL forms)
- `REACT_APP_SITE_URL` — canonical site URL
- `REACT_APP_ENV` — `production` | `development` | `test` (actually read in `src`; `REACT_APP_APP_ENV` is also declared in `.env.example` but not read by any `src` code as of this check)
- `REACT_APP_DTB_CATALOG_PLATFORM` — enables catalog platform mode
- `REACT_APP_CATALOG_SNAPSHOTS_ENABLED`, `REACT_APP_SEARCH_INDEXING`, `REACT_APP_REWARDS_ENABLED`, `REACT_APP_STORE_LAUNCH_DATE` — feature/content flags
- `REACT_APP_GOOGLE_MAPS_PLACES_API_KEY` — address autocomplete
- `REACT_APP_GOOGLE_SSO_URL`/`REACT_APP_AUTH_GOOGLE_URL`, `REACT_APP_APPLE_SSO_URL`/`REACT_APP_AUTH_APPLE_URL` — SSO endpoints
- `REACT_APP_WC_AUTH_USER`/`REACT_APP_WC_AUTH_PASS` — used directly in `src` (WooCommerce basic-auth request path), not present in `.env.example`

Stripe key is intentionally absent: Stripe is owned entirely by the WooCommerce-side Payment Plugins for Stripe gateway; the React storefront needs no Stripe key.

## Path Aliases (Webpack)

```
@              → src/
@api           → src/api/
@components    → src/components/
@hooks         → src/hooks/
@pages         → src/pages/
@styles        → src/styles/
@context       → src/context/
```

## Deployment

Two deployment paths, split by ownership boundary — see `docs/deployment/release-management-architecture.md` for the full design:

- **Frontend + site root**: `npm run build` → `dist/` → `launch/scripts/assemble-siteground.ps1` → `launch/live/` → manual operator upload through FileZilla; connection details and credentials remain outside the repository.
- **Production `/wp` application tree** (mu-plugins, themes, `.htaccess`, `index.php`): `.github/workflows/release-siteground.yml`, an operator-dispatched Release Management workflow built around the official SiteGround Git repository. Immutable release manifests, protected-path enforcement, automatic backup/rollback, and signed webhook reporting into `dtb-deployment`'s `wp_dtb_release_events` log, surfaced by System Manager's Release Management tabs (Drywall Toolbox > System Manager).
- CI: GitHub Actions (`ci-build.yml`) validates and packages source on every push/PR; it does not write to production. `release-siteground.yml` only runs on explicit `workflow_dispatch`.
- Smoke tests: PowerShell scripts in `scripts/smoke-dtb-*.ps1`

## Key Build Behaviors

- `.generated.js` files are excluded from Babel transpilation
- Chunk splitting: `vendor-react`, `vendor-framer-motion`, `vendor-lucide`, `vendor-stripe`, `vendor`, `common`
- `asset-manifest.json` emitted so WordPress PHP can resolve hashed filenames
- Static error pages (400–511) emitted to `errors/` in production only
- Service worker precaches JS/CSS; images/fonts use runtime CacheFirst strategy
- `console.log/info/debug` stripped in production via Terser
