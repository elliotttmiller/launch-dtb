# DTB Veeqo Integration

Veeqo owns sellable inventory, warehouse availability, allocation, fulfillment, shipment execution, carrier, and tracking. WooCommerce owns products, storefront orders, payments, and refunds. DTB owns exact mapping, queueing, projections, idempotency, diagnostics, recovery, and operator workflows.

## Composition

```text
VeeqoClient.php                         compatibility API/payload/log helpers only
VeeqoConfig.php                         normalized configuration facade
VeeqoProductionConfiguration.php       resource discovery and readiness
VeeqoInventoryProjectionServiceV3.php  canonical warehouse-scoped projection
VeeqoInventorySchedulePolicy.php       recurring Action Scheduler trigger
VeeqoRuntimePolicy.php                 legacy retirement and fail-closed policy
Services/VeeqoOperationStore.php       durable inventory operation state
Services/VeeqoAdminReadModel.php       batched/redacted operator projections
Rest/VeeqoAdminController.php          canonical protected admin REST API
Rest/VeeqoCompatibilityController.php  bounded aliases for known callers
Admin/VeeqoAdminPage.php               wp-admin application shell
assets/veeqo-admin.css                 scoped responsive presentation
assets/veeqo-admin.js                  operator interaction client
VeeqoOrderProjectionContract.php       exactly-once order projection policy
VeeqoInventoryBoundary.php             checkout-facing stock boundary
VeeqoShippingService.php               DTB shipping-policy adapter
VeeqoSyncJob.php                       synchronization timestamps/state
VeeqoHealthCheck.php                   redacted health diagnostics
```

## Admin surface

```text
wp-admin -> Veeqo
/wp/wp-admin/admin.php?page=dtb-veeqo-control-center
```

Every control-center route requires native WordPress authentication, REST nonce validation, and `manage_woocommerce`.

Canonical route prefix:

```text
/dtb/v1/veeqo/admin/control-center
```

Supported workflows:

- inventory overview, search, filters, mappings, and exact-SKU comparison
- WooCommerce order/Veeqo projection visibility
- fulfillment/tracking projection visibility
- inventory dry run and reconciliation
- order retry through the canonical `dtb-orders` queue
- resource discovery, selection, and connection validation
- exceptions, queue state, and operation history

The control center intentionally does not expose unverified direct stock-adjustment or shipment-write endpoints. Those provider mutations require an independently verified upstream API contract, dedicated idempotency/compensation design, and controlled acceptance testing before activation.

## Queue contracts

```text
Operator inventory hook:  dtb_veeqo_inventory_operation
System reconcile hook:    dtb_veeqo_inventory_reconcile
Recurring trigger hook:   dtb_veeqo_inventory_reconcile_recurring
Inventory queue group:    dtb-integrations
Order projection hook:    dtb_order_sync_veeqo
Order queue group:        dtb-orders
```

No full-catalog write or external order mutation runs in an interactive REST request.

## Safety rules

- Never expose or persist Veeqo credentials in browser code, REST responses, logs, or WordPress options.
- Never convert unknown stock to zero.
- Never sum warehouse inventory for the checkout projection.
- Never bypass exact SKU, order, or allocation ownership validation.
- Never restore `dtb_veeqo_inventory_sync` WP-Cron authority.
- Never activate inbound webhooks until Veeqo authentication is explicitly verified.
- Never describe DTB checkout shipping policy as live Veeqo carrier rating.
- Never invent provider write endpoints from UI behavior or historical comments.

Full architecture and rollout contract:

```text
docs/veeqo-operations-admin.md
docs/architecture/veeqo-woocommerce-integration-audit.md
```
