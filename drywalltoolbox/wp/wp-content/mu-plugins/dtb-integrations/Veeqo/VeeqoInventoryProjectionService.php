<?php
/**
 * Canonical Veeqo -> WooCommerce inventory projection.
 *
 * Veeqo owns sellable inventory. WooCommerce stores the checkout-facing
 * projection used by Store API/cart validation and the React storefront.
 * Inventory is projected only from the explicitly configured Veeqo warehouse.
 * Missing/ambiguous mappings fail closed and are never converted to zero stock.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_VEEQO_INVENTORY_RECONCILE_HOOK   = 'dtb_veeqo_inventory_reconcile';
const DTB_VEEQO_INVENTORY_ACTION_GROUP     = 'dtb-integrations';
const DTB_VEEQO_INVENTORY_DIAGNOSTICS      = 'dtb_veeqo_inventory_reconciliation_diagnostics';
const DTB_VEEQO_INVENTORY_LOCK_OPTION      = 'dtb_veeqo_inventory_reconciliation_lock';
const DTB_VEEQO_INVENTORY_INTERVAL_SECONDS = 15 * MINUTE_IN_SECONDS;
const DTB_VEEQO_INVENTORY_MAX_RETRIES      = 3;

/** @return array{ready:bool,missing:string[],warehouse_id:int} */
function dtb_veeqo_inventory_readiness(): array {
	$config  = function_exists( 'dtb_veeqo_config' ) ? dtb_veeqo_config() : [];
	$missing = [];
	if ( ! defined( 'DTB_VEEQO_API_KEY' ) || '' === trim( (string) DTB_VEEQO_API_KEY ) ) {
		$missing[] = 'api_key';
	}
	$warehouse_id = absint( $config['warehouse_id'] ?? 0 );
	if ( $warehouse_id <= 0 ) {
		$missing[] = 'warehouse_id';
	}
	return [ 'ready' => empty( $missing ), 'missing' => $missing, 'warehouse_id' => $warehouse_id ];
}

function dtb_veeqo_inventory_acquire_lock( int $ttl = 10 * MINUTE_IN_SECONDS ): string {
	$token = wp_generate_uuid4();
	$value = wp_json_encode( [ 'token' => $token, 'expires_at' => time() + max( 60, $ttl ) ] );
	if ( add_option( DTB_VEEQO_INVENTORY_LOCK_OPTION, $value, '', 'no' ) ) {
		return $token;
	}
	$current_raw = (string) get_option( DTB_VEEQO_INVENTORY_LOCK_OPTION, '' );
	$current     = json_decode( $current_raw, true );
	if ( ! is_array( $current ) || (int) ( $current['expires_at'] ?? 0 ) >= time() ) {
		return '';
	}
	global $wpdb;
	$deleted = $wpdb->query( $wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s",
		DTB_VEEQO_INVENTORY_LOCK_OPTION,
		$current_raw
	) );
	wp_cache_delete( DTB_VEEQO_INVENTORY_LOCK_OPTION, 'options' );
	return 1 === $deleted && add_option( DTB_VEEQO_INVENTORY_LOCK_OPTION, $value, '', 'no' ) ? $token : '';
}

function dtb_veeqo_inventory_release_lock( string $token ): void {
	if ( '' === $token ) {
		return;
	}
	$current_raw = (string) get_option( DTB_VEEQO_INVENTORY_LOCK_OPTION, '' );
	$current     = json_decode( $current_raw, true );
	if ( ! is_array( $current ) || ! hash_equals( (string) ( $current['token'] ?? '' ), $token ) ) {
		return;
	}
	global $wpdb;
	$wpdb->query( $wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s",
		DTB_VEEQO_INVENTORY_LOCK_OPTION,
		$current_raw
	) );
	wp_cache_delete( DTB_VEEQO_INVENTORY_LOCK_OPTION, 'options' );
}

/** Return the stock entry belonging to the configured warehouse. */
function dtb_veeqo_inventory_stock_entry_for_warehouse( array $sellable, int $warehouse_id ): ?array {
	foreach ( (array) ( $sellable['stock_entries'] ?? [] ) as $entry ) {
		if ( ! is_array( $entry ) ) {
			continue;
		}
		$entry_warehouse_id = absint( $entry['warehouse_id'] ?? ( $entry['warehouse']['id'] ?? 0 ) );
		if ( $entry_warehouse_id === $warehouse_id ) {
			return $entry;
		}
	}
	return null;
}

