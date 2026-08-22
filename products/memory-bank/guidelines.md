# Drywall Toolbox — Development Guidelines

## PHP Conventions

### File Guards (every PHP file)
```php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_ClassName' ) ) {
    return;
}
```

### Class Patterns
- All custom classes use `DTB_` prefix (e.g. `DTB_RestResponseFactory`, `DTB_Diagnostics`)
- Utility/singleton classes are declared `final`
- `abstract` for base classes that define contracts (e.g. `DTB_AbstractRestController`)
- Static methods preferred for stateless services and factories
- PHPDoc type annotations: `@return array<string,mixed>`, `@param WP_REST_Request $request`

### Plugin Bootstrap Pattern
Each plugin's `bootstrap.php` uses flat `require_once __DIR__ . '/Layer/ClassName.php'` — no autoloader. Load order: Domain → Infrastructure → Application → Services → Rest → Admin.

### REST Controllers
- Extend `DTB_AbstractRestController`, implement `register_routes(): void`
- Use `DTB_RestResponseFactory::ok($data)` for success responses
- Use `DTB_RestResponseFactory::error($code, $message, $status)` for errors
- Pagination helpers: `self::page_from_request($request)`, `self::per_page_from_request($request)`
- Success envelope: `{ ok: true, ...data }`
- Error envelope: `{ error: { code, message, status, details? } }`

### Layered Architecture (per plugin)
```
Domain/       → pure value objects, no WP dependencies
Application/  → use-case handlers, orchestrate services
Infrastructure/ → DB, external HTTP, WP APIs
Services/     → business logic
Rest/         → WP REST controllers only
Admin/        → WP admin pages, assets
Validation/   → input validators, return bool or throw
```

---

## JavaScript / React Conventions

### File Extensions
- `.jsx` — components and pages (anything returning JSX)
- `.js` — hooks, utilities, API modules, contexts, services

### Imports
- Named imports preferred; default exports for components and pages
- Path aliases: `@/`, `@api/`, `@components/`, `@hooks/`, `@pages/`, `@styles/`, `@context/`
- API modules imported from `../api/{domain}.js`; never call `fetch` directly in components

### Hooks Pattern
```js
export function useSomething() {
  const [data,      setData]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSomething()
      .then((d)   => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed.'); })
      .finally(()  => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
```
- Always use `cancelled` flag in `useEffect` async fetches to prevent state updates on unmounted components
- Wrap mutation operations in a `withUpdate(fn)` pattern (see `useCart`) to centralize loading/error state

### Lazy Loading (pages)
All pages use `lazyWithReload()` — never bare `lazy()`:
```js
const MyPage = lazyWithReload(() => import('./pages/MyPage'));
```
This handles `ChunkLoadError` with a single auto-retry via `sessionStorage`.

### API Client Usage
- Use `apiClient(endpoint, options)` from `src/api/client.js` for DTB/WP REST calls
- Use `wpClient` (axios) for WP REST calls needing interceptors
- Use `wcClient` (axios) for `drywall/v1` proxy calls
- Never include WooCommerce consumer keys or secrets in browser code
- All requests use `credentials: 'include'` for cookie-based session continuity
- Bearer token auto-attached from `tokenStore` via interceptors

### Error Handling
- API errors are plain objects: `{ code, message, status, url? }`
- 401 responses auto-dispatch `auth:expired` window event and clear token
- 429 responses set a cooldown; duplicate GET requests are deduplicated via `inflightGetRequests` Map

### Feature Flags
```js
import { getFeatureFlag, isCatalogPlatformEnabled } from '@/utils/featureFlags';

// Named flag helpers preferred over raw getFeatureFlag() calls
export function isMyFeatureEnabled() {
  return getFeatureFlag('my_feature', false);
}
```
- Flags read from `REACT_APP_*` env vars (baked at build time)
- In non-production, can be overridden via `localStorage` key `dtb_flag_{key}`
- Hard-disabled features (like rewards) return `false` unconditionally with a comment explaining why

### CSS / Styling
- One CSS file per component/feature in `src/styles/`
- BEM-style class names with `dtb-` prefix: `.dtb-route-back-bar`, `.dtb-route-back-bar--orders`
- Design tokens via CSS custom properties (managed by Visual Designer plugin)
- Tailwind utility classes used alongside scoped CSS files
- No CSS Modules; no inline styles for layout

### Context Providers
Provider nesting order in `App.jsx` (outermost first):
1. `AppErrorBoundary`
2. `AuthProvider`
3. `DesignConfigProvider`
4. `WooCommerceProvider`
5. `CartProvider`
6. `WorkflowTransitionProvider`
7. `Router`

### Component Naming
- PascalCase for all components and pages
- `use` prefix for all hooks
- `dtb:` prefix for `localStorage`/`sessionStorage` keys (e.g. `dtb:lazy-retry:/path`)
- `dtb-` prefix for CSS class names

---

## Security Invariants

### Frontend
- No WooCommerce application passwords, consumer keys, or secrets in browser code
- Auth uses HttpOnly DTB cookie + optional in-memory Bearer token only
- All API calls are same-origin in production (no cross-origin WP REST calls)
- `DOMPurify` used for any HTML rendered from API responses

### PHP
- All REST endpoints validate permissions before processing
- Rate limiting applied at platform level (`DTB_RateLimiter`)
- CORS policy enforced via `DTB_CorsPolicy` / `DTB_OriginAllowlist`
- Admin REST endpoints protected by `DTB_AdminRestTopology`
- `defined('ABSPATH') || exit` on every PHP file

---

## Build & Deployment

### Build Assertions (run automatically on `npm run build`)
1. `assert-public-env-safe.cjs` — validates env vars are safe for production
2. `assert-pwa-hardening.cjs` — validates PWA manifest and service worker
3. `assert-font-authority.cjs` — validates font sources
4. `assert-build-routing.cjs` — validates SPA routing contract post-build

### Never Ship to `dist/`
- `.csv` data files (served via WooCommerce REST)
- `.zip` archives
- `scripts/` directory
- `scraped_results/` directory

### Deployment Flow
1. Build: `npm run build` → `dist/` at repo root
2. Release: GitHub Actions triggers `siteground-git-release.sh` via webhook
3. Protected paths policy prevents overwriting critical WP files

---

## Naming Conventions Summary

| Context | Convention | Example |
|---|---|---|
| PHP classes | `DTB_PascalCase` | `DTB_RestResponseFactory` |
| PHP files | `PascalCase.php` | `RestResponseFactory.php` |
| JS/JSX components | `PascalCase` | `ProductDetailPage.jsx` |
| JS hooks | `camelCase` with `use` prefix | `useCart.js` |
| JS utilities | `camelCase` | `featureFlags.js` |
| CSS classes | `dtb-kebab-case` | `.dtb-route-back-bar` |
| localStorage keys | `dtb:kebab-case:version` | `dtb:lazy-retry:/products` |
| REST namespaces | `drywall/v1` | `/wp-json/drywall/v1/` |
| Env vars | `REACT_APP_SCREAMING_SNAKE` | `REACT_APP_DTB_API_BASE` |
