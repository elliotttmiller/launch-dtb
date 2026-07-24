# Tech

Last verified against active source: 2026-07-24.

## Runtime stack

### Frontend (`frontend/`)

Current runtime includes React 19, React DOM 19, React Router DOM 7, Axios/fetch wrappers, Framer Motion, React Helmet Async, React Markdown/remark-gfm/DOMPurify, Lucide icons, Workbox/Webpack tooling, and Stripe client packages that remain dependency-only.

Installed Stripe client packages do **not** grant React storefront payment authority. React owns cart/account/storefront UX and checkout handoff only.

### Backend (`drywalltoolbox/wp/`)

- WordPress in headless usage;
- WooCommerce;
- official WooCommerce Stripe Payment Gateway as the only storefront card/wallet authority;
- DTB must-use plugin suite under `drywalltoolbox/wp/wp-content/mu-plugins/`;
- active `drywall-toolbox` theme under `drywalltoolbox/wp/wp-content/themes/`;
- Action Scheduler for asynchronous order/integration work.

Loader order:

1. `dtb-platform`
2. `dtb-catalog-platform`
3. `dtb-commerce`
4. `dtb-order-platform`
5. `dtb-schematics`
6. `dtb-media`
7. `dtb-marketing`
8. `dtb-repair-service`
9. `dtb-integrations`
10. `dtb-support`
11. `dtb-returns`

## System authorities

### WooCommerce

Authoritative for products/customers, Store API cart/session state, checkout customer/address/shipping/tax/discount/totals, Checkout Block state/order creation, operational orders/refunds, and authoritative order/payment status.

### Official WooCommerce Stripe Payment Gateway

Authoritative for embedded payment rendering, supported payment methods, Link/eligible express wallets, tokenization, 3DS/SCA and redirects/challenges, payment execution/capture behavior, and Stripe webhook reconciliation into WooCommerce.

### DTB

Authoritative for headless/native checkout routing integration, security/runtime boundaries, domain validation/policy, verified order/payment/refund lifecycle observation, event ledger/write boundaries/idempotency/integration state/queues/projections, catalog/schematic/media/repair/return/support/operator workflows, and integration policy.

Checkout **presentation** is owned by the active `drywall-toolbox` theme; MU plugins do not own a parallel checkout UI layer.

### Veeqo / QuickBooks

Veeqo owns inventory/fulfillment truth. Current checkout shipping rates are Woo/DTB policy rates, not live Veeqo carrier quotes.

QuickBooks is an accounting projection after eligible payment/refund lifecycle events and never creates storefront orders.

## Build and tooling

Frontend CI uses Node 20, `npm ci --include=dev`, Webpack 5, Babel, Tailwind/PostCSS, ESLint, Workbox, Terser/CSS minimization, and build-safety checks.

Only public configuration may enter `REACT_APP_*`. Server credentials/secrets remain in protected WordPress/host/plugin configuration.

Do not assume historical validation script names still exist. Inspect current source before citing or running a smoke script.

## Frontend API/session model

Canonical browser communication uses:

- `frontend/src/api/client.js` for DTB/proxy requests;
- `frontend/src/api/cart.js` for Woo Store API cart/session operations;
- domain-specific modules under `frontend/src/api/`;
- same-origin cookie credentials where required;
- optional bearer compatibility tokens from memory only.

Preferred authentication uses HttpOnly `dtb_auth` cookies.

For same-origin production/staging cart traffic:

- WooCommerce cookie-backed session is cart/checkout continuity authority;
- Store API mutations use `Nonce`;
- `Cart-Token` is compatibility-only for genuinely cross-origin clients;
- do not maintain a second persisted same-origin cart state;
- never decode unsigned Cart-Token payloads or query arbitrary Woo session rows to recover browser state.

## Checkout runtime architecture

### React handoff

React owns cart page/drawer and checkout CTA/handoff only. `frontend/src/pages/WooNativeCheckout.jsx` is a compatibility route that performs full-document navigation to native Woo checkout and does not render payment controls.

### Native Woo runtime exception

`dtb-commerce/Payment/WooNativeCheckoutRuntime.php` preserves native WooCommerce/plugin runtime behavior under the otherwise headless React storefront.

It removes the normal React SPA asset/template ownership on native checkout, then resolves the active theme template:

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php
```

If that template is unavailable, it fails open to Woo/WordPress's resolved template rather than rendering a second MU-plugin checkout document.

It also preserves private/no-store response behavior and durable Store API checkout metadata persistence.

### Theme-owned checkout presentation

Canonical presentation sources:

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php

drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.css
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-refinements.css
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-flow.css
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-boot.js
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-ui.js
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-profile.css
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-profile.js
```

Responsibilities:

