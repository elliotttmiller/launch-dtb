<?php
/**
 * DTB Catalog Platform — Pricing Manager service.
 *
 * Provides a bounded, WooCommerce-backed read model and the small set of
 * mutations required by the wp-admin pricing workspace. WooCommerce remains
 * authoritative for runtime product prices and native cost of goods.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_PRICING_TARGET_MARGIN_OPTION = 'dtb_catalog_pricing_target_margin';
const DTB_PRICING_MAP_PRICE_META       = '_dtb_map_price';
const DTB_PRICING_MAP_SOURCE_META      = '_dtb_map_source';
const DTB_PRICING_INDEX_TRANSIENT      = 'dtb_catalog_pricing_index_v1';

/** Return the configured default target gross margin percentage. */
function dtb_pricing_get_target_margin(): float {
	$value = (float) get_option( DTB_PRICING_TARGET_MARGIN_OPTION, 30 );
	return min( 95, max( 1, $value ) );
}

/** Persist the default target gross margin percentage. */
function dtb_pricing_set_target_margin( float $margin ): float {
	$margin = min( 95, max( 1, round( $margin, 2 ) ) );
	update_option( DTB_PRICING_TARGET_MARGIN_OPTION, $margin, false );
	dtb_pricing_invalidate_index();
	return $margin;
}

/** Clear the short-lived pricing read-model cache. */
function dtb_pricing_invalidate_index(): void {
	delete_transient( DTB_PRICING_INDEX_TRANSIENT );
}

add_action( 'woocommerce_update_product', 'dtb_pricing_invalidate_index', 10, 0 );
add_action( 'woocommerce_update_product_variation', 'dtb_pricing_invalidate_index', 10, 0 );
add_action( 'woocommerce_delete_product', 'dtb_pricing_invalidate_index', 10, 0 );

/**
 * Resolve native WooCommerce Cost of Goods for a product.
 *
 * @return float|null
 */
function dtb_pricing_product_cost( WC_Product $product ): ?float {
	if ( ! method_exists( $product, 'get_cogs_value' ) ) {
		return null;
	}

	$value = $product->get_cogs_value( 'edit' );
	if ( '' === $value || null === $value || ! is_numeric( $value ) ) {
		return null;
	}

	$cost = (float) $value;
	return $cost > 0 ? $cost : null;
}

/** Resolve DTB-owned MAP evidence stored on the WooCommerce product record. */
function dtb_pricing_product_map_price( WC_Product $product ): ?float {
	$value = $product->get_meta( DTB_PRICING_MAP_PRICE_META, true, 'edit' );
	if ( '' === $value || null === $value || ! is_numeric( $value ) ) {
		return null;
	}

	$map = (float) $value;
	return $map > 0 ? $map : null;
}

/** Return a compact brand label from the native WooCommerce brand taxonomy. */
function dtb_pricing_product_brand( WC_Product $product ): string {
	if ( ! taxonomy_exists( 'product_brand' ) ) {
		return '';
	}

	$object_id = $product->is_type( 'variation' ) ? $product->get_parent_id() : $product->get_id();
	$terms     = get_the_terms( $object_id, 'product_brand' );
	if ( ! is_array( $terms ) || [] === $terms ) {
		return '';
	}

	return implode( ', ', array_map( static fn( WP_Term $term ): string => $term->name, $terms ) );
}

/** Calculate gross margin percentage. */
function dtb_pricing_gross_margin( ?float $price, ?float $cost ): ?float {
	if ( null === $price || null === $cost || $price <= 0 ) {
		return null;
	}

	return round( ( ( $price - $cost ) / $price ) * 100, 2 );
}

/** Calculate markup percentage. */
function dtb_pricing_markup( ?float $price, ?float $cost ): ?float {
	if ( null === $price || null === $cost || $cost <= 0 ) {
		return null;
	}

	return round( ( ( $price - $cost ) / $cost ) * 100, 2 );
}

