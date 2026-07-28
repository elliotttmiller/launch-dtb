# Product Express Checkout

Last verified against active source: 2026-07-28.

## Authority and scope

Drywall Toolbox product pages and quick-view modals are React surfaces. They are not native WordPress product queries, so WordPress conditional tags such as `is_product()`, `is_shop()`, and `has_term()` are not authoritative for rendering controls inside those React views.

The official WooCommerce Stripe Payment Gateway remains the only payment and wallet authority. React must not create a Stripe `ExpressCheckoutElement`, PaymentIntent, Checkout Session, confirmation token, wallet button, or provider iframe. The official extension owns:

- Apple Pay, Google Pay, Link, and other eligible express methods;
- `shippingAddressRequired`, phone/email collection, allowed-country policy, and initial shipping-rate options;
- shipping-address and shipping-rate change callbacks;
- authoritative amount and line-item updates;
- confirmation, cancellation, tokenization, authentication, and payment execution.

The wallet labels rendered on React product surfaces are informational availability indicators. They are not provider buttons and do not claim that a particular wallet is available on the shopper's current browser or device. Stripe performs the final eligibility check and renders only eligible methods inside native WooCommerce checkout.

## Product-page flow

Both the full product page and product modal render `ProductDetail`, which owns one shared `ProductPurchasePanel`.

```text
Selected product / variation / quantity
  -> ProductPurchasePanel
  -> ProductExpressCheckout
  -> serialized WooCommerce Store API add-to-cart mutation
  -> authoritative cart/session response
  -> full-document navigation to /checkout/?dtb_express=1
  -> native WooCommerce Checkout Block
  -> official WooCommerce Stripe Express Checkout surface
  -> WooCommerce shipping, tax, order, and payment lifecycle
  -> DTB captured-payment event ledger and queues
```

The product express action is single-flight. It is disabled while any cart mutation or express handoff is active, preventing duplicate add-to-cart and navigation attempts.

The `dtb_express` value is short-lived presentation metadata only. The native checkout script uses it to wait for the provider-owned express surface, bring that surface into view, and then remove the marker from the URL. It never changes totals, shipping, payment state, or submission behavior. If the provider surface does not become ready within the bounded timeout, the handoff fails open to ordinary native checkout.

## Apple Pay and wallet shipping hardening

The official Stripe extension resolves wallet shipping events through WooCommerce Store API cart mutations. DTB adds compatibility, integrity, and observability guards around that owned flow:

1. `DTB_ExpressCheckoutAddressIntegrity` canonicalizes equivalent wallet address field names after validating the official Stripe express header and nonce.
2. `DTB_ExpressCheckoutShippingReadiness` clears WooCommerce's package-rate cache before a verified wallet address update, preventing a previous destination's rates from being reused.
3. `DTB_Shipping_Method` remains the authoritative shipping-policy method and emits deterministic rates from the WooCommerce cart package.
4. The Store API mutation limiter exempts only official express requests with the valid Stripe express nonce so rapid wallet callbacks cannot be converted into false 429/no-rate failures.
5. Successful wallet responses are checked for shipping-rate presence, selected-rate state, and a valid authoritative total.
6. Failures emit bounded, redacted diagnostics. No address, name, email, phone, wallet payload, or payment data is logged.

Current diagnostic events are:

- `stripe_express_checkout_shipping_rates_missing`
- `stripe_express_checkout_shipping_rate_unselected`
- `stripe_express_checkout_total_invalid`
- `stripe_express_checkout_store_api_failed`
- `stripe_express_checkout_validation_failed`

DTB does not invent an address, hardcode a client-side shipping amount, bypass WooCommerce validation, auto-select a customer shipping method outside WooCommerce, or resolve Stripe wallet events itself.

## Readiness contract

`GET /wp-json/dtb/v1/checkout/capabilities` exposes non-secret readiness only. The React product UI evaluates:

- native WooCommerce Checkout Block ownership;
- official WooCommerce Stripe extension and gateway state;
- Express Checkout enablement at the checkout location;
- HTTPS;
- absence of a competing WooPayments checkout authority;
- WooCommerce shipping-method and allowed-country readiness.

An explicit failed check changes the product control to a standard secure Buy Now fallback. Missing or temporarily unavailable capability data fails open: checkout remains available, while Stripe determines provider eligibility at native checkout.

## Checkout presentation

The native checkout presentation now:

- loads one authoritative `checkout.css` stylesheet instead of a multi-layer override cascade;
- removes the purchase confidence panel completely;
- keeps only native WooCommerce contact, billing, and shipping controls;
- removes mobile proxy fields, hidden custom checkout steps, and fixed DTB navigation overlays;
- preserves every WooCommerce and Stripe surface in one continuous mobile flow;
- preserves provider-owned payment controls and styles only same-origin wrapper elements;
- presents the payment-method area as a cohesive modern card;
- applies compact, deterministic spacing to product rows and total rows;
- removes artificial sidebar and summary minimum heights;
- strengthens total hierarchy without duplicating totals or order state;
- focuses newly rendered native errors without replacing their content;
- includes responsive focus, overflow, reduced-motion, forced-colors, and safe-area behavior.

The complete presentation and operating contract is documented in `docs/checkout-ui-architecture.md`.

## Required operator configuration

Before production validation, confirm in WooCommerce Stripe settings that:

- the official Stripe extension is connected and enabled;
- Apple Pay and Google Pay Express Checkout are enabled;
- the checkout location is enabled for Express Checkout buttons;
- the production domain is registered as a Stripe payment-method domain;
- the entire storefront and checkout are served over HTTPS;
- WooCommerce shipping countries and the DTB shipping-zone policy match the intended market;
- at least one enabled shipping method exists for every supported destination;
- guest/account settings are compatible with Express Checkout;
- test mode is disabled before launch.

Native WooCommerce product-page button locations may also be enabled in the Stripe extension, but those settings do not mount buttons inside the React SPA. The React storefront intentionally uses the canonical checkout handoff instead of copying or invoking private gateway internals.

## Validation matrix

Validate with real supported devices and saved wallet addresses:

- Safari on iPhone with Apple Pay;
- Safari on macOS with Apple Pay;
- Chrome on Android and desktop with Google Pay;
- Link on an eligible account/browser;
- simple products;
- every supported variable-product selection;
- quantity changes;
- guest and authenticated carts;
- domestic addresses covering at least two states and postcodes;
- standard, express, and overnight rate selection;
- wallet address change after the sheet opens;
- wallet shipping-rate change after the sheet opens;
- wallet cancel and retry;
- cart mutation failure and navigation retry;
- duplicate taps and slow networks;
- unavailable Express Checkout configuration and standard Buy Now fallback.

For every successful test, verify the cart total, shipping method, tax, WooCommerce order, official Stripe transaction reference, captured-payment gate, DTB event ledger, and downstream queue eligibility remain consistent.

A code review cannot prove live Apple Pay acceptance. Production completion requires supported-device testing against the connected Stripe account and production-equivalent WooCommerce shipping configuration.

## Rollback

Rollback is file-based. Restore the previous frontend bundle, checkout theme assets/template, and DTB commerce MU-plugin files as one dependency-consistent set. No database migration is introduced by this feature.
