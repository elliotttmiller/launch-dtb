# Checkout Contact Identity Contract

Last verified against active source: 2026-07-24.

## Authority

WooCommerce is the only authoritative customer/address model for checkout.

Canonical values include:

```text
email
first_name
last_name
phone
shipping address
billing address
```

DTB must not register duplicate first-name, last-name, or phone fields through the WooCommerce Additional Checkout Fields API merely to reposition those values in the UI.

Retired duplicate field IDs remain prohibited:

```text
dtb-checkout/contact-first-name
dtb-checkout/contact-last-name
dtb-checkout/contact-phone
```

This protects Apple Pay and Google Pay from being required to satisfy a second DTB-only validation domain after the official Stripe/Woo wallet flow has already populated canonical Woo customer/shipping state.

## Mobile presentation

The active theme restores the intended Contact-step UX with theme-owned presentation proxies:

```text
Email address       -> native Woo Contact block
First name          -> presentation proxy -> canonical Woo first_name
Last name           -> presentation proxy -> canonical Woo last_name
Phone (optional)    -> presentation proxy -> canonical Woo phone
```

Files:

```text
themes/drywall-toolbox/assets/checkout/checkout-contact-identity.js
themes/drywall-toolbox/assets/checkout/checkout-contact-identity.css
```

These controls are not business-field registrations and are not an independent persistence layer. They mirror values into currently mounted Woo shipping/billing inputs using native input/change events so Checkout Blocks retain Store API validation, customer, shipping, tax, order, and integration ownership.

## Rerender behavior

Woo Checkout Blocks may replace address controls after customer/session/address updates. The contact bridge therefore resolves current native Woo input nodes on every synchronization instead of retaining stale element references.

The bridge may visually classify duplicate native first/last/phone address controls with `dtb-native-identity-field`, but those controls remain mounted in Woo's React tree. Payment-provider controls are never cloned, moved, replaced, or reparented.

## Mobile progression

Contact -> Shipping is a presentation transition and must not be disabled merely because Woo reports a background totals calculation caused by order-summary or express-wallet state.

Required contract:

```text
Contact
  -> visible email + first/last + optional phone
  -> browser-visible required validation for first/last
  -> synchronize canonical Woo identity inputs
  -> Continue to shipping remains tappable

Shipping
  -> Woo canonical address + delivery methods
  -> wait for Woo shipping/tax calculation readiness
  -> Continue to payment

Payment
  -> one inline official Woo/Stripe surface
  -> native Woo Place Order
```

Shipping -> Payment remains gated by Woo calculation readiness. Contact -> Shipping does not use global Woo calculation state as a hard disable condition.

## Verification

Run:

```powershell
.\scripts\smoke-dtb-checkout-contact-identity.ps1
.\scripts\smoke-dtb-checkout-ui.ps1
.\scripts\smoke-dtb-express-checkout-address.ps1
.\scripts\smoke-dtb-mu-modules.ps1
```

Mobile acceptance:

1. Guest Contact step shows Email, First name, Last name, Phone (optional), account option, and a tappable Continue to shipping button.
2. Required first/last fields block progression only when empty and focus the invalid visible control.
3. Entered identity values appear in Woo canonical Shipping/Billing state without duplicate visible controls.
4. Contact -> Shipping works even while unrelated background totals state is busy.
5. Shipping -> Payment waits for Woo address/rate/tax calculation readiness.
6. Apple Pay/Google Pay continue to use only canonical Woo customer/shipping state and are not required to populate DTB-specific fields.
7. Desktop checkout retains native Woo canonical address behavior; mobile proxy controls are removed outside the mobile breakpoint.
