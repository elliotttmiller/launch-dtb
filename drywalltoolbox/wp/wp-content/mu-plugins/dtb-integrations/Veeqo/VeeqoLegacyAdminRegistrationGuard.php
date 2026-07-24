<?php
/**
 * Veeqo legacy admin registration guard.
 *
 * VeeqoClient.php remains the runtime/API client. Its historical anonymous
 * WooCommerce integration registration must not own wp-admin now that
 * VeeqoProductionConfiguration.php is the canonical settings owner.
 *
 * This removes only the legacy woocommerce_integrations callback originating
 * from VeeqoClient.php. It does not alter API, order, inventory, queue, or
 * fulfillment behavior.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Remove the historical anonymous WooCommerce integration registration callback
 * from VeeqoClient.php before WooCommerce resolves integration classes.
 */
function dtb_veeqo_remove_legacy_admin_registration(): void {
	global $wp_filter;

	$hook = $wp_filter['woocommerce_integrations'] ?? null;
	if ( ! $hook instanceof WP_Hook || ! is_array( $hook->callbacks ) ) {
		return;
	}

	foreach ( $hook->callbacks as $priority => $callbacks ) {
		foreach ( $callbacks as $callback ) {
			$function = $callback['function'] ?? null;
			if ( ! $function instanceof Closure ) {
				continue;
			}

			try {
				$reflection = new ReflectionFunction( $function );
				$filename   = wp_normalize_path( (string) $reflection->getFileName() );
			} catch ( ReflectionException $e ) {
				continue;
			}

			if ( ! str_ends_with( $filename, '/dtb-integrations/Veeqo/VeeqoClient.php' ) ) {
				continue;
			}

			remove_filter( 'woocommerce_integrations', $function, (int) $priority );
		}
	}
}

dtb_veeqo_remove_legacy_admin_registration();
