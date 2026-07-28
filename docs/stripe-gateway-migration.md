# Stripe Gateway Migration: Official WooCommerce Stripe → Payment Plugins for Stripe WooCommerce

Status as of this document: **preparation only**. No production behavior has
changed. The official WooCommerce Stripe Payment Gateway remains the
authoritative, fully-wired payment provider for this store.

## What this PR actually did

This PR is **code preparation**, not a cutover. It cannot install, activate,
or configure a WordPress plugin, and it cannot change anything in your Stripe
account — none of that is possible from a git PR. The actual "WooCommerce
Stripe Payment Gateway" (and, eventually, "Payment Plugins for Stripe
WooCommerce") is a regular WordPress plugin installed live via wp-admin; it
is not vendored in this repository at all.

What the PR adds:

- `drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/StripeGatewayDetection.php` —
  a shared helper that detects which of the two supported Stripe plugins is
  actually active, by resolving the live gateway object's PHP class file and
  checking which plugin directory it physically lives in
  (`woocommerce-gateway-stripe` vs `woo-stripe-payment` — both are the real,
  verified wordpress.org plugin slugs). This does not depend on guessing
  either plugin's internal constants or hook names.
- Updated presentation/branding, order-lifecycle tagging, admin notices, and
  the `/wp-json/dtb/v1/checkout/capabilities` REST readiness endpoint to
  recognize **either** provider using that shared helper, so the storefront
  and admin UI keep working correctly regardless of which plugin is active.
- A defensive (non-breaking either way) addition to the asset-optimizer
  script-handle allowlist in `CheckoutRuntimeIntegrity.php`.

What this PR deliberately did **not** touch, and why:

- **`ExpressCheckoutAddressIntegrity.php` and `ExpressCheckoutShippingReadiness.php`**
  (Apple Pay/Google Pay wallet-address normalization and shipping-rate cache
  hardening) remain wired only to the official plugin's specific hooks
  (`wc_stripe_express_checkout_normalize_address`,
  `wc_stripe_payment_request_shipping_posted_values`, and a custom
  `X-WCStripe-Express-Checkout` header/nonce convention). I have **no
  verified equivalent hook names** for Payment Plugins for Stripe WooCommerce
  for either of these — they weren't documented on the pages reviewed for
  this migration, and the plugin isn't installed anywhere this work could
  inspect its actual source. These two files will simply no-op (do nothing,
  fail safely) once the new plugin is active; wallet payments will still work
  through the new plugin's own native handling, they just won't get this
  extra DTB-side hardening/diagnostics layer until someone writes it against
  the real hooks.
- **The Stripe Appearance API styling** (`wc_stripe_upe_params` filter,
  giving the Payment Element its branded radius/colors/shadows and the
  Accordion/Picker payment-method-list styling fixed earlier today) is
  wired only for the official plugin. Payment Plugins for Stripe WooCommerce
  has its own, separate customization system (a "Payment form" template
  editor in wp-admin, per
  https://paymentplugins.com/documentation/stripe/templates/ — **not**
  independently verified against real markup by this work). The Payment
  Element will render using the new plugin's own defaults/template
  configuration until someone wires an equivalent, verified integration.

## Facts used in this PR, and their confidence level

| Fact | Confidence |
|---|---|
| Plugin name "Payment Plugins for Stripe WooCommerce", publisher Payment Plugins | Verified (wordpress.org) |
| wordpress.org slug `woo-stripe-payment` | Verified (from the URL itself) |
| Explicit Checkout Block / Cart Block / Store API support exists | Verified (wordpress.org changelog quote re: Apple Pay Express Checkout element in blocks) |
| Supports Apple Pay, Google Pay, Klarna, Affirm, Cash App Pay, ACH, saved methods, subscriptions, webhooks | Verified (wordpress.org description) |
| Min WP 4.7+, PHP 7.4+, tested to WP 7.0.2 / WC 10.6 | Verified (wordpress.org) |
| Free plugin, no separate paid tier for core features | Verified (wordpress.org) — **confirm this still holds**, since some features referenced in paymentplugins.com's advanced-settings docs may be paid-tier only |
| Exact gateway ID(s) (e.g. `stripe_cc`) | **Not verified** — not listed on the pages fetched. Confirm on staging. |
| Appearance/Elements customization filter name (e.g. `wc_stripe_get_element_options`) | **Not verified** — recalled from general background knowledge only, not confirmed against this fetch or any source code. Confirm on staging before relying on it. |
| Express Checkout address/shipping hook names | **Unknown** — not covered by any source reviewed |
| Main plugin class name(s) for health-check `class_exists()` detection | **Unknown** |
| Changelog-mentioned hooks: `wc_stripe_show_admin_metaboxes`, `wc_stripe_show_pay_order_section`, `wc_stripe_order_cancelled_enabled`, `wc_stripe_capture_charge_failed`, `wc_stripe_is_link_active`, `wc_stripe_get_new_method_label`, `wc_stripe_get_saved_methods_label` | Verified (wordpress.org changelog) — real hooks, but their exact call signatures/timing weren't inspected |

