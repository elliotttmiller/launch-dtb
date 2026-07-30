<?php
/**
 * Veeqo order-status poller.
 *
 * Veeqo's public API has no webhook/events support (confirmed: the
 * developers.veeqo.com/api/ navigation has no webhooks section, and a 2023
 * Veeqo developer-forum thread explicitly states webhooks aren't supported).
 * A fully-built webhook *receiver* already exists in this codebase
 * (OperationalPipeline/VeeqoWebhookPipelineController.php) but is fail-closed
 * behind an auth contract Veeqo can never satisfy, since it never calls it —
 * that file is intentionally left untouched and inert.
 *
 * Instead, this file periodically asks Veeqo for the current status of
 * orders we already know are being fulfilled through Veeqo, and applies any
 * change via the shared VeeqoOrderStatusApplier.php.
 *
 * Scope is deliberately conservative: rather than inventing a "list orders
 * changed since X" mechanism (unverified whether Veeqo's list/filter/paging
 * capabilities support that), this polls only WooCommerce orders that are
 * (a) in a non-terminal, Veeqo-relevant status ('processing' or 'shipped')
 * and (b) already correlated to a Veeqo order id via post meta. That bounds
 * the work per run to orders we already know are in flight.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_VEEQO_ORDER_STATUS_POLL_HOOK          = 'dtb_veeqo_order_status_poll_recurring';
const DTB_VEEQO_ORDER_STATUS_POLL_ACTION_GROUP  = 'dtb-integrations-veeqo-order-status-poll';

// Every 5 minutes: short enough that a Veeqo-side "Shipped" click reaches the
// customer's WooCommerce order within a few minutes (the "few minutes, not
// instant" cadence the product decision settled on), long enough that a batch
// of up to DTB_VEEQO_ORDER_STATUS_POLL_BATCH_SIZE single-order GET requests
// per run stays gentle on the Veeqo API even if many orders are in flight.
const DTB_VEEQO_ORDER_STATUS_POLL_INTERVAL_SECONDS = 5 * MINUTE_IN_SECONDS;

// Cap on orders checked per run. If more candidates exist than this, the
// oldest-polled orders (by _dtb_veeqo_last_polled_at) are checked first, so
// no order is starved indefinitely across successive runs.
const DTB_VEEQO_ORDER_STATUS_POLL_BATCH_SIZE = 50;

/**
 * Register the recurring Action Scheduler trigger, mirroring the pattern in
 * VeeqoInventorySchedulePolicy.php: gated on readiness, deduplicated via
 * as_has_scheduled_action()/as_next_scheduled_action(), own hook + group so
 * it can never falsely dedupe against the inventory reconcile job.
 */
function dtb_veeqo_order_status_poll_schedule_recurring(): void {
	if ( ! function_exists( 'as_schedule_recurring_action' ) ) {
		return;
	}
	if ( ! function_exists( 'dtb_veeqo_production_readiness' ) || empty( dtb_veeqo_production_readiness()['ready'] ) ) {
		return;
	}
	$already = function_exists( 'as_has_scheduled_action' )
		? as_has_scheduled_action( DTB_VEEQO_ORDER_STATUS_POLL_HOOK, [], DTB_VEEQO_ORDER_STATUS_POLL_ACTION_GROUP )
		: ( function_exists( 'as_next_scheduled_action' ) && false !== as_next_scheduled_action( DTB_VEEQO_ORDER_STATUS_POLL_HOOK, [], DTB_VEEQO_ORDER_STATUS_POLL_ACTION_GROUP ) );
	if ( ! $already ) {
		as_schedule_recurring_action(
			time() + MINUTE_IN_SECONDS,
			DTB_VEEQO_ORDER_STATUS_POLL_INTERVAL_SECONDS,
			DTB_VEEQO_ORDER_STATUS_POLL_HOOK,
			[],
			DTB_VEEQO_ORDER_STATUS_POLL_ACTION_GROUP,
			true
		);
	}
}
add_action( 'init', 'dtb_veeqo_order_status_poll_schedule_recurring', 40 );

add_action( DTB_VEEQO_ORDER_STATUS_POLL_HOOK, 'dtb_veeqo_order_status_poll_run', 10, 0 );

/**
 * Return the Veeqo order id correlated to a WooCommerce order, if any.
 */
function dtb_veeqo_order_status_poll_correlated_veeqo_id( WC_Order $order ): int {
	$id = absint( $order->get_meta( '_dtb_veeqo_order_id', true ) );
	if ( $id > 0 ) {
		return $id;
	}
	return absint( $order->get_meta( '_veeqo_order_id', true ) );
}

