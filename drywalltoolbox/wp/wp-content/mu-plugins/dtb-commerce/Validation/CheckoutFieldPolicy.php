<?php
/**
 * Canonical WooCommerce checkout-field policy.
 *
 * WooCommerce remains authoritative for checkout/customer/address persistence and
 * validation. DTB intentionally does not register duplicate first-name, last-name,
 * phone, shipping, or billing fields through the Additional Checkout Fields API.
 *
 * Express wallets (Apple Pay / Google Pay) populate WooCommerce's canonical customer
 * and shipping address state. Registering duplicate required DTB identity fields in
 * the Contact location creates a second validation domain that wallets do not own and
 * can cause valid wallet addresses to fail checkout validation. Presentation belongs
 * to the active theme; canonical business data belongs to WooCommerce.
 *
 * Historical orders may still contain legacy dtb-checkout/contact-* additional-field
 * metadata. That data is retained for compatibility and auditability, but it is no
 * longer written into or allowed to override canonical WooCommerce address fields.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CheckoutFieldPolicy {
	public static function register(): void {
		add_filter( 'option_woocommerce_checkout_phone_field', [ __CLASS__, 'optional_phone' ] );
		add_filter( 'default_option_woocommerce_checkout_phone_field', [ __CLASS__, 'optional_phone' ] );
	}

	/** Keep WooCommerce's canonical phone field available but optional. */
	public static function optional_phone( $value ): string {
		return 'optional';
	}
}