**Do not treat anything marked "not verified" or "unknown" above as safe to
build further automation on until it's been confirmed against the plugin's
actual installed source.**

## Manual checklist (must be done outside this repository)

### 1. Staging first — do not touch production Stripe settings directly

- [ ] Provision a staging copy of the site (or use an existing staging
      environment) with its own Stripe **test-mode** API keys.
- [ ] Install "Payment Plugins for Stripe WooCommerce" from wordpress.org (or
      purchase/install the Pro version if advanced features from
      paymentplugins.com's advanced-settings docs are needed — confirm which
      tier covers what you actually need first).
- [ ] **Do not deactivate the official WooCommerce Stripe Payment Gateway
      yet.** The new plugin's own docs state the two cannot run
      simultaneously, so this is a hard cutover, not a gradual rollout — get
      everything below verified on staging before touching production.

### 2. Confirm the unverified facts above

- [ ] On staging, inspect the installed plugin's actual gateway ID(s) (wp-admin → WooCommerce → Settings → Payments, or by dumping `WC()->payment_gateways()->payment_gateways()`).
- [ ] Grep the installed plugin's source for `apply_filters` calls related to Elements/Appearance styling and confirm the real filter name and expected data shape.
- [ ] Grep the installed plugin's source for Express Checkout (Apple Pay/Google Pay) address-collection and shipping-rate hooks/filters.
- [ ] Confirm the plugin's main class name(s) for the health-check detection in `IntegrationHealthService.php`.
- [ ] Update `StripeGatewayDetection.php`, `OfficialStripeNativeCheckout.php`'s Appearance filter wiring, and (if pursuing the extra hardening) `ExpressCheckoutAddressIntegrity.php` / `ExpressCheckoutShippingReadiness.php` with the confirmed real names, in a follow-up PR, once known.

### 3. Data migration (before deactivating the old plugin)

- [ ] Run the new plugin's own documented data-migration tool
      (https://paymentplugins.com/documentation/stripe/data-migration/) to
      migrate Stripe Customer IDs, saved payment methods/tokens, and
      subscription recurring-payment associations from the official
      plugin's format to the new plugin's format.
- [ ] Confirm existing **orders placed under the official gateway** can still
      be refunded correctly once the new plugin is active (their
      `payment_method` order meta stays `stripe`/`stripe_*` forever — this
      codebase's order-tagging/lifecycle code now recognizes both, but the
      actual refund UI/API call depends on which plugin owns that order's
      gateway; verify this explicitly with a real refund on a staging test
      order).

### 4. Stripe Dashboard reconfiguration

- [ ] Add/update the webhook endpoint URL in the Stripe Dashboard for the
      new plugin (very likely a different URL path than the official
      plugin used) and confirm webhook delivery succeeds (200 response) for
      at least: `payment_intent.succeeded`, `charge.refunded`,
      `charge.failed`.
- [ ] Confirm live-mode API keys are entered correctly in the new plugin's
      settings before flipping test mode off.

### 5. End-to-end testing on staging (test-mode Stripe)

- [ ] Card payment, full checkout, desktop and mobile (including the
      Contact → Shipping → Payment wizard shipped earlier today).
- [ ] Apple Pay / Google Pay express checkout (needs a real supported device
      + registered payment-method domain — cannot be verified in an
      automated/headless environment).
- [ ] Any other enabled alternative methods (Klarna, Affirm, Cash App Pay,
      etc.).
- [ ] A subscription purchase and at least one simulated renewal, if this
      store sells subscriptions.
- [ ] Order lifecycle: order reaches `processing`/`completed` correctly, the
      DTB event ledger and downstream Veeqo/QuickBooks integrations fire as
      expected for an order placed through the new gateway.
- [ ] Visual QA of the Payment Element / payment-method list — it will not
      automatically pick up the branded Appearance API styling from this
      codebase (see above); style it via the new plugin's own template
      editor, or complete the follow-up integration once hooks are
      confirmed.
- [ ] A refund on a **new** order and, separately, on an **old** order
      (placed before cutover).

### 6. Cutover

- [ ] Only after everything above passes on staging: on production, run the
      data migration tool, deactivate the official WooCommerce Stripe
      Payment Gateway, activate and configure Payment Plugins for Stripe
      WooCommerce with live-mode keys, and re-verify the webhook endpoint in
      the live Stripe Dashboard.
- [ ] Monitor the first several live orders closely.

### 7. Rollback plan

- [ ] Keep the official WooCommerce Stripe Payment Gateway plugin installed
      (deactivated, not deleted) after cutover for at least one full
      billing/return cycle, so it can be reactivated quickly if a problem
      surfaces. Since this codebase's detection and order-tagging logic
      already recognizes both providers, reactivating the official plugin
      and deactivating the new one rolls checkout back to today's known-good
      behavior without further code changes.
