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

## Build Commands (run from `frontend/`)

```bash
npm run dev                  # Webpack dev server on :5173, proxies /wp-json to live backend
npm run build                # Production build → dist/ (root)
npm run build:staging        # Staging build → dist-staging/ (root)
npm run lint                 # ESLint src/
npm run reviews-server       # Local Express reviews server
ANALYZE=true npm run build   # Bundle analyzer
```

## Environment Variables (frontend)

All prefixed `REACT_APP_*`, statically replaced by Webpack DefinePlugin at compile time.

Key variables:
- `REACT_APP_API_BASE_URL` — backend base URL
- `REACT_APP_DTB_API_BASE` — DTB REST namespace base (`/wp-json/dtb/v1`)
- `REACT_APP_STORE_API_BASE` — WooCommerce Store API base
- `REACT_APP_JWT_AUTH_ENDPOINT` — JWT auth endpoint
- `REACT_APP_SITE_URL` — canonical site URL
- `REACT_APP_APP_ENV` — `production` | `staging` | `development`
- `REACT_APP_DTB_CATALOG_PLATFORM` — enables catalog platform mode
- `REACT_APP_GOOGLE_MAPS_PLACES_API_KEY` — address autocomplete

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
- **Production `/wp` application tree** (mu-plugins, themes, `.htaccess`, `index.php`): `.github/workflows/release-siteground.yml`, an operator-dispatched Release Management workflow built around the official SiteGround Git repository. Immutable release manifests, protected-path enforcement, automatic backup/rollback, and signed webhook reporting into `dtb-deployment`'s `wp_dtb_release_events` log, surfaced by the Git Control Center admin UI (Drywall Toolbox > Git Control Center).
- CI: GitHub Actions (`ci-build.yml`) validates and packages source on every push/PR; it does not write to production. `release-siteground.yml` only runs on explicit `workflow_dispatch`.
- Smoke tests: PowerShell scripts in `scripts/smoke-dtb-*.ps1`

## Key Build Behaviors

- `.generated.js` files are excluded from Babel transpilation
- Chunk splitting: `vendor-react`, `vendor-framer-motion`, `vendor-lucide`, `vendor-stripe`, `vendor`, `common`
- `asset-manifest.json` emitted so WordPress PHP can resolve hashed filenames
- Static error pages (400–511) emitted to `errors/` in production only
- Service worker precaches JS/CSS; images/fonts use runtime CacheFirst strategy
- `console.log/info/debug` stripped in production via Terser
