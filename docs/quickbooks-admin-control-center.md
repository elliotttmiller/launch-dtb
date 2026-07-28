# QuickBooks Control Center

## Ownership

The QuickBooks Control Center is owned by the WordPress MU-plugin integration module:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/QuickBooks/
```

QuickBooks remains an accounting projection only. WooCommerce owns customers, orders, captured payments, and refunds. DTB owns validation, idempotency, the event ledger, Action Scheduler orchestration, integration state, retries, reconciliation, and operator recovery.

The control center does not create WooCommerce orders, bypass the event ledger, execute accounting writes in the browser request path, or replace the `dtb-orders` queue.

## Admin route

```text
/wp/wp-admin/admin.php?page=dtb-quickbooks
```

The page is registered in the DTB operations library with `manage_options` authorization. It provides:

- active environment and company status;
- OAuth, token, company, webhook, and accounting-item readiness;
- exact accounting item discovery and environment-scoped mapping;
- connection testing;
- OAuth connection and confirmed disconnection controls;
- the authoritative WooCommerce → event ledger → `dtb-orders` → QuickBooks workflow;
- redacted OAuth and webhook endpoint diagnostics.

## BrikPanel integration

BrikPanel owns global wp-admin chrome, navigation, typography, and global control styling.

The QuickBooks module adds only a scoped application surface rooted at:

```text
.dtb-qbo-admin
```

The component stylesheet is loaded as inline CSS attached to WordPress' stable `common` admin handle because the DTB admin platform intentionally removes separately enqueued DTB MU-plugin styles. This preserves the global BrikPanel ownership boundary while allowing the integration to own its internal layout, responsive behavior, states, and accessibility.

The scoped layer:

- does not style `body`, `#adminmenu`, `#wpadminbar`, generic WordPress tables, or third-party screens;
- uses BrikPanel-compatible CSS custom-property fallbacks where available;
- inherits global typography and WordPress button behavior;
- supports reduced motion and responsive layouts;
- contains no remote fonts, images, or third-party UI dependencies.

## Operator REST API

Existing OAuth operations remain:

```text
GET  /wp-json/dtb/v1/admin/qbo/status
POST /wp-json/dtb/v1/admin/qbo/connect
POST /wp-json/dtb/v1/admin/qbo/test
POST /wp-json/dtb/v1/admin/qbo/disconnect
```

The control center adds:

```text
GET  /wp-json/dtb/v1/admin/qbo/dashboard
POST /wp-json/dtb/v1/admin/qbo/items/discover
```

Every route requires an authenticated WordPress administrator with `manage_options`. Browser writes require the WordPress REST nonce. Responses remain redacted and never expose client secrets, webhook verifier tokens, access tokens, refresh tokens, authorization codes, or full realm IDs.

## Accounting item mapping

The accounting projection requires four exact active QuickBooks `Service` items:

```text
DTB Product Sales
DTB Shipping
DTB Discount
DTB Refund
```

`POST /admin/qbo/items/discover` performs four bounded exact-name QuickBooks queries. It does not create or mutate remote QuickBooks records.

For each role it requires:

- exactly one result;
- the exact canonical name;
- `Type = Service`;
- `Active = true`;
- a non-empty QuickBooks Item ID.

Verified mappings are stored in environment-scoped WordPress options:

```text
dtb_qbo_sandbox_item_product_id
dtb_qbo_sandbox_item_shipping_id
dtb_qbo_sandbox_item_discount_id
dtb_qbo_sandbox_item_refund_id
```

Production uses the corresponding `dtb_qbo_production_*` options. Sandbox and production mappings therefore cannot overwrite one another.

The existing `DTB_QBO_ITEM_*_ID` and `DTB_QBO_ITEM_*_NAME` constants remain supported as immutable operator overrides. When constants are present, the discovery workflow verifies them but never rewrites them.

Legacy unscoped options remain a read-only compatibility fallback for existing deployments. New mappings are never written to the legacy option names.

## Readiness contract

The dashboard reports ready only when all five checks pass:

1. active-environment OAuth credentials are configured;
2. OAuth tokens and realm are connected;
3. the selected QuickBooks company is verified;
4. all four required Service items are mapped;
5. signed webhook verification is configured.

Readiness is informational and fail-closed. The accounting pipeline independently requires item references and a connected QuickBooks client before projecting an order or refund.

## OAuth completion UX

The Intuit callback remains:

```text
/wp/wp-admin/admin-ajax.php?action=dtb_qbo_oauth_callback
```

The existing hardened state validation, single-use transaction, token exchange, encrypted storage, and company verification remain unchanged. After the callback, a bounded admin redirect moves the operator from the WordPress dashboard to the QuickBooks Control Center while preserving only the redacted result code.

The control center initiates OAuth in the same browser tab. This avoids stale popup tabs and keeps the administrator-bound WordPress session available to the callback.

## Security and data integrity

- `manage_options` is required for page access and REST operations.
- REST requests use the WordPress `wp_rest` nonce.
- Item discovery is read-only against QuickBooks.
- Mapping writes use environment-scoped WordPress options with autoload disabled.
- Constant-backed mappings cannot be changed through the UI.
- Disconnect requires explicit confirmation.
- Disconnect clears tokens, realm, and company snapshot only; it does not delete WooCommerce data, Action Scheduler history, event-ledger records, or QuickBooks transactions.
- All accounting writes remain queue-owned and idempotent.
- Logs and API responses remain redacted.

## Validation

Before deployment:

1. Run `php -l` on all changed PHP files.
2. Run `node --check` on `quickbooks-admin.js`.
3. Confirm the QuickBooks page appears under the Drywall Toolbox operations menu.
4. Confirm BrikPanel global navigation and wp-admin chrome remain unchanged.
5. Confirm the page works at desktop, tablet, and mobile wp-admin widths.
6. Confirm keyboard focus, tabs, controls, copy actions, and reduced-motion behavior.
7. Confirm `/admin/qbo/dashboard` returns only redacted data.
8. Run **Test connection** and require HTTP 200.
9. Run **Discover and map** and verify all four exact Service items and IDs appear.
10. Confirm the mapped option names are isolated to the active environment.
11. Confirm the readiness score reaches 100% only when every prerequisite passes.
12. Confirm connect uses a correctly encoded OAuth URL and returns to the control center.
13. Confirm disconnect requires confirmation and does not delete orders, refunds, queue history, or QuickBooks transactions.
14. Execute one controlled captured-payment sandbox order through the canonical queue and verify exactly one reconciled SalesReceipt.

## Deployment

Deployment is operator-managed through FileZilla. Transfer the complete dependency-consistent QuickBooks change set from reviewed canonical source. Do not transfer repository documentation into WordPress production.

Before transfer, create independent file and database backups. After transfer, clear SiteGround dynamic/object caches and PHP OPcache, then run the acceptance checks above.

## Rollback

Restore the prior reviewed versions of the changed MU-plugin files and remove the newly added QuickBooks Control Center files. Clear SiteGround and PHP caches. Existing environment-scoped item mapping options may remain because older code ignores them; they can also be deleted after backup if a complete rollback is required.

Do not delete WooCommerce orders, refunds, customer data, event-ledger records, Action Scheduler history, webhook audit records, encrypted token backups, or existing QuickBooks transactions.
