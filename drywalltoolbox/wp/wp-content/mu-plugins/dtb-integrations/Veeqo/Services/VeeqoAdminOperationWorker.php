<?php
/**
 * Veeqo admin queued operation worker.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/** Return whether an operation failure should be retried. */
function dtb_veeqo_admin_operation_retryable( WP_Error $error ): bool {
	$data   = $error->get_error_data();
	$status = is_array( $data ) ? (int) ( $data['status'] ?? 0 ) : 0;
	return 0 === $status || 408 === $status || 425 === $status || 429 === $status || $status >= 500;
}

/** Execute one durable operation with bounded retry. */
function dtb_veeqo_admin_operation_worker( string $operation_id, int $attempt = 0 ): void {
	$operation_id = sanitize_key( $operation_id );
	$operation    = dtb_veeqo_admin_operation_get( $operation_id );
	if ( empty( $operation ) || in_array( (string) ( $operation['status'] ?? '' ), [ 'completed', 'failed' ], true ) ) {
		return;
	}
	$operation['status']     = 'running';
	$operation['attempt']    = max( 0, $attempt );
	$operation['started_at'] = (string) ( $operation['started_at'] ?? gmdate( 'c' ) );
	$operation['error']      = '';
	unset( $operation['next_attempt_at'] );
	dtb_veeqo_admin_operation_save( $operation );

	$type    = sanitize_key( (string) ( $operation['type'] ?? '' ) );
	$payload = is_array( $operation['payload'] ?? null ) ? $operation['payload'] : [];
	try {
		$result = 'stock_adjustment' === $type
			? dtb_veeqo_admin_execute_stock_adjustment( $payload )
			: ( 'shipment' === $type ? dtb_veeqo_admin_execute_shipment( $payload ) : new WP_Error( 'unsupported_veeqo_operation', 'Unsupported Veeqo operation type.', [ 'status' => 400 ] ) );
	} catch ( Throwable $throwable ) {
		$result = new WP_Error( 'veeqo_admin_operation_exception', 'The Veeqo operation failed unexpectedly.', [ 'status' => 500 ] );
		if ( function_exists( 'dtb_veeqo_log' ) ) {
			dtb_veeqo_log( 'error', 'admin_operation_exception', 'Veeqo admin operation threw an exception.', [
				'operation_id' => $operation_id,
				'type'         => $type,
				'exception'    => sanitize_text_field( get_class( $throwable ) ),
			] );
		}
	}

	if ( is_wp_error( $result ) ) {
		$retryable = dtb_veeqo_admin_operation_retryable( $result );
		if ( $retryable && $attempt < DTB_VEEQO_ADMIN_OPERATION_MAX_RETRIES && function_exists( 'as_schedule_single_action' ) ) {
			$delay = min( HOUR_IN_SECONDS, ( 2 ** $attempt ) * MINUTE_IN_SECONDS );
			$operation['status']          = 'retrying';
			$operation['attempt']         = $attempt + 1;
			$operation['error']           = sanitize_text_field( $result->get_error_message() );
			$operation['next_attempt_at'] = gmdate( 'c', time() + $delay );
			dtb_veeqo_admin_operation_save( $operation );
			as_schedule_single_action(
				time() + $delay,
				DTB_VEEQO_ADMIN_OPERATION_HOOK,
				[ $operation_id, $attempt + 1 ],
				defined( 'DTB_VEEQO_INVENTORY_ACTION_GROUP' ) ? DTB_VEEQO_INVENTORY_ACTION_GROUP : 'dtb-integrations',
				true
			);
			return;
		}
		$operation['status']       = 'failed';
		$operation['error']        = sanitize_text_field( $result->get_error_message() );
		$operation['completed_at'] = gmdate( 'c' );
	} else {
		$operation['status']       = 'completed';
		$operation['result']       = $result;
		$operation['completed_at'] = gmdate( 'c' );
		$operation['error']        = '';
	}
	dtb_veeqo_admin_operation_save( $operation );

	if ( function_exists( 'dtb_veeqo_log' ) ) {
		dtb_veeqo_log(
			'completed' === $operation['status'] ? 'info' : 'error',
			'admin_operation_' . $operation['status'],
			'Veeqo admin operation reached a terminal state.',
			[
				'operation_id' => $operation_id,
				'type'         => $type,
				'target'       => sanitize_text_field( (string) ( $operation['target'] ?? '' ) ),
				'attempt'      => $attempt,
				'error'        => sanitize_text_field( (string) ( $operation['error'] ?? '' ) ),
			]
		);
	}
}
add_action( DTB_VEEQO_ADMIN_OPERATION_HOOK, 'dtb_veeqo_admin_operation_worker', 10, 2 );
