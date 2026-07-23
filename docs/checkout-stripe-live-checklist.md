# Official WooCommerce Stripe Checkout Production Checklist

Last verified against source: 2026-07-23.

## Required authority

Use one storefront checkout/payment authority chain only:

```text
WooCommerce Store API cart/session
+ assigned WooCommerce Checkout page with Checkout Block
+ official WooCommerce Stripe Payment Gateway
+ DTB routing/presentation/readiness/order-observation/downstream queue
```

Do not enable WooPayments, Payment Plugins for Stripe, custom Stripe Checkout Sessions, React Stripe Elements, fake wallet buttons, copied gateway internals, DTB payment iframes, or mobile-specific duplicate payment surfaces as parallel storefront authorities.

Desktop and mobile must use one mounted Woo Checkout Block and one official Stripe payment runtime.

## Plugin and Stripe account configuration

1. Install and activate the official WooCommerce Stripe Payment Gateway.
2. Open `WooCommerce -> Settings -> Payments -> Stripe`.
3. Connect the intended Stripe account using the official extension flow.
4. Verify test mode before staging payments and live mode only at cutover.
5. Enable only intended card/local/express methods.
6. Verify Payment Method Configuration / Settings Sync is healthy.
7. Prefer automatic capture for launch unless a reviewed manual-capture workflow exists.
8. Verify Stripe webhook health for the active mode.
9. Verify HTTPS for the entire public site.
10. Verify payment-method domain registration and Apple Pay domain association when wallets are enabled.
11. Disable WooPayments and other competing storefront card/wallet gateways.

## WooCommerce checkout configuration

1. Confirm the Checkout page is assigned under `WooCommerce -> Settings -> Advanced`.
2. Confirm its content contains the WooCommerce Checkout Block.
3. Confirm `/checkout/` returns a WordPress/WooCommerce document, not React `index.html`.
4. Confirm Checkout Block and official Stripe scripts/styles are present and not stripped by the headless theme.
5. Confirm `GET /wp-json/dtb/v1/checkout/capabilities` reports:
   - `checkout=woo_native_checkout_block`;
   - `provider=woocommerce_stripe`;
   - official Stripe extension active;
   - official Stripe gateway enabled;
   - Checkout Block present;
   - HTTPS true;
   - no competing WooPayments authority.

The public capabilities request must remain local/non-blocking and secret-free.

## Responsive checkout UI contract

### Desktop

Verify:

1. Continuous two-column checkout renders without progressive hiding.
2. Left rail order is Express Checkout -> Contact -> Shipping -> Delivery -> Payment -> Place Order.
3. Canonical Woo Order Summary is in the right rail and remains usable/sticky without covering content.
4. No duplicate Contact/Shipping/Payment sections exist.
5. Payment remains inline and provider-owned.

### Mobile

Verify:

1. Three-step progress control shows Contact, Shipping, Payment.
2. Contact is the initial active step.
3. Eligible official Express Checkout appears first on Contact.
4. `Continue to shipping` changes presentation only and does not create an order/payment.
5. Shipping shows Woo-owned address/billing/delivery controls.
6. `Continue to payment` reveals the same inline mounted official Stripe payment surface.
7. There is no DTB bottom sheet, payment modal, duplicate Payment Element, or second Stripe runtime.
8. The native Woo Place Order action is the only final submit control.
9. Previously visited steps can be revisited without losing Woo state.
10. Future steps are not freely navigable before they have been reached.
11. Woo validation/focus can reveal the owning hidden step when an invalid control requires attention.
12. Mobile -> desktop -> mobile resizing leaves no stale hidden sections, duplicated controls, overlays, or lost payment state.
13. Touch targets, keyboard focus, focus-visible states, labels, contrast, and reduced-motion behavior are acceptable.

## Provider mount/runtime safety

Verify:

1. Exactly one effective Stripe.js runtime loads.
2. Stripe.js executes from `js.stripe.com`, not from a SiteGround combined same-origin bundle.
3. No console errors report:
   - `Stripe.js must be loaded from js.stripe.com`;
   - `Stripe.js was loaded more than one time`;
   - invalid `stripe` prop supplied to Elements.
4. Inactive mobile payment/express sections remain mounted/measurable without becoming keyboard/accessibility targets.
5. Provider-owned controls are never cloned, reparented, or remounted by DTB.
6. Stripe challenges/3DS/modals remain provider-owned and functional.

## Stripe appearance contract

Verify the provider-hosted payment UI visually aligns with DTB through the supported official gateway Appearance configuration only:

- DTB primary blue;
- DTB typography stack;
- 12px field/tab radii;
- bordered white inputs with blue focus ring;
- soft-blue selected payment tabs;
- accessible error states.

Do not CSS into Stripe iframes or replace provider controls.

## Performance and stability contract

1. Private `/checkout/` HTML is never prefetched/cached as a generic public page.
2. SiteGround optimization exclusions preserve WordPress/Woo/Stripe dependency order.
3. Stripe.js remains excluded from external-script combination/rehosting.
4. Runtime telemetry captures bounded JS/resource failures, provider timeout, root replacement/state-loss suspicion, vitals, and unexpected third-party hosts.
5. Telemetry contains no raw form values, emails, order keys, bearer/JWT tokens, Stripe secrets/client secrets, or integration credentials.
6. Wholesale Checkout Block root replacement during address/shipping changes does not wipe populated controls.
7. If the official payment surface does not become ready within the bounded timeout, recovery UI may reload options or point to a real eligible express surface only.
8. Recovery never creates another PaymentIntent, Payment Element, Checkout Session, wallet button, or submit path.
9. On enhanced mobile, payment timeout monitoring begins when the Payment step is active.
10. `private/no-store` remains enforced for checkout/session/payment routes.

