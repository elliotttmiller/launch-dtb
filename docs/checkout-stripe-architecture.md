# Checkout and Official WooCommerce Stripe Gateway Architecture

Last verified against source: 2026-07-23.

## Production authority

Drywall Toolbox uses one storefront checkout/payment authority chain:

```text
React Store API cart
  -> full-document navigation to /checkout/
  -> WordPress serves the assigned WooCommerce Checkout page
  -> WooCommerce Checkout Block
  -> official WooCommerce Stripe Payment Gateway
  -> WooCommerce order/payment lifecycle
  -> DTB captured-payment observation
  -> dtb-orders Action Scheduler queue
  -> Veeqo / QuickBooks / notifications / tracking
```

WooCommerce owns cart/session state, customer/address validation, shipping, tax, totals, Checkout Block, order creation, and authoritative order/payment status.

The official WooCommerce Stripe Payment Gateway owns embedded payment fields, supported Stripe payment methods, Link, eligible Apple Pay/Google Pay/other express methods, tokenization, 3DS/SCA, Stripe-side payment execution, and webhook-backed reconciliation into WooCommerce.

DTB does not create Stripe PaymentIntents, Stripe Checkout Sessions, wallet tokens, payment-method payloads, or storefront orders. DTB owns routing integration, the native checkout document adapter, responsive presentation, readiness/telemetry, order metadata, captured-payment observation, eventing, queues, and downstream projections.

## Headless-theme checkout exception

`dtb-commerce/Payment/WooNativeCheckoutRuntime.php` is the explicit native-checkout exception boundary. It disables the React SPA enqueue/asset stripping/template override for native checkout and serves `Templates/WooNativeCheckoutPage.php`, which executes the assigned Woo Checkout page through `the_content()`.

The adapter must never manually instantiate payment fields, create an order, or duplicate Checkout Block state.

## Cart/session continuity

Production and staging are same-origin with WordPress/WooCommerce. React therefore uses WooCommerce's cookie-backed Store API session as the primary cart authority and the Store API `Nonce` for mutations.

`Cart-Token` is compatibility-only for genuinely cross-origin clients. Same-origin React must not maintain a second persisted Cart-Token cart because full-document `/checkout/` uses the browser WooCommerce session cookie.

Server-side DTB code must never decode an unsigned Cart-Token payload, derive a session ID from it, query arbitrary `woocommerce_sessions`, or inject another session into WooCommerce.

## Frontend checkout handoff

React owns cart interaction and checkout handoff only.

- Full cart and drawer use Woo Store API state.
- React does not render payment fields, wallet iframes, or authoritative checkout totals.
- Checkout uses full-document navigation to canonical Woo checkout.
- Pending/debounced Store API mutations must settle before navigation.
- The React `/checkout` route is compatibility-only and guards against routing loops.
- Eligible Apple Pay, Google Pay, Link, and other provider controls render only inside the official Woo checkout runtime.

## Official Stripe gateway identity

DTB does not trust a gateway merely because its ID starts with `stripe`.

`DTB_OfficialStripeNativeCheckout` verifies that the selected gateway instance originates from the official `woocommerce-gateway-stripe` extension using active extension path/class source evidence.

Production must have one storefront card/wallet authority. WooPayments, Payment Plugins for Stripe, custom Stripe integrations, and other competing card/wallet providers remain disabled unless a future architecture explicitly authorizes them.

## Checkout contract metadata

Woo-created checkout orders are tagged with:

```text
_dtb_checkout_gateway = woo_native_stripe
_dtb_checkout_contract_version = woo-stripe-v1
_dtb_checkout_source = woocommerce_checkout | woocommerce_store_api_checkout
_dtb_order_type = product
```

After Woo reaches a paid lifecycle hook and DTB verifies the selected gateway is official Stripe with a non-secret transaction/payment reference, DTB mirrors:

```text
_dtb_payment_provider = woocommerce_stripe
_dtb_payment_ref = Woo transaction ID / official Stripe payment reference
_dtb_payment_captured = 1 when WooCommerce date_paid is present
_dtb_payment_lifecycle_source = woocommerce_stripe_lifecycle
```

