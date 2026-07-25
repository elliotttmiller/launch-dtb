# Veeqo Control Center QA Matrix

## Static and wiring

- PHP syntax passes for every changed Veeqo PHP file and `dtb-integrations/bootstrap.php`.
- JavaScript syntax passes for `assets/veeqo-admin.js`.
- Canonical bootstrap loads V3 projection, operation store, read model, REST controllers, and admin page in dependency order.
- Retired V1/V2 projection, operations page, inventory controller, and legacy registration guard are absent.
- Runtime policy removes historical route, WP-Cron, product-save mapping, webhook registration, and Woo integration UI ownership.

## Authorization and security

- Unauthenticated canonical control-center routes return 401/403.
- Authenticated users without `manage_woocommerce` return 403.
- Administrator/shop-manager requests with the WordPress REST nonce succeed.
- POST requests without a valid REST nonce fail.
- API key, webhook secret, authorization headers, and raw credential-bearing responses do not appear in page HTML, JavaScript configuration, REST responses, logs, or saved admin operations.
- Historical credential fields are removed from `woocommerce_dtb_veeqo_settings`.

## Inventory

- Exact unique SKU maps to one Woo product/variation and one Veeqo sellable.
- Duplicate Woo SKUs are reported and skipped.
- Missing Woo SKU mappings are reported and skipped.
- Missing configured-warehouse entries are reported and skipped.
- Null/non-numeric stock values are reported and skipped.
- `available_stock_level` takes precedence over compatibility `available_stock`.
- Finite stock projects quantity/status correctly.
- Infinite stock disables Woo stock management and remains in stock.
- Dry run performs no product/meta/transient writes.
- Real reconciliation updates only changed products.
- Variable parents synchronize after variation writes.
- Page/time budget persists partial state and continues from the correct cursor.
- Concurrent operator/system runs cannot both own the reconciliation lease.
- Dead continuation can be recovered from durable operation state.

## Orders and fulfillment

- Orders list paginates and filters without N+1 Veeqo requests.
- Existing Veeqo order IDs and DTB sync state display correctly.
- Retry queues `dtb_order_sync_veeqo` through `dtb_order_enqueue_job()`.
- Retry does not call Veeqo in the REST request.
- Existing external ID prevents duplicate Veeqo order creation.
- Fulfillment/tracking projection displays without claiming unverified live provider data.

## UI and accessibility

- Old bookmark redirects to the canonical control center.
- Overview, Orders, Inventory, Fulfillment, Operations, and Settings navigation is keyboard accessible.
- Loading, empty, error, success, stale, and polling-timeout states are visible.
- Search/filter forms have labels and submit via keyboard.
- Exact-SKU drawer closes by button, backdrop, and Escape.
- Tables remain usable on mobile through contained horizontal scrolling.
- Reduced-motion preference disables non-essential animation.

## Operational acceptance

- Connection validation returns the intended Direct channel, warehouse, and delivery method.
- Dry-run exception counts are reviewed and explained.
- One controlled real reconciliation produces expected Woo stock for representative simple and variation SKUs.
- Store API/cart accepts a known in-stock SKU and rejects a known out-of-stock SKU consistently.
- One controlled paid order produces one `dtb_order_sync_veeqo` side effect and one Veeqo order.
- Replaying the order job does not create a duplicate Veeqo order.
- Veeqo fulfillment/tracking reaches the approved Woo/DTB projection.
- `dtb-orders` and `dtb-integrations` queues drain without retry amplification.
