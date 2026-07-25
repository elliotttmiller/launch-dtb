<?php
/**
 * Veeqo Operations admin asset timing.
 *
 * The operations page renders its inline controller before WordPress prints
 * footer scripts on some admin stacks. Ensure wp-api-fetch and its dependencies
 * are available in the document head for this page only.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/** Return whether the current request is the Veeqo Operations admin screen. */
function dtb_veeqo_operations_is_admin_screen(): bool {
	if ( ! is_admin() ) {
		return false;
	}

	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only screen routing.
	return 'dtb-veeqo-operations' === $page;
}

add_action(
	'admin_enqueue_scripts',
	static function (): void {
		if ( dtb_veeqo_operations_is_admin_screen() ) {
			wp_enqueue_script( 'wp-api-fetch' );
		}
	},
	1
);

add_action(
	'admin_head',
	static function (): void {
		if ( ! dtb_veeqo_operations_is_admin_screen() || wp_script_is( 'wp-api-fetch', 'done' ) ) {
			return;
		}

		// The page controller executes inline in the body. Printing the registered
		// dependency here prevents a false "REST client unavailable" state while
		// preserving WordPress' native REST nonce and cookie middleware.
		wp_print_scripts( 'wp-api-fetch' );
	},
	1
);
