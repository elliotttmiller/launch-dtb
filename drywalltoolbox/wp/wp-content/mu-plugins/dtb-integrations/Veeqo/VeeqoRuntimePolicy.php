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

function dtb_veeqo_verified_webhooks_enabled(): bool {
	return defined( 'DTB_VEEQO_ENABLE_VERIFIED_WEBHOOKS' )
		&& true === DTB_VEEQO_ENABLE_VERIFIED_WEBHOOKS
		&& defined( 'DTB_VEEQO_WEBHOOK_SECRET' )
		&& '' !== trim( (string) DTB_VEEQO_WEBHOOK_SECRET );
}

// The legacy client attempted webhook registration automatically. Production is
// fail-closed until the upstream signing contract is explicitly verified.
if ( ! dtb_veeqo_verified_webhooks_enabled() ) {
	remove_action( 'init', 'dtb_veeqo_ensure_webhooks', 30 );
}

/** Queue one deduplicated inventory reconciliation after production settings save. */
function dtb_veeqo_queue_inventory_reconciliation_after_configuration(): void {
	if ( ! function_exists( 'dtb_veeqo_inventory_readiness' ) || empty( dtb_veeqo_inventory_readiness()['ready'] ) || ! function_exists( 'as_enqueue_async_action' ) ) {
		return;
	}
	$already = function_exists( 'as_has_scheduled_action' )
		? as_has_scheduled_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP )
		: false;
	if ( ! $already ) {
		as_enqueue_async_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP, true );
	}
}
add_action( 'woocommerce_update_options_integration_dtb_veeqo', 'dtb_veeqo_queue_inventory_reconciliation_after_configuration', 100 );

/** Return a single redacted operational readiness snapshot. */
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
