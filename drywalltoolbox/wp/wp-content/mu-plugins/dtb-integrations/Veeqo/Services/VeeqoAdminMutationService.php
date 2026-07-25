<?php
/**
 * Veeqo admin mutation executors.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/** Convert a failed client response into a WP_Error without exposing response payloads. */
function dtb_veeqo_admin_client_error( string $code, array $result, string $fallback ): WP_Error {
	return new WP_Error(
		$code,
		sanitize_text_field( (string) ( $result['error'] ?? $fallback ) ),
		[ 'status' => max( 400, (int) ( $result['status'] ?? 502 ) ) ]
	);
}

/** Apply one stock adjustment through the official stock-entry endpoint. */
function dtb_veeqo_admin_execute_stock_adjustment( array $payload ) {
	if ( ! function_exists( 'dtb_veeqo_request' ) ) {
		return new WP_Error( 'veeqo_client_unavailable', 'Veeqo client is unavailable.', [ 'status' => 503 ] );
	}
	$target = sprintf( 'stock:%d:%d', $payload['sellable_id'], $payload['warehouse_id'] );
	$lock   = dtb_veeqo_admin_acquire_target_lock( $target );
	if ( empty( $lock ) ) {
		return new WP_Error( 'stock_adjustment_locked', 'Another stock adjustment is running for this sellable and warehouse.', [ 'status' => 409 ] );
	}
	$path = sprintf( '/sellables/%d/warehouses/%d/stock_entry', $payload['sellable_id'], $payload['warehouse_id'] );
	try {
		$current = dtb_veeqo_request( 'GET', $path );
		if ( empty( $current['ok'] ) || ! is_array( $current['data'] ?? null ) ) {
			return dtb_veeqo_admin_client_error( 'stock_entry_read_failed', $current, 'Unable to read the current Veeqo stock entry.' );
		}
		$expected = (string) ( $payload['expected_updated_at'] ?? '' );
		$actual   = sanitize_text_field( (string) ( $current['data']['updated_at'] ?? '' ) );
		if ( '' !== $expected && '' !== $actual && ! hash_equals( $expected, $actual ) ) {
			return new WP_Error( 'stock_entry_conflict', 'Veeqo stock changed after this row was loaded. Refresh before applying an adjustment.', [ 'status' => 409 ] );
		}
		$body = [
			'stock_entry' => [
				'physical_stock_level' => (float) $payload['physical_stock_level'],
				'infinite'             => ! empty( $payload['infinite'] ),
				'location'             => (string) $payload['location'],
			],
		];
		$updated = dtb_veeqo_request( 'PUT', $path, [], $body );
		if ( empty( $updated['ok'] ) || ! is_array( $updated['data'] ?? null ) ) {
			return dtb_veeqo_admin_client_error( 'stock_entry_update_failed', $updated, 'Veeqo stock adjustment failed.' );
		}
		dtb_veeqo_admin_cache_flush();
		if ( function_exists( 'as_enqueue_async_action' ) && defined( 'DTB_VEEQO_INVENTORY_RECONCILE_HOOK' ) ) {
			$already = function_exists( 'as_has_scheduled_action' )
				? as_has_scheduled_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP )
				: false;
			if ( ! $already ) {
				as_enqueue_async_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP, true );
			}
		}
		$data = $updated['data'];
		return [
			'updated'         => true,
			'sellable_id'     => absint( $data['sellable_id'] ?? $payload['sellable_id'] ),
			'warehouse_id'    => absint( $data['warehouse_id'] ?? $payload['warehouse_id'] ),
			'physical_stock'  => is_numeric( $data['physical_stock_level'] ?? null ) ? (float) $data['physical_stock_level'] : null,
			'available_stock' => is_numeric( $data['available_stock_level'] ?? null ) ? (float) $data['available_stock_level'] : null,
			'infinite'        => ! empty( $data['infinite'] ),
			'location'        => sanitize_text_field( (string) ( $data['location'] ?? '' ) ),
			'updated_at'      => sanitize_text_field( (string) ( $data['updated_at'] ?? '' ) ),
		];
	} finally {
		dtb_veeqo_admin_release_target_lock( $lock );
	}
}

