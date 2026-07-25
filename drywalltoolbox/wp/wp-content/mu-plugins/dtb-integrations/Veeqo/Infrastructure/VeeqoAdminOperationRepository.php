<?php
/**
 * Durable, idempotent Veeqo admin mutation queue.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_VEEQO_ADMIN_OPERATION_HOOK          = 'dtb_veeqo_admin_operation';
const DTB_VEEQO_ADMIN_OPERATION_OPTION_PREFIX = 'dtb_veeqo_admin_operation_';
const DTB_VEEQO_ADMIN_OPERATION_INDEX_OPTION  = 'dtb_veeqo_admin_operation_index';
const DTB_VEEQO_ADMIN_OPERATION_IDEM_PREFIX   = 'dtb_veeqo_admin_operation_idem_';
const DTB_VEEQO_ADMIN_OPERATION_RETENTION     = 50;
const DTB_VEEQO_ADMIN_OPERATION_MAX_RETRIES   = 3;
const DTB_VEEQO_ADMIN_TARGET_LOCK_TTL         = 10 * MINUTE_IN_SECONDS;

/** Return the option name for one durable operation. */
function dtb_veeqo_admin_operation_option_name( string $operation_id ): string {
	return DTB_VEEQO_ADMIN_OPERATION_OPTION_PREFIX . sanitize_key( $operation_id );
}

/** Read one durable operation. */
function dtb_veeqo_admin_operation_get( string $operation_id ): array {
	$operation_id = sanitize_key( $operation_id );
	return '' === $operation_id ? [] : (array) get_option( dtb_veeqo_admin_operation_option_name( $operation_id ), [] );
}

/** Persist one operation and bound retained history. */
function dtb_veeqo_admin_operation_save( array $operation ): void {
	$operation_id = sanitize_key( (string) ( $operation['operation_id'] ?? '' ) );
	if ( '' === $operation_id ) {
		return;
	}
	$operation['operation_id'] = $operation_id;
	update_option( dtb_veeqo_admin_operation_option_name( $operation_id ), $operation, false );

	$index = array_values( array_unique( array_filter( array_map( 'sanitize_key', (array) get_option( DTB_VEEQO_ADMIN_OPERATION_INDEX_OPTION, [] ) ) ) ) );
	$index = array_values( array_diff( $index, [ $operation_id ] ) );
	array_unshift( $index, $operation_id );
	$expired = array_slice( $index, DTB_VEEQO_ADMIN_OPERATION_RETENTION );
	$index   = array_slice( $index, 0, DTB_VEEQO_ADMIN_OPERATION_RETENTION );
	update_option( DTB_VEEQO_ADMIN_OPERATION_INDEX_OPTION, $index, false );

	foreach ( $expired as $expired_id ) {
		$expired_operation = dtb_veeqo_admin_operation_get( $expired_id );
		$request_hash      = sanitize_key( (string) ( $expired_operation['request_hash'] ?? '' ) );
		delete_option( dtb_veeqo_admin_operation_option_name( $expired_id ) );
		if ( '' !== $request_hash ) {
			delete_option( DTB_VEEQO_ADMIN_OPERATION_IDEM_PREFIX . $request_hash );
		}
	}
}

