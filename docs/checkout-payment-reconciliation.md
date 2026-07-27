# Checkout captured-payment reconciliation

Last verified against source: 2026-07-27.

## Purpose

WooCommerce and the official WooCommerce Stripe Payment Gateway remain the authoritative owners of checkout payment execution and order payment status. DTB does not infer payment success from a redirect, query parameter, browser state, order creation, or a raw `stripe_*` gateway identifier.

The order platform now contains a narrow reconciliation path for the failure mode where WooCommerce has already persisted complete captured-payment evidence but the order remains in `pending` or `on-hold`.

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

## Customer tracking presentation

On screens at or below 560 CSS pixels, order-item pricing is placed beneath the complete product information row. Product names use normal word boundaries and may break inside a token only as a last-resort overflow safeguard. Automatic hyphenation is disabled.

## Deployment and acceptance

Deploy only these reviewed artifacts for this change:

```text
drywalltoolbox/wp/wp-content/mu-plugins/dtb-order-platform/Payment/CheckoutPaymentLifecycle.php
frontend/src/styles/mobile-account-order-layout-fixes.css
docs/checkout-payment-reconciliation.md
```

Before deployment, back up the existing production PHP file, the currently deployed frontend build, and the affected order/database state. After deployment and frontend build transfer, clear SiteGround dynamic and frontend caches.

Acceptance requires:

1. Unpaid checkout remains `pending` and displays the payment-required action.
2. A successful automatic-capture Stripe test order reaches `processing` or `completed`.
3. A paid order deliberately left in `pending` is reconciled only when all captured-payment evidence is present.
4. Authorization-only/manual-capture state does not dispatch fulfillment.
5. The event ledger contains one reconciliation event and downstream jobs remain exactly once.
6. Guest order tracking remains accessible only through the valid order key.
7. Mobile item names wrap at word boundaries and prices do not compress the title column.
8. Failed, cancelled, refunded, and zero-total behavior remains unchanged.
