<?php
declare(strict_types=1);

/** DTB Order Event Stream — customer-safe SSE frame builder. */
defined( 'ABSPATH' ) || exit;

function dtb_order_build_sse_frame( int $order_id ): ?array {
	$projection  = dtb_order_get_tracking_projection( $order_id );
	$status_proj = $projection ? dtb_order_build_status_projection( $order_id ) : null;
	if ( ! $projection || ! $status_proj ) {
		return null;
	}
	$last_event = function_exists( 'dtb_order_get_last_event' ) ? dtb_order_get_last_event( $order_id ) : null;
	$revision   = $last_event && isset( $last_event->id ) ? (int) $last_event->id : 0;

	return [
		'id'                 => $revision,
		'type'               => ! empty( $status_proj['is_terminal'] ) ? 'order.terminal' : 'order.status_changed',
		'status'             => $status_proj['status'],
		'label'              => $status_proj['label'],
		'wc_status'          => $status_proj['wc_status'],
		'fulfillment_state'  => $status_proj['fulfillment_substate'],
		'occurred_at'        => current_time( 'c', true ),
		'is_terminal'        => (bool) $status_proj['is_terminal'],
		'tracking_number'    => $projection['tracking_number'] ?? null,
		'carrier'            => $projection['carrier'] ?? null,
		'tracking_url'       => $projection['tracking_url'] ?? null,
		'estimated_delivery' => $projection['estimated_delivery'] ?? null,
		'timeline'           => $projection['timeline'],
	];
}

function dtb_order_sse_frame_revision( array $frame ): string {
	return hash( 'sha256', wp_json_encode( [
		'id'                 => $frame['id'] ?? 0,
		'status'             => $frame['status'] ?? '',
		'fulfillment_state'  => $frame['fulfillment_state'] ?? '',
		'tracking_number'    => $frame['tracking_number'] ?? '',
		'carrier'            => $frame['carrier'] ?? '',
		'estimated_delivery' => $frame['estimated_delivery'] ?? '',
		'timeline'           => $frame['timeline'] ?? [],
	] ) ?: '' );
}
