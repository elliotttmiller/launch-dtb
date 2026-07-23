<?php
/**
 * Checkout runtime integrity boundary.
 *
 * WooCommerce Checkout Block and the official WooCommerce Stripe extension own
 * their complete JavaScript dependency graph and execution order. DTB checkout
 * presentation may enhance the DOM only after Woo has mounted; it must never
 * impose async/defer strategy or dependency coupling on Woo/WordPress checkout
 * runtime assets.
 *
 * The owning checkout modules are expected to register cleanly by default. This
 * class remains as a defensive last-line invariant against future regressions.
 * It never mutates WooCommerce, WordPress, Stripe, payment-provider, or other
 * third-party runtime handles.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CheckoutRuntimeIntegrity {
	/** DTB-owned presentation/diagnostic script handles allowed on native checkout. */
	private const DTB_CHECKOUT_SCRIPT_HANDLES = [
		'dtb-woo-native-checkout-steps',
		'dtb-woo-native-checkout-ui',
		'dtb-woo-native-checkout-profile-refinements',
		'dtb-woo-native-checkout-payment-sheet',
		'dtb-woo-native-checkout-performance',
	];

	public static function register(): void {
		/*
		 * Enforce the headless-theme exception at both lifecycle boundaries. The
		 * native runtime adapter already removes these callbacks during `wp`; these
		 * guards make checkout fail-safe if theme hook timing changes later.
		 */
		add_action( 'wp', [ __CLASS__, 'enforce_native_theme_exception' ], PHP_INT_MAX );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enforce_native_theme_exception' ], 0 );

		/* Run after checkout modules have registered/enqueued their DTB-owned assets. */
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enforce_dtb_checkout_script_invariants' ], PHP_INT_MAX );
	}

	/**
	 * Ensure the headless SPA theme cannot strip or replace the authoritative
	 * native checkout runtime.
	 */
	public static function enforce_native_theme_exception(): void {
		if ( ! self::is_native_checkout_request() ) {
			return;
		}

		remove_action( 'wp_enqueue_scripts', 'dtb_enqueue_react_app', 10 );
		remove_action( 'wp_enqueue_scripts', 'dtb_dequeue_non_react_assets', 9999 );
		remove_filter( 'template_include', 'dtb_force_react_template', 99 );
	}

	/**
	 * Enforce the DTB side of the checkout runtime contract without touching the
	 * authoritative Woo/WordPress/Stripe graph.
	 */
	public static function enforce_dtb_checkout_script_invariants(): void {
		if ( ! self::is_primary_checkout_request() ) {
			return;
		}

		global $wp_scripts;
		if ( ! $wp_scripts instanceof WP_Scripts ) {
			return;
		}

		foreach ( self::DTB_CHECKOUT_SCRIPT_HANDLES as $handle ) {
			$registered = $wp_scripts->registered[ $handle ] ?? null;
			if ( ! is_object( $registered ) ) {
				continue;
			}

			/* Defensive only: owning modules must not set async/defer strategy. */
			if ( isset( $registered->extra ) && is_array( $registered->extra ) ) {
				unset( $registered->extra['strategy'] );
			}
		}

		/*
		 * DTB's UI enhancer observes rendered DOM and must never depend directly on
		 * WooCommerce Checkout Block internals.
		 */
		$ui = $wp_scripts->registered['dtb-woo-native-checkout-ui'] ?? null;
		if ( is_object( $ui ) && isset( $ui->deps ) && is_array( $ui->deps ) ) {
			$ui->deps = array_values(
				array_filter(
					$ui->deps,
					static fn ( $dependency ): bool => 'wc-blocks-checkout' !== (string) $dependency
				)
			);
		}
	}

	private static function is_native_checkout_request(): bool {
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

	private static function is_primary_checkout_request(): bool {
		if ( ! self::is_native_checkout_request() ) {
			return false;
		}

		if ( function_exists( 'is_wc_endpoint_url' ) && ( is_wc_endpoint_url( 'order-pay' ) || is_wc_endpoint_url( 'order-received' ) ) ) {
			return false;
		}

		return true;
	}
}

DTB_CheckoutRuntimeIntegrity::register();
