# Mobile Checkout Architecture

Last verified against active source: 2026-07-26.

## Ownership

Drywall Toolbox does not own checkout commerce state or payment processing.

```text
React cart / cart drawer
  -> full-document navigation to /checkout/
  -> native Woo checkout runtime exception
  -> active drywall-toolbox theme presentation
  -> one assigned WooCommerce Checkout Block
  -> one official WooCommerce Stripe Payment Gateway surface
  -> WooCommerce order/payment lifecycle
  -> DTB event ledger + dtb-orders queue
```

Authorities:

- **WooCommerce** owns cart/session continuity, customer identity/address state, shipping, tax, totals, validation, checkout submission, and order creation.
- **Official WooCommerce Stripe Payment Gateway** owns Apple Pay, Google Pay, Link, payment fields, tokenization, SCA/3DS, payment execution, and wallet address handoff into WooCommerce.
- **Active `drywall-toolbox` theme** owns checkout document presentation, responsive layout, mobile step navigation, same-origin wrapper styling, and read-only presentation context.
- **DTB MU-plugins** own runtime/security/domain policy and downstream lifecycle orchestration. They do not own checkout UI rendering or a second customer/address data model.

## Canonical customer/address contract

There is one customer/address authority: WooCommerce canonical checkout/customer state.

DTB must not register duplicate first-name, last-name, phone, shipping, or billing fields through `woocommerce_register_additional_checkout_field()` merely to reposition existing Woo identity data. Additional Checkout Fields are reserved for genuinely additional business data.

Retired duplicate field IDs:

```text
dtb-checkout/contact-first-name
dtb-checkout/contact-last-name
dtb-checkout/contact-phone
```

Historical order metadata using those IDs is retained for audit compatibility, but new checkout requests do not register or require those fields and do not copy them back over canonical Woo address properties.

This invariant is required for Express Checkout:

```text
Apple Pay / Google Pay wallet address
  -> official Stripe Express Checkout integration
  -> Woo canonical customer/shipping address
  -> Woo shipping zones/rates
  -> Woo tax calculation
  -> Woo checkout/order validation
```

DTB must not insert a second required validation domain between the wallet and WooCommerce.

## Unified responsive contract

There is exactly one Checkout Block and one official Stripe payment surface at every viewport.

```text
WooCommerce Checkout Block
  -> desktop: continuous checkout
  -> mobile: three-step presentation of the same mounted checkout
```

DTB must never clone, move, reparent, duplicate, or remount Woo/Stripe payment controls.

There is no mobile payment sheet, duplicate Payment Element, alternate payment container, or custom PaymentIntent flow.

## Mobile flow

Below the mobile breakpoint:

```text
1. Contact
   -> eligible Express Checkout first
   -> Woo contact/account controls
   -> Continue to shipping

2. Shipping
   -> Woo canonical shipping/billing address controls
   -> Woo shipping/delivery methods
   -> live Woo shipping/tax recalculation
   -> Continue to payment only after Woo settles

3. Payment
   -> inline official Woo/Stripe payment methods
   -> Woo terms/order notes/actions
   -> authoritative Woo Place Order
```

The step controller changes presentation state only. It does not calculate commerce values, invent validation rules, initialize Stripe, create orders, or submit payment.

## Contact and identity

The Contact step may visually contain Woo's email/account controls and Express Checkout.

First name, last name, phone, shipping address, and billing address remain canonical Woo customer/address properties. DTB does not maintain duplicated required contact-field registrations for those values.

Theme-rendered mobile first/last/phone controls are presentation proxies only. They synchronize to the currently mounted canonical Woo address inputs and must never become a second persistence or validation authority.

## Shipping/tax state

WooCommerce is the only source of truth for shipping and tax.

Drywall Toolbox's tax sourcing policy is explicitly **shipping-destination based**. `DTB_CheckoutTaxReadiness` forces Woo's `woocommerce_tax_based_on` option to `shipping`, while the actual Minnesota rate remains operator-managed in WooCommerce > Settings > Tax. DTB does not hard-code a percentage or calculate tax in JavaScript/PHP outside Woo's tax engine.

