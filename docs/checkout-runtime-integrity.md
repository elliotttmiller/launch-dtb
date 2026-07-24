# Checkout Runtime Integrity Boundary

Last updated: 2026-07-24.

## Authority

WooCommerce Checkout Block and the official WooCommerce Stripe Payment Gateway own the complete checkout/payment JavaScript dependency graph, execution order, package globals, payment surfaces, and provider runtime.

DTB must not modify the execution semantics of `wc-*`, `wp-*`, Stripe, payment-provider, or other third-party checkout scripts.

Checkout presentation is owned by the active `drywall-toolbox` theme. MU plugins own the native-runtime exception, security/runtime integrity, Stripe integration policy, field policy, lifecycle observation, and diagnostics.

## Runtime contract

```text
React Store API cart
  -> full-document /checkout/ navigation
  -> DTB_WooNativeCheckoutRuntime disables SPA ownership at `wp`
  -> runtime adapter reasserts the exception at `wp_enqueue_scripts` priority 0
  -> React enqueue/asset-strip/template callbacks are absent for checkout
  -> active theme templates/checkout/native-checkout.php hosts the document
  -> assigned WooCommerce Checkout page renders through the_content()
  -> WooCommerce Checkout Block boots with its native dependency graph
  -> official WooCommerce Stripe runtime boots
  -> theme presentation observes/enhances the rendered checkout DOM
  -> desktop remains continuous checkout
  -> mobile applies presentation-only Contact/Shipping/Payment steps
```

Theme presentation JavaScript is intentionally isolated from `wc-blocks-checkout`. It does not declare Woo Checkout Block as a dependency merely to wait for rendering. It observes DOM/runtime readiness and fails open when Woo does not mount.

There is one mounted Checkout Block and one official Stripe payment surface across desktop/mobile. Theme presentation must not clone, reparent, remount, or duplicate provider-owned payment controls.

## Source-level invariants

- `DTB_WooNativeCheckoutRuntime::prepare_runtime()` removes React SPA enqueue, non-React asset stripping, and forced React template behavior for native checkout.
- `DTB_WooNativeCheckoutRuntime::template_include()` resolves `templates/checkout/native-checkout.php` from the active theme and fails open to Woo/WordPress's resolved template if unavailable.
- `themes/drywall-toolbox/templates/checkout/native-checkout.php` owns checkout document presentation and theme asset enqueue.
- `themes/drywall-toolbox/assets/checkout/checkout.css` owns the existing DTB checkout visual system.
- `checkout-refinements.css` owns final same-origin Woo wrapper normalization only.
- `checkout-flow.css` owns mobile progress/navigation and provider-safe inactive mounting.
- `checkout-boot.js` owns mechanical reveal only.
- `checkout-ui.js` owns presentation-only mobile state/navigation, contact-field mirroring, duplicate-summary containment, and single-gateway presentation markers.
- `DTB_OfficialStripeNativeCheckout` owns supported Stripe Appearance configuration/readiness/lifecycle policy and no presentation assets.
- `DTB_CheckoutFieldPolicy` owns field registration/persistence policy and no presentation assets.
- `DTB_CheckoutPerformance` remains diagnostics/telemetry only.

Retired competing presentation assets must remain absent:

```text
dtb-commerce/assets/woo-native-checkout.css
dtb-commerce/assets/woo-native-checkout-refinements.css
dtb-commerce/assets/woo-native-checkout-ui.js
dtb-commerce/assets/woo-native-checkout-steps.js
dtb-commerce/Templates/WooNativeCheckoutPage.php

themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.js
themes/drywall-toolbox/assets/checkout/checkout-payment-sheet.css
```

Runtime cleanup is not the normal operating mechanism; source ownership is explicit.

## Hosting/cache optimizer boundary

The checkout transaction surface must not be transformed by hosting optimization in a way that changes registered JavaScript order or Stripe.js origin.

`Payment/CheckoutRuntimeIntegrity.php` uses SiteGround Speed Optimizer exclusion filters to protect checkout from async/defer, combine, and minify transformations, keeps Stripe.js on `js.stripe.com`, and excludes `/checkout/*` from public page caching. The exclusions preserve dependency order registered by WordPress/WooCommerce; they do not add/reorder/replace Woo dependencies.

Protected classes include critical `wp-*` globals, Woo Blocks checkout packages, Woo checkout vendor/runtime bundles, official Stripe integration handles, active theme presentation handles, and the DTB telemetry handle.

After checkout deployment, SiteGround generated optimizer caches and PHP OPcache should be cleared so stale assets cannot mix generations.

## Prohibited checkout optimizations

DTB must not:

- add `async`/`defer` execution strategy to Woo/WordPress/Stripe checkout dependencies;
- create dependency coupling that propagates strategy into Woo's critical graph;
- dequeue/reorder checkout scripts/styles for speculative performance gains;
- preload implementation JavaScript that races native runtime behavior;
- replace Woo Checkout Block state, fields, totals, payment controls, or submission behavior;
- create a mobile payment modal/sheet, duplicate Payment Element, or second provider runtime;
- clone or reparent provider-controlled payment/Express nodes.

Reliability and provider correctness take precedence over speculative bootstrap optimization.

## Defensive integrity boundary

`Payment/CheckoutRuntimeIntegrity.php` remains a last-line invariant against future regressions and hosting-layer transformations.

Current DTB-owned script handles protected from execution-strategy mutation:

```text
dtb-checkout-theme-boot
dtb-checkout-theme-ui
dtb-checkout-theme-profile
dtb-woo-native-checkout-performance
```

Retired `dtb-woo-native-checkout-ui` / `dtb-woo-native-checkout-steps` presentation handles are not part of the current runtime.

The guard never rewrites registered WooCommerce, WordPress, Stripe, payment-provider, or third-party dependencies.

## Provider mounting policy

The official Stripe runtime may initialize before the customer reaches mobile Payment.

Theme presentation must keep provider-sensitive inactive payment/Express surfaces inside Woo's React tree and measurable enough for initialization. The current mobile flow uses offscreen inactive mounting for those provider-sensitive sections rather than cloning, reparenting, or constructing a second payment surface.

## Performance policy

`DTB_CheckoutPerformance` may record bounded/redacted diagnostics and expose non-secret runtime-integrity metadata. It must not mutate commerce state or create fallback payment behavior.

On enhanced mobile checkout, provider readiness timeout monitoring begins when the inline Payment step is active. Desktop monitoring remains active for the continuous payment surface.

## Deployment and rollback

Checkout changes may span both:

```text
drywalltoolbox/wp/wp-content/themes/drywall-toolbox/
drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/
```

Deploy exact changed files and delete explicitly retired presentation artifacts. Do not replace unrelated modules or runtime-owned WordPress state.

After deployment:

1. clear SiteGround dynamic/static caches as applicable;
2. clear PHP OPcache;
3. hard-refresh or use a clean private session;
4. verify zero fatal console errors from Woo/WordPress/Stripe runtime packages;
5. verify Checkout Block renders before evaluating theme styling;
6. verify desktop continuous checkout and mobile Contact -> Shipping -> Payment;
7. verify there is no payment sheet/modal and exactly one payment surface;
8. verify guest/authenticated checkout, shipping recalculation, Stripe card/Link/wallet eligibility, 3DS/SCA, successful order creation, and downstream DTB lifecycle dispatch.

Rollback should restore the changed theme/MU checkout files as one compatible set. Do not roll back unrelated platform/catalog modules or the database for a presentation/runtime-only incident.
