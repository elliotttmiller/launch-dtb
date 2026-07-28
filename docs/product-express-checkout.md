# Product Express Checkout

Last verified against active source: 2026-07-28.

## Authority and scope

Drywall Toolbox product pages and quick-view modals are React surfaces. They are not native WordPress product queries, so WordPress conditional tags such as `is_product()`, `is_shop()`, and `has_term()` are not authoritative for rendering controls inside those React views.

The official WooCommerce Stripe Payment Gateway remains the only payment and wallet authority. React must not create a Stripe `ExpressCheckoutElement`, PaymentIntent, Checkout Session, confirmation token, wallet button, or provider iframe. The official extension already owns:

- Apple Pay, Google Pay, Link, and other eligible express methods;
- `shippingAddressRequired`, phone/email collection, allowed-country policy, and initial shipping-rate options;
- shipping-address and shipping-rate change callbacks;
- authoritative amount and line-item updates;
- confirmation, cancellation, tokenization, authentication, and payment execution.

## Product-page flow

Both the full product page and product modal render `ProductDetail`, which owns one shared `ProductPurchasePanel`.

```text
Selected product / variation / quantity
  -> ProductPurchasePanel
  -> ProductExpressCheckout
  -> serialized WooCommerce Store API add-to-cart mutation
  -> authoritative cart response
  -> full-document navigation to /checkout/?dtb_express=1
  -> native WooCommerce Checkout Block
  -> official WooCommerce Stripe Express Checkout surface
  -> WooCommerce shipping, tax, order, and payment lifecycle
  -> DTB captured-payment event ledger and queues
```

The `dtb_express` value is short-lived presentation metadata only. The native checkout script uses it to bring the provider-owned express surface into view and then removes it from the URL. It never changes totals, shipping, payment state, or submission behavior.

## Apple Pay shipping-address hardening

The official Stripe extension resolves wallet shipping events through WooCommerce Store API cart mutations. DTB adds only compatibility and reliability guards around that owned flow:

1. `DTB_ExpressCheckoutAddressIntegrity` canonicalizes equivalent wallet address field names after validating the official Stripe express header and nonce.
2. `DTB_ExpressCheckoutShippingReadiness` clears WooCommerce's package-rate cache before a verified wallet address update, preventing a previous destination's rates from being reused.
3. `DTB_Shipping_Method` remains the authoritative shipping-policy method and emits deterministic rates from the WooCommerce cart package.
4. The Store API mutation limiter exempts only official express requests with the valid Stripe express nonce so rapid wallet callbacks cannot be converted into false 429/no-rate failures.
5. Successful wallet responses that still contain no rates for a shippable cart emit a redacted `stripe_express_checkout_shipping_rates_missing` diagnostic. No address, name, email, phone, or payment data is logged.

DTB does not invent an address, hardcode a client-side shipping amount, bypass WooCommerce validation, or resolve Stripe wallet events itself.

## Required operator configuration

Before production validation, confirm in WooCommerce Stripe settings that:

- the official Stripe extension is connected and enabled;
- Apple Pay and Google Pay express checkout methods are enabled;
- the checkout location is enabled for express checkout buttons;
- the production domain is registered as a Stripe payment-method domain;
- the entire storefront is served over HTTPS;
- the WooCommerce shipping countries and DTB shipping-zone policy match the intended market;
- guest/account settings are compatible with express checkout;
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
- wallet cancel and retry;
- cart mutation failure and navigation retry;
- duplicate taps and slow networks.

For every successful test, verify the cart total, shipping method, tax, WooCommerce order, official Stripe transaction reference, captured-payment gate, DTB event ledger, and downstream queue eligibility remain consistent.

## Rollback

Rollback is file-based. Restore the previous frontend bundle, checkout theme assets/template, and DTB commerce MU-plugin files as one dependency-consistent set. No database migration is introduced by this feature.
