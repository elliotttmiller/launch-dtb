# QuickBooks Online Integration

## Ownership

QuickBooks Online is an accounting projection only. WooCommerce owns customers, orders, payments, and refunds. DTB owns eligibility, idempotency, the event ledger, Action Scheduler jobs, retries, integration state, webhook reconciliation, and operator recovery.

The only supported write path is:

```text
WooCommerce captured payment or concrete refund
→ DTB event ledger
→ dtb-orders Action Scheduler queue
→ QuickBooks accounting pipeline
→ Intuit Accounting API
→ read-after-write reconciliation
```

QuickBooks webhooks are inbound reconciliation signals only. They must never create WooCommerce orders, payments, or refunds.

## Runtime configuration

Credentials and verifier tokens are server-owned and must not be committed to GitHub.

```php
define( 'DTB_QBO_ENVIRONMENT', 'sandbox' );
define( 'DTB_QBO_CLIENT_ID', '<Intuit development client ID>' );
define( 'DTB_QBO_CLIENT_SECRET', '<Intuit development client secret>' );
define( 'DTB_QBO_WEBHOOK_VERIFIER_TOKEN', '<Intuit development webhook verifier token>' );
```

Sandbox and production credentials, tokens, realm IDs, verifier tokens, item references, company verification, and customer mappings must remain isolated.

## Operator API

There is no dependency on a `DTB Ops` menu. The permanent administrator API is:

```text
GET  /wp-json/dtb/v1/admin/qbo/status
POST /wp-json/dtb/v1/admin/qbo/connect
POST /wp-json/dtb/v1/admin/qbo/test
POST /wp-json/dtb/v1/admin/qbo/disconnect
```

Every operator route requires an authenticated WordPress administrator with `manage_options`. Browser requests also require a valid WordPress REST nonce.

The connect route returns the one-time Intuit authorization URL and exact OAuth redirect URI. The OAuth callback remains:

```text
/wp-admin/admin-ajax.php?action=dtb_qbo_oauth_callback
```

## Required QuickBooks item references

```php
define( 'DTB_QBO_ITEM_PRODUCT_ID', '<QBO product-sales item ID>' );
define( 'DTB_QBO_ITEM_PRODUCT_NAME', 'DTB Product Sales' );
define( 'DTB_QBO_ITEM_SHIPPING_ID', '<QBO shipping item ID>' );
define( 'DTB_QBO_ITEM_SHIPPING_NAME', 'DTB Shipping' );
define( 'DTB_QBO_ITEM_DISCOUNT_ID', '<QBO discount item ID>' );
define( 'DTB_QBO_ITEM_DISCOUNT_NAME', 'DTB Discount' );
define( 'DTB_QBO_ITEM_REFUND_ID', '<QBO refund item ID>' );
define( 'DTB_QBO_ITEM_REFUND_NAME', 'DTB Refund' );
```

Missing required references fail closed. Numeric fallback IDs are prohibited.

## Webhook endpoint

Configure the Intuit development webhook endpoint as:

```text
https://elliottm4.sg-host.com/wp-json/dtb/v1/webhooks/qbo
```

The endpoint:

1. reads the raw request body;
2. calculates HMAC-SHA256 using `DTB_QBO_WEBHOOK_VERIFIER_TOKEN`;
3. compares the Base64 result to the `intuit-signature` header with `hash_equals`;
4. validates the CloudEvents array and allowlisted event types;
5. enqueues each accepted event into the existing `dtb-orders` Action Scheduler group;
6. returns HTTP 200 without calling the QuickBooks API in the request path.

The current allowlist is intentionally narrow:

```text
SalesReceipt: Create, Update, Void, Delete
RefundReceipt: Create, Update, Void, Delete
```

Do not subscribe to Account, Bill, Invoice, Payment, Vendor, Employee, Purchase, JournalEntry, or other unrelated entities. DTB does not own those domains and receiving them adds retry load, noise, and unnecessary attack surface.

Enable **cloud event payload format**. The controller is built for the current CloudEvents array payload (`specversion`, `id`, `type`, `time`, `intuitentityid`, and `intuitaccountid`). Do not switch payload formats without updating and testing the parser first.

Webhook delivery is at-least-once and may be out of order. DTB deduplicates by Intuit event ID for 30 days, validates the connected realm, and records external SalesReceipt update/void/delete signals as reconciliation state. Webhooks do not automatically overwrite WooCommerce authority.

## OAuth and token handling

- OAuth state is random, administrator-bound, environment-bound, redirect-bound, single-use, and expires after ten minutes.
- Access and refresh tokens are encrypted with AES-256-GCM using a key derived from the WordPress authentication secret.
- Refreshes are protected by an option-backed cross-worker lock.
- Browser and log output never include authorization codes, access tokens, refresh tokens, Client Secrets, verifier tokens, or raw Intuit responses.

## Validation

1. Deploy the complete reviewed QuickBooks change set.
2. Configure sandbox credentials and verifier token outside GitHub.
3. Confirm the status endpoint reports `sandbox` and credentials configured.
4. Register the exact OAuth redirect URI returned by the connect endpoint.
5. Complete OAuth and verify the intended sandbox company.
6. Register the webhook endpoint and select only the allowlisted events.
7. Enable CloudEvents payload format.
8. Trigger a sandbox SalesReceipt update and confirm Intuit receives HTTP 200.
9. Confirm an Action Scheduler job is created in the `dtb-orders` group.
10. Replay the same event and confirm it is deduplicated.
11. Send an invalid signature and confirm HTTP 401.
12. Create one captured-payment test order and verify exactly one SalesReceipt.
13. Re-run the same accounting job and verify no duplicate.

## Production cutover

Production uses the same code and queue path. Change only the environment, production credentials, production verifier token, registered production OAuth redirect URI, production webhook endpoint configuration, OAuth connection, realm, and verified production item references. Never copy sandbox secrets, tokens, realm IDs, mappings, or item IDs into production.

## Rollback

Remove or disable the server-owned QuickBooks credentials and webhook verifier token, restore the previous reviewed MU-plugin files, clear SiteGround caches, and verify checkout plus the `dtb-orders` queue continue operating without QuickBooks. Do not delete WooCommerce orders, refunds, event-ledger records, Action Scheduler history, or existing QuickBooks transactions.
