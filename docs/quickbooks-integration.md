# QuickBooks Online Integration

## Ownership

QuickBooks Online is an accounting projection only. WooCommerce owns customers, orders, payments, and refunds. DTB owns eligibility, idempotency, the event ledger, Action Scheduler jobs, retries, integration state, and operator recovery.

The only supported accounting write path is:

```text
WooCommerce captured payment or concrete refund
→ DTB event ledger
→ dtb-orders Action Scheduler queue
→ QuickBooks accounting pipeline
→ Intuit Accounting API
→ read-after-write reconciliation
```

The removed legacy daily scan and direct manual batch synchronization must not be restored.

## Runtime configuration

Credentials are server-owned and must not be committed to GitHub, saved through WordPress settings, exposed to the frontend, or included in deployment artifacts.

```php
define( 'DTB_QBO_ENVIRONMENT', 'sandbox' );
define( 'DTB_QBO_CLIENT_ID', '<Intuit development client ID>' );
define( 'DTB_QBO_CLIENT_SECRET', '<Intuit development client secret>' );
```

`DTB_QBO_ENVIRONMENT` accepts only `sandbox` or `production`. Sandbox and production tokens, realm IDs, company verification, and customer mappings are stored separately.

The OAuth redirect URI is returned by the administrator status and connect endpoints. Register the exact value in the Intuit developer application under development redirect URIs before connecting.

## Operator API

QuickBooks operator behavior is backend-owned and does not depend on a WordPress submenu. A future admin workbench may call the same API without owning OAuth, tokens, or accounting logic.

All routes require an authenticated WordPress user with `manage_options` and normal WordPress REST nonce authentication.

```text
GET  /wp-json/dtb/v1/admin/qbo/status
POST /wp-json/dtb/v1/admin/qbo/connect
POST /wp-json/dtb/v1/admin/qbo/test
POST /wp-json/dtb/v1/admin/qbo/disconnect
```

### Status

Returns only redacted operational state:

- active environment;
- whether server credentials are configured;
- whether OAuth is connected;
- whether the company is verified;
- verified company name;
- masked realm suffix;
- access-token expiration timestamp;
- exact redirect URI.

It never returns the Client Secret, access token, refresh token, full realm ID, authorization code, or raw Intuit response.

### Connect

`POST /admin/qbo/connect` creates a new one-time OAuth transaction and returns:

```json
{
  "ok": true,
  "environment": "sandbox",
  "authorization_url": "https://appcenter.intuit.com/connect/oauth2?...",
  "redirect_uri": "https://example.com/wp-admin/admin-ajax.php?action=dtb_qbo_oauth_callback"
}
```

The operator opens `authorization_url` in the same authenticated administrator browser session. The URL is short-lived and should not be logged or reused.

### Test

`POST /admin/qbo/test` performs a read-only `CompanyInfo` request and refreshes the verified company snapshot. It creates no customer, order, SalesReceipt, RefundReceipt, or accounting entry.

### Disconnect

`POST /admin/qbo/disconnect` requires:

```json
{
  "confirm": true
}
```

It removes tokens, realm ID, and company verification only for the active environment. It does not delete WooCommerce data, event-ledger entries, Action Scheduler history, QuickBooks transactions, or the other QuickBooks environment.

## OAuth callback behavior

The Intuit callback remains:

```text
/wp-admin/admin-ajax.php?action=dtb_qbo_oauth_callback
```

The callback is owned by `QuickBooksOAuthController.php`. It:

1. requires an authenticated administrator;
2. consumes a random, user-bound, environment-bound, redirect-bound one-time state transaction;
3. exchanges the authorization code for tokens;
4. stores tokens in the active environment namespace;
5. verifies the selected company using `CompanyInfo`;
6. clears the connection if token storage or company verification fails;
7. redirects to the normal WordPress dashboard with a redacted success or failure notice.

There is no dependency on a `DTB Ops` menu or QuickBooks settings page.

## Required QuickBooks item references

The launch projection uses aggregate QuickBooks items unless a product has an explicit QuickBooks item ID in product metadata.

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

Tax remains optional until an accountant-approved QuickBooks tax representation is configured:

```php
define( 'DTB_QBO_ITEM_TAX_ID', '<QBO tax item ID>' );
define( 'DTB_QBO_ITEM_TAX_NAME', 'Sales Tax' );
```

Missing required references fail closed. Numeric fallback IDs are prohibited.

## OAuth and token handling

- OAuth state is random, administrator-bound, environment-bound, redirect-bound, single-use, and expires after ten minutes.
- Access and refresh tokens are encrypted with AES-256-GCM using a key derived from the WordPress authentication secret.
- Legacy AES-CBC token payloads are read only for migration and are rewritten in the current format after a successful token save.
- Refreshes are protected by an option-backed cross-worker lock.
- The latest refresh token returned by Intuit replaces the previous token atomically.
- Browser and log output never include authorization codes, access tokens, refresh tokens, Client Secrets, or raw Intuit responses.

## Accounting projection

### SalesReceipt

A SalesReceipt is eligible only when WooCommerce has both `date_paid` and a non-empty payment transaction reference. The queue worker:

1. acquires the existing QuickBooks integration lock;
2. queries QuickBooks by deterministic `DocNumber` (`DTB-{order_id}`);
3. reconciles an existing entity when present;
4. creates a SalesReceipt only when absent;
5. queries it again after creation;
6. records the entity ID only after successful reconciliation.

### RefundReceipt

Each concrete WooCommerce refund is projected independently. The deterministic document number is `DTB-R-{refund_id}` and the authoritative local idempotency marker is refund-specific order metadata.

Two partial refunds therefore produce two distinct RefundReceipts. Duplicate queue execution reconciles the existing transaction rather than creating another.

## Customer projection

Registered WooCommerce users store an environment-specific QuickBooks customer ID. When no mapping exists, DTB searches by normalized billing email, then creates a customer with a stable DTB reference embedded in the display name. Customer creation failure blocks the accounting projection; there is no generic-customer fallback.

## Sandbox operator workflow

1. Deploy the reviewed QuickBooks MU-plugin change set.
2. Configure server-owned sandbox credentials and aggregate-item IDs.
3. Call `GET /wp-json/dtb/v1/admin/qbo/status` using an authenticated administrator REST session.
4. Copy the returned `redirect_uri` into the Intuit development redirect URI configuration.
5. Call `POST /wp-json/dtb/v1/admin/qbo/connect` with a valid WordPress REST nonce.
6. Open the returned `authorization_url` in the same administrator browser session.
7. Authorize the intended sandbox company.
8. Confirm the WordPress dashboard reports a successful connection.
9. Call `POST /wp-json/dtb/v1/admin/qbo/test` and confirm the verified company.
10. Create a paid WooCommerce test order using the approved checkout path.
11. Confirm the `dtb-orders` QuickBooks job succeeds and exactly one SalesReceipt exists.
12. Re-run the same job and confirm no duplicate is created.
13. Create two partial WooCommerce refunds and confirm two distinct RefundReceipts.

## Production cutover

Production uses the same code, controller, REST contract, and queue path. Change only the environment, production credentials, registered production redirect URI, OAuth connection, realm, and verified production item references. Never copy sandbox tokens, realm IDs, customer mappings, or item IDs into production.

## Rollback

Disable QuickBooks writes by removing or disabling the server-owned QuickBooks credentials, restore the previous reviewed MU-plugin files, clear SiteGround caches, and verify checkout and the `dtb-orders` queue continue operating without QuickBooks. Existing WooCommerce orders, refunds, event-ledger records, and Action Scheduler history must not be deleted.
