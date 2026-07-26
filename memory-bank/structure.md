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
| `dtb-schematics` | Schematic manifests, media, parts resolution |
| `dtb-media` | Image sync, product image linking, variation gallery |
| `dtb-returns` | Return portal workflow |
| `dtb-support` | Support tickets, contact form, SLA, admin workbench |
| `dtb-marketing` | SEO, coming-soon page |

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

## Deployment Pipeline

1. `frontend/` → Webpack production build
2. `launch/scripts/assemble-siteground.ps1` reconstructs the bounded `launch/live/` overlay
3. CI validates source, PHP, JavaScript, routing, and payload boundaries without writing to production
4. An operator creates independent backups and transfers the reviewed `launch/live/` change set manually through FileZilla
5. Runtime caches and production acceptance checks are completed separately

## Key Architectural Patterns

- **Headless**: React SPA communicates exclusively via WP REST API (`/wp-json/dtb/v1/`)
- **Proxy routes**: `dtb-platform/Rest/ProxyRoutes.php` forwards requests to WooCommerce Store API
- **Event sourcing**: Orders and repairs use event repositories + status projectors
- **JWT auth**: Custom JWT service bridges React auth to WooCommerce sessions
- **Feature flags**: `dtb-platform/Config/FeatureFlags.php` gates functionality
- **Generated data files**: `src/data/*.generated.js` are code-generated static catalogs
