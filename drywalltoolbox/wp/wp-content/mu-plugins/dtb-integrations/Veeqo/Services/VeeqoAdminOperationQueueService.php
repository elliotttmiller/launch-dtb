<?php
/**
 * Veeqo admin operation queue and idempotency service.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/** Sanitize the payload persisted for one operation type. */
function dtb_veeqo_admin_operation_payload( string $type, array $payload ) {
	if ( 'stock_adjustment' === $type ) {
		$sellable_id  = absint( $payload['sellable_id'] ?? 0 );
		$warehouse_id = absint( $payload['warehouse_id'] ?? 0 );
		$physical     = $payload['physical_stock_level'] ?? null;
		if ( $sellable_id <= 0 || $warehouse_id <= 0 || ! is_numeric( $physical ) || (float) $physical < 0 ) {
			return new WP_Error( 'invalid_stock_adjustment', 'Sellable, warehouse, and a nonnegative physical stock level are required.', [ 'status' => 400 ] );
		}
		$reason = substr( sanitize_textarea_field( (string) ( $payload['reason'] ?? '' ) ), 0, 500 );
		if ( '' === trim( $reason ) ) {
			return new WP_Error( 'stock_adjustment_reason_required', 'An operational reason is required for a stock adjustment.', [ 'status' => 400 ] );
		}
		return [
			'sellable_id'          => $sellable_id,
			'warehouse_id'         => $warehouse_id,
			'physical_stock_level' => (float) $physical,
			'infinite'             => rest_sanitize_boolean( $payload['infinite'] ?? false ),
			'location'             => substr( sanitize_text_field( (string) ( $payload['location'] ?? '' ) ), 0, 191 ),
			'expected_updated_at'  => sanitize_text_field( (string) ( $payload['expected_updated_at'] ?? '' ) ),
			'reason'               => $reason,
		];
	}

	if ( 'shipment' === $type ) {
		$order_id      = absint( $payload['order_id'] ?? 0 );
		$allocation_id = absint( $payload['allocation_id'] ?? 0 );
		$carrier_id    = absint( $payload['carrier_id'] ?? 0 );
		if ( $order_id <= 0 || $allocation_id <= 0 || $carrier_id <= 0 ) {
			return new WP_Error( 'invalid_shipment', 'Order, allocation, and carrier IDs are required.', [ 'status' => 400 ] );
		}
		$reason = substr( sanitize_textarea_field( (string) ( $payload['reason'] ?? '' ) ), 0, 500 );
		if ( '' === trim( $reason ) ) {
			return new WP_Error( 'shipment_reason_required', 'An operational reason is required to record a shipment.', [ 'status' => 400 ] );
		}
		return [
			'order_id'            => $order_id,
			'allocation_id'       => $allocation_id,
			'carrier_id'          => $carrier_id,
			'tracking_number'     => substr( sanitize_text_field( (string) ( $payload['tracking_number'] ?? '' ) ), 0, 191 ),
			'notify_customer'     => rest_sanitize_boolean( $payload['notify_customer'] ?? false ),
			'update_remote_order' => rest_sanitize_boolean( $payload['update_remote_order'] ?? false ),
			'reason'              => $reason,
		];
	}

	return new WP_Error( 'unsupported_veeqo_operation', 'Unsupported Veeqo operation type.', [ 'status' => 400 ] );
}

/** Create or return one idempotent queued admin operation. */
function dtb_veeqo_admin_operation_enqueue( string $type, array $payload, string $request_id ) {
	if ( ! function_exists( 'as_enqueue_async_action' ) ) {
		return new WP_Error( 'action_scheduler_unavailable', 'Action Scheduler is unavailable.', [ 'status' => 503 ] );
	}
	$request_id = sanitize_key( $request_id );
	if ( '' === $request_id || strlen( $request_id ) > 64 ) {
		return new WP_Error( 'invalid_request_id', 'A stable request ID is required.', [ 'status' => 400 ] );
	}
	$clean_payload = dtb_veeqo_admin_operation_payload( $type, $payload );
	if ( is_wp_error( $clean_payload ) ) {
		return $clean_payload;
	}

	$request_hash = md5( $request_id );
	$idem_option  = DTB_VEEQO_ADMIN_OPERATION_IDEM_PREFIX . $request_hash;
	$operation_id = sanitize_key( wp_generate_uuid4() );
	if ( ! add_option( $idem_option, $operation_id, '', 'no' ) ) {
		$existing_id = sanitize_key( (string) get_option( $idem_option, '' ) );
		$existing    = dtb_veeqo_admin_operation_get( $existing_id );
		return ! empty( $existing ) ? $existing : new WP_Error( 'veeqo_operation_claimed', 'This request is already claimed.', [ 'status' => 409 ] );
	}

	$target = 'stock_adjustment' === $type
		? sprintf( 'sellable:%d:warehouse:%d', $clean_payload['sellable_id'], $clean_payload['warehouse_id'] )
		: sprintf( 'order:%d:allocation:%d', $clean_payload['order_id'], $clean_payload['allocation_id'] );
	$operation = [
		'operation_id' => $operation_id,
		'request_hash' => $request_hash,
		'type'         => $type,
		'target'       => $target,
		'payload'      => $clean_payload,
		'status'       => 'queued',
		'attempt'      => 0,
		'created_at'   => gmdate( 'c' ),
		'created_by'   => get_current_user_id(),
		'action_id'    => 0,
		'result'       => null,
		'error'        => '',
	];
	dtb_veeqo_admin_operation_save( $operation );

	$action_id = as_enqueue_async_action(
		DTB_VEEQO_ADMIN_OPERATION_HOOK,
		[ $operation_id, 0 ],
		defined( 'DTB_VEEQO_INVENTORY_ACTION_GROUP' ) ? DTB_VEEQO_INVENTORY_ACTION_GROUP : 'dtb-integrations',
		true
	);
	if ( empty( $action_id ) ) {
		$operation['status']       = 'failed';
		$operation['error']        = 'Action Scheduler did not return an action ID.';
		$operation['completed_at'] = gmdate( 'c' );
		dtb_veeqo_admin_operation_save( $operation );
		return new WP_Error( 'veeqo_admin_operation_queue_failed', $operation['error'], [ 'status' => 503 ] );
	}
	$operation['action_id'] = absint( $action_id );
	dtb_veeqo_admin_operation_save( $operation );

	if ( function_exists( 'dtb_veeqo_log' ) ) {
		dtb_veeqo_log( 'info', 'admin_operation_queued', 'Veeqo admin operation queued.', [
			'operation_id' => $operation_id,
			'type'         => $type,
			'target'       => $target,
			'action_id'    => absint( $action_id ),
			'operator_id'  => get_current_user_id(),
		] );
	}
	return $operation;
}
