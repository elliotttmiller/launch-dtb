# Payment Provider Migration: Payment Plugins for Stripe WooCommerce

Last verified against active source and provider documentation: 2026-07-28.

## Decision

Drywall Toolbox is migrating storefront Stripe authority from the WooCommerce Stripe Payment Gateway extension to **Payment Plugins for Stripe WooCommerce** (`woo-stripe-payment`).

This is a payment-provider integration migration, not a presentation-only plugin replacement. WooCommerce remains the cart, checkout, order, refund, and authoritative status owner. The replacement plugin owns Stripe payment UI, eligible wallets, Stripe-supported BNPL methods, tokenization, 3DS/SCA, payment confirmation/capture, and Stripe webhook synchronization.

The repository does not bundle, fork, or patch the regular plugin. Installation, activation, API/OAuth connection, webhook configuration, live/test mode, payment-method settings, and provider-managed token migration are operator actions.

## Canonical checkout path

```text
React Store API cart
  -> full-document native /checkout/
  -> WooCommerce Checkout Block
  -> Payment Plugins for Stripe WooCommerce
  -> WooCommerce order/payment lifecycle
  -> DTB verified captured-payment evidence
  -> DTB event ledger and dtb-orders queue
  -> Veeqo / QuickBooks / notifications / tracking
```

## Repository integration

`dtb-commerce/Payment/PaymentPluginsStripeNativeCheckout.php`:

- verifies the replacement plugin by its runtime constants, container function, base gateway class, and reflected plugin path;
- exposes read-only non-secret checkout capabilities;
- leaves Stripe Elements appearance entirely provider-owned during the neutral checkout reset;
- enforces `stripe_upm` as the only Payment Plugins gateway on storefront payment requests;
- suppresses standalone Payment Plugins card, wallet, BNPL, and local-method gateways whenever UPM is enabled;
- tags new Checkout Block orders with `payment-plugins-stripe-v1`;
- mirrors a non-secret payment reference only after WooCommerce reports a paid date and the selected gateway is verified as originating from `woo-stripe-payment`;
- emits operator notices for missing/outdated provider versions, disabled or unconfigured UPM, HTTPS/Checkout Block failures, and competing Stripe authorities.

Historical orders keep the prior `woo-stripe-v1` / `woocommerce_stripe` evidence. The captured-payment gate accepts both historical and new provider contracts; no bulk metadata rewrite is required or permitted.

Provider-specific official-Stripe address/shipping shims and browser-header rate-limit bypasses are removed. The replacement plugin owns its wallet address/shipping flow. DTB does not guess undocumented headers or mutate wallet payloads.

## Checkout presentation contract

- The current theme shell loads no DTB checkout stylesheet, inline design override, loader, branded header, mobile wizard, or presentation controller.
- WooCommerce Checkout Block provides the temporary desktop/mobile visual baseline pending a clean redesign.
- The checkout contains one provider-owned `stripe_upm` Payment Element.
- Cards, Apple Pay, Google Pay, approved Link, BNPL, and local methods may appear only inside that Payment Element when Stripe reports them eligible.
- Standalone Payment Plugins gateways and a separate Express Checkout banner remain disabled to prevent duplicate payment surfaces.
- Native provider/WooCommerce payment inputs remain the state authority. DTB must not replace or mirror payment state.

## PayPal boundary

PayPal is not a payment method supplied by `woo-stripe-payment`. A real PayPal button or PayPal payment-method card requires a separately installed and reviewed PayPal provider plugin.

Do not create a fake PayPal button. Do not route PayPal through Stripe. If Payment Plugins for PayPal WooCommerce is adopted, configure PayPal only and disable any separate PayPal card/Fastlane card authority unless a later architecture decision explicitly replaces Stripe card authority.

## Data and migration impact

DTB introduces no schema migration and no destructive data operation.

The replacement plugin documents automatic recognition of Stripe customer IDs, saved payment methods, and supported subscription data created by the WooCommerce Stripe Gateway. It does not migrate plugin settings. All provider settings must be recreated manually and validated in staging.

The automatic migration claim is provider-owned behavior. Drywall Toolbox must validate representative customers, saved cards, and subscriptions before production cutover.

## Required manual operator checklist

### A. Preparation and backup

