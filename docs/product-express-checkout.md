# Product Secure Checkout Handoff

Last verified against active source: 2026-07-28.

## Authority and scope

Drywall Toolbox product pages and quick-view modals are React surfaces. They are not native WordPress product queries, so WordPress conditional tags such as `is_product()`, `is_shop()`, and `has_term()` are not authoritative for controls rendered inside those React views.

Payment Plugins for Stripe WooCommerce (`woo-stripe-payment`) is the sole Stripe payment authority through its `stripe_upm` gateway. React must not create a Stripe Express Checkout Element, PaymentIntent, Checkout Session, confirmation token, wallet button, card field, or provider iframe. The replacement plugin owns:

- Apple Pay and Google Pay eligibility and rendering;
- Stripe-supported Link and BNPL methods when enabled in approved provider locations;
- provider-owned address, shipping, amount, and line-item synchronization;
- tokenization, confirmation, cancellation, authentication, capture, and webhook synchronization.

React product surfaces advertise only secure checkout, not individual wallets. Stripe performs final payment-method eligibility inside UPM at native checkout.

PayPal is not supplied by `woo-stripe-payment`. A real PayPal control requires a separately installed and reviewed PayPal plugin. DTB must never render a synthetic PayPal button or route PayPal through Stripe.

## Product-page flow

Both the full product page and product modal render the shared purchase panel and secure checkout handoff.

```text
Selected product / variation / quantity
  -> ProductPurchasePanel
  -> ProductExpressCheckout
  -> serialized WooCommerce Store API add-to-cart mutation
  -> authoritative cart/session response
  -> full-document navigation to /checkout/
  -> native WooCommerce Checkout Block
  -> one Payment Plugins `stripe_upm` Payment Element
  -> WooCommerce shipping, tax, order, and payment lifecycle
  -> DTB verified captured-payment gate, event ledger, and queues
```

The action is single-flight and disabled while cart mutation or checkout handoff is active, preventing duplicate add-to-cart and navigation attempts.

The handoff contains no payment-method preference. UPM and Stripe determine eligible cards, wallets, BNPL, and local methods only after native checkout loads.

## Provider migration boundary

The previous official WooCommerce Stripe adapter and its provider-specific Express Checkout Store API header/nonce shims are retired. Payment Plugins for Stripe owns its wallet/address/shipping requests. DTB does not guess undocumented request headers, copy plugin internals, mutate provider payloads, or bypass the Store API mutation limiter based on browser-supplied Stripe headers.

WooCommerce and `DTB_Shipping_Method` remain authoritative for shipping packages/rates, selected methods, tax, and totals. Provider wallet flows must consume those authoritative values through the replacement plugin's supported runtime.

## Readiness contract

`GET /wp-json/dtb/v1/checkout/capabilities` exposes non-secret local readiness only. The React product UI evaluates:

- native WooCommerce Checkout Block ownership;
- Payment Plugins for Stripe runtime and minimum version;
- enabled `stripe_upm` gateway;
- a selected dedicated Stripe Payment Method Configuration;
- HTTPS;
- absence of the retired WooCommerce Stripe Gateway and WooPayments as competing card/wallet authorities;
- WooCommerce shipping-method and allowed-country readiness;
- configured Stripe BNPL count as informational metadata.

An explicit failed check changes the product control to a standard secure Buy Now fallback. Missing or temporarily unavailable capability data fails open: checkout remains available while the provider determines final payment-method eligibility.

## Checkout presentation

The native checkout currently uses the unmodified WooCommerce Checkout Block visual baseline. The prior DTB checkout stylesheet, mobile wizard, loader, header treatment, and express-focus controller are removed pending a clean redesign.

The product checkout handoff:

- exposes no standalone payment or wallet controls;
- allows only the provider-owned UPM Payment Element at checkout;
- allows an independently installed PayPal provider only after a separate architecture decision, but never creates a synthetic control;
- preserves native WooCommerce contact/address/shipping/payment controls;
- removes duplicate wallet/payment rows by disabling all standalone Payment Plugins gateways;
- never reads or modifies cross-origin provider iframe contents.

The complete presentation contract is in `docs/checkout-ui-architecture.md`. The provider cutover and operator checklist are in `docs/payment-provider-migration.md`.

## Required operator configuration

Before production acceptance:

- install and activate a reviewed `woo-stripe-payment` release at or above the repository minimum;
- deactivate the prior WooCommerce Stripe Gateway and WooPayments;
- connect the correct test/live Stripe account through the provider's supported flow;
- configure and verify the provider webhook endpoint;
- enable `stripe_upm` with automatic capture unless a separate capture workflow is approved;
- create and select dedicated test and live Payment Method Configurations;
- enable approved cards, Apple Pay, Google Pay, Link, BNPL, and local methods inside UPM only;
- disable every standalone Payment Plugins payment gateway;
- configure only approved Stripe BNPL methods and test eligibility/redirect/refund behavior;
- verify production payment-method domain registration and HTTPS;
- confirm every supported shipping destination has an enabled WooCommerce/DTB rate;
- install/configure a separate PayPal plugin only if PayPal is required.

The React storefront intentionally uses the canonical checkout handoff instead of copying private provider internals or mounting native product-page wallet components inside the SPA.

## Validation matrix

Validate on production-equivalent staging with real supported devices/browsers:

- simple and variable products, all supported selections, and quantities greater than one;
- guest and authenticated carts;
- duplicate taps, slow networks, cart mutation failure, and navigation retry;
- Apple Pay on supported iPhone/macOS Safari;
- Google Pay on supported Android/desktop Chrome;
- wallet cancellation, address changes, shipping-rate changes, and retry;
- card, saved card, 3DS/SCA, redirect, decline, cancellation, and retry;
- each enabled Stripe BNPL method;
- optional PayPal only through the separately configured provider;
- multiple states/postcodes, free/paid/no-rate shipping, coupons, and tax recalculation;
- WooCommerce order, transaction reference, new DTB payment contract/provider metadata, captured-payment gate, event ledger, Action Scheduler jobs, Veeqo, QuickBooks, notifications, and return routing;
- historical pre-migration order/refund visibility;
- no duplicate fields, payment surfaces, wallet rows, payment attempts, orders, notices, or downstream effects.

A source review cannot prove account connection, webhook delivery, wallet eligibility, saved-token migration, 3DS, BNPL, subscription renewal, PayPal, or live payment acceptance. Those are mandatory operator tests.

## Database impact and rollback

No DTB schema/data migration is introduced. Historical payment evidence remains readable and is not bulk rewritten. Provider-managed saved-payment/customer/subscription compatibility must be tested before cutover.

Rollback is dependency-consistent and operator-controlled: deactivate the replacement provider, restore the prior plugin/configuration and the prior DTB/theme files, clear caches, and repeat checkout/payment/webhook/downstream acceptance. Do not delete or rewrite orders created during a failed cutover; reconcile them explicitly.
