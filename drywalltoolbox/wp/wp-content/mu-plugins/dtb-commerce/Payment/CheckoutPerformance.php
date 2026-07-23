<?php
/**
 * Checkout runtime performance, stability telemetry and non-critical asset policy.
 *
 * Theme-owned checkout presentation assets are intentionally not referenced here.
 * WooCommerce and the official Stripe extension remain authoritative for checkout
 * and payment runtime behavior.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CheckoutPerformance {
	private const ASSET_VERSION = '2026.07.22.1';
	private const TELEMETRY_NONCE_ACTION = 'dtb_checkout_runtime_telemetry';
	private const PAYMENT_SURFACE_TIMEOUT_MS = 15000;
	private const TELEMETRY_EVENT_TTL = 10 * MINUTE_IN_SECONDS;

	private const NONCRITICAL_HANDLE_TOKENS = [
		'google-analytics', 'google_analytics', 'googletagmanager', 'google-tag-manager', 'gtag',
		'facebook-pixel', 'facebook_pixel', 'fb-pixel', 'meta-pixel', 'hotjar', 'clarity',
		'tiktok-pixel', 'pinterest-tag', 'linkedin-insight', 'optimizely', 'visual-website-optimizer',
		'vwo', 'hubspot', 'intercom', 'mailchimp-popup', 'loyalty-widget', 'rewards-widget',
	];

	private const NONCRITICAL_HOSTS = [
		'www.googletagmanager.com', 'googletagmanager.com', 'www.google-analytics.com', 'google-analytics.com',
		'connect.facebook.net', 'static.hotjar.com', 'script.hotjar.com', 'www.clarity.ms', 'clarity.ms',
		'bat.bing.com', 'snap.licdn.com', 'analytics.tiktok.com', 's.pinimg.com', 'cdn.optimizely.com',
		'dev.visualwebsiteoptimizer.com', 'static.ads-twitter.com', 'js.hs-scripts.com', 'widget.intercom.io',
	];

	public static function register(): void {
		add_action( 'rest_api_init', [ __CLASS__, 'register_rest_routes' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_runtime_asset' ], 40 );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'suppress_noncritical_checkout_assets' ], 9990 );
		add_action( 'wp_head', [ __CLASS__, 'print_early_resource_hints' ], 1 );
		add_filter( 'rest_request_after_callbacks', [ __CLASS__, 'augment_checkout_capabilities' ], 20, 3 );
	}

	public static function register_rest_routes(): void {
		register_rest_route( 'dtb/v1', '/checkout/runtime-telemetry', [
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => [ __CLASS__, 'record_runtime_telemetry' ],
			'permission_callback' => [ __CLASS__, 'telemetry_permission' ],
		] );
	}

	public static function enqueue_runtime_asset(): void {
		if ( ! self::is_primary_checkout_request() ) return;
		wp_enqueue_script(
			'dtb-woo-native-checkout-performance',
			content_url( 'mu-plugins/dtb-commerce/assets/woo-native-checkout-performance.js' ),
			[ 'wc-blocks-checkout' ],
			self::ASSET_VERSION,
			true
		);
		wp_script_add_data( 'dtb-woo-native-checkout-performance', 'strategy', 'defer' );
		wp_localize_script( 'dtb-woo-native-checkout-performance', 'DTB_CHECKOUT_PERFORMANCE', [
			'telemetryUrl'            => esc_url_raw( rest_url( 'dtb/v1/checkout/runtime-telemetry' ) ),
			'telemetryNonce'          => wp_create_nonce( self::TELEMETRY_NONCE_ACTION ),
			'paymentSurfaceTimeoutMs' => self::PAYMENT_SURFACE_TIMEOUT_MS,
		] );
	}

	public static function suppress_noncritical_checkout_assets(): void {
		if ( ! self::is_primary_checkout_request() ) return;
		$explicit = apply_filters( 'dtb_checkout_noncritical_asset_handles', [] );
		$explicit = is_array( $explicit ) ? array_map( 'sanitize_key', $explicit ) : [];
		global $wp_scripts, $wp_styles;
		foreach ( [ [ $wp_scripts ?? null, 'script' ], [ $wp_styles ?? null, 'style' ] ] as [ $registry, $type ] ) {
			if ( ! is_object( $registry ) || ! isset( $registry->queue, $registry->registered ) || ! is_array( $registry->queue ) ) continue;
			foreach ( array_values( $registry->queue ) as $handle ) {
				$registered = $registry->registered[ $handle ] ?? null;
				$src = is_object( $registered ) ? (string) ( $registered->src ?? '' ) : '';
				if ( ! self::is_noncritical_asset( (string) $handle, $src, $explicit ) ) continue;
				if ( 'script' === $type ) wp_dequeue_script( $handle ); else wp_dequeue_style( $handle );
			}
		}
	}

	public static function print_early_resource_hints(): void {
		if ( ! self::is_primary_checkout_request() ) return;
		foreach ( [ 'https://js.stripe.com', 'https://m.stripe.network' ] as $origin ) {
			printf( '<link rel="preconnect" href="%s" crossorigin>\n', esc_url( $origin ) );
		}
		echo '<link rel="dns-prefetch" href="//js.stripe.com">' . "\n";
	}

	public static function augment_checkout_capabilities( $response, array $handler, WP_REST_Request $request ) {
		if ( '/dtb/v1/checkout/capabilities' !== $request->get_route() || is_wp_error( $response ) || ! $response instanceof WP_REST_Response ) return $response;
		$data = $response->get_data();
		if ( ! is_array( $data ) ) return $response;
		$data['performance'] = [
			'presentation_asset_owner'   => 'theme/drywall-toolbox',
			'noncritical_asset_policy'   => 'known_marketing_tracking_suppressed',
			'checkout_runtime_telemetry' => true,
			'payment_surface_timeout_ms' => self::PAYMENT_SURFACE_TIMEOUT_MS,
			'checkout_document_cache'    => 'private_no_store',
			'preconnect'                 => [ 'https://js.stripe.com', 'https://m.stripe.network' ],
		];
		$response->set_data( $data );
		return $response;
	}

	public static function telemetry_permission( WP_REST_Request $request ) {
		$nonce = (string) $request->get_header( 'X-DTB-Checkout-Telemetry' );
		if ( '' === $nonce ) $nonce = sanitize_text_field( (string) $request->get_param( 'nonce' ) );
		if ( ! wp_verify_nonce( $nonce, self::TELEMETRY_NONCE_ACTION ) ) return new WP_Error( 'dtb_checkout_telemetry_forbidden', 'Invalid checkout telemetry nonce.', [ 'status' => 403 ] );
		if ( ! self::request_origin_is_same_site() ) return new WP_Error( 'dtb_checkout_telemetry_origin', 'Invalid checkout telemetry origin.', [ 'status' => 403 ] );
		if ( class_exists( 'DTB_RateLimiter' ) ) return DTB_RateLimiter::check( 'checkout_runtime_telemetry', 18, 5 * MINUTE_IN_SECONDS );
		return true;
	}

	public static function record_runtime_telemetry( WP_REST_Request $request ): WP_REST_Response {
		$event_id = sanitize_text_field( (string) $request->get_param( 'event_id' ) );
		if ( ! preg_match( '/^[A-Za-z0-9_-]{8,80}$/', $event_id ) ) return new WP_REST_Response( [ 'accepted' => false, 'reason' => 'invalid_event_id' ], 400 );
		$dedupe_key = 'dtb_checkout_rt_' . substr( hash( 'sha256', $event_id ), 0, 32 );
		if ( false !== get_transient( $dedupe_key ) ) return new WP_REST_Response( [ 'accepted' => true, 'duplicate' => true ], 202 );
		set_transient( $dedupe_key, '1', self::TELEMETRY_EVENT_TTL );
		$kind = sanitize_key( (string) $request->get_param( 'kind' ) );
		$allowed = [ 'js_error', 'unhandled_rejection', 'resource_error', 'payment_surface_timeout', 'checkout_root_replaced', 'checkout_vitals', 'third_party_budget' ];
		if ( ! in_array( $kind, $allowed, true ) ) $kind = 'js_error';
		$context = [
			'kind'       => $kind,
			'event_id'   => $event_id,
			'message'    => self::bounded_text( (string) $request->get_param( 'message' ), 500 ),
			'source'     => self::sanitize_source( (string) $request->get_param( 'source' ) ),
			'line'       => absint( $request->get_param( 'line' ) ),
			'column'     => absint( $request->get_param( 'column' ) ),
			'viewport_w' => min( 10000, absint( $request->get_param( 'viewport_w' ) ) ),
			'step'       => sanitize_key( (string) $request->get_param( 'step' ) ),
			'detail'     => self::sanitize_detail( is_array( $request->get_param( 'detail' ) ) ? $request->get_param( 'detail' ) : [] ),
		];
		if ( class_exists( 'DTB_Logger' ) ) DTB_Logger::warning( 'Checkout runtime telemetry', $context );
		else error_log( wp_json_encode( [ 'source' => 'dtb-checkout', 'level' => 'warning', 'context' => $context ], JSON_UNESCAPED_SLASHES ) );
		return new WP_REST_Response( [ 'accepted' => true ], 202 );
	}

	private static function is_noncritical_asset( string $handle, string $src, array $explicit ): bool {
		if ( in_array( sanitize_key( $handle ), $explicit, true ) ) return true;
		$haystack = strtolower( $handle . ' ' . $src );
		foreach ( self::NONCRITICAL_HANDLE_TOKENS as $token ) if ( false !== strpos( $haystack, $token ) ) return true;
		$host = strtolower( (string) wp_parse_url( $src, PHP_URL_HOST ) );
		if ( '' === $host ) return false;
		foreach ( self::NONCRITICAL_HOSTS as $blocked ) if ( $host === $blocked || str_ends_with( $host, '.' . $blocked ) ) return true;
		return false;
	}

	private static function request_origin_is_same_site(): bool {
		$origin = get_http_origin();
		if ( ! $origin ) return true;
		$request = self::normalized_origin( $origin );
		$home = self::normalized_origin( home_url( '/' ) );
		return '' !== $request && '' !== $home && hash_equals( $home, $request );
	}

	private static function normalized_origin( string $url ): string {
		$scheme = strtolower( (string) wp_parse_url( $url, PHP_URL_SCHEME ) );
		$host = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
		$port = absint( wp_parse_url( $url, PHP_URL_PORT ) );
		if ( ! in_array( $scheme, [ 'http', 'https' ], true ) || '' === $host ) return '';
		$default = 'https' === $scheme ? 443 : 80;
		return $scheme . '://' . $host . ( $port > 0 && $port !== $default ? ':' . $port : '' );
	}

	private static function sanitize_source( string $source ): string {
		$source = trim( $source );
		if ( '' === $source ) return '';
		$parts = wp_parse_url( $source );
		if ( false === $parts ) return self::bounded_text( $source, 240 );
		$host = sanitize_text_field( (string) ( $parts['host'] ?? '' ) );
		$path = sanitize_text_field( (string) ( $parts['path'] ?? '' ) );
		return self::bounded_text( $host . $path, 240 );
	}

	private static function sanitize_detail( array $detail ): array {
		$out = [];
		foreach ( array_slice( $detail, 0, 20, true ) as $key => $value ) {
			$key = sanitize_key( (string) $key );
			if ( '' === $key ) continue;
			$out[ $key ] = is_scalar( $value ) ? self::bounded_text( (string) $value, 240 ) : '[complex]';
		}
		return $out;
	}

	private static function bounded_text( string $value, int $limit ): string {
		$value = sanitize_text_field( $value );
		return function_exists( 'mb_substr' ) ? mb_substr( $value, 0, $limit ) : substr( $value, 0, $limit );
	}

	private static function is_primary_checkout_request(): bool {
		if ( is_admin() || ! function_exists( 'is_checkout' ) || ! is_checkout() ) return false;
		if ( function_exists( 'is_wc_endpoint_url' ) && ( is_wc_endpoint_url( 'order-pay' ) || is_wc_endpoint_url( 'order-received' ) ) ) return false;
		return true;
	}
}

DTB_CheckoutPerformance::register();
