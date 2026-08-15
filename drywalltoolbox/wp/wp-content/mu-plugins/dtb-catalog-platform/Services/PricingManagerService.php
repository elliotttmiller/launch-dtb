<?php
/**
 * DTB Catalog Platform — Pricing Manager service.
 *
 * Provides a bounded, WooCommerce-backed read model and the small set of
 * mutations required by the wp-admin pricing workspace. WooCommerce remains
 * authoritative for runtime product prices and native cost of goods.
 *
 * MVP pricing policy:
 * - MAP is an absolute advertised-price floor whenever configured.
 * - target-margin pricing is an economic objective, not permission to lower an
 *   already-higher price;
 * - only MAP-configured products are optimizer-eligible during the MVP rollout;
 * - active sale prices are also subject to the MAP floor.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_PRICING_TARGET_MARGIN_OPTION = 'dtb_catalog_pricing_target_margin';
const DTB_PRICING_MAP_PRICE_META       = DTB_ProductMeta::MAP_PRICE;
const DTB_PRICING_MAP_SOURCE_META      = DTB_ProductMeta::MAP_SOURCE;
const DTB_PRICING_INDEX_TRANSIENT      = 'dtb_catalog_pricing_index_v2';

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
	delete_transient( 'dtb_catalog_pricing_index_v1' );
}

add_action( 'woocommerce_update_product', 'dtb_pricing_invalidate_index', 10, 0 );
add_action( 'woocommerce_update_product_variation', 'dtb_pricing_invalidate_index', 10, 0 );
add_action( 'woocommerce_delete_product', 'dtb_pricing_invalidate_index', 10, 0 );

/** Convert a WooCommerce decimal price into integer minor units for exact comparisons. */
function dtb_pricing_money_minor_units( mixed $value ): ?int {
	if ( null === $value || '' === $value || ! is_numeric( $value ) ) {
		return null;
	}

	$decimals   = max( 0, wc_get_price_decimals() );
	$normalized = wc_format_decimal( (string) $value, $decimals );
	if ( ! preg_match( '/^-?\d+(?:\.\d+)?$/', $normalized ) ) {
		return null;
	}

	$negative = str_starts_with( $normalized, '-' );
	$unsigned = ltrim( $normalized, '-' );
	$parts    = explode( '.', $unsigned, 2 );
	$whole    = (int) $parts[0];
	$fraction = str_pad( substr( $parts[1] ?? '', 0, $decimals ), $decimals, '0' );
	$scale    = 10 ** $decimals;
	$minor    = ( $whole * $scale ) + ( '' === $fraction ? 0 : (int) $fraction );

	return $negative ? -$minor : $minor;
}

/** Compare two monetary values at WooCommerce currency precision. */
function dtb_pricing_money_compare( mixed $left, mixed $right ): ?int {
	$left_minor  = dtb_pricing_money_minor_units( $left );
	$right_minor = dtb_pricing_money_minor_units( $right );
	if ( null === $left_minor || null === $right_minor ) {
		return null;
	}

	return $left_minor <=> $right_minor;
}

/** Return the greater monetary value at WooCommerce currency precision. */
function dtb_pricing_money_max( mixed ...$values ): ?float {
	$winner       = null;
	$winner_minor = null;

	foreach ( $values as $value ) {
		$minor = dtb_pricing_money_minor_units( $value );
		if ( null === $minor ) {
			continue;
		}
		if ( null === $winner_minor || $minor > $winner_minor ) {
			$winner       = (float) wc_format_decimal( (string) $value, wc_get_price_decimals() );
			$winner_minor = $minor;
		}
	}

	return $winner;
}

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

/** Calculate gross profit in currency units. */
function dtb_pricing_gross_profit( ?float $price, ?float $cost ): ?float {
	if ( null === $price || null === $cost ) {
		return null;
	}

	return round( $price - $cost, wc_get_price_decimals() );
}

