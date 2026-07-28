# Checkout UI Architecture and Operating Contract

Last verified against active source: 2026-07-28.

## Purpose

Drywall Toolbox checkout is a native WooCommerce Checkout Block document inside the headless storefront architecture. This document defines its authority, responsive presentation, accessibility, payment, recovery, and operational contracts after migration to Payment Plugins for Stripe WooCommerce.

## Authority boundary

WooCommerce owns:

- cart/customer session state;
- canonical contact, billing, and shipping fields;
- address validation/persistence;
- shipping packages, rates, selected methods, tax, discounts, and totals;
- Checkout Block validation, order creation, refunds, and authoritative order/payment status.

Payment Plugins for Stripe WooCommerce (`woo-stripe-payment`) owns:

- Stripe card fields and Stripe Elements;
- Apple Pay and Google Pay eligibility/rendering;
- Link and Stripe-supported BNPL methods when enabled;
- payment-method selection state and provider iframe contents;
- tokenization, confirmation, capture, authentication, challenge/redirect flows, cancellation, and Stripe webhook synchronization.

A separately installed PayPal provider owns PayPal only. PayPal is not supplied by the Stripe plugin and must never be represented by synthetic DTB markup.

DTB owns:

- native-checkout routing/runtime exception inside the headless theme;
- the checkout document shell and bounded responsive presentation;
- supported Stripe Elements appearance configuration through provider hooks;
- local non-secret readiness, diagnostics, and telemetry;
- checkout contract tagging, captured-payment gating, retry recovery, event ledger, and downstream queue eligibility.

DTB does not own provider wallet/address/shipping request internals. The retired provider-specific Store API header/nonce normalization and package-cache shims are removed rather than guessed for the replacement provider.

The theme must not create duplicate fields, clone/reparent payment surfaces, read or mutate cross-origin provider iframes, create payment objects, confirm payments, or implement another order route.

## Canonical flow

```text
React Store API cart
  -> native /checkout/ document
  -> WooCommerce Checkout Block
  -> canonical contact/address/shipping state
  -> server-authoritative shipping/tax/discounts/totals
  -> Payment Plugins for Stripe payment or express wallet
  -> WooCommerce order/payment lifecycle
  -> DTB verified provider metadata and captured-payment gate
  -> DTB event ledger and downstream queues
  -> storefront order tracking return
```

## Responsive design contract

### Desktop, 1024px and wider

- One continuous single-page checkout; no desktop step-state controller.
- Two-column grid: fluid form column plus bounded 360–420px order-summary/payment rail.
- Express Checkout appears first in the main form column using CSS ordering only; provider controls remain in canonical WooCommerce/provider DOM ownership.
- Contact contains first name, last name, email, and optional phone.
- Shipping contains address fields and server-authoritative shipping methods.
- The right rail contains order summary, provider-owned payment methods, terms, and the single native Place Order action.
- No trust/confidence sidebar or panel.
- Header contains the DTB logo on the left and provider-backed Powered by Stripe status on the right.
- Cards use one border, restrained radius, low elevation, compact spacing, and no internal scroll trap or artificial minimum height.
- Controls use at least 52px targets, visible focus, and no forced canonical field reordering.

### Tablet/mobile, below 1024px

The single mounted Checkout Block is presented as three steps:

1. **Contact** — order-summary disclosure, Express Checkout, first name, last name, email, optional phone.
2. **Shipping** — shipping address and shipping methods.
3. **Payment** — card and enabled Stripe-supported alternative/BNPL methods, terms, and the native Place Order action.

The wizard is presentation-only:

- top-level WooCommerce sections are grouped by structural position;
- no proxy fields, duplicate forms, mirrored customer state, or duplicate payment state;
- provider surfaces remain mounted in the DOM while inactive steps are visually collapsed using the existing non-`display:none` technique;
- completed steps may be revisited; forward movement uses inline Continue controls;
- Contact/Shipping Continue runs browser validation on native WooCommerce controls only;
- Shipping advancement waits for WooCommerce shipping/tax calculation and a selected method;
- the Payment step uses the native provider selection and native Place Order control;
- no fixed action overlay covers provider content;
- address fields collapse fluidly, mobile inputs use at least 16px text, safe areas are respected, and touch targets are at least 44px;
- crossing the 1024px breakpoint mounts/tears down presentation state without reloading or replacing checkout/payment state.

## Express Checkout contract

- Provider-owned Apple Pay and Google Pay are the approved Stripe express methods.
- Link is excluded from the approved express collection. It may be enabled inside the card element only when explicitly approved.
- Apple Pay and Google Pay must be configured in the provider's **Express Checkout** payment section and removed from its ordinary **Checkout** payment section to prevent duplicate wallet rows.
- Express controls use a responsive two-column grid. An odd provider-owned final control may span both columns, which permits a separately installed real PayPal provider to occupy the full-width second row.
- DTB never creates fake Apple Pay, Google Pay, PayPal, Link, or BNPL controls.
- Product-page Express Checkout remains one serialized Store API cart mutation followed by native checkout navigation. The short-lived handoff marker changes presentation only.

