# Desktop Checkout Layout Contract

Last updated: 2026-08-03.

## Scope

This document defines the desktop presentation contract for the native WooCommerce Checkout Block at `/checkout/`. It applies only at viewport widths of 1024px and wider. The existing mobile and tablet checkout presentation remains unchanged.

## Authority

WooCommerce owns cart/session state, checkout fields, validation, addresses, shipping, tax, totals, order creation, and order status. Payment Plugins for Stripe WooCommerce owns Express Checkout, payment-method rendering, provider iframes, tokenization, authentication, confirmation, capture, redirects, and webhooks.

The active Drywall Toolbox theme owns presentation only. It must not clone, move, reparent, hide, replace, fabricate, or manually remount native checkout fields, payment controls, wallet controls, order-summary data, or the Place Order action.

## Active files

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.css
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.js
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-desktop.css
```

`checkout.css` and `checkout.js` remain authoritative for the current mobile checkout. They are not modified by the desktop redesign. `checkout-desktop.css` is the only desktop redesign file and every rule in it is contained within a `min-width: 1024px` media query.

## Desktop architecture

At viewport widths of 1024px and wider:

- `.wc-block-components-sidebar-layout` is the sole two-column layout authority;
- the native main checkout region occupies the flexible left track;
- the native order-summary region occupies a bounded 390–480px right track;
- the order summary remains sticky beneath the branded header;
- the left region remains one vertical document flow;
- native DOM order is preserved;
- Express Checkout remains provider-owned and renders wherever the native Checkout Block/provider configuration places it;
- no CSS `order`, DOM reparenting, cloning, mutation observer, or provider remounting is used;
- no `:has()` selector is used to discover or infer layout ownership;
- no second grid is applied to the form or main checkout region;
- no provider iframe contents are inspected or styled.

## Root cause and correction

The previous implementation created multiple competing layout authorities. A grid was applied to inferred wrappers while the WooCommerce main region retained its own flex/grid behavior. Additional descendant resets and CSS ordering then attempted to compensate for the resulting card mosaic.

The corrected design removes that inference and compensation chain. The published WooCommerce sidebar-layout component is the only desktop grid. The main region is a normal block flow, and only known top-level Checkout Block regions receive width, spacing, and sticky-summary presentation rules.

## Mobile preservation contract

The following behavior must remain unchanged below 1024px:

- mobile Contact → Shipping → Payment wizard;
- progress rail;
- Back/Continue action bar;
- mobile checkout cards and field styling;
- mobile payment presentation;
- mobile header sizing and spacing;
- tablet single-column checkout behavior;
- mobile visibility, inert-state, validation, and navigation logic.

No desktop change is accepted if it alters these behaviors.

## Asset loading and cache behavior

`native-checkout.php` already enqueues `checkout-desktop.css` before `wp_head()` with:

- handle: `dtb-checkout-desktop`;
- dependency: `dtb-checkout`;
- version: the desktop stylesheet's `filemtime()`, falling back to `DTB_VERSION` when unavailable.

This preserves deterministic cascade order and cache invalidation without modifying the mobile asset contract.

## Breakpoints

- `< 768px`: existing mobile wizard remains authoritative.
- `768–1023px`: existing single-column tablet checkout remains unchanged.
- `1024–1439px`: two-column desktop layout with a fluid 390–460px summary rail.
- `1440–1799px`: 460px summary rail.
- `>= 1800px`: 1480px canvas with a 480px summary rail.

## Validation requirements

Before production acceptance, verify at 375, 430, 768, 1024, 1280, 1440, 1600, 1920, and 2560px:

1. Mobile and tablet views are visually and behaviorally unchanged.
2. Desktop main form and order summary render side by side without horizontal overflow.
3. Contact, shipping address, shipping options, payment options, notes, terms, and Place Order remain in one left-column flow.
4. Express Checkout remains mounted, clickable, and provider-controlled when eligible.
5. Order summary remains in the right rail and does not overlap the header or footer.
6. Long product names, SKUs, carrier names, addresses, coupons, and validation messages wrap without clipping.
7. Sidebar scrolling does not trap the page or hide the final total.
8. Guest and authenticated checkout preserve cart/session state.
9. Card, saved card, 3DS/SCA, Apple Pay, Google Pay, Link, and enabled BNPL methods remain functional.
10. No duplicate controls, duplicate payment attempts, duplicate orders, console errors, PHP notices, or provider remount loops occur.
11. Resizing across 1024px does not leave mobile wizard groups hidden or inert.

## Database and integration impact

None. No schema, option, order, customer, HPOS, Action Scheduler, event-ledger, Veeqo, QuickBooks, or payment-provider data migration is introduced.

## Deployment

Transfer only the reviewed desktop stylesheet for this change:

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-desktop.css
```

Do not overwrite WordPress core, `wp-config.php`, regular plugins, uploads, caches, logs, runtime secrets, or server-owned state. Clear SiteGround dynamic cache, file cache, CDN cache if enabled, and browser cache after transfer.

## Rollback

Restore the previously deployed `checkout-desktop.css`, clear all applicable caches, and repeat desktop and mobile checkout smoke testing. Do not modify or delete orders created during a failed visual cutover.
