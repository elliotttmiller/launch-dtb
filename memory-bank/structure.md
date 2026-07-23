# Structure

Last verified against active source: 2026-07-23.

## Architecture truth

Drywall Toolbox is a headless commerce and operations platform with four primary repository layers:

1. `frontend/` — React SPA and customer-facing route/UI implementation.
2. `drywalltoolbox/` — tracked production deployment mirror; WordPress/WooCommerce application code lives under `drywalltoolbox/wp/`.
3. `products/` — production catalog, taxonomy, image, schematic, pricing, compatibility, source, launch, and audit data.
4. `scripts/` — deterministic catalog/media/checkout/operational tooling.

There is no canonical root-level `wp/` application directory. Backend edits belong under `drywalltoolbox/wp/` unless a task explicitly targets deployment documentation or runtime/generated state.

Generated `dist/` output is not a source editing target.

## Repository map

```text
drywall-toolbox/
├─ .github/
│  └─ workflows/
│     ├─ ci-build.yml
│     └─ deploy.yml
├─ dist/                                  generated frontend build output
├─ docs/                                  current architecture/operations/reference docs
├─ drywalltoolbox/                        tracked SiteGround deployment source mirror
│  ├─ .htaccess                           domain-root routing/security/cache policy
│  ├─ logos/
│  └─ wp/
│     ├─ .htaccess
│     ├─ index.php
│     └─ wp-content/
│        ├─ mu-plugins/                    canonical DTB backend platform
│        └─ themes/                        headless/backend-support themes
├─ frontend/                              React storefront source
├─ launch/live/                           generated runtime-safe deployment overlay
├─ memory-bank/                           durable project context
├─ products/                              catalog/media/source/launch operations workspace
├─ scripts/                               operational and validation tooling
├─ AGENTS.md                              repository engineering authority contract
└─ README.md
```

## Production topology

```text
SiteGround document root for elliottm4.sg-host.com
├─ index.html                             React application shell
├─ assets/                                compiled React assets
├─ .htaccess                              native WP/checkout routes before SPA fallback
├─ logos/
├─ staging/{id}/                          staging React build roots where deployed
└─ wp/                                    WordPress + WooCommerce runtime
   ├─ wp-admin/
   ├─ wp-includes/
   ├─ wp-content/
   └─ wp-config.php                       runtime-only; never deployed from Git
```

Repository `dist/` contents are the frontend payload source for the document root. Tracked `drywalltoolbox/wp/wp-content/mu-plugins/` and theme trees are deployment-source code for the live `/wp/wp-content/` runtime.

Uploads, runtime cache, WordPress core, `wp-config.php`, upgrade state, and secrets are server-owned/runtime-managed and must not be included in normal deployment payloads.

## Request flow

```text
Browser
  -> domain-root drywalltoolbox/.htaccess
     -> native Woo/WP routes before SPA fallback
        /wp-json/*
        /wp-admin/*
        /checkout/
        /checkout/order-pay/*
        /checkout/order-received/*
        WooCommerce wc-api callbacks
     -> existing static file / React index.html for SPA routes
  -> React route in frontend/src/App.jsx
  -> frontend/src/api/*, hooks, contexts, analytics
  -> WordPress REST / Woo Store API
  -> DTB controller/service/repository or WooCommerce runtime
  -> WooCommerce, DTB persistence, Action Scheduler, Veeqo, QuickBooks
```

React owns public rendering and browser interaction state. Backend modules own authorization, authoritative validation, persistence, lifecycle transitions, integration policy, and operational side effects.

Checkout is intentionally a native WordPress/WooCommerce document, not a React payment runtime.

## Frontend structure

```text
frontend/
├─ public/
├─ scripts/
├─ server/
├─ src/
│  ├─ analytics/
│  ├─ api/                        canonical browser data access
│  ├─ auth/
│  ├─ components/
│  ├─ context/
│  ├─ hooks/
│  ├─ pages/
│  ├─ services/                   compatibility/facade only
│  ├─ styles/
│  ├─ utils/
│  │  ├─ checkoutPrewarm.js
│  │  └─ checkoutUrl.js
│  ├─ App.jsx
│  └─ main.jsx
├─ package.json
└─ webpack.config.cjs
```

