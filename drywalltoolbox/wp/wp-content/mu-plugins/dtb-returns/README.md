# DTB Returns

## Ownership

WooCommerce is the system of record for customer orders. The DTB Returns MU plugin owns return-domain validation, return records, public return workflows, operator workflows, and return REST contracts. The storefront never becomes an authority for order identity or customer data.

## Public return portal contract

The storefront return portal uses a two-stage flow:

1. `POST /wp-json/dtb/v1/returns/lookup`
2. `POST /wp-json/dtb/v1/returns/request`

### Order lookup

`POST /dtb/v1/returns/lookup` accepts any non-empty combination of:

- `order_number`
- `customer_email`
- `customer_name`

At least one field is required. When more than one field is supplied, every supplied field must match the same WooCommerce order.

Lookup is public by design but bounded and rate-limited. It uses WooCommerce CRUD/order-query APIs so the implementation remains HPOS-compatible. The response intentionally exposes only the minimum information required to identify a result in the customer UI:

- order number
- order date
- item count
- order status label
- short-lived signed `lookup_token`

Lookup must not expose billing/shipping addresses, email addresses, phone numbers, payment information, order totals, provider identifiers, or line-item names.

The `lookup_token` is signed with the WordPress auth salt, expires after 15 minutes, and binds the browser to one WooCommerce order ID. It is not a payment token, session credential, or durable identifier.

### Return submission

The existing `POST /dtb/v1/returns/request` endpoint remains the single public return-creation transport. New storefront requests submit the selected `lookup_token`, return reason, and optional notes.

Before the existing request handler validates and creates the return record, `ReturnsPublicLookupController.php` verifies the token and replaces browser-provided order/customer identity fields with canonical values read from WooCommerce. This prevents the storefront from becoming authoritative for order identity.

Legacy clients that still submit order number, customer name, and customer email without a lookup token remain compatible only when all three fields exactly match the WooCommerce order. Invalid or mismatched identity data is rejected before return creation.

## Security and privacy

Public lookup and return submission are rate-limited independently. Order lookup is intentionally minimal because permitting single-field search increases enumeration risk. Any future expansion of returned order data requires a separate privacy/security review and should prefer stronger customer authentication rather than broadening anonymous response data.

Do not log lookup tokens, customer PII, addresses, payment data, or provider secrets. Do not use direct SQL for WooCommerce order lookup or persistence.

## Storefront UX

`frontend/src/pages/ReturnPortal.jsx` allows customers to search with any one of the available fields, displays accessible selectable order summaries, and submits only the signed lookup token plus return-specific details. The layout collapses to a single column on narrow viewports and includes visible labels, live error announcements, keyboard-operable order selection, and reduced-motion handling.
