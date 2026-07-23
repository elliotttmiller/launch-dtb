<?php
/**
 * Checkout runtime integrity boundary.
 *
 * WooCommerce Checkout Block and the official WooCommerce Stripe extension own
 * their complete JavaScript dependency graph and execution order. DTB checkout
 * presentation may enhance the DOM only after Woo has mounted; it must never
 * impose async/defer strategy, dependency coupling, dequeue policy, or preload
 * behavior on Woo/WordPress checkout runtime assets.
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
		 * Checkout stability is more important than speculative optimization.
		 * Disable DTB queue mutation and resource prewarming entirely. This does not
		 * affect WooCommerce/Stripe-owned enqueueing, caching, or provider behavior.
		 */
		if ( class_exists( 'DTB_CheckoutPerformance' ) ) {
			remove_action( 'wp_enqueue_scripts', [ 'DTB_CheckoutPerformance', 'suppress_noncritical_checkout_assets' ], 9990 );
			remove_action( 'wp_head', [ 'DTB_CheckoutPerformance', 'print_early_resource_hints' ], 1 );
		}

		/* Run after all checkout modules have registered/enqueued their own assets. */
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'stabilize_dtb_checkout_scripts' ], PHP_INT_MAX );
	}

	/**
	 * Isolate DTB presentation scripts from Woo's critical script graph.
	 *
	 * This method intentionally touches DTB-owned handles only. It never mutates
	 * wc-*, wp-*, Stripe, payment-provider, or third-party registered scripts.
	 */
	public static function stabilize_dtb_checkout_scripts(): void {
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
			 * WordPress strategy propagation can alter dependency execution semantics.
			 * DTB checkout enhancement scripts deliberately use normal footer execution.
			 */
			if ( isset( $registered->extra ) && is_array( $registered->extra ) ) {
				unset( $registered->extra['strategy'] );
			}
		}

		/*
		 * The UI enhancer observes the rendered Checkout Block DOM and does not call
		 * Woo internals. A hard dependency on wc-blocks-checkout is therefore both
		 * unnecessary and unsafe because it couples DTB strategy resolution to Woo's
		 * critical vendor/package graph.
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
