# Veeqo Control Center Implementation Report

## Previous state

The previous implementation had overlapping admin pages/controllers, multiple inventory projection generations, historical public/admin routes registered from a monolithic compatibility client, a retired WP-Cron worker, and configuration UI split between WooCommerce Integration settings and the Veeqo operations page. The operator page covered diagnostics and reconciliation but did not provide a cohesive inventory/order/fulfillment workspace.

## Current state

The control center establishes one operator page, one protected REST boundary, one batched read model, one durable operation store, and one inventory projection implementation. It removes duplicate files and retires historical hook ownership before WordPress dispatch.

### User experience

- persistent Veeqo-style product navigation inside wp-admin
- overview KPIs and production readiness
- searchable/filterable inventory variants
- exact-SKU WooCommerce/live-Veeqo comparison drawer
- order and fulfillment projections with canonical retry control
- durable operation progress/history
- non-secret resource settings and connection validation
- responsive tables, loading, empty, error, success, and timeout states

### Backend behavior

- all dashboard routes require `manage_woocommerce`
- routine reads use WooCommerce/DTB projections rather than live fetch-per-row Veeqo traffic
- connection validation and exact-SKU inspection are the only synchronous live Veeqo reads
- inventory writes run through `dtb-integrations` Action Scheduler actions
- order retries run through `dtb-orders`
- unknown stock fails closed
- persisted credentials are removed from WordPress options
- unverified provider stock/shipment mutation endpoints are intentionally excluded

## Changed source

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/bootstrap.php

drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/Veeqo/
  Admin/VeeqoAdminPage.php
  Services/VeeqoAdminReadModel.php
  Services/VeeqoOperationStore.php
  Rest/VeeqoAdminController.php
  Rest/VeeqoCompatibilityController.php
  VeeqoInventoryProjectionServiceV3.php
  VeeqoProductionConfiguration.php
  VeeqoRuntimePolicy.php
  README.md
  assets/veeqo-admin.css
  assets/veeqo-admin.js
```

Retired source:

```text
VeeqoInventoryProjectionService.php
VeeqoInventoryProjectionServiceV2.php
VeeqoInventoryAdminController.php
VeeqoOperationsAdmin.php
VeeqoLegacyAdminRegistrationGuard.php
```

## Validation contract

Static/local:

```powershell
.\scripts\smoke-dtb-veeqo-admin.ps1
```

Optional unauthenticated negative-route validation:

```powershell
.\scripts\smoke-dtb-veeqo-admin.ps1 -BaseUrl https://example.com
```

Release acceptance additionally requires authenticated browser validation, a dry inventory run, one controlled reconciliation, representative SKU/cart verification, and one controlled exactly-once paid-order projection.

## Deployment state

Source changes and documentation do not constitute deployment. Production deployment must use the protected DTB workflow and complete the operational acceptance checks above.
