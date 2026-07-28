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

An earlier mobile flow assigned checkout sections to Contact, Shipping, and Payment steps, created proxy contact fields, moved provider surfaces offscreen with mixed hiding techniques, and injected a fixed action bar that could sit over payment content. That version was reverted in favor of one continuous scrolling page on every breakpoint.

The current implementation restores a below-1024px Contact -> Shipping -> Payment wizard, rebuilt against the consolidated controller with three constraints the earlier version did not fully hold to: (1) no proxy/shadow fields — only native WooCommerce controls are read or validated; (2) a single, uniform, never-`display:none` visual-hiding technique for every inactive step, so no code path can accidentally unmount the step that happens to hold the Payment Element; (3) the Back/Continue action row is inline in normal document flow, not a fixed overlay, so it can never cover the Stripe Payment Element or wallet buttons. See "Responsive design contract" below for the current, accurate behavior.

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

### Tablet and mobile, below 1024px: Contact -> Shipping -> Payment wizard

Below 1024px, `checkout-ui.js` presents the single mounted WooCommerce Checkout Block as a three-step wizard instead of one long scroll. This is presentation-only:

- Checkout becomes a single column; the native WooCommerce order summary moves above the form (order summary is not itself a wizard step).
- Top-level Checkout Block sections are grouped into three steps by structural position, not by an enumerated list of specific block class names: the Express Checkout block (if rendered) plus the first `.wc-block-components-checkout-step` wrapper is Contact, the last such wrapper (plus any trailing non-step sibling, e.g. order notes/terms/actions) is Payment, and any wrapper(s) in between are Shipping. `.wc-block-components-checkout-step` is WooCommerce Blocks' own stable public wrapper class for every step regardless of which concrete step it is, and Woo always renders Contact first and Payment last, so this holds across Woo Blocks versions without depending on undocumented or version-specific block/element class names. No new fields, no field values are read from or written into anything but native WooCommerce inputs.
- The active step's top-level sections receive `data-dtb-checkout-step="contact|shipping|payment"` and `aria-hidden="false"`; inactive steps receive `aria-hidden="true"` and the `is-dtb-checkout-step-inactive` class. That class hides sections visually (zero height, zero opacity, `pointer-events: none`, taken out of flow) — it never sets `display:none`. Every WooCommerce/Stripe node, including the mounted Payment Element and wallet buttons, therefore stays in the DOM and mounted the entire time, regardless of which step is active.
- A progress indicator (`.dtb-checkout-wizard-progress`) renders three numbered circles with label/sublabel text ("Contact / Your details", "Shipping / Delivery options", "Payment / Review & pay"), a connecting line, a filled/checked state for completed steps, and a filled active-state circle for the current step. Clicking a completed step's circle navigates back to it (forward navigation past the current step is only available via Continue).
- An inline Back/Continue action row (`.dtb-checkout-wizard-actions`) sits in normal document flow directly after the active step's content — it is never `position: fixed` and can never cover the Payment Element or wallet buttons. On the Payment step only a Back control is shown; the native WooCommerce "Place order" button (already part of the Payment step's actions block) remains the sole way to submit.
- Continuing past Contact or Shipping runs native-field validation only (`checkValidity()`/`reportValidity()` on the real WooCommerce inputs in that step) and, for Shipping, confirms a shipping method has been calculated and selected before advancing. No client value is treated as authoritative; WooCommerce's own subsequent validation and totals remain the last word.
- Controls use at least 54px height and 16px input text to prevent iOS zoom. Express wallet buttons stack to one column when required. Address fields collapse to one column. Safe-area insets are respected.
- Crossing the 1024px breakpoint (e.g. device rotation, browser resize) tears the wizard down or mounts it via a `matchMedia` change listener without reloading the document; desktop never receives step markers.

## Accessibility contract

- Native WooCommerce labels, descriptions, validation, and control semantics remain intact.
- No checkout section receives theme-owned `inert` state, and no section is ever removed from the DOM or set to `display:none` by theme code.
- Below 1024px only, top-level Checkout Block sections receive theme-owned `aria-hidden` to reflect which of the three wizard steps is current; the inactive-step CSS class this pairs with is a visual hide (zero height/opacity, non-interactive) that keeps every node — including the mounted Stripe Payment Element and wallet buttons — laid out and mounted. At 1024px and wider no section ever receives `aria-hidden` from the theme.
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

- `assets/checkout/checkout.css` — the single authoritative stylesheet for document shell, desktop two-column layout, card surfaces, and all continuous-flow presentation at every breakpoint.
- `assets/checkout/checkout-flow.css` — a narrowly-scoped, dependent stylesheet (enqueued after and declared dependent on `checkout.css`) that styles only the below-1024px Contact -> Shipping -> Payment wizard: the progress indicator and the inactive-step visual-hiding state. It is the one deliberate exception to "one stylesheet," kept separate so the wizard remains independently reviewable and rollback-safe without re-fragmenting `checkout.css`.
- `assets/checkout/checkout-boot.js`
- `assets/checkout/checkout-ui.js` — includes the wizard step-classification, validation, and progress/action-row rendering logic alongside the existing busy-state, error-focus, login-handoff, and payment-shell classification logic.
- `assets/checkout/checkout-express-entry.js`

The template attaches the desktop-only Express Checkout ordering rule to the authoritative `dtb-checkout-theme` style handle. It does not mutate provider DOM.

Obsolete layered desktop/mobile/refinement/contact/payment-proxy assets (`checkout-desktop-redesign.css`, `checkout-mobile-redesign.css`, `checkout-refinements.css`, `checkout-contact-identity.css`, `checkout-payment-runtime.js`, `checkout-payment-failure.js`, `checkout-login-handoff.js`) are intentionally not enqueued and should not be restored.

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
- no JavaScript errors, PHP notices, horizontal overflow, clipped provider content, or fixed-overlay collisions;
- below 1024px: the Payment Element and any wallet buttons stay mounted (no reinitialization, no flicker) when moving Contact -> Shipping -> Payment and back; step validation blocks advancing on invalid/incomplete native fields; crossing the 1024px breakpoint via resize or rotation cleanly mounts/tears down the wizard without a reload or a lost in-progress payment mount.

Real wallet acceptance requires a supported device/browser, registered payment-method domain, HTTPS, connected Stripe account, and production-equivalent WooCommerce shipping configuration.

## Database impact

The UI consolidation introduces no schema or data migration. Stripe Appearance cache/version metadata remains an existing bounded runtime option contract. Checkout, HPOS, Action Scheduler, event-ledger, order, and integration data are unchanged.

## Rollback

Rollback is file-based. Restore the previous checkout template, stylesheet, and theme scripts as one dependency-consistent set. If backend checkout modules are part of the same release, restore those files in the same rollback. Clear runtime caches and repeat native checkout smoke testing. No database rollback is required for the presentation consolidation.