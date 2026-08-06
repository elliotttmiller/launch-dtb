# Drywall Toolbox — Structure

## Repository Layout

```
launch-dtb/
├── frontend/               # React SPA (canonical source)
├── drywalltoolbox/wp/      # WordPress + WooCommerce backend (canonical source)
│   └── wp-content/
│       ├── mu-plugins/     # Custom mu-plugins (DTB platform)
│       └── themes/
├── launch/live/            # Assembled SiteGround deployment overlay (generated)
├── docs/                   # Architecture docs, contracts, audit reports
├── scripts/                # Build, smoke-test, and data-migration tooling
├── products/               # Product catalog CSVs, images, parts data
└── .github/workflows/      # CI validation and packaging pipelines
```

## Frontend (`frontend/src/`)

```
src/
├── api/          # API client modules (one file per domain: cart, orders, repairs, etc.)
├── auth/         # AuthContext, JWT token store, useAuth hook
├── components/   # UI components grouped by domain
│   ├── account/, cart/, catalog/, checkout/, repairs/, schematics/, ...
├── context/      # React contexts: Cart, GlobalLoading, WooCommerce, WorkflowTransition
├── data/         # Static data files (generated catalogs, repair packages, mappings)
├── features/     # Feature-level modules (checkout)
├── hooks/        # Custom React hooks (useCart, useCatalogProducts, useRepairStatus, ...)
├── pages/        # Route-level page components
├── services/     # Client-side service layer (catalog cache, product cache, veeqo, woocommerce)
├── styles/       # Flat CSS files (one per feature/component)
├── utils/        # Pure utility functions (facets, cart, checkout, navigation, ...)
└── motion/       # Framer Motion animation config
```

## Backend — mu-plugins (`drywalltoolbox/wp/wp-content/mu-plugins/`)

Each plugin follows a consistent layered architecture:

| Plugin | Responsibility |
|---|---|
| `dtb-platform` | Core platform: auth, security, cache, REST infrastructure, admin shell, observability |
| `dtb-catalog-platform` | Product catalog, facets, variations, toolset builder, inventory intelligence |
| `dtb-commerce` | Cart, orders, checkout, Stripe payment, WooCommerce integration |
| `dtb-repair-service` | Repair submission, workflow, quotes, shipping, status tracking |
| `dtb-order-platform` | Order lifecycle, event stream, tracking projections |
| `dtb-integrations` | Veeqo, Amazon, eBay, QuickBooks, WooCommerce webhooks, operational pipeline |
| `dtb-schematics` | Schematic uploads registration, attachment metadata, media manifests, cache invalidation, and parts resolution |
| `dtb-media` | Product-image sync, product linking, and variation galleries; its admin screen surfaces schematic registration without owning that behavior |
| `dtb-returns` | Return portal workflow |
| `dtb-support` | Support tickets, contact form, SLA, admin workbench |
| `dtb-marketing` | Coming-soon page; per-product SEO meta (`ProductSeoController`, see below) |
| `dtb-deployment` | Release Management: release event log, signed GitHub Actions webhook, GitHub API bridge (dispatch/drift), System Manager admin UI (Release Management tabs) |
| `dtb-visual-designer` | Design-token/surface config studio: draft/publish/rollback of token+surface config with preview sessions and revision history (`Domain/TokenRegistry.php`, `Domain/SurfaceRegistry.php`, `Application/DraftService.php`/`PublishService.php`/`RollbackService.php`, `Rest/*Controller.php`, `Admin/DesignerPage.php`); includes an `EmailStudioController` REST endpoint |

Standalone root-level files (not inside a plugin folder) also ship as mu-plugins: `00-aaa-dtb-sitemap-admin-guard.php`, `00-dtb-loader.php`, `dtb-customer-orders-api.php`, `dtb-legacy-commerce-route-hardening.php`, `dtb-order-tracking-links.php`, `dtb-public-labels.php`, `sso.php`, `zzz-dtb-order-loop-containment.php`.

### SEO and Sitemap pipeline

- **Frontend**: `frontend/src/components/shared/SEOHead.jsx` renders per-route `<title>`/meta/canonical via `react-helmet-async`; `frontend/src/utils/schema.js` builds JSON-LD (Product/Breadcrumb/Organization/WebSite, etc.).
- **Per-product SEO meta** (`dtb-marketing/Seo/ProductSeoController.php`): registers WooCommerce product post-meta fields `_dtb_seo_title`, `_dtb_seo_description`, `_dtb_seo_focus_kw`, `_dtb_seo_canonical`, `_dtb_seo_noindex`.
- **Sitemap** (`dtb-platform/Seo/SitemapService.php`, `SitemapUrlRepository.php`, `SitemapXmlRenderer.php`): registers rewrite rules for `sitemap.xml` (index) and `sitemaps/{type}-{page}.xml`, serves on `template_redirect`, disables WordPress core's own `wp_sitemaps_enabled` sitemap, filters `robots_txt`, and invalidates its hourly cache on product save/delete and term create/edit/delete. `00-aaa-dtb-sitemap-admin-guard.php` (loaded first, by filename ordering) guards sitemap routes from admin-context interference.
- **Cache Tools** (`dtb-platform/Cache/`: `CacheKeyBuilder.php`, `CacheService.php`, `CacheHeaders.php`, `CacheInvalidationService.php`, `CachePurgeLock.php`, `CacheOperationsService.php`, `CacheAdminPage.php`) plus `dtb-platform/Admin/AdminCacheToolbar.php`, `CacheToolsPage.php`, and `SeoToolsPage.php` — admin-facing cache purge/inspection tooling with a purge lock to prevent concurrent runs.

