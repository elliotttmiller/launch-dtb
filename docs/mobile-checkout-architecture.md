# Mobile Checkout Architecture

Last verified against source: 2026-07-24.

## Ownership

Drywall Toolbox does not own payment processing. React owns cart UX and full-document checkout handoff only.

Production authority:

```text
React cart / cart drawer
  -> full-document navigation to /checkout/
  -> native Woo checkout runtime exception
  -> active theme checkout template/presentation
  -> assigned WooCommerce Checkout Block
  -> official WooCommerce Stripe Payment Gateway
  -> WooCommerce order/payment lifecycle
  -> DTB event ledger + dtb-orders queue
```

WooCommerce owns cart/session continuity, customer/address validation, shipping/tax/totals, checkout submission, and order creation.

The official WooCommerce Stripe Payment Gateway owns embedded payment fields, payment-method eligibility, express methods, Link, tokenization, 3DS/SCA, payment execution, and webhook-backed reconciliation.

The active `drywall-toolbox` theme owns checkout document presentation, responsive layout, visual tokens, mobile step navigation, same-origin wrapper styling, and non-authoritative presentation behavior.

MU-plugins own runtime/security/domain policy, not checkout UI rendering.

## Unified responsive contract

There is exactly one Checkout Block and one official Stripe payment surface at every viewport:

```text
WooCommerce Checkout Block
  -> one mounted official Stripe payment surface
  -> desktop: continuous checkout
  -> mobile: three-step presentation of the same mounted checkout
```

DTB must not clone, move, reparent, duplicate, or remount WooCommerce/Stripe payment controls.

There is no mobile payment sheet, modal, duplicate Payment Element, or alternate payment container.

## Mobile customer flow

Below the mobile breakpoint:

```text
1. Contact
   -> eligible Express Checkout first
   -> Woo contact/account controls
   -> Continue to shipping

2. Shipping
   -> Woo shipping/billing address controls
   -> Woo delivery/shipping methods
   -> Continue to payment

3. Payment
   -> inline official Woo/Stripe payment methods
   -> Woo terms/order notes/actions
   -> authoritative Woo Place Order
```

The step controller changes presentation state only. It does not create a second form state machine, validate commerce rules independently, calculate totals, initialize Stripe, or submit orders.

### Contact

Eligible Apple Pay, Google Pay, Link, and other express methods remain provider-owned.

The theme may style only same-origin Woo wrappers and spacing around those controls.

DTB contact First name, Last name, and Phone fields are mirrored into Woo's canonical billing/shipping address inputs. Native duplicates remain mounted for Woo validation/integrations and are hidden from duplicate shopper presentation only after classification.

### Shipping

WooCommerce owns address state, saved addresses, billing relationship, shipping rates, taxes, totals, and validation.

Theme styling must preserve original control semantics, rate IDs, keyboard behavior, and Woo change events.

### Payment

Payment remains inline on the third step.

The official Woo/Stripe payment surface stays in the canonical Woo React tree. Provider-sensitive inactive surfaces may be kept measurable offscreen so provider initialization is not destroyed by display/remount cycles.

Woo's native Place Order control is the only standard checkout submission action.

## Desktop customer flow

Desktop retains the existing continuous DTB checkout UI:

```text
Left content rail
  -> Express Checkout
  -> Contact
  -> Shipping address
  -> Shipping methods
  -> Payment
  -> Place Order

Right summary rail
  -> canonical Woo Order Summary
```

No mobile step hiding applies on desktop.

## Mobile progress navigation

`themes/drywall-toolbox/assets/checkout/checkout-ui.js` owns presentation-only step state.

Rules:

- Contact, Shipping, and Payment are the only steps.
- Future steps remain disabled until reached through forward Continue actions.
- Previously visited steps can be revisited without clearing Woo state.
- Continue actions do not submit checkout.
- On Payment, the custom Continue action is hidden and Woo Place Order remains authoritative.
- If Woo focuses an invalid control owned by another step, presentation may reveal that owning step.
- Crossing the breakpoint removes progressive hiding and restores continuous desktop flow.

