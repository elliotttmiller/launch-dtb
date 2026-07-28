<?php
/**
 * QuickBooks integration health check.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_QuickBooksHealthCheck' ) ) {
	return;
}

final class DTB_QuickBooksHealthCheck {
	public static function register(): void {
		if ( class_exists( 'DTB_HealthRegistry' ) ) {
			DTB_HealthRegistry::register( 'quickbooks', [ self::class, 'run' ] );
		}
	}

	/** Passive diagnostics only; this method never performs an external request. */
	public static function run(): array {
		$status = function_exists( 'dtb_qbo_status' ) ? dtb_qbo_status() : [];
		$status['ok'] = ! empty( $status['connected'] ) && ! empty( $status['company_verified'] );
		$status['request_available'] = function_exists( 'dtb_qbo_request' );
		$status['queue_pipeline_available'] = function_exists( 'dtb_qbo_sync_order_pipeline' );
		return $status;
	}
}

add_action( 'plugins_loaded', [ 'DTB_QuickBooksHealthCheck', 'register' ], 20 );

function dtb_integrations_qbo_status(): array {
	return DTB_QuickBooksHealthCheck::run();
}
