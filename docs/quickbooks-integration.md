# QuickBooks Online Integration

## Ownership

QuickBooks Online is an accounting projection only. WooCommerce owns customers, orders, payments, and refunds. DTB owns eligibility, idempotency, the event ledger, Action Scheduler jobs, retries, integration state, and operator recovery.

The only supported write path is:

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

Credentials are server-owned and must not be committed to GitHub.

```php
define( 'DTB_QBO_ENVIRONMENT', 'sandbox' );
define( 'DTB_QBO_CLIENT_ID', '<Intuit development client ID>' );
define( 'DTB_QBO_CLIENT_SECRET', '<Intuit development client secret>' );
```

`DTB_QBO_ENVIRONMENT` accepts only `sandbox` or `production`. Sandbox and production tokens, realm IDs, company verification, and customer mappings are stored separately.

The exact redirect URI is displayed in **DTB Ops → QuickBooks**. Register that exact value in the Intuit developer application under development redirect URIs before connecting.

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

## Operator workflow

1. Configure server-owned sandbox constants.
2. Create the aggregate Product Sales, Shipping, Discount, and Refund items in the QuickBooks sandbox.
3. Configure their QuickBooks IDs as server-owned constants.
4. Register the exact redirect URI shown in **DTB Ops → QuickBooks** with Intuit.
5. Select **Connect QuickBooks Sandbox** and authorize the intended sandbox company.
6. Confirm the admin page reports Sandbox, Connected, and a verified company name.
7. Create a paid WooCommerce test order using the approved checkout path.
8. Confirm the `dtb-orders` QuickBooks job succeeds and exactly one SalesReceipt exists.
9. Re-run the same job and confirm no duplicate is created.
10. Create two partial WooCommerce refunds and confirm two distinct RefundReceipts.

## Production cutover

Production uses the same code and queue path. Change only the environment, production credentials, registered production redirect URI, OAuth connection, realm, and verified production item references. Never copy sandbox tokens, realm IDs, customer mappings, or item IDs into production.

## Rollback

Disable QuickBooks writes by removing or disabling the server-owned QuickBooks credentials, restore the previous reviewed MU-plugin files, clear SiteGround caches, and verify checkout and the `dtb-orders` queue continue operating without QuickBooks. Existing WooCommerce orders, refunds, event-ledger records, and Action Scheduler history must not be deleted.
