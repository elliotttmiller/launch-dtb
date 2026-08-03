# Checkout UI Architecture

Last verified against active source: 2026-08-03.

## Decision

Drywall Toolbox uses the native WooCommerce Checkout Block as the only checkout application. The active theme owns the document shell, design tokens and component appearance only. It does not recreate, classify, reorder, hide, clone or replace WooCommerce or payment-provider nodes.

This architecture supersedes the historical mobile wizard and desktop patch styles.

## Authority

WooCommerce owns:

- Store API cart and customer session state;
- checkout fields and address state;
- validation and error discovery;
- shipping, tax, coupons and totals;
- Checkout Block responsive layout;
- order creation and authoritative order status.

Payment Plugins for Stripe owns:

- Express Checkout and wallet eligibility;
- card, saved-card and BNPL surfaces;
- Stripe Elements and provider iframes;
- tokenization, SCA/3DS, confirmation, capture, redirects and webhooks.

DTB owns:

- native checkout routing;
- the checkout document shell and branded header;
- theme design tokens;
- component-level appearance outside provider iframes;
- Stripe Appearance API configuration;
- documented WooCommerce extension filters;
- checkout contract tagging, captured-payment gating, event ledger and downstream queue eligibility.

## Canonical flow

```text
React Store API cart
  -> full-document /checkout/
  -> DTB native checkout document shell
  -> Checkout page post content
  -> WooCommerce Checkout Block
  -> Payment Plugins for Stripe
  -> WooCommerce order/payment lifecycle
  -> DTB captured-payment gate and downstream queues
```

## Active theme contract

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/
├── theme.json
├── templates/checkout/native-checkout.php
├── template-parts/checkout/header.php
└── assets/checkout/
    ├── checkout.css
    ├── checkout.js
    └── checkout-order-summary.js
```

### `theme.json`

The authoritative DTB design system for WordPress-rendered surfaces. It owns palette, typography, spacing, layout widths, borders and base element styles.

### `native-checkout.php`

A minimal classic-theme document shell required by the headless routing architecture. It renders:

1. `wp_head()`;
2. the checkout header template part;
3. `the_content()` so the configured Checkout page remains the source of the Checkout Block tree;
4. `wp_footer()`.

It must not enqueue an independent layout patch, inspect Checkout Block markup or create checkout controls.

### `template-parts/checkout/header.php`

Owns the DTB logo and security/provider branding only. It contains no checkout state or payment logic.

### `checkout.css`

A single component-theme stylesheet. It may style documented/public component classes, accessibility primitives and the DTB document shell. It must not:

- assign WooCommerce internal grid tracks;
- depend on private descendant ancestry;
- use DOM discovery through `:has()` to identify layout owners;
- reorder provider or checkout surfaces;
- hide checkout steps;
- replace provider iframe styling;
- introduce a second desktop or mobile layout authority.

### `checkout.js`

The former DOM-classification wizard is retired. The file is currently a no-op compatibility stub because the registered handle may be referenced externally. Remove the enqueue and file together only after production acceptance confirms no dependency on the handle.

### `checkout-order-summary.js`

May use the documented Cart/Checkout Blocks filter registry. It must not mutate rendered DOM nodes directly.

## Express Checkout

Express Checkout remains provider-owned and renders wherever WooCommerce and Payment Plugins for Stripe place it in the configured Checkout Block tree. DTB does not force placement with CSS order or DOM movement.

The required product design is that Express Checkout appears before the standard contact/payment flow when the provider renders it. This must be configured through the Checkout page block structure or provider-supported settings. If the active plugin version does not expose a supported placement control, native placement takes precedence over an unsupported visual rearrangement.

Wallet buttons may not render when the browser, device, domain, currency, cart or Stripe account is ineligible. Absence of a wallet button is not automatically a theme defect.

## Checkout page configuration

The WordPress Checkout page must contain the native WooCommerce Checkout Block and no legacy shortcode checkout. The block editor configuration is operational state and must be captured during deployment acceptance.

Required operator verification:

- Checkout page is assigned under WooCommerce settings;
- Checkout Block is present in post content;
- Express Checkout is enabled in the payment plugin where supported;
- address-field settings do not duplicate DTB additional fields;
- no third-party page builder wraps or replaces the Checkout Block.

## Supported extension points

Use only the owning platform API:

- additional customer fields: WooCommerce Additional Checkout Fields API;
- checkout display filters: `window.wc.blocksCheckout.registerCheckoutFilters`;
- custom checkout content: registered Checkout inner blocks;
- payment methods and Express Checkout: provider/WooCommerce payment registration APIs;
- checkout state: Store API and documented `wc/store/*` data stores;
- Stripe iframe appearance: Stripe Appearance API through the provider-supported PHP filter.

## Removed architecture

The following behavior is obsolete and must not be restored:

- mobile Contact/Shipping/Payment DOM-classification wizard;
- `data-dtb-step-hidden` and `inert` step management;
- custom Back/Continue checkout navigation;
- desktop `checkout-desktop.css` patch layer;
- broad width, flex, float and grid resets against Checkout Block descendants;
- CSS ordering of Express Checkout or payment-provider surfaces;
- proxy/duplicated checkout fields;
- cloned payment or order controls.

## Validation matrix

Before production acceptance validate:

- widths: 320, 390, 768, 1024, 1280, 1440, 1920 and 2560px;
- guest and authenticated checkout;
- simple and variable products;
- quantity changes, coupons, shipping and tax recalculation;
- browser autofill and saved addresses;
- validation errors and focus discovery;
- card, saved card, 3DS/SCA, Apple Pay, Google Pay, Link and each enabled BNPL method;
- Express Checkout eligibility and fallback to standard checkout;
- no duplicate fields, controls, attempts, orders, notices or downstream events;
- no console errors, PHP notices, horizontal overflow, clipped provider content or fixed-overlay collisions.

Real payment acceptance requires HTTPS, an eligible domain/device, connected Stripe account, valid webhooks and production-equivalent shipping/tax configuration.

## Database impact

The theme architecture has no schema or data migration. Checkout page block content is existing WordPress content and is not automatically rewritten by this repository change.

## Deployment

GitHub remains the implementation source of truth. Production transfer is operator-managed through FileZilla. Transfer only the reviewed dependency-consistent theme files. Do not overwrite WordPress core, `wp-config.php`, regular plugins, uploads, cache, logs, runtime secrets or server-owned state.

## Rollback

Restore the previous theme files as one set:

- `theme.json` state;
- `templates/checkout/native-checkout.php`;
- `template-parts/checkout/header.php` presence/state;
- `assets/checkout/checkout.css`;
- `assets/checkout/checkout.js`;
- removed `assets/checkout/checkout-desktop.css` if reverting to the old architecture.

Clear SiteGround/application/CDN/browser caches and repeat checkout acceptance. Never delete or rewrite orders created during a failed visual deployment.
