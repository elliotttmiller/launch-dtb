# Mobile Checkout Architecture

Last verified against active source: 2026-07-24.

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

The historical JavaScript compatibility lookup for retired `dtb-checkout/contact-*` fields is non-authoritative and may be removed after deployment/caches prove those legacy fields no longer render. It must never be used as a wallet or order data authority.

## Shipping/tax state

WooCommerce is the only source of truth for shipping and tax.

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

## Express Checkout address contract

Apple Pay and Google Pay are provider-owned surfaces using the same Woo/Stripe checkout authority.

A valid wallet address must not be rejected because DTB introduced duplicate required customer identity fields.

Required production rules:

1. No duplicate required DTB first/last/phone Additional Checkout Fields.
2. No server-side overwrite of wallet-populated canonical Woo names/address from legacy DTB field metadata.
3. No DTB custom shipping-address validation in the wallet flow.
4. No CSS/JS access to provider iframe internals.
5. Official Stripe extension version is exposed through `/dtb/v1/checkout/capabilities` for release diagnostics.
6. Use the official Stripe extension's supported address normalization behavior; do not add speculative address rewrites without a reproduced provider/Woo normalization defect.

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
  -> live read-only shipping/tax context and final touch/hit-area corrections

themes/drywall-toolbox/assets/checkout/checkout-boot.js
  -> mechanical reveal only

themes/drywall-toolbox/assets/checkout/checkout-ui.js
  -> responsive presentation controller and read-only Woo block-store context
```

Backend runtime/diagnostics remain in `dtb-commerce`:

```text
dtb-commerce/Payment/WooNativeCheckoutRuntime.php
dtb-commerce/Payment/OfficialStripeNativeCheckout.php
dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
dtb-commerce/Payment/CheckoutPerformance.php
dtb-commerce/Validation/CheckoutFieldPolicy.php
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
4. Apple Pay and Google Pay accept valid supported shipping addresses and return applicable shipping rates without DTB duplicate-field validation failures.
5. Wallet-selected address/name values remain canonical and are not overwritten by legacy `dtb-checkout/contact-*` metadata.
6. Standard manual checkout captures Woo canonical first/last/phone/address values correctly.
7. Order customer/address fields match the canonical Woo checkout state.
8. Order Summary live context matches Woo native totals; it never calculates independent values.
9. Apple Pay/Google Pay/Link eligibility remains provider-owned.
10. Card success, decline, 3DS challenge/cancel/failure remain official Stripe/Woo flows.
11. Mobile -> desktop -> mobile does not duplicate controls or lose state.
12. Exactly one Stripe runtime/payment surface exists.
13. SiteGround does not combine/rehost Stripe.js or reorder critical checkout dependencies.
14. Successful checkout follows Woo order-received and DTB downstream lifecycle exactly once.
15. Run `scripts/smoke-dtb-checkout-ui.ps1`, `scripts/smoke-dtb-express-checkout-address.ps1`, and `scripts/smoke-dtb-mu-modules.ps1` before deployment.
