# Checkout captured-payment reconciliation

Last verified against source: 2026-07-27.

## Purpose

WooCommerce and the official WooCommerce Stripe Payment Gateway remain the authoritative owners of checkout payment execution and order payment status. DTB does not infer payment success from a redirect, query parameter, browser state, order creation, or a raw `stripe_*` gateway identifier.

The order platform contains a narrow reconciliation path for the failure mode where WooCommerce has already persisted complete captured-payment evidence but the order remains in `pending` or `on-hold`.

## Required evidence

Reconciliation is eligible only when all of the following are true:

- the order is tagged with `_dtb_checkout_gateway = woo_native_stripe`;
- the order is tagged with `_dtb_checkout_contract_version = woo-stripe-v1`;
- the selected gateway instance is verified as originating from the official `woocommerce-gateway-stripe` extension;
- WooCommerce has a non-null `date_paid` value;
- a non-secret transaction, PaymentIntent, or charge reference exists;
- the order total is greater than zero;
- the current WooCommerce status is `pending` or `on-hold`.

Authorization-only state is not sufficient and remains non-fulfillable.

## Runtime flow

```text
WooCommerce Store API checkout or pending/on-hold transition
  -> DTB verifies the checkout contract
  -> DTB mirrors only official-provider, non-secret payment evidence
  -> DTB applies the captured-payment gate
  -> WC_Order::payment_complete(reference)
  -> WooCommerce selects processing or completed
  -> normal WooCommerce status hooks
  -> append-only DTB payment event
  -> atomic downstream dispatch barrier
  -> dtb-orders Action Scheduler queue
```

The reconciliation method never calls Veeqo, QuickBooks, or notification integrations synchronously. Those effects continue through the existing order queue and duplicate-protection barrier.

## Idempotency and observability

- An in-request per-order guard prevents recursive reconciliation.
- The reconciliation ledger event uses `payment-status-reconciled:{order_id}` as its idempotency key.
- Existing payment lifecycle events and processing-job dispatch retain their own idempotency and atomic barriers.
- A redacted WooCommerce warning is emitted when verified captured payment does not transition to `processing` or `completed`.
- No payment credential, token, client secret, webhook secret, or raw provider payload is logged.

## Guest cart and native admin session continuity

Same-origin WooCommerce cookies remain the guest-cart authority. Public Store API identity isolation applies to both supported route forms:

```text
/wp-json/wc/store/v1/...
/wp/index.php?rest_route=/wc/store/v1/...
```

Storefront auth validation and logout clear a native WordPress cookie only when its signed cookie resolves to a non-privileged customer. They do not trust the request-scoped current-user projection, because public commerce isolation may intentionally resolve that request as anonymous. Signed administrator/operator cookies are preserved.

WooCommerce empty-cart and continue-shopping actions route to the React catalog:

```text
/products
/staging/{id}/products
```

The unused native `/shop/` URL is not emitted by the checkout workflow.

## Customer tracking CSS ownership

Order tracking uses a bounded two-layer feature stylesheet contract:

```text
frontend/src/styles/order-tracking.css
  -> feature visual primitives and component presentation

frontend/src/styles/order-tracking-layout.css
  -> tracking-only structural layout, responsive behavior, and rendering stability
```

`mobile-account-order-layout-fixes.css` is restricted to account hub and account-order-list presentation. It must not define tracking-page item, status panel, progress, shipment, or tracking header selectors.

The retired `order-tracking-layout-fixes.css` patch file is intentionally absent. New tracking changes must be made in one of the two owning tracking files rather than added as a global override stylesheet.

At or below 560 CSS pixels, order-item pricing is placed beneath the complete product-information row. Product names use normal word boundaries and automatic hyphenation is disabled.

## Deployment and acceptance

The guest-cart/admin-session follow-up deploys only:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/StorefrontCommerceIdentityIsolation.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-platform/Auth/AuthCookieRuntimeHardening.php
drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/StorefrontReturnContext.php
docs/checkout-payment-reconciliation.md
```

Before deployment, back up the changed PHP files and affected Woo/session database state. Clear SiteGround dynamic cache after transfer.

Acceptance requires:

1. A guest cart survives repeated Checkout Block address, shipping, and payment refreshes.
2. Pretty-permalink and query-routed Store API requests resolve the same guest session.
3. Guest storefront auth validation does not expire a concurrently signed-in privileged wp-admin session.
4. Customer logout clears only customer-native cookies and never a privileged admin cookie.
5. Empty-cart and continue-shopping actions route to `/products`, not `/shop/`.
6. Existing payment reconciliation, order projections, queues, Veeqo, QuickBooks, and notification behavior remain unchanged.