/** Calculate gross margin percentage: (price - cost) / price. */
function dtb_pricing_gross_margin( ?float $price, ?float $cost ): ?float {
	if ( null === $price || null === $cost || $price <= 0 ) {
		return null;
	}

	return round( ( ( $price - $cost ) / $price ) * 100, 2 );
}

/** Calculate markup percentage: (price - cost) / cost. */
function dtb_pricing_markup( ?float $price, ?float $cost ): ?float {
	if ( null === $price || null === $cost || $cost <= 0 ) {
		return null;
	}

	return round( ( ( $price - $cost ) / $cost ) * 100, 2 );
}

/**
 * Calculate the minimum currency price required to reach a target gross margin.
 *
 * The exact equation is price = cost / (1 - target margin). Because this is a
 * floor calculation, the result is rounded upward to the next currency minor
 * unit rather than conventionally rounded down through the target.
 */
function dtb_pricing_target_price( ?float $cost, float $target_margin ): ?float {
	if ( null === $cost || $cost <= 0 || $target_margin <= 0 || $target_margin >= 100 ) {
		return null;
	}

	$raw   = $cost / ( 1 - ( $target_margin / 100 ) );
	$scale = 10 ** max( 0, wc_get_price_decimals() );
	return ceil( ( $raw * $scale ) - 0.0000001 ) / $scale;
}

/** Return true when a configured price is below MAP at currency precision. */
function dtb_pricing_is_below_map( mixed $price, ?float $map ): bool {
	if ( null === $map ) {
		return false;
	}

	$comparison = dtb_pricing_money_compare( $price, $map );
	return null !== $comparison && $comparison < 0;
}

/**
 * Enforce MAP as an absolute floor on every WooCommerce product save.
 *
 * This hook intentionally changes only existing price values. It does not turn
 * an unpriced/reference product into a priced product merely because MAP was
 * configured. Variable parents remain projections of their child variations.
 */
