<?php
/**
 * Capability-protected REST boundary for the Veeqo admin control center.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/** Return whether the current WordPress operator may use the Veeqo control center. */
function dtb_veeqo_admin_can_manage(): bool {
	return current_user_can( 'manage_woocommerce' );
}

/** Convert a service result into a REST response while preserving WP_Error status. */
function dtb_veeqo_admin_rest_result( $result, int $success_status = 200 ) {
	if ( is_wp_error( $result ) ) {
		$data   = $result->get_error_data();
		$status = is_array( $data ) ? max( 400, (int) ( $data['status'] ?? 500 ) ) : 500;
		return new WP_Error( $result->get_error_code(), $result->get_error_message(), [ 'status' => $status ] );
	}
	return new WP_REST_Response( $result, $success_status );
}

/** Rate-limit explicit live refreshes per operator and view. */
function dtb_veeqo_admin_allow_refresh( string $scope ): bool {
	$scope = sanitize_key( $scope );
	$key   = 'dtb_vad_refresh_' . get_current_user_id() . '_' . md5( $scope );
	if ( get_transient( $key ) ) {
		return false;
	}
	set_transient( $key, 1, defined( 'DTB_VEEQO_ADMIN_REFRESH_INTERVAL' ) ? DTB_VEEQO_ADMIN_REFRESH_INTERVAL : 5 );
	return true;
}

/** Resolve and enforce the optional fresh query flag. */
function dtb_veeqo_admin_request_force( WP_REST_Request $request, string $scope ) {
	$force = rest_sanitize_boolean( $request->get_param( 'fresh' ) );
	if ( $force && ! dtb_veeqo_admin_allow_refresh( $scope ) ) {
		return new WP_Error( 'veeqo_refresh_rate_limited', 'Live refresh is rate-limited. Retry in a few seconds.', [ 'status' => 429 ] );
	}
	return $force;
}

/** Validate and save operational resource IDs without persisting secrets. */
function dtb_veeqo_admin_save_settings( array $input ) {
	if ( ! function_exists( 'dtb_veeqo_production_discover_resources' ) ) {
		return new WP_Error( 'veeqo_configuration_unavailable', 'Veeqo configuration services are unavailable.', [ 'status' => 503 ] );
	}
	$resources = dtb_veeqo_production_discover_resources();
	if ( ! empty( $resources['errors'] ) ) {
		return new WP_Error( 'veeqo_resource_discovery_failed', implode( ' ', array_map( 'sanitize_text_field', (array) $resources['errors'] ) ), [ 'status' => 502 ] );
	}

	$definitions = [
		'channel_id'         => [ 'resource' => 'channels', 'constant' => 'DTB_VEEQO_CHANNEL_ID' ],
		'warehouse_id'       => [ 'resource' => 'warehouses', 'constant' => 'DTB_VEEQO_WAREHOUSE_ID' ],
		'delivery_method_id' => [ 'resource' => 'delivery_methods', 'constant' => 'DTB_VEEQO_DELIVERY_METHOD_ID' ],
	];
	$settings = (array) get_option( 'woocommerce_dtb_veeqo_settings', [] );
	$errors   = [];
	$locked   = [];

	foreach ( $definitions as $field => $definition ) {
		$constant = $definition['constant'];
		if ( defined( $constant ) && (int) constant( $constant ) > 0 ) {
			$locked[] = $field;
			continue;
		}
		$value     = absint( $input[ $field ] ?? 0 );
		$valid_ids = array_values( array_filter( array_map( static fn( array $item ): int => absint( $item['id'] ?? 0 ), (array) ( $resources[ $definition['resource'] ] ?? [] ) ) ) );
		if ( $value <= 0 || ! in_array( $value, $valid_ids, true ) ) {
			$errors[] = sprintf( 'Selected %s is not a valid Veeqo resource.', str_replace( '_', ' ', $field ) );
			continue;
		}
		$settings[ $field ] = $value;
	}

	if ( ! empty( $errors ) ) {
		return new WP_Error( 'invalid_veeqo_settings', implode( ' ', $errors ), [ 'status' => 409 ] );
	}
	unset( $settings['api_key'], $settings['webhook_secret'] );
	update_option( 'woocommerce_dtb_veeqo_settings', $settings, false );
	unset( $GLOBALS['_dtb_veeqo_config'] );

	$readiness = function_exists( 'dtb_veeqo_production_readiness' ) ? dtb_veeqo_production_readiness() : [ 'ready' => false, 'missing' => [ 'production_readiness' ] ];
	$diagnostics = [
		'checked_at'           => gmdate( 'c' ),
		'ready'                => ! empty( $readiness['ready'] ),
		'errors'               => [],
		'channel_candidates'   => array_values( (array) $resources['channels'] ),
		'warehouse_candidates' => array_values( (array) $resources['warehouses'] ),
		'delivery_candidates'  => array_values( (array) $resources['delivery_methods'] ),
		'readiness'            => $readiness,
	];
	if ( defined( 'DTB_VEEQO_CONFIGURATION_DIAGNOSTICS_OPTION' ) ) {
		update_option( DTB_VEEQO_CONFIGURATION_DIAGNOSTICS_OPTION, $diagnostics, false );
	}
	if ( function_exists( 'dtb_veeqo_admin_cache_flush' ) ) {
		dtb_veeqo_admin_cache_flush();
	}
	if ( function_exists( 'as_enqueue_async_action' ) && defined( 'DTB_VEEQO_INVENTORY_RECONCILE_HOOK' ) ) {
		$already = function_exists( 'as_has_scheduled_action' )
			? as_has_scheduled_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP )
			: false;
		if ( ! $already ) {
			as_enqueue_async_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP, true );
		}
	}

	if ( function_exists( 'dtb_veeqo_log' ) ) {
		dtb_veeqo_log( 'info', 'admin_settings_updated', 'Veeqo operational resource mappings were updated.', [
			'operator_id'       => get_current_user_id(),
			'locked'            => $locked,
			'channel_id'        => absint( $readiness['channel_id'] ?? 0 ),
			'warehouse_id'      => absint( $readiness['warehouse_id'] ?? 0 ),
			'delivery_method_id'=> absint( $readiness['delivery_method_id'] ?? 0 ),
		] );
	}

	return [
		'saved'     => true,
		'locked'    => $locked,
		'readiness' => $readiness,
		'resources' => function_exists( 'dtb_veeqo_admin_resources' ) ? dtb_veeqo_admin_resources( false ) : [],
	];
}

