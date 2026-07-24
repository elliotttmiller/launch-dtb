<?php
/**
 * DTB auth cookie and native-checkout session hardening.
 *
 * AuthRoutes.php remains the single owner of the HttpOnly `dtb_auth` JWT cookie.
 * This compatibility layer owns only cache headers plus convergence of verified,
 * same-origin storefront customer sessions into WordPress's native HttpOnly auth
 * cookie so WooCommerce can execute its supported customer/session lifecycle.
 *
 * @package drywalltoolbox
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'rest_post_dispatch', 'dtb_auth_harden_rest_response', 20, 3 );

/**
 * Harden DTB auth REST responses before WordPress sends them.
 *
 * @param WP_REST_Response|WP_HTTP_Response|WP_Error $response REST response.
 * @param WP_REST_Server                             $server   REST server.
 * @param WP_REST_Request                            $request  REST request.
 * @return WP_REST_Response|WP_HTTP_Response|WP_Error
 */
function dtb_auth_harden_rest_response( $response, $server, $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
	if ( is_wp_error( $response ) || ! $request instanceof WP_REST_Request ) {
		return $response;
	}

	$route = (string) $request->get_route();
	if ( 0 !== strpos( $route, '/dtb/v1/auth/' ) ) {
		return $response;
	}

	if ( $response instanceof WP_REST_Response || $response instanceof WP_HTTP_Response ) {
		$response->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, private' );
		$response->header( 'Pragma', 'no-cache' );
		$response->header( 'Expires', '0' );
		$response->header( 'X-Accel-Expires', '0' );
		$response->header( 'Vary', 'Cookie, Authorization, Origin' );
	}

	if ( in_array( $route, [ '/dtb/v1/auth/login', '/dtb/v1/auth/register', '/dtb/v1/auth/validate' ], true ) ) {
		$state = dtb_auth_reconcile_native_customer_session_from_response( $response, $route );
		dtb_auth_attach_native_session_state( $response, $state );
	}

	if ( '/dtb/v1/auth/logout' === $route ) {
		dtb_auth_clear_native_customer_cookie();
		dtb_auth_signal_session_mutation();
	}

	return $response;
}

/**
 * Reconcile a verified storefront customer into native WordPress auth.
 *
 * WordPress/WooCommerce session migration is intentionally not reimplemented
 * here. WooCommerce's native session handler migrates a guest session when the
 * current WordPress user is known before session initialization. This layer only
 * establishes durable native cookie identity for subsequent full-document
 * checkout requests and contains conflicting identities without cart transfer.
 *
 * @param WP_REST_Response|WP_HTTP_Response $response REST response.
 * @param string                            $route    Auth route.
 * @return array<string,mixed> Redacted handoff state.
 */
function dtb_auth_reconcile_native_customer_session_from_response( $response, string $route ): array {
	$state = [
		'status'                      => 'not_applicable',
		'native_checkout_ready'       => false,
		'native_cookie_queued'        => false,
		'native_cookie_already_valid' => false,
		'identity_conflict_contained' => false,
	];

	if ( ! ( $response instanceof WP_REST_Response || $response instanceof WP_HTTP_Response ) ) {
		return $state;
	}

	if ( function_exists( 'dtb_is_cross_origin_request' ) && dtb_is_cross_origin_request() ) {
		$state['status'] = 'skipped_cross_origin';
		return $state;
	}

	$data = $response->get_data();
	if ( ! is_array( $data ) || empty( $data['user']['id'] ) ) {
		$state['status'] = 'no_authenticated_user';
		return $state;
	}

	$authenticated = ! empty( $data['success'] ) || ! empty( $data['authenticated'] );
	if ( ! $authenticated ) {
		$state['status'] = 'not_authenticated';
		return $state;
	}

	$user = get_user_by( 'id', absint( $data['user']['id'] ) );
	if ( ! $user instanceof WP_User ) {
		$state['status'] = 'user_missing';
		return $state;
	}

	/* Never mint or replace an administrator/operator browser session from the
	 * storefront JWT compatibility path. */
	if ( user_can( $user, 'manage_options' ) || user_can( $user, 'edit_users' ) ) {
		$state['status'] = 'skipped_privileged_user';
		return $state;
	}

	$native_user_id = dtb_auth_valid_native_cookie_user_id();
	if ( $native_user_id === (int) $user->ID ) {
		$state['status']                      = 'aligned';
		$state['native_checkout_ready']       = true;
		$state['native_cookie_already_valid'] = true;
		return $state;
	}

	if ( headers_sent() ) {
		$state['status'] = 'failed_headers_sent';
		if ( function_exists( 'dtb_security_log' ) ) {
			dtb_security_log( 'native_customer_cookie_headers_sent', [ 'route' => $route ] );
		}
		return $state;
	}

	if ( $native_user_id > 0 && $native_user_id !== (int) $user->ID ) {
		/* A native cookie for customer A plus a verified DTB JWT for customer B is an
		 * ownership conflict. Never carry customer A's Woo session/cart into B. */
		if ( class_exists( 'DTB_SessionService' ) ) {
			DTB_SessionService::discard_woocommerce_session_for_identity_conflict();
		}
		wp_clear_auth_cookie();
		$state['identity_conflict_contained'] = true;
		if ( function_exists( 'dtb_security_log' ) ) {
			dtb_security_log( 'native_customer_identity_conflict_contained', [ 'route' => $route ] );
		}
	}

	wp_set_current_user( (int) $user->ID );
	wp_set_auth_cookie( (int) $user->ID, true, is_ssl() );
	dtb_auth_signal_session_mutation();

	$state['status']                = $state['identity_conflict_contained'] ? 'conflict_replaced' : 'bridged';
	$state['native_checkout_ready'] = true;
	$state['native_cookie_queued']  = true;
	return $state;
}

