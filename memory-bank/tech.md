# Tech

Last verified against active source: 2026-07-23.

## Runtime stack

### Frontend (`frontend/`)

Current package-level runtime profile includes React 19, React DOM 19, React Router DOM 7, Axios/fetch wrappers, Framer Motion, React Helmet Async, React Markdown/remark-gfm/DOMPurify, Lucide icons, Workbox/Webpack tooling, and Stripe client packages still present as dependencies.

Installed Stripe client packages do **not** grant React storefront payment authority. The active checkout/payment runtime is WooCommerce Checkout Block plus the official WooCommerce Stripe Payment Gateway.

### Backend (`drywalltoolbox/wp/`)

- WordPress in headless usage;
- WooCommerce;
- official WooCommerce Stripe Payment Gateway as the only storefront card/wallet authority;
- custom DTB must-use plugin suite under `drywalltoolbox/wp/wp-content/mu-plugins/`;
- explicit `00-dtb-loader.php` composition root loading 11 bounded modules;
- Action Scheduler for asynchronous order/integration work;
- headless/backend-support themes under `drywalltoolbox/wp/wp-content/themes/`.

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

Authoritative for products/customers, Store API cart/session state, checkout customer/address/shipping/tax/discount/totals, Checkout Block/order creation, operational orders/refunds, and the authoritative order/payment record.

### Official WooCommerce Stripe Payment Gateway

Authoritative for embedded Stripe payment rendering, supported payment methods, Link/eligible express wallets, tokenization, 3DS/SCA and redirects/challenges, payment execution/capture behavior, and Stripe webhook reconciliation into WooCommerce.

### DTB

Authoritative for headless/native checkout routing integration, checkout presentation/readiness/performance diagnostics that do not mutate payment authority, domain validation/policy, verified order/payment/refund lifecycle observation, event ledger/write boundaries/idempotency/integration state/queues/projections, catalog/schematic/media/repair/return/support/operator workflows, and integration policy.

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

`dtb-commerce/Payment/WooNativeCheckoutRuntime.php` explicitly preserves native WooCommerce/plugin runtime behavior for checkout/endpoints under the otherwise headless React storefront.

The assigned WooCommerce Checkout page is hosted through `dtb-commerce/Templates/WooNativeCheckoutPage.php` and contains the Woo Checkout Block.

### Official Stripe integration

`dtb-commerce/Payment/OfficialStripeNativeCheckout.php` owns DTB-side integration with the official gateway:

- public non-secret checkout capability/readiness metadata;
- native checkout asset enqueue;
- supported Stripe Appearance API configuration;
- official-gateway verification;
- checkout-order tagging;
- non-secret paid-reference mirroring after verified Woo paid lifecycle hooks;
- operator readiness notices.

Contract identifiers:

```text
CHECKOUT_GATEWAY = woo_native_stripe
CONTRACT_VERSION = woo-stripe-v1
provider = woocommerce_stripe
```

The public capabilities route is read-safe/local metadata only:

```text
GET /wp-json/dtb/v1/checkout/capabilities
```

It must not expose Stripe keys/webhook secrets/client secrets/tokens/raw credentials or perform slow external Stripe calls.

### Unified responsive checkout presentation

Canonical presentation sources:

```text
dtb-commerce/assets/woo-native-checkout.css
dtb-commerce/assets/woo-native-checkout-steps.js
dtb-commerce/assets/woo-native-checkout-ui.js
```

`woo-native-checkout.css` is the single authoritative visual system for the checkout shell, desktop two-column layout, cards, inputs, Express Checkout framing, shipping-rate cards, payment framing, order summary, mobile progress navigation, and mobile Continue actions.

`woo-native-checkout-steps.js` owns mechanical boot/reveal only.

`woo-native-checkout-ui.js` owns presentation-only mobile Contact/Shipping/Payment state, visited-step navigation, non-submit Continue actions, responsive cleanup, and invalid-control focus recovery.

Desktop remains a continuous two-column checkout. Mobile presents:

```text
1 Contact: eligible Express Checkout first + Woo contact/account controls
2 Shipping: Woo shipping/billing/delivery controls
3 Payment: inline official Woo/Stripe payment surface + native Place Order
```