/**
 * Find WooCommerce orders that are still non-terminal and Veeqo-correlated,
 * oldest-polled first, capped at $limit.
 *
 * @param int $limit Maximum orders to return.
 * @return WC_Order[]
 */
function dtb_veeqo_order_status_poll_candidate_orders( int $limit ): array {
	if ( $limit <= 0 || ! function_exists( 'wc_get_orders' ) ) {
		return [];
	}

	// Pull a wider candidate window than $limit so we can sort by "oldest
	// polled first" in PHP (including orders never polled) without relying
	// on WooCommerce's meta-based ORDER BY across an optional meta key.
	$candidate_ceiling = max( $limit * 10, 200 );

	$orders = wc_get_orders( [
		'status'     => [ 'processing', 'shipped' ],
		'limit'      => $candidate_ceiling,
		'return'     => 'objects',
		'orderby'    => 'date',
		'order'      => 'ASC',
		'meta_query' => [
			'relation' => 'OR',
			[ 'key' => '_dtb_veeqo_order_id', 'compare' => 'EXISTS' ],
			[ 'key' => '_veeqo_order_id', 'compare' => 'EXISTS' ],
		],
	] );

	if ( ! is_array( $orders ) || empty( $orders ) ) {
		return [];
	}

	usort(
		$orders,
		static function ( $a, $b ): int {
			$a_ts = $a instanceof WC_Order ? absint( $a->get_meta( '_dtb_veeqo_last_polled_at', true ) ) : PHP_INT_MAX;
			$b_ts = $b instanceof WC_Order ? absint( $b->get_meta( '_dtb_veeqo_last_polled_at', true ) ) : PHP_INT_MAX;
			return $a_ts <=> $b_ts;
		}
	);

	return array_slice( $orders, 0, $limit );
}

/**
 * Best-effort extraction of tracking info from a Veeqo order payload.
 *
 * The exact nesting of shipment/tracking data under `GET /orders/{id}` was
 * not fully confirmed from available docs (the order resource references
 * `allocations[].shipment`, shown as null in the example response, with full
 * tracking detail living behind a separate tracking_events endpoint keyed by
 * shipment id). This extraction is therefore deliberately defensive and
 * best-effort: it only ever enriches tracking meta when a value is present
 * in an expected shape, and never fails or blocks the status update itself
 * if the shape differs from what's anticipated here.
 *
 * @param array $data Veeqo order payload (decoded JSON body).
 * @return array{tracking_number:string,tracking_carrier:string}
 */
function dtb_veeqo_order_status_poll_extract_tracking( array $data ): array {
	$number  = '';
	$carrier = '';

	if ( ! empty( $data['tracking_number'] ) && is_string( $data['tracking_number'] ) ) {
		$number = $data['tracking_number'];
	}
	if ( ! empty( $data['carrier'] ) && is_string( $data['carrier'] ) ) {
		$carrier = $data['carrier'];
	}

	if ( '' === $number && ! empty( $data['allocations'] ) && is_array( $data['allocations'] ) ) {
		foreach ( $data['allocations'] as $allocation ) {
			if ( ! is_array( $allocation ) || empty( $allocation['shipment'] ) || ! is_array( $allocation['shipment'] ) ) {
				continue;
			}
			$shipment = $allocation['shipment'];

			$tracking_field = $shipment['tracking_number'] ?? null;
			if ( is_array( $tracking_field ) ) {
				$number = (string) ( $tracking_field['tracking_number'] ?? '' );
			} elseif ( is_string( $tracking_field ) ) {
				$number = $tracking_field;
			}

			$carrier_field = $shipment['carrier'] ?? null;
			if ( is_array( $carrier_field ) ) {
				$carrier = (string) ( $carrier_field['name'] ?? '' );
			} elseif ( is_string( $carrier_field ) ) {
				$carrier = $carrier_field;
			}

			if ( '' !== $number ) {
				break;
			}
		}
	}

	return [
		'tracking_number'  => sanitize_text_field( $number ),
		'tracking_carrier' => sanitize_text_field( $carrier ),
	];
}

/**
 * Run one poll pass: fetch current status for a bounded batch of in-flight,
 * Veeqo-correlated WooCommerce orders and apply any change.
 *
 * Never runs interactively — only via Action Scheduler. Read-mostly toward
 * Veeqo: every Veeqo call is a GET, this never writes back to Veeqo.
 */
