<?php
declare(strict_types=1);

/** DTB Order Event Stream Controller — bounded continuous SSE stream. */
defined( 'ABSPATH' ) || exit;

function dtb_order_rest_event_stream( WP_REST_Request $request ): void {
	$order_id = (int) $request->get_param( 'id' );
	$access   = function_exists( 'dtb_order_rest_check_order_access' ) ? dtb_order_rest_check_order_access( $request ) : true;
	if ( is_wp_error( $access ) ) {
		$status = (int) ( $access->get_error_data()['status'] ?? 403 );
		status_header( $status );
		header( 'Content-Type: application/json; charset=UTF-8' );
		echo wp_json_encode( [ 'code' => $access->get_error_code(), 'message' => $access->get_error_message() ] );
		exit;
	}

	if ( function_exists( 'session_write_close' ) ) {
		@session_write_close();
	}
	while ( ob_get_level() > 0 ) {
		ob_end_clean();
	}
	ignore_user_abort( true );
	@set_time_limit( 30 );

	header( 'Content-Type: text/event-stream; charset=UTF-8' );
	header( 'Cache-Control: no-cache, no-store, must-revalidate' );
	header( 'X-Accel-Buffering: no' );
	header( 'Connection: keep-alive' );
	echo "retry: 3000\n\n";
	flush();

	$started_at      = microtime( true );
	$last_heartbeat  = microtime( true );
	$last_revision   = '';

	do {
		if ( connection_aborted() ) {
			break;
		}
		delete_transient( 'dtb_order_tracking_v2_' . $order_id );
		$frame = function_exists( 'dtb_order_build_sse_frame' ) ? dtb_order_build_sse_frame( $order_id ) : null;
		if ( ! is_array( $frame ) ) {
			echo "event: error\n";
			echo 'data: ' . wp_json_encode( [ 'message' => 'Order not found.' ] ) . "\n\n";
			flush();
			break;
		}

		$revision = dtb_order_sse_frame_revision( $frame );
		if ( '' === $last_revision || ! hash_equals( $last_revision, $revision ) ) {
			$event_name  = ! empty( $frame['is_terminal'] ) ? 'order.terminal' : 'order.status_changed';
			$frame['type'] = $event_name;
			if ( ! empty( $frame['id'] ) ) {
				echo 'id: ' . absint( $frame['id'] ) . "\n";
			}
			echo 'event: ' . $event_name . "\n";
			echo 'data: ' . wp_json_encode( $frame ) . "\n\n";
			flush();
			$last_revision  = $revision;
			$last_heartbeat = microtime( true );
			if ( ! empty( $frame['is_terminal'] ) ) {
				break;
			}
		} elseif ( microtime( true ) - $last_heartbeat >= 10.0 ) {
			echo ': heartbeat ' . gmdate( 'c' ) . "\n\n";
			flush();
			$last_heartbeat = microtime( true );
		}

		usleep( 1500000 );
	} while ( microtime( true ) - $started_at < 25.0 );

	exit;
}
