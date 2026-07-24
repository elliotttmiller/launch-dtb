<?php
/**
 * WooCommerce tax readiness diagnostics for storefront checkout.
 *
 * WooCommerce remains the sole tax authority. DTB does not create or mutate tax
 * rates here; operators configure the applicable Minnesota rate in wp-admin.
 * This class only surfaces configuration gaps to authorized operators so taxable
 * checkout does not silently ship without a configured tax engine.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CheckoutTaxReadiness {
	public static function register(): void {
		add_action( 'admin_notices', [ __CLASS__, 'admin_notice' ] );
	}

	public static function admin_notice(): void {
		if ( ! is_admin() || ! current_user_can( 'manage_woocommerce' ) || ! class_exists( 'WooCommerce' ) ) {
			return;
		}

		if ( ! function_exists( 'wc_tax_enabled' ) || ! wc_tax_enabled() ) {
			echo '<div class="notice notice-warning"><p>'
				. esc_html__( 'Drywall Toolbox checkout tax is not active because WooCommerce tax calculations are disabled. Enable taxes in WooCommerce Settings before accepting taxable Minnesota orders.', 'drywall-toolbox' )
				. '</p></div>';
			return;
		}

		if ( ! self::has_minnesota_standard_rate() ) {
			echo '<div class="notice notice-warning"><p>'
				. esc_html__( 'Drywall Toolbox checkout uses WooCommerce as the only tax authority, but no applicable Standard tax rate was found for United States / Minnesota. Configure the Minnesota rate in WooCommerce Settings > Tax before accepting taxable Minnesota orders.', 'drywall-toolbox' )
				. '</p></div>';
		}
	}

	/**
	 * Read-only readiness probe for an operator-managed Minnesota Standard rate.
	 */
	private static function has_minnesota_standard_rate(): bool {
		if ( ! class_exists( 'WC_Tax' ) ) {
			return false;
		}

		try {
			$rates = WC_Tax::find_rates(
				[
					'country'   => 'US',
					'state'     => 'MN',
					'postcode'  => '',
					'city'      => '',
					'tax_class' => '',
				]
			);
		} catch ( Throwable $error ) {
			return false;
		}

		return ! empty( $rates );
	}
}
