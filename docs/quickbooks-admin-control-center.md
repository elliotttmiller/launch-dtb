# QuickBooks Enterprise Operations Workspace

## Ownership

- WooCommerce owns orders, captured payments, refunds, and customers.
- DTB owns accounting eligibility, event-ledger state, queueing, retries, idempotency, reconciliation, and operator recovery.
- QuickBooks owns the accounting projection.

All accounting writes remain queue-owned through `dtb-orders`.

## Workspace

Route:

```text
/wp/wp-admin/admin.php?page=dtb-quickbooks
```

Primary sections:

- **Overview** — recent accounting volume, projection health, readiness, and latest orders.
- **Sales** — WooCommerce orders and their SalesReceipt projection state.
- **Refunds** — concrete refunds and RefundReceipt projection state.
- **Customers** — bounded customer projection summary.
- **Reconciliation** — paid orders not yet reconciled to a QuickBooks entity.
- **Activity** — QuickBooks-related Action Scheduler activity in `dtb-orders`.
- **Settings** — connection, readiness, accounting mappings, workflow, and diagnostics.

Configuration, workflow, and diagnostics are consolidated under Settings. Operational tabs are reserved for production usage.

## Live synchronization model

The browser polls the active bounded read model every 15 seconds while visible and refreshes immediately when the tab regains focus. This is near-real-time operator observability, not inline remote accounting execution.

```text
WooCommerce captured order/refund
→ DTB event ledger and eligibility guards
→ Action Scheduler group dtb-orders
→ deterministic document-number reconciliation
→ QuickBooks SalesReceipt or RefundReceipt
→ read-after-write verification
→ WooCommerce projection metadata
```

The application never creates QuickBooks accounting records directly from a browser request. Reconciliation controls only queue eligible work through the canonical pipeline.

## REST contracts

```text
GET  /wp-json/dtb/v1/admin/qbo/dashboard
POST /wp-json/dtb/v1/admin/qbo/items/discover
POST /wp-json/dtb/v1/admin/qbo/test
POST /wp-json/dtb/v1/admin/qbo/connect
POST /wp-json/dtb/v1/admin/qbo/disconnect
GET  /wp-json/dtb/v1/admin/qbo/enterprise?view=<view>&limit=<1-100>&page=<n>
POST /wp-json/dtb/v1/admin/qbo/sync/queue
```

Enterprise views:

```text
overview
transactions
refunds
customers
reconciliation
activity
```

Every route requires an authenticated administrator and WordPress REST nonce behavior. Responses are redacted and do not expose OAuth tokens, secrets, full realm IDs, payment data, or server paths.

## Bounded reads

- Overview samples the 100 most recent orders.
- Paginated transaction views default to 25 and cap at 100.
- Customer aggregation is bounded to recent orders.
- Activity is limited to recent `dtb-orders` actions and filtered to QuickBooks hooks.
- No remote QuickBooks query is executed on every browser poll.

## Deployment and rollback

Deploy the complete dependency-consistent QuickBooks application change set from merged canonical source. Back up changed files and the database, transfer through FileZilla, clear SiteGround caches and PHP OPcache, then validate every workspace tab and one controlled sandbox projection.

Rollback restores the previous QuickBooks admin page, enterprise controller, JavaScript, CSS, and integration bootstrap as one set. Do not delete WooCommerce records, event-ledger records, Action Scheduler history, OAuth state, mappings, or QuickBooks transactions.
