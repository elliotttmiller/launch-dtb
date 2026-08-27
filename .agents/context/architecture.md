---
status: derived
owner: repository-governance
scope: architecture-summary
source_paths:
  - AGENTS.md
  - drywalltoolbox/wp/wp-content/mu-plugins/00-dtb-loader.php
review_triggers:
  - ownership-change
  - composition-change
  - checkout-contract-change
  - integration-contract-change
---
# DTB Architecture Context

Canonical authority chain:

```text
React Storefront
  -> WordPress/WooCommerce
  -> DTB MU Plugins
  -> Action Scheduler
  -> Veeqo / QuickBooks / notifications / marketplaces
```

WooCommerce owns commerce/cart/checkout/orders/payments/refunds; DTB MU Plugins own backend domain policy/events/queues/integrations; Veeqo owns inventory/allocation/fulfillment/shipping/tracking; QuickBooks owns accounting projection; payment providers own sensitive payment collection/authentication/tokenization/provider UI.

Approved storefront order path:

```text
Store API cart/session
  -> full-document checkout handoff
  -> native WooCommerce Checkout Block
  -> provider-owned payment lifecycle
  -> WooCommerce order/payment state
  -> DTB event ledger
  -> dtb-orders queue
  -> downstream projections
```

The React `/checkout` route is a handoff/compatibility surface, not an independent payment application. This file is derived; verify mutable composition and provider details in active source.
