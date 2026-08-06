<!-- markdownlint-disable MD013 MD032 -->

# Drywall Toolbox MU-Plugin Architecture and Runtime Contract

Last verified against active source: 2026-07-28.

Source code and the active loader are authoritative for `drywalltoolbox/wp/wp-content/mu-plugins/`. Correct this document in the same change whenever implementation changes.

## 1. Runtime model

`00-dtb-loader.php` is the composition root. Preserve module order:

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

### WP-admin presentation ownership

The active regular plugin at
`wp/wp-content/plugins/brikpanel-admin-panel-dashboard-for-woocommerce` owns the
WordPress admin shell and theme. BrikPanel controls the admin toolbar, primary
navigation, submenu presentation, content offsets, core page surfaces, and
responsive admin chrome. The regular-plugin directory is operator-managed and is
not part of the tracked MU-plugin deployment mirror.

DTB does not enqueue an independent admin stylesheet layer. At the end of
`admin_enqueue_scripts`, `dtb-platform/Admin/AdminAssets.php` removes styles
registered from any `dtb-*` MU-plugin source and the legacy DTB font handle on
every wp-admin screen. Functional DTB JavaScript remains available, but BrikPanel is
the only runtime owner of typography, colors, spacing, surfaces, navigation,
content offsets, and responsive admin chrome. Module markup may retain narrowly
required state styles such as hidden controls or progress widths; it must not
introduce a second admin theme or attach inline CSS to a WordPress core style
handle.

DTB body classes exist only as stable behavioral/scoping hooks and do not confer
ownership of the surrounding admin shell. The source CSS files remain in the
deployment mirror only as dormant legacy assets while tool markup is migrated;
they are not part of the runtime style queue.

Validate this boundary before deployment:

```powershell
.\scripts\smoke-dtb-admin-theme-boundary.ps1
```

## 2. Module responsibilities

### `dtb-platform`

Security/origin/authentication, shared support primitives, cache/health/logging/metrics, account/history APIs, admin workbenches, Command Center, System Manager, and Store API mutation containment.

### `dtb-catalog-platform`

Catalog/product/variation/brand/taxonomy models and normalization, relationships, compatible/universal parts, inventory intelligence, validation, REST/CLI/admin tooling.

### `dtb-commerce`

- WooCommerce Store API cart extension data;
- toolset/order-line metadata;
- native Woo checkout runtime exception for the headless storefront;
- checkout field/domain policy;
- Payment Plugins for Stripe readiness/capability metadata;
- checkout runtime integrity/performance telemetry;
- checkout-order contract tagging and non-secret paid-reference mirroring;
- DTB shipping policy method;
- order-type/query support;
- deterministic WooCommerce classic HTML email template routing (`Email/TemplateOverride.php`),
  registered via an allowlisted `woocommerce_locate_template` filter rather
  than the retired output-buffer wrap — see
  `docs/operations/woocommerce-html-email-architecture.md`;
- commerce-facing REST/admin surfaces.

`dtb-commerce` does not own payment confirmation, provider webhooks, a parallel order route, or a second checkout presentation system.

Native checkout runtime adapter:

```text
dtb-commerce/Payment/WooNativeCheckoutRuntime.php
```

It prevents the headless theme from forcing checkout into the React SPA or stripping Woo/plugin assets. It delegates presentation to:

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php
```

It never creates Checkout Block state, Stripe fields, PaymentIntents, Stripe Checkout Sessions, or orders.

Payment-provider adapter:

```text
dtb-commerce/Payment/PaymentPluginsStripeNativeCheckout.php
```

It owns:

- runtime identity/version verification for `woo-stripe-payment`;
- read-safe checkout capability/readiness metadata;
- `stripe_upm`-only storefront gateway enforcement;
- checkout contract tagging;
- verified paid-lifecycle non-secret reference mirroring;
- operator notices for missing/outdated provider, competing gateways, disabled payment methods, HTTPS, and Checkout Block readiness.

It owns no payment iframe, secret, tokenization, confirmation, capture, refund, or webhook implementation.

The retired provider-specific files are intentionally absent:

```text
dtb-commerce/Payment/OfficialStripeNativeCheckout.php
dtb-commerce/Payment/ExpressCheckoutAddressIntegrity.php
dtb-commerce/Payment/ExpressCheckoutShippingReadiness.php
```

Do not restore them or guess replacement-provider browser headers/nonces. Payment Plugins for Stripe owns its wallet/address/shipping runtime.

Checkout field policy:

```text
dtb-commerce/Validation/CheckoutFieldPolicy.php
```

It owns Checkout Block contact registration, optional phone policy, and defensive synchronization into canonical Woo billing/shipping properties. It owns no presentation.

Theme-owned neutral checkout document:

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php
```

The active checkout shell intentionally enqueues no DTB stylesheet or presentation controller and contains no inline design rules. WooCommerce Checkout Block supplies the temporary visual baseline while a new design is developed from a single reviewed layer. Do not restore the deleted checkout cascade, mobile wizard, loader, header treatment, express-focus controller, provider-control overrides, proxy fields, duplicate payment state, a mobile payment sheet, or a second order submission action.

