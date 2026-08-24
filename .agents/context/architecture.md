---
status: derived
owner: repository-governance
scope: architecture-summary
review_triggers:
  - ownership-change
  - composition-change
  - checkout-contract-change
  - integration-contract-change
---
# DTB Architecture Context

Canonical authority chain:

```text
React 19 Storefront
  -> WordPress/WooCommerce
  -> DTB MU Plugins
  -> Action Scheduler
  -> Veeqo / QuickBooks / notifications / marketplaces
```

System authorities:

- React: customer presentation, routing, local interaction state, API consumption.
- WooCommerce: commerce persistence, products/variations at runtime, cart/session, checkout, customers, orders, payments/refunds state, tax and shipping calculation.
- DTB MU Plugins: domain policy, authorization, event ledgers, queues, integrations, repairs, returns, schematics, media, operator workflows.
- Action Scheduler: asynchronous execution.
- Veeqo: inventory, allocation, fulfillment, shipping and tracking truth.
- QuickBooks: accounting projection.
- Active payment provider: payment collection, authentication, tokenization, wallet/provider UI and provider webhook semantics.

Approved order path:

```text
Store API cart/session
  -> full-document checkout handoff
  -> native WooCommerce Checkout Block
  -> provider-owned payment UI
  -> WooCommerce order/payment lifecycle
  -> DTB event ledger
  -> dtb-orders queue
  -> downstream projections
```

The React `/checkout` route is a handoff surface, not a payment application. This summary is derived; verify mutable provider and composition facts in source before acting.