- [ ] Freeze unrelated checkout/payment changes for the cutover window.
- [ ] Record current WooCommerce, WordPress, old Stripe plugin, and replacement-plugin versions.
- [ ] Create an independent full database backup.
- [ ] Back up the active theme, DTB MU plugins, and current regular-plugin directories.
- [ ] Export or screenshot the existing Stripe plugin settings without recording secrets in GitHub or support messages.
- [ ] Capture the current Stripe webhook endpoint list and enabled event types in a secure operator record.
- [ ] Prepare a staging clone or production-equivalent test environment.
- [ ] Confirm rollback can restore both files and database state.

### B. Install and establish one payment authority

- [ ] Install a reviewed current release of **Payment Plugins for Stripe WooCommerce** (`woo-stripe-payment`); the repository contract requires 4.0.8 or newer.
- [ ] Do not activate both Stripe plugins for customer checkout.
- [ ] Deactivate the WooCommerce Stripe Gateway before activating the replacement on the acceptance environment.
- [ ] Confirm WooPayments is disabled.
- [ ] Activate `woo-stripe-payment`.
- [ ] Confirm WooCommerce reports no duplicate Stripe card/wallet gateways from another plugin.

### C. Stripe connection and webhooks

- [ ] Connect the test Stripe account through the replacement plugin's supported connection flow.
- [ ] Verify test publishable/secret connection state inside wp-admin without copying credentials into GitHub.
- [ ] Create or verify the replacement plugin's test webhook endpoint.
- [ ] Confirm the webhook endpoint is reachable over HTTPS.
- [ ] Send/test representative webhook events and verify successful delivery.
- [ ] Repeat connection and webhook setup for the live Stripe account only after test acceptance.
- [ ] Do not delete the previous webhook endpoint until rollback risk and historical-event requirements have been reviewed.

### D. Provider settings

- [ ] Set automatic capture unless a separately approved manual-capture workflow exists.
- [ ] Create a dedicated test Payment Method Configuration for this WooCommerce store rather than using Stripe's default configuration.
- [ ] Enable **Universal Payment Methods (Stripe)** (`stripe_upm`) as the only Payment Plugins storefront gateway.
- [ ] Select the dedicated test Payment Method Configuration and begin with cards only.
- [ ] Disable standalone Credit Cards, Apple Pay, Google Pay, Link, BNPL, and local-method Payment Plugins gateways.
- [ ] Confirm saved payment methods are enabled only according to the privacy/account policy.
- [ ] Configure statement descriptor, locale, order status, receipt, dispute, refund/cancellation, logging, and customer-creation settings.
- [ ] Keep production logging at the minimum level needed for redacted operations.
- [ ] Do not enable client-visible or log output containing API keys, client secrets, or payment payloads.

### E. UPM wallets and dynamic methods

- [ ] Enable Apple Pay and Google Pay inside the dedicated UPM Payment Method Configuration only.
- [ ] Enable Link inside UPM only if specifically approved.
- [ ] Do not enable separate Express Checkout or standalone wallet gateways.
- [ ] Register/verify the production payment-method domain in Stripe where required.
- [ ] Confirm Stripe dynamically exposes Apple Pay and Google Pay inside UPM on supported real devices and browsers.

### F. BNPL and optional methods

- [ ] Enable only Stripe payment methods approved for launch and available for the Stripe account, currency, country, cart value, and customer.
- [ ] Configure Klarna, Affirm, and/or Afterpay/Clearpay individually; do not assume all methods will appear for every order.
- [ ] Verify each method's capture/refund/cancellation behavior.
- [ ] Confirm unavailable methods fail closed without blocking card checkout.
- [ ] If PayPal is required, install and configure a separately reviewed PayPal plugin.
- [ ] If the separate PayPal plugin exposes card/Fastlane card processing, disable it so Stripe remains the only card authority.

### G. Checkout content and shipping