Checkout performance/stability diagnostics:

```text
dtb-commerce/Payment/CheckoutPerformance.php
dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
dtb-commerce/assets/woo-native-checkout-performance.js
```

They own scoped diagnostics, provider-surface timeout observation, CWV/third-party/root-replacement signals, nonce/origin/rate-limited telemetry, hosting optimizer exclusions, Stripe.js origin protection, and checkout cache exclusion. They never reconstruct form/payment/order state.

Diagnostics route:

```text
POST /wp-json/dtb/v1/checkout/runtime-telemetry
```

It requires a dedicated nonce, same-origin validation when Origin is present, rate limiting, event deduplication, allowlisted events, bounded/sanitized fields, and sensitive-value redaction. It never accepts authoritative cart/order/payment writes.

### `dtb-order-platform`

- order statuses/transitions and append-only event ledger;
- integration-state persistence;
- `dtb-orders` Action Scheduler queue/retry;
- order write boundary and duplicate containment;
- captured-payment lifecycle observation/reconciliation;
- refund lifecycle projection keyed by concrete Woo refund ID;
- customer/operator tracking projections and order REST/admin surfaces.

### Other modules

- `dtb-schematics` / `dtb-media`: schematic and media models/synchronization/validation/operator tooling.
- `dtb-marketing`: coming-soon/subscriber and SEO support.
- `dtb-repair-service`: repair intake/status/events/media/quotes/SLA/queues/notifications/workbenches.
- `dtb-integrations`: Woo adapters, Veeqo fulfillment, QuickBooks projection, notifications, marketplace infrastructure. Owns the Veeqo → native WooCommerce Fulfillment projector (`Veeqo/VeeqoFulfillmentProjector.php`) — shipment identity, fingerprinting, locking, and native-notification ownership for `customer_fulfillment_created`/`updated`, with legacy-notification fallback; see `docs/operations/woocommerce-html-email-architecture.md`.
- `dtb-support` / `dtb-returns`: independent support and return lifecycle domains.

## 3. Checkout/payment trust boundary

```text
React cart / product handoff
  -> WooCommerce Store API same-origin cookie session
  -> full-document /checkout/
  -> domain-root routing to WordPress
  -> DTB native checkout runtime
  -> active theme native-checkout.php
  -> assigned WooCommerce Checkout page via the_content()
  -> WooCommerce Checkout Block
  -> Payment Plugins for Stripe WooCommerce
  -> WooCommerce order/payment lifecycle
  -> DTB captured-payment verification
  -> dtb-orders queue
  -> Veeqo / QuickBooks / notifications / tracking
```

Authority rules:

- WooCommerce owns cart/session/customer/address/shipping/tax/totals/order/refund and authoritative status.
- `woo-stripe-payment` owns the single `stripe_upm` Payment Element, eligible card/wallet/BNPL/local-method rendering, provider selection, tokenization, 3DS/SCA, confirmation/capture, and Stripe webhook synchronization.
- A separately installed PayPal provider owns PayPal only. It must not create another card authority.
- React owns cart UX/handoff only and never renders payment fields/wallet iframes or creates payment/order objects.
- Theme owns checkout shell/layout/styling/presentation behavior only.
- MU plugins own backend runtime/security/domain policy/readiness/lifecycle observation/telemetry/integration boundaries.
- Desktop and mobile use one mounted Checkout Block and provider state.
- Mobile Contact/Shipping/Payment is presentation state only.
- Checkout telemetry never becomes a cart/order/payment write path.
- Veeqo owns fulfillment truth; QuickBooks owns accounting projection only.

The retired WooCommerce Stripe Gateway and WooPayments must not be active with `woo-stripe-payment` in production.

Same-origin React cart traffic uses WooCommerce cookie session plus Store API `Nonce`. Cart-Token is compatibility-only for genuinely cross-origin clients. DTB must not decode unsigned Cart-Token payloads or query `woocommerce_sessions` to recover arbitrary sessions.

Private checkout HTML must not be prefetched or cached as a generic public document.

## 4. Captured-payment contract

New provider-backed orders are eligible for paid downstream effects only when all are true:

```text
_dtb_checkout_gateway = woo_native_stripe
_dtb_checkout_contract_version = payment-plugins-stripe-v1
_dtb_payment_provider = payment_plugins_stripe
WooCommerce date_paid is present
non-secret transaction/payment reference is present
```

Historical pre-migration orders retain and may satisfy:

```text
_dtb_checkout_contract_version = woo-stripe-v1
_dtb_payment_provider = woocommerce_stripe
```

Historical evidence is not bulk rewritten. It remains valid for refunds, recovery, audit, tracking, and accounting.

Provider metadata is mirrored only after the selected gateway instance is verified as originating from `woo-stripe-payment`, WooCommerce reports a paid date, and a non-secret reference exists. Authorization-only/manual-capture state is not fulfillable unless explicitly approved and tested.

