# Checkout Captured-Payment Reconciliation

Last verified against active source: 2026-07-28.

## Purpose

WooCommerce and the configured payment provider remain authoritative for payment execution and order payment status. New Stripe checkout uses Payment Plugins for Stripe WooCommerce. DTB never infers success from a redirect, query value, browser state, order creation, or a raw `stripe_*` gateway ID.

The order platform contains one narrow reconciliation path for the failure mode where WooCommerce has already persisted complete provider-verified captured-payment evidence but a qualifying DTB order remains `pending` or `on-hold`.

## Required evidence

New replacement-provider orders are eligible only when all are true:

- `_dtb_checkout_gateway = woo_native_stripe`;
- `_dtb_checkout_contract_version = payment-plugins-stripe-v1`;
- `_dtb_payment_provider = payment_plugins_stripe`, mirrored only after the selected gateway instance is verified as originating from `woo-stripe-payment`;
- WooCommerce has a non-null `date_paid` value;
- a non-secret transaction, PaymentIntent, or charge reference exists;
- order total is greater than zero;
- current status is `pending` or `on-hold`.

Historical pre-migration orders may retain `woo-stripe-v1` and `woocommerce_stripe`. That evidence remains readable and is not bulk rewritten.

Authorization-only/manual-capture state is insufficient and remains non-fulfillable unless a separate capture workflow is approved and validated.

## Runtime flow

```text
WooCommerce Store API checkout or pending/on-hold transition
  -> replacement provider completes/synchronizes payment
  -> DTB replacement adapter verifies gateway provenance, date_paid, and reference
  -> DTB mirrors non-secret provider evidence
  -> DTB applies captured-payment gate
  -> WC_Order::payment_complete(reference)
  -> WooCommerce selects processing or completed
  -> normal WooCommerce status hooks
  -> append-only DTB payment event
  -> atomic downstream dispatch barrier
  -> dtb-orders Action Scheduler queue
```

The reconciliation method never calls Veeqo, QuickBooks, notifications, or another external integration synchronously. Those effects remain queued behind existing duplicate protection.

## Idempotency and observability

- An in-request per-order guard prevents recursive reconciliation.
- Reconciliation ledger identity is `payment-status-reconciled:{order_id}`.
- Payment lifecycle events and processing dispatch retain their own idempotency/atomic barriers.
- A redacted WooCommerce warning and bounded operator email are emitted when verified captured payment does not transition to `processing` or `completed`.
- No credential, token, client secret, webhook secret, payment payload, address, email, or phone number is logged.

## Provider migration constraints

- The prior WooCommerce Stripe Gateway and the replacement plugin must not be simultaneously active as customer-facing card/wallet authorities.
- The repository does not bundle or patch the regular plugin.
- Plugin connection, webhooks, settings, saved-token/subscription migration, and live payment acceptance are operator tasks documented in `docs/payment-provider-migration.md`.
- PayPal is outside this Stripe reconciliation contract and requires a separately reviewed provider/contract before it may enter DTB paid downstream processing.
- Historical orders and refunds must remain readable during and after cutover.

## Guest cart and native admin session continuity

Same-origin WooCommerce cookies remain guest-cart authority. Public Store API identity isolation applies to both supported route forms:

```text
/wp-json/wc/store/v1/...
/wp/index.php?rest_route=/wc/store/v1/...
```

Storefront authentication validation and logout clear a native WordPress cookie only when its signed cookie resolves to a non-privileged customer. Signed administrator/operator cookies remain intact.

WooCommerce empty-cart and continue-shopping actions route to the React catalog (`/products` or `/staging/{id}/products`), not the unused native `/shop/` path.

## Acceptance

Validate on a production-equivalent environment:

1. Guest cart survives address, shipping, tax, payment, and provider refreshes.
2. Pretty-permalink and query-routed Store API requests resolve the same guest session.
3. Guest storefront auth validation does not expire a privileged wp-admin session.
4. New Stripe-paid orders receive the replacement contract/provider metadata only after paid evidence.
5. Historical official-Stripe orders still pass historical audit/refund/recovery rules.
6. Captured-payment reconciliation emits one event and one downstream dispatch path.
7. Failed, cancelled, authorization-only, or reference-less orders remain blocked.
8. Card, saved card, 3DS/SCA, Apple Pay, Google Pay, configured BNPL, webhook, refund, Veeqo, QuickBooks, notification, and return-routing behavior are validated.
9. Multiple partial refunds retain concrete `order_id + refund_id` identity.
10. No duplicate order, payment, event, job, or downstream effect occurs.

## Database impact and rollback

No DTB schema migration or bulk metadata rewrite is introduced. Provider token/customer/subscription compatibility is provider-managed and must be tested before cutover.

Rollback requires restoring the previous payment plugin/configuration and the previous DTB/theme files as one dependency-consistent set, clearing caches, and rerunning payment/webhook/order/downstream acceptance. Orders created during a failed cutover must be reconciled, not deleted or rewritten.
