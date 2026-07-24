# Structure

Last verified against active source: 2026-07-24.

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
│        ├─ mu-plugins/                    canonical DTB backend/domain/runtime logic
│        └─ themes/
│           └─ drywall-toolbox/            active theme; checkout presentation owner
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
   │  ├─ mu-plugins/
   │  └─ themes/drywall-toolbox/
   └─ wp-config.php                       runtime-only; never deployed from Git
```

Repository `dist/` contents are the frontend payload source for the document root. Tracked MU-plugin and theme trees are deployment-source code for live `/wp/wp-content/` runtime.

Uploads, runtime cache, WordPress core, `wp-config.php`, upgrade state, and secrets are server-owned/runtime-managed and must not enter normal deployment payloads.

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

React owns public storefront rendering and browser interaction state. Backend modules own authorization, authoritative validation, persistence, lifecycle transitions, integration policy, and operational side effects.

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
- React `/checkout` is compatibility handoff only and must force full-document navigation to native Woo checkout.
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
- official Stripe checkout readiness/capability metadata and Appearance configuration;
- checkout performance/runtime telemetry and hosting/runtime safeguards;
- checkout order tagging and non-secret paid-reference mirroring;
- DTB shipping method/policy;
- commerce-facing REST/admin surfaces.

It does **not** own a parallel checkout presentation template/CSS/JS system.

Key checkout backend/runtime files:

```text
dtb-commerce/Payment/WooNativeCheckoutRuntime.php
dtb-commerce/Payment/StorefrontReturnContext.php
dtb-commerce/Payment/OfficialStripeNativeCheckout.php
dtb-commerce/Payment/CheckoutPerformance.php
dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
dtb-commerce/Validation/CheckoutFieldPolicy.php
dtb-commerce/assets/woo-native-checkout-performance.js
```

### Active theme checkout presentation

Canonical checkout UI source:

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/
├─ templates/checkout/native-checkout.php
└─ assets/checkout/
   ├─ checkout.css
   ├─ checkout-refinements.css
   ├─ checkout-flow.css
   ├─ checkout-boot.js
   ├─ checkout-ui.js
   ├─ checkout-profile.css
   └─ checkout-profile.js
```

Ownership:

- `native-checkout.php` — document shell and theme asset enqueue, then `the_content()` for the assigned Woo Checkout page;
- `checkout.css` — existing DTB checkout visual design;
- `checkout-refinements.css` — final same-origin Woo wrapper/Express/order-summary/contact presentation normalization;
- `checkout-flow.css` — responsive mobile Contact/Shipping/Payment presentation and provider-safe inactive mounting;
- `checkout-boot.js` — mechanical reveal;
- `checkout-ui.js` — presentation-only step/navigation/field-mirroring/duplicate-summary/single-gateway markers;
- `checkout-profile.*` — signed-in presentation refinements.

Theme code may style same-origin Woo wrappers but must not own authoritative validation, persistence, payment execution, order submission, provider eligibility, or iframe internals.

### Retired competing checkout presentation

These files are intentionally absent:

```text
dtb-commerce/assets/woo-native-checkout.css
dtb-commerce/assets/woo-native-checkout-refinements.css
dtb-commerce/assets/woo-native-checkout-ui.js
dtb-commerce/assets/woo-native-checkout-steps.js
dtb-commerce/Templates/WooNativeCheckoutPage.php

themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.css
themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.js
```

Do not recreate a second MU-plugin presentation layer or mobile payment sheet.

### `dtb-order-platform/`

Owns order lifecycle/status domain, append-only event ledger, integration state, `dtb-orders` queue/retry, order write boundary, duplicate containment, captured-payment lifecycle observation, atomic downstream dispatch, refund lifecycle keyed by concrete Woo `refund_id`, and customer/operator tracking projections.

## Checkout and fulfillment flow

```text
React cart / cart drawer
  -> WooCommerce Store API cookie-backed cart session + Nonce
  -> canonical full-document /checkout/
  -> root .htaccess routes request to WordPress
  -> WooNativeCheckoutRuntime preserves native Woo/plugin runtime and disables SPA ownership
  -> active theme templates/checkout/native-checkout.php
  -> assigned WooCommerce Checkout page via the_content()
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

Legacy raw Woo order creation, DTB-owned payment flows, browser-created Stripe payment flows, mobile payment sheets, and competing parallel card/wallet gateways remain retired/disallowed.

## Responsive checkout boundary

There is one mounted Woo Checkout Block and one official Stripe payment surface across all viewports.

Desktop:

```text
left rail: Express -> Contact -> Shipping -> Payment -> Place Order
right rail: canonical Woo Order Summary
```

Mobile:

```text
1 Contact: eligible Express Checkout + Woo contact/account controls
2 Shipping: Woo address/billing/delivery controls
3 Payment: inline official Woo/Stripe payment surface + native Place Order
```

The mobile controller owns presentation only. It may hide/reveal existing top-level Woo sections, provide progress navigation, provide non-submit Continue actions, classify duplicate summary/single gateway presentation, and mirror supported DTB contact fields to canonical Woo inputs.

It must not clone/reparent/remount payment controls, create payment objects, calculate totals, replace Woo validation, or replace Woo submission.

Provider-sensitive inactive payment/Express surfaces may remain measurable offscreen so provider initialization is not destroyed by zero-width/remount cycles.

## Checkout runtime safeguards

`dtb-commerce/Payment/CheckoutRuntimeIntegrity.php`:

- protects checkout from SiteGround async/combine/minify transforms;
- keeps Stripe.js executing directly from `js.stripe.com`;
- excludes checkout URLs from public page caching;
- recognizes current theme presentation handles plus DTB telemetry;
- does not retain retired MU presentation handles.

`dtb-commerce/Payment/CheckoutPerformance.php` and `assets/woo-native-checkout-performance.js` provide bounded diagnostics only and cannot mutate commerce state.

## Validation and deployment

Checkout-focused static smoke:

```powershell
.\scripts\smoke-dtb-checkout-ui.ps1
```

Backend/module smoke:

```powershell
.\scripts\smoke-dtb-mu-modules.ps1
```

Targeted PHP syntax must cover changed theme/MU PHP files.

CI source of truth:

```text
.github/workflows/ci-build.yml
```

Deployment source of truth:

```text
.github/workflows/deploy.yml
```

Merge is not deployment. Static smoke is not proof of browser checkout, payment, webhook, Veeqo, QuickBooks, or session-preserving runtime acceptance.
