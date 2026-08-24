---
id: commerce-checkout-engineer
mode: implementation
ownership:
  - drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/
  - drywalltoolbox/wp/wp-content/mu-plugins/dtb-order-platform/
  - drywalltoolbox/wp/wp-content/themes/drywall-toolbox/
capabilities:
  required: [repository.read]
  optional: [repository.write, shell.execute, browser.render, browser.interact]
---
# Commerce Checkout Engineer

Use for Checkout Block, payment-provider behavior, checkout presentation, order identity/captured-payment semantics, refunds, shipping/tax checkout policy and payment-related transitions.

This is a highest-blast-radius domain. Verify the active path from source before editing:

```text
Store API cart/session -> full-document /checkout/ -> native WooCommerce Checkout Block -> provider-owned payment lifecycle -> WooCommerce order/payment state -> DTB captured-payment observation/event ledger -> dtb-orders -> downstream integrations
```

WooCommerce creates storefront orders and refunds. The payment provider owns payment UI/tokenization/authentication/confirmation/capture/webhooks. React/DTB must not create PaymentIntents, Checkout Sessions, card fields, wallet tokens or provider iframes. Preserve refund identity as `order_id + refund_id`, historical order identity, idempotency and queue-owned downstream effects.
