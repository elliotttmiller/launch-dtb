<?php
/**
 * Canonical Veeqo -> WooCommerce inventory projection, version 2.
 *
 * Veeqo owns sellable inventory. WooCommerce stores the checkout-facing
 * projection used by Store API/cart validation. Inventory is projected only
 * from the explicitly configured Veeqo warehouse. Unknown warehouse entries,
 * invalid stock payloads, missing mappings, and duplicate WooCommerce SKUs fail
 * closed and are reported; they are never converted to zero stock.
 *
 * This file intentionally does not declare the legacy
 * dtb_veeqo_pull_inventory_into_wc() function owned by VeeqoClient.php.
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

/** Return redacted inventory readiness. */
function dtb_veeqo_inventory_readiness(): array {
	$config  = function_exists( 'dtb_veeqo_config' ) ? dtb_veeqo_config() : [];
	$missing = [];
	if ( empty( $config['api_key'] ) ) {
		$missing[] = 'api_key';
	}
	$warehouse_id = absint( $config['warehouse_id'] ?? 0 );
	if ( $warehouse_id <= 0 ) {
		$missing[] = 'warehouse_id';
	}
	return [
		'ready'        => empty( $missing ),
		'missing'      => $missing,
		'warehouse_id' => $warehouse_id,
	];
}

/** Acquire an atomic, expiring reconciliation lock. */
function dtb_veeqo_inventory_acquire_lock( int $ttl = 20 * MINUTE_IN_SECONDS ): string {
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
	$deleted = $wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s",
			DTB_VEEQO_INVENTORY_LOCK_OPTION,
			$current_raw
		)
	);
	wp_cache_delete( DTB_VEEQO_INVENTORY_LOCK_OPTION, 'options' );
	return 1 === $deleted && add_option( DTB_VEEQO_INVENTORY_LOCK_OPTION, $value, '', 'no' ) ? $token : '';
}

/** Release a lock only when the caller still owns it. */
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
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s",
			DTB_VEEQO_INVENTORY_LOCK_OPTION,
			$current_raw
		)
	);
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

/** Normalize a Veeqo stock entry without inventing unknown quantities. */
function dtb_veeqo_inventory_normalize_stock_entry( array $entry ): ?array {
	if ( ! empty( $entry['infinite'] ) ) {
		return [ 'available' => 0, 'infinite' => true ];
	}
	if ( is_numeric( $entry['available_stock_level'] ?? null ) ) {
		$available = (int) $entry['available_stock_level'];
	} elseif ( is_numeric( $entry['available_stock'] ?? null ) ) {
		$available = (int) $entry['available_stock'];
	} else {
		return null;
	}
	return [ 'available' => max( 0, $available ), 'infinite' => false ];
}

/** Return exact WooCommerce product IDs for the requested SKUs in one query. */
function dtb_veeqo_inventory_woo_ids_for_skus( array $skus ): array {
	global $wpdb;
	$skus = array_values(
		array_unique(
			array_filter(
				array_map( static fn( $sku ): string => trim( (string) $sku ), $skus ),
				static fn( string $sku ): bool => '' !== $sku
			)
		)
	);
	if ( empty( $skus ) ) {
		return [];
	}

	$lookup_table = $wpdb->prefix . 'wc_product_meta_lookup';
	$placeholders = implode( ', ', array_fill( 0, count( $skus ), '%s' ) );
	$query        = $wpdb->prepare(
		"SELECT sku, product_id FROM {$lookup_table} WHERE sku IN ({$placeholders}) ORDER BY sku ASC, product_id ASC",
		...$skus
	);
	$rows = $wpdb->get_results( $query, ARRAY_A );
	$map  = [];
	foreach ( (array) $rows as $row ) {
		$sku        = (string) ( $row['sku'] ?? '' );
		$product_id = absint( $row['product_id'] ?? 0 );
		if ( '' === $sku || $product_id <= 0 ) {
			continue;
		}
		$map[ $sku ] ??= [];
		if ( count( $map[ $sku ] ) < 3 ) {
			$map[ $sku ][] = $product_id;
		}
	}
	return $map;
}

