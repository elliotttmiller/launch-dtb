# DTB Veeqo Integration

Veeqo owns sellable inventory, warehouse availability, allocation, fulfillment, shipment execution, carrier, and tracking. WooCommerce owns products, storefront orders, payments, and refunds. DTB owns exact mapping, queueing, projections, idempotency, diagnostics, and operator workflows.

## Composition

```text
VeeqoClient.php                         Server-side API client and legacy compatibility
VeeqoProductionConfiguration.php       Redacted resource configuration/readiness
VeeqoInventoryProjectionServiceV2.php  Canonical warehouse-scoped inventory projection
VeeqoInventoryAdminController.php       Compatibility inventory admin routes
VeeqoRuntimePolicy.php                  Legacy schedule/webhook fail-closed guards
Admin/VeeqoAdminReadService.php         Control-center read models and cache policy
Admin/VeeqoAdminOperationService.php    Durable idempotent mutations
Admin/VeeqoAdminController.php          Protected control-center REST boundary
Admin/VeeqoAdminPage.php                wp-admin application shell and assets
assets/veeqo-admin.*                    Responsive operator client
```

## Admin surface

```text
wp-admin -> Veeqo
```

Every route requires native WordPress authentication, REST nonce validation, and `manage_woocommerce`.

Control-center route prefix:

```text
/dtb/v1/veeqo/admin/dashboard
```

Supported daily workflows:

- live inventory and warehouse quantities;
- exact SKU/WooCommerce projection comparison;
- live Veeqo orders and allocation detail;
- inventory dry run and reconciliation;
- queued physical-stock adjustment;
- queued shipment recording/tracking;
- resource mapping and connection validation;
- exceptions, queue state, and operation history.

## Queue contracts

```text
Inventory reconciliation hook: dtb_veeqo_inventory_reconcile
Admin mutation hook:          dtb_veeqo_admin_operation
Action Scheduler group:       dtb-integrations
```

No full-catalog write or external mutation runs in an interactive REST request.

## Safety rules

- Never expose the API key, webhook secret, or request authorization headers.
- Never convert unknown stock to zero.
- Never sum warehouse inventory for the checkout projection.
- Never bypass exact SKU/allocation ownership validation.
- Never restore `dtb_veeqo_inventory_sync` WP-Cron authority.
- Never activate inbound webhooks until Veeqo authentication is explicitly verified.
- Never use live Veeqo carrier rating as DTB checkout shipping policy.

Full architecture: `docs/architecture/veeqo-admin-control-center.md`.
