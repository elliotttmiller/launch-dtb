<?php
/**
 * Storefront commerce identity isolation.
 *
 * Native WordPress administrator/operator cookies must never become the shopper
 * identity for public WooCommerce Store API or checkout requests. Without this
 * boundary Woo can issue a customer-bound session cookie (for example user ID 1)
 * while the storefront later becomes anonymous, causing Woo to invalidate the
 * session and remove the cart during checkout.
 *
 * A privileged native WordPress identity is treated as anonymous only for public
 * commerce surfaces. If the same browser also carries a DTB customer JWT, the
 * conflict remains guest-isolated until the auth endpoint clears that JWT; this
 * prevents parallel cart/auth requests from binding a guest cart to the customer.
 * wp-admin and native admin REST namespaces are untouched.
 *
 * @package drywalltoolbox
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'determine_current_user', 'dtb_storefront_commerce_isolate_privileged_native_identity', 23 );

/**
 * Prevent a privileged native WP session from owning a public shopper cart.
 *
 * @param int|false $user_id User resolved by earlier auth providers.
 * @return int|false
 */
function dtb_storefront_commerce_isolate_privileged_native_identity( $user_id ) {
	$native_user_id = ! empty( $user_id ) ? absint( $user_id ) : 0;
	if ( $native_user_id <= 0 || ! dtb_storefront_commerce_identity_isolation_request() ) {
		return $user_id;
	}

	$native_user = get_user_by( 'id', $native_user_id );
	if ( ! $native_user instanceof WP_User || ! dtb_storefront_commerce_user_is_privileged( $native_user ) ) {
		return $user_id;
	}

	// Keep the administrator cookie intact in the browser, but do not expose that
	// identity to Woo's public cart/session lifecycle for this request. Mark the
	// request so the later native-checkout bridge cannot reintroduce a customer JWT
	// while the privileged browser cookie remains active.
	dtb_storefront_commerce_privileged_native_conflict( true );
	return false;
}

/**
 * Track a privileged native/customer conflict for this request only.
 *
 * @param bool $mark Whether to mark the current request as conflicted.
 */
function dtb_storefront_commerce_privileged_native_conflict( bool $mark = false ): bool {
	static $detected = false;

	if ( $mark ) {
		$detected = true;
	}

	return $detected;
}

/** Whether a user crosses the storefront customer privilege boundary. */
function dtb_storefront_commerce_user_is_privileged( WP_User $user ): bool {
	return user_can( $user, 'manage_options' ) || user_can( $user, 'edit_users' );
}

/**
 * Scope isolation strictly to public checkout and Woo Store API commerce routes.
 */
function dtb_storefront_commerce_identity_isolation_request(): bool {
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
		return false;
	}

	$request_uri = isset( $_SERVER['REQUEST_URI'] )
		? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	$path = (string) wp_parse_url( $request_uri, PHP_URL_PATH );

	if ( preg_match( '#^/(?:staging/[A-Za-z0-9_-]+/)?checkout(?:/|$)#i', $path ) ) {
		return true;
	}

	if ( false !== strpos( $path, '/wp-json/wc/store/' ) ) {
		return true;
	}

	/*
	 * WordPress may expose the same Store API through the query-routed fallback:
	 * `/wp/index.php?rest_route=/wc/store/v1/...`. Treat it identically to the
	 * pretty-permalink route so a privileged WP cookie cannot replace the guest
	 * Woo session during Checkout Block refreshes.
	 */
	$rest_route = isset( $_GET['rest_route'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		? '/' . ltrim( sanitize_text_field( wp_unslash( (string) $_GET['rest_route'] ) ), '/' ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		: '';
	if ( '' !== $rest_route && preg_match( '#^/wc/store(?:/|$)#i', $rest_route ) ) {
		return true;
	}

	if ( '/wp/index.php' === rtrim( $path, '/' ) || '/index.php' === rtrim( $path, '/' ) ) {
		$pagename = isset( $_GET['pagename'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			? sanitize_key( wp_unslash( (string) $_GET['pagename'] ) ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			: '';
		return 'checkout' === $pagename;
	}

	return false;
}