## Routing and cache checks

Confirm these are WordPress/WooCommerce-owned and private/no-store:

```text
https://elliottm4.sg-host.com/checkout/
https://elliottm4.sg-host.com/checkout/order-pay/{order_id}/?key=wc_order_...
https://elliottm4.sg-host.com/checkout/order-received/{order_id}/?key=wc_order_...
https://elliottm4.sg-host.com/?wc-api=wc_stripe
```

Confirm staging checkout routes also enter WordPress rather than a staging React index.

Confirm `.htaccess` cache behavior does not replace/corrupt WordPress/Woo `Set-Cookie` headers.

When Apple Pay is enabled, verify the domain association file is reachable at:

```text
https://elliottm4.sg-host.com/.well-known/apple-developer-merchantid-domain-association
```

## React cart/session continuity

1. Add a real simple SKU in React.
2. Change quantity and immediately checkout; Checkout Block must show the final quantity.
3. Repeat from cart drawer; pending/debounced Store API mutations must settle before navigation.
4. Add a variable product and confirm exact variation/SKU/quantity.
5. Reload React cart then navigate to checkout; cart remains identical.
6. Back/forward/re-open checkout does not create a second session/cart.
7. Same-origin React uses Woo cookie session + Store API `Nonce`.
8. React renders no Stripe payment fields/wallet iframes or synthetic authoritative final totals.

## Payment matrix — Stripe test mode

Test at minimum:

1. Successful card payment.
2. Declined card.
3. 3DS/SCA success.
4. 3DS/SCA cancellation/failure.
5. Retry via Woo order-pay.
6. Browser refresh during checkout without duplicate order/payment.
7. Double-click/repeated Place Order does not create duplicate orders.
8. Apple Pay eligible and ineligible cases.
9. Google Pay eligible and ineligible cases.
10. Link behavior when enabled.
11. Cash App Pay/Affirm/Klarna or other configured methods render only when provider eligible.
12. Address/shipping-rate changes immediately before payment recalculate Woo totals correctly.
13. Coupon/tax/shipping final total exactly matches Stripe-processed amount.
14. Mobile widths 320/375/390/430px and orientation changes.
15. Payment-provider load failure shows bounded recovery with no second payment authority.

## Order/payment contract checks

For a successful paid Stripe order confirm:

```text
_dtb_checkout_gateway = woo_native_stripe
_dtb_checkout_contract_version = woo-stripe-v1
_dtb_payment_provider = woocommerce_stripe
_dtb_payment_ref = non-empty non-secret transaction/payment reference
_dtb_payment_captured = 1
```

Confirm WooCommerce `date_paid` exists before DTB considers the order captured/fulfillable.

## Duplicate-side-effect and webhook replay matrix

For one successful order:

1. Replay/re-deliver Stripe webhook where tooling permits.
2. Re-trigger Woo processing/completed transitions where safe in staging.
3. Veeqo dispatch occurs once.
4. QuickBooks create projection occurs once.
5. Tracking/notification jobs are not duplicated.
6. Atomic order dispatch barrier prevents duplicate initial downstream effects.
7. Failed/unpaid/cancelled orders do not dispatch fulfillment/accounting.

## Refund matrix

1. Create partial refund A and record Woo `refund_id`.
2. Confirm QuickBooks uses only refund A amount.
3. Create partial refund B with distinct identity.
4. Confirm refund B is not suppressed by refund A.
5. Replay refund A and confirm no duplicate QuickBooks refund.
6. Test full refund after partial refunds where business rules permit.
7. Parent order status does not cause partial refund to be treated as cancellation.
8. Verify Veeqo/fulfillment compensation separately from accounting projection.

## Validation commands

Frontend:

```powershell
cd frontend
npm ci --include=dev
npm run lint
npm run build
```

Targeted PHP syntax:

```powershell
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/bootstrap.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/WooNativeCheckoutRuntime.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/OfficialStripeNativeCheckout.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/CheckoutPerformance.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/CheckoutRuntimeIntegrity.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Templates/WooNativeCheckoutPage.php
```

Also validate JavaScript syntax for changed checkout assets and inspect the final diff for stale deleted-file references.

If a referenced smoke script is absent from active source, do not claim it passed.

## Go-live gate

Do not enable live payment acceptance until:

- native Checkout Block visibly renders on production routing;
- official Stripe gateway is connected/healthy;
- webhook health confirmed for active mode;
- desktop and mobile responsive checkout contracts pass;
- mobile Contact -> Shipping -> Payment is session/state preserving;
- no bottom sheet/duplicate payment runtime remains;
- provider mounting/origin/runtime integrity checks pass;
- card/3DS/express eligibility tests pass in test mode;
- cart/session continuity passes React -> Woo checkout;
- no unexplained checkout third-party scripts remain;
- checkout rerenders do not wipe populated form state;
- provider timeout recovery remains Woo/provider safe;
- duplicate order/payment/downstream tests pass;
- partial/multiple refund accounting tests pass;
- rollback artifact and operational recovery procedure are verified.

Visual polish or synthetic performance scores never override payment correctness, session integrity, security, idempotency, or provider-runtime verification.