The theme may subscribe read-only to Woo's registered block stores for presentation:

```text
cartStore.getCartTotals()
cartStore.getCustomerData()
cartStore.getCartMeta()
cartStore.getNeedsShipping()
cartStore.getHasCalculatedShipping()
checkoutStore.isCalculating()
```

The DTB `Delivery & tax` context is read-only. It must not replace Woo totals or calculate its own shipping/tax values.

Mobile forward navigation must not advance Shipping -> Payment while Woo reports address/rate recalculation in progress or before required shipping has been calculated.

## Payment interaction contract

The Payment step is provider-owned once revealed.

```text
DTB step controller
  -> reveals the already-mounted Woo Payment block
  -> removes DTB fixed navigation overlap
  -> classifies redundant same-origin single-gateway shell only

WooCommerce Stripe
  -> owns Optimized Checkout / Payment Element
  -> owns payment-method selection
  -> owns iframe contents and focus/touch behavior
  -> owns validation / confirmation / SCA
```

`checkout-payment-runtime.js` and `checkout-payment-interaction.css` are narrow same-origin hardening layers. They may remove `inert`/overlap/clipping from Woo wrapper nodes and normalize a redundant single-gateway selector, but they must never inspect iframe contents, synthesize provider clicks, select a payment method, clone/reparent provider nodes, or create a second payment surface.

## Express Checkout address contract

Apple Pay and Google Pay are provider-owned surfaces using the same Woo/Stripe checkout authority.

A valid wallet address must not be rejected because DTB introduced duplicate required customer identity fields or because an equivalent provider field name was not converted into Woo's canonical address shape.

`dtb-commerce/Payment/ExpressCheckoutAddressIntegrity.php` is a compatibility and observability boundary only:

```text
verified Stripe Express Checkout request
  -> official Stripe express-context header
  -> official wc_store_api_express_checkout nonce
  -> normalize equivalent address aliases
  -> Woo canonical billing_address / shipping_address
  -> Woo validation, shipping, tax, and checkout remain authoritative
```

Supported compatibility surfaces:

1. `wc_stripe_express_checkout_normalize_address` for official Stripe 10.2+ AJAX normalization.
2. `wc_stripe_payment_request_shipping_posted_values` for the legacy Payment Request pathway.
3. Verified Store API `/cart/update-customer` and `/checkout` requests for current tokenized-cart Express Checkout flows.

Canonicalization is intentionally limited to equivalent representations:

```text
firstName / givenName        -> first_name
lastName / familyName        -> last_name
addressLine[] / line1        -> address_1 / address_2
locality / postalTown        -> city
region / administrativeArea -> state code through Woo country/state tables
postalCode / zipCode         -> postcode
countryCode / country name   -> Woo country code
```

The boundary must never:

- invent a street, city, state, postcode, country, or recipient;
- geocode or call an external address service during checkout;
- disable Woo postcode/address validation globally;
- modify ordinary non-Express Store API requests;
- log wallet payloads, names, street addresses, email, phone, payment data, tokens, or client secrets;
- create/confirm Stripe payments or own cart/session lifecycle.

Failures are logged only as redacted route/status/error-code diagnostics. The deployed official WooCommerce Stripe extension should be kept at the repository's recommended minimum or newer because upstream releases include Express Checkout Store API, address, and checkout-session fixes.

Required production rules:

1. No duplicate required DTB first/last/phone Additional Checkout Fields.
2. No server-side overwrite of wallet-populated canonical Woo names/address from legacy DTB field metadata.
3. No DTB custom shipping-address validation in the wallet flow.
4. No CSS/JS access to provider iframe internals.
5. Official Stripe extension version is exposed through `/dtb/v1/checkout/capabilities` for release diagnostics.
6. Express Store API normalization requires Stripe's signed context header and nonce.
7. Address normalization remains idempotent and never bypasses Woo validation.

## Theme presentation assets

