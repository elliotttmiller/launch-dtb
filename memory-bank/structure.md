# Drywall Toolbox — Project Structure

## Repository Layout

```
launch-dtb/
├── frontend/               # React SPA (Webpack 5, React 19)
│   ├── src/                # Application source
│   ├── public/             # Static assets copied verbatim to dist/
│   ├── scripts/            # Build-time assertion scripts (CJS)
│   ├── server/             # Local reviews mock server (Express)
│   └── webpack.config.cjs  # Production-grade build config
├── drywalltoolbox/
│   └── wp/
│       └── wp-content/
│           ├── mu-plugins/ # All custom PHP plugins (must-use)
│           ├── themes/     # WordPress theme
│           └── woocommerce/# WooCommerce template overrides
├── woo-email-templates/    # Custom WooCommerce transactional email templates
├── products/               # Product catalog data, media, schematics, parts CSVs
├── scripts/                # DevOps: catalog normalization, deployment, launch readiness
├── docs/                   # Architecture docs, design specs, integration guides
└── .github/workflows/      # CI: checkout UI contract tests, SiteGround release
```

## Frontend Source Structure (`frontend/src/`)

```
src/
├── api/          # API client modules per domain (cart, orders, products, repairs…)
├── auth/         # AuthContext, JWT tokenStore, useAuth hook
├── components/   # UI components organized by domain
│   ├── account/  checkout/ catalog/ cart/ product/ repairs/ schematics/
│   ├── shell/    # Header, Footer, CartSidebar
│   ├── routing/  # ProtectedRoute, PageTransition
│   ├── system/   # AppErrorBoundary
│   └── ui/       # Shared primitives
├── context/      # CartContext, WooCommerceContext, DesignConfigContext, WorkflowTransitionContext
├── designer/     # Visual designer bridge (PreviewBridge, useEditableComponent)
├── features/     # Feature-sliced modules (checkout/)
├── hooks/        # Domain hooks (useCart, useCatalogProducts, useOrderStatus…)
├── pages/        # Route-level page components (lazy-loaded)
├── services/     # Higher-level service abstractions (catalog, woocommerce, veeqo)
├── styles/       # Scoped CSS files per component/feature (no CSS modules)
├── utils/        # Pure utility functions (featureFlags, checkoutUrl, catalogFacets…)
├── motion/       # Framer Motion animation config
├── data/         # Generated/static data files (schematic maps, repair catalog)
└── constants/    # App-wide constants (images, shipping, sort options)
```

## PHP Plugin Architecture (`mu-plugins/`)

Each plugin follows a strict layered architecture:

```
dtb-{plugin}/
├── Domain/         # Pure value objects, enums, domain models
├── Application/    # Use-case handlers / command objects
├── Infrastructure/ # DB repositories, external clients, schema installers
├── Services/       # Business logic services
├── Rest/           # WP REST API controllers
├── Admin/          # WP admin pages, assets
├── Validation/     # Input validators
└── bootstrap.php   # Wires everything together via require_once
```

### Plugins
| Plugin | Responsibility |
|---|---|
| `dtb-platform` | Core: auth (JWT), cache, config, security, observability, REST base, admin shell |
| `dtb-catalog-platform` | Product catalog, facets, variations, parts, toolsets, inventory intelligence |
| `dtb-commerce` | Checkout, payment (Stripe), order REST, shipping, email overrides |
| `dtb-order-platform` | Order lifecycle, event sourcing, tracking, admin order UI |
| `dtb-repair-service` | Repair submission, status workflow, admin repair queue |
| `dtb-returns` | Return portal, status workflow |
| `dtb-support` | Support tickets, admin workbench |
| `dtb-schematics` | Schematic media sync, manifest, parts resolution |
| `dtb-media` | Product image sync from remote URLs |
| `dtb-integrations` | Veeqo, QuickBooks, Amazon, eBay, WooCommerce webhooks |
| `dtb-visual-designer` | Design token editor, draft/publish/rollback, email studio |
| `dtb-deployment` | GitHub release webhook, deployment lock, git control center |
| `dtb-marketing` | SEO, coming-soon referral |

## Architectural Patterns

### Headless Architecture
- React SPA is the customer-facing frontend; WordPress/WooCommerce is the backend API only
- SPA communicates via WP REST API (`/wp-json/`) and custom DTB REST routes (`/wp-json/drywall/v1/`)
- WooCommerce native checkout is embedded via a bridge (not a full page redirect)
- JWT tokens issued by WP, stored in React tokenStore, sent as Bearer headers

### Event Sourcing (Orders & Repairs)
- Orders and repairs use append-only event tables (`OrderEvent`, `RepairEvent`)
- Projections are built from event streams for customer-facing status and admin timelines
- Status transitions are validated before being applied

### REST API Pattern
- All controllers extend `AbstractRestController` from `dtb-platform`
- Responses use `RestResponseFactory` for consistent shape
- Schema validation via `RestSchema` helpers
- Rate limiting applied at platform level

### Frontend Data Flow
- API modules in `src/api/` are thin wrappers around axios client
- Domain hooks (`useCart`, `useCatalogProducts`) encapsulate fetch + state
- Contexts provide global state (cart, auth, design config)
- Pages are all lazy-loaded via `lazyWithReload()` with chunk-load failure auto-retry
