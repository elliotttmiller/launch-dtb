<?php
/**
 * Stripe Elements Appearance API integration for Payment Plugins for Stripe
 * WooCommerce (woo-stripe-payment).
 *
 * The Universal Payment Method gateway (`stripe_upm`) mounts Stripe's Payment
 * Element inside a cross-origin iframe. Page-level CSS cannot reach the tab
 * list, card inputs, or labels rendered inside that iframe — Stripe's own
 * documented mechanism for that is the Elements Appearance API, passed at
 * element-initialization time. Payment Plugins for Stripe exposes this via
 * the `wc_stripe_get_element_options` filter, which fires while building the
 * options object handed to `elements()->create()`.
 *
 * Reference: https://docs.stripe.com/elements/appearance-api
 * Reference: https://paymentplugins.com/documentation/stripe/code-examples/customize-payment-form/
 *
 * This class owns brand-token appearance only. It does not select gateways,
 * change eligibility, or touch tokenization/confirmation/capture — those
 * remain exclusively owned by Payment Plugins for Stripe.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_StripeElementAppearance {
	private const UPM_GATEWAY_ID = 'stripe_upm';

	public static function register(): void {
		add_filter( 'wc_stripe_get_element_options', [ __CLASS__, 'apply_brand_appearance' ], 10, 2 );
	}

	/**
	 * @param array $options Options passed to Stripe's elements.create()/update().
	 * @param mixed $gateway The WC_Payment_Gateway instance initializing elements.
	 * @return array
	 */
	public static function apply_brand_appearance( array $options, $gateway ): array {
		$gateway_id = is_object( $gateway ) ? sanitize_key( (string) ( $gateway->id ?? '' ) ) : '';
		if ( self::UPM_GATEWAY_ID !== $gateway_id ) {
			return $options;
		}

		// WC_Payment_Gateway_Stripe_UPM::get_element_options() already sets
		// appearance.theme from the merchant's own admin selection (Default,
		// Night, Flat — see Universal Payment Method settings). Preserve that
		// choice; only add brand variables/rules on top of it.
		$existing_theme = is_array( $options['appearance'] ?? null ) ? ( $options['appearance']['theme'] ?? 'stripe' ) : 'stripe';

		$options['appearance'] = [
			'theme'     => $existing_theme,
			'labels'    => 'floating',
			'variables' => [
				'fontFamily'             => '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
				'fontSizeBase'           => '16px', // Matches page inputs; avoids iOS Safari auto-zoom-on-focus.
				'colorPrimary'           => '#2f6feb',
				'colorText'              => '#101423',
				'colorTextSecondary'     => '#5b6273',
				'colorBackground'        => '#ffffff',
				'colorDanger'            => '#d92d20',
				'borderRadius'           => '8px',
				'spacingUnit'            => '4px',
			],
			'rules'     => [
				'.Tab' => [
					'border'     => '1px solid #e3e6eb',
					'boxShadow'  => 'none',
					'padding'    => '10px 12px',
				],
				'.Tab:hover' => [
					'color' => '#101423',
				],
				'.Tab--selected' => [
					'borderColor' => '#2f6feb',
					'boxShadow'   => '0 0 0 1px #2f6feb',
				],
				'.TabIcon--selected' => [
					'fill' => '#2f6feb',
				],
				'.TabLabel--selected' => [
					'color' => '#1d4fd1',
				],
				'.Label' => [
					'fontWeight' => '500',
				],
				'.Input' => [
					'border'    => '1px solid #c9ced8',
					'boxShadow' => 'none',
				],
				'.Input:focus' => [
					'border'    => '1px solid #2f6feb',
					'boxShadow' => '0 0 0 3px #eaf1ff',
				],
				'.Input--invalid' => [
					'border' => '1px solid #d92d20',
				],
				'.Error' => [
					'color' => '#d92d20',
				],
			],
		];

		return $options;
	}
}

DTB_StripeElementAppearance::register();
