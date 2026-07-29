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
define( 'DTB_QBO_SANDBOX_WEBHOOK_VERIFIER_TOKEN', '<Intuit development webhook verifier token>' );
define( 'DTB_QBO_PRODUCTION_WEBHOOK_VERIFIER_TOKEN', '<Intuit production webhook verifier token>' );
```

The environment-specific verifier constants are preferred. `DTB_QBO_WEBHOOK_VERIFIER_TOKEN` remains a compatibility fallback for an existing single-environment deployment and should not be used when both sandbox and production are configured.

Sandbox and production credentials, tokens, realm IDs, verifier tokens, item references, company verification, and customer mappings must remain isolated.

## Operator API

There is no dependency on a `DTB Ops` menu. The permanent administrator API is:

```text
GET  /wp-json/dtb/v1/admin/qbo/status
GET  /wp-json/dtb/v1/admin/qbo/dashboard
POST /wp-json/dtb/v1/admin/qbo/connect
POST /wp-json/dtb/v1/admin/qbo/test
POST /wp-json/dtb/v1/admin/qbo/disconnect
POST /wp-json/dtb/v1/admin/qbo/items/discover
POST /wp-json/dtb/v1/admin/qbo/sync
```

`items/discover` is read-only against QuickBooks (it never creates or mutates
remote records) and only writes local managed-mapping options. `sync` queues
unsynced paid/fulfilled orders for accounting projection through the existing
`dtb-orders` queue; it does not write to QuickBooks synchronously. A
same-shaped top-level route, `POST /wp-json/dtb/v1/qbo/sync`, also exists for
scripted/cron use outside the admin UI.

Every operator route requires an authenticated WordPress administrator with `manage_options`. Browser requests also require a valid WordPress REST nonce.

The status response includes the active environment, connection state, redacted realm suffix, OAuth redirect URI, webhook endpoint, `webhook_verifier_configured`, and `ready_for_connection`. It never returns credentials, verifier tokens, authorization codes, access tokens, or refresh tokens.

`ready_for_connection` is true only when both the active environment's OAuth credentials and webhook verifier token are configured. The connect route fails closed with HTTP 503 until those prerequisites are present.

The connect route returns the one-time Intuit authorization URL and exact OAuth redirect URI. The OAuth callback remains:

```text
/wp-admin/admin-ajax.php?action=dtb_qbo_oauth_callback
```

The authorization URL is assembled with RFC 3986 query encoding. The callback URI therefore appears percent-encoded inside the Intuit request, including its own `?action=...` query string. Never manually concatenate OAuth query parameters and never decode or re-encode the returned authorization URL before opening it.

A valid authorization request must parse back to all of the following values before it is returned to the operator:

```text
response_type = code
scope = com.intuit.quickbooks.accounting
redirect_uri = exact registered callback URI
state = 64-character random hexadecimal value
```

## Required QuickBooks item references

Four exact-name active Service items must exist in the connected QuickBooks
company before accounting sync can run: `DTB Product Sales`, `DTB Shipping`,
`DTB Discount`, `DTB Refund` (see `DTB_QuickBooksItemMappingService::definitions()`).
Missing references fail closed — sync will not create fallback or
numeric-guessed line items.

**Preferred: managed mapping via Discover and map.** Do not define
`DTB_QBO_ITEM_*_ID` constants in `wp-config.php`. After connecting, open
**wp-admin → QuickBooks → Configuration** and click **Discover and map**. This
read-only operation queries the connected company for the four exact item
names above and stores the matched IDs as WordPress options, scoped to the
connected realm. It is idempotent, re-runnable, and re-verifies automatically
if the connected company ever changes. This is the only path that requires no
manual ID entry.

**Advanced: explicit constant override.** Defining `DTB_QBO_ITEM_<ROLE>_ID` /
`_NAME` in `wp-config.php` **locks** that role — the constant becomes the sole
source of truth and Discover and map can then only *verify* it against the
connected company, never populate or correct it. A constant containing a
placeholder, a guessed value, or an ID from the wrong environment will show as
"Needs verification" indefinitely; Discover and map cannot fix this for you,
because a locked constant intentionally overrides the managed value. Use this
only when you deliberately want an item ID pinned independent of whatever the
connected company's items resolve to (for example, cross-checking a value that
must never silently drift). If you don't need that guarantee, don't define
these constants — leave item mapping to Discover and map.

```php
// Advanced/optional only — see above. Do not define these to use the
// managed (recommended) path.
define( 'DTB_QBO_ITEM_PRODUCT_ID', '<verified QBO product-sales item ID>' );
define( 'DTB_QBO_ITEM_PRODUCT_NAME', 'DTB Product Sales' );
define( 'DTB_QBO_ITEM_SHIPPING_ID', '<verified QBO shipping item ID>' );
define( 'DTB_QBO_ITEM_SHIPPING_NAME', 'DTB Shipping' );
define( 'DTB_QBO_ITEM_DISCOUNT_ID', '<verified QBO discount item ID>' );
define( 'DTB_QBO_ITEM_DISCOUNT_NAME', 'DTB Discount' );
define( 'DTB_QBO_ITEM_REFUND_ID', '<verified QBO refund item ID>' );
define( 'DTB_QBO_ITEM_REFUND_NAME', 'DTB Refund' );
```

If any of these are currently defined with a placeholder or unverified value,
delete them from `wp-config.php` and rerun Discover and map instead of trying
to hand-fill the real ID — the control center now surfaces the connected
company's real discovered ID next to any locked/unverified item precisely so
you don't have to guess it, but removing the constant is simpler whenever
pinning isn't actually required.

## Webhook endpoint

Configure the Intuit development webhook endpoint as:

```text
https://elliottm4.sg-host.com/wp-json/dtb/v1/webhooks/qbo
```

The endpoint:

1. reads the exact raw request body, up to 2 MiB;
2. calculates HMAC-SHA256 using the verifier token for the active environment;
3. compares the Base64 result to the `intuit-signature` header with `hash_equals`;
4. validates the CloudEvents 1.0 array and allowlisted event types;
5. enqueues each accepted event into the existing `dtb-orders` Action Scheduler group;
6. returns HTTP 200 without calling the QuickBooks API in the request path.

The endpoint is intentionally fail-closed. If the active environment's verifier token is absent, it returns HTTP 503 and does not accept or enqueue webhook events. There is no unsigned bootstrap mode.

The current allowlist is intentionally narrow:

```text
SalesReceipt: Create, Update, Void, Delete
RefundReceipt: Create, Update, Void, Delete
```

Do not subscribe to Account, Bill, Invoice, Payment, Vendor, Employee, Purchase, JournalEntry, or other unrelated entities. DTB does not own those domains and receiving them adds retry load, noise, and unnecessary attack surface.

Enable **cloud event payload format**. The controller is built for the current CloudEvents array payload (`specversion`, `id`, `type`, `time`, `intuitentityid`, and `intuitaccountid`). Do not switch payload formats without updating and testing the parser first.

Webhook delivery is at-least-once and may be out of order. DTB:

- uses Action Scheduler uniqueness to coalesce duplicate pending deliveries;
- acquires an atomic option-backed processing lock per Intuit event ID;
- records the 30-day completion marker only after reconciliation succeeds or the event is intentionally ignored;
- retries temporarily unmapped SalesReceipt events after 1 minute, 5 minutes, 30 minutes, 2 hours, and 6 hours;
- validates the queued environment and connected realm before reconciliation;
- records external SalesReceipt update, void, and delete signals without overwriting WooCommerce authority.

A worker failure must not create a completed deduplication marker. Exhausted retries remain visible as a failed Action Scheduler action and a redacted audit event.

## Configuration and activation sequence

1. Deploy the reviewed QuickBooks controllers so the REST route exists.
2. Enter `https://elliottm4.sg-host.com/wp-json/dtb/v1/webhooks/qbo` in the Intuit Development Webhooks page.
3. Reveal and copy the Development verifier token.
4. Store that token in server-owned `wp-config.php` as `DTB_QBO_SANDBOX_WEBHOOK_VERIFIER_TOKEN`.
5. Clear SiteGround and PHP caches.
6. Confirm the administrator status endpoint reports `webhook_verifier_configured: true` and `ready_for_connection: true`.
7. Save the Intuit webhook configuration with CloudEvents enabled and only the allowlisted events selected.
8. Complete OAuth through the administrator connect endpoint. This automatically queues (up to 250) any already-paid/fulfilled WooCommerce orders that have no QuickBooks record yet — including orders placed before this connection existed — so nothing already sitting in `not_configured` state is silently skipped.
9. In the QuickBooks Control Center's Configuration tab, click **Discover and map** to resolve the four required Service items (see "Required QuickBooks item references" above). Do this before relying on sync for real orders — accounting lines fail closed without verified item references.
10. If more orders arrive later, or a specific order's sync failed and was fixed, use **Sync unsynced orders** on the Workflow tab to re-queue rather than waiting for the next connect event.

