<?php
declare(strict_types=1);

/** REST — bounded continuous repair event stream. */
defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', 'dtb_repair_register_stream_route' );

function dtb_repair_register_stream_route(): void {
	foreach ( [ '/repairs/(?P<id>\d+)/stream', '/repairs/(?P<id>\d+)/events/stream' ] as $route ) {
		register_rest_route( 'dtb/v1', $route, [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'dtb_repair_rest_events_stream',
			'permission_callback' => '__return_true',
			'args'                => [
				'id'            => [ 'type' => 'integer', 'required' => true, 'minimum' => 1 ],
				'token'         => [ 'type' => 'string', 'required' => false, 'default' => '' ],
				'last_event_id' => [ 'type' => 'integer', 'required' => false, 'default' => 0, 'minimum' => 0 ],
			],
		] );
	}
}

function dtb_repair_rest_events_stream( WP_REST_Request $request ): void {
	$repair_id    = (int) $request->get_param( 'id' );
	$public_token = sanitize_text_field( (string) $request->get_param( 'token' ) );
	$cursor       = max( 0, (int) $request->get_param( 'last_event_id' ), (int) $request->get_header( 'last-event-id' ) );
	$access       = function_exists( 'dtb_validate_repair_access' ) ? dtb_validate_repair_access( $repair_id, $public_token ) : true;
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
	$terminal_types  = [ 'repair.completed', 'repair.closed', 'repair.cancelled', 'repair.quote_declined' ];

	do {
		if ( connection_aborted() ) {
			break;
		}
		$events = dtb_repair_stream_events_after( $repair_id, $cursor );
		foreach ( $events as $event ) {
			$cursor   = max( $cursor, (int) $event->id );
			$payload  = ! empty( $event->payload_json ) ? json_decode( (string) $event->payload_json, true ) : [];
			$type     = sanitize_key( (string) $event->event_type );
			$terminal = in_array( $type, $terminal_types, true );
			$data     = [
				'id'          => (int) $event->id,
				'type'        => $type,
				'from_status' => $event->from_status,
				'to_status'   => $event->to_status,
				'occurred_at' => $event->created_at,
				'payload'     => is_array( $payload ) ? $payload : [],
				'is_terminal' => $terminal,
			];
			echo 'id: ' . (int) $event->id . "\n";
			echo 'event: ' . ( $terminal ? 'repair.terminal' : 'repair.update' ) . "\n";
			echo 'data: ' . wp_json_encode( $data ) . "\n\n";
			flush();
			$last_heartbeat = microtime( true );
			if ( $terminal ) {
				exit;
			}
		}
		if ( empty( $events ) && microtime( true ) - $last_heartbeat >= 10.0 ) {
			echo ': heartbeat ' . gmdate( 'c' ) . "\n\n";
			flush();
			$last_heartbeat = microtime( true );
		}
		usleep( 1500000 );
	} while ( microtime( true ) - $started_at < 25.0 );

	exit;
}

/** @return object[] */
function dtb_repair_stream_events_after( int $repair_id, int $cursor ): array {
	global $wpdb;
	$table = $wpdb->prefix . 'dtb_repair_events';
	return (array) $wpdb->get_results(
		$wpdb->prepare(
			"SELECT id, event_type, from_status, to_status, payload_json, created_at
			 FROM {$table}
			 WHERE repair_id = %d
			   AND id > %d
			   AND visibility IN ('customer', 'operator')
			 ORDER BY id ASC
			 LIMIT 100",
			$repair_id,
			$cursor
		)
	);
}
