# Drywall Toolbox — Development Guidelines

## PHP (Backend mu-plugins)

### Naming Conventions
- Functions: `dtb_snake_case()` prefix — e.g. `dtb_proxy_products`, `dtb_cached_wc_get`, `dtb_image_sync_log`
- Constants: `SCREAMING_SNAKE_CASE` — e.g. `DTB_PRODUCT_DETAIL_FIELDS`, `DTB_SYNC_LOCK_KEY`
- Files: `PascalCase.php` inside namespaced plugin directories
- All files begin with `defined( 'ABSPATH' ) || exit;`

### REST Route Patterns
- Register all routes on `rest_api_init` hook
- Always declare `permission_callback` — use `'__return_true'` for public, `'dtb_jwt_permission'` for JWT-gated
- Declare `args` with `sanitize_callback` and `validate_callback` for all route parameters
- Register more-specific routes (slug, resolve-sku) BEFORE generic `{id}` numeric routes
- Return `WP_REST_Response` from all callbacks; never echo directly
- Use `dtb_error_envelope( $code, $message, $status )` for all error responses
- Use `rest_ensure_response()` for success responses when returning arrays

### Security Patterns
- Always call `dtb_check_origin()` before proxying to WooCommerce
- Always call `dtb_rate_limit_get()` or `dtb_rate_limit()` before mutating routes
- Sanitize all user input: `sanitize_text_field()`, `sanitize_email()`, `sanitize_textarea_field()`, `sanitize_title()`, `absint()`
- Use `hash_equals()` for all secret/signature comparisons (timing-safe)
- Use `wp_unslash()` before sanitizing `$_SERVER` / `$_COOKIE` values
- Strip CR/LF from user-supplied values before using in email headers

### WooCommerce Proxy Pattern
```php
// Cached GET (public catalog data)
return dtb_cached_wc_get( 'wc/v3/products', $params );

// Uncached GET (user-specific data)
return dtb_wc_get( 'wc/v3/orders/' . absint( $id ) );

// POST (mutating)
return dtb_wc_post( 'wc/v3/customers', $body );
```

### Database Queries
- Always use `$wpdb->prepare()` for parameterized queries
- Use `$wpdb->esc_like()` for LIKE patterns
- Use `ARRAY_A` for associative result sets
- Wrap direct DB queries in `try/catch ( Throwable $e )` and return `WP_Error` on failure
- Add `// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching` when direct queries are intentional

### Error Handling
- Return `WP_Error` from service/repository functions on failure
- Check `is_wp_error( $result )` before using results
- Extract status from `$result->get_error_data()['status'] ?? 502`
- Log diagnostics via `dtb_log()` or `error_log( '[DTB Module] ...' )`

### Bootstrap Pattern
Each plugin's `bootstrap.php` loads files in strict dependency order with numbered sections:
```php
// 1. Configuration
// 2. Support primitives
// 3. Security
// 4. Auth
// 5. Cache
// ...
require_once $_dtb_platform . '/Config/Constants.php';
```

### Type Casting in Responses
Always cast output values explicitly:
```php
'id'    => (int) ( $row['id'] ?? 0 ),
'name'  => (string) ( $row['name'] ?? '' ),
'flag'  => (bool) ( $row['flag'] ?? false ),
'items' => (array) ( $row['items'] ?? [] ),
```

### Section Separators
Use `// =============================================================================` banners to separate major logical sections within large files.

---

## JavaScript / React (Frontend)

### Naming Conventions
- Components: `PascalCase.jsx`
- Hooks: `useCamelCase.js`
- Utilities: `camelCase.js`
- Constants/data: `SCREAMING_SNAKE_CASE` for exported constants
- Generated files: `*.generated.js` — excluded from Babel, never hand-edited

### Data File Patterns
Static data modules export named constants and pure utility functions:
```js
export const REPAIR_PACKAGES = [ ... ];

export function getRepairPackageById( packageId ) {
  return REPAIR_PACKAGES.find( ( pkg ) => pkg.id === packageId ) || null;
}
```
- Use `Object.entries()` + `.map()` / `.filter()` for deriving secondary exports from primary data
- Optional chaining (`?.`) for safe property access on derived values
- Default parameters with `= {}` for options objects

### Generated Data Files
- `*.generated.js` files are auto-generated from CSV/WooCommerce catalog data
- They are excluded from Babel transpilation in webpack config
- Never edit generated files manually — regenerate from source
- Header comment identifies source: `// Auto-generated from official WooCommerce production catalog CSV.`

### API Module Pattern
Each domain has a dedicated file in `src/api/`:
```js
// src/api/repairs.js
import client from './client';
export const submitRepair = (data) => client.post('/dtb/v1/repairs', data);
```

### Environment Variables
- All env vars use `process.env.REACT_APP_*` prefix
- Statically replaced by Webpack DefinePlugin at compile time
- Never access `import.meta.env.*` directly — use `process.env.*` equivalents
- Feature flags: `process.env.REACT_APP_DTB_CATALOG_PLATFORM === 'true'`

### Path Aliases
Use webpack aliases instead of relative paths:
```js
import { useCart } from '@hooks/useCart';
import ProductCard from '@components/catalog/ProductCard';
```

### CSS Architecture
- One CSS file per feature/component in `src/styles/`
- Flat file naming: `feature-name.css`, `mobile-feature-name.css`
- Design tokens in `storefront-tokens.css`
- Tailwind v4 utility classes used alongside custom CSS

### ESLint Rules
- `no-unused-vars`: vars matching `/^(?:[A-Z_].*|motion|getPaymentBaseUrl)$/` are ignored
- `react-hooks/rules-of-hooks`: error
- No TypeScript — plain JS with JSX

---

## Shared Patterns

### Repair Package Data Shape
```js
{
  id: 'taper_tune_up',
  toolFamily: 'automatic_taper',   // links to REPAIR_TOOL_FAMILIES key
  routeType: 'standard_package' | 'diagnostic_quote' | 'custom_repair',
  startingPrice: 179,              // number (omitted for quote-required)
  requiresApproval: false,
  allowPreApproval: true,
  estimatedTurnaroundDays: { standard: 7, expedited: 3 },
  warrantyDays: 30,
}
```

### REST API Namespaces
- `drywall/v1` — WooCommerce proxy (products, orders, customers, coupons)
- `dtb/v1` — DTB platform (auth, catalog, repairs, schematics, support, returns)
- `wc/store/v1` — WooCommerce Store API (cart, checkout — proxied via dtb-platform)

### Image Sync Health Labels
Health states: `'ok'`, `'warning'`, `'error'`, `'never'`, `'running'`, `'locked'`
Computed from error/warning counts via `dtb_image_sync_health_label( $errors, $warnings )`.

### Transient Cache Keys
- Product cache: `drywall_cache_*` prefix
- Rate limiting: `drywall_rl_*` (mutating), `drywall_rl_get_*` (GET)
- Sync lock: `DTB_SYNC_LOCK_KEY` constant
- Sync progress: `DTB_SYNC_PROGRESS_KEY` constant

### Deployment Checklist
- Run `npm run build` from `frontend/` — never commit `dist/` directly
- Run `launch/scripts/assemble-siteground.ps1` to assemble the overlay
- Smoke tests in `scripts/smoke-dtb-*.ps1` validate live endpoints after deploy
- Never commit `wp-config.php` secrets — they are server-owned
