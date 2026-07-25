<?php
/**
 * Veeqo admin read models and bounded server-side API caching.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_VEEQO_ADMIN_CACHE_VERSION_OPTION = 'dtb_veeqo_admin_cache_version';
const DTB_VEEQO_ADMIN_CACHE_TTL            = 30;
const DTB_VEEQO_ADMIN_STALE_TTL            = 10 * MINUTE_IN_SECONDS;
const DTB_VEEQO_ADMIN_MAX_PAGE_SIZE        = 100;
const DTB_VEEQO_ADMIN_REFRESH_INTERVAL     = 5;

/** Return the current cache generation. */
function dtb_veeqo_admin_cache_version(): int {
	return max( 1, absint( get_option( DTB_VEEQO_ADMIN_CACHE_VERSION_OPTION, 1 ) ) );
}

/** Invalidate all dashboard read caches without scanning the options table. */
function dtb_veeqo_admin_cache_flush(): void {
	update_option( DTB_VEEQO_ADMIN_CACHE_VERSION_OPTION, dtb_veeqo_admin_cache_version() + 1, false );
}

/** Build a bounded transient key. */
function dtb_veeqo_admin_cache_key( string $path, array $params ): string {
	ksort( $params );
	return 'dtb_vad_' . md5( dtb_veeqo_admin_cache_version() . '|' . $path . '|' . wp_json_encode( $params ) );
}

/** Delete a cache lock only when the current caller still owns its raw value. */
function dtb_veeqo_admin_delete_cache_lock( string $lock_name, string $raw_value ): void {
	global $wpdb;
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s",
			$lock_name,
			$raw_value
		)
	);
	wp_cache_delete( $lock_name, 'options' );
}

/**
 * Perform one cached Veeqo GET with request coalescing and stale-on-error fallback.
 *
 * @return array{data:mixed,cached:bool,stale:bool,fetched_at:string}|WP_Error
 */
function dtb_veeqo_admin_cached_get( string $path, array $params = [], int $ttl = DTB_VEEQO_ADMIN_CACHE_TTL, bool $force = false ) {
	if ( ! function_exists( 'dtb_veeqo_request' ) ) {
		return new WP_Error( 'veeqo_client_unavailable', 'Veeqo client is unavailable.', [ 'status' => 503 ] );
	}

	$key    = dtb_veeqo_admin_cache_key( $path, $params );
	$cached = get_transient( $key );
	$now    = time();

	if ( ! $force && is_array( $cached ) && isset( $cached['data'], $cached['fresh_until'], $cached['fetched_at'] ) && (int) $cached['fresh_until'] >= $now ) {
		return [
			'data'       => $cached['data'],
			'cached'     => true,
			'stale'      => false,
			'fetched_at' => sanitize_text_field( (string) $cached['fetched_at'] ),
		];
	}

	$lock_name  = 'dtb_vad_lock_' . md5( $key );
	$lock_token = wp_generate_uuid4();
	$lock_raw   = wp_json_encode( [ 'token' => $lock_token, 'expires_at' => $now + 30 ] );
	$claimed    = add_option( $lock_name, $lock_raw, '', 'no' );

	if ( ! $claimed ) {
		$current_raw = (string) get_option( $lock_name, '' );
		$current     = json_decode( $current_raw, true );
		$valid       = is_array( $current ) && is_string( $current['token'] ?? null ) && is_numeric( $current['expires_at'] ?? null );
		if ( ! $valid || (int) ( $current['expires_at'] ?? 0 ) < $now ) {
			dtb_veeqo_admin_delete_cache_lock( $lock_name, $current_raw );
			$claimed = add_option( $lock_name, $lock_raw, '', 'no' );
		}
	}

	if ( ! $claimed ) {
		if ( is_array( $cached ) && array_key_exists( 'data', $cached ) ) {
			return [
				'data'       => $cached['data'],
				'cached'     => true,
				'stale'      => true,
				'fetched_at' => sanitize_text_field( (string) ( $cached['fetched_at'] ?? '' ) ),
			];
		}
		return new WP_Error( 'veeqo_admin_refresh_busy', 'Veeqo data is already being refreshed. Retry shortly.', [ 'status' => 409 ] );
	}

	try {
		$result = dtb_veeqo_request( 'GET', $path, $params );
		if ( empty( $result['ok'] ) ) {
			if ( is_array( $cached ) && array_key_exists( 'data', $cached ) ) {
				return [
					'data'       => $cached['data'],
					'cached'     => true,
					'stale'      => true,
					'fetched_at' => sanitize_text_field( (string) ( $cached['fetched_at'] ?? '' ) ),
				];
			}
			return new WP_Error(
				'veeqo_admin_fetch_failed',
				sanitize_text_field( (string) ( $result['error'] ?? 'Veeqo request failed.' ) ),
				[ 'status' => max( 400, (int) ( $result['status'] ?? 502 ) ) ]
			);
		}

		$entry = [
			'data'        => $result['data'],
			'fresh_until' => $now + max( 5, $ttl ),
			'fetched_at'  => gmdate( 'c' ),
		];
		set_transient( $key, $entry, max( $ttl, DTB_VEEQO_ADMIN_STALE_TTL ) );

		return [
			'data'       => $entry['data'],
			'cached'     => false,
			'stale'      => false,
			'fetched_at' => $entry['fetched_at'],
		];
	} finally {
		dtb_veeqo_admin_delete_cache_lock( $lock_name, $lock_raw );
	}
}

/** Return whether an array uses consecutive integer keys. */
function dtb_veeqo_admin_is_list( array $data ): bool {
	return [] === $data || array_keys( $data ) === range( 0, count( $data ) - 1 );
}

/** Return list data from either a bare array or a keyed API envelope. */
function dtb_veeqo_admin_extract_list( $data, string $key ): array {
	if ( ! is_array( $data ) ) {
		return [];
	}
	if ( isset( $data[ $key ] ) && is_array( $data[ $key ] ) ) {
		return array_values( $data[ $key ] );
	}
	return dtb_veeqo_admin_is_list( $data ) ? array_values( $data ) : [];
}
