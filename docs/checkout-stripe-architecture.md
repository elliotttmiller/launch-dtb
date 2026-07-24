# Checkout and Official WooCommerce Stripe Gateway Architecture

Last verified against source: 2026-07-24.

## Production authority

Drywall Toolbox uses one storefront checkout/payment authority chain:

```text
React Store API cart
  -> full-document navigation to /checkout/
  -> WordPress native checkout runtime exception
  -> active theme checkout document
  -> assigned WooCommerce Checkout Block
  -> official WooCommerce Stripe Payment Gateway
  -> WooCommerce order/payment lifecycle
  -> DTB captured-payment observation
  -> dtb-orders Action Scheduler queue
  -> Veeqo / QuickBooks / notifications / tracking
```

WooCommerce owns cart/session state, customer/address validation, shipping, tax, totals, Checkout Block state, order creation, and authoritative order/payment status.

The official WooCommerce Stripe Payment Gateway owns embedded payment fields, supported Stripe payment methods, Link, eligible Apple Pay/Google Pay/other express methods, tokenization, 3DS/SCA, Stripe-side payment execution, and webhook-backed reconciliation into WooCommerce.

DTB does not create Stripe PaymentIntents, Stripe Checkout Sessions, wallet tokens, payment-method payloads, or storefront orders.

## Presentation ownership

Checkout presentation is owned by the active theme:

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php

drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.css
  -> base checkout visual system

drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-refinements.css
  -> same-origin Woo wrapper normalization and contact-field presentation

drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-flow.css
  -> responsive Contact -> Shipping -> Payment presentation

drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-boot.js
  -> mechanical checkout reveal only

drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-ui.js
  -> presentation-only responsive controller and canonical field mirroring

drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-profile.css

drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-profile.js
  -> signed-in profile presentation refinements
```

The theme may style same-origin WooCommerce wrappers, layout, typography, spacing, order summary, shipping selectors, progress navigation, and non-submit Continue controls.

The theme must not create or replace payment controls, initialize Stripe, create payment intents, clone/reparent provider controls, intercept authoritative Woo submission, or style descendants inside provider iframes.

## Headless-theme checkout exception

`dtb-commerce/Payment/WooNativeCheckoutRuntime.php` is the backend runtime boundary.

It:

- removes the normal React SPA enqueue/asset-stripper/template override on native checkout;
- resolves `templates/checkout/native-checkout.php` from the active theme;
- fails open to Woo/WordPress's resolved template if the expected theme checkout template is unavailable;
- sends private/no-store checkout headers;
- persists DTB Store API checkout metadata at the late checkout lifecycle boundary.

It does not own checkout CSS/JS or render payment methods.

## Backend checkout responsibilities

`dtb-commerce/Payment/OfficialStripeNativeCheckout.php` owns:

- official Stripe extension/gateway identity verification;
- non-secret checkout readiness diagnostics;
- supported `wc_stripe_upe_params` / `blocksAppearance` configuration for Stripe-owned surfaces;
- checkout contract metadata tagging;
- verified paid-lifecycle payment reference mirroring;
- competing-gateway/HTTPS/readiness admin notices.

It owns no checkout presentation assets.

`dtb-commerce/Validation/CheckoutFieldPolicy.php` owns:

- additional Checkout Block contact-field registration;
- optional phone policy;
- defensive server-side copying of supported contact values into canonical Woo billing/shipping properties.

It owns no presentation CSS/JS.

`dtb-commerce/Payment/CheckoutRuntimeIntegrity.php` protects the WordPress/Woo/Stripe runtime graph from SiteGround combine/minify/async transforms and recognizes only the active theme presentation handles plus the DTB telemetry script.

`dtb-commerce/Payment/CheckoutPerformance.php` and `dtb-commerce/assets/woo-native-checkout-performance.js` remain diagnostics-only.

## Retired competing presentation implementations

The following presentation paths are retired and intentionally absent:

```text
dtb-commerce/assets/woo-native-checkout.css
dtb-commerce/assets/woo-native-checkout-refinements.css
dtb-commerce/assets/woo-native-checkout-ui.js
dtb-commerce/assets/woo-native-checkout-steps.js
dtb-commerce/Templates/WooNativeCheckoutPage.php

themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.js
themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.css
```

Do not restore a second MU-plugin checkout presentation layer or a mobile payment sheet.

## Responsive presentation policy

There is exactly one mounted WooCommerce Checkout Block and one official Stripe payment surface across all viewports.

### Desktop

Desktop remains a continuous checkout using the existing DTB visual design:

```text
Left content rail
  -> Express Checkout
  -> Contact
  -> Shipping address
  -> Delivery methods
  -> Payment
  -> native Woo Place Order