Exactly one Woo Checkout Block and one official Stripe payment surface exist across breakpoints.

The retired bottom payment sheet and downstream profile override assets are intentionally absent:

```text
dtb-commerce/Payment/MobilePaymentSheet.php
dtb-commerce/assets/woo-native-checkout-payment-sheet.js
dtb-commerce/assets/woo-native-checkout-payment-sheet.css
dtb-commerce/assets/woo-native-checkout-profile-refinements.js
dtb-commerce/assets/woo-native-checkout-profile-refinements.css
```

Provider-owned payment controls must never be cloned/reparented/remounted. Mobile inactive payment/express surfaces remain mounted/measurable through the checkout document's provider-mount safety rule so Stripe initialization is not forced through a zero-width duplicate mount.

### Stripe appearance

DTB customizes provider-owned payment visuals only through the official Stripe gateway's supported `blocksAppearance`/Appearance API integration. Current DTB appearance tokens align Stripe fields/tabs with the checkout design system while preserving provider ownership.

Do not attempt to CSS inside Stripe iframes or build replacement payment controls.

### Checkout performance/stability

Owning source:

```text
dtb-commerce/Payment/CheckoutPerformance.php
dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
dtb-commerce/assets/woo-native-checkout-performance.js
```

Current behavior includes bounded runtime diagnostics, provider-surface timeout recovery, below-fold order-summary image policy, checkout-root replacement/state-loss signals, Core Web Vitals observation, third-party host audit, and SiteGround runtime protection.

`CheckoutRuntimeIntegrity.php` protects the checkout script graph from SiteGround async/combine/minify transformations, excludes checkout from page cache, and keeps Stripe.js executing from `js.stripe.com`.

Provider-surface timeout monitoring runs on desktop continuously and on enhanced mobile when the inline Payment step is active.

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

Operational path layout has changed over time. Scripts must inspect current paths and preserve stable identifiers/provenance.

## CI contract

Active workflow:

```text
.github/workflows/ci-build.yml
```

Triggers: pull requests to `main`, pushes to `main`, and manual dispatch.

It installs dependencies, runs frontend lint/build, validates custom MU-plugin/theme PHP syntax and active origin wiring, assembles a bounded deployment payload, validates required payload shape, and rejects runtime-owned/secret content.

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

Targeted PHP syntax should cover each changed PHP file.

Runtime staging acceptance for checkout/payment changes should prove:

- same-origin cart/session continuity;
- native Checkout Block rendering;
- official Stripe single-authority readiness;
- desktop continuous checkout and mobile Contact -> Shipping -> Payment;
- eligible Express Checkout first on mobile Contact;
- inline mobile payment with no duplicate runtime/surface;
- card success/decline and 3DS/SCA success/cancel/failure;
- eligible/ineligible express methods;
- shipping/totals parity;
- checkout root/form-state stability;
- payment-surface timeout recovery without a second payment flow;
- responsive mobile -> desktop -> mobile cleanup;
- exactly-once order creation/downstream dispatch;
- webhook replay tolerance;
- refund identity by `refund_id`;
- Veeqo and QuickBooks exactly-once effects.

Do not claim any smoke, syntax, runtime, payment, webhook, integration, CI, or deployment check passed unless it actually ran and produced evidence.

## Engineering conventions to preserve

- backend business rules stay in bounded mu-plugin modules;
- frontend data access stays in `frontend/src/api/`;
- React remains public renderer/cart/account/service/calculator UX and checkout handoff, not payment authority;
- native checkout/payment rendering stays in WooCommerce Checkout Block plus the official Stripe extension;
- DTB responsive checkout/performance code stays presentation/diagnostics only;
- order/integration writes use canonical queue/write-boundary/idempotency contracts;
- Veeqo remains inventory/fulfillment authority;
- QuickBooks remains accounting projection only;
- shipping language distinguishes DTB/Woo policy rates from live Veeqo carrier truth;
- public checkout performance work must fail open and never cache session-owned HTML;
- update durable docs whenever authorities/routes/contracts/queues/deployment behavior change.
