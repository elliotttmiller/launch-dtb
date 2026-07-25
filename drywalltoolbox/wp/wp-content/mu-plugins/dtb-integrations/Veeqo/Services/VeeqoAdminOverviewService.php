<?php
/**
 * Veeqo admin overview, resources, and exception read models.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/** Return redacted configuration resources for the dashboard settings view. */
function dtb_veeqo_admin_resources( bool $force = false ): array {
	$diagnostics = defined( 'DTB_VEEQO_CONFIGURATION_DIAGNOSTICS_OPTION' )
		? (array) get_option( DTB_VEEQO_CONFIGURATION_DIAGNOSTICS_OPTION, [] )
		: [];
	if ( $force || empty( $diagnostics['warehouse_candidates'] ) ) {
		$diagnostics = function_exists( 'dtb_veeqo_production_validate_configuration' )
			? dtb_veeqo_production_validate_configuration( false )
			: $diagnostics;
	}
	$config = function_exists( 'dtb_veeqo_config' ) ? dtb_veeqo_config() : [];
	return [
		'channels'         => array_values( (array) ( $diagnostics['channel_candidates'] ?? [] ) ),
		'warehouses'       => array_values( (array) ( $diagnostics['warehouse_candidates'] ?? [] ) ),
		'delivery_methods' => array_values( (array) ( $diagnostics['delivery_candidates'] ?? [] ) ),
		'carriers'         => [
			[ 'id' => 1, 'name' => 'Royal Mail' ],
			[ 'id' => 2, 'name' => 'FedEx' ],
			[ 'id' => 3, 'name' => 'Other' ],
			[ 'id' => 4, 'name' => 'DPD' ],
			[ 'id' => 5, 'name' => 'UPS' ],
			[ 'id' => 7, 'name' => 'USPS' ],
			[ 'id' => 9, 'name' => 'DHL' ],
			[ 'id' => 11, 'name' => 'Australia Post' ],
			[ 'id' => 12, 'name' => 'Parcelforce' ],
			[ 'id' => 13, 'name' => 'TNT' ],
			[ 'id' => 14, 'name' => 'Yodel' ],
			[ 'id' => 19, 'name' => 'Canada Post' ],
		],
		'errors'           => array_values( array_map( 'sanitize_text_field', (array) ( $diagnostics['errors'] ?? [] ) ) ),
		'selected'         => [
			'channel_id'         => absint( $config['channel_id'] ?? 0 ),
			'warehouse_id'       => absint( $config['warehouse_id'] ?? 0 ),
			'delivery_method_id' => absint( $config['delivery_method_id'] ?? 0 ),
		],
		'locked'           => [
			'channel_id'         => defined( 'DTB_VEEQO_CHANNEL_ID' ) && (int) DTB_VEEQO_CHANNEL_ID > 0,
			'warehouse_id'       => defined( 'DTB_VEEQO_WAREHOUSE_ID' ) && (int) DTB_VEEQO_WAREHOUSE_ID > 0,
			'delivery_method_id' => defined( 'DTB_VEEQO_DELIVERY_METHOD_ID' ) && (int) DTB_VEEQO_DELIVERY_METHOD_ID > 0,
		],
	];
}

/** Return fast local inventory KPIs from WooCommerce's Veeqo projection. */
function dtb_veeqo_admin_local_inventory_kpis(): array {
	global $wpdb;
	$lookup = $wpdb->prefix . 'wc_product_meta_lookup';
	$posts  = $wpdb->posts;
	$row = $wpdb->get_row(
		"SELECT
			COUNT(*) AS total,
			SUM(CASE WHEN l.stock_status = 'instock' THEN 1 ELSE 0 END) AS in_stock,
			SUM(CASE WHEN l.stock_status = 'outofstock' THEN 1 ELSE 0 END) AS out_of_stock,
			SUM(CASE WHEN l.stock_quantity IS NOT NULL AND l.stock_quantity > 0 AND l.stock_quantity <= 5 THEN 1 ELSE 0 END) AS low_stock
		 FROM {$lookup} l
		 INNER JOIN {$posts} p ON p.ID = l.product_id
		 WHERE l.sku <> ''
		   AND p.post_type IN ('product','product_variation')
		   AND p.post_status = 'publish'",
		ARRAY_A
	); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- static table names and clauses only.
	return [
		'total'        => absint( $row['total'] ?? 0 ),
		'in_stock'     => absint( $row['in_stock'] ?? 0 ),
		'out_of_stock' => absint( $row['out_of_stock'] ?? 0 ),
		'low_stock'    => absint( $row['low_stock'] ?? 0 ),
	];
}

