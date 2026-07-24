<?php
/**
 * Native wp-admin REST topology.
 *
 * Drywall Toolbox serves the public SPA from WP_HOME at the document root while
 * WordPress core lives at WP_SITEURL under /wp. Native wp-admin applications
 * (WooCommerce Admin, WooPayments, and hosting-admin integrations) must use the
 * physical WordPress REST origin so WordPress cookie authentication and
 * X-WP-Nonce validation travel through one canonical WordPress runtime path.
 *
 * Storefront/public REST URLs remain unchanged. This filter only changes REST
 * URLs generated while rendering native wp-admin requests; REST requests
 * themselves are never rewritten by this module.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'rest_url', 'dtb_native_admin_canonical_rest_url', 20, 4 );

/**
 * Return the physical WordPress REST URL for native wp-admin page generation.
 *
 * @param string   $url     Generated REST URL.
 * @param string   $path    Requested REST path.
 * @param int|null $blog_id Blog ID.
 * @param string   $scheme  URL scheme context.
 * @return string
 */
function dtb_native_admin_canonical_rest_url( string $url, string $path, $blog_id, string $scheme ): string {
	unset( $blog_id, $scheme );

	// Do not alter public/storefront REST URLs, AJAX, cron, CLI, or REST requests.
	if ( ! is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
		return $url;
	}

	$site_url = site_url( '/', 'https' );
	if ( '' === $site_url ) {
		return $url;
	}

	$base = trailingslashit( $site_url ) . rest_get_url_prefix() . '/';
	$path = ltrim( $path, '/' );

	return esc_url_raw( $base . $path );
}
