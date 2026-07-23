# Checkout Runtime Integrity Boundary

Last updated: 2026-07-23.

## Authority

WooCommerce Checkout Block and the official WooCommerce Stripe Payment Gateway own the complete checkout/payment JavaScript dependency graph, execution order, package globals, payment surfaces, and provider runtime.

DTB must not modify the execution semantics of `wc-*`, `wp-*`, Stripe, payment-provider, or other third-party checkout scripts.

## Runtime contract

The native checkout path is:

```text
React Store API cart
  -> full-document /checkout/ navigation
  -> DTB_WooNativeCheckoutRuntime disables the SPA override at `wp`
  -> DTB_WooNativeCheckoutRuntime reasserts the exception at `wp_enqueue_scripts` priority 0
  -> headless theme React enqueue/asset-strip callbacks are absent for checkout
  -> WordPress executes the assigned WooCommerce Checkout page
  -> WooCommerce Checkout Block boots with its native dependency graph
  -> official WooCommerce Stripe runtime boots
  -> DTB presentation observes the rendered checkout DOM
  -> desktop remains continuous two-column checkout
  -> mobile applies presentation-only Contact/Shipping/Payment steps
```

DTB presentation JavaScript is intentionally isolated from `wc-blocks-checkout`. It must not declare Woo Checkout Block as a script dependency merely to wait for rendering. Presentation code must use DOM/runtime readiness observation and fail open when Woo does not mount.

There is one mounted Checkout Block and one official Stripe payment surface across desktop and mobile. DTB must not clone, reparent, remount, or duplicate provider-owned payment controls to implement responsive UX.

## Source-level invariants

The owning checkout modules register the production-safe behavior directly:

- `DTB_WooNativeCheckoutRuntime::prepare_runtime()` removes the React SPA enqueue, non-React asset stripper, and forced React template for native checkout at both the `wp` and enqueue boundaries.
- `DTB_OfficialStripeNativeCheckout::enqueue_checkout_assets()` registers DTB presentation scripts with normal footer execution and no `wc-blocks-checkout` dependency.
- `woo-native-checkout-steps.js` owns only mechanical boot/reveal behavior.
- `woo-native-checkout-ui.js` owns presentation-only mobile step state, progress navigation, Continue actions, responsive cleanup, and validation-focus recovery.
- `woo-native-checkout.css` is the single authoritative DTB checkout presentation stylesheet.
- `DTB_CheckoutPerformance` is diagnostics/telemetry only. It does not register checkout queue suppression, speculative runtime mutation, or custom script strategy.

The retired payment-sheet and downstream profile-refinement assets are not part of the runtime and must not be restored as parallel checkout layers.

These source-level rules are authoritative. Runtime cleanup is not the normal operating mechanism.

## Hosting/cache optimizer boundary

The checkout transaction surface must not be transformed by a hosting optimization layer in a way that changes registered JavaScript order or Stripe.js origin.

`Payment/CheckoutRuntimeIntegrity.php` uses SiteGround Speed Optimizer exclusion filters to protect the checkout graph from async/defer, combine, and minify transformations, keeps Stripe.js on `js.stripe.com`, and excludes `/checkout/*` from page caching. The exclusions preserve dependency order registered by WordPress/WooCommerce; they do not add, reorder, or replace Woo dependencies.

Protected classes include critical `wp-*` package globals, Woo Blocks checkout packages, Woo checkout vendor/runtime bundles, official Stripe checkout integration handles, and DTB presentation/diagnostic handles.

After checkout deployment, SiteGround generated optimizer caches and PHP OPcache must be cleared so stale generated assets cannot mix dependency metadata or JavaScript generations.

## Prohibited checkout optimizations

On the authoritative checkout surface DTB must not:

- add `async` or `defer` execution strategy to Woo/WordPress/Stripe checkout dependencies;
- create dependency coupling that can propagate script strategy into Woo's critical graph;
- dequeue or reorder checkout scripts/styles for speculative performance gains;
- preload implementation JavaScript that changes or races native runtime behavior;
- replace Woo Checkout Block state, fields, totals, payment controls, or submission behavior;
- create a mobile-specific payment modal, duplicate Payment Element, or second provider runtime.

Reliability and provider correctness take precedence over speculative checkout bootstrap optimization.

## Defensive integrity boundary

`Payment/CheckoutRuntimeIntegrity.php` remains loaded after the owning checkout modules as a last-line invariant against future regressions and hosting-layer transformations.

For DTB-owned scripts it verifies these handles:

```text
dtb-woo-native-checkout-steps
dtb-woo-native-checkout-ui
dtb-woo-native-checkout-performance
```

The guard is expected to be a no-op during normal WordPress registration. If a future change reintroduces execution-strategy metadata on a DTB-owned checkout script, it removes that metadata. If `dtb-woo-native-checkout-ui` is accidentally coupled back to `wc-blocks-checkout`, it removes that dependency edge. It never rewrites registered WooCommerce, WordPress, Stripe, payment-provider, or third-party dependencies.

## Performance policy

`DTB_CheckoutPerformance` may record bounded, redacted runtime diagnostics and expose non-secret runtime-integrity metadata. It must not mutate the checkout asset queue or create a second payment implementation.

On enhanced mobile checkout, provider readiness timeout monitoring begins when the inline Payment step is active. Desktop monitoring remains active for the continuous payment surface.

Any future checkout optimization must prove that it cannot alter Woo/WordPress/Stripe dependency registration, execution order, package initialization, hydration, or payment-provider behavior.

## Deployment and rollback

Checkout runtime-integrity changes are deployed only with the scoped `dtb-commerce` files involved in the change. Do not replace unrelated MU-plugin modules during a checkout-only deployment.

After deployment:

1. clear SiteGround dynamic/static caches as applicable;
2. clear PHP OPcache;
3. hard-refresh the browser or use a clean private session;
4. verify zero fatal console errors from `wc-cart-checkout-vendors`, `wc-blocks-checkout`, `wc-checkout-block-frontend`, `wp-components`, `wp-data`, and `wp-element`;
5. verify Checkout Block renders before evaluating DTB styling or Stripe payment behavior;
6. verify mobile Contact -> Shipping -> Payment with no duplicated controls or payment surfaces;
7. smoke-test guest/authenticated checkout, shipping recalculation, Stripe card/Link/wallet eligibility, 3DS/SCA, successful order creation, and downstream DTB lifecycle dispatch.

Rollback is scoped to the changed `dtb-commerce` checkout files. Do not roll back unrelated platform/catalog modules or the database for a presentation/runtime-only checkout incident.
