# Checkout UI Architecture and Operating Contract

Last verified against active source: 2026-07-28.

## Purpose

Drywall Toolbox checkout is a native WooCommerce Checkout Block document rendered inside the headless storefront architecture. This document defines the presentation, ownership, security, responsive-design, accessibility, payment, recovery, and operational contracts for that surface.

## Authority boundary

WooCommerce owns:

- cart and customer session state;
- canonical contact, billing, and shipping fields;
- address validation and persistence;
- shipping packages, rates, selected methods, tax, discounts, and totals;
- checkout validation, Store API order creation, and refunds.

The official WooCommerce Stripe Payment Gateway owns:

- Payment Element and Express Checkout rendering;
- Apple Pay, Google Pay, Link, and other eligible methods;
- payment-method eligibility and selection;
- provider iframe contents;
- tokenization, confirmation, authentication, challenge flows, cancellation, and payment execution;
- webhook-backed payment status.

DTB owns:

- the native-checkout runtime exception inside the headless theme;
- the checkout document shell and responsive presentation;
- supported Stripe Appearance API configuration;
- checkout readiness, bounded diagnostics, and runtime telemetry;
- verified address compatibility, shipping-cache invalidation, order tagging, captured-payment gating, retry recovery, event ledger, and downstream queue eligibility.

The theme must not create duplicate checkout fields, hide or reparent provider-owned payment surfaces, create payment intents, confirm payments, or implement a second order path.

## Canonical flow

```text
React Store API cart
  -> native /checkout/ document
  -> WooCommerce Checkout Block
  -> canonical contact and address state
  -> server-authoritative shipping / tax / totals
  -> official WooCommerce Stripe payment or express wallet
  -> WooCommerce Store API order
  -> DTB checkout metadata and captured-payment gate
  -> DTB event ledger and downstream queues
  -> storefront order tracking return
```

## Audit findings corrected by the consolidated implementation

### Duplicate presentation authority

The previous template loaded a large base stylesheet plus nine later checkout override stylesheets. Those files redefined the same layout, form, payment, order-summary, typography, and mobile selectors with competing `!important` declarations. The checkout now loads one authoritative `checkout.css` file.

### Duplicate customer-field model

The previous mobile controller created proxy first-name, last-name, and phone inputs and copied their values into WooCommerce inputs. This contradicted `DTB_CheckoutFieldPolicy`, created an additional browser validation/autofill domain, and could diverge from wallet-populated WooCommerce state. All proxy-field creation and proxy styles are removed. Only native WooCommerce controls remain.

### Custom hidden-step checkout

The previous mobile flow assigned checkout sections to Contact, Shipping, and Payment steps, hid inactive WooCommerce sections, moved provider surfaces offscreen, and injected a fixed action bar. That introduced focus, browser-autofill, validation, Stripe mount, error-discovery, and responsive-layout risk. Mobile checkout is now one continuous native flow. WooCommerce sections and Stripe surfaces remain mounted, visible, measurable, and interactive.

### Payment DOM mutation

The previous payment runtime modified iframe pointer/touch styles and removed accessibility attributes. The consolidated controller does not read or modify provider iframe contents or styles. It only classifies same-origin WooCommerce wrappers for presentation.

### Duplicate failure messaging

The previous theme inferred payment failures from English notice text and injected a second recovery notice. The new controller preserves WooCommerce and Stripe messages as authoritative, focuses a newly rendered native error for accessibility, and does not rewrite its content.

### Observer amplification

The previous presentation stack used multiple whole-document MutationObservers plus repeated reconciliation timers. The consolidated UI controller uses one bounded checkout-root observer, one temporary root-discovery observer, and one WooCommerce data subscription. It does not poll form fields or create mirrored state.

## Responsive design contract

### Desktop, 1024px and wider

- Two-column grid: fluid checkout form and a bounded 360–420px order-summary rail.
- Express Checkout is visually ordered first in the desktop form column before contact and shipping sections.
- The Express Checkout block remains in WooCommerce's canonical DOM; presentation uses desktop-only CSS ordering and never clones, reparents, or remounts provider controls.
- Order summary is sticky with a safe 24px top offset and no internal scroll trap.
- Each top-level checkout section is a restrained white card with one border and low-elevation shadow.
- Form controls use a 52px minimum target, consistent radius, visible focus ring, and no forced field reordering.
- Express wallets and payment methods retain provider ownership inside modern same-origin shells.
- Product rows use a compact image, description, and price grid; totals use consistent label/value alignment.