/** Calculate the minimum price required to reach a target gross margin. */
function dtb_pricing_target_price( ?float $cost, float $target_margin ): ?float {
	if ( null === $cost || $cost <= 0 || $target_margin <= 0 || $target_margin >= 100 ) {
		return null;
	}

	return round( $cost / ( 1 - ( $target_margin / 100 ) ), 2 );
}

/**
 * Convert a WooCommerce price-owning product into the pricing workspace row.
 *
 * Variable parents are intentionally excluded from this function because their
 * prices are projections of child variations rather than independently owned
 * prices.
 *
 * @return array<string,mixed>
 */
function dtb_pricing_product_snapshot( WC_Product $product, ?float $target_margin = null ): array {
	$target_margin = null === $target_margin ? dtb_pricing_get_target_margin() : $target_margin;
	$regular_raw   = $product->get_regular_price( 'edit' );
	$sale_raw      = $product->get_sale_price( 'edit' );
	$effective_raw = $product->get_price( 'edit' );
	$regular       = is_numeric( $regular_raw ) ? (float) $regular_raw : null;
	$sale          = is_numeric( $sale_raw ) ? (float) $sale_raw : null;
	$effective     = is_numeric( $effective_raw ) ? (float) $effective_raw : null;
	$cost          = dtb_pricing_product_cost( $product );
	$map           = dtb_pricing_product_map_price( $product );
	$margin        = dtb_pricing_gross_margin( $effective, $cost );
	$markup        = dtb_pricing_markup( $effective, $cost );
	$target_price  = dtb_pricing_target_price( $cost, $target_margin );
	$suggested     = $target_price;
	$on_sale       = $product->is_on_sale( 'edit' );

	if ( null !== $map ) {
		$suggested = null === $suggested ? $map : max( $suggested, $map );
	}
	if ( null !== $suggested ) {
		$suggested = round( $suggested, 2 );
	}

	$status       = 'healthy';
	$status_label = __( 'Healthy', 'drywall-toolbox' );

	if ( null === $regular || $regular <= 0 ) {
		$status       = 'missing_price';
		$status_label = __( 'Missing price', 'drywall-toolbox' );
	} elseif ( null === $cost ) {
		$status       = 'missing_cost';
		$status_label = __( 'Missing cost', 'drywall-toolbox' );
	} elseif ( $on_sale ) {
		// Sale prices are intentionally review-only in V1. The optimizer applies
		// regular-price changes and must not imply that changing regular price
		// replaces an active WooCommerce sale price.
		$status       = 'sale_active';
		$status_label = __( 'Sale active', 'drywall-toolbox' );
	} elseif ( null !== $map && null !== $effective && $effective < $map ) {
		$status       = 'below_map';
		$status_label = __( 'Below MAP', 'drywall-toolbox' );
	} elseif ( null !== $margin && $margin + 0.005 < $target_margin ) {
		$status       = 'below_target';
		$status_label = __( 'Below target', 'drywall-toolbox' );
	}

	$image_id  = $product->get_image_id();
	$image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'thumbnail' ) : false;

	return [
		'id'              => $product->get_id(),
		'parent_id'       => $product->get_parent_id(),
		'type'            => $product->get_type(),
		'name'            => wp_strip_all_tags( $product->get_name() ),
		'sku'             => (string) $product->get_sku( 'edit' ),
		'brand'           => dtb_pricing_product_brand( $product ),
		'catalog_status'  => $product->get_status( 'edit' ),
		'regular_price'   => $regular,
		'sale_price'      => $sale,
		'effective_price' => $effective,
		'cost'            => $cost,
		'map_price'       => $map,
		'map_source'      => sanitize_text_field( (string) $product->get_meta( DTB_PRICING_MAP_SOURCE_META, true, 'edit' ) ),
		'gross_profit'    => null !== $effective && null !== $cost ? round( $effective - $cost, 2 ) : null,
		'gross_margin'    => $margin,
		'markup'          => $markup,
		'target_margin'   => $target_margin,
		'target_price'    => $target_price,
		'suggested_price' => $suggested,
		'status'          => $status,
		'status_label'    => $status_label,
		'on_sale'         => $on_sale,
		'image_url'       => $image_url ? esc_url_raw( $image_url ) : '',
		'edit_url'        => esc_url_raw( get_edit_post_link( $product->get_id(), 'raw' ) ?: '' ),
	];
}

