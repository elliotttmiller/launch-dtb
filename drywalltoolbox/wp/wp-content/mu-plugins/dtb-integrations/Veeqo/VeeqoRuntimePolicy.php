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

/** Whether verified Veeqo webhook ingress is explicitly enabled. */
function dtb_veeqo_verified_webhooks_enabled(): bool {
	return defined( 'DTB_VEEQO_ENABLE_VERIFIED_WEBHOOKS' )
		&& true === DTB_VEEQO_ENABLE_VERIFIED_WEBHOOKS
		&& defined( 'DTB_VEEQO_WEBHOOK_SECRET' )
		&& '' !== trim( (string) DTB_VEEQO_WEBHOOK_SECRET );
}

// VeeqoClient.php historically attempted webhook discovery/registration on every
// runtime after a transient expired. Production policy is fail-closed until the
// upstream signing contract is verified. Remove only that legacy registration
// hook; the verified webhook controller remains available behind its auth guard.
if ( ! dtb_veeqo_verified_webhooks_enabled() ) {
	remove_action( 'init', 'dtb_veeqo_ensure_webhooks', 30 );
}

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
