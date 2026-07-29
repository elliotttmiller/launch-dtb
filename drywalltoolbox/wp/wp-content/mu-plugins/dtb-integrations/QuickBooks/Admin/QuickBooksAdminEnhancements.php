<?php
/**
 * QuickBooks Control Center layout and synchronization enhancements.
 *
 * Adds the "Synchronization operations" card as a scoped, properly-registered
 * stylesheet/script pair that depends on the primary `dtb-qbo-admin` handle
 * (declared via the page's AdminPageRegistry `assets` key). This runs at a
 * later priority than the central AdminAssets pipeline so the dependency
 * exists, and no longer injects styles through wp_add_inline_style('common').
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_enqueue_scripts', 'dtb_qbo_admin_enqueue_enhancements', 30 );

function dtb_qbo_admin_enqueue_enhancements(): void {
	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( 'dtb-quickbooks' !== $page || ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( ! wp_script_is( 'dtb-qbo-admin', 'enqueued' ) && ! wp_script_is( 'dtb-qbo-admin', 'registered' ) ) {
		return;
	}

	$base_dir = dirname( __DIR__ );
	$base_url = content_url( 'mu-plugins/dtb-integrations/QuickBooks/assets/' );
	$css_path = $base_dir . '/assets/quickbooks-admin-refinement.css';
	$js_path  = $base_dir . '/assets/quickbooks-admin-sync.js';

	if ( is_readable( $css_path ) ) {
		wp_enqueue_style(
			'dtb-qbo-admin-refinement',
			$base_url . 'quickbooks-admin-refinement.css',
			[ 'dtb-qbo-admin' ],
			(string) filemtime( $css_path )
		);
	}

	if ( is_file( $js_path ) ) {
		wp_enqueue_script(
			'dtb-qbo-admin-sync',
			$base_url . 'quickbooks-admin-sync.js',
			[ 'dtb-qbo-admin' ],
			(string) filemtime( $js_path ),
			true
		);
	}
}