### Tablet, below 1024px

- Checkout becomes a single column.
- Native WooCommerce order summary moves above the form.
- No sticky sidebar or fixed action overlay.
- Section spacing and card padding compress without changing control ownership.

### Mobile, below 768px

- Continuous one-page checkout; no synthetic stepper and no hidden checkout sections.
- Native order-summary disclosure remains first in flow.
- Controls use at least 54px height and 16px input text to prevent iOS zoom.
- Express wallet buttons stack to one column when required.
- Address fields collapse to one column.
- Payment content remains fully visible and is never covered by a fixed DTB action bar.
- Safe-area insets are respected.

## Accessibility contract

- Native WooCommerce labels, descriptions, validation, and control semantics remain intact.
- No checkout section receives theme-owned `aria-hidden` or `inert` state.
- Busy state is exposed through `aria-busy` on the Checkout Block root.
- Newly rendered native error notices receive programmatic focus once per unique message.
- Focus-visible outlines meet the shared primary-color contrast contract.
- Reduced-motion and forced-colors modes receive explicit fallbacks.
- Minimum interactive sizes are 44px; primary controls are 52–56px.
- Mobile inputs render at 16px or larger.

## Payment and wallet integrity

- Product Buy Now performs one serialized Store API add-to-cart mutation before native checkout navigation.
- Express handoff metadata expires after two minutes and changes presentation only.
- The official Stripe request header and nonce are required before DTB wallet compatibility logic runs.
- Wallet address changes invalidate stale WooCommerce package-rate cache.
- Successful shippable wallet responses are checked for rates, a selected rate, and a valid total.
- No client-side shipping amount, tax, allowed-country list, or total is treated as authoritative.
- Payment failure recovery is limited to unpaid DTB Stripe checkout drafts that have not crossed a downstream processing boundary.

## Presentation assets

Authoritative assets:

- `assets/checkout/checkout.css`
- `assets/checkout/checkout-boot.js`
- `assets/checkout/checkout-ui.js`
- `assets/checkout/checkout-express-entry.js`

The template attaches the desktop-only Express Checkout ordering rule to the authoritative `dtb-checkout-theme` style handle. It adds no second stylesheet and does not mutate provider DOM.

Obsolete layered desktop/mobile/refinement/contact/payment assets are intentionally not enqueued and should not be restored.

## Validation matrix

Validate at minimum:

- desktop widths: 1024, 1280, 1440, and 1920 pixels;
- mobile widths: 320, 360, 390, 430, and 768 pixels;
- Safari on iPhone and macOS;
- Chrome on Android, Windows, and macOS;
- keyboard-only navigation and visible focus;
- browser autofill and saved WooCommerce customer addresses;
- guest and authenticated checkout;
- simple and variable products with quantity greater than one;
- coupons, free shipping, paid shipping, and no-rate destinations;
- address changes across at least two states/postcodes;
- tax and shipping recalculation while controls are busy;
- Apple Pay, Google Pay, Link, card, redirect methods, cancellation, retry, and authentication flows;
- payment decline, invalid address, unavailable shipping, and network failure;
- successful Woo order, Stripe reference, captured-payment gate, event ledger, queues, and storefront return URL;
- no duplicate customer fields, payment surfaces, cart mutations, orders, or failure notices;
- no JavaScript errors, PHP notices, horizontal overflow, clipped provider content, or fixed-overlay collisions.

Real wallet acceptance requires a supported device/browser, registered payment-method domain, HTTPS, connected Stripe account, and production-equivalent WooCommerce shipping configuration.

## Database impact

The UI consolidation introduces no schema or data migration. Stripe Appearance cache/version metadata remains an existing bounded runtime option contract. Checkout, HPOS, Action Scheduler, event-ledger, order, and integration data are unchanged.

## Rollback

Rollback is file-based. Restore the previous checkout template, stylesheet, and theme scripts as one dependency-consistent set. If backend checkout modules are part of the same release, restore those files in the same rollback. Clear runtime caches and repeat native checkout smoke testing. No database rollback is required for the presentation consolidation.