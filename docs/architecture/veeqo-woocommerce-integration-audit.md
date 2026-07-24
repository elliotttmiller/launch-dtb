# Veeqo + WooCommerce Production Integration Audit

## Scope

This document records the audited production contract for the Drywall Toolbox Veeqo/WooCommerce pipeline and the hardening implemented after the July 2026 integration review.

## System-of-record boundaries

- WooCommerce owns products, customers, orders, payments, refunds, and Store API cart/session state.
- DTB owns checkout orchestration, order event persistence, write boundaries, queues, idempotency, retries, operator recovery, projections, and integration policy.
- Veeqo owns sellable inventory, warehouse availability, allocation, picking/packing, labels, shipment execution/status, carrier, and tracking.
- QuickBooks receives accounting projections only after eligible WooCommerce payment/refund events.
- React is a renderer/interaction client and never becomes inventory or order authority.

## Canonical order path

```text
Store API cart
  -> POST /dtb/v1/checkout/session
  -> /checkout/confirm
  -> /checkout/finalize
  -> WooCommerce order/payment commit
  -> DTB event ledger
  -> dtb-orders Action Scheduler queue
  -> dtb_order_sync_veeqo
  -> one Veeqo order
  -> Veeqo fulfillment
  -> DTB fulfillment/tracking projection
  -> WooCommerce/customer UI
```

Veeqo order creation is asynchronous. Checkout, payment confirmation, and webhook acknowledgement must never wait on Veeqo network calls.

## Production configuration

Server secret:

- `DTB_VEEQO_API_KEY` — required; never stored in browser code, WordPress options, REST responses, or logs.

Operational identities:

- validated Veeqo Direct channel ID
- validated fulfillment warehouse ID
- validated delivery method ID

`VeeqoProductionConfiguration.php` is the sole WooCommerce integration settings owner. Discovery is fail-closed: one candidate may be selected automatically; multiple candidates require explicit operator selection.

Order projection is not considered ready merely because an API key exists. `dtb_veeqo_sync_order()` requires full production readiness before a queued order can be projected.

## Inventory authority and projection

Veeqo inventory is projected into WooCommerce because WooCommerce Store API/cart validation must use the same stock state the storefront displays.

Canonical direction:

```text
Veeqo configured warehouse
  -> Veeqo sellable SKU + stock entry
  -> exact WooCommerce SKU identity
  -> WooCommerce manage_stock / quantity / stock_status
  -> Store API + DTB cart-availability
  -> React product/cart UX
```

There is no WooCommerce-to-Veeqo stock feedback loop.

### Canonical worker

Owner: `dtb-integrations/Veeqo/VeeqoInventoryProjectionService.php`

Recurring trigger hook:

- `dtb_veeqo_inventory_reconcile_recurring`

Reconciliation/retry hook:

- `dtb_veeqo_inventory_reconcile`

Action Scheduler group:

- `dtb-integrations`

Cadence:

- every 15 minutes when API key + warehouse mapping are configured

Idempotency/deduplication:

- a durable atomic reconciliation lease prevents overlapping full runs
- recurring trigger and immediate reconciliation use different hook identities so a future recurring action does not suppress an operator-requested immediate run
- unchanged WooCommerce stock is not rewritten

Retry policy:

- retry only transport/timeout/rate-limit/5xx classes
- exponential delay
- maximum 3 retries
- configuration/validation/4xx failures are terminal until operator correction

Observability:

- diagnostics option: `dtb_veeqo_inventory_reconciliation_diagnostics`
- health reports initialization/staleness and exception counts
- WooCommerce logger source remains `veeqo-wc-integration`

Recovery:

- operator may enqueue a reconciliation with `POST /dtb/v1/veeqo/admin/inventory/reconcile`
- legacy `POST /dtb/v1/veeqo/map-skus` and `/veeqo/inventory/pull` are compatibility aliases to the same asynchronous reconciliation; they no longer perform N external calls or catalog writes in an interactive request
- diagnostics: `GET /dtb/v1/veeqo/admin/inventory/diagnostics`

All admin routes require `manage_woocommerce`.

### Stock semantics

Only the explicitly configured Veeqo warehouse is authoritative for the WooCommerce projection.

For finite stock:

- WooCommerce `manage_stock = true`
- quantity = Veeqo available stock
- stock status = `instock` when available > 0, otherwise `outofstock`

For Veeqo infinite inventory:

- WooCommerce `manage_stock = false`
- stock status = `instock`

Missing warehouse stock entries, unknown stock schemas, duplicate WooCommerce SKUs, and missing SKU mappings are exceptions. They are reported and skipped; they are never silently converted to zero inventory.

Variable-product parents are synchronized after child variation updates and product transients are invalidated.

## SKU identity

SKU is the canonical cross-system product identity for inventory/order line mapping.

Exact relationship:

```text
WooCommerce SKU == DTB canonical SKU == Veeqo sellable sku_code
```

