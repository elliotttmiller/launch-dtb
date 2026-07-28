# Checkout UI Architecture and Reset Baseline

Last verified against active source: 2026-07-28.

## Current state

Drywall Toolbox checkout is a native WooCommerce Checkout Block document inside the headless storefront architecture. The custom DTB checkout presentation stack was removed on 2026-07-28 so the redesign below started from one observable baseline instead of competing CSS and JavaScript layers.

A single mobile-first presentation layer (handle `dtb-checkout`) shipped on top of that baseline the same day, then was extended into an in-page step wizard (Contact / Shipping / Payment) the following day with no document navigation. It is intentionally additive over the same, unmodified WooCommerce Checkout Block DOM:

- one stylesheet (`assets/checkout/checkout.css`) restyling native WooCommerce Checkout Block markup and Payment Plugins for Stripe container chrome only, by their published stable class names;
- one script (`assets/checkout/checkout.js`) that, on mobile viewports only, presents the checkout's real top-level block groups as three screens (Contact, Shipping, Payment) by toggling visibility (`display: none` + `inert`) on the exact groups WooCommerce core itself renders. Groups are classified by **DOM position**, not by an enumerated list of block names: `.wc-block-components-checkout-step` is WooCommerce Blocks' one stable, version-resilient public class applied to every top-level step wrapper, and Woo always renders Contact first and Payment last with zero or more shipping steps in between — see `classifyStepGroups()` and the "v4" note below for why an earlier, `data-block-name`-based version of this file never actually hid anything on this store. It builds its own progress rail and a sticky Back/Continue bar; it never creates, clones, duplicates, or moves a native field, and never fabricates a second submit control — the final step reveals Woo's own native "Place order" button. Step advancement is gated by the platform's own HTML5 constraint validation on the fields inside the step being left, plus the documented public `wc/store/cart`, `wc/store/checkout`, and `wc/store/validation` data stores (WooCommerce Blocks' third-party extensibility surface) for shipping/tax recalculation state and Woo-reported field errors — no private/internal object graph is read. At non-mobile widths the wizard chrome is not mounted at all and every group stays visible (the plain single-scroll layout);
- a branded top bar added to `native-checkout.php`, using the actual site logo (`/logos/drywall-logo-white.webp` with a `/logos/drywall-logo-white.png` fallback), linked to the storefront home;
- a Stripe Elements Appearance API integration (`mu-plugins/dtb-commerce/Payment/StripeElementAppearance.php`) applying brand tokens to the Universal Payment Method's Payment Element via the officially documented `wc_stripe_get_element_options` filter, the only supported way to style content inside the Stripe iframe. It preserves the merchant's own UPM theme/layout admin selection and adds variables/rules on top rather than replacing it.

WooCommerce and Payment Plugins for Stripe still load their own required styles and scripts through `wp_head()` and `wp_footer()`; DTB's stylesheet/script enqueue after them (priority 30) and only on the primary checkout surface (never order-pay/order-received).

Unlike an earlier (removed) checkout presentation stack that solved the mockup's step-1 field grouping by cloning proxy `first_name`/`last_name`/`phone` inputs and two-way-syncing them into the native ones, first/last name and an optional phone now reach the Contact step through WooCommerce's own **Additional Checkout Fields API** (`woocommerce_register_additional_checkout_field()`, stable since WooCommerce 8.9, see `mu-plugins/dtb-commerce/Validation/CheckoutFieldPolicy.php`) — real, Woo-rendered, Woo-validated, Woo-persisted fields (`dtb/first_name`, `dtb/last_name`, `dtb/phone`) at the `contact` location, not a client-side clone. The native `first_name`/`last_name` inputs are hidden from the shipping/billing address forms via `woocommerce_get_country_locale` (the filter WooCommerce Blocks itself reads for address-field hidden/required state), and a one-directional, non-destructive sync (`woocommerce_set_additional_field_value` + a durable re-check on `woocommerce_store_api_checkout_order_processed`) copies a non-empty Contact value onto the canonical billing/shipping name — never overwriting a wallet-supplied value with a blank one.

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

## Required one-time admin action

WooCommerce's Checkout block has its own editor-configurable "Address Fields" setting (shared across the Contact/Shipping/Billing inner blocks) that can show a Phone field on the address step in addition to the one now collected on Contact. This is page-content configuration (a block attribute on the Checkout page), not something a code change can set — an admin must open the Checkout page in the block editor, select the Checkout Fields block, and turn off "Phone" under Address Fields, so phone is collected exactly once. Nothing breaks if this step is skipped — the Contact-step `dtb/phone` field is independent and optional either way — but the customer would otherwise be asked for a phone number twice.

## Redesign v1 — mobile pass (2026-07-28), v2 — in-page wizard (2026-07-29), v3 — Contact identity fields (2026-07-29)

Scope was deliberately mobile-first only, per entry criterion 1-6 above; neither pass claims entry criteria 7-8 (guest/authenticated cart continuity sign-off, rendered desktop/mobile QA) — those require a live WooCommerce + Payment Plugins for Stripe environment with a connected Stripe test account and were not run in this change. Before production sign-off, run the full validation matrix above against staging, specifically:

- 320–428px widths across the step rail, sticky action bar, card sections, and Payment Element tabs;
- click through Contact → Shipping → Payment and Back again with a guest cart, a variable product, a coupon applied mid-flow, and an authenticated account with a saved address — confirm no field ever loses its value across a step transition (it never should, since nothing is unmounted, only hidden) and that going back does not clear or re-validate a step's contents;
- confirm the Continue button on the Shipping screen stays disabled (with an "Updating…" message) while `wc/store/checkout`'s `isCalculating` or `wc/store/cart`'s rate-loading selectors report busy, and that it does not falsely block once shipping is calculated;
- confirm the Payment screen shows Woo's own native "Place order" button and no duplicate submit control, and that 3DS/SCA, saved cards, Apple Pay, Google Pay, Link, and each enabled BNPL method still complete correctly;
- UPM theme/layout admin setting still applies (this pass preserves `stripe_upm`'s own `theme` option and layers brand variables/rules on top rather than replacing it);
- collapsible order summary toggle (native Woo Blocks behavior) still opens/closes correctly and stays visible across all three wizard steps;
- resize/rotate mid-session between mobile and desktop widths — the wizard chrome must unmount and every field must become visible again with no field left `inert`;
- no console errors from `checkout.js`'s `MutationObserver`/`wp.data.subscribe` on a WooCommerce Blocks version different from the one this pass targeted — the script no-ops safely if its expected `data-block-name` groups or store keys aren't found;
- **v3 specifically**: confirm `dtb/first_name`/`dtb/last_name`/`dtb/phone` render on the Contact step and the native name inputs no longer render on the Shipping/Billing address forms; confirm a *typed/card* checkout cannot advance past Contact with an empty first or last name (client-side gate) and that the resulting order's billing/shipping first/last name match what was typed; **critically**, confirm an **Apple Pay / Google Pay / Link** checkout still completes successfully end-to-end without ever visiting the Contact step's name inputs, and that the resulting order's name comes from the wallet, unmodified — this is the exact failure mode `CheckoutFieldPolicy.php`'s required-field design avoids, and it must be verified on a real device/wallet, not assumed from code review;
- confirm the one-time admin action above (Address Fields → Phone off) has been applied, or accept that phone will be asked twice until it is.

Rollback for these passes (independent of the full reset rollback above): remove the `dtb_enqueue_native_checkout_assets()` block from the theme's `functions.php`, delete `assets/checkout/checkout.css` and `assets/checkout/checkout.js`, revert `templates/checkout/native-checkout.php` to the neutral shell, remove `mu-plugins/dtb-commerce/Payment/StripeElementAppearance.php` plus its `require_once` in `dtb-commerce/bootstrap.php`, and revert `mu-plugins/dtb-commerce/Validation/CheckoutFieldPolicy.php` to its pre-v3 state (optional-phone filters only, no Additional Checkout Fields, no locale hiding, no sync hooks). No schema or order data is touched by any of this; historical orders keep whatever `dtb/first_name`/`dtb/last_name`/`dtb/phone` metadata they already have.

## Redesign v4 — wizard classification fix and real logo (2026-07-29)

v2 shipped with the wizard step classification keyed on `data-block-name` selectors (`[data-block-name="woocommerce/checkout-contact-information-block"]`, etc.). Those attributes are present in the block **editor's** own markup but are not emitted in this store's actual frontend HTML — so `stepGroups()` returned an empty array for every step, `applyVisibility()` had nothing to hide, and the page rendered as a plain single-scroll form with the wizard chrome (rail, Back/Continue bar) either not appearing to be doing anything or layering on top of an otherwise-unmodified checkout. This exact failure mode was already hit and fixed once before in this repository's history (commit `320b536` / PR #44, on the checkout stack that predated the 2026-07-28 reset) — that fix is what v4 re-applies here: classify the checkout's real top-level step wrappers by **DOM position** against `.wc-block-components-checkout-step` (Woo Blocks' one stable, version-resilient public class for every step wrapper, editor or frontend) — first such wrapper is Contact, last is Payment, any others in between are Shipping, and non-step trailing siblings (order notes, terms, actions row) are grouped with whichever step precedes them in document order. `classifyStepGroups()` in `checkout.js` is now the single source of truth for this; `stepGroups()` and `allTrackedGroups()` both delegate to it. `init()` was also hardened to retry (up to ~10s) if the checkout root isn't in the DOM yet on `DOMContentLoaded`, instead of permanently giving up, as defense in depth against a slow/deferred render on a given page load.

The branded top bar's wordmark was plain text ("Dry**Wall**") instead of the store's actual logo. It now renders `/logos/drywall-logo-white.webp` (`.png` fallback via `<picture>`, confirmed present at `drywalltoolbox/logos/drywall-logo-white.{webp,png}` and its deployed copy), linked to the storefront home via `dtb_detect_storefront_base_path()` (falls back to the site root if that helper isn't available).

Validate before sign-off: on an actual mobile browser (not just code review), confirm the page visibly presents as three distinct screens with only one screen's fields visible/focusable at a time, the progress rail's Contact/Shipping/Payment markers update correctly as you move through it, and the top bar shows the real Drywall Toolbox logo image, not text.
