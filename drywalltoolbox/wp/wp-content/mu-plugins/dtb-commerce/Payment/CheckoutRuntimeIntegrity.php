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
 * class remains as a defensive last-line invariant against future regressions
 * and hosting-layer optimizers that could otherwise combine/defer critical
 * checkout dependencies out of their registered execution order.
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

	/**
	 * Critical registered handles whose native order must not be changed by a
	 * hosting optimization layer. Unknown handles in this allowlist are harmless.
	 */
	private const CRITICAL_CHECKOUT_SCRIPT_HANDLES = [
		'jquery',
		'jquery-core',
		'jquery-migrate',
		'wp-api-fetch',
		'wp-compose',
		'wp-components',
		'wp-data',
		'wp-dom',
		'wp-element',
		'wp-hooks',
		'wp-html-entities',
		'wp-i18n',
		'wp-keycodes',
		'wp-plugins',
		'wp-primitives',
		'wc-settings',
		'wc-blocks-data-store',
		'wc-blocks-registry',
		'wc-blocks-components',
		'wc-cart-checkout-vendors',
		'wc-blocks-checkout',
		'wc-checkout-block-frontend',
		'wc-stripe-blocks-integration',
		'wc-stripe-upe-blocks',
		'wc-stripe-express-checkout',
		'wc-stripe-payment-request',
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

		/*
		 * SiteGround Speed Optimizer provides these documented filters specifically
		 * for scripts that must preserve execution order. Checkout is the authoritative
		 * transactional surface, so critical Woo/WP/Stripe scripts and inline bootstrap
		 * data are excluded from combine/minify/async transformations.
		 */
		add_filter( 'sgo_js_async_exclude', [ __CLASS__, 'exclude_critical_scripts_from_optimizer' ] );
		add_filter( 'sgo_javascript_combine_exclude', [ __CLASS__, 'exclude_critical_scripts_from_optimizer' ] );
		add_filter( 'sgo_js_minify_exclude', [ __CLASS__, 'exclude_critical_scripts_from_optimizer' ] );
		add_filter( 'sgo_javascript_combine_exclude_all_inline', [ __CLASS__, 'exclude_checkout_inline_scripts_from_combine' ] );
		add_filter( 'sgo_javascript_combine_exclude_all_inline_modules', [ __CLASS__, 'exclude_checkout_inline_scripts_from_combine' ] );
		add_filter( 'sgo_exclude_urls_from_cache', [ __CLASS__, 'exclude_checkout_urls_from_cache' ] );
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
	 * Enforce the DTB side of the checkout runtime contract without changing the
	 * authoritative Woo/WordPress/Stripe dependency graph.
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

		/* DTB observes rendered DOM and must never depend on Checkout Block internals. */
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

	/** @param mixed $exclude_list @return array<int,string> */
	public static function exclude_critical_scripts_from_optimizer( $exclude_list ): array {
		$exclude_list = is_array( $exclude_list ) ? $exclude_list : [];
		if ( ! self::is_native_checkout_request() ) {
			return $exclude_list;
		}

		return array_values( array_unique( array_merge(
			$exclude_list,
			self::CRITICAL_CHECKOUT_SCRIPT_HANDLES,
			self::DTB_CHECKOUT_SCRIPT_HANDLES
		) ) );
	}

	/** @param mixed $exclude @return bool */
	public static function exclude_checkout_inline_scripts_from_combine( $exclude ): bool {
		return self::is_native_checkout_request() ? true : (bool) $exclude;
	}

	/** @param mixed $excluded_urls @return array<int,string> */
	public static function exclude_checkout_urls_from_cache( $excluded_urls ): array {
		$excluded_urls = is_array( $excluded_urls ) ? $excluded_urls : [];
		$excluded_urls[] = '/checkout/*';
		return array_values( array_unique( $excluded_urls ) );
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
