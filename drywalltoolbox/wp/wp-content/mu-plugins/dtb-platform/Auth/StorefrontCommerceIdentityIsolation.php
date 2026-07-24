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
 * DTB storefront JWT identity remains authoritative when present. Otherwise a
 * privileged native WordPress identity is treated as anonymous only for public
 * commerce surfaces; wp-admin and native admin REST namespaces are untouched.
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

	// A verified DTB customer identity wins on storefront commerce surfaces.
	$token = ! empty( $_COOKIE['dtb_auth'] )
		? sanitize_text_field( wp_unslash( (string) $_COOKIE['dtb_auth'] ) )
		: '';
	if ( '' !== $token && function_exists( 'dtb_native_checkout_verify_user_id' ) ) {
		$resolved = dtb_native_checkout_verify_user_id( $token );
		if ( $resolved > 0 ) {
			$customer = get_user_by( 'id', $resolved );
			if ( $customer instanceof WP_User && ! dtb_storefront_commerce_user_is_privileged( $customer ) ) {
				return $resolved;
			}
		}
	}

	// Keep the administrator cookie intact in the browser, but do not expose that
	// identity to Woo's public cart/session lifecycle for this request.
	return false;
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

	$marker = '/wp-json/wc/store/';
	if ( false !== strpos( $path, $marker ) ) {
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
