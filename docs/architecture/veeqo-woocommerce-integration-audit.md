# Veeqo + WooCommerce Production Integration Audit

## Scope

This document records the current production contract for the Drywall Toolbox Veeqo/WooCommerce integration and its wp-admin Control Center.

Canonical operator guide:

```text
docs/veeqo-operations-admin.md
```

## System-of-record boundaries

- WooCommerce owns products, customers, orders, payments, refunds, and Store API cart/session state.
- DTB owns lifecycle policy, event persistence, write boundaries, Action Scheduler queues, idempotency, retries, projections, diagnostics, and operator recovery.
- Veeqo owns sellable inventory, warehouse availability, allocation, picking/packing, labels, shipment execution/status, carrier, and tracking.
- QuickBooks receives accounting projections only after eligible WooCommerce payment/refund events.
- React never becomes inventory, fulfillment, order, or payment authority.

## Canonical order path

```text
WooCommerce Checkout Block + official Stripe gateway
  -> verified paid WooCommerce order
  -> DTB captured-payment contract/event ledger
  -> dtb-orders Action Scheduler queue
  -> dtb_order_sync_veeqo
  -> stable correlation/idempotency key
  -> one Veeqo order
  -> Veeqo fulfillment
  -> authenticated/polled DTB tracking projection
  -> WooCommerce/customer UI
```

Veeqo order creation is asynchronous. Checkout, payment confirmation, and webhook acknowledgement never wait on Veeqo network calls.

## Production configuration

Server secret:

```text
DTB_VEEQO_API_KEY
```

Operational identities:

```text
DTB_VEEQO_CHANNEL_ID
DTB_VEEQO_WAREHOUSE_ID
DTB_VEEQO_DELIVERY_METHOD_ID
```

Positive server constants override saved non-secret IDs. If constants are not set, the Veeqo Control Center may save only the three numeric IDs in `woocommerce_dtb_veeqo_settings`.

The API key and webhook secret are never accepted from wp-admin. An idempotent runtime migration removes historical credential fields from that option.

`VeeqoProductionConfiguration.php` owns discovery and validation only. It does not register a second WooCommerce integration settings screen or REST controller.

Discovery is fail-closed:

- exactly one candidate may be auto-selected
- multiple candidates require explicit operator selection
- configured IDs not returned by Veeqo are rejected
- readiness requires API key, Direct channel, warehouse, and delivery method

## Veeqo Control Center

Admin location:

```text
Veeqo -> Veeqo Control Center
```

Canonical URL:

```text
/wp/wp-admin/admin.php?page=dtb-veeqo-control-center
```

The retired `page=dtb-veeqo-operations` bookmark redirects to the canonical page.

Sections:

- Overview
- Orders
- Inventory
- Fulfillment
- Operations
- Settings

The dashboard uses WooCommerce/DTB read models for routine interactive reads. Live Veeqo requests occur only for explicit connection validation and exact-SKU inspection. This avoids fetch-per-row traffic and makes the dashboard usable when Veeqo is temporarily degraded.

## Inventory authority and projection

Canonical direction:

```text
configured Veeqo warehouse
  -> sellable sku_code + warehouse stock entry
  -> exact unique WooCommerce SKU
  -> WooCommerce manage_stock / quantity / stock_status
  -> Store API/cart validation
  -> React product/cart UX
```

There is no WooCommerce-to-Veeqo inventory feedback loop.

