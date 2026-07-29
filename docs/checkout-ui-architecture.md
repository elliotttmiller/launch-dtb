# Checkout UI Architecture and Reset Baseline

Last verified against active source: 2026-07-28.

## Current state

Drywall Toolbox checkout is a native WooCommerce Checkout Block document inside the headless storefront architecture. The custom DTB checkout presentation stack was removed on 2026-07-28 so the redesign below started from one observable baseline instead of competing CSS and JavaScript layers.

A single mobile-first presentation layer (handle `dtb-checkout`) shipped on top of that baseline the same day, then was extended into an in-page step wizard (Contact / Shipping / Payment) the following day with no document navigation. It is intentionally additive over the same, unmodified WooCommerce Checkout Block DOM:

- one stylesheet (`assets/checkout/checkout.css`) restyling native WooCommerce Checkout Block markup and Payment Plugins for Stripe container chrome only, by their published stable class names;
- one script (`assets/checkout/checkout.js`) that, on mobile viewports only, presents the checkout's real block groups as three screens (Contact, Shipping, Payment) by toggling visibility (`display: none` + `inert`) on the exact groups WooCommerce core itself renders. Groups are classified by WooCommerce Blocks' own **semantic CSS classes** (`.wc-block-checkout__contact-fields`, `.wc-block-checkout__shipping-fields`, `.wc-block-checkout__payment-method`, etc. — see `classifyStepGroups()` and the "v5" note below for the two earlier, broken approaches this replaced: a dead `data-block-name` selector list, then a DOM-position/ordinal heuristic that assumed a container-nesting shape this store's markup didn't have). It builds its own progress rail and a sticky Back/Continue bar; it never creates, clones, duplicates, or moves a native field, and never fabricates a second submit control — the final step reveals Woo's own native "Place order" button, and the wizard chrome only ever mounts once classification confirms it actually found real Contact and Payment content. Step advancement is gated by the platform's own HTML5 constraint validation on the fields inside the step being left, plus the documented public `wc/store/cart`, `wc/store/checkout`, and `wc/store/validation` data stores (WooCommerce Blocks' third-party extensibility surface) for shipping/tax recalculation state and Woo-reported field errors — no private/internal object graph is read. At non-mobile widths the wizard chrome is not mounted at all and every group stays visible (the plain single-scroll layout);
- one script (`assets/checkout/checkout-order-summary.js`) that appends SKU to each order summary line item's name via the documented Cart/Checkout Blocks `itemName` filter — see "v5" below;
- a branded top bar added to `native-checkout.php`, using the site's global SVG logo (`/logo-white.svg` — kept as SVG, not a raster fallback, since it's the one logo asset used site-wide and SVG stays crisp at any size/DPI), linked to the storefront home;
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

