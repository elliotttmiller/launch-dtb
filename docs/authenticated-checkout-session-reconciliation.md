# Authenticated Checkout Session Reconciliation

Last updated: 2026-07-27.

## Authority

WooCommerce remains authoritative for cart, customer session, checkout validation, order creation, payment state, shipping, tax, totals, and Store API nonce state. DTB owns the authenticated storefront-to-native-checkout handoff and the security boundary that prevents one WordPress customer identity from inheriting another customer's WooCommerce session.

## Required flow

```text
settle queued cart mutations
  -> POST /wp-json/dtb/v1/auth/validate
  -> cryptographically validate dtb_auth
  -> cryptographically validate the native WordPress logged-in cookie
  -> require the same non-privileged WordPress user ID
  -> reject identity_conflict_contained=true
  -> require status aligned or bridged
  -> refresh authoritative Woo Store API cart and nonce
  -> require at least one cart item and no cart errors
  -> full-document navigation to /checkout/
```

## Reconciliation behavior

A clean handoff has one of two statuses:

- `aligned`: the valid native WordPress cookie already belongs to the verified DTB customer.
- `bridged`: no native customer cookie existed and WordPress queued a session-scoped native cookie for the verified DTB customer.

A `conflict_replaced` or `identity_conflict_contained=true` response is never checkout-ready for the current click. The browser must remain on the cart surface, refresh the authoritative Store API cart and nonce, tell the shopper that the secure checkout session changed, and require another explicit checkout action after the refreshed cart has been reviewed.

The conflict branch must continue expiring browser-side WooCommerce session markers. It must not copy serialized Woo session data, transplant carts between customer IDs, trust browser snapshots as authority, or preserve a customer-bound session whose ownership cannot be proven.

## Native checkout document behavior

The native checkout resolver must preserve an already valid native WordPress customer session when the optional `dtb_auth` cookie is missing, expired, or invalid. WooCommerce must remain able to load the customer-bound cart from its native session cookie and must not be forced into its empty-cart redirect solely because a secondary DTB JWT is unavailable on the document request.

The resolver may clear or replace native customer authentication only after a cryptographically valid DTB JWT proves a different non-privileged customer identity. Privileged WordPress sessions remain isolated and are never replaced by the public checkout bridge.

## Frontend ownership

`frontend/src/auth/useAuth.js`

- Stores the complete redacted native-checkout state from `/auth/validate`.
- Fails closed unless the state is `aligned` or `bridged` and no identity conflict was contained.
- Returns a typed `checkout_identity_reconciled` error when reconciliation changed identity.

`frontend/src/utils/checkoutHandoff.js`

- Owns the single React-to-native checkout transfer.
- Coalesces concurrent checkout attempts.
- Refreshes the authoritative Store API cart when identity reconciliation occurs.
- Never navigates on the reconciliation attempt.

`frontend/src/pages/Cart.jsx`

- Refreshes CartContext after reconciliation.
- Displays a persistent session-refreshed notice.
- Changes the CTA to require explicit confirmation on the next checkout action.

`frontend/src/components/shell/CartSidebar.jsx`

- Uses the same centralized handoff.
- Refreshes CartContext and keeps the drawer open when reconciliation occurs.

## Backend ownership

`drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/NativeCheckoutIdentityBridge.php`

- Resolves the DTB JWT subject only after HS256 signature, expiry, issued-at, and WordPress user existence checks.
- Preserves privileged wp-admin identity isolation.
- Preserves a valid native customer identity when the secondary DTB JWT is absent or unusable.
- Contains true non-privileged customer conflicts without initializing WooCommerce sessions inside `determine_current_user`.
- Emits only approved redacted diagnostics.

## Redacted diagnostics contract

Checkout identity diagnostics contain exactly these fields:

```text
event
native_user_id
jwt_user_id
woo_customer_kind
handoff_status
```

Allowed `woo_customer_kind` classifications describe identity class only, such as `guest`, `native_customer`, `privileged_native`, or `unknown`. Diagnostics must never include cookie values, JWTs, Woo session keys, names, emails, addresses, cart contents, order data, payment data, secrets, or request headers.

## Read-only production identity audit

Before deleting, merging, or rewriting customer records, inspect read-only state for:

1. WordPress user ID `3`, including login, email, roles, and WooCommerce customer metadata.
2. The cryptographically resolved native logged-in cookie user ID from the failing browser session.
3. Duplicate WordPress users sharing normalized email/login identifiers.
4. WooCommerce session ownership classification and whether the session is guest or customer-bound.
5. Order ownership and historical customer references for all implicated user IDs.
6. Whether the frontend account email resolves to the same WordPress user represented by JWT subject `3`.

Do not log or export cookie values or session keys during this audit. Do not merge or delete records without database and file backups, ownership verification, order-history review, and an explicit rollback plan.

## Acceptance criteria

1. Guest checkout remains unchanged.
2. An aligned authenticated customer reaches native checkout with the same authoritative cart.
3. A clean guest-to-customer bridge reaches checkout only after cart and nonce refresh.
4. A customer identity conflict never navigates on the first attempt.
5. The cart is refreshed from Store API after conflict containment.
6. The shopper sees a clear session-change notice and must explicitly select checkout again.
7. The second attempt proceeds only when validation reports `aligned` or `bridged`, conflict containment is false, and the authoritative cart contains items.
8. Privileged native wp-admin cookies remain intact and cannot own public shopper commerce state.
9. A valid native customer checkout session is not cleared merely because `dtb_auth` is missing, expired, or invalid on the checkout document request.
10. Logs contain only the approved redacted fields.
11. No database migration or customer-record mutation occurs.
