# Mobile Checkout Architecture

Last verified against source: 2026-07-23.

## Ownership

Drywall Toolbox does not own payment processing. React owns cart UX and the full-document checkout handoff only.

The production checkout authority is:

```text
React cart / cart drawer
  -> full-document navigation to /checkout/
  -> assigned WordPress WooCommerce Checkout page
  -> WooCommerce Checkout Block
  -> official WooCommerce Stripe Payment Gateway
  -> WooCommerce order/payment lifecycle
  -> DTB event ledger + dtb-orders queue
```

WooCommerce owns cart/session continuity, customer/address validation, shipping/tax/totals, checkout submission, and order creation. The official WooCommerce Stripe Payment Gateway owns embedded payment fields, payment-method eligibility, express methods, Link, tokenization, 3DS/SCA, payment execution, and webhook-backed reconciliation.

DTB owns checkout shell presentation, responsive layout, mobile step navigation, visual tokens, readiness telemetry, and provider-safe styling only.

## Unified responsive contract

There is exactly one checkout runtime and one payment surface at every viewport:

```text
WooCommerce Checkout Block
  -> one mounted official Stripe payment surface
  -> desktop: continuous two-column checkout
  -> mobile: three-step presentation of the same mounted checkout
```

DTB must not clone, move, reparent, duplicate, or remount WooCommerce or Stripe payment controls to create a mobile-specific payment implementation.

The retired mobile payment bottom sheet is no longer part of the checkout architecture.

## Mobile customer flow

Below the mobile breakpoint, DTB presents the existing Checkout Block as three progressive visual steps:

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
   -> Woo/Stripe payment methods inline
   -> Woo terms/order notes/actions
   -> authoritative Woo Place Order submission
```

The step controller changes presentation state only. It does not create a second form state machine, validate commerce rules independently, calculate totals, select shipping methods, initialize Stripe, or submit orders.

### Contact

The official WooCommerce Stripe Express Checkout block remains first when the provider reports an eligible wallet or accelerated method. Apple Pay, Google Pay, Link, and other eligible express methods remain provider-owned.

DTB may style the outer express container and responsive spacing, but it must not fabricate wallet buttons, change wallet eligibility, or manipulate provider iframe internals.

The native Woo contact/account blocks follow Express Checkout. Guest and authenticated users both remain in WooCommerce's authoritative customer/session model.

### Shipping

The Shipping step contains Woo-owned shipping address, billing relationship/address, delivery/shipping methods, and pickup controls when available.

Saved addresses, field hydration, validation, rate selection, shipping recalculation, taxes, and totals remain WooCommerce-owned.

DTB styles shipping-rate rows as selectable visual cards while preserving the original radio controls, rate identifiers, labels, prices, keyboard behavior, and change events.

### Payment

Payment is an inline third step. There is no DTB payment modal, bottom sheet, duplicate Payment Element, or alternate payment container.

The existing official Stripe/Woo payment surface stays in the canonical WooCommerce React tree and becomes visible when the Payment step is active.

The authoritative WooCommerce Place Order control remains the only standard checkout submission control. DTB may style it but must not intercept or replace its submission behavior.

## Desktop customer flow

At desktop widths, DTB does not apply progressive step hiding. The checkout remains a continuous WooCommerce document with a Stripe-inspired presentation:

```text
Left content rail
  -> Express Checkout
  -> Contact
  -> Shipping address
  -> Shipping methods
  -> Payment
  -> Place Order

Right summary rail
  -> sticky canonical Woo Order Summary
```

Desktop and mobile use the same visual tokens, form-control treatment, shipping selection treatment, payment styling, and trust language. Only responsive information architecture changes.

## Mobile progress navigation

`woo-native-checkout-ui.js` inserts a presentation-only three-step progress control above the native checkout.

Rules:

- Contact, Shipping, and Payment are the only steps.
- Future steps remain disabled until reached through the forward Continue action.
- Previously visited steps may be revisited without clearing Woo state.
- Continue actions do not submit checkout and do not create payment state.
- On Payment, the custom Continue bar is removed and Woo's native Place Order action remains authoritative.
- If WooCommerce focuses a control owned by a different step during validation/recovery, presentation follows that focused control so the error is visible.
- Crossing the mobile breakpoint removes DTB step hiding and restores normal continuous desktop flow.

## Canonical presentation assets

```text
dtb-commerce/assets/woo-native-checkout.css
  -> single authoritative checkout visual system
  -> design tokens, shell, desktop two-column layout, cards, fields,
     express checkout framing, shipping selectors, payment framing,
     order summary, mobile progress UI, and mobile Continue bar