## Payment-method card contract

- Native WooCommerce/provider radio inputs remain focusable, labeled, keyboard-operable, and authoritative.
- CSS may visually suppress the circular radio affordance and present the entire provider row as a rounded touch card.
- Selected state must remain synchronized exclusively with the native input and provider/WooCommerce state.
- DTB must not synthesize hidden payment state, invoke private gateway methods, or move provider iframe contents.
- Card/BNPL availability, copy, logos, eligibility, redirects, authorization, capture, and refunds remain provider-owned.
- PayPal requires a separate provider and must not introduce another card authority.

## Accessibility contract

- Preserve native labels, descriptions, autofill semantics, saved-address behavior, validation, and payment-control semantics.
- No theme-owned `inert`; no payment surface is unmounted or `display:none` while navigating mobile steps.
- Below 1024px, `aria-hidden` reflects inactive top-level step presentation; desktop receives no step markers.
- Busy state is exposed through `aria-busy` on Checkout Block.
- New native error notices receive bounded programmatic focus without content replacement.
- Visible focus, reduced-motion, forced-colors, keyboard-only flow, screen-reader announcements, safe areas, and minimum touch targets are explicit.
- Visually hidden native payment inputs must use an accessible clipping technique, not `display:none` or `visibility:hidden`.

## Security and payment integrity

- Checkout fields, shipping, tax, totals, order creation, and refunds remain WooCommerce authoritative.
- Provider selection, card/wallet/BNPL UI, payment confirmation, 3DS/SCA, redirects, and webhooks remain provider authoritative.
- New Stripe-backed paid orders require `payment-plugins-stripe-v1`, verified provider `payment_plugins_stripe`, WooCommerce `date_paid`, and a non-secret transaction/payment reference.
- Historical `woo-stripe-v1` / `woocommerce_stripe` evidence remains valid for pre-migration orders.
- Product Buy Now is single-flight and performs one authoritative Store API add-to-cart before navigation.
- No client shipping amount, tax, total, allowed-country list, or paid state is authoritative.
- Payment failure recovery is limited to unpaid DTB checkout drafts that have not crossed downstream processing boundaries.
- Checkout runtime telemetry is bounded/redacted and never receives form values, addresses, emails, phone numbers, payment payloads, keys, secrets, or client secrets.

## Presentation assets

Authoritative theme assets:

- `assets/checkout/checkout.css` — document shell, desktop grid, cards, fields, shipping, payment wrappers, order summary, responsive behavior;
- `assets/checkout/checkout-flow.css` — below-1024px wizard progress/action/inactive-step presentation only;
- `assets/checkout/checkout-boot.js`;
- `assets/checkout/checkout-ui.js` — read-only classification, accessibility, login handoff, busy/error state, and mobile wizard;
- `assets/checkout/checkout-express-entry.js` — bounded express-handoff focus/scroll behavior only;
- `templates/checkout/native-checkout.php` — document/header and provider-compatible presentation rules.

Provider internals remain in the regular plugin and are not copied, forked, or patched in this repository.

## Validation matrix

Validate at minimum:

- desktop: 1024, 1280, 1440, 1920px;
- mobile/tablet: 320, 360, 390, 430, 768px;
- iPhone/macOS Safari and Android/desktop Chrome;
- guest/authenticated checkout, autofill, saved addresses, saved cards;
- simple/variable products and quantities greater than one;
- coupons, free/paid/no-rate shipping, address changes, tax/total recalculation;
- card success/decline, 3DS/SCA success/failure/cancel/retry, redirects, reload/network recovery;
- Apple Pay and Google Pay eligibility, cancellation, address/rate changes, and retry;
- every enabled Stripe BNPL method and optional PayPal only through its separate provider;
- successful order, provider gateway ID, Stripe reference, webhook state, new DTB contract/provider metadata, captured-payment gate, event ledger, queues, Veeqo, QuickBooks, notifications, and return URL;
- full and multiple partial refunds with concrete refund identity;
- historical order/refund readability;
- no duplicate fields, wallets, payment rows, attempts, orders, notices, or downstream side effects;
- no JS errors, PHP notices, horizontal overflow, clipped provider content, or fixed-overlay collisions;
- mobile movement Contact -> Shipping -> Payment and back without provider remount/state loss;
- breakpoint crossing without reload/state loss.

Real payment acceptance requires a connected Stripe account, valid webhooks, supported browser/device, HTTPS, payment-method/domain eligibility, production-equivalent shipping/tax configuration, and operator testing.

## Database impact and rollback

The UI/provider adapter introduces no DTB schema or destructive data migration. Historical payment evidence is preserved. Provider-managed saved customer/payment/subscription compatibility remains a cutover acceptance requirement.

Rollback is dependency-consistent: deactivate the replacement provider, restore the prior plugin/configuration and prior DTB/theme files, clear caches, and repeat checkout/payment/webhook/downstream validation. Do not delete or rewrite orders created during a failed cutover.
