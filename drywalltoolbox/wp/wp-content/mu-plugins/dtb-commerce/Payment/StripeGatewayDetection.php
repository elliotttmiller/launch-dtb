<?php
/**
 * Shared, provider-agnostic Stripe gateway detection.
 *
 * This store may run its live Stripe payments through either the official
 * WooCommerce Stripe Payment Gateway (wordpress.org slug
 * `woocommerce-gateway-stripe`) or "Payment Plugins for Stripe WooCommerce"
 * (wordpress.org slug `woo-stripe-payment`, https://wordpress.org/plugins/woo-stripe-payment/).
 * The two plugins cannot be active at the same time, so at most one of these
 * providers is ever live.
 *
 * Detection here does not rely on guessing either plugin's internal PHP
 * constants, hook names, or gateway ID strings, because those were not
 * independently verified against the new plugin's actual source at the time
 * this was written (it is not installed in this repository or any
 * environment this code could inspect). Instead it reuses the same
 * reflection-based technique the existing official-Stripe detection already
 * used: resolve the concrete gateway object's PHP class file and check which
 * plugin directory it physically lives in. A plugin's installed folder name
 * matches its wordpress.org slug by default, so this only depends on facts
 * that are true regardless of that plugin's internal API surface.
 *
 * DTB code that depends on gateway-specific hook names, filter shapes, or
 * option keys (Stripe Appearance API styling, Express Checkout wallet address
 * normalization, shipping-rate cache invalidation) is NOT wired to the
 * "payment_plugins" provider here. Those integrations must be added once the
 * plugin is actually installed on a staging environment and its real
 * extension points are confirmed — see docs/stripe-gateway-migration.md.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_StripeGatewayDetection {
	private const OFFICIAL_PLUGIN_DIR       = '/woocommerce-gateway-stripe/';
	private const PAYMENT_PLUGINS_DIR       = '/woo-stripe-payment/';
	private const OFFICIAL_GATEWAY_PREFIX   = 'stripe';

	/** @var array<string,object|null>|null */
	private static ?array $cache = null;

	/**
	 * @return array{official: object|null, payment_plugins: object|null}
	 */
	private static function active_instances(): array {
		if ( null !== self::$cache ) {
			return self::$cache;
		}

		$result = [ 'official' => null, 'payment_plugins' => null ];

		if ( ! function_exists( 'WC' ) || ! WC() || ! WC()->payment_gateways() ) {
			self::$cache = $result;
			return $result;
		}

		$gateways = WC()->payment_gateways()->payment_gateways();
		if ( ! is_array( $gateways ) ) {
			self::$cache = $result;
			return $result;
		}

		foreach ( $gateways as $gateway ) {
			if ( ! is_object( $gateway ) ) {
				continue;
			}

			$file = self::gateway_class_file( $gateway );
			if ( '' === $file ) {
				continue;
			}

			if ( null === $result['official'] && false !== strpos( $file, self::OFFICIAL_PLUGIN_DIR ) ) {
				$result['official'] = $gateway;
			}
			if ( null === $result['payment_plugins'] && false !== strpos( $file, self::PAYMENT_PLUGINS_DIR ) ) {
				$result['payment_plugins'] = $gateway;
			}
		}

		self::$cache = $result;
		return $result;
	}

	private static function gateway_class_file( object $gateway ): string {
		try {
			$reflection = new ReflectionClass( $gateway );
			return wp_normalize_path( (string) $reflection->getFileName() );
		} catch ( ReflectionException $e ) {
			return '';
		}
	}

	/** True if any gateway instance is physically loaded from the official plugin's directory. */
	public static function official_gateway_instance(): ?object {
		return self::active_instances()['official'];
	}

	/** True if any gateway instance is physically loaded from the Payment Plugins directory. */
	public static function payment_plugins_gateway_instance(): ?object {
		return self::active_instances()['payment_plugins'];
	}

	public static function is_official_active(): bool {
		return null !== self::official_gateway_instance();
	}

	public static function is_payment_plugins_active(): bool {
		return null !== self::payment_plugins_gateway_instance();
	}

	/** @return 'official'|'payment_plugins'|null */
	public static function active_provider(): ?string {
		if ( self::is_official_active() ) {
			return 'official';
		}
		if ( self::is_payment_plugins_active() ) {
			return 'payment_plugins';
		}
		return null;
	}

	public static function any_stripe_gateway_enabled(): bool {
		foreach ( [ self::official_gateway_instance(), self::payment_plugins_gateway_instance() ] as $gateway ) {
			if ( is_object( $gateway ) && isset( $gateway->enabled ) && 'yes' === (string) $gateway->enabled ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * True when the given WooCommerce payment_method string plausibly belongs
	 * to either supported Stripe provider. Used for order-level checks that
	 * must keep working for historical orders placed under either gateway.
	 */
	public static function is_stripe_payment_method( string $payment_method ): bool {
		$id = sanitize_key( $payment_method );
		return '' !== $id && str_contains( $id, 'stripe' );
	}

	/** Reset the request-scoped cache. Test/diagnostic use only. */
	public static function reset_cache(): void {
		self::$cache = null;
	}
}