/** Reconcile one Veeqo products page into WooCommerce. */
function dtb_veeqo_inventory_reconcile_page( int $page = 1, int $per_page = 100, bool $dry_run = false ) {
	$readiness = dtb_veeqo_inventory_readiness();
	if ( empty( $readiness['ready'] ) ) {
		return new WP_Error( 'veeqo_inventory_not_ready', 'Veeqo inventory projection is not configured.', [ 'status' => 503, 'missing' => $readiness['missing'] ] );
	}
	if ( ! function_exists( 'wc_get_product' ) ) {
		return new WP_Error( 'woocommerce_unavailable', 'WooCommerce product APIs are unavailable.', [ 'status' => 503 ] );
	}

	$result = dtb_veeqo_request(
		'GET',
		'/products',
		[ 'page' => (string) max( 1, $page ), 'page_size' => (string) min( 100, max( 1, $per_page ) ) ]
	);
	if ( empty( $result['ok'] ) || ! is_array( $result['data'] ?? null ) ) {
		return new WP_Error(
			'veeqo_inventory_fetch_failed',
			sanitize_text_field( (string) ( $result['error'] ?? 'Veeqo inventory fetch failed.' ) ),
			[ 'status' => (int) ( $result['status'] ?? 502 ) ]
		);
	}

	$report = [
		'page'                      => max( 1, $page ),
		'products_received'         => count( $result['data'] ),
		'sellables_seen'            => 0,
		'updated'                   => 0,
		'unchanged'                 => 0,
		'mapped'                    => 0,
		'unmapped_skus'             => [],
		'duplicate_skus'            => [],
		'missing_warehouse_entries' => [],
		'invalid_stock_entries'     => [],
		'parent_ids'                => [],
	];
	$page_skus = [];
	foreach ( $result['data'] as $veeqo_product ) {
		foreach ( (array) ( is_array( $veeqo_product ) ? ( $veeqo_product['sellables'] ?? [] ) : [] ) as $sellable ) {
			$sku = is_array( $sellable ) ? trim( sanitize_text_field( (string) ( $sellable['sku_code'] ?? '' ) ) ) : '';
			if ( '' !== $sku ) {
				$page_skus[] = $sku;
			}
		}
	}
	$woo_ids_by_sku = dtb_veeqo_inventory_woo_ids_for_skus( $page_skus );
	$warehouse_id   = (int) $readiness['warehouse_id'];

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
			$woo_ids = (array) ( $woo_ids_by_sku[ $sku ] ?? [] );
			if ( count( $woo_ids ) > 1 ) {
				$report['duplicate_skus'][ $sku ] = $woo_ids;
				continue;
			}
			$product_id = absint( $woo_ids[0] ?? 0 );
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
			if ( ! $product instanceof WC_Product || trim( (string) $product->get_sku() ) !== $sku || ! in_array( $product->get_type(), [ 'simple', 'variation' ], true ) ) {
				$report['unmapped_skus'][] = $sku;
				continue;
			}

			$sellable_id  = absint( $sellable['id'] ?? 0 );
			$needs_meta   = $sellable_id > 0 && ( absint( $product->get_meta( '_veeqo_sellable_id', true ) ) !== $sellable_id || (string) $product->get_meta( '_veeqo_mapped_sku', true ) !== $sku );
			$target_status = $stock['infinite'] || $stock['available'] > 0 ? 'instock' : ( $product->backorders_allowed() ? 'onbackorder' : 'outofstock' );
			$needs_stock  = $stock['infinite']
				? ( $product->managing_stock() || ! $product->is_in_stock() )
				: ( ! $product->managing_stock() || (int) $product->get_stock_quantity() !== $stock['available'] || $product->get_stock_status() !== $target_status );
			if ( $needs_meta ) {
				$report['mapped']++;
			}
			if ( ! $needs_meta && ! $needs_stock ) {
				$report['unchanged']++;
				continue;
			}
			$report['updated']++;
			if ( $dry_run ) {
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

/** Reconcile the complete paginated Veeqo catalog under one lock. */
function dtb_veeqo_inventory_reconcile_all( bool $dry_run = false ) {
	$token = dtb_veeqo_inventory_acquire_lock();
	if ( '' === $token ) {
		return new WP_Error( 'veeqo_inventory_locked', 'A Veeqo inventory reconciliation is already running.', [ 'status' => 409 ] );
	}
	$aggregate = [
		'pages' => 0, 'sellables_seen' => 0, 'updated' => 0, 'unchanged' => 0, 'mapped' => 0,
		'unmapped_skus' => [], 'duplicate_skus' => [], 'missing_warehouse_entries' => [],
		'invalid_stock_entries' => [], 'dry_run' => $dry_run, 'started_at' => gmdate( 'c' ),
	];
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
				'pages' => $aggregate['pages'], 'sellables_seen' => $aggregate['sellables_seen'],
				'updated' => $aggregate['updated'], 'unmapped_count' => count( $aggregate['unmapped_skus'] ),
				'duplicate_count' => count( $aggregate['duplicate_skus'] ), 'dry_run' => $dry_run,
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

/** Schedule one recurring canonical inventory reconciliation. */
function dtb_veeqo_inventory_schedule_recurring(): void {
	if ( empty( dtb_veeqo_inventory_readiness()['ready'] ) || ! function_exists( 'as_schedule_recurring_action' ) ) {
		return;
	}
	$already = function_exists( 'as_has_scheduled_action' )
		? as_has_scheduled_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP )
		: false;
	if ( ! $already ) {
		as_schedule_recurring_action( time() + 60, DTB_VEEQO_INVENTORY_INTERVAL_SECONDS, DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP, true );
	}
}
add_action( 'init', 'dtb_veeqo_inventory_schedule_recurring', 40 );
add_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, 'dtb_veeqo_inventory_scheduled_run', 10, 1 );

/** Execute the recurring worker with bounded retry for transient failures. */
function dtb_veeqo_inventory_scheduled_run( int $attempt = 0 ): void {
	$result = dtb_veeqo_inventory_reconcile_all( false );
	if ( ! is_wp_error( $result ) ) {
		return;
	}
	$data      = $result->get_error_data();
	$status    = is_array( $data ) ? (int) ( $data['status'] ?? 0 ) : 0;
	$retryable = 0 === $status || 408 === $status || 425 === $status || 429 === $status || $status >= 500;
	if ( $retryable && $attempt < DTB_VEEQO_INVENTORY_MAX_RETRIES && function_exists( 'as_schedule_single_action' ) ) {
		$delay = min( HOUR_IN_SECONDS, ( 2 ** $attempt ) * 5 * MINUTE_IN_SECONDS );
		as_schedule_single_action( time() + $delay, DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [ $attempt + 1 ], DTB_VEEQO_INVENTORY_ACTION_GROUP, true );
	}
	if ( function_exists( 'dtb_veeqo_log' ) ) {
		dtb_veeqo_log( 'error', 'inventory_reconciliation_failed', 'Veeqo inventory reconciliation failed.', [
			'attempt' => $attempt, 'retryable' => $retryable, 'status' => $status,
			'error' => sanitize_text_field( $result->get_error_message() ),
		] );
	}
}