### Frontend ownership rules

- Register public routes in `frontend/src/App.jsx`.
- Put new server communication in `frontend/src/api/`.
- Keep `frontend/src/services/` credential-free and compatibility-only.
- Use auth/session primitives under `frontend/src/auth/` and `frontend/src/api/client.js`.
- Use WooCommerce Store API for public cart/session operations; admin Woo credentials stay server-side.
- React `/checkout` is a compatibility handoff route only and must force full-document navigation to native Woo checkout.
- Do not mount a second payment runtime in React.
- Do not edit `dist/` as source.

## Public route groups

Important commerce routes include:

```text
/cart
/checkout                           React compatibility handoff only
/checkout/complete
/checkout/payment-failed
/checkout/payment-cancelled
/checkout/order-received/:id
/order/:id
/order-tracking/:id
```

Native `/checkout/`, order-pay, order-received, and provider callback routes are owned by WordPress/WooCommerce routing before SPA fallback.

## Backend composition

Composition root:

```text
drywalltoolbox/wp/wp-content/mu-plugins/00-dtb-loader.php
```

Canonical loader-managed order:

1. `dtb-platform/`
2. `dtb-catalog-platform/`
3. `dtb-commerce/`
4. `dtb-order-platform/`
5. `dtb-schematics/`
6. `dtb-media/`
7. `dtb-marketing/`
8. `dtb-repair-service/`
9. `dtb-integrations/`
10. `dtb-support/`
11. `dtb-returns/`

### `dtb-commerce/`

Owns:

- WooCommerce Store API cart extension data;
- checkout validation/field policy;
- native Woo checkout runtime exception for the headless theme;
- storefront return-context routing metadata;
- official Stripe checkout readiness/capability metadata;
- unified responsive checkout presentation and supported Stripe Appearance configuration;
- checkout performance/runtime telemetry;
- checkout order tagging and non-secret paid-reference mirroring;
- DTB shipping method/policy;
- commerce-facing REST/admin surfaces.

Key checkout files:

```text
dtb-commerce/Payment/WooNativeCheckoutRuntime.php
dtb-commerce/Payment/StorefrontReturnContext.php
dtb-commerce/Payment/OfficialStripeNativeCheckout.php
dtb-commerce/Payment/CheckoutPerformance.php
dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
dtb-commerce/Templates/WooNativeCheckoutPage.php
```

Canonical checkout assets:

```text
dtb-commerce/assets/woo-native-checkout.css
dtb-commerce/assets/woo-native-checkout-steps.js
dtb-commerce/assets/woo-native-checkout-ui.js
dtb-commerce/assets/woo-native-checkout-performance.js
```

Retired checkout presentation files are intentionally absent and must not be recreated as parallel layers:

```text
dtb-commerce/Payment/MobilePaymentSheet.php
dtb-commerce/assets/woo-native-checkout-payment-sheet.css
dtb-commerce/assets/woo-native-checkout-payment-sheet.js
dtb-commerce/assets/woo-native-checkout-profile-refinements.css
dtb-commerce/assets/woo-native-checkout-profile-refinements.js
```

### `dtb-order-platform/`

Owns order lifecycle/status domain, append-only event ledger, integration state, `dtb-orders` queue/retry, order write boundary, duplicate containment, captured-payment lifecycle observation, atomic downstream dispatch, refund lifecycle keyed by concrete Woo `refund_id`, and customer/operator tracking projections.

## Checkout and fulfillment flow

```text
React cart / cart drawer
  -> WooCommerce Store API cookie-backed cart session + Nonce
  -> canonical full-document /checkout/
  -> root .htaccess routes request to WordPress
  -> WooNativeCheckoutRuntime preserves native Woo/plugin runtime
  -> assigned WooCommerce Checkout page
  -> WooCommerce Checkout Block
  -> official WooCommerce Stripe Payment Gateway
  -> WooCommerce order/payment lifecycle
  -> DTB verified captured-payment event
  -> dtb-orders Action Scheduler queue
  -> Veeqo inventory/fulfillment synchronization
  -> QuickBooks accounting projection
  -> notifications/customer tracking projections
```

