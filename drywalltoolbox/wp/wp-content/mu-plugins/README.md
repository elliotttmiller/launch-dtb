<!-- markdownlint-disable MD013 MD032 -->

# Drywall Toolbox MU-Plugin Architecture and Runtime Contract

Last verified against source: 2026-07-24.

Source code and the active loader are authoritative for `drywalltoolbox/wp/wp-content/mu-plugins/`. When this document and implementation diverge, correct the document in the same change.

## 1. Runtime model

`00-dtb-loader.php` is the explicit composition root. Preserve module order:

1. `dtb-platform/bootstrap.php`
2. `dtb-catalog-platform/bootstrap.php`
3. `dtb-commerce/bootstrap.php`
4. `dtb-order-platform/bootstrap.php`
5. `dtb-schematics/bootstrap.php`
6. `dtb-media/bootstrap.php`
7. `dtb-marketing/bootstrap.php`
8. `dtb-repair-service/bootstrap.php`
9. `dtb-integrations/bootstrap.php`
10. `dtb-support/bootstrap.php`
11. `dtb-returns/bootstrap.php`

New bounded business logic belongs inside the owning module subtree. Root compatibility files may delegate but must not become new domain homes.

## 2. Module responsibilities

### `dtb-platform`

Security/origin/authentication, shared support primitives, cache/health/logging/metrics, account/history APIs, admin workbenches, Command Center, and System Manager.

### `dtb-catalog-platform`

Catalog/product/variation/brand/taxonomy models and normalization, relationships, compatible/universal parts, inventory intelligence, validation, REST/CLI/admin tooling.

### `dtb-commerce`

- WooCommerce Store API cart extension data;
- toolset/order-line metadata;
- native Woo checkout runtime exception for the headless storefront;
- checkout field/domain policy;
- official WooCommerce Stripe gateway readiness/capability metadata;
- official Stripe Appearance API configuration;
- checkout runtime integrity/performance telemetry;
- checkout-order contract tagging and non-secret paid-reference mirroring;
- DTB shipping policy method;
- order-type/query and branded email support;
- commerce-facing REST/admin surfaces.

`dtb-commerce` does **not** own a parallel checkout presentation template/CSS/JS system.

The checkout runtime adapter lives at:

```text
dtb-commerce/Payment/WooNativeCheckoutRuntime.php
```

It prevents the headless theme from forcing checkout into the React SPA or stripping Woo/plugin assets. It delegates checkout document presentation to:

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php
```

The adapter fails open to Woo/WordPress's resolved template if the expected theme checkout template is unavailable. It never manually creates Checkout Block state, Stripe fields, PaymentIntents, Stripe Checkout Sessions, or orders.

Official Stripe integration lives at:

```text
dtb-commerce/Payment/OfficialStripeNativeCheckout.php
```

It owns:

- official extension/gateway identity verification;
- read-safe local checkout capability/readiness metadata;
- supported `wc_stripe_upe_params` / `blocksAppearance` configuration;
- checkout contract metadata tagging;
- verified paid-lifecycle non-secret payment reference mirroring;
- readiness/HTTPS/competing-gateway operator notices.

It owns no checkout CSS/JS.

Checkout field policy lives at:

```text
dtb-commerce/Validation/CheckoutFieldPolicy.php
```

It owns Checkout Block contact-field registration, optional phone policy, and defensive server-side synchronization into canonical Woo billing/shipping properties. It owns no presentation assets.

Theme-owned presentation source:

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php

drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.css
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-refinements.css
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-flow.css
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-boot.js
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-ui.js
```

The active theme owns one ordered presentation stack only. `checkout-ui.js` is the sole theme controller for responsive step state, canonical contact-field mirroring, duplicate summary containment, and single-gateway presentation markers.

Retired competing checkout presentation files are intentionally absent:

```text
dtb-commerce/assets/woo-native-checkout.css
dtb-commerce/assets/woo-native-checkout-refinements.css
dtb-commerce/assets/woo-native-checkout-ui.js
dtb-commerce/assets/woo-native-checkout-steps.js
dtb-commerce/Templates/WooNativeCheckoutPage.php

themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.js
themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.css
themes/drywall-toolbox/assets/checkout/checkout-profile.js
themes/drywall-toolbox/assets/checkout/checkout-profile.css
```