Initial downstream processing dispatch remains protected by an atomic per-order barrier.

## 5. Payment-provider migration boundary

- The repository does not bundle/fork/patch the regular plugin.
- Installation, activation/deactivation, Stripe connection, webhook creation, test/live mode, payment-method settings, wallet-domain verification, and provider-managed data migration are operator actions.
- Payment Plugins may recognize supported Stripe customer/payment/subscription identity from the previous plugin, but plugin settings are not migrated and must be recreated.
- Validate representative saved cards/customers/subscriptions before production cutover.
- PayPal is not supplied by the Stripe plugin. A real PayPal control requires a separate provider; never fabricate one.
- Complete procedure/checklist: `docs/checkout/payment-provider-migration.md`.

## 6. Checkout UI contract

- The current theme shell is intentionally neutral and loads no DTB checkout stylesheet, inline design rule, loader, branded header, mobile wizard, or presentation controller.
- WooCommerce Checkout Block supplies the temporary desktop/mobile visual baseline.
- A future redesign must add one authoritative presentation layer rather than restore the deleted cascade.
- Contact owns first name, last name, email, optional phone.
- Shipping owns address and shipping method.
- Payment owns provider selection and native Place Order.
- `stripe_upm` is the only storefront Payment Plugins gateway; standalone card, Apple Pay, Google Pay, Link, BNPL, and local-method gateways remain disabled.
- Stripe determines eligible cards, wallets, BNPL, and local methods inside the one UPM Payment Element.
- Provider/Woo native inputs remain focusable and state-authoritative.
- No proxy fields, fake wallet/PayPal/BNPL controls, iframe mutation, duplicate payment state, or duplicate order action.

## 7. Refund contract

WooCommerce owns refund creation. Every refund retains `order_id + refund_id` through queue arguments, events, idempotency, and QuickBooks projection. Multiple partial refunds are distinct events. Do not infer cancellation from parent order status and do not use cumulative lifetime refunded amount as each refund amount.

## 8. Request/security boundaries

Every REST route needs explicit permission behavior. Customer reads authenticate, derive validated identity, verify ownership, and do not trust caller-supplied customer IDs.

Server-only secrets include Woo credentials, JWT signing secrets, Stripe keys/webhook secrets/client secrets/wallet tokens, PayPal credentials, Veeqo/QuickBooks/marketplace credentials, and external-write secrets. Browser `REACT_APP_*` values are public.

Checkout capabilities expose only non-secret readiness. Telemetry never stores form values, names, addresses, emails, phones, order keys, bearer/JWT tokens, Stripe/PayPal keys, webhook secrets, client secrets, wallet payloads, or payment data.

## 9. Routing/cache contract

Root routing must send these to WordPress before SPA fallback:

```text
/checkout/
/checkout/order-pay/{id}
/checkout/order-received/{id}
/wp-json/*
?rest_route=...
?wc-api=...
```

Checkout, callbacks, session-owned pages, and payment endpoints are private/no-store. Host cache-bypass cookies must be added without replacing WordPress/WooCommerce `Set-Cookie` headers.

SiteGround/host optimization must not rehost Stripe.js or reorder WooCommerce/provider dependencies. `CheckoutRuntimeIntegrity.php` preserves the reviewed boundary.

## 10. Async/integration contract

Order-related external effects use `dtb_order_enqueue_job()` and Action Scheduler group `dtb-orders`. New work defines owner, hook/args, idempotency/deduplication, retries/terminal failure, observability, recovery, and compensation. Slow Veeqo/QuickBooks/notification calls must not occur during checkout or payment webhook acknowledgement.

## 11. Deployment contract

`drywalltoolbox/` is the tracked deployment mirror. Deploy exact reviewed source files; do not broad-copy runtime-owned WordPress state. Never overwrite WordPress core, `wp-config.php`, regular plugins, uploads, cache, logs, secrets, upgrade state, or uncontrolled dumps.

Regular-plugin installation/configuration is an operator action. GitHub does not contain plugin credentials or remote deployment tooling.

## 12. Validation

Frontend:

```powershell
cd frontend
npm ci --include=dev
npm run lint
npm run build
```

Checkout/provider:

```powershell
.\scripts\smoke-dtb-payment-provider-migration.ps1
.\scripts\smoke-dtb-checkout-ui.ps1
.\scripts\smoke-dtb-product-express-checkout.ps1
.\scripts\smoke-dtb-mu-modules.ps1
```

Targeted PHP syntax must cover every changed PHP file. Runtime validation must cover provider exclusivity, card/saved card, 3DS/SCA, Apple Pay, Google Pay, configured BNPL, optional PayPal, shipping/tax/totals, order/webhook/reference, captured-payment gate, refunds, event ledger, queues, Veeqo, QuickBooks, and return routing.

Do not claim smoke, syntax, build, browser, payment, webhook, integration, CI, deployment, or live-server checks passed unless they actually ran and produced evidence.
