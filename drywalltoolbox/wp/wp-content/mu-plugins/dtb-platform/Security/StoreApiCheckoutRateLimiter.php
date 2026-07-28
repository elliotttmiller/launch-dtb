<?php
/**
 * Rate limit WooCommerce Store API cart/checkout mutations.
 *
 * The native Store API (cart add/update/remove, coupons, checkout submission)
 * has no DTB-level throttle of its own — only DTB's own custom routes (auth,
 * checkout telemetry) do. This adds the same per-fingerprint throttle to the
 * mutating Store API surface without touching WooCommerce's own route
 * registration, dispatch, or response shape: a request over the limit is
 * short-circuited at `rest_pre_dispatch` with the same 429 envelope
 * WP_REST_Server already knows how to render.
 *
 * @package drywalltoolbox
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'rest_pre_dispatch', 'dtb_store_api_checkout_rate_limit', 5, 3 );

/**
 * @param mixed           $result Existing short-circuit result, if any.
 * @return mixed
 */
function dtb_store_api_checkout_rate_limit( $result, WP_REST_Server $server, WP_REST_Request $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
	if ( null !== $result || ! class_exists( 'DTB_RateLimiter' ) ) {
		return $result;
	}

	// Only the mutating Store API surface needs a throttle; GET reads (cart
	// fetch, shipping-rate lookups that don't mutate) are left to WooCommerce.
	if ( ! in_array( $request->get_method(), [ 'POST', 'PUT', 'PATCH', 'DELETE' ], true ) ) {
		return $result;
	}

	if ( ! dtb_store_api_checkout_rate_limit_route( (string) $request->get_route() ) ) {
		return $result;
	}

	// Generous enough for a real checkout session (retries, quantity/coupon
	// changes, address edits) while blocking scripted hammering of cart/checkout.
	$limit_check = DTB_RateLimiter::check( 'store_api_checkout_mutation', 90, 5 * MINUTE_IN_SECONDS );
	if ( true === $limit_check ) {
		return $result;
	}

	if ( function_exists( 'dtb_security_log' ) ) {
		dtb_security_log( 'store_api_checkout_rate_limited', [ 'route' => $request->get_route() ] );
	}

	return $limit_check;
}

/** Whether a Store API route is a mutating cart/checkout endpoint that should be throttled. */
function dtb_store_api_checkout_rate_limit_route( string $route ): bool {
	foreach ( [ '/wc/store/v1/cart', '/wc/store/v1/checkout', '/wc/store/cart', '/wc/store/checkout' ] as $prefix ) {
		if ( 0 === strpos( $route, $prefix ) ) {
			return true;
		}
	}

	return false;
}