/**
 * Resolve a valid native WordPress logged-in cookie user ID.
 *
 * Cookie presence alone is insufficient because an expired/stale cookie must not
 * suppress a required customer-session bridge.
 */
function dtb_auth_valid_native_cookie_user_id(): int {
	if ( ! defined( 'LOGGED_IN_COOKIE' ) || empty( $_COOKIE[ LOGGED_IN_COOKIE ] ) || ! function_exists( 'wp_validate_auth_cookie' ) ) {
		return 0;
	}

	$cookie  = wp_unslash( (string) $_COOKIE[ LOGGED_IN_COOKIE ] );
	$user_id = wp_validate_auth_cookie( $cookie, 'logged_in' );
	return $user_id ? absint( $user_id ) : 0;
}

/** Attach non-secret native checkout handoff diagnostics to the auth response. */
function dtb_auth_attach_native_session_state( $response, array $state ): void {
	if ( ! ( $response instanceof WP_REST_Response || $response instanceof WP_HTTP_Response ) ) {
		return;
	}

	$data = $response->get_data();
	if ( ! is_array( $data ) ) {
		return;
	}

	$session = isset( $data['session'] ) && is_array( $data['session'] ) ? $data['session'] : [];
	$session['native_checkout'] = [
		'status'                      => sanitize_key( (string) ( $state['status'] ?? 'unknown' ) ),
		'ready'                       => (bool) ( $state['native_checkout_ready'] ?? false ),
		'cookie_queued'               => (bool) ( $state['native_cookie_queued'] ?? false ),
		'cookie_already_valid'        => (bool) ( $state['native_cookie_already_valid'] ?? false ),
		'identity_conflict_contained' => (bool) ( $state['identity_conflict_contained'] ?? false ),
	];
	$data['session'] = $session;
	$response->set_data( $data );
}

/**
 * Clear the same-origin native customer cookie established by storefront auth.
 *
 * Privileged native admin/operator sessions are deliberately left to the normal
 * WordPress administrative logout lifecycle.
 */
function dtb_auth_clear_native_customer_cookie(): void {
	if ( function_exists( 'dtb_is_cross_origin_request' ) && dtb_is_cross_origin_request() ) {
		return;
	}

	$native_user_id = dtb_auth_valid_native_cookie_user_id();
	if ( $native_user_id > 0 ) {
		$user = get_user_by( 'id', $native_user_id );
		if ( $user instanceof WP_User && ( user_can( $user, 'manage_options' ) || user_can( $user, 'edit_users' ) ) ) {
			return;
		}
	}

	wp_clear_auth_cookie();
	wp_set_current_user( 0 );
}

/** Signal shared-hosting cache bypass after auth session mutation. */
function dtb_auth_signal_session_mutation(): void {
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}

	if ( ! headers_sent() ) {
		nocache_headers();
	}
}
