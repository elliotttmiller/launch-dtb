<?php
/**
 * Canonical WooCommerce checkout-field policy.
 *
 * WooCommerce remains authoritative for checkout persistence and validation. DTB
 * registers the customer identity fields in the Checkout Block contact location,
 * then mirrors those values into WooCommerce's canonical billing/shipping address
 * properties so orders, customers, tax, shipping, fraud checks, and integrations
 * continue to consume standard WooCommerce fields.
 *
 * Checkout presentation belongs to the active theme; this class intentionally
 * owns no CSS/JS or rendering behavior.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CheckoutFieldPolicy {
	private const FIELD_FIRST_NAME = 'dtb-checkout/contact-first-name';
	private const FIELD_LAST_NAME  = 'dtb-checkout/contact-last-name';
	private const FIELD_PHONE      = 'dtb-checkout/contact-phone';

	public static function register(): void {
		add_filter( 'option_woocommerce_checkout_phone_field', [ __CLASS__, 'optional_phone' ] );
		add_filter( 'default_option_woocommerce_checkout_phone_field', [ __CLASS__, 'optional_phone' ] );
		add_action( 'woocommerce_init', [ __CLASS__, 'register_contact_fields' ] );
		add_action( 'woocommerce_store_api_checkout_update_order_meta', [ __CLASS__, 'sync_contact_fields_to_order' ], 20, 1 );
	}

	/** Keep the standard WooCommerce phone field visible but optional. */
	public static function optional_phone( $value ): string {
		return 'optional';
	}

	/** Register identity fields in the supported Checkout Block contact location. */
	public static function register_contact_fields(): void {
		if ( ! function_exists( 'woocommerce_register_additional_checkout_field' ) ) {
			return;
		}

		woocommerce_register_additional_checkout_field(
			[
				'id'         => self::FIELD_FIRST_NAME,
				'label'      => __( 'First name', 'drywall-toolbox' ),
				'location'   => 'contact',
				'type'       => 'text',
				'required'   => true,
				'attributes' => [
					'autocomplete' => 'given-name',
					'maxlength'    => '80',
				],
			]
		);

		woocommerce_register_additional_checkout_field(
			[
				'id'         => self::FIELD_LAST_NAME,
				'label'      => __( 'Last name', 'drywall-toolbox' ),
				'location'   => 'contact',
				'type'       => 'text',
				'required'   => true,
				'attributes' => [
					'autocomplete' => 'family-name',
					'maxlength'    => '80',
				],
			]
		);

		woocommerce_register_additional_checkout_field(
			[
				'id'            => self::FIELD_PHONE,
				'label'         => __( 'Phone', 'drywall-toolbox' ),
				'optionalLabel' => __( 'Phone (optional)', 'drywall-toolbox' ),
				'location'      => 'contact',
				'type'          => 'text',
				'required'      => false,
				'attributes'    => [
					'autocomplete' => 'tel',
					'inputmode'    => 'tel',
					'maxlength'    => '32',
				],
			]
		);
	}

	/**
	 * Copy supported contact fields into canonical order address properties.
	 *
	 * The browser presentation mirrors these fields into Woo's native address state
	 * before submission. This server-side copy is a defensive persistence boundary
	 * and is idempotent for repeated checkout-draft updates.
	 */
	public static function sync_contact_fields_to_order( WC_Order $order ): void {
		if ( ! class_exists( '\\Automattic\\WooCommerce\\Blocks\\Package' ) ) {
			return;
		}

		try {
			$checkout_fields = \Automattic\WooCommerce\Blocks\Package::container()->get(
				\Automattic\WooCommerce\Blocks\Domain\Services\CheckoutFields::class
			);
			$first_name = sanitize_text_field( (string) $checkout_fields->get_field_from_object( self::FIELD_FIRST_NAME, $order, 'other' ) );
			$last_name  = sanitize_text_field( (string) $checkout_fields->get_field_from_object( self::FIELD_LAST_NAME, $order, 'other' ) );
			$phone      = sanitize_text_field( (string) $checkout_fields->get_field_from_object( self::FIELD_PHONE, $order, 'other' ) );
		} catch ( Throwable $error ) {
			return;
		}

		if ( '' !== $first_name ) {
			$order->set_billing_first_name( $first_name );
			$order->set_shipping_first_name( $first_name );
		}
		if ( '' !== $last_name ) {
			$order->set_billing_last_name( $last_name );
			$order->set_shipping_last_name( $last_name );
		}
		if ( '' !== $phone ) {
			$order->set_billing_phone( $phone );
			if ( is_callable( [ $order, 'set_shipping_phone' ] ) ) {
				$order->set_shipping_phone( $phone );
			}
		}
	}
}
