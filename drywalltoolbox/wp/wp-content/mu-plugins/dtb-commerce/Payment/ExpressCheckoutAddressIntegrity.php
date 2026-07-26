<?php
/**
 * Stripe Express Checkout address compatibility boundary.
 *
 * The official WooCommerce Stripe extension remains the owner of Apple Pay,
 * Google Pay, Link, address collection, shipping-option refresh, checkout
 * submission, and payment confirmation. This class only canonicalizes equivalent
 * provider field shapes before WooCommerce validates them and emits redacted
 * diagnostics when the verified Express Checkout Store API flow fails.
 *
 * It never invents an address, geocodes a destination, bypasses WooCommerce
 * validation, creates a payment intent/session, or handles Stripe secrets.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_ExpressCheckoutAddressIntegrity {
	private const MIN_NORMALIZATION_VERSION = '10.2.0';
	private const MIN_RECOMMENDED_VERSION   = '10.7.0';
	private const EXPRESS_HEADER            = 'x-wcstripe-express-checkout';
	private const EXPRESS_NONCE_HEADER      = 'x-wcstripe-express-checkout-nonce';
	private const EXPRESS_NONCE_ACTION      = 'wc_store_api_express_checkout';

	/** Store API routes that may carry canonical checkout addresses. */
	private const ADDRESS_ROUTES = [
		'/wc/store/v1/cart/update-customer',
		'/wc/store/v1/checkout',
	];

	public static function register(): void {
		// Official Stripe 10.2+ AJAX normalization boundary.
		add_filter( 'wc_stripe_express_checkout_normalize_address', [ __CLASS__, 'normalize' ], 20, 2 );

		// Compatibility with older Payment Request shipping updates.
		add_filter( 'wc_stripe_payment_request_shipping_posted_values', [ __CLASS__, 'normalize_legacy' ], 20 );

		// Stripe 10.9+ uses verified Store API address updates. Running before the
		// extension's own priority-10 normalizer is safe because this transform is
		// idempotent and gated by the same signed request context.
		add_filter( 'rest_pre_dispatch', [ __CLASS__, 'normalize_store_api_request' ], 9, 3 );
		add_filter( 'rest_request_after_callbacks', [ __CLASS__, 'observe_store_api_response' ], 20, 3 );

		add_action( 'wc_stripe_express_checkout_after_checkout_validation', [ __CLASS__, 'observe_validation' ], 20, 2 );
		add_action( 'admin_notices', [ __CLASS__, 'admin_notice' ] );
	}

	/**
	 * Normalize provider address aliases into WooCommerce canonical keys.
	 *
	 * @param mixed $normalized_data Address already normalized by Stripe.
	 * @param mixed $data            Original provider address payload.
	 * @return array<string,mixed>
	 */
	public static function normalize( $normalized_data, $data ): array {
		$normalized = is_array( $normalized_data ) ? $normalized_data : [];
		$raw        = is_array( $data ) ? $data : [];
		$sources    = self::address_sources( $raw );

		self::fill_text( $normalized, 'first_name', $sources, [ 'first_name', 'firstName', 'given_name', 'givenName', 'given' ] );
		self::fill_text( $normalized, 'last_name', $sources, [ 'last_name', 'lastName', 'family_name', 'familyName', 'family' ] );
		self::fill_text( $normalized, 'company', $sources, [ 'company', 'organization', 'organisation' ] );
		self::fill_text( $normalized, 'city', $sources, [ 'city', 'locality', 'town', 'postal_town', 'postalTown' ] );
		self::fill_text( $normalized, 'phone', $sources, [ 'phone', 'phone_number', 'phoneNumber' ] );
		self::fill_email( $normalized, 'email', $sources, [ 'email', 'email_address', 'emailAddress' ] );
		self::fill_address_lines( $normalized, $sources );

		$country = self::canonical_country(
			self::first_value( $sources, [ 'country', 'country_code', 'countryCode', 'country_code_alpha2' ] )
				?: ( $normalized['country'] ?? '' )
		);
		if ( '' !== $country ) {
			$normalized['country'] = $country;
		}

		$state = self::first_value( $sources, [ 'state', 'region', 'administrative_area', 'administrativeArea', 'province' ] );
		if ( '' === self::scalar_text( $state ) ) {
			$state = $normalized['state'] ?? '';
		}
		$state = self::canonical_state( (string) ( $normalized['country'] ?? '' ), $state );
		if ( '' !== $state ) {
			$normalized['state'] = $state;
		}

		$postcode = self::first_value( $sources, [ 'postcode', 'postal_code', 'postalCode', 'zip', 'zip_code', 'zipCode' ] );
		if ( '' === self::scalar_text( $postcode ) ) {
			$postcode = $normalized['postcode'] ?? '';
		}
		$postcode = self::canonical_postcode( (string) ( $normalized['country'] ?? '' ), $postcode );
		if ( '' !== $postcode ) {
			$normalized['postcode'] = $postcode;
		}

		self::split_full_name_when_needed( $normalized, $sources );

		return $normalized;
	}

	/** @param mixed $shipping_address @return array<string,mixed> */
	public static function normalize_legacy( $shipping_address ): array {
		$address = is_array( $shipping_address ) ? $shipping_address : [];
		return self::normalize( $address, $address );
	}

	/**
	 * Normalize verified Stripe Express Checkout Store API address parameters.
	 *
	 * This supports the current tokenized-cart flow without weakening Store API
	 * nonce/header checks or changing ordinary checkout/cart requests.
	 *
	 * @param mixed           $response Existing pre-dispatch response.
	 * @param WP_REST_Server  $server   REST server instance.
	 * @param WP_REST_Request $request  Current request.
	 * @return mixed
	 */
	public static function normalize_store_api_request( $response, $server, $request ) {
		unset( $server );

		if ( ! $request instanceof WP_REST_Request || ! self::is_verified_express_request( $request ) ) {
			return $response;
		}

		if ( ! in_array( $request->get_route(), self::ADDRESS_ROUTES, true ) ) {
			return $response;
		}

		$billing  = self::normalize_request_address( $request->get_param( 'billing_address' ) );
		$shipping = self::normalize_request_address( $request->get_param( 'shipping_address' ) );

		// Wallets may provide the recipient name once in billing/contact details.
		// Reuse only present canonical values; never synthesize a customer identity.
		foreach ( [ 'first_name', 'last_name' ] as $field ) {
			if ( '' === self::scalar_text( $shipping[ $field ] ?? '' ) && '' !== self::scalar_text( $billing[ $field ] ?? '' ) ) {
				$shipping[ $field ] = $billing[ $field ];
			}
			if ( '' === self::scalar_text( $billing[ $field ] ?? '' ) && '' !== self::scalar_text( $shipping[ $field ] ?? '' ) ) {
				$billing[ $field ] = $shipping[ $field ];
			}
		}

		if ( ! empty( $billing ) ) {
			$request->set_param( 'billing_address', $billing );
		}
		if ( ! empty( $shipping ) ) {
			$request->set_param( 'shipping_address', $shipping );
		}

		return $response;
	}

	/**
	 * Observe failed verified Express Checkout Store API responses without PII.
	 *
	 * @param mixed           $response Response generated by the route callback.
	 * @param mixed           $handler  Route handler metadata.
	 * @param WP_REST_Request $request  Current request.
	 * @return mixed
	 */
	public static function observe_store_api_response( $response, $handler, $request ) {
		unset( $handler );

		if ( ! $request instanceof WP_REST_Request || ! self::is_verified_express_request( $request ) ) {
			return $response;
		}

		$status = 0;
		$codes  = [];
		if ( is_wp_error( $response ) ) {
			$status = (int) ( $response->get_error_data()['status'] ?? 500 );
			$codes  = $response->get_error_codes();
		} elseif ( $response instanceof WP_REST_Response ) {
			$status = (int) $response->get_status();
			$data   = $response->get_data();
			if ( is_array( $data ) && isset( $data['code'] ) ) {
				$codes[] = $data['code'];
			}
		}

		if ( $status >= 400 ) {
			self::log_failure(
				'stripe_express_checkout_store_api_failed',
				[
					'route'       => sanitize_text_field( $request->get_route() ),
					'status'      => $status,
					'error_codes' => self::sanitize_error_codes( $codes ),
				]
			);
		}

		return $response;
	}

	/**
	 * Log custom-field validation codes only. Never log wallet payloads, names,
	 * street addresses, email addresses, phone numbers, or payment data.
	 *
	 * @param mixed $custom_checkout_data Unused provider checkout data.
	 * @param mixed $errors               Validation errors.
	 */
	public static function observe_validation( $custom_checkout_data, $errors ): void {
		unset( $custom_checkout_data );

		if ( ! $errors instanceof WP_Error || ! $errors->has_errors() ) {
			return;
		}

		self::log_failure(
			'stripe_express_checkout_validation_failed',
			[
				'error_codes' => self::sanitize_error_codes( $errors->get_error_codes() ),
				'error_count' => count( $errors->get_error_codes() ),
				'source'      => 'woocommerce_stripe_express_checkout',
			]
		);
	}

	public static function admin_notice(): void {
		if ( ! is_admin() || ! current_user_can( 'manage_woocommerce' ) || ! defined( 'WC_STRIPE_VERSION' ) ) {
			return;
		}

		$version = sanitize_text_field( (string) WC_STRIPE_VERSION );
		if ( '' === $version || version_compare( $version, self::MIN_RECOMMENDED_VERSION, '>=' ) ) {
			return;
		}

		$severity = version_compare( $version, self::MIN_NORMALIZATION_VERSION, '<' ) ? 'notice-error' : 'notice-warning';
		echo '<div class="notice ' . esc_attr( $severity ) . '"><p>'
			. esc_html(
				sprintf(
					/* translators: 1: installed version, 2: recommended minimum version. */
					__( 'Drywall Toolbox detected WooCommerce Stripe Gateway %1$s. Update the official Stripe extension to %2$s or newer before accepting Express Checkout payments; current releases include Store API, Apple Pay, Google Pay, and checkout-session reliability fixes.', 'drywall-toolbox' ),
					$version,
					self::MIN_RECOMMENDED_VERSION
				)
			)
			. '</p></div>';
	}

	/** @param mixed $address @return array<string,mixed> */
	private static function normalize_request_address( $address ): array {
		if ( ! is_array( $address ) ) {
			return [];
		}
		return self::normalize( $address, $address );
	}

	private static function is_verified_express_request( WP_REST_Request $request ): bool {
		$route = $request->get_route();
		if ( ! str_starts_with( $route, '/wc/store/v1/cart' ) && ! str_starts_with( $route, '/wc/store/v1/checkout' ) ) {
			return false;
		}

		$context = strtolower( sanitize_text_field( (string) $request->get_header( self::EXPRESS_HEADER ) ) );
		if ( 'true' !== $context ) {
			return false;
		}

		$nonce = sanitize_text_field( (string) $request->get_header( self::EXPRESS_NONCE_HEADER ) );
		return '' !== $nonce && (bool) wp_verify_nonce( $nonce, self::EXPRESS_NONCE_ACTION );
	}

	/** @return array<int,array<string,mixed>> */
	private static function address_sources( array $raw ): array {
		$sources = [ $raw ];
		foreach ( [ 'shipping_address', 'shippingAddress', 'shipping', 'address', 'billing_address', 'billingAddress', 'name' ] as $key ) {
			if ( isset( $raw[ $key ] ) && is_array( $raw[ $key ] ) ) {
				$sources[] = $raw[ $key ];
			}
		}
		return $sources;
	}

	private static function fill_text( array &$normalized, string $target, array $sources, array $aliases ): void {
		if ( '' !== self::scalar_text( $normalized[ $target ] ?? '' ) ) {
			$normalized[ $target ] = sanitize_text_field( self::scalar_text( $normalized[ $target ] ) );
			return;
		}
		$value = self::scalar_text( self::first_value( $sources, $aliases ) );
		if ( '' !== $value ) {
			$normalized[ $target ] = sanitize_text_field( $value );
		}
	}

	private static function fill_email( array &$normalized, string $target, array $sources, array $aliases ): void {
		$value = self::scalar_text( $normalized[ $target ] ?? '' );
		if ( '' === $value ) {
			$value = self::scalar_text( self::first_value( $sources, $aliases ) );
		}
		if ( '' !== $value ) {
			$normalized[ $target ] = sanitize_email( $value );
		}
	}

	private static function fill_address_lines( array &$normalized, array $sources ): void {
		$line_one = self::scalar_text( $normalized['address_1'] ?? '' );
		$line_two = self::scalar_text( $normalized['address_2'] ?? '' );

		$address_lines = self::first_value( $sources, [ 'addressLine', 'address_lines', 'addressLines' ] );
		if ( is_array( $address_lines ) ) {
			$clean_lines = array_values(
				array_filter(
					array_map(
						static fn ( $line ): string => sanitize_text_field( self::scalar_text( $line ) ),
						$address_lines
					),
					static fn ( string $line ): bool => '' !== $line
				)
			);
			if ( '' === $line_one && isset( $clean_lines[0] ) ) {
				$line_one = $clean_lines[0];
			}
			if ( '' === $line_two && count( $clean_lines ) > 1 ) {
				$line_two = implode( ', ', array_slice( $clean_lines, 1 ) );
			}
		} elseif ( '' === $line_one && '' !== self::scalar_text( $address_lines ) ) {
			$line_one = sanitize_text_field( self::scalar_text( $address_lines ) );
		}

		if ( '' === $line_one ) {
			$line_one = sanitize_text_field(
				self::scalar_text(
					self::first_value( $sources, [ 'address_1', 'address1', 'address_line_1', 'line1', 'street', 'street_address', 'streetAddress' ] )
				)
			);
		}
		if ( '' === $line_two ) {
			$line_two = sanitize_text_field(
				self::scalar_text(
					self::first_value( $sources, [ 'address_2', 'address2', 'address_line_2', 'line2', 'apartment', 'unit' ] )
				)
			);
		}

		if ( '' !== $line_one ) {
			$normalized['address_1'] = $line_one;
		}
		if ( '' !== $line_two ) {
			$normalized['address_2'] = $line_two;
		}
	}

	private static function split_full_name_when_needed( array &$normalized, array $sources ): void {
		if ( '' !== self::scalar_text( $normalized['first_name'] ?? '' ) && '' !== self::scalar_text( $normalized['last_name'] ?? '' ) ) {
			return;
		}

		$full_name = sanitize_text_field(
			self::scalar_text( self::first_value( $sources, [ 'name', 'recipient', 'recipient_name', 'recipientName' ] ) )
		);
		if ( '' === $full_name ) {
			return;
		}

		$parts = preg_split( '/\s+/', trim( $full_name ) ) ?: [];
		if ( empty( $parts ) ) {
			return;
		}
		if ( '' === self::scalar_text( $normalized['first_name'] ?? '' ) ) {
			$normalized['first_name'] = sanitize_text_field( (string) array_shift( $parts ) );
		}
		if ( '' === self::scalar_text( $normalized['last_name'] ?? '' ) && ! empty( $parts ) ) {
			$normalized['last_name'] = sanitize_text_field( implode( ' ', $parts ) );
		}
	}

	private static function canonical_country( $value ): string {
		$country = strtoupper( sanitize_text_field( self::scalar_text( $value ) ) );
		if ( 2 === strlen( $country ) ) {
			return $country;
		}

		$aliases = [
			'USA'                      => 'US',
			'UNITED STATES'            => 'US',
			'UNITED STATES OF AMERICA' => 'US',
		];
		if ( isset( $aliases[ $country ] ) ) {
			return $aliases[ $country ];
		}

		if ( function_exists( 'WC' ) && WC()->countries ) {
			foreach ( (array) WC()->countries->get_countries() as $code => $name ) {
				if ( 0 === strcasecmp( sanitize_text_field( (string) $name ), $country ) ) {
					return strtoupper( sanitize_text_field( (string) $code ) );
				}
			}
		}

		return '';
	}

	private static function canonical_state( string $country, $value ): string {
		$state = sanitize_text_field( self::scalar_text( $value ) );
		if ( '' === $state ) {
			return '';
		}

		$country = strtoupper( sanitize_text_field( $country ) );
		if ( function_exists( 'WC' ) && WC()->countries && '' !== $country ) {
			$states = (array) WC()->countries->get_states( $country );
			foreach ( $states as $code => $name ) {
				if ( 0 === strcasecmp( (string) $code, $state ) || 0 === strcasecmp( sanitize_text_field( (string) $name ), $state ) ) {
					return strtoupper( sanitize_text_field( (string) $code ) );
				}
			}
		}

		return strtoupper( $state );
	}

	private static function canonical_postcode( string $country, $value ): string {
		$postcode = strtoupper( sanitize_text_field( self::scalar_text( $value ) ) );
		$postcode = preg_replace( '/\s+/', ' ', trim( $postcode ) ) ?: '';
		if ( 'US' !== strtoupper( $country ) ) {
			return $postcode;
		}

		$digits = preg_replace( '/\D+/', '', $postcode ) ?: '';
		if ( strlen( $digits ) >= 9 ) {
			return substr( $digits, 0, 5 ) . '-' . substr( $digits, 5, 4 );
		}
		if ( 5 === strlen( $digits ) ) {
			return $digits;
		}
		return $postcode;
	}

	/** @return mixed */
	private static function first_value( array $sources, array $aliases ) {
		foreach ( $sources as $source ) {
			if ( ! is_array( $source ) ) {
				continue;
			}
			foreach ( $aliases as $alias ) {
				if ( ! array_key_exists( $alias, $source ) ) {
					continue;
				}
				$value = $source[ $alias ];
				if ( is_array( $value ) && ! empty( $value ) ) {
					return $value;
				}
				if ( '' !== self::scalar_text( $value ) ) {
					return $value;
				}
			}
		}
		return '';
	}

	/** @param array<int,mixed> $codes @return array<int,string> */
	private static function sanitize_error_codes( array $codes ): array {
		return array_values(
			array_unique(
				array_filter( array_map( static fn ( $code ): string => sanitize_key( (string) $code ), $codes ) )
			)
		);
	}

	/** @param array<string,mixed> $context */
	private static function log_failure( string $event, array $context ): void {
		if ( function_exists( 'dtb_security_log' ) ) {
			dtb_security_log( sanitize_key( $event ), $context );
			return;
		}

		if ( function_exists( 'wc_get_logger' ) ) {
			wc_get_logger()->warning( sanitize_key( $event ), [ 'source' => 'dtb-stripe-express-checkout' ] + $context );
		}
	}

	private static function scalar_text( $value ): string {
		return is_scalar( $value ) ? trim( (string) $value ) : '';
	}
}

DTB_ExpressCheckoutAddressIntegrity::register();