DTB does not treat source IDs, SetupIntent IDs, arbitrary `stripe_*` names, browser redirects, or unverified metadata as captured-payment proof.

## Captured-payment gate

Fulfillment/accounting eligibility requires:

1. exact DTB checkout contract `woo_native_stripe` + `woo-stripe-v1`;
2. `_dtb_payment_provider=woocommerce_stripe` from verified official gateway lifecycle;
3. WooCommerce `date_paid` present;
4. a non-secret transaction/payment reference.

Authorization-only state is not fulfillable. Automatic capture remains the launch baseline unless a reviewed manual-capture workflow is implemented and tested.

## Order lifecycle and idempotency

`dtb-order-platform/Payment/CheckoutPaymentLifecycle.php` observes Woo paid/failed/cancelled/refunded lifecycle hooks after the official Stripe mirror.

Initial downstream dispatch uses an atomic per-order barrier. Veeqo, QuickBooks create, tracking, and related projections use `dtb_order_enqueue_job()` in Action Scheduler group `dtb-orders` only after the paid gate passes or for an explicitly allowed non-payment/free order path.

Raw browser/external Woo order creation remains blocked by the order write boundary.

## Refund contract

WooCommerce owns refund creation. Each `woocommerce_order_refunded` event is keyed by:

```text
order_id + refund_id
```

QuickBooks refund projection verifies the concrete `WC_Order_Refund`, uses the exact refund amount, uses deterministic identity `DTB-R-{order_id}-{refund_id}`, stores per-refund integration identity, and prevents one refund from suppressing another.

## Shipping and totals

Current checkout shipping is WooCommerce/DTB policy rating, not live Veeqo carrier rating.

Woo Checkout Block owns displayed shipping rates, selected rate, tax, discounts, and final payable total. The official Stripe gateway processes the WooCommerce total.

Veeqo becomes authoritative downstream for inventory allocation, fulfillment, labels, shipment execution/status, carrier, and tracking.

## Responsive presentation policy

There is exactly one mounted WooCommerce Checkout Block and one official Stripe payment surface across all viewports.

### Desktop

Desktop uses a continuous Stripe-inspired two-column presentation:

```text
Left content rail
  -> Express Checkout
  -> Contact
  -> Shipping address
  -> Delivery methods
  -> Payment
  -> native Woo Place Order

Right summary rail
  -> canonical sticky Woo Order Summary
```

### Mobile

Below the mobile breakpoint, DTB applies a presentation-only three-step experience over the same mounted Checkout Block:

```text
1 Contact
  -> eligible official Express Checkout first
  -> Woo contact/account controls
  -> Continue to shipping

2 Shipping
  -> Woo shipping/billing address controls
  -> Woo delivery methods
  -> Continue to payment

3 Payment
  -> inline official Woo/Stripe payment surface
  -> Woo terms/order notes/actions
  -> native Woo Place Order
```

`woo-native-checkout-ui.js` may hide/reveal existing top-level Woo sections for presentation, maintain visited-step navigation, and expose non-submit Continue actions. It does not create a second form state machine or perform authoritative validation.

The retired DTB mobile payment bottom sheet is no longer part of the architecture.

Provider-owned payment and Express surfaces remain in the Woo React tree. When visually inactive on mobile they remain mounted/measurable through the checkout document's provider-mount safety rule; DTB does not clone, reparent, or remount them.

On breakpoint changes, progressive state is removed and desktop returns to the full continuous Woo checkout without duplicated controls.

## Visual ownership

Canonical presentation sources:

```text
dtb-commerce/assets/woo-native-checkout.css
dtb-commerce/assets/woo-native-checkout-steps.js
dtb-commerce/assets/woo-native-checkout-ui.js
```

`woo-native-checkout.css` owns the DTB design tokens, shell, desktop layout, cards, fields, Express framing, shipping-rate cards, payment framing, summary, mobile progress UI, and mobile Continue bar.