/** Return the control-center overview without exposing credentials. */
function dtb_veeqo_admin_overview(): array {
	$config    = function_exists( 'dtb_veeqo_config' ) ? dtb_veeqo_config() : [];
	$inventory = defined( 'DTB_VEEQO_INVENTORY_DIAGNOSTICS' ) ? (array) get_option( DTB_VEEQO_INVENTORY_DIAGNOSTICS, [] ) : [];
	$coverage  = function_exists( 'dtb_veeqo_inventory_coverage_audit' ) ? dtb_veeqo_inventory_coverage_audit( 25 ) : [];
	$last_sync = class_exists( 'DTB_VeeqoSyncJob' ) ? DTB_VeeqoSyncJob::last_timestamp( 'inventory' ) : 0;
	$queue     = [
		'inventory_scheduled' => function_exists( 'as_has_scheduled_action' ) && defined( 'DTB_VEEQO_INVENTORY_RECONCILE_HOOK' )
			? (bool) as_has_scheduled_action( DTB_VEEQO_INVENTORY_RECONCILE_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP )
			: false,
		'admin_operation_scheduled' => function_exists( 'as_has_scheduled_action' ) && defined( 'DTB_VEEQO_ADMIN_OPERATION_HOOK' )
			? (bool) as_has_scheduled_action( DTB_VEEQO_ADMIN_OPERATION_HOOK, [], DTB_VEEQO_INVENTORY_ACTION_GROUP )
			: false,
	];
	return [
		'connection' => [
			'api_key_configured' => ! empty( $config['api_key'] ),
			'channel_id'         => absint( $config['channel_id'] ?? 0 ),
			'warehouse_id'       => absint( $config['warehouse_id'] ?? 0 ),
			'delivery_method_id' => absint( $config['delivery_method_id'] ?? 0 ),
		],
		'production_readiness' => function_exists( 'dtb_veeqo_production_readiness' ) ? dtb_veeqo_production_readiness() : [ 'ready' => false ],
		'inventory_readiness'  => function_exists( 'dtb_veeqo_inventory_readiness' ) ? dtb_veeqo_inventory_readiness() : [ 'ready' => false ],
		'inventory_kpis'       => dtb_veeqo_admin_local_inventory_kpis(),
		'coverage'             => $coverage,
		'last_reconciliation'  => $inventory,
		'last_sync_at'         => $last_sync > 0 ? gmdate( 'c', $last_sync ) : '',
		'stale'                => $last_sync <= 0 || time() - $last_sync > 2 * HOUR_IN_SECONDS,
		'queue'                => $queue,
		'recent_operations'    => function_exists( 'dtb_veeqo_admin_operations_recent' ) ? dtb_veeqo_admin_operations_recent( 10 ) : [],
	];
}

/** Return redacted integration exceptions and reconciliation drift. */
function dtb_veeqo_admin_exceptions(): array {
	$diagnostics = defined( 'DTB_VEEQO_INVENTORY_DIAGNOSTICS' ) ? (array) get_option( DTB_VEEQO_INVENTORY_DIAGNOSTICS, [] ) : [];
	$coverage    = function_exists( 'dtb_veeqo_inventory_coverage_audit' ) ? dtb_veeqo_inventory_coverage_audit( 100 ) : [];
	$failed_ops  = [];
	if ( function_exists( 'dtb_veeqo_admin_operations_recent' ) ) {
		foreach ( dtb_veeqo_admin_operations_recent( 50 ) as $operation ) {
			if ( 'failed' === ( $operation['status'] ?? '' ) ) {
				$failed_ops[] = $operation;
			}
		}
	}
	return [
		'unmapped_skus'             => array_values( array_slice( array_map( 'sanitize_text_field', (array) ( $diagnostics['unmapped_skus'] ?? [] ) ), 0, 500 ) ),
		'duplicate_skus'            => array_slice( (array) ( $diagnostics['duplicate_skus'] ?? [] ), 0, 500, true ),
		'missing_warehouse_entries' => array_values( array_slice( array_map( 'sanitize_text_field', (array) ( $diagnostics['missing_warehouse_entries'] ?? [] ) ), 0, 500 ) ),
		'invalid_stock_entries'     => array_values( array_slice( array_map( 'sanitize_text_field', (array) ( $diagnostics['invalid_stock_entries'] ?? [] ) ), 0, 500 ) ),
		'coverage_unmapped_sample'  => array_values( (array) ( $coverage['unmapped_sample'] ?? [] ) ),
		'coverage_duplicates'       => array_values( (array) ( $coverage['duplicate_skus'] ?? [] ) ),
		'failed_operations'         => $failed_ops,
	];
}