/** Return a field-whitelisted operation summary. */
function dtb_veeqo_admin_operation_summary( array $operation ): array {
	$result = is_array( $operation['result'] ?? null ) ? $operation['result'] : [];
	return [
		'operation_id'    => sanitize_key( (string) ( $operation['operation_id'] ?? '' ) ),
		'type'            => sanitize_key( (string) ( $operation['type'] ?? '' ) ),
		'status'          => sanitize_key( (string) ( $operation['status'] ?? '' ) ),
		'created_at'      => sanitize_text_field( (string) ( $operation['created_at'] ?? '' ) ),
		'started_at'      => sanitize_text_field( (string) ( $operation['started_at'] ?? '' ) ),
		'completed_at'    => sanitize_text_field( (string) ( $operation['completed_at'] ?? '' ) ),
		'next_attempt_at' => sanitize_text_field( (string) ( $operation['next_attempt_at'] ?? '' ) ),
		'attempt'         => absint( $operation['attempt'] ?? 0 ),
		'action_id'       => absint( $operation['action_id'] ?? 0 ),
		'created_by'      => absint( $operation['created_by'] ?? 0 ),
		'error'           => sanitize_text_field( (string) ( $operation['error'] ?? '' ) ),
		'target'          => sanitize_text_field( (string) ( $operation['target'] ?? '' ) ),
		'result'          => [
			'updated'         => ! empty( $result['updated'] ),
			'already_applied' => ! empty( $result['already_applied'] ),
			'sellable_id'     => absint( $result['sellable_id'] ?? 0 ),
			'warehouse_id'    => absint( $result['warehouse_id'] ?? 0 ),
			'order_id'        => absint( $result['order_id'] ?? 0 ),
			'allocation_id'   => absint( $result['allocation_id'] ?? 0 ),
			'shipment_id'     => absint( $result['shipment_id'] ?? 0 ),
			'tracking_number' => sanitize_text_field( (string) ( $result['tracking_number'] ?? '' ) ),
		],
	];
}

/** Return recent operation summaries. */
function dtb_veeqo_admin_operations_recent( int $limit = 20 ): array {
	$limit = min( DTB_VEEQO_ADMIN_OPERATION_RETENTION, max( 1, $limit ) );
	$rows  = [];
	$ids   = array_slice( (array) get_option( DTB_VEEQO_ADMIN_OPERATION_INDEX_OPTION, [] ), 0, $limit );
	foreach ( $ids as $operation_id ) {
		$operation = dtb_veeqo_admin_operation_get( (string) $operation_id );
		if ( ! empty( $operation ) ) {
			$rows[] = dtb_veeqo_admin_operation_summary( $operation );
		}
	}
	return $rows;
}

/** Conditionally delete a target lock using the exact stored value. */
function dtb_veeqo_admin_delete_target_lock( string $name, string $raw ): void {
	global $wpdb;
	$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s", $name, $raw ) );
	wp_cache_delete( $name, 'options' );
}

/** Acquire a token-owned target lock. */
function dtb_veeqo_admin_acquire_target_lock( string $target, int $ttl = DTB_VEEQO_ADMIN_TARGET_LOCK_TTL ): array {
	$name  = 'dtb_vadm_lock_' . md5( $target );
	$token = wp_generate_uuid4();
	$raw   = wp_json_encode( [ 'token' => $token, 'expires_at' => time() + max( 60, $ttl ) ] );
	if ( add_option( $name, $raw, '', 'no' ) ) {
		return [ 'name' => $name, 'token' => $token, 'raw' => $raw ];
	}
	$current_raw = (string) get_option( $name, '' );
	$current     = json_decode( $current_raw, true );
	$valid       = is_array( $current ) && is_string( $current['token'] ?? null ) && is_numeric( $current['expires_at'] ?? null );
	if ( $valid && (int) $current['expires_at'] >= time() ) {
		return [];
	}
	dtb_veeqo_admin_delete_target_lock( $name, $current_raw );
	return add_option( $name, $raw, '', 'no' ) ? [ 'name' => $name, 'token' => $token, 'raw' => $raw ] : [];
}

/** Release a target lock only when this worker owns it. */
function dtb_veeqo_admin_release_target_lock( array $lock ): void {
	$name  = sanitize_key( (string) ( $lock['name'] ?? '' ) );
	$token = (string) ( $lock['token'] ?? '' );
	if ( '' === $name || '' === $token ) {
		return;
	}
	$current_raw = (string) get_option( $name, '' );
	$current     = json_decode( $current_raw, true );
	if ( is_array( $current ) && hash_equals( (string) ( $current['token'] ?? '' ), $token ) ) {
		dtb_veeqo_admin_delete_target_lock( $name, $current_raw );
	}
}
