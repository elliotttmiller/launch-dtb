<?php
/**
 * DTB Returns — public WooCommerce order lookup and return-request verification.
 *
 * WooCommerce remains the authority for orders. This controller exposes only a
 * minimal order summary and a short-lived signed token; customer PII, addresses,
 * payment data, line-item names, and totals are never returned by lookup.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the public order-lookup route used by the storefront return portal.
 */
function dtb_returns_public_lookup_register_route(): void {
	register_rest_route(
		'dtb/v1',
		'/returns/lookup',
		[
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'dtb_returns_rest_public_lookup',
			'permission_callback' => '__return_true',
			'args'                => [
				'order_number'   => [
					'type'              => 'string',
					'required'          => false,
					'sanitize_callback' => 'sanitize_text_field',
					'default'           => '',
				],
				'customer_email' => [
					'type'              => 'string',
					'required'          => false,
					'sanitize_callback' => 'sanitize_email',
					'default'           => '',
				],
				'customer_name'  => [
					'type'              => 'string',
					'required'          => false,
					'sanitize_callback' => 'sanitize_text_field',
					'default'           => '',
				],
			],
		]
	);
}
add_action( 'rest_api_init', 'dtb_returns_public_lookup_register_route' );

/**
 * Normalize a human-entered customer name for exact comparisons.
 */
function dtb_returns_normalize_customer_name( string $name ): string {
	$name = preg_replace( '/\s+/', ' ', trim( wp_strip_all_tags( $name ) ) );
	return function_exists( 'mb_strtolower' ) ? mb_strtolower( $name ) : strtolower( $name );
}

/**
 * Get the canonical billing full name for an order.
 */
function dtb_returns_order_customer_name( WC_Order $order ): string {
	return trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );
}

/**
 * Apply all non-empty lookup criteria to a WooCommerce order.
 */