- `checkout.css` — existing DTB checkout visual design, desktop layout, fields, selectors, summary, payment/Express outer presentation;
- `checkout-refinements.css` — final same-origin Woo wrapper normalization, Express/order-summary de-boxing, contact identity presentation, single-gateway shell normalization;
- `checkout-flow.css` — mobile progress, responsive step visibility, provider-safe offscreen mounting, sticky Back/Continue controls;
- `checkout-boot.js` — mechanical reveal only;
- `checkout-ui.js` — presentation-only Contact/Shipping/Payment state, visited-step navigation, non-submit Continue actions, contact-to-canonical-Woo field mirroring, duplicate summary containment, single-gateway marker;
- `checkout-profile.*` — signed-in presentation refinements.

Desktop remains a continuous checkout. Mobile presents:

```text
1 Contact: eligible Express Checkout + Woo contact/account controls
2 Shipping: Woo shipping/billing/delivery controls
3 Payment: inline official Woo/Stripe payment surface + native Place Order
```

Exactly one Woo Checkout Block and one official Stripe payment surface exist across breakpoints.

There is no mobile payment sheet/modal and no alternate payment container.

Provider-owned payment controls must never be cloned, reparented, or remounted. Provider-sensitive inactive payment/Express surfaces remain in Woo's React tree and may be kept measurable offscreen for initialization safety.

### Retired competing presentation

The following are intentionally absent and must not be recreated:

```text
dtb-commerce/assets/woo-native-checkout.css
dtb-commerce/assets/woo-native-checkout-refinements.css
dtb-commerce/assets/woo-native-checkout-ui.js
dtb-commerce/assets/woo-native-checkout-steps.js
dtb-commerce/Templates/WooNativeCheckoutPage.php

themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.js
themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.css
```

### Official Stripe integration

`dtb-commerce/Payment/OfficialStripeNativeCheckout.php` owns DTB-side official gateway integration only:

- public non-secret checkout capability/readiness metadata;
- supported Stripe Appearance API configuration;
- official-gateway verification;
- checkout-order tagging;
- non-secret paid-reference mirroring after verified Woo paid lifecycle hooks;
- operator readiness notices.

It does **not** enqueue checkout presentation CSS/JS.

Contract identifiers:

```text
CHECKOUT_GATEWAY = woo_native_stripe
CONTRACT_VERSION = woo-stripe-v1
provider = woocommerce_stripe
```

Read-safe capabilities route:

```text
GET /wp-json/dtb/v1/checkout/capabilities
```

It must not expose Stripe keys/webhook secrets/client secrets/tokens/raw credentials or perform slow external Stripe calls.

### Checkout field policy

`dtb-commerce/Validation/CheckoutFieldPolicy.php` owns Checkout Block contact-field registration and defensive server-side persistence only. It owns no CSS/JS.

Theme presentation mirrors DTB First name, Last name, and Phone contact fields into canonical Woo billing/shipping inputs. Native duplicate inputs stay mounted/synchronized for Woo validation, shipping/tax, fraud, orders, customers, and integrations, but duplicate shopper presentation is hidden after classification.

### Stripe appearance

Provider-owned payment visuals are customized only through the official Stripe gateway's supported `blocksAppearance`/Appearance API integration.

Do not CSS inside Stripe iframe descendants or build replacement payment controls.

### Checkout performance/stability

Owning backend/diagnostic source:

```text
dtb-commerce/Payment/CheckoutPerformance.php
dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
dtb-commerce/assets/woo-native-checkout-performance.js
```

`CheckoutRuntimeIntegrity.php` protects the checkout script graph from SiteGround async/combine/minify transformations, excludes checkout from public page cache, and keeps Stripe.js executing from `js.stripe.com`.

It recognizes active theme checkout script handles plus the DTB telemetry script; retired MU presentation handles are not part of the runtime contract.

Provider-surface timeout monitoring runs continuously on desktop and when the inline mobile Payment step is active.

Diagnostics route:

```text
POST /wp-json/dtb/v1/checkout/runtime-telemetry
```

Security contract: dedicated nonce, same-origin validation when Origin is present, rate limiting, event-ID deduplication, allowlisted event kinds, bounded/sanitized fields, query-stripped source URLs, sensitive-value redaction, no commerce writes, and no synchronous external calls.

## Captured-payment and refund technology contracts

Initial downstream effects require:

```text
_dtb_checkout_gateway = woo_native_stripe
_dtb_checkout_contract_version = woo-stripe-v1
_dtb_payment_provider = woocommerce_stripe
WooCommerce date_paid present
non-secret transaction/payment reference present
```

`_dtb_payment_provider` is mirrored only for orders whose selected gateway instance is verified as the official WooCommerce Stripe extension.

Authorization-only/manual-capture state is not fulfillable.

