<?php
/**
 * Native wp-admin topology guard.
 *
 * Drywall Toolbox serves the public origin from WP_HOME while WordPress core
 * lives physically under WP_SITEURL. The supported operator contract is the
 * root aliases (/wp-admin/, /wp-login.php, /wp-json/*) so WordPress auth
 * cookies, REST nonces, WooCommerce Admin, and DTB admin routes share one
 * browser-visible origin and cookie scope.
 *
 * Never rewrite generated REST URLs to the physical WordPress index here.
 * WordPress must emit its canonical REST URL from WP_HOME and the root rewrite
 * layer owns routing that request into the physical WordPress runtime.
 *
 * @package drywalltoolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_init', 'dtb_native_admin_redirect_physical_admin_alias', 1 );

/**
 * Redirect accidental GET/HEAD access to the physical WordPress admin path
 * back to the supported root /wp-admin alias.
 *
 * The physical prefix is derived from WP_SITEURL via site_url() so this guard
 * does not depend on WordPress remaining installed in a hard-coded /wp path.
 * Mutating requests are never redirected so request bodies cannot be lost or
 * replayed. AJAX, cron, REST, and CLI execution are also excluded.
 */
function dtb_native_admin_redirect_physical_admin_alias(): void {
	if (
		wp_doing_ajax()
		|| wp_doing_cron()
		|| ( defined( 'REST_REQUEST' ) && REST_REQUEST )
		|| ( defined( 'WP_CLI' ) && WP_CLI )
	) {
		return;
	}

	$method = isset( $_SERVER['REQUEST_METHOD'] )
		? strtoupper( sanitize_text_field( (string) wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	if ( ! in_array( $method, [ 'GET', 'HEAD' ], true ) ) {
		return;
	}

	$request_uri = isset( $_SERVER['REQUEST_URI'] )
		? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	$path = '' !== $request_uri ? (string) wp_parse_url( $request_uri, PHP_URL_PATH ) : '';
	if ( '' === $path ) {
		return;
	}

	$site_path       = (string) wp_parse_url( site_url( '/' ), PHP_URL_PATH );
	$site_path       = '/' . trim( $site_path, '/' );
	$physical_admin  = ( '/' === $site_path ? '' : $site_path ) . '/wp-admin';
	$physical_prefix = trailingslashit( $physical_admin );

	if ( $path !== $physical_admin && 0 !== strpos( $path, $physical_prefix ) ) {
		return;
	}

	$relative = ltrim( substr( $path, strlen( $physical_admin ) ), '/' );
	$target   = home_url( '/wp-admin/' . $relative );
	$query    = '' !== $request_uri ? (string) wp_parse_url( $request_uri, PHP_URL_QUERY ) : '';
	if ( '' !== $query ) {
		$target .= '?' . $query;
	}

	wp_safe_redirect( $target, 302, 'Drywall Toolbox Admin Topology' );
	exit;
}