Only WooCommerce Checkout Block may create storefront orders.

Legacy raw Woo order creation, DTB-owned checkout session/finalization, browser-created Stripe payment flows, and competing parallel gateways remain retired/disallowed.

## Responsive checkout boundary

There is one mounted Woo Checkout Block and one official Stripe payment surface across all viewports.

Desktop:

```text
left rail: Express -> Contact -> Shipping -> Payment -> Place Order
right rail: sticky canonical Woo Order Summary
```

Mobile:

```text
1 Contact: eligible Express Checkout first + Woo contact/account controls
2 Shipping: Woo address/billing/delivery controls
3 Payment: inline official Woo/Stripe payment surface + native Place Order
```

The mobile step controller owns presentation only. It may hide/reveal existing top-level Woo sections, provide progress navigation, and provide non-submit Continue actions. It must not clone/reparent/remount payment controls, create payment objects, calculate totals, replace Woo validation, or replace Woo submission.

The retired bottom payment sheet is not part of the current architecture.

## Checkout performance/stability boundary

`CheckoutPerformance.php`, `CheckoutRuntimeIntegrity.php`, and `woo-native-checkout-performance.js` own checkout-specific diagnostics/runtime safety.

Rules:

- no cache of private `/checkout/` HTML;
- bounded runtime diagnostics only;
- no duplicate authoritative form/payment state;
- no fallback payment flow;
- SiteGround optimization must not reorder Woo/WordPress/Stripe dependencies or rehost Stripe.js;
- provider timeout recovery may only reload or point to an actually rendered eligible express surface.

Diagnostics route:

```text
POST /wp-json/dtb/v1/checkout/runtime-telemetry
```

## System authority map

- **React:** public rendering, browsing/cart/account/service/calculator UX, checkout handoff, local interaction state.
- **WooCommerce:** products, customers, Store API cart/session, Checkout Block, addresses, shipping/tax/totals, orders, refunds, authoritative order/payment record.
- **Official WooCommerce Stripe Payment Gateway:** card/payment-method rendering, Link, eligible express wallets, tokenization, 3DS/SCA, payment execution, webhook synchronization.
- **DTB:** domain policy, native-checkout routing/presentation/diagnostics, verified order observation, write boundaries, event ledger, queues, projections, catalog/media/schematic/repair/return/support workflows, operator tooling, integrations.
- **Veeqo:** sellable inventory, warehouse availability, allocation, fulfillment, labels, shipment state, carrier, tracking.
- **QuickBooks:** accounting projection after eligible payment/refund events.

## CI and deployment structure

`.github/workflows/ci-build.yml` runs for pull requests to `main`, pushes to `main`, and manual dispatch. It installs dependencies, lints/builds the frontend, validates custom PHP syntax and active origin wiring, assembles the bounded payload, and rejects forbidden runtime content.

`.github/workflows/deploy.yml` defines controlled SiteGround deploy/restore with exact confirmation, protected environment approval, managed-surface backup, bounded upload, HTTP smoke checks, rollback, and explicit restore.

Merge is not deployment. Passing HTTP smoke does not prove Stripe, webhook, Veeqo, QuickBooks, or shopper-session acceptance.

## Navigation model for engineers

- UI/UX route bug: `frontend/src/pages/*`, then `frontend/src/components/*`;
- frontend server access: `frontend/src/api/*`;
- cart/session/handoff: cart context/API and checkout URL/navigation utilities;
- backend business logic/API: `drywalltoolbox/wp/wp-content/mu-plugins/*`;
- native checkout/payment presentation/readiness: `dtb-commerce/Payment/*`, `dtb-commerce/Templates/*`, and `dtb-commerce/assets/woo-native-checkout*`;
- order lifecycle/queues/idempotency: `dtb-order-platform/*`;
- integrations: `dtb-integrations/*`;
- routing/deployment boundaries: `drywalltoolbox/.htaccess`, `drywalltoolbox/wp/.htaccess`, `.github/workflows/*`.

Always inspect active source before editing; this structure map is durable orientation, not a substitute for source verification.