Canonical worker:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/Veeqo/VeeqoInventoryProjectionServiceV3.php
```

Recurring trigger:

```text
dtb_veeqo_inventory_reconcile_recurring
```

System reconciliation hook:

```text
dtb_veeqo_inventory_reconcile
```

Operator operation hook:

```text
dtb_veeqo_inventory_operation
```

Action Scheduler group:

```text
dtb-integrations
```

### Stock semantics

Finite inventory:

- `manage_stock = true`
- quantity = configured-warehouse available stock
- status = `instock` when available > 0; otherwise `outofstock` unless Woo backorders are explicitly allowed

Infinite Veeqo inventory:

- `manage_stock = false`
- status = `instock`

The projection prefers `available_stock_level`. `available_stock` is accepted only as a compatibility alias. Null and non-numeric values are invalid.

Missing warehouse entries, unknown stock schemas, duplicate WooCommerce SKUs, and missing SKU mappings are exceptions. They are reported and skipped, never silently converted to zero.

Variable-product parents are synchronized after child updates, and product transients are invalidated.

### Execution, concurrency, and recovery

- page size: 100
- maximum 25 pages or 90 seconds per chunk
- token-owned 20-minute reconciliation lease
- lease heartbeat between pages
- absolute safety limit: 1000 pages
- single active operator operation claimed atomically with `add_option()`
- durable next-page cursor, aggregate, heartbeat, and Action Scheduler action ID
- pending-continuation recovery after worker interruption
- bounded transient retry: three attempts with exponential delay
- unchanged Woo products are not rewritten

## SKU identity

Canonical identity:

```text
WooCommerce SKU == DTB canonical SKU == Veeqo sellable sku_code
```

Reconciliation also persists:

```text
_veeqo_sellable_id
_veeqo_mapped_sku
```

Synchronous product-save mapping and the historical one-request-per-SKU bulk mapper are retired. The supported `/veeqo/map-skus` alias queues the same batched inventory operation.

## Order projection and retries

The canonical projection:

- runs only from `dtb-orders`
- requires production readiness
- uses the atomic integration lease
- refuses duplicate creation when a Veeqo external ID already exists
- uses stable correlation `veeqo-order:{woo_order_id}:v1`
- persists external ID and integration state
- classifies retryable and terminal failures

The Control Center retry action calls:

```text
dtb_order_enqueue_job('dtb_order_sync_veeqo', order_id, context)
```

It records the operator, reason, integration state, and an operator-visible event. It never calls `POST /orders` from the interactive REST request.

## Fulfillment and tracking

Veeqo remains fulfillment authority. The Control Center shows the WooCommerce/DTB projection of:

- Veeqo external order ID
- sync status/error/attempt timestamps
- fulfillment status
- tracking number
- carrier

Inbound webhook policy remains fail-closed until the upstream signing contract is verified. Polling/reconciliation is the safe fallback. The retired webhook auto-registration endpoint returns HTTP 410.

## Shipping

DTB currently calculates checkout shipping policy locally. The Veeqo delivery method is an order-projection mapping; it does not make checkout rates live Veeqo carrier rates.

The compatibility `/dtb/v1/veeqo/shipping-rates` route remains only for the existing server-side shipping-policy adapter and must not be described as live Veeqo rating.

## REST ownership

Canonical admin namespace:

```text
/dtb/v1/veeqo/admin/control-center/*
```

All canonical routes require native wp-admin authentication, the WordPress REST nonce, and `manage_woocommerce`.

Supported compatibility aliases are explicitly registered by `Rest/VeeqoCompatibilityController.php`. The historical `VeeqoClient.php` route registration callback is removed before `rest_api_init` executes.

Public bulk Veeqo inventory is retired. Storefront availability uses WooCommerce's projected stock and the DTB cart-availability contract.

## Legacy retirement

Removed files:

```text
VeeqoInventoryProjectionService.php
VeeqoInventoryProjectionServiceV2.php
VeeqoInventoryAdminController.php
VeeqoOperationsAdmin.php
VeeqoLegacyAdminRegistrationGuard.php
```

Runtime-retired historical ownership:

```text
rest route registration from VeeqoClient.php
WP-Cron dtb_veeqo_inventory_sync
six-hour legacy cron interval
synchronous product-save SKU mapping
automatic webhook registration
anonymous WooCommerce Integration settings registration
```

`VeeqoClient.php` remains compatibility infrastructure only because active order payload, API request, shipping, repair, logging, and webhook code still depends on its functions. No new domain behavior belongs there; extraction must be completed by moving active functions into explicit services, not by re-enabling retired hooks.

## Health gates

Veeqo is not production-ready until:

- server API key is configured
- Direct channel is validated
- warehouse is validated
- delivery method is validated
- inventory reconciliation completed at least once
- last successful inventory projection is not older than two hours
- duplicate and missing-warehouse exceptions are understood
- `dtb-orders` and `dtb-integrations` queues drain normally

Health and admin responses are redacted.

## Launch verification

1. Validate the API credential and resource mappings in the Control Center.
2. Queue a dry inventory run.
3. Review every duplicate, unmapped, missing-warehouse, and invalid-stock exception.
4. Run one controlled real reconciliation.
5. Verify representative simple and variation SKUs from Veeqo available stock through Woo quantity/status and Store API cart validation.
6. Place one controlled paid order through the canonical checkout.
7. Verify exactly one `dtb_order_sync_veeqo` side effect and one Veeqo order.
8. Retry/reconcile the same order and prove no duplicate Veeqo order is created.
9. Fulfill/ship in Veeqo and verify the approved tracking projection.
10. Inspect Action Scheduler and Veeqo logs for terminal failure or retry amplification.

## Rollback

Rollback must preserve `VeeqoRuntimePolicy.php`; never restore the legacy cron, public bulk inventory, synchronous product-save mapping, or duplicate settings UI.

If a bad warehouse mapping is discovered:

1. stop identified pending Veeqo actions
2. clear/correct the incorrect non-secret resource mapping
3. validate Veeqo configuration
4. queue a dry run
5. queue a fresh authoritative reconciliation
6. verify representative SKUs before reopening checkout

Rollback does not automatically undo stock already projected into WooCommerce. Never bulk-mark every product in stock.