- [ ] Confirm the assigned WooCommerce Checkout page contains the Checkout Block.
- [ ] Confirm checkout is HTTPS and no-store/private.
- [ ] Confirm no DTB checkout stylesheet, inline design override, loader, branded header, mobile wizard, or presentation controller is loaded.
- [ ] Confirm the native WooCommerce Checkout Block baseline renders on desktop and mobile.
- [ ] Confirm Contact contains first name, last name, email, and optional phone.
- [ ] Confirm Shipping contains address and shipping methods.
- [ ] Confirm exactly one UPM Payment Element is present and no standalone card/wallet/payment rows are duplicated.
- [ ] Confirm at least one WooCommerce/DTB shipping method exists for every supported destination.
- [ ] Test no-rate destinations and address changes across multiple states/postcodes.
- [ ] Verify tax, coupons, shipping, and totals recalculate authoritatively.

### H. Data-migration acceptance

- [ ] Test an existing customer with a saved Stripe card created by the previous plugin.
- [ ] Verify the saved method appears and can complete a test payment without creating an unintended duplicate Stripe customer.
- [ ] Test guest checkout and a new customer.
- [ ] If subscriptions exist, verify representative subscription payment methods and at least one test renewal.
- [ ] Review failed renewal/retry behavior.
- [ ] Do not bulk-edit customer, token, subscription, order, or payment metadata.

### I. End-to-end payment acceptance

- [ ] Card success.
- [ ] Card decline.
- [ ] 3DS/SCA success, failure, cancellation, and retry.
- [ ] Saved-card success.
- [ ] Apple Pay success, cancellation, address change, shipping-rate change, and retry.
- [ ] Google Pay success, cancellation, address change, shipping-rate change, and retry.
- [ ] Each enabled BNPL method, including redirect/return behavior.
- [ ] Optional PayPal success/cancel/return only if separately installed.
- [ ] Network interruption and page reload recovery.
- [ ] No duplicate payment attempt, order, notice, or wallet surface.

### J. Order, webhook, refund, and downstream acceptance

- [ ] WooCommerce order contains the selected replacement-plugin gateway ID.
- [ ] WooCommerce `date_paid` is populated only after provider-confirmed payment.
- [ ] A non-secret transaction/PaymentIntent reference is present.
- [ ] New order meta uses `payment-plugins-stripe-v1` and `payment_plugins_stripe`.
- [ ] DTB captured-payment gate opens only after verified paid evidence.
- [ ] DTB event ledger and `dtb-orders` queue receive one qualifying event/job.
- [ ] Veeqo, QuickBooks, notifications, and tracking receive no duplicate effects.
- [ ] Full refund succeeds and synchronizes.
- [ ] Multiple partial refunds retain distinct `order_id + refund_id` identity.
- [ ] Failed/unpaid orders do not enter fulfillment/accounting queues.
- [ ] Historical pre-migration orders remain readable, refundable, and traceable.

### K. Production cutover

- [ ] Reconfirm current backups and rollback owner.
- [ ] Transfer the reviewed DTB/theme source set as one dependency-consistent release.
- [ ] Install/configure the regular plugin through WordPress operator tooling, not by committing plugin source.
- [ ] Deactivate the previous Stripe plugin before activating the replacement.
- [ ] Connect live Stripe and verify the live webhook.
- [ ] Clear SiteGround, application, CDN, and browser caches as applicable.
- [ ] Run one low-risk live card order and supported wallet order.
- [ ] Verify order, Stripe reference, webhook, captured-payment gate, event ledger, queues, Veeqo, QuickBooks, email, and return routing.
- [ ] Monitor checkout errors, webhook failures, declines, duplicate orders, and subscription renewals during the cutover window.

## Rollback

1. Disable customer checkout or enter the approved maintenance mode if payment integrity is uncertain.
2. Deactivate `woo-stripe-payment`.
3. Restore the previous regular Stripe plugin and its backed-up configuration/files.
4. Restore the previous DTB/theme files as one set.
5. Restore database state only when required and only from the independent cutover backup.
6. Clear SiteGround/application/CDN/browser caches.
7. Revalidate card, wallet, webhook, order, captured-payment gate, refunds, and downstream queues.
8. Do not delete or rewrite orders created during the failed cutover; reconcile them explicitly.

## Validation evidence

Repository review and static smoke contracts can verify source ownership and forbidden legacy hooks. They cannot prove live Stripe account connection, webhooks, wallet eligibility, saved-token conversion, 3DS, BNPL, PayPal, subscription renewals, or production checkout acceptance. Those remain mandatory operator tests.
