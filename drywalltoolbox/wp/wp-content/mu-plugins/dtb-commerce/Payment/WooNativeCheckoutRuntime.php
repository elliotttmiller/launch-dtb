<?php
/**
 * Native WooCommerce checkout runtime adapter for the headless DTB theme.
 *
 * The MU-plugin owns runtime/security policy only. The active Drywall Toolbox
 * theme owns the native checkout document and all presentation assets.
 * WooCommerce Checkout Block and the official Stripe extension retain their
 * normal rendering, state, validation, order and payment authority.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_WooNativeCheckoutRuntime {
	public static function register(): void {
		add_action( 'wp', [ __CLASS__, 'prepare_runtime' ], 1 );
		add_filter( 'template_include', [ __CLASS__, 'template_include' ], 1000 );
		add_action( 'send_headers', [ __CLASS__, 'send_private_headers' ], 20 );
		add_action( 'woocommerce_store_api_checkout_order_processed', [ __CLASS__, 'persist_store_api_checkout_metadata' ], 100 );
	}

	public static function prepare_runtime(): void {
		if ( ! self::is_native_checkout_surface() ) {
			return;
		}

		// Native checkout must not be replaced by the React SPA or its asset policy.
		remove_action( 'wp_enqueue_scripts', 'dtb_enqueue_react_app', 10 );
		remove_action( 'wp_enqueue_scripts', 'dtb_dequeue_non_react_assets', 9999 );
		remove_filter( 'template_include', 'dtb_force_react_template', 99 );

		// Compatibility guard during the presentation ownership migration. These
		// backend classes retain payment/readiness policy, but no longer own UI assets.
		if ( class_exists( 'DTB_OfficialStripeNativeCheckout' ) ) {
			remove_action( 'wp_enqueue_scripts', [ 'DTB_OfficialStripeNativeCheckout', 'enqueue_checkout_assets' ], 20 );
			remove_filter( 'body_class', [ 'DTB_OfficialStripeNativeCheckout', 'body_class' ] );
		}
		if ( class_exists( 'DTB_MobilePaymentSheet' ) ) {
			remove_action( 'wp_enqueue_scripts', [ 'DTB_MobilePaymentSheet', 'enqueue_assets' ], 30 );
		}
	}

	public static function template_include( string $template ): string {
		if ( ! self::is_native_checkout_surface() ) {
			return $template;
		}

		$theme_template = locate_template( 'templates/checkout/native-checkout.php', false, false );
		if ( is_string( $theme_template ) && '' !== $theme_template && is_readable( $theme_template ) ) {
			return $theme_template;
		}

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[DTB] Native checkout theme template is missing: templates/checkout/native-checkout.php' );
		}
		return $template;
	}

	public static function send_private_headers(): void {
		if ( ! self::is_native_checkout_surface() || headers_sent() ) {
			return;
		}

		nocache_headers();
		header( 'Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0', true );
		header( 'Pragma: no-cache', true );
	}

	public static function persist_store_api_checkout_metadata( $order ): void {
		if ( ! $order instanceof WC_Order ) {
			return;
		}
		if (
			'woo_native_stripe' !== (string) $order->get_meta( '_dtb_checkout_gateway', true ) ||
			'woo-stripe-v1' !== (string) $order->get_meta( '_dtb_checkout_contract_version', true )
		) {
			return;
		}
		$order->save_meta_data();
	}

	private static function is_native_checkout_surface(): bool {
		if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return false;
		}
		if ( function_exists( 'is_checkout' ) && is_checkout() ) {
			return true;
		}
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
		$path = (string) wp_parse_url( $request_uri, PHP_URL_PATH );
		return (bool) preg_match( '#/(?:staging/[A-Za-z0-9_-]+/)?checkout(?:/|$)#i', $path );
	}
}

DTB_WooNativeCheckoutRuntime::register();