function dtb_pricing_enforce_map_floor_on_product( $product ): void {
	if ( ! $product instanceof WC_Product || $product->is_type( 'variable' ) ) {
		return;
	}

	$map = dtb_pricing_product_map_price( $product );
	if ( null === $map ) {
		return;
	}

	$map_decimal = wc_format_decimal( (string) $map, wc_get_price_decimals() );
	$regular     = $product->get_regular_price( 'edit' );
	$sale        = $product->get_sale_price( 'edit' );

	if ( '' !== $regular && is_numeric( $regular ) && dtb_pricing_is_below_map( $regular, $map ) ) {
		$product->set_regular_price( $map_decimal );
	}
	if ( '' !== $sale && is_numeric( $sale ) && (float) $sale > 0 && dtb_pricing_is_below_map( $sale, $map ) ) {
		$product->set_sale_price( $map_decimal );
	}

	$regular = $product->get_regular_price( 'edit' );
	$sale    = $product->get_sale_price( 'edit' );
	if ( $product->is_on_sale( 'edit' ) && '' !== $sale && is_numeric( $sale ) ) {
		$product->set_price( $sale );
	} elseif ( '' !== $regular && is_numeric( $regular ) ) {
		$product->set_price( $regular );
	}
}
add_action( 'woocommerce_before_product_object_save', 'dtb_pricing_enforce_map_floor_on_product', 50, 1 );

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
	$on_sale       = $product->is_on_sale( 'edit' );
	$has_map       = null !== $map;

	$regular_map_violation   = $has_map && null !== $regular && dtb_pricing_is_below_map( $regular, $map );
	$sale_map_violation      = $has_map && null !== $sale && $sale > 0 && dtb_pricing_is_below_map( $sale, $map );
	$effective_map_violation = $has_map && null !== $effective && dtb_pricing_is_below_map( $effective, $map );
	$map_violation           = $regular_map_violation || $sale_map_violation || $effective_map_violation;

	// During the MVP rollout, MAP is the hard floor and target margin is the
	// economic objective. Current prices above both are held rather than lowered.
	$optimization_floor = $has_map ? dtb_pricing_money_max( $map, $target_price ) : $target_price;
	$suggested_regular  = null;
	if ( null !== $regular && $regular > 0 ) {
		$suggested_regular = dtb_pricing_money_max( $regular, $optimization_floor );
	}
	$suggested_sale = $sale;
	if ( $has_map && null !== $sale && $sale > 0 ) {
		$suggested_sale = dtb_pricing_money_max( $sale, $map );
	}
	$suggested_effective = $on_sale && null !== $suggested_sale ? $suggested_sale : $suggested_regular;

	$status       = 'healthy';
	$status_label = __( 'Healthy', 'drywall-toolbox' );

	if ( null === $regular || $regular <= 0 ) {
		$status       = 'missing_price';
		$status_label = __( 'Missing price', 'drywall-toolbox' );
	} elseif ( $map_violation ) {
		// MAP is deliberately evaluated before COGS and sale state. Compliance
		// cannot be hidden just because another pricing input is unavailable.
		$status       = 'below_map';
		$status_label = __( 'MAP violation', 'drywall-toolbox' );
	} elseif ( ! $has_map ) {
		$status       = 'missing_map';
		$status_label = __( 'MAP not configured', 'drywall-toolbox' );
	} elseif ( null === $cost ) {
		$status       = 'missing_cost';
		$status_label = __( 'Missing cost', 'drywall-toolbox' );
	} elseif ( $on_sale ) {
		$status       = 'sale_active';
		$status_label = __( 'Sale active', 'drywall-toolbox' );
	} elseif ( null !== $margin && $margin + 0.005 < $target_margin ) {
		$status       = 'below_target';
		$status_label = __( 'Below target', 'drywall-toolbox' );
	}

	$optimizer_eligible = $has_map && null !== $regular && $regular > 0;
	$recommendation     = 'hold';
	$reason_code        = 'PRICE_HEALTHY';
	if ( ! $has_map ) {
		$recommendation = 'not_configured';
		$reason_code    = 'MAP_NOT_CONFIGURED';
	} elseif ( null === $regular || $regular <= 0 ) {
		$recommendation = 'blocked';
		$reason_code    = 'MISSING_PRICE';
	} elseif ( $map_violation ) {
		$recommendation = 'optimize';
		$reason_code    = 'MAP_FLOOR_VIOLATION';
	} elseif ( null === $cost ) {
		$recommendation = 'hold';
		$reason_code    = 'MISSING_COGS';
	} elseif ( $on_sale ) {
		$recommendation = 'review';
		$reason_code    = 'ACTIVE_SALE';
	} elseif ( null !== $margin && $margin + 0.005 < $target_margin ) {
		$recommendation = 'optimize';
		$reason_code    = 'BELOW_TARGET_MARGIN';
	}

	$image_id  = $product->get_image_id();
	$image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'thumbnail' ) : false;

	return [
		'id'                      => $product->get_id(),
		'parent_id'               => $product->get_parent_id(),
		'type'                    => $product->get_type(),
		'name'                    => wp_strip_all_tags( $product->get_name() ),
		'sku'                     => (string) $product->get_sku( 'edit' ),
		'brand'                   => dtb_pricing_product_brand( $product ),
		'catalog_status'          => $product->get_status( 'edit' ),
		'regular_price'           => $regular,
		'sale_price'              => $sale,
		'effective_price'         => $effective,
		'cost'                    => $cost,
		'map_price'               => $map,
		'map_source'              => sanitize_text_field( (string) $product->get_meta( DTB_PRICING_MAP_SOURCE_META, true, 'edit' ) ),
		'has_map'                 => $has_map,
		'map_violation'           => $map_violation,
		'regular_map_violation'   => $regular_map_violation,
		'sale_map_violation'      => $sale_map_violation,
		'gross_profit'            => dtb_pricing_gross_profit( $effective, $cost ),
		'gross_margin'            => $margin,
		'markup'                  => $markup,
		'target_margin'           => $target_margin,
		'target_price'            => $target_price,
		'optimization_floor'      => $optimization_floor,
		'suggested_price'         => $suggested_regular,
		'suggested_sale_price'    => $suggested_sale,
		'suggested_effective_price' => $suggested_effective,
		'suggested_gross_margin'  => dtb_pricing_gross_margin( $suggested_effective, $cost ),
		'optimizer_eligible'      => $optimizer_eligible,
		'recommendation_action'   => $recommendation,
		'reason_code'             => $reason_code,
		'status'                  => $status,
		'status_label'            => $status_label,
		'on_sale'                 => $on_sale,
		'image_url'               => $image_url ? esc_url_raw( $image_url ) : '',
		'edit_url'                => esc_url_raw( get_edit_post_link( $product->get_id(), 'raw' ) ?: '' ),
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
			'map_only'  => false,
			'page'      => 1,
			'per_page'  => 25,
			'sort'      => 'name',
			'direction' => 'asc',
		]
	);

	$search    = strtolower( trim( sanitize_text_field( (string) $args['search'] ) ) );
	$brand     = sanitize_text_field( (string) $args['brand'] );
	$status    = sanitize_key( (string) $args['status'] );
	$map_only  = rest_sanitize_boolean( $args['map_only'] );
	$page      = max( 1, absint( $args['page'] ) );
	$per_page  = min( 100, max( 10, absint( $args['per_page'] ) ) );
	$sort      = sanitize_key( (string) $args['sort'] );
	$direction = 'desc' === strtolower( (string) $args['direction'] ) ? 'desc' : 'asc';
	$rows      = dtb_pricing_build_index();

	$filtered = array_values(
		array_filter(
			$rows,
			static function ( array $row ) use ( $search, $brand, $status, $map_only ): bool {
				if ( '' !== $search ) {
					$haystack = strtolower( implode( ' ', [ $row['name'], $row['sku'], $row['brand'] ] ) );
					if ( false === strpos( $haystack, $search ) ) {
						return false;
					}
				}
				if ( '' !== $brand && $row['brand'] !== $brand ) {
					return false;
				}
				if ( $map_only && empty( $row['has_map'] ) ) {
					return false;
				}
				if ( 'needs_action' === $status ) {
					return 'optimize' === $row['recommendation_action'];
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
		'total'             => count( $rows ),
		'with_cost'         => 0,
		'with_map'          => 0,
		'missing_map'       => 0,
		'optimizer_actions' => 0,
		'healthy'           => 0,
		'below_target'      => 0,
		'below_map'         => 0,
		'missing_cost'      => 0,
		'missing_price'     => 0,
		'sale_active'       => 0,
	];

	foreach ( $rows as $row ) {
		if ( null !== $row['cost'] ) {
			++$counts['with_cost'];
		}
		if ( ! empty( $row['has_map'] ) ) {
			++$counts['with_map'];
		} else {
			++$counts['missing_map'];
		}
		if ( 'optimize' === $row['recommendation_action'] ) {
			++$counts['optimizer_actions'];
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
		'optimizer_mode'=> 'map_first',
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
 * @param array<string,mixed> $fields Allowed fields: regular_price, sale_price, map_price, map_source.
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

	// Apply MAP metadata first so every price mutation below is evaluated against
	// the proposed current MAP value in this same save operation.
	if ( array_key_exists( 'map_price', $fields ) ) {
		$raw_map = trim( (string) $fields['map_price'] );
		if ( '' === $raw_map ) {
			$product->delete_meta_data( DTB_PRICING_MAP_PRICE_META );
		} elseif ( is_numeric( $raw_map ) && (float) $raw_map > 0 ) {
			$product->update_meta_data( DTB_PRICING_MAP_PRICE_META, wc_format_decimal( $raw_map, wc_get_price_decimals() ) );
		} else {
			return new WP_Error( 'dtb_pricing_invalid_map', __( 'MAP must be blank or a valid positive amount.', 'drywall-toolbox' ), [ 'status' => 400 ] );
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

	if ( array_key_exists( 'regular_price', $fields ) ) {
		$raw = trim( (string) $fields['regular_price'] );
		if ( '' === $raw || ! is_numeric( $raw ) || (float) $raw < 0 ) {
			return new WP_Error( 'dtb_pricing_invalid_price', __( 'Regular price must be a valid non-negative amount.', 'drywall-toolbox' ), [ 'status' => 400 ] );
		}
		$product->set_regular_price( wc_format_decimal( $raw, wc_get_price_decimals() ) );
	}

	if ( array_key_exists( 'sale_price', $fields ) ) {
		$raw_sale = trim( (string) $fields['sale_price'] );
		if ( '' === $raw_sale ) {
			$product->set_sale_price( '' );
		} elseif ( is_numeric( $raw_sale ) && (float) $raw_sale >= 0 ) {
			$product->set_sale_price( wc_format_decimal( $raw_sale, wc_get_price_decimals() ) );
		} else {
			return new WP_Error( 'dtb_pricing_invalid_sale_price', __( 'Sale price must be blank or a valid non-negative amount.', 'drywall-toolbox' ), [ 'status' => 400 ] );
		}
	}

	// Apply the invariant before save as well as through the global save hook so
	// the workspace response reflects exactly what WooCommerce will persist.
	dtb_pricing_enforce_map_floor_on_product( $product );
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
					'sale_price'    => $before['sale_price'],
					'map_price'     => $before['map_price'],
				],
				'after'  => [
					'regular_price' => $after['regular_price'],
					'sale_price'    => $after['sale_price'],
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
 * Recommendations are always recalculated from the fresh WooCommerce object on
 * the server. Client-supplied suggested prices are not pricing authority.
 *
 * @param array<int,array<string,mixed>> $items Requested updates.
 * @return array<string,mixed>
 */
function dtb_pricing_apply_selected( array $items ): array {
	$items  = array_slice( $items, 0, 100 );
	$result = [ 'updated' => [], 'conflicts' => [], 'errors' => [] ];

	foreach ( $items as $item ) {
		$product_id = absint( $item['product_id'] ?? 0 );
		$expected   = $item['expected_regular_price'] ?? null;
		$product    = $product_id ? wc_get_product( $product_id ) : false;

		if ( ! $product || $product->is_type( 'variable' ) ) {
			$result['errors'][] = [ 'product_id' => $product_id, 'message' => __( 'Product is unavailable for pricing.', 'drywall-toolbox' ) ];
			continue;
		}

		$current = (string) $product->get_regular_price( 'edit' );
		if ( null !== $expected && 0 !== dtb_pricing_money_compare( $expected, $current ) ) {
			$result['conflicts'][] = [ 'product_id' => $product_id, 'current_regular_price' => $current ];
			continue;
		}

		$snapshot = dtb_pricing_product_snapshot( $product );
		if ( empty( $snapshot['optimizer_eligible'] ) ) {
			$result['errors'][] = [ 'product_id' => $product_id, 'message' => __( 'MAP must be configured before this product can use the MVP optimizer.', 'drywall-toolbox' ) ];
			continue;
		}
		if ( 'optimize' !== $snapshot['recommendation_action'] ) {
			$result['conflicts'][] = [
				'product_id'            => $product_id,
				'current_regular_price' => $current,
				'reason_code'           => $snapshot['reason_code'],
			];
			continue;
		}

		$fields = [ 'regular_price' => $snapshot['suggested_price'] ];
		if (
			null !== $snapshot['sale_price']
			&& null !== $snapshot['suggested_sale_price']
			&& 0 !== dtb_pricing_money_compare( $snapshot['sale_price'], $snapshot['suggested_sale_price'] )
		) {
			$fields['sale_price'] = $snapshot['suggested_sale_price'];
		}

		$updated = dtb_pricing_update_product( $product_id, $fields );
		if ( is_wp_error( $updated ) ) {
			$result['errors'][] = [ 'product_id' => $product_id, 'message' => $updated->get_error_message() ];
			continue;
		}

		$result['updated'][] = $updated;
	}

	return $result;
}