/**
 * Build a short-lived, flat index of price-owning product records.
 *
 * Top-level WooCommerce products are read in bounded batches. Variable parents
 * contribute their child variations; the parent itself is not duplicated as a
 * price record.
 *
 * @return array<int,array<string,mixed>>
 */
function dtb_pricing_build_index(): array {
	$cached = get_transient( DTB_PRICING_INDEX_TRANSIENT );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	$rows          = [];
	$page          = 1;
	$per_page      = 100;
	$target_margin = dtb_pricing_get_target_margin();
	$product_types = array_keys( wc_get_product_types() );

	do {
		$result = wc_get_products(
			[
				'limit'    => $per_page,
				'page'     => $page,
				'paginate' => true,
				'status'   => [ 'publish', 'draft', 'private', 'pending' ],
				'type'     => $product_types,
				'orderby'  => 'ID',
				'order'    => 'ASC',
			]
		);

		$products  = is_object( $result ) && isset( $result->products ) ? (array) $result->products : [];
		$max_pages = is_object( $result ) && isset( $result->max_num_pages ) ? max( 1, (int) $result->max_num_pages ) : 1;

		foreach ( $products as $product ) {
			if ( ! $product instanceof WC_Product ) {
				continue;
			}

			if ( $product->is_type( 'variable' ) ) {
				foreach ( $product->get_children() as $variation_id ) {
					$variation = wc_get_product( $variation_id );
					if ( $variation instanceof WC_Product_Variation ) {
						$rows[] = dtb_pricing_product_snapshot( $variation, $target_margin );
					}
				}
				continue;
			}

			$rows[] = dtb_pricing_product_snapshot( $product, $target_margin );
		}

		++$page;
	} while ( $page <= $max_pages );

	set_transient( DTB_PRICING_INDEX_TRANSIENT, $rows, 2 * MINUTE_IN_SECONDS );
	return $rows;
}

/**
 * Query the cached pricing index for the admin table.
 *
 * @param array<string,mixed> $args Query arguments.
 * @return array<string,mixed>
 */
function dtb_pricing_query_products( array $args = [] ): array {
	$args = wp_parse_args(
		$args,
		[
			'search'    => '',
			'brand'     => '',
			'status'    => '',
			'page'      => 1,
			'per_page'  => 25,
			'sort'      => 'name',
			'direction' => 'asc',
		]
	);

	$search    = strtolower( trim( sanitize_text_field( (string) $args['search'] ) ) );
	$brand     = sanitize_text_field( (string) $args['brand'] );
	$status    = sanitize_key( (string) $args['status'] );
	$page      = max( 1, absint( $args['page'] ) );
	$per_page  = min( 100, max( 10, absint( $args['per_page'] ) ) );
	$sort      = sanitize_key( (string) $args['sort'] );
	$direction = 'desc' === strtolower( (string) $args['direction'] ) ? 'desc' : 'asc';
	$rows      = dtb_pricing_build_index();

	$filtered = array_values(
		array_filter(
			$rows,
			static function ( array $row ) use ( $search, $brand, $status ): bool {
				if ( '' !== $search ) {
					$haystack = strtolower( implode( ' ', [ $row['name'], $row['sku'], $row['brand'] ] ) );
					if ( false === strpos( $haystack, $search ) ) {
						return false;
					}
				}
				if ( '' !== $brand && $row['brand'] !== $brand ) {
					return false;
				}
				if ( '' !== $status && 'all' !== $status && $row['status'] !== $status ) {
					return false;
				}
				return true;
			}
		)
	);

	$sort_map = [
		'name'      => 'name',
		'sku'       => 'sku',
		'price'     => 'effective_price',
		'cost'      => 'cost',
		'margin'    => 'gross_margin',
		'suggested' => 'suggested_price',
	];
	$sort_key = $sort_map[ $sort ] ?? 'name';

	usort(
		$filtered,
		static function ( array $a, array $b ) use ( $sort_key, $direction ): int {
			$av = $a[ $sort_key ] ?? null;
			$bv = $b[ $sort_key ] ?? null;
			if ( $av === $bv ) {
				return 0;
			}
			if ( null === $av ) {
				return 1;
			}
			if ( null === $bv ) {
				return -1;
			}
			$cmp = is_numeric( $av ) && is_numeric( $bv ) ? ( (float) $av <=> (float) $bv ) : strcasecmp( (string) $av, (string) $bv );
			return 'desc' === $direction ? -$cmp : $cmp;
		}
	);

	$total      = count( $filtered );
	$total_page = max( 1, (int) ceil( $total / $per_page ) );
	$page       = min( $page, $total_page );
	$offset     = ( $page - 1 ) * $per_page;

	return [
		'items'       => array_slice( $filtered, $offset, $per_page ),
		'total'       => $total,
		'page'        => $page,
		'per_page'    => $per_page,
		'total_pages' => $total_page,
	];
}