function dtb_returns_order_matches_lookup(
	WC_Order $order,
	string $order_number,
	string $customer_email,
	string $customer_name
): bool {
	if ( '' !== $order_number ) {
		$expected = ltrim( trim( $order_number ), '#' );
		$actual   = ltrim( (string) $order->get_order_number(), '#' );
		if ( ! hash_equals( $actual, $expected ) ) {
			return false;
		}
	}

	if ( '' !== $customer_email ) {
		$actual_email = sanitize_email( $order->get_billing_email() );
		if ( ! $actual_email || ! hash_equals( strtolower( $actual_email ), strtolower( $customer_email ) ) ) {
			return false;
		}
	}

	if ( '' !== $customer_name ) {
		$actual_name   = dtb_returns_normalize_customer_name( dtb_returns_order_customer_name( $order ) );
		$expected_name = dtb_returns_normalize_customer_name( $customer_name );
		if ( '' === $actual_name || ! hash_equals( $actual_name, $expected_name ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Run bounded HPOS-compatible WooCommerce queries for supplied criteria.
 *
 * When multiple fields are supplied, candidate sets are narrowed again with
 * dtb_returns_order_matches_lookup() so every supplied field must match.
 *
 * @return WC_Order[]
 */
function dtb_returns_find_orders_for_public_lookup(
	string $order_number,
	string $customer_email,
	string $customer_name
): array {
	if ( ! function_exists( 'wc_get_orders' ) ) {
		return [];
	}

	$orders = [];

	if ( '' !== $order_number ) {
		$numeric_order_id = absint( ltrim( trim( $order_number ), '#' ) );
		if ( $numeric_order_id > 0 ) {
			$order = wc_get_order( $numeric_order_id );
			if ( $order instanceof WC_Order ) {
				$orders[ $order->get_id() ] = $order;
			}
		}
	}

	if ( '' === $order_number && '' !== $customer_email ) {
		$email_orders = wc_get_orders(
			[
				'limit'         => 10,
				'orderby'       => 'date',
				'order'         => 'DESC',
				'return'        => 'objects',
				'billing_email' => $customer_email,
			]
		);
		foreach ( $email_orders as $order ) {
			if ( $order instanceof WC_Order ) {
				$orders[ $order->get_id() ] = $order;
			}
		}
	}

	if ( '' === $order_number && '' === $customer_email && '' !== $customer_name ) {
		$name_parts = preg_split( '/\s+/', trim( $customer_name ) ) ?: [];
		$first_name = sanitize_text_field( array_shift( $name_parts ) ?? '' );
		$last_name  = sanitize_text_field( implode( ' ', $name_parts ) );

		$query = [
			'limit'   => 10,
			'orderby' => 'date',
			'order'   => 'DESC',
			'return'  => 'objects',
		];

		if ( '' !== $first_name ) {
			$query['billing_first_name'] = $first_name;
		}
		if ( '' !== $last_name ) {
			$query['billing_last_name'] = $last_name;
		}

		$name_orders = wc_get_orders( $query );
		foreach ( $name_orders as $order ) {
			if ( $order instanceof WC_Order ) {
				$orders[ $order->get_id() ] = $order;
			}
		}
	}

	$matches = array_values(
		array_filter(
			$orders,
			static fn( WC_Order $order ): bool => dtb_returns_order_matches_lookup(
				$order,
				$order_number,
				$customer_email,
				$customer_name
			)
		)
	);

	usort(
		$matches,
		static function ( WC_Order $a, WC_Order $b ): int {
			$a_date = $a->get_date_created();
			$b_date = $b->get_date_created();
			return ( $b_date ? $b_date->getTimestamp() : 0 ) <=> ( $a_date ? $a_date->getTimestamp() : 0 );
		}
	);

	return array_slice( $matches, 0, 10 );
}

/**
 * Base64url encode a token component.
 */
function dtb_returns_public_lookup_b64url_encode( string $value ): string {
	return rtrim( strtr( base64_encode( $value ), '+/', '-_' ), '=' );
}

/**
 * Base64url decode a token component.
 */
function dtb_returns_public_lookup_b64url_decode( string $value ): string|false {
	$padding = strlen( $value ) % 4;
	if ( $padding ) {
		$value .= str_repeat( '=', 4 - $padding );
	}
	return base64_decode( strtr( $value, '-_', '+/' ), true );
}

/**
 * Issue a short-lived token binding the storefront to one WooCommerce order.
 */
function dtb_returns_create_public_lookup_token( WC_Order $order ): string {
	$payload = wp_json_encode(
		[
			'order_id' => $order->get_id(),
			'exp'      => time() + ( 15 * MINUTE_IN_SECONDS ),
		]
	);
	$encoded   = dtb_returns_public_lookup_b64url_encode( (string) $payload );
	$signature = hash_hmac( 'sha256', $encoded, wp_salt( 'auth' ) );
	return $encoded . '.' . $signature;
}

/**
 * Validate a lookup token and resolve its WooCommerce order.
 */
function dtb_returns_order_from_public_lookup_token( string $token ): ?WC_Order {
	$parts = explode( '.', trim( $token ), 2 );
	if ( 2 !== count( $parts ) || ! preg_match( '/^[A-Fa-f0-9]{64}$/', $parts[1] ) ) {
		return null;
	}

	$expected = hash_hmac( 'sha256', $parts[0], wp_salt( 'auth' ) );
	if ( ! hash_equals( $expected, $parts[1] ) ) {
		return null;
	}

	$decoded = dtb_returns_public_lookup_b64url_decode( $parts[0] );
	$data    = is_string( $decoded ) ? json_decode( $decoded, true ) : null;
	if ( ! is_array( $data ) || empty( $data['order_id'] ) || empty( $data['exp'] ) || (int) $data['exp'] < time() ) {
		return null;
	}

	$order = wc_get_order( absint( $data['order_id'] ) );
	return $order instanceof WC_Order ? $order : null;
}

/**
 * Public order lookup handler.
 */
function dtb_returns_rest_public_lookup( WP_REST_Request $request ): WP_REST_Response {
	$ip         = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0' ) );
	$rate_key   = 'dtb_return_lookup_rl_' . md5( $ip );
	$rate_count = (int) get_transient( $rate_key );
	if ( $rate_count >= 12 ) {
		return new WP_REST_Response(
			[ 'error' => __( 'Too many lookup attempts. Please wait a few minutes and try again.', 'drywall-toolbox' ) ],
			429
		);
	}
	set_transient( $rate_key, $rate_count + 1, 10 * MINUTE_IN_SECONDS );

	$order_number   = sanitize_text_field( (string) $request->get_param( 'order_number' ) );
	$customer_email = sanitize_email( (string) $request->get_param( 'customer_email' ) );
	$customer_name  = sanitize_text_field( (string) $request->get_param( 'customer_name' ) );

	if ( '' === $order_number && '' === $customer_email && '' === $customer_name ) {
		return new WP_REST_Response(
			[ 'error' => __( 'Enter at least one order detail to search.', 'drywall-toolbox' ) ],
			400
		);
	}

	$raw_email = trim( (string) $request->get_param( 'customer_email' ) );
	if ( '' !== $raw_email && ! is_email( $raw_email ) ) {
		return new WP_REST_Response(
			[ 'error' => __( 'Enter a valid email address or leave the email field blank.', 'drywall-toolbox' ) ],
			400
		);
	}

	$orders = dtb_returns_find_orders_for_public_lookup( $order_number, $customer_email, $customer_name );
	$items  = array_map(
		static function ( WC_Order $order ): array {
			$date = $order->get_date_created();
			return [
				'order_number' => (string) $order->get_order_number(),
				'date'         => $date ? wc_format_datetime( $date, get_option( 'date_format' ) ) : '',
				'item_count'   => (int) $order->get_item_count(),
				'status'       => wc_get_order_status_name( $order->get_status() ),
				'lookup_token' => dtb_returns_create_public_lookup_token( $order ),
			];
		},
		$orders
	);

	return new WP_REST_Response(
		[
			'orders' => $items,
			'total'  => count( $items ),
		],
		200
	);
}

/**
 * Canonicalize public return requests to the WooCommerce order before the
 * existing ReturnsController validates args and creates the return record.
 *
 * New storefront requests use lookup_token. Legacy clients that still send all
 * three identifying fields remain compatible, but those fields must match the
 * WooCommerce order exactly before the request is allowed through.
 */
function dtb_returns_verify_public_request_before_dispatch( $result, WP_REST_Server $server, WP_REST_Request $request ) {
	if ( '/dtb/v1/returns/request' !== $request->get_route() || 'POST' !== $request->get_method() ) {
		return $result;
	}

	$order = null;
	$token = sanitize_text_field( (string) $request->get_param( 'lookup_token' ) );

	if ( '' !== $token ) {
		$order = dtb_returns_order_from_public_lookup_token( $token );
	} else {
		$order_number   = sanitize_text_field( (string) $request->get_param( 'order_number' ) );
		$customer_email = sanitize_email( (string) $request->get_param( 'customer_email' ) );
		$customer_name  = sanitize_text_field( (string) $request->get_param( 'customer_name' ) );
		$order_id       = absint( ltrim( $order_number, '#' ) );
		$legacy_order   = $order_id > 0 ? wc_get_order( $order_id ) : false;

		if (
			$legacy_order instanceof WC_Order &&
			'' !== $customer_email &&
			'' !== $customer_name &&
			dtb_returns_order_matches_lookup( $legacy_order, $order_number, $customer_email, $customer_name )
		) {
			$order = $legacy_order;
		}
	}

	if ( ! $order instanceof WC_Order ) {
		return new WP_REST_Response(
			[ 'error' => __( 'We could not verify that order. Search for the order again and retry.', 'drywall-toolbox' ) ],
			404
		);
	}

	$request->set_param( 'order_number', (string) $order->get_order_number() );
	$request->set_param( 'customer_name', dtb_returns_order_customer_name( $order ) );
	$request->set_param( 'customer_email', sanitize_email( $order->get_billing_email() ) );

	return $result;
}
add_filter( 'rest_pre_dispatch', 'dtb_returns_verify_public_request_before_dispatch', 10, 3 );
