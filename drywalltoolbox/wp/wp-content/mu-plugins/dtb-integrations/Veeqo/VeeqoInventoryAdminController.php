<?php
/**
 * Admin/operator boundary for Veeqo inventory reconciliation.
 *
 * Full catalog reconciliation performs external pagination and WooCommerce writes,
 * so interactive REST requests only enqueue work and return immediately.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'rest_api_init',
	static function (): void {
		register_rest_route(
			'dtb/v1',
			'/veeqo/admin/inventory/reconcile',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => 'dtb_veeqo_inventory_admin_enqueue_reconciliation',
				'permission_callback' => static fn(): bool => current_user_can( 'manage_woocommerce' ),
			],
			true
		);
	},
	40
);

function dtb_veeqo_inventory_admin_enqueue_reconciliation( WP_REST_Request $request ): WP_REST_Response {
	unset( $request );
	$readiness = function_exists( 'dtb_veeqo_inventory_readiness' ) ? dtb_veeqo_inventory_readiness() : [ 'ready' => false, 'missing' => [ 'inventory_projection' ] ];
	if ( empty( $readiness['ready'] ) ) {
		return new WP_REST_Response(
			[
				'success' => false,
				'code'    => 'veeqo_inventory_not_ready',
				'message' => 'Veeqo inventory projection is not configured.',
				'missing' => array_values( (array) ( $readiness['missing'] ?? [] ) ),
			],
			503
		);
	}
	if ( ! function_exists( 'as_enqueue_async_action' ) ) {
		return new WP_REST_Response( [ 'success' => false, 'code' => 'action_scheduler_unavailable', 'message' => 'Action Scheduler is unavailable.' ], 503 );
	}

	$already = function_exists( 'as_has_scheduled_action' )
		? as_has_scheduled_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP )
		: false;
	if ( $already ) {
		return new WP_REST_Response( [ 'success' => true, 'status' => 'already_queued', 'message' => 'A Veeqo inventory reconciliation is already scheduled.' ], 202 );
	}

	$action_id = as_enqueue_async_action(
		DTB_VEEQO_INVENTORY_RECONCILE_HOOK,
		[],
		DTB_VEEQO_INVENTORY_ACTION_GROUP,
		true
	);
	if ( empty( $action_id ) ) {
		return new WP_REST_Response( [ 'success' => false, 'code' => 'queue_failed', 'message' => 'Veeqo inventory reconciliation could not be queued.' ], 503 );
	}

	if ( function_exists( 'dtb_veeqo_log' ) ) {
		dtb_veeqo_log( 'info', 'inventory_reconciliation_queued', 'Operator queued a full Veeqo inventory reconciliation.', [
			'action_id'   => (int) $action_id,
			'operator_id' => get_current_user_id(),
		] );
	}

	return new WP_REST_Response(
		[
			'success'   => true,
			'status'    => 'queued',
			'action_id' => (int) $action_id,
			'message'   => 'Veeqo inventory reconciliation queued.',
		],
		202
	);
}
