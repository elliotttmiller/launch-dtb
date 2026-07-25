# Veeqo Operations Admin

## Ownership and authority

The Veeqo Operations console is owned by `dtb-integrations/Veeqo`. Veeqo remains the authority for sellable inventory, warehouse availability, allocation, fulfillment, carrier, and tracking. WooCommerce stores the checkout-facing inventory projection. The console does not create orders, change payment state, or expose credentials.

Admin page: `WooCommerce > Veeqo Operations`

Required capability: `manage_woocommerce`

Authentication: native WordPress admin cookie plus the WordPress REST nonce supplied by `wp-api-fetch`.

## Inventory projection contract

Canonical implementation: `VeeqoInventoryProjectionServiceV2.php`.

- Fetches `/products` using the shared page-size contract.
- Uses only the explicitly configured `warehouse_id`.
- Reads `available_stock_level`; `available_stock` is accepted only as a compatibility alias.
- Rejects null and non-numeric stock values as invalid.
- Treats missing warehouse entries and absent stock fields as unknown, never as zero.
- Requires exact SKU identity and fails closed on duplicate WooCommerce SKUs.
- Updates simple products and variations, synchronizes variable parents, and invalidates product transients.
- Supports dry run with no WooCommerce writes.
- Uses a token-owned lock with page-level heartbeat refresh.
- Uses bounded page/time execution, persists partial diagnostics, and queues continuation from the next page cursor.

The legacy `dtb_veeqo_pull_inventory_into_wc()` remains in `VeeqoClient.php` only for compatibility. Its WP-Cron schedule and worker are removed by `VeeqoRuntimePolicy.php`; Action Scheduler owns production reconciliation.

## Queue contract

Operation hook: `dtb_veeqo_inventory_operation`

Recurring reconciliation hook: `dtb_veeqo_inventory_reconcile`

Action Scheduler group: `dtb-integrations`

Operation arguments: `operation_id`, `dry_run`

Deduplication: the active-operation marker is claimed atomically with `add_option()`. Only one queued/running operator operation is allowed. The canonical reconciliation lock also prevents concurrent scheduled and operator runs.

Retries: recurring reconciliation retries transient `0`, `408`, `425`, `429`, and `5xx` failures up to three times with bounded exponential delay. Operator operations persist terminal failure and may be requeued by an operator after remediation.

Observability: operation state and the latest aggregate reconciliation report are stored as non-autoloaded WordPress options. History is bounded to 20 operation summaries; full results remain available only through the protected per-operation endpoint. Veeqo structured logs include operation ID, action ID, mode, aggregate counts, and redacted errors.

Rollback: remove `VeeqoOperationsAdmin.php` and `VeeqoInventoryProjectionServiceV2.php` from `dtb-integrations/bootstrap.php` only if the rollback bootstrap continues to load `VeeqoRuntimePolicy.php`. Keep the runtime retirement guard active, clear pending `dtb-integrations` Veeqo actions, and verify `dtb_veeqo_inventory_sync` is absent from WP-Cron. Do not restore a bootstrap or recovery state that permits `VeeqoClient.php` to schedule or execute the retired legacy inventory cron.

## REST endpoints

All routes below require `manage_woocommerce`:

- `GET /dtb/v1/veeqo/admin/operations/overview`
- `GET /dtb/v1/veeqo/admin/operations/sku?sku={exact-sku}`
- `POST /dtb/v1/veeqo/admin/operations/reconcile` with `{ "dry_run": true|false }`
- `GET /dtb/v1/veeqo/admin/operations/{operation_id}`
- `GET /dtb/v1/veeqo/admin/inventory/diagnostics`
- `GET /dtb/v1/veeqo/inventory` for the WooCommerce projection
- `POST /dtb/v1/veeqo/admin/connection/test`

The SKU inspector returns redacted WooCommerce mapping data and Veeqo sellable/warehouse stock fields. It never returns the API key, webhook secret, authorization headers, or raw credential-bearing responses.

## Deployment and verification

1. Deploy all changed `dtb-integrations` files from one commit.
2. Confirm PHP syntax for every changed PHP file.
3. Run `scripts/smoke-dtb-mu-modules.ps1` and targeted negative REST permission tests.
4. Confirm wp-admin loads without `Cannot redeclare dtb_veeqo_pull_inventory_into_wc()`.
5. Open `WooCommerce > Veeqo Operations` and run connection validation.
6. Inspect a known exact SKU and confirm the configured warehouse reports the expected `available_stock_level`.
7. Queue a dry run and review pages, sellables, projected updates, unmapped SKUs, duplicates, missing warehouse entries, and invalid entries.
8. Queue a real reconciliation only after the dry run is acceptable.
9. Verify representative simple products and variations in WooCommerce.
10. Restore production debug settings and inspect structured logs and Action Scheduler state.