Stripe-owned payment internals are styled only through the official gateway's `wc_stripe_upe_params` / `blocksAppearance` Appearance API integration in `OfficialStripeNativeCheckout.php`. DTB must not CSS into provider iframes or fabricate payment controls.

## Runtime integrity and hosting optimization

`CheckoutRuntimeIntegrity.php` preserves the WordPress/Woo/Stripe dependency graph on checkout and protects it from SiteGround JavaScript combine/minify/async transformations. It also keeps Stripe.js executing from `js.stripe.com` and excludes `/checkout/*` from page caching.

Do not weaken or remove this boundary for performance scores.

## Checkout telemetry and recovery

`CheckoutPerformance.php` and `woo-native-checkout-performance.js` provide bounded diagnostics and provider-safe recovery presentation only.

On desktop, provider readiness monitoring is active for the continuous payment surface. On enhanced mobile it begins when the Payment step is active.

The telemetry route is:

```text
POST /wp-json/dtb/v1/checkout/runtime-telemetry
```

It is nonce/origin/rate/dedupe/redaction protected and never mutates cart/order/payment state.

## Routing and caching

The domain-root `.htaccess` must route these to WordPress before SPA fallback:

```text
/checkout/
/staging/{id}/checkout/
/checkout/order-pay/{order_id}
/checkout/order-received/{order_id}
?wc-api=wc_stripe
/wp-json/*
?rest_route=...
```

Checkout, callbacks, Woo session-owned requests, and payment endpoints must bypass public page cache. Cache behavior must never replace/corrupt WordPress/Woo `Set-Cookie` headers.

The Apple Pay domain-association file must remain reachable at the public root when Apple Pay is enabled.

## Official Stripe operational requirements

Before live acceptance:

1. official WooCommerce Stripe Payment Gateway installed/active;
2. intended Stripe account connected;
3. test/live mode explicitly verified;
4. only intended payment methods enabled;
5. webhook health verified for active modes;
6. HTTPS verified;
7. payment-method domain registration/Apple Pay association verified when wallets enabled;
8. competing storefront card/wallet authorities disabled;
9. assigned Checkout page contains Woo Checkout Block;
10. real Woo SKU/variation carts tested in staging/test mode.

`GET /wp-json/dtb/v1/checkout/capabilities` exposes non-secret local contract/readiness metadata only.

Adaptive Pricing remains guarded by `DTB_ENABLE_STRIPE_ADAPTIVE_PRICING` unless the live Checkout Sessions bootstrap has passed end-to-end validation. This does not disable Optimized Checkout or Express Checkout.

## Required verification matrix

Before live payment acceptance verify at minimum:

- guest and authenticated checkout;
- desktop continuous checkout and sticky summary;
- mobile Contact -> Shipping -> Payment with Express first on Contact;
- breakpoint mobile -> desktop -> mobile without stale hidden sections/duplicates;
- exactly one Stripe runtime and payment surface;
- React quantity change immediately followed by checkout handoff;
- cart/session continuity after reload/back/forward;
- simple and variable products with correct SKU/variation/quantity;
- shipping destination/rate recalculation;
- coupons/tax/final total parity between Woo and Stripe;
- card success/decline;
- 3DS/SCA success/cancellation/retry;
- Apple Pay/Google Pay/Link eligible/ineligible cases;
- duplicate submit/reload/webhook replay does not duplicate orders/jobs;
- order-pay retry and order-received flows;
- partial/second partial/full refunds;
- Veeqo/QuickBooks exactly-once behavior;
- `/checkout/` and Stripe callback endpoints never served by React SPA/public cache;
- zero Stripe.js duplicate/origin errors and zero fatal Woo/WordPress package console errors.

## Validation commands

```powershell
cd frontend
npm ci --include=dev
npm run lint
npm run build
```

Targeted PHP syntax:

```powershell
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/WooNativeCheckoutRuntime.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/OfficialStripeNativeCheckout.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/CheckoutPerformance.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Templates/WooNativeCheckoutPage.php
```

Do not claim missing smoke scripts, CI, runtime payments, webhooks, integrations, or deployment passed unless they actually ran and produced usable evidence.