The reconciliation worker also persists:

- `_veeqo_sellable_id`
- `_veeqo_mapped_sku`

Legacy product-save behavior that called Veeqo synchronously for every WooCommerce product save is disabled. Mapping now happens asynchronously during inventory reconciliation, removing an external API dependency from interactive catalog writes.

## Order projection idempotency

The canonical Veeqo order projection:

- runs from the DTB order queue, never from browser/raw Woo order creation
- requires production readiness
- uses the atomic integration lease
- refuses to create another Veeqo order when `_dtb_veeqo_order_id`/`_veeqo_order_id` is already present
- sets stable correlation key `veeqo-order:{woo_order_id}:v1`
- sends the same stable value as the Veeqo order channel reference and request idempotency key
- stores Veeqo order ID and integration state back on the WooCommerce order
- classifies retryable vs terminal failures

## Shipping

DTB currently calculates checkout shipping policy locally. The Veeqo integration must not be described or operated as live Veeqo carrier rating.

The configured Veeqo delivery method is an order-projection/fulfillment mapping requirement. It does not make checkout rates live Veeqo rates.

A future multi-method mapping must explicitly map each DTB shipping-policy method to a validated Veeqo delivery method rather than silently using an arbitrary first method.

## Fulfillment and tracking inbound

Veeqo remains fulfillment authority. Inbound fulfillment state must be authenticated, deduplicated, persisted, acknowledged quickly, and processed asynchronously before updating WooCommerce/customer projections.

The existing webhook pipeline contains replay/idempotency/queue controls, but the exact public Veeqo webhook signing contract has not been verified from the current upstream API documentation.

Therefore production webhook policy is fail-closed:

- `DTB_VEEQO_ENABLE_VERIFIED_WEBHOOKS` defaults to `false`
- `DTB_VEEQO_WEBHOOK_SECRET` remains empty by default
- legacy automatic Veeqo webhook registration is disabled
- webhook ingress returns unavailable unless both explicit activation and verified secret configuration are present

Polling/reconciliation is the safe fallback until the upstream authentication contract is proven.

## Storefront availability

Public storefront code must not fetch the bulk Veeqo inventory feed.

Use:

- `POST /dtb/v1/veeqo/cart-availability`

That endpoint reads WooCommerce's Veeqo-projected stock, preserving one checkout-facing truth.

Product cards, product detail, cart controls, and checkout must agree with WooCommerce `is_in_stock()` and projected quantity. A frontend display of `In stock` while WooCommerce rejects add-to-cart is a production defect and indicates stale/mismatched catalog projection or client normalization/cache state.

## Health gates

Veeqo health is not green until:

- API key configured server-side
- Direct channel configured
- warehouse configured
- delivery method configured
- inventory projection initialized at least once
- last inventory projection is not stale (> 2 hours)

Health surfaces redacted configuration only.

## Operational queue risk

The July 2026 WooCommerce status snapshot showed a large historical Action Scheduler failure count and must be treated as a launch gate. Before production activation, operators must inspect failed actions by hook/group, distinguish historical resolved failures from active recurring failures, repair cron/runner health, and verify both `dtb-orders` and `dtb-integrations` queues drain normally.

Do not bulk-delete failed actions until failure classes and recovery requirements are understood.

## Launch verification

1. Configure the dedicated Veeqo API credential server-side.
2. Validate Direct channel, warehouse, and delivery method; require production readiness.
3. Enqueue inventory reconciliation.
4. Require reconciliation diagnostics with zero unexplained duplicate SKU mappings and review all unmapped/missing-stock exceptions.
5. Verify representative simple and variation SKUs: Veeqo available -> Woo quantity/status -> cart-availability -> product UI.
6. Verify a known in-stock SKU can be added through Store API/cart.
7. Place one controlled paid test order through the canonical checkout flow.
8. Verify exactly one `dtb_order_sync_veeqo` side effect and exactly one Veeqo order.
9. Retry/reconcile the same Woo order and prove no duplicate Veeqo order is created.
10. Fulfill/ship in Veeqo and verify tracking projection through the approved inbound reconciliation mechanism.
11. Verify QuickBooks remains accounting-only.
12. Inspect Action Scheduler and WooCommerce Veeqo logs for terminal/retry amplification or stuck work.

## Rollback

The code deployment can be rolled back without database migration. Inventory projection writes normal WooCommerce stock fields and Veeqo mapping metadata; rollback does not automatically revert those values.

If a bad warehouse mapping is discovered:

1. disable/clear the incorrect warehouse mapping or Veeqo API key to stop new inventory projection work
2. cancel pending `dtb_veeqo_inventory_reconcile*` actions after identifying them
3. restore the correct warehouse mapping
4. enqueue a fresh authoritative reconciliation
5. verify representative SKUs before reopening checkout

Never restore stock by bulk-marking every product `instock`; reconcile from the Veeqo authority.
