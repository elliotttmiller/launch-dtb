# Mobile Checkout Architecture

Last verified against active source: 2026-07-24.

## Ownership

Drywall Toolbox does not own payment processing or checkout commerce state. React owns cart UX and the full-document checkout handoff only.

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

WooCommerce owns cart/session continuity, customer/address validation, shipping rates, tax, totals, checkout submission, and order creation.

The official WooCommerce Stripe Payment Gateway owns embedded payment fields, payment-method eligibility, express methods, Link, tokenization, 3DS/SCA, payment execution, and webhook-backed reconciliation.

The active `drywall-toolbox` theme owns checkout document presentation, responsive layout, mobile presentation-step state, read-only checkout context presentation, and non-authoritative field mirroring. MU-plugins own runtime/security/domain policy, not checkout UI rendering.

## Unified responsive contract

There is exactly one Checkout Block and one official Stripe payment surface at every viewport:

```text
WooCommerce Checkout Block
  -> one mounted official Stripe payment surface
  -> desktop: continuous checkout
  -> mobile: Contact -> Shipping -> Payment presentation over the same mounted tree
```

DTB must not clone, move, reparent, duplicate, or remount WooCommerce/Stripe payment controls.

There is no mobile payment sheet, modal, duplicate Payment Element, alternate payment container, or second checkout form/state authority.

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
   -> Woo shipping/tax recalculation settles
   -> Continue to payment

3. Payment
   -> inline official Woo/Stripe payment methods
   -> Woo terms/order notes/actions
   -> authoritative Woo Place Order
```

The DTB controller owns only which already-mounted Woo sections are presented. It never calculates commerce values, selects payment methods, creates orders, or submits checkout.

## Functional step-navigation contract

`themes/drywall-toolbox/assets/checkout/checkout-ui.js` is the sole mobile presentation-step controller.

The controller now prefers stable Woo Checkout inner-block wrappers when assigning step ownership:

```text
Contact
  checkout-express-payment-block
  checkout-contact-information-block
  checkout-create-account-block

Shipping
  checkout-shipping-method-block
  checkout-pickup-options-block
  checkout-shipping-address-block
  checkout-billing-address-block
  checkout-shipping-methods-block

Payment
  checkout-payment-block
  checkout-additional-information-block
  checkout-order-note-block
  checkout-terms-block
  checkout-actions-block
```

Internal `.wc-block-*` selectors exist only as compatibility fallbacks. A nested implementation class must not accidentally become the owner of a full mobile step.

Navigation rules:

- Contact, Shipping, and Payment are the only shopper steps.
- Future progress buttons remain disabled until reached through forward navigation.
- Previously visited steps can be revisited without clearing Woo state.
- Back/Continue controls use direct button listeners; there is no document-wide delegated click interceptor.
- The fixed mobile action shell must remain directly tappable on iOS/Safari.
- Before hiding a step, only currently visible browser-invalid fields are surfaced; hidden conditional Woo controls are not independently revalidated by DTB.
- Shipping -> Payment waits while Woo reports checkout recalculation in progress and requires Woo to report shipping calculated when the cart needs shipping.
- WooCommerce remains the final validation authority at order submission.
- On Payment, the custom Continue control is hidden and Woo Place Order remains the only standard submit action.
- If Woo focuses an invalid control owned by another step, the presentation controller may reveal that owning step.
- Crossing the mobile breakpoint removes progressive hiding and restores continuous desktop flow.

## Contact identity mirroring

DTB contact First name, Last name, and Phone fields are registered through WooCommerce's supported Additional Checkout Fields API in the `contact` location.

The presentation controller mirrors those values into Woo's canonical shipping/billing inputs so shipping, tax, fraud checks, customer persistence, order persistence, and downstream integrations continue consuming standard Woo fields.

Checkout Blocks may replace address input DOM nodes after customer/session updates. Therefore contact input handlers resolve the **current** canonical Woo inputs on every edit rather than retaining stale node references from the initial mount.

Native duplicate identity fields remain in Woo's mounted state and are hidden from duplicate shopper presentation only after classification.

## Live order-summary context

WooCommerce remains the source of truth for totals. DTB does not calculate shipping or tax independently.

The checkout template explicitly loads the official block data store dependency before `checkout-ui.js`:

```text
wp-data
wc-blocks-data-store
  -> checkout-ui.js
```

The controller reads the registered Woo stores through `window.wp.data` and `window.wc.wcBlocksData`:

```text
cartStore
  -> getCartTotals()
  -> getCustomerData()
  -> getCartMeta()
  -> getNeedsShipping()
  -> getHasCalculatedShipping()

checkoutStore
  -> isCalculating()
```

The canonical Woo Order Summary receives one DTB-owned, read-only `Delivery & tax` context element. It presents:

```text
Ship to
  -> current Woo shipping destination or "Enter shipping address"

Shipping
  -> Woo total_shipping once calculated
  -> selected delivery label when discoverable from the mounted Woo control
  -> "Calculated at shipping" before calculation

Estimated tax
  -> Woo total_tax once shipping/tax calculation is available
  -> "Calculated from address" before calculation

