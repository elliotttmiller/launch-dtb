<?php
/**
 * Veeqo admin inventory read model.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/** Build an exact WooCommerce projection map for a page of SKUs. */
function dtb_veeqo_admin_woo_projection_for_skus( array $skus ): array {
	if ( ! function_exists( 'dtb_veeqo_inventory_woo_ids_for_skus' ) || ! function_exists( 'wc_get_product' ) ) {
		return [];
	}
	$ids_by_sku = dtb_veeqo_inventory_woo_ids_for_skus( $skus );
	$map         = [];
	foreach ( $ids_by_sku as $sku => $ids ) {
		$ids = array_values( array_filter( array_map( 'absint', (array) $ids ) ) );
		if ( count( $ids ) > 1 ) {
			$map[ $sku ] = [ 'state' => 'duplicate', 'product_ids' => $ids ];
			continue;
		}
		$product = ! empty( $ids[0] ) ? wc_get_product( $ids[0] ) : null;
		if ( ! $product instanceof WC_Product ) {
			continue;
		}
		$map[ $sku ] = [
			'state'             => 'mapped',
			'product_id'        => $product->get_id(),
			'parent_id'         => $product->get_parent_id(),
			'manage_stock'      => $product->managing_stock(),
			'stock_quantity'    => $product->get_stock_quantity(),
			'stock_status'      => $product->get_stock_status(),
			'veeqo_sellable_id' => absint( $product->get_meta( '_veeqo_sellable_id', true ) ),
			'edit_url'          => get_edit_post_link( $product->get_id(), 'raw' ),
		];
	}
	return $map;
}

/** Normalize one Veeqo stock entry for the dashboard. */
function dtb_veeqo_admin_normalize_stock_entry( ?array $entry ): array {
	if ( null === $entry ) {
		return [
			'valid'          => false,
			'warehouse_id'   => 0,
			'warehouse_name' => '',
			'location'       => '',
			'physical'       => null,
			'allocated'      => null,
			'available'      => null,
			'incoming'       => null,
			'infinite'       => false,
			'low_stock'      => false,
			'updated_at'     => '',
		];
	}
	$numeric = static function ( array $source, string $key ): ?int {
		return array_key_exists( $key, $source ) && is_numeric( $source[ $key ] ) ? (int) $source[ $key ] : null;
	};
	$available = $numeric( $entry, 'available_stock_level' );
	if ( null === $available ) {
		$available = $numeric( $entry, 'available_stock' );
	}
	return [
		'valid'          => ! empty( $entry['infinite'] ) || null !== $available,
		'warehouse_id'   => absint( $entry['warehouse_id'] ?? ( $entry['warehouse']['id'] ?? 0 ) ),
		'warehouse_name' => sanitize_text_field( (string) ( $entry['warehouse']['name'] ?? $entry['warehouse_name'] ?? '' ) ),
		'location'       => sanitize_text_field( (string) ( $entry['location'] ?? '' ) ),
		'physical'       => $numeric( $entry, 'physical_stock_level' ),
		'allocated'      => $numeric( $entry, 'allocated_stock_level' ),
		'available'      => $available,
		'incoming'       => $numeric( $entry, 'incoming_stock_level' ),
		'infinite'       => ! empty( $entry['infinite'] ),
		'low_stock'      => ! empty( $entry['stock_running_low'] ),
		'updated_at'     => sanitize_text_field( (string) ( $entry['updated_at'] ?? '' ) ),
	];
}

