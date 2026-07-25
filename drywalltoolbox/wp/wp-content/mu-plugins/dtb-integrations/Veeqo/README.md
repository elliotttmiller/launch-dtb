# DTB Veeqo Integration

Veeqo owns sellable inventory, warehouse availability, allocation, fulfillment, shipment execution, carrier, and tracking. WooCommerce owns products, storefront orders, payments, and refunds. DTB owns exact mapping, queueing, projections, idempotency, diagnostics, recovery, and operator workflows.

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
├── VeeqoCredentialBoundary.php
├── VeeqoHealthCheck.php
├── VeeqoInventoryBoundary.php
├── VeeqoInventoryCoverageService.php
├── VeeqoInventoryProjectionServiceV3.php
├── VeeqoInventorySchedulePolicy.php
├── VeeqoInventoryService.php
├── VeeqoOrderProjectionContract.php
├── VeeqoProductionConfiguration.php
├── VeeqoRuntimePolicy.php
├── VeeqoShippingService.php
└── VeeqoSyncJob.php
```

No `Infrastructure/` directory is part of the canonical module.

## Composition and ownership

```text
VeeqoCredentialBoundary.php             secret-safe request-local configuration cache
VeeqoClient.php                         compatibility API/payload/log helpers only
VeeqoConfig.php                         normalized configuration facade
VeeqoProductionConfiguration.php       resource discovery and readiness
VeeqoInventoryService.php              inventory compatibility service
VeeqoInventoryProjectionServiceV3.php  canonical warehouse-scoped projection
VeeqoInventorySchedulePolicy.php       recurring Action Scheduler trigger
VeeqoInventoryCoverageService.php      mapping/coverage diagnostics
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

`VeeqoCredentialBoundary.php` must load before `VeeqoClient.php`. It pre-populates the compatibility client's request-local configuration cache with API key and webhook secret values only from server-side constants. Non-secret warehouse, channel, and delivery-method identifiers retain their supported constant-first, WordPress-option fallback.

`VeeqoClient.php` remains compatibility infrastructure because active order payload, API request, shipping, repair, logging, and webhook code still depends on its functions. It does not own production admin routes, inventory scheduling, product-save mapping, settings UI, or webhook registration. New domain behavior does not belong in that file.

## Retired source

The following paths must not exist in a production replacement directory:

```text
VeeqoInventoryProjectionService.php
VeeqoInventoryProjectionServiceV2.php
VeeqoInventoryAdminController.php
VeeqoOperationsAdmin.php
VeeqoLegacyAdminRegistrationGuard.php
Infrastructure/
Services/VeeqoAdminInventoryReadService.php
Services/VeeqoAdminOrderReadService.php
```

Retired files can redeclare functions, register obsolete routes, or restore superseded synchronization authority. Their absence is a deployment requirement, not optional cleanup.

## Admin surface

```text
wp-admin -> Veeqo
/wp-admin/admin.php?page=dtb-veeqo-control-center
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

The control center intentionally does not expose unverified direct stock-adjustment, picking/packing, label-purchase, allocation, or shipment-write endpoints. Those provider mutations require independently verified upstream contracts, dedicated idempotency and compensation, and controlled acceptance testing.

## Inventory projection

Veeqo inventory is authoritative only for the explicitly configured warehouse. The canonical worker:

```text
VeeqoInventoryProjectionServiceV3.php
```

It:

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
Operator inventory hook:  dtb_veeqo_inventory_operation
System reconcile hook:    dtb_veeqo_inventory_reconcile
Recurring trigger hook:   dtb_veeqo_inventory_reconcile_recurring
Inventory queue group:    dtb-integrations
Order projection hook:    dtb_order_sync_veeqo
Order queue group:        dtb-orders
```

No full-catalog write or external order mutation runs in an interactive REST request.

## Security and runtime policy

- Never expose or persist Veeqo credentials in browser code, REST responses, logs, or WordPress options.
- Resolve API key and webhook secret runtime authority only from `DTB_VEEQO_API_KEY` and `DTB_VEEQO_WEBHOOK_SECRET` server constants.
- Non-secret warehouse, channel, and delivery-method identifiers may use their existing constant-first WordPress-option fallback.
- Load `VeeqoCredentialBoundary.php` before the compatibility client and refresh it after historical credential cleanup or resource-setting writes.
- Never convert unknown stock to zero.
- Never sum warehouse inventory for checkout projection.
- Never bypass exact SKU, order, customer, or allocation ownership validation.
- Never restore `dtb_veeqo_inventory_sync` WP-Cron authority.
- Never activate inbound webhooks until Veeqo authentication and replay protection are explicitly verified.
- Never describe DTB checkout shipping policy as live Veeqo carrier rating.
- Never invent provider write endpoints from UI behavior or historical comments.

`VeeqoRuntimePolicy.php` must remain loaded during rollback. It retires legacy routes, cron, product-save mapping, duplicate settings ownership, and automatic webhook registration. It also removes historical credential fields from WordPress options and preserves the secret-safe request-local configuration boundary.

## Validation

Before packaging or deployment:

```powershell
.\scripts\smoke-dtb-veeqo-admin.ps1
.\scripts\smoke-dtb-mu-modules.ps1
```

The Veeqo smoke script validates the complete file manifest, rejects retired files/directories, checks bootstrap wiring and credential-boundary ordering, scans duplicate canonical symbols, verifies that option-stored secrets are not read, lints every Veeqo PHP file when PHP is installed, and validates the admin JavaScript when Node is installed.

Both smoke scripts are required CI checks in `.github/workflows/ci-build.yml`.

## Production replacement procedure

1. Back up the current live `dtb-integrations/Veeqo/` directory and `dtb-integrations/bootstrap.php`.
2. Build the replacement from one immutable repository commit.
3. Run the Veeqo and global MU-plugin smoke checks against that commit.
4. Upload the complete replacement directory to a temporary sibling path.
5. Verify every manifest file exists, retired paths are absent, and PHP permissions are normally `0644` with directories `0755`.
6. Replace the live `Veeqo/` directory as one unit. Do not copy into the existing directory without first removing or renaming it.
7. Deploy the matching `dtb-integrations/bootstrap.php` last.
8. Purge PHP OPcache, SiteGround dynamic cache, and CDN cache.
9. Confirm `/wp-admin/` loads before opening the Control Center.
10. Run connection validation and a dry reconciliation before any real inventory write.

WordPress options, Action Scheduler records, WooCommerce product metadata, and Veeqo external state are database/provider-owned and are not contained in this directory. File replacement does not erase or roll back those states.

## Rollback

Restore the previous complete `Veeqo/` directory and matching bootstrap from the same backup. Keep `VeeqoRuntimePolicy.php` and `VeeqoCredentialBoundary.php`, or equivalent guards, active. Never restore legacy WP-Cron inventory projection, public bulk inventory, synchronous product-save mapping, automatic webhook registration, or WordPress-option credential authority.

Full architecture and rollout contract:

```text
docs/veeqo-operations-admin.md
docs/architecture/veeqo-woocommerce-integration-audit.md
docs/architecture/veeqo-control-center-deployment.md
```
