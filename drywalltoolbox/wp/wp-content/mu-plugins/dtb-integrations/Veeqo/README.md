# DTB Veeqo Integration

Veeqo owns sellable inventory, warehouse availability, allocation, fulfillment, shipment execution, carrier, and tracking. WooCommerce owns products, storefront orders, payments, refunds, and authoritative order status. DTB owns exact mapping, queued projections, lifecycle convergence, retry/recovery, repair linkage, customer tracking projections, and operator workflows.

## Canonical production tree

The production `Veeqo/` directory must exactly match this manifest. Deploy it as a complete replacement, not as an additive overlay.

```text
Veeqo/
├── Admin/
│   └── VeeqoAdminPage.php
├── Rest/
│   ├── VeeqoAdminController.php
│   └── VeeqoCompatibilityController.php
├── Services/
│   ├── VeeqoAdminReadModel.php
│   └── VeeqoOperationStore.php
├── assets/
│   ├── veeqo-admin.css
│   └── veeqo-admin.js
├── README.md
├── VeeqoClient.php
├── VeeqoConfig.php
├── VeeqoHealthCheck.php
├── VeeqoInventoryBoundary.php
├── VeeqoInventoryCoverageService.php
├── VeeqoInventoryProjectionServiceV3.php
├── VeeqoInventorySchedulePolicy.php
├── VeeqoInventoryService.php
├── VeeqoOrderProjectionContract.php
├── VeeqoOrderReconciliationService.php
├── VeeqoOrderStateProjector.php
├── VeeqoProductionConfiguration.php
├── VeeqoRuntimePolicy.php
├── VeeqoShippingService.php
└── VeeqoSyncJob.php
```

No `Infrastructure/` directory is part of the canonical module.

Cross-module synchronization adapters loaded by `dtb-integrations/bootstrap.php`:

```text
OperationalPipeline/VeeqoWebhookPipelineController.php
OperationalPipeline/VeeqoInboundProjectionOverride.php
WooCommerce/RepairVeeqoSyncOverride.php
```

## Composition and ownership

```text
VeeqoClient.php                         compatibility API/payload/log helpers
VeeqoConfig.php                         normalized configuration facade
VeeqoProductionConfiguration.php       resource discovery and readiness
VeeqoInventoryProjectionServiceV3.php  warehouse-scoped inventory projection
VeeqoInventorySchedulePolicy.php       recurring inventory trigger
VeeqoInventoryCoverageService.php      mapping and coverage diagnostics
VeeqoOrderProjectionContract.php       Woo order -> Veeqo order creation contract
VeeqoOrderReconciliationService.php    adaptive provider pull and recovery sweep
VeeqoOrderStateProjector.php            shared fulfillment/tracking convergence
VeeqoRuntimePolicy.php                 legacy runtime retirement policy
Services/VeeqoOperationStore.php       durable inventory operation state
Services/VeeqoAdminReadModel.php       batched operator projections
Rest/VeeqoAdminController.php          protected Control Center API
Rest/VeeqoCompatibilityController.php  bounded compatibility aliases
Admin/VeeqoAdminPage.php               wp-admin application shell
VeeqoInventoryBoundary.php             checkout-facing stock boundary
VeeqoShippingService.php               DTB shipping-policy adapter
VeeqoSyncJob.php                       synchronization timestamps/state
VeeqoHealthCheck.php                   redacted health diagnostics
```

`VeeqoClient.php` remains compatibility infrastructure because active request, payload, logging, repair, and shipping helpers depend on its functions. It does not own production admin routes, inventory scheduling, product-save mapping, settings UI, or automatic webhook registration. New fulfillment interpretation belongs in `VeeqoOrderStateProjector.php`.

## End-to-end order synchronization

The standard product-order path is:

```text
verified paid WooCommerce order
  -> dtb_order_sync_veeqo in Action Scheduler group dtb-orders
  -> VeeqoOrderProjectionContract creates/reuses the Veeqo order
  -> provider order ID is persisted on the Woo order
  -> dtb_order_refresh_veeqo_projection begins adaptive reconciliation
  -> VeeqoOrderStateProjector applies allocation/pick/pack/ship/delivery state
  -> DTB order event ledger + integration state + tracking projection
  -> bounded SSE stream notifies the React order-tracking page
```

Provider updates have two converging ingress paths:

```text
verified Veeqo webhook
  -> durable ingress record
  -> dtb_order_process_veeqo_webhook
  -> VeeqoInboundProjectionOverride
  -> VeeqoOrderStateProjector

adaptive/recovery pull
  -> GET /orders/{veeqo_order_id}
  -> VeeqoOrderReconciliationService
  -> VeeqoOrderStateProjector
```

Both paths use the same projector. A webhook and a later pull therefore produce the same WooCommerce status, DTB fulfillment substate, tracking metadata, integration state, and customer timeline.

### Fulfillment semantics

The projector enforces monotonic fulfillment progression and ignores older non-terminal provider states.

```text
Veeqo awaiting/allocated -> Woo processing + inventory_reserved
Veeqo picked             -> Woo processing + picked
Veeqo packed/ready       -> Woo processing + packed
Veeqo shipped            -> Woo processing + shipped
Veeqo delivered          -> Woo completed + delivered
Veeqo cancelled          -> Woo cancelled + exception
Veeqo refunded           -> Woo refunded + exception
```

`shipped` is not treated as `completed`; completion occurs only when Veeqo reports delivery. Tracking number, carrier, and estimated delivery are projected independently and do not erase existing values when a partial provider payload omits them.

A deterministic projection hash prevents unchanged pull responses from rewriting order metadata, duplicating ledger events, refreshing customer projections, or amplifying queue work.

## Adaptive reconciliation and recovery

`VeeqoOrderReconciliationService.php` starts after successful Veeqo order creation and uses the canonical `dtb-orders` queue.

Cadence:

```text
first 10 minutes: every 15 seconds
10 minutes–2 hours: every 60 seconds
after 2 hours: every 5 minutes
maximum active window: 14 days
```

Terminal provider states stop the per-order loop. A bounded recurring recovery sweep checks at most 50 stale active Woo orders per run and re-enqueues missing refresh work. Provider failures enter the existing bounded order retry/terminal-failure path rather than blocking checkout or interactive requests.

## Real-time customer streaming

Order and repair tracking use bounded Server-Sent Events rather than a permanently held PHP request:

```text
server stream window: 25 seconds
change check: 1.5 seconds
heartbeat: 10 seconds
browser reconnect hint: 3 seconds
snapshot polling fallback: 20 seconds
```

Order stream:

```text
GET /wp-json/dtb/v1/orders/{id}/events/stream
```

It emits revisioned `order.status_changed` and `order.terminal` events containing fulfillment state, tracking number, carrier, tracking URL, estimated delivery, and the customer timeline. The React hook immediately refreshes the authoritative order snapshot when an event arrives; low-frequency polling remains the recovery path.

Repair stream:

```text
GET /wp-json/dtb/v1/repairs/{id}/events/stream?token=...
```

It resumes from `Last-Event-ID`, emits `repair.update` and `repair.terminal`, preserves the original repair event type in the payload, and drives immediate repair-status refresh in React.

## Repair synchronization

`WooCommerce/RepairVeeqoSyncOverride.php` replaces the previous repair Veeqo stub.

```text
repair request
  -> linked WooCommerce order via _repair_wc_order_id
  -> dtb_repair_sync_veeqo
  -> canonical dtb_veeqo_sync_order
  -> Veeqo order ID stored on repair and Woo order
  -> adaptive fulfillment reconciliation
  -> shared VeeqoOrderStateProjector
  -> repair integration state/events/tracking
  -> repair SSE stream
```

Supported actions:

- `sync_order` / `reserve_parts`: project SKU-backed repair parts through the canonical Woo order contract;
- `refresh` / `refresh_fulfillment`: enqueue immediate provider reconciliation;
- `cancel`: enqueue canonical Veeqo status synchronization.

Repair service/fee-only orders without SKU-backed product lines are not materialized as Veeqo fulfillment orders. Inbound and return label purchase remains outside this contract until a verified provider label API, idempotency key, and compensation workflow are implemented.

## Inventory projection

Veeqo inventory is authoritative only for the explicitly configured warehouse. `VeeqoInventoryProjectionServiceV3.php`:

- reads Veeqo products in bounded pages;
- requires exact unique SKU identity;
- prefers `available_stock_level` and accepts `available_stock` only as a compatibility alias;
- rejects missing, null, and non-numeric warehouse stock;
- never converts unknown stock to zero;
- updates only changed simple products and variations;
- synchronizes affected variable parents;
- supports write-free dry runs;
- uses a token-owned lease with heartbeat refresh;
- persists partial diagnostics and continuation cursors;
- retries bounded transient failures through Action Scheduler.

## Queue contracts

```text
Operator inventory hook:       dtb_veeqo_inventory_operation
System inventory reconcile:    dtb_veeqo_inventory_reconcile
Recurring inventory trigger:   dtb_veeqo_inventory_reconcile_recurring
Inventory queue group:         dtb-integrations
Order projection hook:         dtb_order_sync_veeqo
Order refresh hook:            dtb_order_refresh_veeqo_projection
Order queue group:             dtb-orders
Order recovery sweep:          dtb_veeqo_reconcile_active_orders
Repair synchronization hook:   dtb_repair_sync_veeqo
```

No full-catalog write or external order mutation runs in checkout, webhook acknowledgement, SSE, or an interactive Control Center request.

## Admin surface

```text
wp-admin -> Veeqo
/wp-admin/admin.php?page=dtb-veeqo-control-center
```

The Control Center provides inventory overview, exact-SKU comparison, Woo/Veeqo order projection visibility, fulfillment/tracking visibility, dry-run and real reconciliation, order retry, resource discovery, exceptions, queue state, and operation history.

It does not expose unverified direct stock adjustment, picking/packing mutation, label purchase, allocation mutation, or shipment creation.

## Runtime boundaries

- Never convert unknown stock to zero.
- Never sum warehouse inventory for checkout projection.
- Never bypass exact SKU or order identity.
- Never restore `dtb_veeqo_inventory_sync` WP-Cron authority.
- Never describe DTB checkout shipping policy as live Veeqo carrier rating.
- Never invent provider write endpoints from UI behavior or historical comments.
- Keep `VeeqoRuntimePolicy.php` active during rollback so retired routes, cron, product-save mapping, duplicate settings ownership, and automatic webhook registration do not return.

## Validation and rollout

Before production deployment:

```powershell
.\scripts\smoke-dtb-veeqo-admin.ps1
```

Also run PHP syntax validation for every changed PHP file, frontend lint/build, and session-preserving browser acceptance for order and repair streams.

Production replacement procedure:

1. Back up the current live `dtb-integrations/Veeqo/` directory and `dtb-integrations/bootstrap.php`.
2. Build from one immutable approved commit.
3. Replace the complete `Veeqo/` directory, not an additive overlay.
4. Deploy the matching cross-module adapters and bootstrap in the same release.
5. Purge PHP OPcache and host/CDN caches.
6. Validate one paid product order from Woo creation through Veeqo order ID, pick/pack/ship/delivery, tracking stream, and completion.
7. Validate one repair with SKU-backed parts through linked Woo order, Veeqo projection, fulfillment update, and repair stream.
8. Run a dry inventory reconciliation before any real inventory write.

File rollback does not undo WooCommerce metadata, Action Scheduler records, repair events, inventory writes, or Veeqo external state. Recovery must reconcile those durable states after restoring the previous files.
