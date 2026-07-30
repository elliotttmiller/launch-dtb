<?php
/**
 * Infrastructure — ReleaseEventRepository
 *
 * Persistence adapter over wp_dtb_release_events. All release state is
 * derived by reading this event log — there is no separate mutable
 * "release" row, so history is always the full, auditable source of truth.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Record one release lifecycle event. Idempotent: a duplicate
 * (release_id, event_type) pair is silently ignored (webhook-retry safe).
 *
 * @param string               $release_id
 * @param string               $event_type
 * @param array<string,mixed>  $context Arbitrary event metadata. Recognised
 *                                      keys (ref_type, ref, commit_sha,
 *                                      actor, source, workflow_run_id) are
 *                                      promoted to indexed columns; the full
 *                                      context is always retained as JSON.
 * @return bool True when a new row was inserted; false on duplicate/error.
 */
function dtb_release_event_record( string $release_id, string $event_type, array $context = [] ): bool {
	$release_id = substr( sanitize_text_field( $release_id ), 0, 80 );
	$event_type = substr( sanitize_key( $event_type ), 0, 64 );

	if ( '' === $release_id || ! in_array( $event_type, dtb_release_known_event_types(), true ) ) {
		return false;
	}

	global $wpdb;
	$table = $wpdb->prefix . 'dtb_release_events';

	$commit_sha = (string) ( $context['commit_sha'] ?? '' );
	$commit_sha = preg_match( '/^[0-9a-f]{7,40}$/', $commit_sha ) ? $commit_sha : null;

	$ref_type = substr( sanitize_text_field( (string) ( $context['ref_type'] ?? '' ) ), 0, 20 );
	$ref      = substr( sanitize_text_field( (string) ( $context['ref'] ?? '' ) ), 0, 191 );
	$actor    = substr( sanitize_text_field( (string) ( $context['actor'] ?? '' ) ), 0, 191 );
	$source   = substr( sanitize_key( (string) ( $context['source'] ?? 'github_actions' ) ), 0, 40 ) ?: 'github_actions';
	$run_id   = substr( sanitize_text_field( (string) ( $context['workflow_run_id'] ?? '' ) ), 0, 40 );

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$inserted = $wpdb->query(
		$wpdb->prepare(
			"INSERT IGNORE INTO {$table} (release_id, event_type, ref_type, ref, commit_sha, actor, source, workflow_run_id, payload_json, created_at)
			 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
			$release_id,
			$event_type,
			'' !== $ref_type ? $ref_type : null,
			'' !== $ref ? $ref : null,
			$commit_sha,
			'' !== $actor ? $actor : null,
			$source,
			'' !== $run_id ? $run_id : null,
			wp_json_encode( $context ) ?: '{}',
			current_time( 'mysql', true )
		)
	); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared

	return (bool) $inserted;
}

/**
 * All events for a single release, ordered oldest → newest.
 *
 * @return array<int,array<string,mixed>>
 */
function dtb_release_events_for( string $release_id ): array {
	global $wpdb;
	$table = $wpdb->prefix . 'dtb_release_events';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	$rows = $wpdb->get_results(
		$wpdb->prepare( "SELECT * FROM {$table} WHERE release_id = %s ORDER BY created_at ASC, id ASC", $release_id ),
		ARRAY_A
	);

	return array_map( 'dtb_release_event_row_normalize', is_array( $rows ) ? $rows : [] );
}

/**
 * Distinct release_ids ordered by most recent activity, newest first.
 *
 * @return string[]
 */
function dtb_release_recent_release_ids( int $limit = 50 ): array {
	global $wpdb;
	$table = $wpdb->prefix . 'dtb_release_events';
	$limit = max( 1, min( 200, $limit ) );

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	$rows = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT release_id FROM {$table} GROUP BY release_id ORDER BY MAX(created_at) DESC LIMIT %d",
			$limit
		)
	);

	return is_array( $rows ) ? array_map( 'strval', $rows ) : [];
}

/**
 * Normalize a raw DB row: decode payload_json and cast types.
 *
 * @param array<string,mixed> $row
 * @return array<string,mixed>
 */
function dtb_release_event_row_normalize( array $row ): array {
	$payload = json_decode( (string) ( $row['payload_json'] ?? '' ), true );

	return [
		'id'              => absint( $row['id'] ?? 0 ),
		'release_id'      => (string) ( $row['release_id'] ?? '' ),
		'event_type'      => (string) ( $row['event_type'] ?? '' ),
		'ref_type'        => $row['ref_type'] ?? null,
		'ref'             => $row['ref'] ?? null,
		'commit_sha'      => $row['commit_sha'] ?? null,
		'actor'           => $row['actor'] ?? null,
		'source'          => (string) ( $row['source'] ?? '' ),
		'workflow_run_id' => $row['workflow_run_id'] ?? null,
		'payload'         => is_array( $payload ) ? $payload : [],
		'created_at'      => (string) ( $row['created_at'] ?? '' ),
	];
}
