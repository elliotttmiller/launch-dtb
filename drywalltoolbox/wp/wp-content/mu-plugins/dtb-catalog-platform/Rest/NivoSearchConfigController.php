<?php
/**
 * DTB_NivoSearchConfigController
 *
 * Exposes the minimum same-origin, read-safe runtime configuration required by
 * the React storefront to call NivoSearch's public WooCommerce AJAX handler.
 * Search execution remains owned by NivoSearch; DTB owns only presentation and
 * the integration boundary.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_NivoSearchConfigController {

	private const PRESET_ID = 930;

	public static function register_routes(): void {
		register_rest_route( 'dtb/v1', '/catalog/search/nivo-config', [
			'methods'             => 'GET',
			'callback'            => [ self::class, 'handle' ],
			'permission_callback' => '__return_true',
		] );
	}

	public static function handle(): WP_REST_Response {
		if ( ! dtb_check_origin() ) {
			return new WP_REST_Response( dtb_error_envelope( 'forbidden_origin', 'Origin not allowed.', 403 ), 403 );
		}

		if ( ! class_exists( '\\NivoSearch\\Nivo_Ajax_Search' ) ) {
			return self::response( [
				'enabled' => false,
				'reason'  => 'plugin_unavailable',
			], 200 );
		}

		$preset = get_post( self::PRESET_ID );
		if ( ! $preset || 'nivo_search_preset' !== $preset->post_type || 'publish' !== $preset->post_status ) {
			return self::response( [
				'enabled'  => false,
				'reason'   => 'preset_unavailable',
				'presetId' => self::PRESET_ID,
			], 200 );
		}

		$general = get_post_meta( self::PRESET_ID, '_nivo_search_generale', true );
		$query   = get_post_meta( self::PRESET_ID, '_nivo_search_query', true );
		$settings = array_merge(
			is_array( $general ) ? $general : [],
			is_array( $query ) ? $query : []
		);

		$min_chars = max( 1, min( 10, absint( $settings['min_chars'] ?? 2 ) ) );
		$delay     = max( 100, min( 1000, absint( $settings['delay'] ?? 200 ) ) );

		if ( class_exists( 'WC_AJAX' ) && is_callable( [ 'WC_AJAX', 'get_endpoint' ] ) ) {
			$endpoint = WC_AJAX::get_endpoint( 'nivo_search' );
		} else {
			$endpoint = add_query_arg( 'wc-ajax', 'nivo_search', home_url( '/' ) );
		}

		return self::response( [
			'enabled'  => true,
			'presetId' => self::PRESET_ID,
			'endpoint' => esc_url_raw( $endpoint ),
			'nonce'    => wp_create_nonce( 'nivo_search_nonce' ),
			'minChars' => $min_chars,
			'delayMs'  => $delay,
		], 200 );
	}

	/**
	 * Return non-cacheable runtime configuration because the response contains a
	 * WordPress nonce. The nonce is not a secret; it is the anti-CSRF token
	 * required by NivoSearch's public AJAX handler.
	 */
	private static function response( array $data, int $status ): WP_REST_Response {
		$response = new WP_REST_Response( $data, $status );
		$response->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, private' );
		$response->header( 'Pragma', 'no-cache' );
		return $response;
	}
}