Do not expose the verifier token or temporarily weaken signature enforcement during setup.

## OAuth and token handling

- OAuth state is generated with 32 cryptographically secure random bytes and represented as 64 lowercase hexadecimal characters.
- OAuth state is administrator-bound, environment-bound, redirect-bound, single-use, and expires after ten minutes.
- The state transient stores only the state hash, operator ID, environment, callback URI, and issue time.
- The callback rejects malformed state before performing a transient lookup and uses `hash_equals` for the stored state-hash comparison.
- The one-time transient is deleted before token exchange so callback replay fails closed.
- The authorization URL is self-validated before being returned; malformed `redirect_uri`, `state`, or `response_type` values fail closed.
- Access and refresh tokens are encrypted with AES-256-GCM using a key derived from the WordPress authentication secret.
- Refreshes are protected by an option-backed cross-worker lock.
- Browser and log output never include authorization codes, access tokens, refresh tokens, Client Secrets, verifier tokens, or raw Intuit responses.

## Validation

1. Deploy the complete reviewed QuickBooks change set.
2. Configure sandbox credentials and the sandbox verifier token outside GitHub.
3. Confirm the status endpoint reports `sandbox`, credentials configured, `webhook_verifier_configured: true`, `ready_for_connection: true`, and the expected webhook endpoint.
4. Register the exact OAuth redirect URI returned by the connect endpoint.
5. Call the connect endpoint with an authenticated administrator REST nonce.
6. Parse the returned authorization URL and confirm `state` is present, `response_type=code`, and `redirect_uri` decodes to the exact registered callback URI.
7. Confirm the raw authorization URL contains an encoded callback query separator (`%3F`) and encoded callback assignment (`%3D`), not a second unescaped `?action=` sequence.
8. Complete OAuth and verify the intended sandbox company.
9. Register the webhook endpoint and select only the allowlisted events.
10. Enable CloudEvents payload format.
11. Send an unsigned request and confirm HTTP 401.
12. Send a valid signed SalesReceipt event and confirm Intuit receives HTTP 200 within three seconds.
13. Confirm an Action Scheduler job is created in the `dtb-orders` group.
14. Replay the same event while pending and confirm no duplicate pending action is created.
15. Confirm the completion marker is written only after successful processing.
16. Force an unmapped SalesReceipt event and confirm the documented retry schedule is created.
17. Confirm a stale processing lock can be reclaimed after 15 minutes.
18. Create one captured-payment test order and verify exactly one SalesReceipt.
19. Re-run the same accounting job and verify no duplicate.

## Production cutover

Production uses the same code and queue path. Change only the active environment, production credentials, production verifier token, registered production OAuth redirect URI, production webhook configuration, OAuth connection, realm, and verified production item references. Never copy sandbox secrets, tokens, realm IDs, mappings, verifier tokens, or item IDs into production.

## Rollback

Remove or disable the server-owned QuickBooks credentials and verifier token for the active environment, restore the previous reviewed MU-plugin files, clear SiteGround caches, and verify checkout plus the `dtb-orders` queue continue operating without QuickBooks. Do not delete WooCommerce orders, refunds, event-ledger records, Action Scheduler history, webhook audit records, or existing QuickBooks transactions.
