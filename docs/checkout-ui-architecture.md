# Checkout UI Architecture and Reset Baseline

Last verified against active source: 2026-07-28.

## Current state

Drywall Toolbox checkout is a native WooCommerce Checkout Block document inside the headless storefront architecture. The custom DTB checkout presentation stack was removed on 2026-07-28 so the redesign below started from one observable baseline instead of competing CSS and JavaScript layers.

A single mobile-first presentation layer (handle `dtb-checkout`) shipped on top of that baseline the same day. It is intentionally additive:

- one stylesheet (`assets/checkout/checkout.css`) restyling native WooCommerce Checkout Block markup and Payment Plugins for Stripe container chrome only, by their published stable class names;
- one small progressive-enhancement script (`assets/checkout/checkout.js`) that only toggles `data-state` on DTB's own step-rail markers via `IntersectionObserver`; it never queries, reads, clones, or moves a native field or control, and no-ops if the expected sections are absent;
- a branded top bar and a visual, non-interactive step rail (Contact / Shipping / Payment) added to `native-checkout.php`, styled by CSS counters — no editor/database change required, no fabricated "Continue" buttons, no alternate order route;
- a Stripe Elements Appearance API integration (`mu-plugins/dtb-commerce/Payment/StripeElementAppearance.php`) applying brand tokens to the Universal Payment Method's Payment Element via the officially documented `wc_stripe_get_element_options` filter, the only supported way to style content inside the Stripe iframe. It preserves the merchant's own UPM theme/layout admin selection and adds variables/rules on top rather than replacing it.

WooCommerce and Payment Plugins for Stripe still load their own required styles and scripts through `wp_head()` and `wp_footer()`; DTB's stylesheet/script enqueue after them (priority 30) and only on the primary checkout surface (never order-pay/order-received).

The DOM stays exactly what WooCommerce Checkout Block renders: one continuous scroll of native step sections (Contact information, Shipping address, Shipping options, Payment methods), not a JS-driven multi-step wizard — WooCommerce Blocks does not ship true client-side pagination between those sections, so none was fabricated. The numbered-step visual language from the mockup is applied to that real structure instead of a synthetic flow.

## Authority boundary

WooCommerce owns cart/customer session state, canonical contact and address fields, shipping, tax, discounts, totals, Checkout Block validation, order creation, refunds, and authoritative order/payment status.

Payment Plugins for Stripe WooCommerce (`woo-stripe-payment`) owns Stripe card fields, Apple Pay, Google Pay, Link and supported BNPL when enabled, Stripe Elements, tokenization, confirmation, capture, authentication, redirects, and webhook synchronization.

DTB owns:

- native-checkout routing and the React-theme exception;
- the neutral checkout document shell;
- supported provider configuration hooks;
- non-secret readiness, diagnostics, and telemetry;
- checkout contract tagging, captured-payment gating, retry recovery, event ledger, and downstream queue eligibility.

DTB does not own provider iframe contents, wallet/address/shipping internals, payment selection state, payment execution, or an alternative order route.

## Canonical flow

```text
React Store API cart
  -> full-document /checkout/
  -> neutral active-theme document
  -> WooCommerce Checkout Block
  -> Payment Plugins for Stripe
  -> WooCommerce order/payment lifecycle
  -> DTB captured-payment gate, event ledger, and downstream queues
```

## Active source

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php
```

The prior presentation assets are deleted and must not be restored:

```text
assets/checkout/checkout.css
assets/checkout/checkout-flow.css
assets/checkout/checkout-boot.js
assets/checkout/checkout-ui.js
assets/checkout/checkout-express-entry.js
assets/checkout/applepay.php
```

`dtb-commerce/Payment/CheckoutPerformance.php` and `dtb-commerce/assets/woo-native-checkout-performance.js` remain diagnostic/runtime-safety code, not a design layer. They must not apply CSS, replace Woo/provider state, or depend on deleted presentation handles.

## Redesign entry criteria

A future redesign must:

1. introduce one authoritative stylesheet layer with an explicit handle and dependency order;
2. begin from captured desktop and mobile WooCommerce baseline screenshots;
3. keep native fields and provider surfaces mounted and authoritative;
4. avoid `!important` escalation except for a documented provider compatibility case;
5. avoid selector duplication, overlapping breakpoint ownership, proxy fields, DOM reparenting, cloned controls, and iframe mutation;
6. preserve focus visibility, autofill, validation discovery, reduced motion, forced colors, safe areas, and touch targets;
7. validate guest and authenticated cart continuity before visual sign-off;
8. pass desktop and mobile rendered QA before deployment.

## Validation matrix

Before redesign work is accepted, validate:

- 320, 390, 768, 1024, 1440, and 1920px widths;
- guest and authenticated checkout;
- a browser that also carries a privileged wp-admin cookie;
- simple and variable products, quantity changes, coupons, shipping and tax recalculation;
- native contact/address fields, autofill, saved addresses, and validation errors;
- card, saved card, 3DS/SCA, Apple Pay, Google Pay, and each enabled BNPL method;
- no duplicate fields, wallets, payment rows, attempts, orders, notices, or downstream side effects;
- no relevant console errors, PHP notices, horizontal overflow, clipped provider content, or fixed-overlay collisions.

Real payment acceptance requires a connected Stripe account, valid webhooks, HTTPS, eligible devices/domains, production-equivalent shipping/tax configuration, and operator testing.

## Database impact and rollback

The presentation reset introduces no schema change or data migration. Rollback restores the prior theme template and all five deleted presentation assets as one dependency-consistent set, restores the prior MU-plugin runtime files, clears SiteGround caches, and reruns checkout/payment acceptance. Do not delete or rewrite orders created during a failed cutover.

## Redesign v1 — mobile pass (2026-07-28)

Scope was deliberately mobile-first only, per entry criterion 1-6 above; this pass does not claim entry criteria 7-8 (guest/authenticated cart continuity sign-off, rendered desktop/mobile QA) — those require a live WooCommerce + Payment Plugins for Stripe environment with a connected Stripe test account and were not run in this change. Before production sign-off, run the full validation matrix above against staging, specifically:

- 320–428px widths across the new step rail, card sections, and Payment Element tabs;
- UPM theme/layout admin setting still applies (this pass preserves `stripe_upm`'s own `theme` option and layers brand variables/rules on top rather than replacing it);
- express payment buttons (Apple Pay / Google Pay / Link), saved cards, and each enabled BNPL row render inside the new card styling without clipping;
- collapsible order summary toggle (native Woo Blocks behavior) still opens/closes correctly under the new styling;
- no console errors from `dtb-checkout.js`'s `IntersectionObserver` on a Woo Blocks markup version different from the one this pass targeted — the script no-ops safely if its selectors don't match.

Rollback for this pass alone (independent of the full reset rollback above): remove the `dtb_enqueue_native_checkout_assets()` block from the theme's `functions.php`, delete `assets/checkout/checkout.css` and `assets/checkout/checkout.js`, revert `templates/checkout/native-checkout.php` to the neutral shell, and remove `mu-plugins/dtb-commerce/Payment/StripeElementAppearance.php` plus its `require_once` in `dtb-commerce/bootstrap.php`. No schema or order data is touched by any of this.
