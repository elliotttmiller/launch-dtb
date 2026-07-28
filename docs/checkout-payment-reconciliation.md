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
- A redacted WooCommerce warning is emitted when verified captured payment does not transition to `processing` or `completed`. It includes only the order ID, trigger, and resulting status.
- No payment credential, token, client secret, webhook secret, or raw provider payload is logged.

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

At or below 560 CSS pixels, order-item pricing is placed beneath the complete product-information row. Product names use normal word boundaries and may break inside an otherwise unbreakable token only as a last-resort overflow safeguard. Automatic hyphenation is disabled.

This CSS consolidation changes stylesheet ownership and cascade organization only. It does not modify React component structure, route wiring, API calls, authentication, guest order-key authorization, event streaming, checkout handoff, payment execution, order projections, queue dispatch, Veeqo, QuickBooks, or notification integrations.

## Deployment and acceptance

Deploy only these reviewed source artifacts for this change:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-order-platform/Payment/CheckoutPaymentLifecycle.php
frontend/src/main.jsx
frontend/src/styles/order-tracking-layout.css
frontend/src/styles/mobile-account-order-layout-fixes.css
docs/checkout-payment-reconciliation.md
```

The obsolete frontend source file must be removed from the deployed source workspace when applicable:

```text
frontend/src/styles/order-tracking-layout-fixes.css
```

Production receives the complete dependency-consistent frontend build, not individual unbuilt source CSS files. Before deployment, back up the existing production PHP file, the currently deployed frontend build, and the affected order/database state. After deployment and frontend build transfer, clear SiteGround dynamic and frontend caches.

Acceptance requires:

1. Unpaid checkout remains `pending` and displays the payment-required action.
2. A successful automatic-capture Stripe test order reaches `processing` or `completed`.
3. A paid order deliberately left in `pending` is reconciled only when all captured-payment evidence is present.
4. Authorization-only/manual-capture state does not dispatch fulfillment.
5. The event ledger contains one reconciliation event and downstream jobs remain exactly once.
6. Guest order tracking remains accessible only through the valid order key.
7. Mobile item names wrap at word boundaries and prices do not compress the title column.
8. The account-order list remains visually unchanged after removal of tracking selectors from its stylesheet.
9. No runtime request, API contract, component wiring, checkout integration, order projection, or queue behavior changes beyond the documented payment reconciliation.
10. Failed, cancelled, refunded, and zero-total behavior remains unchanged.