/** @return array{available:int,infinite:bool}|null */
function dtb_veeqo_inventory_normalize_stock_entry( array $entry ): ?array {
	$infinite = ! empty( $entry['infinite'] );
	if ( $infinite ) {
		return [ 'available' => 0, 'infinite' => true ];
	}
	// Current Veeqo contract is available_stock_level. Keep legacy alias only for
	// backwards-compatible payloads; absence of both fields is unknown, not zero.
	if ( array_key_exists( 'available_stock_level', $entry ) ) {
		$available = (int) $entry['available_stock_level'];
	} elseif ( array_key_exists( 'available_stock', $entry ) ) {
		$available = (int) $entry['available_stock'];
	} else {
		return null;
	}
	return [ 'available' => max( 0, $available ), 'infinite' => false ];
}

/** Return duplicate Woo product IDs for an exact SKU, if any. */
function dtb_veeqo_inventory_woo_ids_for_sku( string $sku ): array {
	global $wpdb;
	if ( '' === $sku || empty( $wpdb->wc_product_meta_lookup ) ) {
		return [];
	}
	$ids = $wpdb->get_col( $wpdb->prepare(
		"SELECT product_id FROM {$wpdb->wc_product_meta_lookup} WHERE sku = %s ORDER BY product_id ASC LIMIT 3",
		$sku
	) );
	return array_values( array_filter( array_map( 'absint', (array) $ids ) ) );
}

/**
 * Reconcile one Veeqo products page into WooCommerce.
 *
 * @return array<string,mixed>|WP_Error
 */
function dtb_veeqo_inventory_reconcile_page( int $page = 1, int $per_page = 100, bool $dry_run = false ) {
	$readiness = dtb_veeqo_inventory_readiness();
	if ( empty( $readiness['ready'] ) ) {
		return new WP_Error( 'veeqo_inventory_not_ready', 'Veeqo inventory projection is not configured.', [ 'missing' => $readiness['missing'] ] );
	}
	$result = dtb_veeqo_request( 'GET', '/products', [
		'page'      => (string) max( 1, $page ),
		'page_size' => (string) min( 100, max( 1, $per_page ) ),
	] );
	if ( empty( $result['ok'] ) || ! is_array( $result['data'] ?? null ) ) {
		return new WP_Error( 'veeqo_inventory_fetch_failed', sanitize_text_field( (string) ( $result['error'] ?? 'Veeqo inventory fetch failed.' ) ), [ 'status' => (int) ( $result['status'] ?? 502 ) ] );
	}

	$report = [
		'page' => max( 1, $page ), 'products_received' => count( $result['data'] ), 'sellables_seen' => 0,
		'updated' => 0, 'unchanged' => 0, 'mapped' => 0, 'unmapped_skus' => [], 'duplicate_skus' => [],
		'missing_warehouse_entries' => [], 'invalid_stock_entries' => [], 'parent_ids' => [],
	];
	$warehouse_id = (int) $readiness['warehouse_id'];

	foreach ( $result['data'] as $veeqo_product ) {
		if ( ! is_array( $veeqo_product ) ) {
			continue;
		}
		foreach ( (array) ( $veeqo_product['sellables'] ?? [] ) as $sellable ) {
			if ( ! is_array( $sellable ) ) {
				continue;
			}
			$report['sellables_seen']++;
			$sku = trim( sanitize_text_field( (string) ( $sellable['sku_code'] ?? '' ) ) );
			if ( '' === $sku ) {
				continue;
			}
			$woo_ids = dtb_veeqo_inventory_woo_ids_for_sku( $sku );
			if ( count( $woo_ids ) > 1 ) {
				$report['duplicate_skus'][ $sku ] = $woo_ids;
				continue;
			}
			$product_id = ! empty( $woo_ids[0] ) ? (int) $woo_ids[0] : absint( wc_get_product_id_by_sku( $sku ) );
			if ( $product_id <= 0 ) {
				$report['unmapped_skus'][] = $sku;
				continue;
			}
			$entry = dtb_veeqo_inventory_stock_entry_for_warehouse( $sellable, $warehouse_id );
			if ( null === $entry ) {
				$report['missing_warehouse_entries'][] = $sku;
				continue;
			}
			$stock = dtb_veeqo_inventory_normalize_stock_entry( $entry );
			if ( null === $stock ) {
				$report['invalid_stock_entries'][] = $sku;
				continue;
			}
			$product = wc_get_product( $product_id );
			if ( ! $product instanceof WC_Product ) {
				$report['unmapped_skus'][] = $sku;
				continue;
			}

			$sellable_id = absint( $sellable['id'] ?? 0 );
			$needs_meta  = $sellable_id > 0 && ( absint( $product->get_meta( '_veeqo_sellable_id', true ) ) !== $sellable_id || (string) $product->get_meta( '_veeqo_mapped_sku', true ) !== $sku );
			$target_status = $stock['infinite'] || $stock['available'] > 0 ? 'instock' : 'outofstock';
			$needs_stock = $stock['infinite']
				? ( $product->managing_stock() || ! $product->is_in_stock() )
				: ( ! $product->managing_stock() || (int) $product->get_stock_quantity() !== $stock['available'] || $product->get_stock_status() !== $target_status );

			if ( $needs_meta ) {
				$report['mapped']++;
			}
			if ( ! $needs_meta && ! $needs_stock ) {
				$report['unchanged']++;
				continue;
			}
			if ( $dry_run ) {
				$report['updated']++;
				continue;
			}

			if ( $needs_meta ) {
				$product->update_meta_data( '_veeqo_sellable_id', $sellable_id );
				$product->update_meta_data( '_veeqo_mapped_sku', $sku );
			}
			if ( $stock['infinite'] ) {
				$product->set_manage_stock( false );
				$product->set_stock_status( 'instock' );
			} else {
				$product->set_manage_stock( true );
				$product->set_stock_quantity( $stock['available'] );
				$product->set_stock_status( $target_status );
			}
			$product->save();
			wc_delete_product_transients( $product_id );
			$parent_id = absint( $product->get_parent_id() );
			if ( $parent_id > 0 ) {
				$report['parent_ids'][ $parent_id ] = $parent_id;
			}
			$report['updated']++;
		}
	}

	if ( ! $dry_run && class_exists( 'WC_Product_Variable' ) ) {
		foreach ( array_values( $report['parent_ids'] ) as $parent_id ) {
			WC_Product_Variable::sync( $parent_id );
			wc_delete_product_transients( $parent_id );
		}
	}
	$report['parent_ids'] = array_values( $report['parent_ids'] );
	foreach ( [ 'unmapped_skus', 'missing_warehouse_entries', 'invalid_stock_entries' ] as $key ) {
		$report[ $key ] = array_values( array_unique( $report[ $key ] ) );
	}
	return $report;
}

