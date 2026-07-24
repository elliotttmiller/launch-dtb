# DTB Order / Veeqo Permanent Architecture

## System-of-record contract

Drywall Toolbox uses the existing headless architecture:

- React storefront: customer-facing UX only
- WooCommerce: checkout, payment, order shell, customer/order record
- Veeqo: inventory, fulfillment, warehouse workflow, labels, shipment/tracking state
- DTB order platform: event ledger, write boundary, queue orchestration, idempotency, observability
- QuickBooks: accounting projection after payment/refund events

WooCommerce order creation must happen through the DTB checkout/order pipeline. External systems must not create WooCommerce orders directly unless an explicit reviewed exception is configured.

## Production Veeqo connection contract

Veeqo credentials are server-side secrets. The production API key must be supplied through `DTB_VEEQO_API_KEY` in live server configuration (or an equivalent server-side secret injection layer). The WooCommerce settings UI must never render the key back to an operator or persist a newly entered key in WordPress options.

The production settings owner is:

`dtb-integrations/Veeqo/VeeqoProductionConfiguration.php`

It replaces the legacy credential-centric WooCommerce integration screen while preserving the existing `dtb_veeqo` settings option for non-secret operational IDs.

Required order-projection configuration:

- one explicitly validated Veeqo Direct channel/store ID
- one explicitly validated fulfillment warehouse ID
- one explicitly validated delivery method ID
- `DTB_VEEQO_API_KEY` configured server-side

Discovery is fail-closed:

- exactly one valid candidate may be auto-selected
- multiple candidates require explicit operator selection
- a configured ID that Veeqo no longer returns is cleared and reported as an error
- the first API result must never be silently treated as authoritative

Admin diagnostics:

- `GET /wp-json/dtb/v1/veeqo/admin/connection`
- `POST /wp-json/dtb/v1/veeqo/admin/connection/test`

Both routes require `manage_woocommerce` and return only redacted readiness/configuration data.

Inbound Veeqo webhooks remain disabled unless their exact upstream authentication/signature contract is verified for the live Veeqo account. Do not invent or persist an ad-hoc webhook secret merely to make the route accept requests. Poll/reconciliation remains the safe fallback until webhook authentication is confirmed.

## Permanent write boundary

`dtb-order-platform/Infrastructure/OrderWriteBoundary.php` is the canonical production guard for:

- raw WooCommerce REST order-creation blocking
- duplicate order fingerprinting
- duplicate order auto-cancel/suppression
- duplicate email suppression
- Action Scheduler side-effect job gating
- disabling legacy direct Veeqo status sync hooks
- disabling marketplace read-model materialization by default
- admin sweep/status diagnostics

The previous `zzz-dtb-order-loop-containment.php` file is now only a compatibility shim. Do not add new logic there.

### Runtime controls

```php
// Master switch.
define( 'DTB_ORDER_WRITE_BOUNDARY_ENABLED', true );

// Duplicate detection.
define( 'DTB_ORDER_WRITE_BOUNDARY_DUPLICATE_WINDOW', 6 * HOUR_IN_SECONDS );
define( 'DTB_ORDER_WRITE_BOUNDARY_AUTO_CANCEL_DUPLICATES', true );

// External writes and legacy side effects.
define( 'DTB_ORDER_WRITE_BOUNDARY_BLOCK_WC_REST_ORDER_CREATION', true );
define( 'DTB_ORDER_WRITE_BOUNDARY_DISABLE_LEGACY_VEEQO_DIRECT_SYNC', true );
define( 'DTB_ORDER_WRITE_BOUNDARY_DISABLE_MARKETPLACE_MATERIALIZATION', true );
```

A direct external WooCommerce order writer may only be enabled with a private explicit exception:

```php
define( 'DTB_EXTERNAL_ORDER_WRITE_SECRET', 'long-random-reviewed-secret' );
```

The caller must send:

```http
X-DTB-External-Order-Secret: <secret>
```

This should not be used for Veeqo/API2Cart bridge polling unless the data flow has been reviewed for idempotency.

## Veeqo inventory boundary

`dtb-integrations/Veeqo/VeeqoInventoryBoundary.php` enforces the inventory contract:

- public browser code cannot fetch bulk `/dtb/v1/veeqo/inventory`
- admin users may still access bulk inventory diagnostics
- storefront inventory checks use `POST /dtb/v1/veeqo/cart-availability`
- the endpoint checks WooCommerce stock projection synchronized from Veeqo

The storefront service `frontend/src/services/veeqo.js` must use `cart-availability`, not the bulk inventory endpoint.

## Queue-only external writes

External system writes must be routed through `dtb_order_enqueue_job()` and the `dtb-orders` Action Scheduler group. The order queue checks the order write boundary before scheduling and before executing Veeqo, QuickBooks, notifications, tracking projection, archive, and refund jobs.

The legacy Veeqo direct hook in `VeeqoClient.php` must not be treated as canonical. It is disabled by the permanent write boundary and operational pipeline overrides. Future refactors should remove the direct-hook section from the monolithic client after live verification.

## Live connection sequence

1. Create a dedicated Veeqo integration user and generate a new API key.
2. Put the key only in the live server configuration as `DTB_VEEQO_API_KEY`.
3. Deploy the DTB Veeqo production-configuration module.
4. Open WooCommerce → Settings → Integrations → Drywall Toolbox Veeqo.
5. Save once to run resource discovery.
6. If more than one Direct channel, warehouse, or delivery method exists, select the intended IDs explicitly and save again.
7. Run `POST /wp-json/dtb/v1/veeqo/admin/connection/test` as an administrator and require HTTP 200 / `ready: true`.
8. Run the SKU mapping/catalog audit before allowing live order projection.
9. Place one controlled paid test order and verify the path: Woo order → DTB event → `dtb-orders` queue → one Veeqo order → warehouse allocation → fulfillment/tracking projection.
10. Verify QuickBooks receives only its accounting projection and does not create or control the operational order.

## Verification checklist

After deployment:

1. `GET /wp-json/dtb/v1/order-loop/status` as an admin returns `enabled: true`.
2. `POST /wp-json/wc/v3/orders` without the external-write secret returns `403`.
3. `GET /wp-json/dtb/v1/veeqo/inventory` as an unauthenticated visitor returns `403`.
4. `POST /wp-json/dtb/v1/veeqo/cart-availability` returns item-level availability.
5. `GET /wp-json/dtb/v1/veeqo/admin/connection` exposes no API key or webhook secret and reports the expected IDs/readiness.
6. A duplicate test order is tagged with `_dtb_duplicate_of_order_id` and cancelled.
7. Duplicate order emails are not sent.
8. Duplicate orders do not schedule Veeqo/QuickBooks/notification Action Scheduler jobs.
9. Marketplace materialization remains disabled unless `DTB_MARKETPLACE_MATERIALIZATION_ENABLED` is explicitly true.
10. Veeqo order creation occurs only through `dtb_order_sync_veeqo` jobs.
11. QuickBooks sync occurs only after the intended payment/refund event rules.
