<?php
/**
 * Canonical WooCommerce checkout-field policy.
 *
 * First name, last name, and phone are collected once, on the native Contact
 * step, via the officially documented Additional Checkout Fields API
 * (`woocommerce_register_additional_checkout_field()`, WooCommerce 8.9+,
 * location `contact`). This is a first-class WooCommerce Blocks field — Woo
 * renders its input, validates it, and persists it — not a client-side clone
 * of a native field kept in sync by JavaScript.
 *
 * Design history this file must not regress: an earlier version of this
 * class deliberately did *not* register such fields, because a *required*
 * Additional Checkout Field at the `contact` location creates a second
 * validation domain that Apple Pay / Google Pay / Link never populate —
 * those wallets write a name directly into WooCommerce's canonical
 * shipping/billing address, never into a Contact-location additional field —
 * and Store API checkout validation enforces a field's `required` flag
 * against every order, wallet-paid or not. A required-but-empty additional
 * field would fail a wallet order that already carries a complete, valid
 * name. These fields are therefore registered with `required => false`.
 * "Required" for the typed/card flow is instead enforced client-side, in
 * checkout.js's wizard step gate (the same place it already gates the
 * Shipping step on cart/shipping readiness) — wallet-driven orders never run
 * through that gate at all, so they are never blocked by it.
 *
 * The native `first_name`/`last_name` inputs are hidden from both the
 * shipping and billing address forms via `woocommerce_get_country_locale` —
 * the filter WooCommerce Blocks itself reads for address field
 * hidden/required state (the classic `woocommerce_checkout_fields` filter is
 * not read by the Checkout block). Country and email are never touched by
 * this class and remain mandatory.
 *
 * A single, non-destructive, one-directional sync copies a *non-empty*
 * Contact-step value onto the canonical billing/shipping name (always) and
 * phone (only if that side doesn't already have one) — so a wallet-supplied
 * name is never overwritten with a blank value, and WooCommerce remains the
 * single source of truth for the order's billing/shipping identity.
 *
 * Historical orders may still contain legacy dtb-checkout/contact-*
 * additional-field metadata from a prior, unrelated experiment. That data is
 * retained for compatibility and auditability only.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CheckoutFieldPolicy {
	private const FIRST_NAME_FIELD = 'dtb/first_name';
	private const LAST_NAME_FIELD  = 'dtb/last_name';
	private const PHONE_FIELD      = 'dtb/phone';

	public static function register(): void {
		add_filter( 'option_woocommerce_checkout_phone_field', [ __CLASS__, 'optional_phone' ] );
		add_filter( 'default_option_woocommerce_checkout_phone_field', [ __CLASS__, 'optional_phone' ] );

		add_action( 'woocommerce_init', [ __CLASS__, 'register_contact_fields' ] );
		add_filter( 'woocommerce_get_country_locale', [ __CLASS__, 'hide_native_name_fields' ] );
		add_action( 'woocommerce_set_additional_field_value', [ __CLASS__, 'sync_field_value' ], 10, 4 );
		add_action( 'woocommerce_store_api_checkout_order_processed', [ __CLASS__, 'sync_from_order' ], 5 );
	}

	/** Keep WooCommerce's canonical phone field available but optional. */
	public static function optional_phone( $value ): string {
		return 'optional';
	}

	/**
	 * Register the Contact-step name/phone fields via the Additional
	 * Checkout Fields API. Not required at the API level — see class
	 * docblock for why.
	 */
	public static function register_contact_fields(): void {
		if ( ! function_exists( 'woocommerce_register_additional_checkout_field' ) ) {
			return;
		}

		woocommerce_register_additional_checkout_field(
			[
				'id'         => self::FIRST_NAME_FIELD,
				'label'      => __( 'First name', 'drywall-toolbox' ),
				'location'   => 'contact',
				'type'       => 'text',
				'required'   => false,
				'attributes' => [ 'autocomplete' => 'given-name' ],
			]
		);

		woocommerce_register_additional_checkout_field(
			[
				'id'         => self::LAST_NAME_FIELD,
				'label'      => __( 'Last name', 'drywall-toolbox' ),
				'location'   => 'contact',
				'type'       => 'text',
				'required'   => false,
				'attributes' => [ 'autocomplete' => 'family-name' ],
			]
		);

		woocommerce_register_additional_checkout_field(
			[
				'id'         => self::PHONE_FIELD,
				'label'      => __( 'Phone', 'drywall-toolbox' ), // WooCommerce appends "(optional)" itself for non-required fields.
				'location'   => 'contact',
				'type'       => 'text',
				'required'   => false,
				'attributes' => [ 'autocomplete' => 'tel' ],
			]
		);
	}

	/**
	 * Hide the now-redundant native first/last name inputs on the shipping
	 * and billing address forms; the Contact step collects them instead.
	 *
	 * @param array $locale WooCommerce's per-country address locale map.
	 * @return array
	 */
	public static function hide_native_name_fields( $locale ): array {
		$locale = is_array( $locale ) ? $locale : [];
		foreach ( $locale as $country => $fields ) {
			foreach ( [ 'first_name', 'last_name' ] as $key ) {
				$field             = is_array( $fields[ $key ] ?? null ) ? $fields[ $key ] : [];
				$field['hidden']   = true;
				$field['required'] = false;
				$locale[ $country ][ $key ] = $field;
			}
		}
		return $locale;
	}

	/**
	 * Fires the moment WooCommerce persists a Contact-step field value onto
	 * an order or customer object. In-memory, immediate sync.
	 *
	 * @param string               $key       Registered field id.
	 * @param mixed                $value     Field value.
	 * @param string               $group     shipping|billing|other.
	 * @param WC_Order|WC_Customer $wc_object Object the value was saved to.
	 */
	public static function sync_field_value( string $key, $value, string $group, $wc_object ): void {
		unset( $group );
		if ( ! self::is_managed_field( $key ) ) {
			return;
		}
		self::apply_value( $wc_object, $key, is_scalar( $value ) ? (string) $value : '' );
	}

	/**
	 * Durable pass at order-processed time. Re-reads the Contact-step values
	 * straight from the order and re-applies them, so the sync survives
	 * regardless of exactly when, relative to Woo's own order save, the
	 * `woocommerce_set_additional_field_value` hook above fired.
	 *
	 * @param mixed $order
	 */
	public static function sync_from_order( $order ): void {
		$service = self::checkout_fields_service();
		if ( ! $order instanceof WC_Order || ! $service ) {
			return;
		}

		$changed = false;
		foreach ( [ self::FIRST_NAME_FIELD, self::LAST_NAME_FIELD, self::PHONE_FIELD ] as $field_id ) {
			try {
				$value = $service->get_field_from_object( $field_id, $order, 'other' );
			} catch ( Throwable $e ) {
				continue;
			}
			if ( is_scalar( $value ) && '' !== trim( (string) $value ) ) {
				$changed = self::apply_value( $order, $field_id, (string) $value ) || $changed;
			}
		}

		if ( $changed ) {
			$order->save();
		}
	}

	/**
	 * @param WC_Order|WC_Customer|mixed $wc_object
	 */
	private static function apply_value( $wc_object, string $field_id, string $value ): bool {
		$value = sanitize_text_field( $value );
		if ( '' === $value ) {
			return false; // Never overwrite a wallet-supplied name/phone with a blank value.
		}
		if ( ! $wc_object instanceof WC_Order && ! $wc_object instanceof WC_Customer ) {
			return false;
		}

		switch ( $field_id ) {
			case self::FIRST_NAME_FIELD:
				$wc_object->set_billing_first_name( $value );
				$wc_object->set_shipping_first_name( $value );
				return true;

			case self::LAST_NAME_FIELD:
				$wc_object->set_billing_last_name( $value );
				$wc_object->set_shipping_last_name( $value );
				return true;

			case self::PHONE_FIELD:
				if ( '' === trim( (string) $wc_object->get_billing_phone() ) ) {
					$wc_object->set_billing_phone( $value );
				}
				if ( method_exists( $wc_object, 'set_shipping_phone' ) && '' === trim( (string) $wc_object->get_shipping_phone() ) ) {
					$wc_object->set_shipping_phone( $value );
				}
				return true;
		}

		return false;
	}

	private static function is_managed_field( string $key ): bool {
		return in_array( $key, [ self::FIRST_NAME_FIELD, self::LAST_NAME_FIELD, self::PHONE_FIELD ], true );
	}

	/** @return object|null Automattic\WooCommerce\Blocks\Domain\Services\CheckoutFields instance. */
	private static function checkout_fields_service() {
		if (
			! class_exists( '\Automattic\WooCommerce\Blocks\Package' ) ||
			! class_exists( '\Automattic\WooCommerce\Blocks\Domain\Services\CheckoutFields' )
		) {
			return null;
		}
		try {
			return \Automattic\WooCommerce\Blocks\Package::container()->get( \Automattic\WooCommerce\Blocks\Domain\Services\CheckoutFields::class );
		} catch ( Throwable $e ) {
			return null;
		}
	}
}

DTB_CheckoutFieldPolicy::register();
