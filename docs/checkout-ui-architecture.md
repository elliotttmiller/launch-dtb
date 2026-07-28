# Checkout UI Architecture and Reset Baseline

Last verified against active source: 2026-07-28.

## Current state

Drywall Toolbox checkout is a native WooCommerce Checkout Block document inside the headless storefront architecture. The custom DTB checkout presentation stack was removed on 2026-07-28 so the next desktop/mobile redesign starts from one observable baseline instead of competing CSS and JavaScript layers.

The current theme shell intentionally has:

- no DTB checkout stylesheet;
- no DTB inline CSS;
- no DTB checkout loader or branded header treatment;
- no DTB mobile wizard;
- no DTB express-payment focus/scroll controller;
- no DTB DOM classification or presentation classes;
- no duplicate fields, payment controls, or order-submission controls.

WooCommerce and Payment Plugins for Stripe still load their own required styles and scripts through `wp_head()` and `wp_footer()`.

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