function dtb_veeqo_order_status_poll_run(): void {
	if ( ! function_exists( 'dtb_veeqo_production_readiness' ) || empty( dtb_veeqo_production_readiness()['ready'] ) || ! function_exists( 'dtb_veeqo_request' ) ) {
		// Veeqo not configured (or the request client isn't loaded): skip the
		// run entirely, same defensive posture as the inventory pull job.
		return;
	}

	$orders = dtb_veeqo_order_status_poll_candidate_orders( DTB_VEEQO_ORDER_STATUS_POLL_BATCH_SIZE );
	if ( empty( $orders ) ) {
		if ( function_exists( 'dtb_veeqo_log' ) ) {
			dtb_veeqo_log( 'debug', 'order_status_poll_idle', 'Veeqo order status poll found no in-flight, Veeqo-correlated orders to check.' );
		}
		return;
	}

	$checked = 0;
	$applied = 0;
	$errors  = 0;

	foreach ( $orders as $order ) {
		if ( ! $order instanceof WC_Order ) {
			continue;
		}

		$order_id       = (int) $order->get_id();
		$veeqo_order_id = dtb_veeqo_order_status_poll_correlated_veeqo_id( $order );

		// Mark as checked this run regardless of outcome, so a persistently
		// failing/uncorrelated order does not monopolize future batches.
		$order->update_meta_data( '_dtb_veeqo_last_polled_at', time() );
		$order->save_meta_data();
		++$checked;

		if ( $veeqo_order_id <= 0 ) {
			continue;
		}

		$response = dtb_veeqo_request( 'GET', '/orders/' . $veeqo_order_id );
		if ( empty( $response['ok'] ) || ! is_array( $response['data'] ?? null ) ) {
			++$errors;
			if ( function_exists( 'dtb_veeqo_log' ) ) {
				dtb_veeqo_log( 'warn', 'order_status_poll_fetch_failed', 'Failed to fetch a Veeqo order for status polling; will retry on a later run.', [
					'order_id'       => $order_id,
					'veeqo_order_id' => $veeqo_order_id,
					'status'         => (int) ( $response['status'] ?? 0 ),
					'error'          => (string) ( $response['error'] ?? '' ),
				] );
			}
			continue; // One order's failure never aborts the batch.
		}

		$data         = $response['data'];
		$veeqo_status = sanitize_key( (string) ( $data['status'] ?? '' ) );
		if ( '' === $veeqo_status ) {
			if ( function_exists( 'dtb_veeqo_log' ) ) {
				dtb_veeqo_log( 'warn', 'order_status_poll_missing_status', 'Veeqo order response had no status field; skipping.', [
					'order_id'       => $order_id,
					'veeqo_order_id' => $veeqo_order_id,
				] );
			}
			continue;
		}

		$tracking = dtb_veeqo_order_status_poll_extract_tracking( $data );

		$result = function_exists( 'dtb_veeqo_apply_order_fulfillment_status' )
			? dtb_veeqo_apply_order_fulfillment_status( $order, $veeqo_status, [
				'source'           => 'poll',
				'reference'        => 'poll-' . gmdate( 'YmdHi' ),
				'veeqo_order_id'   => $veeqo_order_id,
				'tracking_number'  => $tracking['tracking_number'],
				'tracking_carrier' => $tracking['tracking_carrier'],
			] )
			: [ 'applied' => false, 'result' => 'unmapped_status' ];

		if ( ! empty( $result['applied'] ) ) {
			++$applied;
		} elseif ( 'unmapped_status' === ( $result['result'] ?? '' ) && function_exists( 'dtb_veeqo_log' ) ) {
			dtb_veeqo_log( 'debug', 'order_status_poll_unmapped', 'Veeqo order status has no confirmed WooCommerce mapping; left order unchanged.', [
				'order_id'       => $order_id,
				'veeqo_order_id' => $veeqo_order_id,
				'veeqo_status'   => $veeqo_status,
			] );
		}
	}

	if ( function_exists( 'dtb_veeqo_log' ) ) {
		dtb_veeqo_log(
			$errors > 0 ? 'warn' : 'info',
			'order_status_poll_complete',
			sprintf( 'Veeqo order status poll complete: checked %d order(s), applied %d update(s), %d fetch error(s).', $checked, $applied, $errors ),
			[ 'checked' => $checked, 'applied' => $applied, 'errors' => $errors ]
		);
	}

	if ( class_exists( 'DTB_VeeqoSyncJob' ) ) {
		DTB_VeeqoSyncJob::log_timestamp( 'order_status_poll' );
	} elseif ( function_exists( 'dtb_veeqo_log_sync_timestamp' ) ) {
		dtb_veeqo_log_sync_timestamp( 'order_status_poll' );
	}
}
