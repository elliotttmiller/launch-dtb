<?php
/**
 * DTB auth cookie and native-checkout session hardening.
 *
 * Normalizes storefront auth REST responses so shared hosting/page caches do not
 * retain auth state and so the HttpOnly DTB session cookie is emitted with a
 * reliable same-origin SameSite policy. For same-origin customer sessions, it
 * also establishes WordPress's native HttpOnly auth cookie so WooCommerce native
 * checkout resolves the same customer through its supported session lifecycle.
 *
 * @package drywall-toolbox
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

	if ( '/dtb/v1/auth/login' === $route || '/dtb/v1/auth/register' === $route ) {
		dtb_auth_refresh_cookie_from_response( $response );
		dtb_auth_sync_native_customer_cookie_from_response( $response );
	}

	/* Existing DTB-only sessions created before this compatibility boundary also
	 * receive the native customer cookie on their normal /validate bootstrap. */
	if ( '/dtb/v1/auth/validate' === $route ) {
		dtb_auth_sync_native_customer_cookie_from_response( $response );
	}

	if ( '/dtb/v1/auth/logout' === $route ) {
		dtb_auth_clear_hardened_cookie();
		dtb_auth_clear_native_customer_cookie();
		dtb_auth_signal_session_mutation();
	}

	return $response;
}

/**
 * Re-emit the DTB auth cookie from a successful login/register response.
 *
 * AuthRoutes.php already authenticates credentials and creates the token. This
 * refresh keeps the same server-side authority while normalizing cookie options
 * for the live root-hosted SPA and mobile browsers.
 *
 * @param WP_REST_Response|WP_HTTP_Response $response REST response.
 */
function dtb_auth_refresh_cookie_from_response( $response ): void {
	if ( ! ( $response instanceof WP_REST_Response || $response instanceof WP_HTTP_Response ) ) {
		return;
	}

	$data = $response->get_data();
	if ( empty( $data['success'] ) || empty( $data['user']['id'] ) ) {
		return;
	}

	$user = get_user_by( 'id', (int) $data['user']['id'] );
	if ( ! $user instanceof WP_User || ! function_exists( 'dtb_generate_jwt' ) ) {
		return;
	}

	$cookie_name = defined( 'DTB_AUTH_COOKIE' ) ? DTB_AUTH_COOKIE : 'dtb_auth';
	$jwt         = dtb_generate_jwt( $user );
	$cross       = function_exists( 'dtb_is_cross_origin_request' ) && dtb_is_cross_origin_request();

	setcookie( $cookie_name, $jwt, [
		'expires'  => time() + 7 * DAY_IN_SECONDS,
		'path'     => '/',
		'secure'   => true,
		'httponly' => true,
		'samesite' => $cross ? 'None' : 'Lax',
	] );

	dtb_auth_signal_session_mutation();
}

/**
 * Establish native WordPress customer auth for the same-origin storefront.
 *
 * WooCommerce's server-rendered checkout is intentionally outside the React SPA.
 * A verified DTB customer session must therefore also be recognizable by
 * WordPress's native document/session stack. Using WordPress's own HttpOnly auth
 * cookie is safer and more compatible than browser-visible tokens or synthetic
 * checkout identities. Privileged operator/admin users are deliberately excluded.
 *
 * @param WP_REST_Response|WP_HTTP_Response $response REST response.
 */
function dtb_auth_sync_native_customer_cookie_from_response( $response ): void {
	if ( ! ( $response instanceof WP_REST_Response || $response instanceof WP_HTTP_Response ) ) {
		return;
	}

	if ( function_exists( 'dtb_is_cross_origin_request' ) && dtb_is_cross_origin_request() ) {
		return;
	}

	$data = $response->get_data();
	if ( empty( $data['user']['id'] ) ) {
		return;
	}

	/* /validate uses { authenticated: true, user: ... }; login/register use
	 * { success: true, user: ... }. Reject every other response shape. */
	$authenticated = ! empty( $data['success'] ) || ! empty( $data['authenticated'] );
	if ( ! $authenticated ) {
		return;
	}

	$user = get_user_by( 'id', absint( $data['user']['id'] ) );
	if ( ! $user instanceof WP_User ) {
		return;
	}

	/* Storefront auth must never silently mint an administrator/operator browser
	 * session. Those users continue to use the normal WordPress admin login flow. */
	if ( user_can( $user, 'manage_options' ) || user_can( $user, 'edit_users' ) ) {
		return;
	}

	$had_native_cookie = defined( 'LOGGED_IN_COOKIE' ) && ! empty( $_COOKIE[ LOGGED_IN_COOKIE ] );
	if ( $had_native_cookie ) {
		return;
	}

	wp_set_current_user( (int) $user->ID );
	wp_set_auth_cookie( (int) $user->ID, true, is_ssl() );

	/* Run the native login lifecycle exactly once when bridging a DTB-only session
	 * so WooCommerce can reconcile customer/session hooks before checkout. */
	do_action( 'wp_login', $user->user_login, $user );
	dtb_auth_signal_session_mutation();
}

/**
 * Clear the hardened host-only DTB cookie variant.
 */
function dtb_auth_clear_hardened_cookie(): void {
	$cookie_name = defined( 'DTB_AUTH_COOKIE' ) ? DTB_AUTH_COOKIE : 'dtb_auth';
	$cross       = function_exists( 'dtb_is_cross_origin_request' ) && dtb_is_cross_origin_request();

	setcookie( $cookie_name, '', [
		'expires'  => time() - DAY_IN_SECONDS,
		'path'     => '/',
		'secure'   => true,
		'httponly' => true,
		'samesite' => $cross ? 'None' : 'Lax',
	] );
}

/**
 * Clear the same-origin native customer cookie established by storefront auth.
 */
function dtb_auth_clear_native_customer_cookie(): void {
	if ( function_exists( 'dtb_is_cross_origin_request' ) && dtb_is_cross_origin_request() ) {
		return;
	}

	$user = wp_get_current_user();
	if ( $user instanceof WP_User && $user->exists() && ( user_can( $user, 'manage_options' ) || user_can( $user, 'edit_users' ) ) ) {
		return;
	}

	wp_clear_auth_cookie();
	wp_set_current_user( 0 );
}

/**
 * Signal shared-hosting cache bypass after auth session mutation.
 *
 * AuthRoutes.php remains the owner of the `dtb_auth` JWT contract. This layer
 * only normalizes cookie delivery and native customer-session compatibility.
 */
function dtb_auth_signal_session_mutation(): void {
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}

	if ( ! headers_sent() ) {
		nocache_headers();
	}
}