```text
themes/drywall-toolbox/templates/checkout/native-checkout.php
  -> native checkout document shell and ordered assets

themes/drywall-toolbox/assets/checkout/checkout.css
  -> base DTB checkout visual design

themes/drywall-toolbox/assets/checkout/checkout-refinements.css
  -> same-origin Woo wrapper / Express / order-summary normalization

themes/drywall-toolbox/assets/checkout/checkout-flow.css
  -> responsive mobile step visibility/progress/actions

themes/drywall-toolbox/assets/checkout/checkout-runtime-context.css
  -> live read-only shipping/tax context and general touch/hit-area corrections

themes/drywall-toolbox/assets/checkout/checkout-contact-identity.css
  -> mobile contact presentation proxy styling

themes/drywall-toolbox/assets/checkout/checkout-payment-interaction.css
  -> final same-origin payment wrapper/hit-test hardening

themes/drywall-toolbox/assets/checkout/checkout-boot.js
  -> mechanical reveal only

themes/drywall-toolbox/assets/checkout/checkout-ui.js
  -> responsive presentation controller and read-only Woo block-store context

themes/drywall-toolbox/assets/checkout/checkout-payment-runtime.js
  -> narrow payment-step overlap/single-gateway/provider-mount hardening
```

Backend runtime/diagnostics remain in `dtb-commerce`:

```text
dtb-commerce/Payment/WooNativeCheckoutRuntime.php
dtb-commerce/Payment/OfficialStripeNativeCheckout.php
dtb-commerce/Payment/ExpressCheckoutAddressIntegrity.php
dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
dtb-commerce/Payment/CheckoutPerformance.php
dtb-commerce/Validation/CheckoutFieldPolicy.php
dtb-commerce/Validation/CheckoutTaxReadiness.php
```

## Retired implementations

Do not restore:

```text
themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.js
themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.css
themes/drywall-toolbox/assets/checkout/checkout-profile.js
themes/drywall-toolbox/assets/checkout/checkout-profile.css

dtb-commerce/assets/woo-native-checkout.css
dtb-commerce/assets/woo-native-checkout-refinements.css
dtb-commerce/assets/woo-native-checkout-ui.js
dtb-commerce/assets/woo-native-checkout-steps.js
dtb-commerce/Templates/WooNativeCheckoutPage.php
```

## Verification

Minimum release matrix:

1. Guest checkout and authenticated checkout both render one canonical Woo Checkout Block.
2. Mobile Contact -> Shipping -> Payment works with direct touch interaction and no duplicate controls.
3. Shipping/address edits update Woo shipping rates, tax, and totals before Payment is reachable.
4. Minnesota tax configured in Woo admin is sourced from the canonical shipping destination and appears in Woo `total_tax`; non-Minnesota behavior follows the configured Woo rates.
5. Apple Pay and Google Pay accept valid supported shipping addresses and return applicable shipping rates without DTB duplicate-field validation failures.
6. Wallet addresses using long-form state names and provider aliases normalize to Woo canonical fields.
7. Express Store API requests without the official header/nonce are not modified.
8. Wallet-selected address/name values remain canonical and are not overwritten by legacy `dtb-checkout/contact-*` metadata.
9. Standard manual checkout captures Woo canonical first/last/phone/address values correctly.
10. Order customer/address fields match the canonical Woo checkout state.
11. Order Summary live context matches Woo native totals; it never calculates independent values.
12. Payment-method options remain selectable/tappable on a real mobile device and the DTB fixed action shell is absent on Payment.
13. Apple Pay/Google Pay/Link eligibility remains provider-owned.
14. Card success, decline, 3DS challenge/cancel/failure remain official Stripe/Woo flows.
15. Mobile -> desktop -> mobile does not duplicate controls or lose state.
16. Exactly one Stripe runtime/payment surface exists.
17. SiteGround does not combine/rehost Stripe.js or reorder critical checkout dependencies.
18. Successful checkout follows Woo order-received and DTB downstream lifecycle exactly once.
19. Run `scripts/smoke-dtb-express-checkout-address-integrity.ps1`, `scripts/smoke-dtb-checkout-payment-ui.ps1`, `scripts/smoke-dtb-checkout-ui.ps1`, and `scripts/smoke-dtb-express-checkout-address.ps1` before deployment.
