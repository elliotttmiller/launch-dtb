# Veeqo Control Center

## Purpose

The Veeqo Control Center is the canonical WordPress operator workspace for Drywall Toolbox inventory, order projection, fulfillment visibility, reconciliation, and non-secret Veeqo configuration. It replaces the retired `WooCommerce > Veeqo Operations` page and prevents routine operators from switching between wp-admin and Veeqo for DTB-owned workflows.

Admin URL:

```text
/wp/wp-admin/admin.php?page=dtb-veeqo-control-center
```

Required capability:

```text
manage_woocommerce
```

Authentication is the native WordPress admin cookie plus the WordPress REST nonce installed by `wp-api-fetch`.

## Authority boundaries

- WooCommerce owns products, customers, orders, payments, refunds, and checkout-facing order status.
- Veeqo owns sellable inventory, configured-warehouse availability, allocation, fulfillment, labels, shipment execution/status, carrier, and tracking.
- DTB owns exact-SKU mapping, inventory projection, order projection policy, queues, idempotency, retries, diagnostics, recovery, and the operator experience.
- QuickBooks remains accounting projection only.

The control center does not create storefront orders, change payment status, provide live Veeqo carrier quotes, or expose Veeqo credentials.

## Architecture

Owning module:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/Veeqo/
```

Runtime composition:

```text
VeeqoClient.php                         compatibility API/payload/log helpers
VeeqoProductionConfiguration.php        server-side discovery/readiness
VeeqoInventoryProjectionServiceV3.php   warehouse-scoped inventory projection
VeeqoRuntimePolicy.php                  authority/retirement/security policy
Services/VeeqoOperationStore.php        durable single-flight operation state
Services/VeeqoAdminReadModel.php        batched/redacted admin projections
Rest/VeeqoAdminController.php           canonical protected admin API
Rest/VeeqoCompatibilityController.php   bounded aliases for known callers
Admin/VeeqoAdminPage.php                wp-admin application shell
assets/veeqo-admin.css                   scoped responsive presentation
assets/veeqo-admin.js                    interaction, filtering, polling, drawers
```

The historical monolithic `VeeqoOperationsAdmin.php`, `VeeqoInventoryAdminController.php`, `VeeqoInventoryProjectionService.php`, and `VeeqoInventoryProjectionServiceV2.php` are removed. There is one admin page owner, one inventory projection implementation, and one operation store.

## Operator sections

### Overview

- production-readiness indicators
- inventory, low-stock, out-of-stock, unmapped, and processing-order KPIs
- current inventory reconciliation diagnostics
- recent durable operations
- exact-SKU inspector

### Orders

- WooCommerce order search/filter/pagination
- Veeqo external order identity and DTB sync state
- fulfillment/tracking projection
- bounded operator retry through the canonical `dtb-orders` queue

### Inventory

- indexed search by product name or SKU
- filters for stock state, mapping state, and product type
- WooCommerce checkout-facing projected stock
- mapping identity and exact-SKU live inspection
- dry-run and real reconciliation controls

The table labels `On hand`, `Available`, `Committed`, and `Incoming` follow Veeqo operator vocabulary. WooCommerce stores only checkout-facing projected available quantity; committed/incoming values remain unknown unless a verified Veeqo read model supplies them. Unknown values display as `—` and are never invented.

### Fulfillment

- Veeqo-projected WooCommerce orders
- queue/sync state
- external Veeqo order ID
- tracking/carrier projection
- operator retry using the canonical order queue

### Operations

- one active inventory operation at a time
- bounded page/time chunks
- durable cursor/result/heartbeat state
- transient retry with exponential backoff
- continuation recovery after worker interruption
- bounded history of 20 summaries

### Settings

- server-side API credential readiness only; the key is never rendered or accepted
- Direct channel, warehouse, and delivery method selection
- Veeqo discovery and explicit validation
- server constants remain authoritative over WordPress options
- multiple candidates require an explicit operator choice

Saving operational IDs does not automatically mutate inventory. The operator validates configuration and runs a dry reconciliation before applying stock.

## Inventory projection contract

Canonical implementation:

```text
VeeqoInventoryProjectionServiceV3.php
```

Rules:

- fetch `/products` using pages of 100
- use only the explicitly configured Veeqo warehouse
- prefer `available_stock_level`; accept `available_stock` only as a compatibility alias
- reject null/non-numeric stock values
- treat absent warehouse entries and unknown stock schemas as exceptions, never zero
- require exact unique WooCommerce SKU identity
- update only simple products and variations
- persist `_veeqo_sellable_id` and `_veeqo_mapped_sku`
- synchronize affected variable parents and invalidate transients
- skip unchanged products
- support a write-free dry run

Execution budget:

```text
page size: 100
maximum pages per chunk: 25
maximum wall time per chunk: 90 seconds
absolute page limit: 1000
lease TTL: 20 minutes with page-level heartbeat
```

## Queue contracts

Inventory operation hook:

```text
dtb_veeqo_inventory_operation
```

Arguments:

```text
operation_id, dry_run, start_page, aggregate, attempt
```

Recurring trigger:

```text
dtb_veeqo_inventory_reconcile_recurring
```

System reconciliation hook:

```text
dtb_veeqo_inventory_reconcile
```

Action Scheduler group:

```text
dtb-integrations
```

Inventory single-flight uses an atomic active marker plus a token-owned reconciliation lease. Operation continuation persists its next cursor before enqueueing the continuation, records a heartbeat, and can recover a pending continuation after a dead worker. Transient classes `0`, `408`, `425`, `429`, lock conflict, and `5xx` retry up to three times with bounded exponential delay.

Order retry remains in the canonical order platform:

```text
hook: dtb_order_sync_veeqo
group: dtb-orders
queue API: dtb_order_enqueue_job()
```

The control center never calls Veeqo synchronously to create an order.

## REST API

All canonical control-center routes require `manage_woocommerce`:

```text
GET  /dtb/v1/veeqo/admin/control-center/overview
GET  /dtb/v1/veeqo/admin/control-center/inventory
GET  /dtb/v1/veeqo/admin/control-center/orders
GET  /dtb/v1/veeqo/admin/control-center/fulfillment
GET  /dtb/v1/veeqo/admin/control-center/settings
POST /dtb/v1/veeqo/admin/control-center/settings
POST /dtb/v1/veeqo/admin/control-center/connection/test
POST /dtb/v1/veeqo/admin/control-center/inventory/reconcile
GET  /dtb/v1/veeqo/admin/control-center/operations
GET  /dtb/v1/veeqo/admin/control-center/operations/{operation_id}
GET  /dtb/v1/veeqo/admin/control-center/sku?sku={exact-sku}
POST /dtb/v1/veeqo/admin/control-center/orders/{order_id}/retry
```

Supported compatibility aliases delegate to canonical behavior and perform no catalog-wide synchronous work:

```text
GET  /dtb/v1/veeqo/status
GET  /dtb/v1/veeqo/inventory
POST /dtb/v1/veeqo/inventory/pull
POST /dtb/v1/veeqo/map-skus
POST /dtb/v1/veeqo/sync-order/{order_id}
DELETE /dtb/v1/veeqo/webhooks/ensure  -> 410 retired
```

The old `/dtb/v1/veeqo/status` JWT-only behavior is replaced by native wp-admin capability authorization.

## Security

The browser and REST responses never receive:

- Veeqo API keys
- webhook secrets
- authorization headers
- raw credential-bearing upstream payloads
- customer payment data

Historical `api_key` and `webhook_secret` fields are removed from `woocommerce_dtb_veeqo_settings` by an idempotent runtime migration. Credentials are accepted only from server constants.

Every write requires `manage_woocommerce` and the WordPress REST nonce. Inventory and order writes are queued. External calls are not made during checkout, payment confirmation, or webhook acknowledgement.

## Legacy retirement

`VeeqoRuntimePolicy.php` removes the historical client ownership before hooks execute:

```text
rest_api_init -> dtb_veeqo_register_routes
woocommerce_update_product -> dtb_veeqo_map_product_sku
cron_schedules -> dtb_veeqo_register_cron_intervals
init -> dtb_veeqo_schedule_inventory_pull
dtb_veeqo_inventory_sync -> dtb_veeqo_run_inventory_pull
init -> dtb_veeqo_ensure_webhooks
anonymous woocommerce_integrations registration
```

The persisted `dtb_veeqo_inventory_sync` WP-Cron event is cleared with retry-on-failure and must never be restored as production authority.

`VeeqoClient.php` is compatibility infrastructure until its still-used API, order-payload, shipping, repair, logging, and webhook helpers are separately extracted. New behavior must not be added there.

## Verified scope boundary

The current release covers DTB-owned inventory projection, order projection visibility/retry, fulfillment/tracking projection visibility, durable operations, resource configuration, connection validation, and exact-SKU comparison.

Direct Veeqo physical-stock adjustment, label purchase/printing, allocation mutation, picking/packing mutation, and shipment creation are not activated because their current upstream API contracts and idempotency/compensation requirements have not been verified in this change. Visual similarity to Veeqo does not make unverified provider writes safe.

## Deployment

Deploy the complete `dtb-integrations/Veeqo` and bootstrap change from one immutable commit. Do not selectively upload only the admin page or bootstrap.

Required order:

1. back up the DTB-managed MU-plugin surface
2. validate all changed PHP syntax
3. validate `veeqo-admin.js` syntax
4. run the Veeqo admin smoke script and global MU-plugin validation
5. deploy the bounded payload through the protected deployment workflow
6. confirm wp-admin loads and the old bookmark redirects
7. validate connection and selected resources
8. run a dry reconciliation
9. review every duplicate, unmapped, missing-warehouse, and invalid-stock exception
10. run one controlled reconciliation
11. verify representative simple products and variations
12. verify one controlled paid order creates exactly one Veeqo order through `dtb-orders`
13. verify fulfillment/tracking projection

Merge is not deployment.

## Rollback

Rollback must retain `VeeqoRuntimePolicy.php`. Never restore the legacy WP-Cron inventory worker or public bulk inventory route.

1. stop/cancel identified pending `dtb-integrations` Veeqo actions
2. restore the previous complete DTB-managed file set
3. keep the legacy cron/route/admin retirement policy loaded
4. correct the configured warehouse/resource mapping
5. queue a fresh authoritative reconciliation
6. verify representative SKUs before reopening checkout

Rollback does not automatically revert WooCommerce stock already projected from Veeqo. Never bulk-mark all products in stock; reconcile from the Veeqo authority.
