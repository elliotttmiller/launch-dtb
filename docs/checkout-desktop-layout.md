# Desktop Checkout Layout Contract

Last updated: 2026-08-03.

## Scope

This document defines the desktop presentation contract for the native WooCommerce Checkout Block at `/checkout/`. It is subordinate to `docs/checkout-ui-architecture.md` and does not change checkout, payment, order, shipping, tax, or integration authority.

## Authority

WooCommerce owns cart/session state, checkout fields, validation, addresses, shipping, tax, totals, order creation, and order status. Payment Plugins for Stripe WooCommerce owns payment-method rendering, provider iframes, tokenization, authentication, confirmation, capture, redirects, and webhooks.

The active Drywall Toolbox theme owns only document presentation. The desktop layout must not clone, move, reparent, hide, replace, or fabricate native checkout fields, payment controls, wallet controls, order-summary data, or the Place Order action.

## Active files

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout.css
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/assets/checkout/checkout-desktop.css
```

`checkout.css` remains the shared mobile-first visual layer. `checkout-desktop.css` is a narrowly scoped additive layer loaded after it through the `dtb-checkout-desktop` handle.

## Desktop contract

At viewport widths of 1024px and wider:

- the checkout uses a centered fluid canvas rather than the mobile 640px ceiling;
- the native `.wc-block-checkout__main` region occupies the flexible left track;
- the native `.wc-block-checkout__sidebar` region occupies a bounded 380–480px right track;
- the order-summary rail is sticky beneath the branded header;
- all native checkout steps remain in DOM order and visible in one continuous page;
- mobile wizard chrome remains disabled;
- no provider iframe descendant is styled or inspected;
- order summary, fields, shipping methods, payment methods, terms, and Place Order remain WooCommerce/provider-owned controls.

## Root cause corrected

The prior desktop rule applied a grid only to `.wc-block-checkout__form`. The live WooCommerce Blocks structure renders `.wc-block-checkout__main` and `.wc-block-checkout__sidebar` under `.wc-block-components-sidebar-layout`, so the grid was applied to a wrapper that did not own both columns. The main checkout sections consequently retained mobile/tablet widths and appeared as disconnected cards with large unused page areas.

The hardened layout applies the two-column grid only to a wrapper that demonstrably contains the main and sidebar regions as direct children. The primary supported wrapper is `.wc-block-components-sidebar-layout`; older direct-child form/block wrapper shapes are covered without applying grids to every nested checkout wrapper.

## Asset loading and cache behavior

`native-checkout.php` enqueues `checkout-desktop.css` before `wp_head()` with:

- handle: `dtb-checkout-desktop`;
- dependency: `dtb-checkout`;
- version: the desktop stylesheet's `filemtime()`, falling back to `DTB_VERSION` only when the source file is unavailable.

This guarantees deterministic cascade order and prevents SiteGround/browser caches from retaining a previous desktop layout after the file changes.

## Breakpoints

- `< 768px`: mobile Contact → Shipping → Payment wizard remains authoritative.
- `768–1023px`: shared single-column checkout remains unchanged.
- `1024–1439px`: two-column desktop layout with a fluid 380–460px summary rail.
- `1440–1799px`: 460px summary rail.
- `>= 1800px`: canvas expands to 1480px with a 480px summary rail.

## Validation requirements

Before production acceptance, verify at 1024, 1280, 1440, 1600, 1920, and 2560px:

1. Main form and order summary render side by side with no horizontal overflow.
2. Contact, shipping address, shipping options, payment options, order notes, terms, and Place Order remain in the left flow.
3. Order summary remains in the right rail and does not overlap the header or footer.
4. Long product names, SKUs, carrier names, addresses, coupons, and validation messages wrap without clipping.
5. Sidebar scrolling does not trap the page or hide the final total.
6. Guest and authenticated checkout preserve cart/session state.
7. Card, saved card, 3DS/SCA, Apple Pay, Google Pay, Link, and enabled BNPL methods remain functional.
8. No duplicate controls, duplicate orders, console errors, PHP notices, or provider remount loops occur.
9. Resizing across 1024px does not leave mobile wizard groups hidden or inert.
10. 768–1023px and mobile layouts remain visually unchanged.

## Database and integration impact

No schema, option, order, customer, HPOS, Action Scheduler, event-ledger, Veeqo, QuickBooks, or payment-provider data migration is introduced. The change is presentation-only.

## Deployment

Deploy the template and desktop stylesheet as one dependency-consistent set. Clear SiteGround dynamic cache, file cache, CDN cache if enabled, and browser cache. Do not transfer WordPress core, regular plugins, uploads, cache directories, logs, runtime secrets, or server configuration.

## Rollback

Restore the previous `native-checkout.php` and remove `checkout-desktop.css` from the deployed theme as one operation. Clear all applicable caches and re-run desktop and mobile checkout smoke tests. Do not modify or delete orders created during a failed visual cutover.