Right summary rail
  -> canonical Woo Order Summary
```

### Mobile

Below the mobile breakpoint, the theme presents the same mounted Checkout Block as:

```text
1 Contact
  -> eligible official Express Checkout
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

There is no mobile payment modal, sheet, duplicate Payment Element, or alternate submission control.

Provider-owned Payment and Express surfaces remain mounted in the Woo React tree. When visually inactive on mobile, provider-sensitive surfaces are kept measurable offscreen rather than cloned or remounted.

## Contact-field contract

DTB registers First name, Last name, and Phone in the Checkout Block contact location.

The theme controller mirrors those values into WooCommerce's native canonical billing/shipping inputs so Woo validation, shipping, tax, fraud checks, orders, customers, and integrations continue to consume standard Woo fields.

The native duplicates remain mounted and synchronized but are hidden from duplicate shopper presentation only after classification.

The server-side `CheckoutFieldPolicy` copy is a defensive idempotent persistence boundary.

## Express Checkout and payment styling

Same-origin Woo wrappers may be flattened so provider buttons/fields are the meaningful visual surfaces.

Stripe-owned payment internals are styled only through the official gateway's supported Appearance API configuration in `OfficialStripeNativeCheckout.php`.

Never:

- CSS into provider iframe descendants;
- fabricate Apple Pay/Google Pay/Link controls;
- create another Stripe Elements instance;
- reparent a provider element out of Woo's React tree;
- use browser DOM state as authoritative payment/order state.

## Cart/session continuity

Production and staging are same-origin with WordPress/WooCommerce. React uses WooCommerce's cookie-backed Store API session as primary cart authority and the Store API `Nonce` for mutations.

`Cart-Token` is compatibility-only for genuinely cross-origin clients. Same-origin React must not maintain a second persisted cart authority.

## Checkout contract metadata

Woo-created checkout orders are tagged with:

```text
_dtb_checkout_gateway = woo_native_stripe
_dtb_checkout_contract_version = woo-stripe-v1
_dtb_checkout_source = woocommerce_checkout | woocommerce_store_api_checkout
_dtb_order_type = product
```

After Woo reaches a paid lifecycle hook and DTB verifies the official Stripe gateway with a non-secret transaction/payment reference, DTB mirrors:

```text
_dtb_payment_provider = woocommerce_stripe
_dtb_payment_ref = verified Woo/Stripe payment reference
_dtb_payment_captured = 1 when WooCommerce date_paid is present
_dtb_payment_lifecycle_source = woocommerce_stripe_lifecycle
```

Fulfillment/accounting eligibility still requires the existing captured-payment gate before `dtb-orders` side effects are enqueued.

## Shipping and totals

Checkout shipping remains WooCommerce/DTB policy rating, not live Veeqo carrier rating.

Woo Checkout Block owns displayed shipping rates, selected rate, tax, discounts, and final payable total. The official Stripe gateway processes the WooCommerce total.

Veeqo becomes authoritative downstream for inventory allocation, fulfillment, labels, shipment execution/status, carrier, and tracking.

## Runtime integrity and caching

Native checkout must remain private/no-store and excluded from public page cache.

SiteGround checkout exclusions must preserve WordPress dependency ordering and keep Stripe.js executing directly from `js.stripe.com`.

Do not weaken this boundary for performance scores.

## Verification matrix

Before live payment acceptance verify at minimum:

- guest and authenticated checkout;
- existing desktop continuous checkout UI;
- mobile Contact -> Shipping -> Payment with inline payment, no payment sheet;
- eligible Express Checkout on supported devices;
- breakpoint mobile -> desktop -> mobile without duplicated controls or lost state;
- exactly one Stripe runtime and payment surface;
- contact identity values mirror correctly into canonical Woo order/address properties;
- shipping destination/rate recalculation and total parity;
- card success/decline and 3DS/SCA success/cancel/retry;
- Apple Pay/Google Pay/Link eligible/ineligible cases;
- duplicate submit/reload/webhook replay does not duplicate orders/jobs;
- order-pay and order-received behavior;
- Veeqo/QuickBooks exactly-once downstream behavior;
- zero duplicate Stripe.js/origin errors and zero fatal Woo package errors.

## Validation commands

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

Do not claim browser checkout, payment, CI, deployment, webhooks, or external integrations passed unless they actually ran and produced usable evidence.
