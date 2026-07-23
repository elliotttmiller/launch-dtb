# Checkout theme presentation ownership

The active `drywall-toolbox` WordPress theme owns the native WooCommerce checkout document and all DTB checkout presentation assets.

## Theme-owned

- `templates/checkout/native-checkout.php` — native checkout document shell that delegates form rendering to the assigned WooCommerce Checkout Block via `the_content()`.
- `assets/checkout/checkout.css` — complete DTB checkout visual system and responsive layout.
- `assets/checkout/checkout-boot.js` — mechanical boot/reveal presentation.
- `assets/checkout/checkout-ui.js` — presentation-only progressive checkout interactions.
- `assets/checkout/checkout-profile.{css,js}` — signed-in presentation refinements.
- `assets/checkout/checkout-payment-sheet.{css,js}` — mobile payment-sheet shell/accessibility presentation around provider-owned controls.

## MU-plugin-owned

`dtb-commerce` remains authoritative for native checkout routing/runtime policy, no-store headers, Woo/Stripe readiness, Stripe Appearance API configuration, checkout/order metadata, payment lifecycle observation, security, telemetry, and downstream integration policy.

WooCommerce Checkout Block remains authoritative for fields, cart/session state, customer/address validation, shipping, tax, totals, order creation and submission. The official WooCommerce Stripe Payment Gateway remains authoritative for payment methods, provider iframes, tokenization, wallets, 3DS/SCA, payment execution and webhook reconciliation.

The theme must never duplicate Woo-controlled checkout inputs, create storefront orders, create Stripe PaymentIntents/Checkout Sessions, or replace provider-owned payment controls.