/** Return a paginated, normalized Veeqo inventory page. */
function dtb_veeqo_admin_inventory_page( array $args ) {
	$config       = function_exists( 'dtb_veeqo_config' ) ? dtb_veeqo_config() : [];
	$page         = max( 1, absint( $args['page'] ?? 1 ) );
	$per_page     = min( DTB_VEEQO_ADMIN_MAX_PAGE_SIZE, max( 1, absint( $args['per_page'] ?? 50 ) ) );
	$query        = trim( sanitize_text_field( (string) ( $args['query'] ?? '' ) ) );
	$stock_filter = sanitize_key( (string) ( $args['stock'] ?? 'all' ) );
	$warehouse_id = absint( $args['warehouse_id'] ?? ( $config['warehouse_id'] ?? 0 ) );
	$force        = ! empty( $args['force'] );

	$params = [
		'page'      => (string) $page,
		'page_size' => (string) $per_page,
	];
	if ( '' !== $query ) {
		$params['query'] = $query;
	}
	if ( $warehouse_id > 0 ) {
		$params['warehouse_id'] = (string) $warehouse_id;
	}

	$response = dtb_veeqo_admin_cached_get( '/products', $params, DTB_VEEQO_ADMIN_CACHE_TTL, $force );
	if ( is_wp_error( $response ) ) {
		return $response;
	}
	$products = dtb_veeqo_admin_extract_list( $response['data'], 'products' );
	$skus     = [];
	foreach ( $products as $product ) {
		if ( ! is_array( $product ) ) {
			continue;
		}
		foreach ( (array) ( $product['sellables'] ?? [] ) as $sellable ) {
			if ( is_array( $sellable ) ) {
				$sku = trim( (string) ( $sellable['sku_code'] ?? '' ) );
				if ( '' !== $sku ) {
					$skus[] = $sku;
				}
			}
		}
	}
	$woo_map = dtb_veeqo_admin_woo_projection_for_skus( $skus );
	$items   = [];

	foreach ( $products as $product ) {
		if ( ! is_array( $product ) ) {
			continue;
		}
		$product_id   = absint( $product['id'] ?? 0 );
		$product_name = sanitize_text_field( (string) ( $product['title'] ?? '' ) );
		$image_url    = esc_url_raw( (string) ( $product['main_image_src'] ?? $product['image'] ?? ( $product['main_image']['src'] ?? '' ) ) );
		$tags         = [];
		foreach ( (array) ( $product['tags'] ?? [] ) as $tag ) {
			$name = is_array( $tag ) ? sanitize_text_field( (string) ( $tag['name'] ?? '' ) ) : sanitize_text_field( (string) $tag );
			if ( '' !== $name ) {
				$tags[] = $name;
			}
		}
		$channel_names = [];
		foreach ( (array) ( $product['active_channels'] ?? [] ) as $channel ) {
			$name = is_array( $channel ) ? sanitize_text_field( (string) ( $channel['name'] ?? $channel['short_name'] ?? '' ) ) : '';
			if ( '' !== $name ) {
				$channel_names[] = $name;
			}
		}

		foreach ( (array) ( $product['sellables'] ?? [] ) as $sellable ) {
			if ( ! is_array( $sellable ) ) {
				continue;
			}
			$sku = trim( sanitize_text_field( (string) ( $sellable['sku_code'] ?? '' ) ) );
			if ( '' === $sku ) {
				continue;
			}
			$entry = function_exists( 'dtb_veeqo_inventory_stock_entry_for_warehouse' )
				? dtb_veeqo_inventory_stock_entry_for_warehouse( $sellable, $warehouse_id )
				: null;
			$stock = dtb_veeqo_admin_normalize_stock_entry( $entry );
			$woo   = $woo_map[ $sku ] ?? [ 'state' => 'unmapped' ];
			$drift = 'unknown';
			if ( 'duplicate' === ( $woo['state'] ?? '' ) ) {
				$drift = 'duplicate';
			} elseif ( 'mapped' !== ( $woo['state'] ?? '' ) ) {
				$drift = 'unmapped';
			} elseif ( empty( $stock['valid'] ) ) {
				$drift = 'unknown';
			} elseif ( ! empty( $stock['infinite'] ) ) {
				$drift = empty( $woo['manage_stock'] ) && 'instock' === ( $woo['stock_status'] ?? '' ) ? 'in_sync' : 'drift';
			} else {
				$target_status = (int) $stock['available'] > 0 ? 'instock' : 'outofstock';
				$drift = ! empty( $woo['manage_stock'] )
					&& (int) ( $woo['stock_quantity'] ?? 0 ) === (int) $stock['available']
					&& $target_status === (string) ( $woo['stock_status'] ?? '' )
					? 'in_sync'
					: 'drift';
			}

			$item = [
				'product_id'        => $product_id,
				'sellable_id'       => absint( $sellable['id'] ?? 0 ),
				'product_name'      => $product_name,
				'variant_name'      => sanitize_text_field( (string) ( $sellable['title'] ?? '' ) ),
				'full_title'        => sanitize_text_field( (string) ( $sellable['full_title'] ?? $sellable['product_title'] ?? $product_name ) ),
				'sku'               => $sku,
				'type'              => sanitize_key( (string) ( $sellable['type'] ?? '' ) ),
				'image_url'         => $image_url,
				'tags'              => array_values( array_unique( $tags ) ),
				'channels'          => array_values( array_unique( $channel_names ) ),
				'stock'             => $stock,
				'woo'               => $woo,
				'drift'             => $drift,
				'updated_at'        => sanitize_text_field( (string) ( $sellable['updated_at'] ?? $product['updated_at'] ?? '' ) ),
				'min_reorder_level' => is_numeric( $sellable['min_reorder_level'] ?? null ) ? (int) $sellable['min_reorder_level'] : null,
			];

			$include = true;
			switch ( $stock_filter ) {
				case 'low':
					$include = ! empty( $stock['low_stock'] );
					break;
				case 'out':
					$include = empty( $stock['infinite'] ) && null !== $stock['available'] && (int) $stock['available'] <= 0;
					break;
				case 'in':
					$include = ! empty( $stock['infinite'] ) || ( null !== $stock['available'] && (int) $stock['available'] > 0 );
					break;
				case 'drift':
					$include = 'drift' === $drift;
					break;
				case 'unmapped':
					$include = in_array( $drift, [ 'unmapped', 'duplicate' ], true );
					break;
				case 'kit':
					$include = false !== stripos( (string) ( $sellable['type'] ?? '' ), 'kit' );
					break;
			}
			if ( $include ) {
				$items[] = $item;
			}
		}
	}

	$summary = [ 'all' => count( $items ), 'low' => 0, 'out' => 0, 'in' => 0, 'drift' => 0, 'unmapped' => 0, 'kit' => 0 ];
	foreach ( $items as $item ) {
		$stock = (array) $item['stock'];
		if ( ! empty( $stock['low_stock'] ) ) {
			$summary['low']++;
		}
		if ( ! empty( $stock['infinite'] ) || ( null !== $stock['available'] && (int) $stock['available'] > 0 ) ) {
			$summary['in']++;
		} elseif ( null !== $stock['available'] ) {
			$summary['out']++;
		}
		if ( 'drift' === $item['drift'] ) {
			$summary['drift']++;
		}
		if ( in_array( $item['drift'], [ 'unmapped', 'duplicate' ], true ) ) {
			$summary['unmapped']++;
		}
		if ( false !== stripos( (string) $item['type'], 'kit' ) ) {
			$summary['kit']++;
		}
	}

	return [
		'page'         => $page,
		'per_page'     => $per_page,
		'has_previous' => $page > 1,
		'has_next'     => count( $products ) === $per_page,
		'warehouse_id' => $warehouse_id,
		'items'        => $items,
		'summary'      => $summary,
		'filter_scope' => 'current_page',
		'cached'       => (bool) $response['cached'],
		'stale'        => (bool) $response['stale'],
		'fetched_at'   => $response['fetched_at'],
	];
}