Do not recreate a second MU-plugin presentation layer, mobile payment sheet, or second theme profile/field-state controller.

Checkout performance/stability diagnostics live at:

```text
dtb-commerce/Payment/CheckoutPerformance.php
dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
dtb-commerce/assets/woo-native-checkout-performance.js
```

They own scoped diagnostics, provider-surface timeout observation, CWV/third-party/root-replacement signals, nonce/origin/rate-limited telemetry, hosting optimizer exclusions, Stripe.js origin protection, and checkout cache exclusion. They do not reconstruct Woo form state or create payment/order state.

Diagnostics route:

```text
POST /wp-json/dtb/v1/checkout/runtime-telemetry
```

It requires a dedicated nonce, same-origin validation when Origin is present, rate limiting, event deduplication, allowlisted event kinds, bounded/sanitized fields, and sensitive-value redaction. It never accepts authoritative cart/order/payment writes.

### `dtb-order-platform`

- order statuses/transitions and append-only event ledger;
- integration-state persistence;
- `dtb-orders` Action Scheduler queue/retry;
- order write boundary and duplicate containment;
- captured-payment lifecycle observation;
- refund lifecycle projection keyed by concrete Woo refund ID;
- customer/operator tracking projections and order REST/admin surfaces.

### `dtb-schematics` / `dtb-media`

Schematic mapping/editor/runtime APIs and image/media synchronization, validation, registration, and repair tooling.

### `dtb-marketing`

Coming-soon/subscriber and SEO support.

### `dtb-repair-service`

Repair statuses/events/persistence, intake/media/public tokens/quotes/SLA/queues/notifications, customer/operator timelines, REST/admin workbench.

### `dtb-integrations`

Woo adapters, Veeqo inventory/fulfillment, QuickBooks accounting projection, notification dispatch, order pipeline contracts, webhook guards, and marketplace infrastructure.

QuickBooks refund projection must be keyed by `order_id + refund_id`; one cumulative parent-order refund marker is not sufficient for multiple partial refunds.

Rewards integration remains launch-gated unless backend services/jobs/controllers are explicitly restored and validated.

### `dtb-support` / `dtb-returns`

Independent support-ticket and return lifecycle domains with persistence, authorization, customer/admin REST, notifications, histories, and operator workbenches.

## 3. Checkout/payment trust boundary

```text
React cart / cart drawer
  -> WooCommerce Store API same-origin cookie session
  -> full-document /checkout/
  -> domain-root routing to WordPress
  -> DTB native checkout runtime exempts request from React SPA ownership
  -> active theme native-checkout.php presentation host
  -> assigned WooCommerce Checkout page via the_content()
  -> WooCommerce Checkout Block
  -> official WooCommerce Stripe Payment Gateway
  -> WooCommerce order/payment lifecycle
  -> DTB captured-payment verification
  -> dtb-orders queue
  -> Veeqo / QuickBooks / notifications / tracking
```

Authority rules:

- WooCommerce owns cart/session/customer/address/shipping/tax/totals/order creation and authoritative order/payment status.
- Official WooCommerce Stripe Payment Gateway owns Stripe payment rendering, eligible wallets/Link, tokenization, 3DS/SCA, payment execution, and webhook synchronization.
- React owns cart UX/handoff only and must not render payment fields, wallet iframes, fake buttons, or create payment/order objects.
- The active theme owns checkout document/layout/styling/presentation behavior only.
- MU plugins own backend runtime/security/domain policy, readiness, lifecycle observation, telemetry, and integration boundaries.
- Desktop and mobile use one mounted Woo Checkout Block and one official Stripe payment surface.
- Mobile Contact/Shipping/Payment is presentation state only; there is no payment modal/sheet or second payment state machine.
- Express Checkout remains provider-owned and is shown when eligible.
- Checkout telemetry observes failures/performance only and never becomes a cart/order/payment write path.
- Veeqo owns fulfillment truth; QuickBooks owns accounting projection only.

Same-origin React cart traffic uses WooCommerce's cookie-backed session + Store API `Nonce`. Cart-Token is compatibility-only for genuinely cross-origin clients. DTB must never decode unsigned Cart-Token payloads or query `woocommerce_sessions` to recover arbitrary sessions.

