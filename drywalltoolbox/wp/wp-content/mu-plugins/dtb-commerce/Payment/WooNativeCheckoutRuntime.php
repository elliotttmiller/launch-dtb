<?php
/**
 * Native WooCommerce checkout runtime adapter for the headless DTB theme.
 *
 * The active public theme normally forces frontend requests into the React SPA
 * and strips non-React assets. Checkout is the deliberate exception: WooCommerce
 * must own the server-rendered runtime so Checkout Block and the official Stripe
 * extension can enqueue their supported assets and execute native endpoint state.
 *
 * Presentation belongs to the active theme's checkout template/assets. This
 * adapter owns only the runtime exception boundary and never renders payment
 * methods, checkout blocks, or a competing presentation implementation itself.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_WooNativeCheckoutRuntime {
	public static function register(): void {
		add_action( 'wp', [ __CLASS__, 'prepare_runtime' ], 1 );
		/* Re-assert immediately before enqueue processing so theme hook timing cannot
		 * restore the SPA asset stripper on a transactional checkout request. */
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'prepare_runtime' ], 0 );
		add_filter( 'template_include', [ __CLASS__, 'template_include' ], 1000 );
		add_action( 'send_headers', [ __CLASS__, 'send_private_headers' ], 20 );
		add_action( 'woocommerce_store_api_checkout_order_processed', [ __CLASS__, 'persist_store_api_checkout_metadata' ], 100 );
	}

	public static function prepare_runtime(): void {
		if ( ! self::is_native_checkout_surface() ) {
			return;
		}

		/* The React shell is not authoritative on Woo checkout/payment endpoints. */
		remove_action( 'wp_enqueue_scripts', 'dtb_enqueue_react_app', 10 );
		remove_action( 'wp_enqueue_scripts', 'dtb_dequeue_non_react_assets', 9999 );
		remove_filter( 'template_include', 'dtb_force_react_template', 99 );

		/* Presentation is theme-owned. Prevent the superseded MU-plugin presentation
		 * layer from enqueueing a second CSS/JS controller over the theme checkout. */
		if ( class_exists( 'DTB_OfficialStripeNativeCheckout' ) ) {
			remove_action( 'wp_enqueue_scripts', [ 'DTB_OfficialStripeNativeCheckout', 'enqueue_checkout_assets' ], 20 );
		}
		if ( class_exists( 'DTB_CheckoutFieldPolicy' ) ) {
			remove_action( 'wp_enqueue_scripts', [ 'DTB_CheckoutFieldPolicy', 'enqueue_checkout_refinements' ], 30 );
		}
	}

	public static function template_include( string $template ): string {
		if ( ! self::is_native_checkout_surface() ) {
			return $template;
		}

		/* The active theme is the presentation owner. Fail open to Woo/WordPress's
		 * resolved template if the expected theme template is unavailable. */
		$theme_template = locate_template( 'templates/checkout/native-checkout.php', false, false );
		return is_string( $theme_template ) && '' !== $theme_template && is_readable( $theme_template )
			? $theme_template
			: $template;
	}

	public static function send_private_headers(): void {
		if ( ! self::is_native_checkout_surface() || headers_sent() ) {
			return;
		}

		nocache_headers();
		header( 'Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0', true );
		header( 'Pragma: no-cache', true );
	}

	/**
	 * Checkout Block processes orders through the Store API. DTB checkout tagging
	 * runs earlier on that lifecycle and updates the order object in memory; save
	 * the metadata explicitly at a late priority so the production contract is
	 * durable before payment/lifecycle observers inspect it.
	 */
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

		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? (string) wp_unslash( $_SERVER['REQUEST_URI'] )
			: '';
		$path = (string) wp_parse_url( $request_uri, PHP_URL_PATH );

		return (bool) preg_match( '#/(?:staging/[A-Za-z0-9_-]+/)?checkout(?:/|$)#i', $path );
	}
}

DTB_WooNativeCheckoutRuntime::register();