The branded top bar's wordmark was plain text ("Dry**Wall**") instead of the store's actual logo. It briefly went through a raster (`drywall-logo-white.png`/`.webp`) asset before settling back on `/logo-white.svg` — the same global logo used elsewhere in the storefront — per an explicit decision to keep the logo as SVG for its scalability/customizability rather than switch to a raster format. It renders as a single `<img>`, linked to the storefront home via `dtb_detect_storefront_base_path()` (falls back to the site root if that helper isn't available).

Validate before sign-off: on an actual mobile browser (not just code review), confirm the page visibly presents as three distinct screens with only one screen's fields visible/focusable at a time, the progress rail's Contact/Shipping/Payment markers update correctly as you move through it, and the top bar shows the real Drywall Toolbox logo image, not text.

## Redesign v5 — grouping fix #2, order summary layout, item SKU (2026-07-29)

v4's DOM-position classification (first/last `.wc-block-components-checkout-step` under a shared "main" container) still did not reliably separate Shipping from Payment on this store's actual rendered markup — Shipping and Payment content stayed visible together while the action bar's label stayed stuck on "Continue to shipping" no matter how far the customer scrolled. The DOM-position approach's load-bearing assumption — that every step wrapper is a direct child of one common container element found via `.wc-block-components-main, .wc-block-checkout__main` — did not hold; a payment gateway or layout variation can add nesting that breaks pure ordinal/child-position logic.

`classifyStepGroups()` in `checkout.js` no longer depends on container/child-position at all. It matches WooCommerce Blocks' own semantic, purpose-built CSS classes (`.wc-block-checkout__contact-fields`, `.wc-block-checkout__shipping-fields`, `.wc-block-checkout__billing-fields`, `.wc-block-checkout__shipping-method`, `.wc-block-checkout__pickup-options`, `.wc-block-checkout__payment-method`, `.wc-block-checkout__add-note`, `.wc-block-checkout__terms`, `.wc-block-checkout__actions`, `.wc-block-components-express-payment`) anywhere inside the checkout root, each independently verified against the currently-shipping WooCommerce core `assets/client/blocks/checkout.css`, and walks up to each match's nearest `.wc-block-components-checkout-step` ancestor (or uses the matched node directly for express payment / notes / terms / actions, which have no such wrapper) to decide what to hide. This no longer assumes anything about container nesting depth. `reconcile()` also now refuses to mount the wizard chrome at all unless classification finds real Contact **and** Payment content — if a future markup change breaks these selectors too, the page fails safe to the plain single-scroll checkout instead of showing broken/inert wizard chrome over an unhidden page.

Order summary line items were restyled to match a captured, previously-live reference (`checkout.css` at commit `a7ba122`, predating the 2026-07-28 reset): the item row is a 3-column grid (image / name+SKU / price, `64px minmax(0,1fr) auto`) instead of leaving the product thumbnail at WooCommerce's small 48px default, and `.wc-block-components-product-metadata__description` (the item's short/full description) is hidden — the summary now shows only name, quantity (WooCommerce's own badge, unmodified, already absolutely positioned over the image corner by core CSS), and price. A new script, `assets/checkout/checkout-order-summary.js`, appends SKU to the item name via the officially documented Cart/Checkout Blocks `itemName` filter (`window.wc.blocksCheckout.registerCheckoutFilters`) — WooCommerce Blocks does not render SKU in the order summary by default, and this is the documented, non-DOM-touching way to supply it; it no-ops if the filter registry isn't available.

Validate before sign-off: click through all three steps on an actual mobile browser and confirm exactly one step's content is visible at a time with the action bar's label changing correctly at each step (not stuck on one label); confirm the order summary shows a properly sized image, name, SKU, quantity badge, and price with no description text; if classification ever fails again, confirm the page falls back to the plain single-scroll checkout rather than a half-broken wizard.

## Redesign v6 — wizard-blocking bug, header/rail split, heading overlap (2026-07-29)

**Continue was permanently blocked with no visibly invalid field.** `canAdvanceFrom()` additionally checked `wp.data.select('wc/store/validation').hasValidationErrors()` before allowing a step transition. That selector is **global across the entire checkout form**, not scoped to the step being left — so as soon as the Shipping step's required-but-empty address fields existed anywhere in the DOM (which is immediately, since all steps are mounted simultaneously and only visually hidden), it returned `true` and blocked Continue on Contact forever, surfacing "Review the highlighted fields before continuing." with nothing actually highlighted. Removed; the existing HTML5 `checkValidity()` check, already scoped to only the fields in the step being left, is sufficient and is the only remaining gate besides the Contact-specific name check and the Shipping cart-busy/rate-readiness check. `goToStep()` also now clears any leftover status message on every transition (including Back and rail-click, which don't go through `canAdvanceFrom()`), so a stale error from an earlier blocked attempt can no longer persist onto later, unrelated steps.

**Top bar redesigned to logo + Stripe badge only.** The step rail (1/2/3) previously shared the dark top bar's background immediately below it with no visual separation, reading as one oversized header. The rail (`.dtb-checkout__steps`) now has its own light surface, a bottom border, tighter padding, and is not `position: sticky` — it reads as page content under a compact header, not more header. The top bar's content itself is now exactly `[logo, far left] … [lock icon + official Stripe wordmark image, far right]`; the separate "Secure checkout" text label was removed since the lock icon now sits directly against the Stripe wordmark. The Stripe wordmark renders from `/logos/powered_by_stripe.svg`, matching the pattern already used for the site logo.

**"Contact information" heading visually overlapped by hidden text.** This theme ships no base stylesheet (`style.css` is only the required theme-identification header comment, headless/React-first) — it never defined the standard WordPress `.screen-reader-text` visually-hidden treatment. WooCommerce Blocks' own compiled JS uses exactly that class name (confirmed by grepping the currently-shipping `checkout.js`) for an accessible label rendered alongside the visible step heading; without the hiding CSS, that text rendered on-screen, overlapping "Contact information". Added the standard WordPress core implementation of `.screen-reader-text` (clip + `clip-path: inset(50%)` + `position: absolute !important`). This is a second, distinct `!important` beyond the one already documented for the accordion payment-method radius (entry criterion 4 above permits "a documented provider compatibility case" — this one is a platform/accessibility requirement instead, so it's called out explicitly here rather than silently read as fitting that clause).

Also fixed: the Contact step's Phone field showed "Phone (optional) (optional)" — WooCommerce automatically appends "(optional)" to any non-required Additional Checkout Field's label, and the field was separately registered with "(optional)" already baked into its own label text. Relabeled to plain "Phone".

The order summary block was explicitly out of scope for this pass and was not touched.

Validate before sign-off: complete Contact with only an email (no name) and confirm Continue advances with no false "Review the highlighted fields" block; confirm the top bar is compact (logo + Stripe badge only, no stepper) and the step rail renders as a separate light band below it; confirm "Contact information" (and every other step heading) renders as a single, non-overlapping line of text; confirm Phone reads "Phone (optional)" once, not twice.
