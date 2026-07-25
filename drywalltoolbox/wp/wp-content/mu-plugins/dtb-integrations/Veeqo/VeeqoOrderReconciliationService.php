<?php
declare(strict_types=1);

/** Near-real-time Veeqo order reconciliation and recovery scheduling. */
defined( 'ABSPATH' ) || exit;

if ( ! defined( 'DTB_VEEQO_ORDER_RECONCILE_MAX_AGE' ) ) {
	define( 'DTB_VEEQO_ORDER_RECONCILE_MAX_AGE', 14 * DAY_IN_SECONDS );
}

add_action( 'dtb_order_refresh_veeqo_projection', 'dtb_veeqo_refresh_order_projection_job', 10, 2 );
add_action( 'dtb_veeqo_reconcile_active_orders', 'dtb_veeqo_reconcile_active_orders' );
add_action( 'init', 'dtb_veeqo_schedule_order_reconciliation_recovery', 40 );

function dtb_veeqo_start_order_reconciliation( int $order_id, int $delay = 15 ): string|int|false {
	if ( $order_id <= 0 || ! function_exists( 'dtb_order_enqueue_job' ) ) {
		return false;
	}
	$started_at = absint( get_post_meta( $order_id, '_dtb_veeqo_poll_started_at', true ) );
	if ( $started_at <= 0 ) {
		$started_at = time();
		update_post_meta( $order_id, '_dtb_veeqo_poll_started_at', $started_at );
	}
	return dtb_order_enqueue_job( 'dtb_order_refresh_veeqo_projection', $order_id, [
		'started_at' => $started_at,
		'trigger'    => 'veeqo_order_created',
	], max( 0, $delay ) );
}

function dtb_veeqo_refresh_order_projection_job( int $order_id, array $args = [] ): void {
	$order = function_exists( 'wc_get_order' ) ? wc_get_order( $order_id ) : null;
	if ( ! $order instanceof WC_Order ) {
		return;
	}
	if ( function_exists( 'dtb_order_write_boundary_order_should_skip_side_effects' ) && dtb_order_write_boundary_order_should_skip_side_effects( $order ) ) {
		return;
	}
	$veeqo_order_id = absint( $order->get_meta( '_dtb_veeqo_order_id', true ) ?: $order->get_meta( '_veeqo_order_id', true ) );
	if ( $veeqo_order_id <= 0 || ! function_exists( 'dtb_veeqo_request' ) || ! class_exists( 'DTB_Veeqo_Order_State_Projector' ) ) {
		return;
	}

	$started_at = absint( $args['started_at'] ?? get_post_meta( $order_id, '_dtb_veeqo_poll_started_at', true ) );
	if ( $started_at <= 0 ) {
		$started_at = time();
		update_post_meta( $order_id, '_dtb_veeqo_poll_started_at', $started_at );
	}
	if ( time() - $started_at > (int) DTB_VEEQO_ORDER_RECONCILE_MAX_AGE ) {
		update_post_meta( $order_id, '_dtb_veeqo_poll_state', 'expired' );
		return;
	}

	$result = dtb_veeqo_request( 'GET', '/orders/' . $veeqo_order_id );
	update_post_meta( $order_id, '_dtb_veeqo_last_pull_at', gmdate( 'c' ) );
	if ( empty( $result['ok'] ) ) {
		$error = sanitize_text_field( (string) ( $result['error'] ?? 'Veeqo order refresh failed.' ) );
		update_post_meta( $order_id, '_dtb_veeqo_poll_state', 'error' );
		update_post_meta( $order_id, '_dtb_veeqo_poll_error', substr( $error, 0, 1000 ) );
		if ( function_exists( 'dtb_order_update_integration_state' ) ) {
			dtb_order_update_integration_state( $order_id, 'veeqo', [
				'status'        => 'refresh_failed',
				'error'         => $error,
				'retryable'     => true,
				'last_error_at' => current_time( 'mysql', true ),
			] );
		}
		if ( function_exists( 'dtb_order_retry_job' ) ) {
			dtb_order_retry_job( 'dtb_order_refresh_veeqo_projection', $order_id, $args );
		}
		return;
	}

	$payload = is_array( $result['data'] ?? null ) ? $result['data'] : [];
	$projection = DTB_Veeqo_Order_State_Projector::apply(
		$order,
		$payload,
		'veeqo_pull',
		'order:' . $veeqo_order_id . ':' . hash( 'sha256', wp_json_encode( $payload ) ?: '' )
	);
	update_post_meta( $order_id, '_dtb_veeqo_poll_state', ! empty( $projection['terminal'] ) ? 'complete' : 'active' );
	delete_post_meta( $order_id, '_dtb_veeqo_poll_error' );

	if ( empty( $projection['terminal'] ) && function_exists( 'dtb_order_enqueue_job' ) ) {
		$age   = max( 0, time() - $started_at );
		$delay = $age < 10 * MINUTE_IN_SECONDS ? 15 : ( $age < 2 * HOUR_IN_SECONDS ? 60 : 5 * MINUTE_IN_SECONDS );
		dtb_order_enqueue_job( 'dtb_order_refresh_veeqo_projection', $order_id, [
			'started_at' => $started_at,
			'trigger'    => 'adaptive_reconcile',
		], $delay );
	}
}

function dtb_veeqo_schedule_order_reconciliation_recovery(): void {
	if ( function_exists( 'as_next_scheduled_action' ) && false !== as_next_scheduled_action( 'dtb_veeqo_reconcile_active_orders', [], 'dtb-integrations' ) ) {
		return;
	}
	if ( function_exists( 'as_schedule_recurring_action' ) ) {
		as_schedule_recurring_action( time() + 60, 5 * MINUTE_IN_SECONDS, 'dtb_veeqo_reconcile_active_orders', [], 'dtb-integrations' );
	}
}

function dtb_veeqo_reconcile_active_orders(): void {
	if ( ! function_exists( 'wc_get_orders' ) || ! function_exists( 'dtb_order_enqueue_job' ) ) {
		return;
	}
	$orders = wc_get_orders( [
		'status'     => [ 'processing', 'on-hold' ],
		'limit'      => 50,
		'return'     => 'objects',
		'orderby'    => 'modified',
		'order'      => 'ASC',
		'meta_query' => [
			'relation' => 'OR',
			[ 'key' => '_dtb_veeqo_order_id', 'compare' => 'EXISTS' ],
			[ 'key' => '_veeqo_order_id', 'compare' => 'EXISTS' ],
		],
	] );
	foreach ( $orders as $order ) {
		if ( ! $order instanceof WC_Order ) {
			continue;
		}
		$last_pull = strtotime( (string) $order->get_meta( '_dtb_veeqo_last_pull_at', true ) ) ?: 0;
		if ( $last_pull > time() - 5 * MINUTE_IN_SECONDS ) {
			continue;
		}
		$started_at = absint( $order->get_meta( '_dtb_veeqo_poll_started_at', true ) ) ?: time();
		dtb_order_enqueue_job( 'dtb_order_refresh_veeqo_projection', (int) $order->get_id(), [
			'started_at' => $started_at,
			'trigger'    => 'recovery_sweep',
		] );
	}
}