Private checkout HTML must not be prefetched or cached as a generic public document.

## 4. Captured-payment contract

A storefront order is eligible for paid downstream effects only when all are true:

```text
_dtb_checkout_gateway = woo_native_stripe
_dtb_checkout_contract_version = woo-stripe-v1
_dtb_payment_provider = woocommerce_stripe
WooCommerce date_paid is present
non-secret transaction/payment reference is present
```

`_dtb_payment_provider` is mirrored only after the selected gateway instance is verified as originating from the official `woocommerce-gateway-stripe` extension.

Authorization-only/manual-capture state is not fulfillable. Launch should use automatic capture unless a reviewed manual-capture workflow is explicitly approved and tested.

Initial downstream processing dispatch is protected by an atomic per-order barrier.

## 5. Refund contract

WooCommerce owns refund creation. `woocommerce_order_refunded` supplies both parent `order_id` and concrete `refund_id`.

Each refund must retain that identity through queue arguments, event idempotency, and QuickBooks projection. Partial refund A and partial refund B are distinct accounting events.

Do not infer cancellation from the parent order remaining in processing after a partial refund. Do not use cumulative `get_total_refunded()` as the amount for every refund event.

## 6. Request/security boundaries

Every REST route needs explicit permission behavior. Customer-facing record reads must authenticate, derive the validated customer identity, verify record ownership, and not trust caller-supplied customer IDs.

Server-only secrets include Woo application credentials, JWT signing secrets, official Stripe secret/webhook configuration, Veeqo/QuickBooks/marketplace credentials, and external-write secrets. Browser `REACT_APP_*` values are public by definition.

The React storefront does not require a Stripe key for the current architecture.

The public checkout capabilities endpoint may expose only non-secret readiness/performance metadata. It must not return Stripe keys, webhook secrets, PaymentIntent/Checkout Session client secrets, tokens, raw webhook data, or payment credentials. Readiness checks must remain local/non-blocking.

Checkout runtime telemetry must never persist raw form values, email addresses, order keys, bearer/JWT tokens, Stripe keys/webhook secrets/client secrets, or Checkout Session secrets. The server sanitizes/redacts telemetry before logging; client source URLs omit query strings.

## 7. Routing/cache contract

Root routing must send these to WordPress before SPA fallback:

```text
/checkout/
/staging/{id}/checkout/
/checkout/order-pay/{id}
/checkout/order-received/{id}
/wp-json/*
?rest_route=...
?wc-api=wc_stripe
```

Checkout, callbacks, session-owned pages, and payment endpoints are private/no-store. Host cache-bypass cookies must be added without replacing WordPress/WooCommerce `Set-Cookie` headers.

SiteGround/host JavaScript optimization must not rehost Stripe.js or reorder WordPress/Woo/Stripe checkout dependencies. `CheckoutRuntimeIntegrity.php` preserves this boundary.

## 8. Async/integration contract

Order-related external effects use `dtb_order_enqueue_job()` and Action Scheduler group `dtb-orders`.

New work must define owner, hook/args, idempotency/deduplication, retries/terminal failure, observability, and recovery. Slow Veeqo/QuickBooks calls must not occur synchronously during checkout or Stripe webhook acknowledgement.

Checkout telemetry is a local bounded log write and must not make slow external calls during checkout.

## 9. Deployment contract

`drywalltoolbox/` is the tracked deployment mirror. Deploy exact changed files; do not broad-copy runtime-owned WordPress state.

Never overwrite `wp-config.php`, WordPress core unintentionally, uploads, cache, upgrade state, runtime secrets, or uncontrolled dumps.

Clean deployments must delete retired checkout/payment presentation artifacts rather than leave them beside the canonical runtime.

## 10. Validation

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

Targeted PHP syntax:

```powershell
php -l drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/WooNativeCheckoutRuntime.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/OfficialStripeNativeCheckout.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/CheckoutPerformance.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Validation/CheckoutFieldPolicy.php
```

Then complete session-preserving browser validation for desktop/mobile checkout, official Stripe methods, shipping/totals, 3DS/SCA, order-pay/order-received, duplicate containment, and downstream exactly-once effects.

Do not claim smoke, syntax, browser, payment, webhook, integration, CI, or deployment checks passed unless they actually ran and produced evidence.
