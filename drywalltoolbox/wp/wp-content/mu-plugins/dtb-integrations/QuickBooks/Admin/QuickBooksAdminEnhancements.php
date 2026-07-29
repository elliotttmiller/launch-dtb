<?php
/**
 * QuickBooks Control Center layout and synchronization enhancements.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_enqueue_scripts', 'dtb_qbo_admin_enqueue_enhancements', 110 );

function dtb_qbo_admin_enqueue_enhancements(): void {
	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( 'dtb-quickbooks' !== $page || ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$base_dir = dirname( __DIR__ );
	$base_url = content_url( 'mu-plugins/dtb-integrations/QuickBooks/assets/' );
	$css_path = $base_dir . '/assets/quickbooks-admin-refinement.css';
	$js_path  = $base_dir . '/assets/quickbooks-admin-sync.js';

	wp_enqueue_style( 'common' );
	if ( is_readable( $css_path ) ) {
		$css = file_get_contents( $css_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( is_string( $css ) && '' !== $css ) {
			wp_add_inline_style( 'common', $css );
		}
	}

	wp_enqueue_script(
		'dtb-qbo-admin-sync',
		$base_url . 'quickbooks-admin-sync.js',
		[ 'dtb-qbo-admin' ],
		is_file( $js_path ) ? (string) filemtime( $js_path ) : '1.0.0',
		true
	);
}
