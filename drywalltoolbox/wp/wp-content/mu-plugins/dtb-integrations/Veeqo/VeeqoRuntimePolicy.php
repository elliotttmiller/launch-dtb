<?php
/**
 * Veeqo runtime policy guards.
 *
 * Keeps legacy compatibility code from re-claiming production authority.
 * Inbound webhooks remain disabled unless the exact upstream authentication
 * contract has been verified and explicitly enabled by server configuration.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/VeeqoInventorySchedulePolicy.php';
require_once __DIR__ . '/VeeqoInventoryCoverageService.php';

function dtb_veeqo_verified_webhooks_enabled(): bool {
	return defined( 'DTB_VEEQO_ENABLE_VERIFIED_WEBHOOKS' )
		&& true === DTB_VEEQO_ENABLE_VERIFIED_WEBHOOKS
		&& defined( 'DTB_VEEQO_WEBHOOK_SECRET' )
		&& '' !== trim( (string) DTB_VEEQO_WEBHOOK_SECRET );
}

remove_action( 'woocommerce_update_product', 'dtb_veeqo_map_product_sku', 20 );
remove_action( 'init', 'dtb_veeqo_schedule_inventory_pull', 25 );
remove_action( 'dtb_veeqo_inventory_sync', 'dtb_veeqo_run_inventory_pull' );

function dtb_veeqo_retire_legacy_inventory_cron(): void {
	if ( '1' === (string) get_option( 'dtb_veeqo_legacy_inventory_cron_retired_v1', '' ) ) {
		return;
	}
	$cleared = wp_clear_scheduled_hook( 'dtb_veeqo_inventory_sync' );
	if ( is_wp_error( $cleared ) || false === $cleared ) {
		if ( function_exists( 'dtb_veeqo_log' ) ) {
			dtb_veeqo_log( 'error', 'legacy_inventory_cron_retirement_failed', 'Legacy Veeqo inventory cron could not be cleared; retirement will be retried.', [
				'error' => is_wp_error( $cleared ) ? sanitize_text_field( $cleared->get_error_message() ) : 'wp_clear_scheduled_hook returned false',
			] );
		}
		return;
	}
	update_option( 'dtb_veeqo_legacy_inventory_cron_retired_v1', '1', false );
	if ( function_exists( 'dtb_veeqo_log' ) ) {
		dtb_veeqo_log( 'info', 'legacy_inventory_cron_retired', 'Legacy Veeqo WP-Cron inventory projection was retired in favor of Action Scheduler.' );
	}
}
add_action( 'init', 'dtb_veeqo_retire_legacy_inventory_cron', 5 );

if ( ! dtb_veeqo_verified_webhooks_enabled() ) {
	remove_action( 'init', 'dtb_veeqo_ensure_webhooks', 30 );
}

add_filter(
	'rest_pre_dispatch',
	static function ( $result, $server, WP_REST_Request $request ) {
		unset( $server );
		if ( null !== $result || '/dtb/v1/veeqo/webhooks/order' !== (string) $request->get_route() ) {
			return $result;
		}
		if ( dtb_veeqo_verified_webhooks_enabled() ) {
			return $result;
		}
		return new WP_Error( 'veeqo_webhook_disabled', 'Veeqo webhook ingress is disabled until the upstream authentication contract is verified.', [ 'status' => 503 ] );
	},
	-60,
	3
);

function dtb_veeqo_queue_inventory_reconciliation_after_configuration(): void {
	if ( ! function_exists( 'dtb_veeqo_inventory_readiness' ) || empty( dtb_veeqo_inventory_readiness()['ready'] ) || ! function_exists( 'as_enqueue_async_action' ) ) {
		return;
	}
	$already = function_exists( 'as_has_scheduled_action' ) ? as_has_scheduled_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP ) : false;
	if ( ! $already ) {
		as_enqueue_async_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP, true );
	}
}
add_action( 'woocommerce_update_options_integration_dtb_veeqo', 'dtb_veeqo_queue_inventory_reconciliation_after_configuration', 100 );

function dtb_veeqo_runtime_readiness(): array {
	$order     = function_exists( 'dtb_veeqo_production_readiness' ) ? dtb_veeqo_production_readiness() : [ 'ready' => false, 'missing' => [ 'production_configuration' ] ];
	$inventory = function_exists( 'dtb_veeqo_inventory_readiness' ) ? dtb_veeqo_inventory_readiness() : [ 'ready' => false, 'missing' => [ 'inventory_projection' ] ];
	return [ 'order_projection_ready' => ! empty( $order['ready'] ), 'inventory_ready' => ! empty( $inventory['ready'] ), 'webhooks_enabled' => dtb_veeqo_verified_webhooks_enabled(), 'order' => $order, 'inventory' => $inventory ];
}
