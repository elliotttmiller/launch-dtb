# Checkout Payment Failure Recovery

Last verified against source: 2026-07-26.

## Product behavior

A declined, cancelled, or otherwise unsuccessful Stripe payment must keep the shopper on the existing WooCommerce Checkout Block surface. The checkout fields, cart/session, shipping selection, and official Stripe payment surface remain mounted so the shopper can correct the payment method and retry.

The customer-facing state is:

```text
Place Order
  -> official WooCommerce Stripe gateway attempts payment
  -> payment is declined or fails
  -> Woo/Stripe emits its authoritative error
  -> DTB presents an accessible "Payment wasn't approved" recovery notice
  -> shopper remains on Payment
  -> shopper retries with the existing checkout state
```

A failed attempt must not become a durable customer order, must not navigate to order-received, and must not enqueue fulfillment, accounting, inventory, notification, or tracking work.

## WooCommerce provisional-order constraint

WooCommerce Checkout Block creates a provisional WooCommerce order before invoking the payment gateway. DTB does not bypass or replace that supported contract.

To satisfy the product requirement without introducing a second order-creation path, DTB treats a failed official Stripe attempt as an uncommitted checkout attempt:

```text
Woo checkout-draft
  -> provisional order submitted to Stripe
  -> Woo status failed
  -> DTB lifecycle observers record the failed attempt
  -> DTB validates that payment was not captured and no downstream work exists
  -> status restored to checkout-draft
  -> same checkout remains retryable
```

The recovered record is an internal WooCommerce checkout draft, not a placed customer order. It is not eligible for DTB fulfillment or integration queues.

## Backend ownership

`drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/FailedPaymentRecovery.php` owns failed-payment recovery.

It observes `woocommerce_order_status_failed` at a late priority and restores only eligible DTB official-Stripe checkout attempts to `checkout-draft`.

Recovery requires all of the following:

- `_dtb_checkout_gateway = woo_native_stripe`
- `_dtb_checkout_contract_version = woo-stripe-v1`
- Stripe payment-method identity
- no WooCommerce paid date
- no captured-payment marker
- captured-payment handoff gate is false
- no fulfillment, Veeqo, QuickBooks, or processing-dispatch state

The handler records retry metadata and emits `dtb_checkout_payment_retry_recovered`. Consumers of that action must remain idempotent and must not create downstream side effects.

## Frontend presentation ownership

The active checkout theme owns the recovery presentation:

- `assets/checkout/checkout-payment-failure.js`
- `assets/checkout/checkout-payment-failure.css`
- `templates/checkout/native-checkout.php`

The JavaScript observes same-origin WooCommerce error notices and adds one accessible recovery notice near the existing payment surface. It does not:

- intercept the Place Order submit event;
- read or mutate Stripe iframe contents;
- initialize Stripe;
- create a payment intent;
- replace Woo notices or payment controls;
- navigate away from checkout.

## Customer message

```text
Payment wasn't approved
No order was placed. Your checkout details are still here. Review your payment method and try again.
```

The native WooCommerce/Stripe error remains authoritative and visible. The DTB notice provides clear recovery context and moves focus to the Payment section.

## Idempotency and safety

Repeated Stripe failures may transition the same provisional checkout order through `failed -> checkout-draft` multiple times. The handler increments `_dtb_payment_attempt_count` and never dispatches paid-order jobs.

Paid or downstream-processed orders are never recycled. Webhook reconciliation remains owned by WooCommerce and the official Stripe extension.

## Validation

Static validation:

```powershell
.\scripts\smoke-dtb-checkout-payment-ui.ps1
```

PHP syntax:

```powershell
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/FailedPaymentRecovery.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/bootstrap.php
php -l drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php
```

Production browser validation must cover:

- Stripe test decline remains on checkout;
- notice is announced and Payment remains interactive;
- entered contact/address/shipping state remains intact;
- retry with a successful test card completes one order;
- no failed customer order remains in normal WooCommerce order views;
- no Veeqo, QuickBooks, notification, or fulfillment job is dispatched for the failed attempt;
- 3DS cancellation remains retryable;
- webhook replay cannot recycle a captured or downstream-processed order.

Do not claim payment, browser, webhook, queue, or deployment validation passed unless it was actually executed and produced usable evidence.
