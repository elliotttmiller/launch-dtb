<?php
/**
 * DTB auth cookie and native-checkout session hardening.
 *
 * AuthRoutes.php remains the single owner of the HttpOnly `dtb_auth` JWT cookie.
 * This compatibility layer owns cache headers and convergence of verified,
 * same-origin storefront customer sessions into WordPress's native HttpOnly auth
 * cookie so WooCommerce can execute its supported customer/session lifecycle.
 *
 * @package drywalltoolbox
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'rest_pre_dispatch', 'dtb_auth_block_privileged_native_storefront_auth', 15, 3 );
add_filter( 'rest_post_dispatch', 'dtb_auth_harden_rest_response', 20, 3 );

/**
 * Block storefront login/registration while a privileged native WP session exists.
 *
 * A browser must never simultaneously establish a customer storefront identity and
 * retain a different administrator/operator native identity. Reject before the auth
 * route can issue a new DTB JWT or create a customer record.
 *
 * @param mixed           $result  Pre-dispatch result.
 * @param WP_REST_Server  $server  REST server.
 * @param WP_REST_Request $request REST request.
 * @return mixed
 */
function dtb_auth_block_privileged_native_storefront_auth( $result, $server, $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
	if ( null !== $result || ! $request instanceof WP_REST_Request ) {
		return $result;
	}

	$route = (string) $request->get_route();
	if ( ! in_array( $route, [ '/dtb/v1/auth/login', '/dtb/v1/auth/register' ], true ) ) {
		return $result;
	}

	if ( function_exists( 'dtb_is_cross_origin_request' ) && dtb_is_cross_origin_request() ) {
		return $result;
	}

	$current_user = wp_get_current_user();
	if ( ! $current_user instanceof WP_User || ! $current_user->exists() || ! dtb_auth_user_is_privileged( $current_user ) ) {
		return $result;
	}

	if ( function_exists( 'dtb_security_log' ) ) {
		dtb_security_log( 'storefront_auth_blocked_by_privileged_native_session', [ 'route' => $route ] );
	}

	return new WP_Error(
		'dtb_auth_native_session_conflict',
		'A conflicting WordPress administrator session is active in this browser. Use a separate/private browser session for customer storefront sign-in.',
		[ 'status' => 409 ]
	);
}

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
		dtb_auth_fail_closed_on_privileged_native_conflict( $response, $state, $route );
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
 * establishes native cookie compatibility for subsequent full-document checkout
 * requests and contains conflicting identities without cross-customer cart transfer.
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
	if ( ! is_array( $data ) ) {
		$state['status'] = 'invalid_response';
		return $state;
	}

	/* A failed/expired DTB validation must not leave a non-privileged native cookie
	 * as a longer-lived second storefront authentication authority. */
	if ( '/dtb/v1/auth/validate' === $route && isset( $data['authenticated'] ) && false === $data['authenticated'] ) {
		dtb_auth_clear_native_customer_cookie();
		$state['status'] = 'native_customer_cookie_cleared';
		return $state;
	}

	if ( empty( $data['user']['id'] ) ) {
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

	if ( dtb_auth_user_is_privileged( $user ) ) {
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

	/* A pre-existing privileged native session is never cleared or replaced by the
	 * storefront compatibility bridge. Report checkout-not-ready and fail closed. */
	if ( $native_user_id > 0 ) {
		$native_user = get_user_by( 'id', $native_user_id );
		if ( $native_user instanceof WP_User && dtb_auth_user_is_privileged( $native_user ) ) {
			$state['status'] = 'blocked_native_privileged_conflict';
			if ( function_exists( 'dtb_security_log' ) ) {
				dtb_security_log( 'native_privileged_identity_conflict_blocked', [ 'route' => $route ] );
			}
			return $state;
		}
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
	/* Compatibility cookie is session-scoped; persistent storefront identity remains
	 * the HttpOnly dtb_auth JWT. A later /validate remints native continuity. */
	wp_set_auth_cookie( (int) $user->ID, false, is_ssl() );
	dtb_auth_signal_session_mutation();

	$state['status']                = $state['identity_conflict_contained'] ? 'conflict_replaced' : 'bridged';
	$state['native_checkout_ready'] = true;
	$state['native_cookie_queued']  = true;
	return $state;
}

/**
 * Convert an existing DTB/native privileged split identity into logged-out DTB state.
 *
 * The privileged native WordPress session is preserved. The stale/conflicting DTB
 * cookie is cleared through AuthRoutes' canonical cookie helper and `/validate`
 * becomes unauthenticated, preventing React/Store API from presenting customer B
 * while WordPress/WooCommerce are operating as privileged native user A.
 */
function dtb_auth_fail_closed_on_privileged_native_conflict( $response, array $state, string $route ): void {
	if ( 'blocked_native_privileged_conflict' !== ( $state['status'] ?? '' ) || '/dtb/v1/auth/validate' !== $route ) {
		return;
	}

	if ( function_exists( 'dtb_clear_auth_cookie' ) ) {
		dtb_clear_auth_cookie();
	}

	if ( ! ( $response instanceof WP_REST_Response || $response instanceof WP_HTTP_Response ) ) {
		return;
	}

	$data = $response->get_data();
	if ( ! is_array( $data ) ) {
		return;
	}

	$data['success']       = true;
	$data['authenticated'] = false;
	$data['user']          = null;
	$data['message']       = 'A conflicting WordPress administrator session is active in this browser. Customer storefront authentication was cleared for safety.';
	$response->set_data( $data );
	dtb_auth_signal_session_mutation();
}

/** Whether a user is privileged beyond the storefront-customer boundary. */
function dtb_auth_user_is_privileged( WP_User $user ): bool {
	return user_can( $user, 'manage_options' ) || user_can( $user, 'edit_users' );
}

/** Resolve a cryptographically valid native WordPress logged-in cookie user ID. */
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
 * Clear the same-origin native customer compatibility cookie.
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
		if ( $user instanceof WP_User && dtb_auth_user_is_privileged( $user ) ) {
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