/** @return array<string,mixed>|WP_Error */
function dtb_veeqo_inventory_reconcile_all( bool $dry_run = false ) {
	$token = dtb_veeqo_inventory_acquire_lock();
	if ( '' === $token ) {
		return new WP_Error( 'veeqo_inventory_locked', 'A Veeqo inventory reconciliation is already running.', [ 'status' => 409 ] );
	}
	$aggregate = [ 'pages' => 0, 'sellables_seen' => 0, 'updated' => 0, 'unchanged' => 0, 'mapped' => 0, 'unmapped_skus' => [], 'duplicate_skus' => [], 'missing_warehouse_entries' => [], 'invalid_stock_entries' => [], 'dry_run' => $dry_run ];
	try {
		for ( $page = 1; $page <= 1000; $page++ ) {
			$report = dtb_veeqo_inventory_reconcile_page( $page, 100, $dry_run );
			if ( is_wp_error( $report ) ) {
				return $report;
			}
			$aggregate['pages']++;
			foreach ( [ 'sellables_seen', 'updated', 'unchanged', 'mapped' ] as $key ) {
				$aggregate[ $key ] += (int) $report[ $key ];
			}
			foreach ( [ 'unmapped_skus', 'missing_warehouse_entries', 'invalid_stock_entries' ] as $key ) {
				$aggregate[ $key ] = array_values( array_unique( array_merge( $aggregate[ $key ], (array) $report[ $key ] ) ) );
			}
			$aggregate['duplicate_skus'] = array_replace( $aggregate['duplicate_skus'], (array) $report['duplicate_skus'] );
			if ( (int) $report['products_received'] < 100 ) {
				break;
			}
		}
		$aggregate['completed_at'] = gmdate( 'c' );
		update_option( DTB_VEEQO_INVENTORY_DIAGNOSTICS, $aggregate, false );
		if ( function_exists( 'dtb_veeqo_log' ) ) {
			dtb_veeqo_log( 'info', 'inventory_reconciliation_complete', 'Veeqo inventory projected into WooCommerce.', [
				'pages' => $aggregate['pages'], 'sellables_seen' => $aggregate['sellables_seen'], 'updated' => $aggregate['updated'],
				'unmapped_count' => count( $aggregate['unmapped_skus'] ), 'duplicate_count' => count( $aggregate['duplicate_skus'] ), 'dry_run' => $dry_run,
			] );
		}
		if ( class_exists( 'DTB_VeeqoSyncJob' ) && ! $dry_run ) {
			DTB_VeeqoSyncJob::log_timestamp( 'inventory' );
		}
		return $aggregate;
	} finally {
		dtb_veeqo_inventory_release_lock( $token );
	}
}