/** Return overall pricing metrics and available table filters. */
function dtb_pricing_get_data_summary(): array {
	$rows   = dtb_pricing_build_index();
	$brands = [];
	$counts = [
		'total'         => count( $rows ),
		'with_cost'     => 0,
		'with_map'      => 0,
		'healthy'       => 0,
		'below_target'  => 0,
		'below_map'     => 0,
		'missing_cost'  => 0,
		'missing_price' => 0,
		'sale_active'   => 0,
	];

	foreach ( $rows as $row ) {
		if ( null !== $row['cost'] ) {
			++$counts['with_cost'];
		}
		if ( null !== $row['map_price'] ) {
			++$counts['with_map'];
		}
		if ( isset( $counts[ $row['status'] ] ) ) {
			++$counts[ $row['status'] ];
		}
		if ( '' !== $row['brand'] ) {
			$brands[ $row['brand'] ] = true;
		}
	}

	$brand_names = array_keys( $brands );
	natcasesort( $brand_names );

	return [
		'counts'        => $counts,
		'brands'        => array_values( $brand_names ),
		'target_margin' => dtb_pricing_get_target_margin(),
		'sources'       => [
			'prices' => __( 'WooCommerce regular and sale prices', 'drywall-toolbox' ),
			'cost'   => __( 'WooCommerce Cost of Goods', 'drywall-toolbox' ),
			'map'    => __( 'DTB product MAP field', 'drywall-toolbox' ),
		],
	];
}

/** Return one fresh product snapshot by ID. */
function dtb_pricing_get_product( int $product_id ): ?array {
	$product = wc_get_product( $product_id );
	if ( ! $product || $product->is_type( 'variable' ) ) {
		return null;
	}

	return dtb_pricing_product_snapshot( $product );
}

/**
 * Apply the pricing fields managed by this workspace to one product.
 *
 * @param array<string,mixed> $fields Allowed fields: regular_price, map_price, map_source.
 * @return array<string,mixed>|WP_Error
 */
