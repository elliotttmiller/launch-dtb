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

// Product saves must not synchronously call Veeqo. The canonical inventory
// reconciliation maps exact SKUs and projects stock asynchronously in batches.
remove_action( 'woocommerce_update_product', 'dtb_veeqo_map_product_sku', 20 );

// The legacy client attempted webhook registration automatically. Production is
// fail-closed until the upstream signing contract is explicitly verified.
if ( ! dtb_veeqo_verified_webhooks_enabled() ) {
	remove_action( 'init', 'dtb_veeqo_ensure_webhooks', 30 );
}

// Also fail closed at ingress. Merely setting a secret is not sufficient to
// activate a signature scheme that has not been verified against Veeqo's live contract.
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
