<?php
declare(strict_types=1);

/** Replaces the repair Veeqo stub with canonical linked-order synchronization. */
defined( 'ABSPATH' ) || exit;

remove_action( 'dtb_repair_sync_veeqo', 'dtb_repair_job_sync_veeqo', 10 );
add_action( 'dtb_repair_sync_veeqo', 'dtb_repair_job_sync_veeqo_integrated', 10, 2 );

function dtb_repair_job_sync_veeqo_integrated( int $repair_id, array $args = [] ): void {
	$action   = sanitize_key( (string) ( $args['action'] ?? 'sync_order' ) );
	$order_id = absint( get_post_meta( $repair_id, '_repair_wc_order_id', true ) );
	$order    = $order_id > 0 && function_exists( 'wc_get_order' ) ? wc_get_order( $order_id ) : null;

	try {
		if ( ! $order instanceof WC_Order ) {
			throw new RuntimeException( 'Repair is not linked to a WooCommerce order.' );
		}
		if ( ! function_exists( 'dtb_veeqo_enabled' ) || ! dtb_veeqo_enabled() ) {
			throw new RuntimeException( 'Veeqo integration is not configured.' );
		}

		if ( in_array( $action, [ 'refresh', 'refresh_fulfillment' ], true ) ) {
			$veeqo_order_id = absint( $order->get_meta( '_dtb_veeqo_order_id', true ) ?: $order->get_meta( '_veeqo_order_id', true ) );
			if ( $veeqo_order_id <= 0 ) {
				throw new RuntimeException( 'Repair order has not been projected to Veeqo.' );
			}
			dtb_veeqo_start_order_reconciliation( $order_id, 0 );
			dtb_repair_veeqo_mark_synced( $repair_id, $order_id, $veeqo_order_id, $action, 'refresh_queued' );
			return;
		}

		if ( 'cancel' === $action ) {
			$veeqo_order_id = absint( $order->get_meta( '_dtb_veeqo_order_id', true ) ?: $order->get_meta( '_veeqo_order_id', true ) );
			if ( $veeqo_order_id <= 0 || ! function_exists( 'dtb_order_enqueue_job' ) ) {
				throw new RuntimeException( 'Repair order cannot be cancelled in Veeqo before provider projection.' );
			}
			dtb_order_enqueue_job( 'dtb_order_sync_veeqo_status', $order_id, [
				'trigger'        => 'repair_cancelled',
				'veeqo_order_id' => $veeqo_order_id,
				'veeqo_status'   => 'cancelled',
			] );
			dtb_repair_veeqo_mark_synced( $repair_id, $order_id, $veeqo_order_id, $action, 'cancel_queued' );
			return;
		}

		if ( ! function_exists( 'dtb_veeqo_sync_order' ) ) {
			throw new RuntimeException( 'Canonical Veeqo order synchronization contract is unavailable.' );
		}
		if ( ! dtb_repair_order_has_fulfillable_lines( $order ) ) {
			throw new RuntimeException( 'Repair order has no SKU-backed product lines to reserve or fulfill in Veeqo.' );
		}

		$result = dtb_veeqo_sync_order( $order_id, $order );
		$status = sanitize_key( (string) ( $result['status'] ?? '' ) );
		if ( ! in_array( $status, [ 'created', 'updated', 'synced', 'already_synced' ], true ) ) {
			throw new RuntimeException( (string) ( $result['message'] ?? 'Repair order Veeqo synchronization failed.' ) );
		}
		$veeqo_order_id = absint( $result['veeqo_order_id'] ?? $result['order_id'] ?? $order->get_meta( '_dtb_veeqo_order_id', true ) );
		if ( $veeqo_order_id <= 0 ) {
			throw new RuntimeException( 'Veeqo synchronization completed without a provider order ID.' );
		}

		update_post_meta( $repair_id, '_repair_veeqo_order_id', $veeqo_order_id );
		dtb_repair_veeqo_mark_synced( $repair_id, $order_id, $veeqo_order_id, $action, $status );
		dtb_veeqo_start_order_reconciliation( $order_id, 15 );
	} catch ( Throwable $exception ) {
		$error = sanitize_text_field( $exception->getMessage() );
		update_post_meta( $repair_id, '_repair_veeqo_sync_status', 'error' );
		if ( function_exists( 'dtb_update_repair_integration_state' ) ) {
			dtb_update_repair_integration_state( $repair_id, 'veeqo', [
				'state'           => 'error',
				'last_error_code' => $error,
				'last_error_at'   => gmdate( 'c' ),
			] );
		}
		$error_marker = hash( 'sha256', $action . '|' . $order_id . '|' . $error );
		if ( $error_marker !== (string) get_post_meta( $repair_id, '_repair_veeqo_error_marker', true ) ) {
			update_post_meta( $repair_id, '_repair_veeqo_error_marker', $error_marker );
			if ( function_exists( 'dtb_repair_append_event' ) ) {
				dtb_repair_append_event( $repair_id, 'integration.veeqo.failed', [
					'visibility' => 'operator',
					'payload'    => [ 'action' => $action, 'order_id' => $order_id ?: null, 'error' => $error ],
				] );
			}
		}
		if ( function_exists( 'dtb_repair_retry_job' ) ) {
			dtb_repair_retry_job( 'dtb_repair_sync_veeqo', $repair_id, $args );
		}
	}
}

function dtb_repair_order_has_fulfillable_lines( WC_Order $order ): bool {
	foreach ( $order->get_items( 'line_item' ) as $item ) {
		if ( ! $item instanceof WC_Order_Item_Product ) {
			continue;
		}
		$product = $item->get_product();
		if ( $product instanceof WC_Product && '' !== trim( (string) $product->get_sku() ) ) {
			return true;
		}
	}
	return false;
}

function dtb_repair_veeqo_mark_synced( int $repair_id, int $order_id, int $veeqo_order_id, string $action, string $status ): void {
	$marker = hash( 'sha256', $action . '|' . $order_id . '|' . $veeqo_order_id . '|' . $status );
	$event_required = ! hash_equals( (string) get_post_meta( $repair_id, '_repair_veeqo_sync_marker', true ) ?: str_repeat( '0', 64 ), $marker );

	update_post_meta( $repair_id, '_repair_veeqo_sync_status', $status );
	update_post_meta( $repair_id, '_repair_veeqo_order_id', $veeqo_order_id );
	update_post_meta( $repair_id, '_repair_veeqo_sync_marker', $marker );
	delete_post_meta( $repair_id, '_repair_veeqo_error_marker' );
	if ( function_exists( 'dtb_update_repair_integration_state' ) ) {
		dtb_update_repair_integration_state( $repair_id, 'veeqo', [
			'state'           => 'synced',
			'order_id'        => $veeqo_order_id,
			'last_success_at' => gmdate( 'c' ),
			'last_error_code' => null,
		] );
	}
	if ( $event_required && function_exists( 'dtb_repair_append_event' ) ) {
		dtb_repair_append_event( $repair_id, 'integration.veeqo.synced', [
			'visibility' => 'operator',
			'payload'    => [
				'action'         => $action,
				'status'         => $status,
				'order_id'       => $order_id,
				'veeqo_order_id' => $veeqo_order_id,
			],
		] );
	}
}
