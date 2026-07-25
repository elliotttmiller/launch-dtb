<?php
declare(strict_types=1);

/** Routes accepted Veeqo webhook records through the canonical state projector. */
defined( 'ABSPATH' ) || exit;

remove_action( 'dtb_order_process_veeqo_webhook', 'dtb_operational_pipeline_process_veeqo_webhook', 10 );
add_action( 'dtb_order_process_veeqo_webhook', 'dtb_operational_pipeline_process_veeqo_webhook_projected', 10, 2 );

function dtb_operational_pipeline_process_veeqo_webhook_projected( int $order_id, array $args = [] ): void {
	$event_hash = sanitize_key( (string) ( $args['ingress_hash'] ?? '' ) );
	if ( '' === $event_hash ) {
		return;
	}
	$ingress_key = 'dtb_veeqo_webhook_ingress_' . $event_hash;
	$record      = get_option( $ingress_key, [] );
	if ( ! is_array( $record ) || 'done' === (string) ( $record['status'] ?? '' ) ) {
		return;
	}
	$claim_key = $ingress_key . '_processing';
	if ( ! add_option( $claim_key, gmdate( 'c' ), '', 'no' ) ) {
		return;
	}

	try {
		$order = function_exists( 'wc_get_order' ) ? wc_get_order( $order_id ) : null;
		if ( ! $order instanceof WC_Order ) {
			$record['status'] = 'quarantined';
			$record['result'] = 'order_not_found';
			update_option( $ingress_key, $record, false );
			return;
		}
		if ( ! class_exists( 'DTB_Veeqo_Order_State_Projector' ) ) {
			$record['status'] = 'queue_failed';
			$record['result'] = 'projector_unavailable';
			update_option( $ingress_key, $record, false );
			throw new RuntimeException( 'Veeqo state projector is unavailable.' );
		}

		$payload = is_array( $record['payload'] ?? null ) ? $record['payload'] : [];
		if ( absint( $record['veeqo_order_id'] ?? 0 ) > 0 && empty( $payload['id'] ) && empty( $payload['order_id'] ) ) {
			$payload['id'] = absint( $record['veeqo_order_id'] );
		}
		$projection = DTB_Veeqo_Order_State_Projector::apply( $order, $payload, 'veeqo_webhook', $event_hash );
		$record['status']       = 'done';
		$record['result']       = sanitize_key( (string) ( $projection['status'] ?? 'processed' ) );
		$record['processed_at'] = gmdate( 'c' );
		$record['projection']   = [
			'provider_status' => sanitize_key( (string) ( $projection['provider_status'] ?? '' ) ),
			'wc_status'       => sanitize_key( (string) ( $projection['wc_status'] ?? '' ) ),
			'terminal'        => ! empty( $projection['terminal'] ),
		];
		update_option( $ingress_key, $record, false );
		if ( function_exists( 'dtb_veeqo_log_sync_timestamp' ) ) {
			dtb_veeqo_log_sync_timestamp( 'order_webhook' );
		}
	} finally {
		delete_option( $claim_key );
	}
}
