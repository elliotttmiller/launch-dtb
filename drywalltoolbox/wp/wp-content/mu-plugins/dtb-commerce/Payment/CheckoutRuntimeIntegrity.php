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
 * It touches DTB-owned script handles only and never mutates WooCommerce,
 * WordPress, Stripe, payment-provider, or third-party runtime handles.
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
		/* Run after checkout modules have registered/enqueued their DTB-owned assets. */
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enforce_dtb_checkout_script_invariants' ], PHP_INT_MAX );
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

			/*
			 * Defensive only: owning modules should not set a strategy. Remove it if a
			 * future regression reintroduces one on a DTB-owned checkout script.
			 */
			if ( isset( $registered->extra ) && is_array( $registered->extra ) ) {
				unset( $registered->extra['strategy'] );
			}
		}

		/*
		 * DTB's UI enhancer observes rendered DOM and must never depend directly on
		 * WooCommerce Checkout Block internals. Keep this guard even though the owning
		 * enqueue method now registers the clean dependency list itself.
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

	private static function is_primary_checkout_request(): bool {
		if ( is_admin() || ! function_exists( 'is_checkout' ) || ! is_checkout() ) {
			return false;
		}

		if ( function_exists( 'is_wc_endpoint_url' ) && ( is_wc_endpoint_url( 'order-pay' ) || is_wc_endpoint_url( 'order-received' ) ) ) {
			return false;
		}

		return true;
	}
}

DTB_CheckoutRuntimeIntegrity::register();