/** Legacy-compatible page pull used by the existing admin route. */
function dtb_veeqo_pull_inventory_into_wc( int $page = 1, int $per_page = 100 ): ?int {
	$report = dtb_veeqo_inventory_reconcile_page( $page, $per_page, false );
	return is_wp_error( $report ) ? null : (int) $report['updated'];
}

function dtb_veeqo_inventory_schedule_recurring(): void {
	if ( empty( dtb_veeqo_inventory_readiness()['ready'] ) || ! function_exists( 'as_schedule_recurring_action' ) ) {
		return;
	}
	$already = function_exists( 'as_has_scheduled_action' )
		? as_has_scheduled_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP )
		: ( function_exists( 'as_next_scheduled_action' ) && false !== as_next_scheduled_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP ) );
	if ( ! $already ) {
		as_schedule_recurring_action( time() + 60, DTB_VEEQO_INVENTORY_INTERVAL_SECONDS, DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP, true );
	}
}
add_action( 'init', 'dtb_veeqo_inventory_schedule_recurring', 40 );
add_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, 'dtb_veeqo_inventory_scheduled_run', 10, 1 );

function dtb_veeqo_inventory_scheduled_run( int $attempt = 0 ): void {
	$result = dtb_veeqo_inventory_reconcile_all( false );
	if ( ! is_wp_error( $result ) ) {
		return;
	}
	$status = (int) ( $result->get_error_data()['status'] ?? 0 );
	$retryable = 0 === $status || 408 === $status || 425 === $status || 429 === $status || $status >= 500;
	if ( $retryable && $attempt < DTB_VEEQO_INVENTORY_MAX_RETRIES && function_exists( 'as_schedule_single_action' ) ) {
		$delay = min( HOUR_IN_SECONDS, ( 2 ** $attempt ) * 5 * MINUTE_IN_SECONDS );
		as_schedule_single_action( time() + $delay, DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [ $attempt + 1 ], DTB_VEEQO_INVENTORY_ACTION_GROUP, true );
	}
	if ( function_exists( 'dtb_veeqo_log' ) ) {
		dtb_veeqo_log( 'error', 'inventory_reconciliation_failed', 'Veeqo inventory reconciliation failed.', [ 'attempt' => $attempt, 'retryable' => $retryable, 'status' => $status, 'error' => $result->get_error_message() ] );
	}
}

add_action( 'rest_api_init', static function (): void {
	register_rest_route( 'dtb/v1', '/veeqo/admin/inventory/reconcile', [
		'methods' => 'POST',
		'callback' => static function ( WP_REST_Request $request ): WP_REST_Response {
			$dry_run = rest_sanitize_boolean( $request->get_param( 'dry_run' ) );
			$result  = dtb_veeqo_inventory_reconcile_all( $dry_run );
			if ( is_wp_error( $result ) ) {
				$status = (int) ( $result->get_error_data()['status'] ?? 502 );
				return new WP_REST_Response( [ 'success' => false, 'code' => $result->get_error_code(), 'message' => $result->get_error_message() ], $status );
			}
			return new WP_REST_Response( [ 'success' => true, 'report' => $result ], 200 );
		},
		'permission_callback' => static fn(): bool => current_user_can( 'manage_woocommerce' ),
	] );
	register_rest_route( 'dtb/v1', '/veeqo/admin/inventory/diagnostics', [
		'methods' => 'GET',
		'callback' => static fn(): WP_REST_Response => new WP_REST_Response( [
			'readiness' => dtb_veeqo_inventory_readiness(),
			'last_run' => (array) get_option( DTB_VEEQO_INVENTORY_DIAGNOSTICS, [] ),
			'last_sync_at' => class_exists( 'DTB_VeeqoSyncJob' ) ? DTB_VeeqoSyncJob::last_timestamp( 'inventory' ) : 0,
		], 200 ),
		'permission_callback' => static fn(): bool => current_user_can( 'manage_woocommerce' ),
	] );
}, 30 );