Initial downstream processing uses an atomic per-order dispatch barrier.

Refunds are keyed by concrete `order_id + refund_id` across events, queue arguments, idempotency, and QuickBooks projection. Multiple partial refunds remain distinct.

## Async and integration execution

Order-related external effects use:

```text
dtb_order_enqueue_job()
Action Scheduler group: dtb-orders
```

New jobs require explicit owner, hook/args, idempotency/deduplication, retry/backoff, terminal failure, observability, recovery/replay, and compensation semantics.

Avoid slow external calls during checkout, authentication, or webhook acknowledgement.

## Backend API surface

- `dtb/v1` — platform/domain APIs including auth/account, checkout capabilities/telemetry, catalog, schematics/media, repairs, returns, support, integrations, health/cache, operator endpoints.
- `drywall/v1` — compatibility/proxy surfaces; legacy raw storefront order creation remains retired.
- `headless/v1` — theme-level headless support endpoints.
- `wc/store/v1` — Woo Store API for public cart/session and Checkout Block runtime operations.

## Authentication and security posture

- preferred HttpOnly `dtb_auth` cookie;
- optional in-memory bearer compatibility only;
- no JWT/application password/consumer secret/API key/payment secret in browser persistence;
- centralized origin/CORS policy;
- explicit route permission callbacks;
- customer records bound to authenticated ownership;
- admin routes require capabilities;
- public routes read-safe or narrowly protected;
- official Stripe webhook authentication/reconciliation owned by the official gateway;
- order write boundary blocks raw external storefront order creation/duplicate side effects;
- checkout telemetry cannot mutate commerce state.

## Catalog/data technology constraints

Canonical taxonomy policy:

```text
products/Production/catalogs/config/production_taxonomy_policy.json
```

Operational path layout changes over time. Scripts must inspect current paths and preserve stable identifiers/provenance.

## CI contract

Active workflow:

```text
.github/workflows/ci-build.yml
```

Triggers: pull requests to `main`, pushes to `main`, and manual dispatch.

CI installs dependencies, runs frontend lint/build, validates custom MU-plugin/theme PHP syntax and active origin wiring, assembles a bounded deployment payload, validates required payload shape, and rejects runtime-owned/secret content.

CI build success is not deployment.

## SiteGround deployment contract

Active workflow:

```text
.github/workflows/deploy.yml
```

Controlled deploy/restore requires confirmation, protected `siteground-production` approval, immutable payload, managed-surface backup, bounded SFTP upload, HTTP smoke checks, automatic managed-file rollback, and explicit restore.

Merge is not deployment. File smoke is not proof of Stripe/webhook/Veeqo/QuickBooks/session-preserving checkout acceptance.

## Validation baseline

Frontend:

```powershell
cd frontend
npm ci --include=dev
npm run lint
npm run build
```

Checkout/backend:

```powershell
.\scripts\smoke-dtb-checkout-ui.ps1
.\scripts\smoke-dtb-mu-modules.ps1
```

Targeted PHP syntax must cover changed PHP files.

Runtime staging acceptance must prove:

- same-origin cart/session continuity;
- theme-owned native Checkout Block rendering;
- official Stripe single-authority readiness;
- existing desktop checkout UI;
- mobile Contact -> Shipping -> Payment with inline payment and no payment sheet;
- eligible Express Checkout;
- contact identity persistence to canonical Woo order/address properties;
- shipping/totals parity;
- card success/decline and 3DS/SCA success/cancel/failure;
- responsive mobile -> desktop -> mobile cleanup;
- exactly one Stripe runtime/payment surface;
- exactly-once order creation/downstream dispatch;
- webhook replay tolerance;
- refund identity by `refund_id`;
- Veeqo and QuickBooks exactly-once effects.

Do not claim any smoke, syntax, runtime, payment, webhook, integration, CI, or deployment check passed unless it actually ran and produced evidence.

## Engineering conventions to preserve

- backend business rules stay in bounded MU-plugin modules;
- checkout presentation stays in the active theme and does not become payment authority;
- frontend data access stays in `frontend/src/api/`;
- React remains public renderer/cart/account/service/calculator UX and checkout handoff, not payment authority;
- native checkout/payment rendering stays in WooCommerce Checkout Block plus the official Stripe extension;
- DTB presentation/diagnostics remain non-authoritative and fail open;
- order/integration writes use canonical queue/write-boundary/idempotency contracts;
- Veeqo remains inventory/fulfillment authority;
- QuickBooks remains accounting projection only;
- shipping language distinguishes DTB/Woo policy rates from live Veeqo carrier truth;
- public checkout performance work must never cache session-owned HTML;
- update durable docs whenever authorities/routes/contracts/queues/deployment behavior change.