Status
  -> Live / Updating… based on Woo calculation/customer/rate state
```

This element supplements rather than replaces Woo's native subtotal/shipping/tax/total rows. No value is authoritative unless it came from the Woo block data stores.

Woo's data flow remains:

```text
shopper edits address / selects delivery
  -> Woo block cart/customer state
  -> debounced Store API update
  -> server recalculates shipping/tax/totals
  -> Woo cart/checkout data stores update
  -> native Woo totals rerender
  -> DTB read-only context rerenders from the same store values
```

## Payment mounting contract

Payment remains inline on the third step.

The official Woo/Stripe payment surface stays inside the canonical Woo React tree. Provider-sensitive inactive Payment and Express Checkout surfaces may remain mounted/measurable offscreen so provider initialization is not destroyed by display/remount cycles.

DTB must:

- leave provider-owned payment nodes inside WooCommerce's React tree;
- never clone or reparent Stripe iframes/Payment Element containers;
- never create a second Stripe object, PaymentIntent flow, or Checkout Session;
- never fabricate wallet buttons or alter provider eligibility;
- style Stripe-owned surfaces only through supported gateway Appearance configuration;
- preserve hosting/runtime exclusions that keep Stripe.js on `js.stripe.com` and protect WordPress/Woo dependency ordering.

## Desktop customer flow

Desktop remains continuous:

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
  -> DTB read-only live Delivery & tax context
```

No mobile step hiding applies on desktop.

## Canonical presentation assets

```text
themes/drywall-toolbox/templates/checkout/native-checkout.php
  -> native checkout document shell
  -> deterministic presentation/data-store dependency ordering

themes/drywall-toolbox/assets/checkout/checkout.css
  -> base DTB checkout visual design

themes/drywall-toolbox/assets/checkout/checkout-refinements.css
  -> same-origin Woo wrapper/contact/Express/order-summary normalization

themes/drywall-toolbox/assets/checkout/checkout-flow.css
  -> mobile progress, step visibility, provider-safe offscreen mounting,
     fixed Back/Continue layout

themes/drywall-toolbox/assets/checkout/checkout-runtime-context.css
  -> final DTB-owned live shipping/tax context presentation,
     calculation/validation status, iOS/Safari action hit-testing override

themes/drywall-toolbox/assets/checkout/checkout-boot.js
  -> mechanical boot/reveal only

themes/drywall-toolbox/assets/checkout/checkout-ui.js
  -> sole responsive step controller, field mirroring, Woo data-store subscription,
     live summary context, duplicate-summary containment, gateway presentation marker
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

## Cascade contract

The authoritative theme style order is:

```text
checkout.css
  -> checkout-refinements.css
  -> checkout-flow.css
  -> checkout-runtime-context.css
```

`checkout-runtime-context.css` is intentionally narrow. It may style only DTB-owned progressive-navigation status/live-context elements and final touch hit-testing behavior. It must not become a generic override layer for Woo/Stripe internals.

## Failure behavior

- WooCommerce remains final validation, shipping, tax, totals and submission authority.
- If Woo block data stores are unavailable, the native Woo summary remains authoritative and the DTB context stays non-authoritative/fallback-only.
- If shipping/tax recalculation is active, forward navigation may pause rather than presenting stale Payment context.
- Payment errors stay inline with the official payment surface.
- 3DS/SCA remains Stripe-owned.
- Presentation/telemetry failure must not create an alternate submit/order path.

## Verification

Minimum release matrix:

1. Desktop continuous checkout preserves one canonical Woo Order Summary and one Stripe payment surface.
2. Mobile starts on Contact with eligible Express Checkout first.
3. Contact -> Shipping works by direct touch/click on iOS Safari and Android Chrome.
4. Invalid visible Contact fields remain on Contact and surface browser/Woo validation context.
5. Shipping -> Payment waits for active Woo recalculation, then advances when shipping is calculated.
6. Back/progress navigation returns only to visited steps without clearing Woo state.
7. Contact identity mirroring survives Woo Checkout Block address-control rerenders.
8. Editing country/state/postcode/city updates Woo shipping/tax/total values and the DTB live context from the same store state.
9. Changing shipping method updates both native Woo totals and the DTB Shipping context without a page reload.
10. Tax context changes from pending/address-dependent state to authoritative Woo `total_tax` after calculation.
11. Guest and authenticated checkout both preserve cart/customer ownership.
12. No retired payment-sheet/profile/MU presentation assets are loaded.
13. Apple Pay/Google Pay/Link eligibility remains provider-owned on supported devices.
14. Card success, decline, 3DS challenge/cancel/failure remain official Stripe/Woo flows.
15. Mobile -> desktop -> mobile does not duplicate controls, overlays, summaries, or lose state.
16. Exactly one Stripe runtime/payment surface is mounted and Stripe.js is not duplicated/rehosted.
17. SiteGround does not combine/reorder critical Woo/WordPress/Stripe checkout dependencies.
18. Successful checkout follows Woo order-received and DTB downstream lifecycle.
19. Duplicate submit/reload/webhook replay does not duplicate orders/jobs.
20. Keyboard/focus/touch-target/contrast/reduced-motion accessibility checks pass.
