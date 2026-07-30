# Order email idempotency

WooCommerce owns the initial `customer_processing_order` email. Veeqo owns
fulfillment projection only and must never originate or restore that paid-order
confirmation.

## Invariants

- A successful `customer_processing_order` transport records
  `_dtb_customer_processing_email_sent_at` on the WooCommerce order.
- Later automatic attempts for that order are suppressed. A failed transport is
  not marked successful.
- Veeqo status polling keeps its fairness cursor outside WooCommerce order
  state. An unchanged poll does not save order metadata, update integration
  state, transition status, append events, or enqueue projections.
- Veeqo polling uses unique single actions, not a permanent recurrence. A new
  Veeqo-correlated processing order starts the chain; it stops when no eligible
  order remains. Polling adapts from 10 minutes for new orders to 30 minutes
  after one day and two hours after seven days. Fetch failures back off to 30
  minutes, batches are capped at 25, and orders older than 30 days leave the
  automatic polling window for operator exception handling.
- Veeqo status application is monotonic. Only a higher fulfillment rank may
  change WooCommerce status; a same-rank response may add new tracking data but
  cannot restore `processing`.
- While a Veeqo-originated status transition is active, the WooCommerce
  processing email is disabled. Shipping notification policy remains separate.
- Once an asynchronous email trigger begins, an exception is treated as
  uncertain delivery. Its durable claim is retained and the job is not retried
  automatically because the mail server may already have accepted it.

## Incident signature and verification

The 2026-07-30 incident produced paired processing emails on the same five-minute
cadence as `dtb_veeqo_order_status_poll_recurring`. Verify the release by:

1. confirming the legacy `dtb_veeqo_order_status_poll_recurring` action is gone;
2. confirming at most one single `dtb_veeqo_order_status_poll` action is pending
   while an eligible order exists, and none remains when the queue is idle;
3. confirming an unchanged Veeqo response reports no applied order update;
4. observing the affected orders for at least two poll intervals with no new
   `customer_processing_order` send;
5. placing one new paid test order and confirming exactly one processing email;
6. changing its Veeqo fulfillment state and confirming tracking/shipping behavior
   without another processing email.

No database migration is required. Existing order metadata is retained. Rollback
is the prior release through the official SiteGround Git deployment workflow;
if rollback is necessary, pause the Veeqo order-status recurring action first to
contain the original five-minute trigger.