/** Record a shipment against an existing Veeqo allocation. */
function dtb_veeqo_admin_execute_shipment( array $payload ) {
	if ( ! function_exists( 'dtb_veeqo_request' ) ) {
		return new WP_Error( 'veeqo_client_unavailable', 'Veeqo client is unavailable.', [ 'status' => 503 ] );
	}
	$target = sprintf( 'shipment:%d:%d', $payload['order_id'], $payload['allocation_id'] );
	$lock   = dtb_veeqo_admin_acquire_target_lock( $target );
	if ( empty( $lock ) ) {
		return new WP_Error( 'shipment_locked', 'Another shipment operation is running for this allocation.', [ 'status' => 409 ] );
	}
	try {
		$order_result = dtb_veeqo_request( 'GET', '/orders/' . $payload['order_id'] );
		if ( empty( $order_result['ok'] ) || ! is_array( $order_result['data'] ?? null ) ) {
			return dtb_veeqo_admin_client_error( 'shipment_order_read_failed', $order_result, 'Unable to read the Veeqo order.' );
		}
		$allocation = null;
		foreach ( (array) ( $order_result['data']['allocations'] ?? [] ) as $candidate ) {
			if ( is_array( $candidate ) && absint( $candidate['id'] ?? 0 ) === (int) $payload['allocation_id'] ) {
				$allocation = $candidate;
				break;
			}
		}
		if ( null === $allocation ) {
			return new WP_Error( 'allocation_not_found', 'The allocation does not belong to this Veeqo order.', [ 'status' => 409 ] );
		}
		$existing_shipment = is_array( $allocation['shipment'] ?? null ) ? $allocation['shipment'] : [];
		if ( ! empty( $existing_shipment ) ) {
			$existing_tracking = is_array( $existing_shipment['tracking_number'] ?? null )
				? (string) ( $existing_shipment['tracking_number']['tracking_number'] ?? '' )
				: (string) ( $existing_shipment['tracking_number'] ?? '' );
			if ( '' === $payload['tracking_number'] || hash_equals( trim( $existing_tracking ), trim( (string) $payload['tracking_number'] ) ) ) {
				return [
					'updated'         => false,
					'already_applied' => true,
					'order_id'        => (int) $payload['order_id'],
					'allocation_id'   => (int) $payload['allocation_id'],
					'shipment_id'     => absint( $existing_shipment['id'] ?? 0 ),
					'tracking_number' => sanitize_text_field( $existing_tracking ),
				];
			}
			return new WP_Error( 'allocation_already_shipped', 'This allocation already has a different shipment.', [ 'status' => 409 ] );
		}

		$shipment = [
			'carrier_id'          => (int) $payload['carrier_id'],
			'notify_customer'     => ! empty( $payload['notify_customer'] ),
			'update_remote_order' => ! empty( $payload['update_remote_order'] ),
		];
		if ( '' !== (string) $payload['tracking_number'] ) {
			$shipment['tracking_number_attributes'] = [ 'tracking_number' => (string) $payload['tracking_number'] ];
		}
		$created = dtb_veeqo_request(
			'POST',
			'/shipments',
			[],
			[
				'shipment'      => $shipment,
				'allocation_id' => (int) $payload['allocation_id'],
				'order_id'      => (int) $payload['order_id'],
			]
		);
		if ( empty( $created['ok'] ) || ! is_array( $created['data'] ?? null ) ) {
			return dtb_veeqo_admin_client_error( 'shipment_create_failed', $created, 'Veeqo shipment creation failed.' );
		}
		dtb_veeqo_admin_cache_flush();
		$data     = $created['data'];
		$tracking = is_array( $data['tracking_number'] ?? null )
			? (string) ( $data['tracking_number']['tracking_number'] ?? '' )
			: (string) ( $data['tracking_number'] ?? '' );
		return [
			'updated'         => true,
			'order_id'        => absint( $data['order_id'] ?? $payload['order_id'] ),
			'allocation_id'   => absint( $data['allocation_id'] ?? $payload['allocation_id'] ),
			'shipment_id'     => absint( $data['id'] ?? 0 ),
			'tracking_number' => sanitize_text_field( $tracking ),
			'carrier_id'      => absint( $data['carrier_id'] ?? $payload['carrier_id'] ),
			'carrier_name'    => sanitize_text_field( (string) ( $data['carrier']['name'] ?? '' ) ),
		];
	} finally {
		dtb_veeqo_admin_release_target_lock( $lock );
	}
}
