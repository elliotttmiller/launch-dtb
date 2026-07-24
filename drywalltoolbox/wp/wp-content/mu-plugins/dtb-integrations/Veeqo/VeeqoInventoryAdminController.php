<?php
/**
 * Admin/operator boundary for Veeqo inventory reconciliation.
 *
 * Full catalog reconciliation performs external pagination and WooCommerce writes,
 * so interactive REST requests only enqueue work and return immediately. Legacy
 * mapping/pull routes are preserved as compatibility aliases to the same queue.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'rest_api_init',
	static function (): void {
		$definition = [
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'dtb_veeqo_inventory_admin_enqueue_reconciliation',
			'permission_callback' => static fn(): bool => current_user_can( 'manage_woocommerce' ),
		];

		register_rest_route( 'dtb/v1', '/veeqo/admin/inventory/reconcile', $definition, true );
		// Compatibility aliases: the old implementations performed N external API
		// calls or writes inside the interactive request. They now enqueue the same
		// batched reconciliation worker instead.
		register_rest_route( 'dtb/v1', '/veeqo/map-skus', $definition, true );
		register_rest_route( 'dtb/v1', '/veeqo/inventory/pull', $definition, true );

		register_rest_route(
			'dtb/v1',
			'/veeqo/admin/inventory/diagnostics',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'dtb_veeqo_inventory_admin_diagnostics',
				'permission_callback' => static fn(): bool => current_user_can( 'manage_woocommerce' ),
			],
			true
		);
	},
	40
);

function dtb_veeqo_inventory_admin_enqueue_reconciliation( WP_REST_Request $request ): WP_REST_Response {
	$route = sanitize_text_field( (string) $request->get_route() );
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
		return new WP_REST_Response( [ 'success' => true, 'status' => 'already_queued', 'message' => 'A Veeqo inventory reconciliation is already scheduled.', 'route' => $route ], 202 );
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
			'route'       => $route,
		] );
	}

	return new WP_REST_Response(
		[
			'success'   => true,
			'status'    => 'queued',
			'action_id' => (int) $action_id,
			'message'   => 'Veeqo inventory reconciliation queued.',
			'route'     => $route,
		],
		202
	);
}

function dtb_veeqo_inventory_admin_diagnostics(): WP_REST_Response {
	$last_sync_at = class_exists( 'DTB_VeeqoSyncJob' ) ? DTB_VeeqoSyncJob::last_timestamp( 'inventory' ) : 0;
	return new WP_REST_Response(
		[
			'readiness'    => function_exists( 'dtb_veeqo_inventory_readiness' ) ? dtb_veeqo_inventory_readiness() : [ 'ready' => false ],
			'last_run'     => defined( 'DTB_VEEQO_INVENTORY_DIAGNOSTICS' ) ? (array) get_option( DTB_VEEQO_INVENTORY_DIAGNOSTICS, [] ) : [],
			'last_sync_at' => $last_sync_at,
			'stale'        => $last_sync_at <= 0 || ( time() - $last_sync_at ) > 2 * HOUR_IN_SECONDS,
			'coverage'     => function_exists( 'dtb_veeqo_inventory_coverage_audit' ) ? dtb_veeqo_inventory_coverage_audit() : [],
		],
		200
	);
}