## Canonical presentation assets

```text
themes/drywall-toolbox/templates/checkout/native-checkout.php
  -> native checkout document shell and theme asset enqueue

themes/drywall-toolbox/assets/checkout/checkout.css
  -> existing DTB checkout visual design

themes/drywall-toolbox/assets/checkout/checkout-refinements.css
  -> same-origin Woo wrapper normalization and contact-field presentation

themes/drywall-toolbox/assets/checkout/checkout-flow.css
  -> mobile progress, step visibility, provider-safe offscreen mounting,
     sticky Back/Continue controls

themes/drywall-toolbox/assets/checkout/checkout-boot.js
  -> mechanical boot/reveal only

themes/drywall-toolbox/assets/checkout/checkout-ui.js
  -> responsive presentation controller, step navigation, field mirroring,
     duplicate summary containment, single-gateway presentation marker

themes/drywall-toolbox/assets/checkout/checkout-profile.css

themes/drywall-toolbox/assets/checkout/checkout-profile.js
  -> signed-in profile presentation refinements
```

Backend runtime/diagnostics remain in `dtb-commerce`:

```text
dtb-commerce/Payment/WooNativeCheckoutRuntime.php
dtb-commerce/Payment/OfficialStripeNativeCheckout.php
dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
dtb-commerce/Payment/CheckoutPerformance.php
dtb-commerce/assets/woo-native-checkout-performance.js
dtb-commerce/Validation/CheckoutFieldPolicy.php
```

## Retired presentation implementations

These are intentionally absent:

```text
themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.js
themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.css

dtb-commerce/assets/woo-native-checkout.css
dtb-commerce/assets/woo-native-checkout-refinements.css
dtb-commerce/assets/woo-native-checkout-ui.js
dtb-commerce/assets/woo-native-checkout-steps.js
dtb-commerce/Templates/WooNativeCheckoutPage.php
```

Do not restore a mobile payment sheet or a second MU-plugin presentation layer.

## Stripe-safe mounting contract

DTB must:

- leave provider-owned payment nodes inside WooCommerce's React tree;
- never clone or reparent Stripe iframes/Payment Element containers;
- never create a second Stripe object, PaymentIntent flow, or Checkout Session;
- never fabricate wallet buttons or alter provider eligibility;
- style Stripe-owned surfaces only through supported gateway Appearance configuration;
- preserve hosting/runtime exclusions that keep Stripe.js on `js.stripe.com` and protect WordPress/Woo dependency ordering.

## Validation and failure behavior

WooCommerce remains final validation authority.

- Theme step controls change presentation state only.
- Woo-required field validation remains authoritative.
- Payment errors stay inline with the official payment surface.
- 3DS/SCA remains Stripe-owned.
- Presentation/telemetry failure must fail open to native Woo checkout behavior.

## Verification

Minimum release matrix:

1. Desktop continuous checkout preserves existing DTB UI and one canonical Order Summary.
2. Mobile starts on Contact with eligible Express Checkout first.
3. Contact -> Shipping retains Woo field/session state.
4. Shipping -> Payment reveals inline official Stripe payment without a modal/sheet.
5. Progress navigation returns only to visited steps.
6. Guest and authenticated checkout.
7. Contact identity fields persist to canonical Woo order/address properties.
8. Saved/edited addresses and shipping-rate changes update totals correctly.
9. Apple Pay/Google Pay/Link eligibility on supported devices.
10. Card success, decline, 3DS challenge/cancel/failure.
11. Mobile -> desktop -> mobile without duplicate controls, overlays, or lost state.
12. Exactly one Stripe runtime/payment surface and no duplicate Stripe.js load.
13. SiteGround does not combine/rehost Stripe.js or reorder checkout dependencies.
14. Successful checkout follows Woo order-received and DTB downstream lifecycle.
15. Duplicate submit/reload/webhook replay does not duplicate orders/jobs.
16. Keyboard/focus/touch-target/contrast/reduced-motion accessibility checks pass.
