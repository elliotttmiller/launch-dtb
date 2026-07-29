<?php
/**
 * QuickBooks Control Center layout and synchronization enhancements.
 *
 * Adds the synchronization operations UI plus the shared DTB integration
 * control-center presentation and visibility-aware live-health observer. The
 * accounting projection itself remains queue-owned and idempotent; this layer
 * observes readiness and exposes operator controls only.
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

	$base_dir        = dirname( __DIR__ );
	$base_url        = content_url( 'mu-plugins/dtb-integrations/QuickBooks/assets/' );
	$shared_dir      = dirname( dirname( __DIR__ ) ) . '/assets/';
	$shared_url      = content_url( 'mu-plugins/dtb-integrations/assets/' );
	$css_path        = $base_dir . '/assets/quickbooks-admin-refinement.css';
	$js_path         = $base_dir . '/assets/quickbooks-admin-sync.js';
	$shared_css_path = $shared_dir . 'integration-control-center.css';
	$shared_js_path  = $shared_dir . 'integration-control-center.js';

	if ( is_readable( $css_path ) ) {
		wp_enqueue_style(
			'dtb-qbo-admin-refinement',
			$base_url . 'quickbooks-admin-refinement.css',
			[ 'dtb-qbo-admin' ],
			(string) filemtime( $css_path )
		);
	}

	if ( is_readable( $shared_css_path ) ) {
		wp_enqueue_style(
			'dtb-integration-control-center',
			$shared_url . 'integration-control-center.css',
			[ 'dtb-qbo-admin-refinement' ],
			(string) filemtime( $shared_css_path )
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

	if ( is_file( $shared_js_path ) ) {
		wp_enqueue_script(
			'dtb-integration-control-center',
			$shared_url . 'integration-control-center.js',
			[ 'dtb-qbo-admin', 'dtb-qbo-admin-sync' ],
			(string) filemtime( $shared_js_path ),
			true
		);
	}
}
