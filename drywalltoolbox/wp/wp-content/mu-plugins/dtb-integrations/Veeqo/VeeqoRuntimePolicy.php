<?php
/**
 * Veeqo runtime authority and retirement policy.
 *
 * The historical Veeqo client remains a compatibility library for its API,
 * payload, logging, repair, and shipping helpers. It no longer owns REST route
 * registration, inventory scheduling, product-save mapping, settings UI, or
 * automatic webhook registration.
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

// Retire legacy runtime ownership before WordPress dispatches any of these hooks.
remove_action( 'rest_api_init', 'dtb_veeqo_register_routes', 10 );
remove_action( 'woocommerce_update_product', 'dtb_veeqo_map_product_sku', 20 );
remove_filter( 'cron_schedules', 'dtb_veeqo_register_cron_intervals' );
remove_action( 'init', 'dtb_veeqo_schedule_inventory_pull', 25 );
remove_action( 'dtb_veeqo_inventory_sync', 'dtb_veeqo_run_inventory_pull' );
remove_action( 'init', 'dtb_veeqo_ensure_webhooks', 30 );

/**
 * Delete credential fields left by historical settings screens.
 *
 * Secrets are valid only as server constants. This migration is idempotent and
 * never logs or reads the secret values into an operator response.
 */
function dtb_veeqo_remove_persisted_credentials(): void {
	$settings = (array) get_option( 'woocommerce_dtb_veeqo_settings', [] );
	if ( ! array_key_exists( 'api_key', $settings ) && ! array_key_exists( 'webhook_secret', $settings ) ) {
		return;
	}
	unset( $settings['api_key'], $settings['webhook_secret'] );
	update_option( 'woocommerce_dtb_veeqo_settings', $settings, false );
	unset( $GLOBALS['_dtb_veeqo_config'] );
	if ( function_exists( 'dtb_veeqo_log' ) ) {
		dtb_veeqo_log( 'info', 'persisted_credentials_removed', 'Historical Veeqo credential fields were removed from WordPress options.' );
	}
}
add_action( 'init', 'dtb_veeqo_remove_persisted_credentials', 1 );

/** Retire the persisted legacy WP-Cron event with retry-on-cleanup-failure. */
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

// Inbound fulfillment is fail-closed unless the exact upstream authentication
// contract has been verified and explicitly enabled.
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
		return new WP_Error(
			'veeqo_webhook_disabled',
			'Veeqo webhook ingress is disabled until the upstream authentication contract is verified.',
			[ 'status' => 503 ]
		);
	},
	-60,
	3
);

/** Queue one deduplicated reconciliation after a validated configuration change. */
function dtb_veeqo_queue_inventory_reconciliation_after_configuration(): void {
	if ( ! function_exists( 'dtb_veeqo_inventory_readiness' ) || empty( dtb_veeqo_inventory_readiness()['ready'] ) ) {
		return;
	}
	if ( class_exists( 'DTB_Veeqo_Operation_Store' ) ) {
		DTB_Veeqo_Operation_Store::enqueue( false );
		return;
	}
	if ( ! function_exists( 'as_enqueue_async_action' ) ) {
		return;
	}
	$already = function_exists( 'as_has_scheduled_action' )
		? as_has_scheduled_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP )
		: false;
	if ( ! $already ) {
		as_enqueue_async_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP, true );
	}
}
add_action( 'dtb_veeqo_configuration_updated', 'dtb_veeqo_queue_inventory_reconciliation_after_configuration', 100 );

function dtb_veeqo_runtime_readiness(): array {
	$order     = function_exists( 'dtb_veeqo_production_readiness' ) ? dtb_veeqo_production_readiness() : [ 'ready' => false, 'missing' => [ 'production_configuration' ] ];
	$inventory = function_exists( 'dtb_veeqo_inventory_readiness' ) ? dtb_veeqo_inventory_readiness() : [ 'ready' => false, 'missing' => [ 'inventory_projection' ] ];
	return [
		'order_projection_ready' => ! empty( $order['ready'] ),
		'inventory_ready'        => ! empty( $inventory['ready'] ),
		'webhooks_enabled'       => dtb_veeqo_verified_webhooks_enabled(),
		'order'                  => $order,
		'inventory'              => $inventory,
	];
}