/** Queue the canonical inventory reconciler in dry-run or write mode. */
function dtb_veeqo_admin_queue_reconciliation( bool $dry_run ) {
	$readiness = function_exists( 'dtb_veeqo_inventory_readiness' ) ? dtb_veeqo_inventory_readiness() : [ 'ready' => false, 'missing' => [ 'inventory_projection' ] ];
	if ( empty( $readiness['ready'] ) ) {
		return new WP_Error( 'veeqo_inventory_not_ready', 'Veeqo inventory projection is not ready.', [ 'status' => 503 ] );
	}
	if ( ! function_exists( 'as_enqueue_async_action' ) || ! defined( 'DTB_VEEQO_INVENTORY_RECONCILE_HOOK' ) ) {
		return new WP_Error( 'action_scheduler_unavailable', 'Action Scheduler is unavailable.', [ 'status' => 503 ] );
	}
	$args    = [ 0, 1, [], $dry_run ];
	$already = function_exists( 'as_has_scheduled_action' )
		? as_has_scheduled_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, $args, DTB_VEEQO_INVENTORY_ACTION_GROUP )
		: false;
	if ( $already ) {
		return [ 'queued' => true, 'status' => 'already_queued', 'dry_run' => $dry_run, 'action_id' => absint( $already ) ];
	}
	$action_id = as_enqueue_async_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, $args, DTB_VEEQO_INVENTORY_ACTION_GROUP, true );
	if ( empty( $action_id ) ) {
		return new WP_Error( 'veeqo_reconcile_queue_failed', 'Veeqo inventory reconciliation could not be queued.', [ 'status' => 503 ] );
	}
	if ( function_exists( 'dtb_veeqo_log' ) ) {
		dtb_veeqo_log( 'info', 'admin_reconciliation_queued', 'Veeqo inventory reconciliation was queued from the control center.', [
			'action_id'   => absint( $action_id ),
			'dry_run'     => $dry_run,
			'operator_id' => get_current_user_id(),
		] );
	}
	return [ 'queued' => true, 'status' => 'queued', 'dry_run' => $dry_run, 'action_id' => absint( $action_id ) ];
}