dtb-commerce/assets/woo-native-checkout-steps.js
  -> mechanical boot/reveal only

dtb-commerce/assets/woo-native-checkout-ui.js
  -> presentation-only mobile three-step state, progress navigation,
     Continue actions, dynamic Woo block classification, responsive cleanup,
     and validation-focus recovery
dtb-commerce/Payment/CheckoutPerformance.php
  -> telemetry permission/write boundary and runtime capability metadata
dtb-commerce/assets/woo-native-checkout-performance.js
  -> scoped diagnostics, provider timeout detection, CWV observation,
     third-party audit, image policy, and checkout-root replacement signals
```

The retired files are intentionally absent:

```text
dtb-commerce/Payment/MobilePaymentSheet.php
dtb-commerce/assets/woo-native-checkout-payment-sheet.js
dtb-commerce/assets/woo-native-checkout-payment-sheet.css
dtb-commerce/assets/woo-native-checkout-profile-refinements.js
dtb-commerce/assets/woo-native-checkout-profile-refinements.css
```

New checkout presentation belongs in the single authoritative `woo-native-checkout.css`. New responsive presentation behavior belongs in `woo-native-checkout-ui.js`. Do not recreate downstream override stylesheets or another payment presentation state machine.

## Stripe-safe mounting contract

The official Stripe runtime may initialize before the customer reaches Payment.

DTB must:

- leave provider-owned payment nodes inside the WooCommerce React tree;
- never clone Stripe iframes or Payment Element containers;
- never create a second Stripe object, PaymentIntent flow, or Checkout Session;
- never fabricate wallet buttons;
- never change provider eligibility logic;
- use the official gateway's supported Appearance configuration for Stripe-owned visual surfaces;
- keep SiteGround/host optimization exclusions that preserve Stripe.js origin and WordPress/Woo dependency ordering.

## Validation and error behavior

WooCommerce remains final validation authority.

- DTB step controls change presentation state only.
- Woo-required fields and checkout validation remain authoritative.
- If Woo focuses an invalid control in Contact or Shipping, DTB reveals the owning step.
- Payment-specific errors remain inline with the official payment surface.
- 3DS/SCA remains Stripe-owned and must return to the same Woo payment state on failure/cancel.
- Successful payment follows WooCommerce order-received and existing DTB return/tracking behavior.
- A DTB presentation or telemetry failure must fail open to the native Woo checkout.

## Checkout performance and stability

`dtb-commerce/Payment/CheckoutPerformance.php` and `dtb-commerce/assets/woo-native-checkout-performance.js` remain diagnostics-only.

The provider timeout watch runs continuously on desktop and when the Payment step is active on the enhanced mobile checkout. It must never create a fallback payment implementation.

Diagnostics route:

```text
POST /wp-json/dtb/v1/checkout/runtime-telemetry
```

It remains nonce protected, same-origin checked, rate limited, deduplicated, allowlisted, bounded, sanitized, and sensitive-value redacted.

## Verification

Release acceptance requires session-preserving browser validation against the canonical checkout route.

Minimum matrix:

1. Desktop continuous checkout renders Express, Contact, Shipping, Payment, Place Order, and one canonical sticky Order Summary.
2. Mobile starts on Contact with eligible Express Checkout first.
3. Contact -> Continue to shipping -> Shipping without losing Woo field/session state.
4. Shipping -> Continue to payment -> inline official Stripe payment surface.
5. Progress navigation returns only to already visited steps.
6. Guest and authenticated checkout.
7. Saved and edited addresses.
8. Shipping-rate changes update Woo totals and summary correctly.
9. Apple Pay eligibility on Safari/iPhone where configured.
10. Google Pay eligibility on supported Chrome/Android where configured.
11. Card success, decline, 3DS challenge/cancel/failure.
12. Cash App Pay, Affirm, Klarna, or other enabled methods remain provider controlled and render only when eligible.
13. Woo validation reveals the owning mobile step for invalid controls.
14. Resize mobile -> desktop -> mobile without duplicated controls, overlays, stale hidden sections, or lost state.
15. Exactly one Stripe runtime and one payment surface; no duplicate Stripe.js load.
16. SiteGround optimization does not combine/rehost Stripe.js or reorder checkout dependencies.
17. Runtime telemetry records bounded/redacted diagnostics and rejects invalid nonce/origin/rate-limit cases.
18. Successful checkout follows the Woo order-received -> DTB tracking/return contract.
19. Duplicate submit/reload/webhook replay does not duplicate orders or downstream jobs.
20. Mobile and desktop accessibility checks cover keyboard focus, visible focus state, touch targets, labels, contrast, and reduced-motion behavior.
