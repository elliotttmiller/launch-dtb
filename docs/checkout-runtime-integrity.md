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
  -> DTB_WooNativeCheckoutRuntime disables the SPA override
  -> WordPress executes the assigned WooCommerce Checkout page
  -> WooCommerce Checkout Block boots with its native dependency graph
  -> official WooCommerce Stripe runtime boots
  -> DTB presentation observes the rendered checkout DOM
  -> DTB progressive presentation enhancement activates only when required checkout surfaces exist
```

DTB presentation JavaScript is intentionally isolated from `wc-blocks-checkout`. It must not declare Woo Checkout Block as a script dependency merely to wait for rendering. Presentation code must use DOM/runtime readiness observation and fail open when Woo does not mount.

## Source-level invariants

The owning checkout modules now register the production-safe behavior directly:

- `DTB_OfficialStripeNativeCheckout::enqueue_checkout_assets()` registers DTB presentation scripts with normal footer execution and no `wc-blocks-checkout` dependency.
- `DTB_MobilePaymentSheet::enqueue_assets()` registers the DTB payment-sheet presentation script with normal footer execution and no custom `async`/`defer` strategy.
- `WooNativeCheckoutPage.php` registers profile refinement JavaScript with normal footer execution and no custom strategy.
- `DTB_CheckoutPerformance` is diagnostics/telemetry only. It no longer registers checkout queue suppression, speculative prewarm/preload hooks, noncritical asset dequeue policy, or custom script strategy.

These source-level rules are authoritative. Runtime cleanup is not the normal operating mechanism.

## Prohibited checkout optimizations

On the authoritative checkout surface DTB must not:

- add `async` or `defer` execution strategy to Woo/WordPress/Stripe checkout dependencies;
- create dependency coupling that can propagate script strategy into Woo's critical graph;
- dequeue or reorder checkout scripts/styles for speculative performance gains;
- preload implementation JavaScript that changes or races native runtime behavior;
- replace Woo Checkout Block state, fields, totals, payment controls, or submission behavior.

Reliability and provider correctness take precedence over speculative checkout bootstrap optimization.

## Defensive integrity boundary

`Payment/CheckoutRuntimeIntegrity.php` remains loaded after the owning checkout modules as a last-line invariant against future regressions.

It inspects only these DTB-owned handles:

```text
dtb-woo-native-checkout-steps
dtb-woo-native-checkout-ui
dtb-woo-native-checkout-profile-refinements
dtb-woo-native-checkout-payment-sheet
dtb-woo-native-checkout-performance
```

The guard is expected to be a no-op during normal operation. If a future change reintroduces execution-strategy metadata on a DTB-owned checkout script, it removes that metadata. If `dtb-woo-native-checkout-ui` is accidentally coupled back to `wc-blocks-checkout`, it removes that dependency edge. It never mutates registered WooCommerce, WordPress, Stripe, payment-provider, or third-party handles.

## Performance policy

`DTB_CheckoutPerformance` may record bounded, redacted runtime diagnostics and expose non-secret runtime-integrity metadata. It must not mutate the checkout asset queue or prewarm/preload implementation assets.

Any future checkout optimization must prove that it cannot alter Woo/WordPress/Stripe dependency registration, execution order, package initialization, hydration, or payment-provider behavior.

## Deployment and rollback

Checkout runtime-integrity changes are deployed only with the scoped `dtb-commerce` files involved in the change. Do not replace unrelated MU-plugin modules during a checkout-only deployment.

After deployment:

1. clear SiteGround dynamic/static caches as applicable;
2. clear PHP OPcache;
3. hard-refresh the browser;
4. verify zero fatal console errors from `wc-cart-checkout-vendors`, `wc-blocks-checkout`, `wc-checkout-block-frontend`, `wp-components`, `wp-data`, and `wp-element`;
5. verify Checkout Block renders before evaluating DTB styling or Stripe payment behavior;
6. smoke-test guest/authenticated checkout, shipping recalculation, Stripe card/Link/wallet eligibility, 3DS/SCA, successful order creation, and downstream DTB lifecycle dispatch.

Rollback for this cleanup is scoped to the changed `dtb-commerce` checkout files. Do not roll back unrelated platform/catalog modules or the database for a presentation/runtime-only checkout incident.