function dtb_pricing_update_product( int $product_id, array $fields ) {
	$product = wc_get_product( $product_id );
	if ( ! $product ) {
		return new WP_Error( 'dtb_pricing_product_not_found', __( 'Product not found.', 'drywall-toolbox' ), [ 'status' => 404 ] );
	}
	if ( $product->is_type( 'variable' ) ) {
		return new WP_Error( 'dtb_pricing_variable_parent', __( 'Variable parent prices are managed by their variations.', 'drywall-toolbox' ), [ 'status' => 400 ] );
	}

	$before = dtb_pricing_product_snapshot( $product );

	if ( array_key_exists( 'regular_price', $fields ) ) {
		$raw = trim( (string) $fields['regular_price'] );
		if ( '' === $raw || ! is_numeric( $raw ) || (float) $raw < 0 ) {
			return new WP_Error( 'dtb_pricing_invalid_price', __( 'Regular price must be a valid non-negative amount.', 'drywall-toolbox' ), [ 'status' => 400 ] );
		}
		$price = wc_format_decimal( $raw, wc_get_price_decimals() );
		$product->set_regular_price( $price );
		if ( ! $product->is_on_sale( 'edit' ) ) {
			$product->set_price( $price );
		}
	}

	if ( array_key_exists( 'map_price', $fields ) ) {
		$raw_map = trim( (string) $fields['map_price'] );
		if ( '' === $raw_map ) {
			$product->delete_meta_data( DTB_PRICING_MAP_PRICE_META );
		} elseif ( is_numeric( $raw_map ) && (float) $raw_map >= 0 ) {
			$product->update_meta_data( DTB_PRICING_MAP_PRICE_META, wc_format_decimal( $raw_map, wc_get_price_decimals() ) );
		} else {
			return new WP_Error( 'dtb_pricing_invalid_map', __( 'MAP must be blank or a valid non-negative amount.', 'drywall-toolbox' ), [ 'status' => 400 ] );
		}
	}

	if ( array_key_exists( 'map_source', $fields ) ) {
		$source = sanitize_text_field( (string) $fields['map_source'] );
		if ( '' === $source ) {
			$product->delete_meta_data( DTB_PRICING_MAP_SOURCE_META );
		} else {
			$product->update_meta_data( DTB_PRICING_MAP_SOURCE_META, $source );
		}
	}

	$product->save();
	wc_delete_product_transients( $product_id );
	dtb_pricing_invalidate_index();
	$after_product = wc_get_product( $product_id );
	$after         = $after_product ? dtb_pricing_product_snapshot( $after_product ) : $before;

	if ( function_exists( 'dtb_admin_audit_write' ) ) {
		dtb_admin_audit_write(
			'catalog_pricing',
			$product_id,
			'catalog_pricing.product_updated',
			[
				'before' => [
					'regular_price' => $before['regular_price'],
					'map_price'     => $before['map_price'],
				],
				'after'  => [
					'regular_price' => $after['regular_price'],
					'map_price'     => $after['map_price'],
				],
			],
			[ 'source' => 'pricing_manager' ]
		);
	}

	return $after;
}

/**
 * Apply selected optimizer recommendations in one bounded request.
 *
 * @param array<int,array<string,mixed>> $items Requested updates.
 * @return array<string,mixed>
 */
function dtb_pricing_apply_selected( array $items ): array {
	$items  = array_slice( $items, 0, 100 );
	$result = [ 'updated' => [], 'conflicts' => [], 'errors' => [] ];

	foreach ( $items as $item ) {
		$product_id = absint( $item['product_id'] ?? 0 );
		$new_price  = $item['regular_price'] ?? null;
		$expected   = $item['expected_regular_price'] ?? null;
		$product    = $product_id ? wc_get_product( $product_id ) : false;

		if ( ! $product || $product->is_type( 'variable' ) ) {
			$result['errors'][] = [ 'product_id' => $product_id, 'message' => __( 'Product is unavailable for pricing.', 'drywall-toolbox' ) ];
			continue;
		}

		$current = (string) $product->get_regular_price( 'edit' );
		if ( null !== $expected && wc_format_decimal( (string) $expected, wc_get_price_decimals() ) !== wc_format_decimal( $current, wc_get_price_decimals() ) ) {
			$result['conflicts'][] = [ 'product_id' => $product_id, 'current_regular_price' => $current ];
			continue;
		}

		$updated = dtb_pricing_update_product( $product_id, [ 'regular_price' => $new_price ] );
		if ( is_wp_error( $updated ) ) {
			$result['errors'][] = [ 'product_id' => $product_id, 'message' => $updated->get_error_message() ];
			continue;
		}

		$result['updated'][] = $updated;
	}

	return $result;
}
