# Checkout Tax Readiness

## Authority

WooCommerce is the sole commerce and tax-calculation authority for Drywall Toolbox checkout. DTB does not maintain a parallel tax table and must not hard-code statutory tax percentages in application code.

The current storefront policy deliberately sources WooCommerce tax from the configured shop base location. The sourcing policy is implemented by `DTB_CheckoutTaxReadiness`; the applicable rate itself remains WooCommerce configuration.

## Production invariant

A taxable order must not reach payment when WooCommerce cannot resolve an applicable tax rate for the configured shop-base location and the tax class used by the order.

`DTB_CheckoutTaxReadiness::validate_order_before_payment()` runs on WooCommerce's pre-payment checkout validation hook. For taxable order items it:

1. confirms WooCommerce tax calculation is enabled;
2. resolves the exact configured shop-base country, state, postcode, and city;
3. asks `WC_Tax::find_rates()` for each taxable order-item tax class;
4. blocks checkout before payment when any required class has no applicable rate.

This guard does not calculate tax itself. When rates exist, WooCommerce remains responsible for cart/order tax totals and tax lines.

## Operator diagnostics

The wp-admin notice uses the same exact shop-base lookup rather than a state-only probe. A missing Standard rate is a blocking production configuration error and is rendered as an error notice with a link to WooCommerce Standard tax rates.

The current shop-base sourcing policy must not be changed to shipping/destination sourcing as an incidental fix. That is a business/tax-policy decision requiring explicit approval.

## Historical orders

Existing paid orders retain their captured WooCommerce tax totals. Do not retroactively add tax to a captured order merely because a rate was later configured; doing so can make the WooCommerce order total diverge from the amount actually captured by the payment provider and from downstream accounting projections.

## Deployment checklist

Before accepting taxable orders:

- WooCommerce tax calculation is enabled.
- The shop base address is accurate.
- Standard and any other product tax classes used by the catalog have applicable WooCommerce rates for that base location.
- A checkout quote shows non-zero tax for a known taxable cart.
- The finalized WooCommerce order contains tax lines and `total_tax` matching the checkout amount.
- Payment capture amount equals the finalized WooCommerce order total.