### Plugin Internal Layers (consistent across all plugins)

```
PluginName/
├── Domain/         # Pure domain models and value objects
├── Application/    # Use-case command handlers
├── Infrastructure/ # WordPress/WooCommerce persistence adapters
├── Services/       # Business logic services
├── Rest/           # REST API controllers
├── Validation/     # Input validators
├── Admin/          # WP admin UI pages and menus
└── bootstrap.php   # Loads all files in dependency order
```

## Schematic Media Flow

```
frontend schematic registry + hotspot JSON
  -> GET /wp-json/dtb/v1/schematics/media
  -> dtb-schematics manifest repository
  -> WordPress attachment metadata
  -> wp-content/uploads/2026/schematics/*
```

The frontend production artifact does not own schematic image binaries. Stable schematic IDs join frontend definitions to WordPress attachment metadata. The DTB Image Sync screen exposes a bounded, idempotent registration action, while all registration and manifest behavior remains inside `dtb-schematics`.

## Deployment Pipeline

Two independent, non-competing deployment paths, split by ownership boundary:

**Frontend + site root** (`frontend/` build, root `.htaccess`, logos) — unchanged, operator-managed:

1. `frontend/` → Webpack production build
2. `launch/scripts/assemble-siteground.ps1` reconstructs the bounded `launch/live/` overlay
3. CI validates source, PHP, JavaScript, routing, and payload boundaries without writing to production
4. An operator creates independent backups and transfers the reviewed `launch/live/` change set manually through FileZilla
5. Runtime caches and production acceptance checks are completed separately

**Production `/wp` application tree** (mu-plugins, themes, `.htaccess`, `index.php`) — the Release Management platform, built around the official SiteGround Git repository:

1. An operator dispatches `.github/workflows/release-siteground.yml` (from System Manager's Release Management tabs or GitHub Actions directly) with a reviewed ref and a typed `DEPLOY`/`ROLLBACK` confirmation.
2. The workflow plans and validates the release, assembles a payload scoped to `scripts/deployment/protected-paths.json`'s owned paths, and tags an immutable manifest (`dtb-release/<id>`) on this repository.
3. `scripts/deployment/siteground-git-release.sh` backs up the current SiteGround Git state (tag), then applies the payload as a scoped commit pushed to the SiteGround Git remote — the official deployment backend. Any change outside the owned paths aborts the release before a commit is created.
4. The workflow verifies production (root, `/wp-json/dtb/v1/health`, `/checkout/`) and auto-restores from the backup tag on any failure.
5. Every stage reports a signed event to `dtb-deployment`'s webhook, which records it in `wp_dtb_release_events`, purges PHP OPcache/SiteGround Dynamic Cache on success, and powers System Manager (production status, history, drift, rollback).

See `docs/deployment/release-management-architecture.md` for the full design.

## Key Architectural Patterns

- **Headless**: React SPA communicates exclusively via WP REST API (`/wp-json/dtb/v1/`)
- **Proxy routes**: `dtb-platform/Rest/ProxyRoutes.php` forwards requests to WooCommerce Store API
- **Event sourcing**: Orders and repairs use event repositories + status projectors
- **JWT auth**: Custom JWT service bridges React auth to WooCommerce sessions
- **Feature flags**: `dtb-platform/Config/FeatureFlags.php` gates functionality
- **Generated data files**: `src/data/*.generated.js` are code-generated static catalogs
- **Checkout**: native WooCommerce Checkout Block (`drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php`), not a custom DTB checkout stack. WooCommerce owns cart/customer/address/shipping/tax/order state; Payment Plugins for Stripe WooCommerce owns card fields/wallets/tokenization/capture; DTB layers on top via one stylesheet (`assets/checkout/checkout.css`) restyling native Checkout Block markup by its real per-block identity classes (`.wp-block-woocommerce-checkout-*-block`) and one script (`assets/checkout/checkout.js`) that, mobile-only, presents the same unmodified DOM as a 3-step wizard (Contact/Shipping/Payment) via `classifyStepGroups()` (classification keyed on WooCommerce Blocks' own stable CSS classes, e.g. `.wc-block-checkout__shipping-fields`, walked up to the nearest `.wc-block-components-checkout-step` ancestor — never DOM position or `data-block-name`, both proved unreliable across redesign iterations). Stripe's Payment Element is themed via the Appearance API (`dtb-commerce/Payment/StripeElementAppearance.php`, the `wc_stripe_get_element_options` filter) without replacing the merchant's own UPM theme setting. See `docs/checkout/checkout-ui-architecture.md` for full redesign history and validation matrix.
