<?php
/**
 * DTB_ProductDetailController
 *
 * Handles:
 *   GET /wp-json/dtb/v1/catalog/products/:slug/detail
 *   GET /wp-json/dtb/v1/catalog/products/:id/variations
 *
 * Returns a normalized parent product + full variation matrix + computed
 * default-variation context. This is the canonical product detail endpoint.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_ProductDetailController {

	private const RELATED_PRODUCT_LIMIT = 4;

	public static function register_routes(): void {
		register_rest_route( 'dtb/v1', '/catalog/products/(?P<slug>[a-zA-Z0-9_-]+)/detail', [
			'methods'             => 'GET',
			'callback'            => [ self::class, 'handle_detail' ],
			'permission_callback' => '__return_true',
		] );

		register_rest_route( 'dtb/v1', '/catalog/products/(?P<id>\d+)/variations', [
			'methods'             => 'GET',
			'callback'            => [ self::class, 'handle_variations' ],
			'permission_callback' => '__return_true',
			'args'                => [
				'id' => [ 'validate_callback' => 'is_numeric' ],
			],
		] );
	}

	/** GET /dtb/v1/catalog/products/:slug/detail */
	public static function handle_detail( WP_REST_Request $request ): WP_REST_Response {
		$slug = sanitize_title( $request->get_param( 'slug' ) );

		if ( '' === $slug ) {
			return new WP_REST_Response( dtb_error_envelope( 'invalid_slug', 'Product slug is required.', 400 ), 400 );
		}

		$parent_response = dtb_catalog_wc_get_response( 'wc/v3/products', [
			'slug'    => $slug,
			'status'  => 'publish',
			'_fields' => DTB_PRODUCT_DETAIL_FIELDS,
		] );

		if ( ! $parent_response instanceof WP_REST_Response ) {
			return new WP_REST_Response( dtb_error_envelope( 'upstream_error', 'Product catalog is temporarily unavailable.', 503 ), 503 );
		}
		if ( 200 !== $parent_response->get_status() ) {
			return $parent_response;
		}

		$products = $parent_response->get_data();
		if ( ! is_array( $products ) || empty( $products ) ) {
			return new WP_REST_Response( dtb_error_envelope( 'not_found', 'Product not found.', 404 ), 404 );
		}

		$wc_product = $products[0] ?? null;
		if ( ! is_array( $wc_product ) ) {
			return new WP_REST_Response( dtb_error_envelope( 'not_found', 'Product not found.', 404 ), 404 );
		}

		$product    = dtb_catalog_normalize_product( $wc_product );
		$variations = [];

		if ( 'variable' === $product['type'] && $product['id'] > 0 ) {
			$variations = DTB_VariationReadModelService::get_normalized( $product['id'], $wc_product );
		}

		$default_var = dtb_catalog_resolve_default_variation( $product, $variations );
		$product     = dtb_catalog_apply_default_variation_to_card( $product, $default_var );

		$in_stock_count = count( array_filter( $variations, static fn( $v ) =>
			'outofstock' !== $v['inventory']['stockStatus']
		) );

		$variation_diagnostics = method_exists( 'DTB_VariationReadModelService', 'get_last_diagnostics' )
			? DTB_VariationReadModelService::get_last_diagnostics()
			: [ 'available' => false ];
		$related = self::get_related_products( $product );

		return new WP_REST_Response( [
			'product'                => $product,
			'variations'             => $variations,
			'relatedProducts'        => $related['products'],
			'relatedProductsContext' => $related['context'],
			'computed'               => [
				'defaultVariation'      => $default_var,
				'hasInStockVariation'   => $in_stock_count > 0,
				'variationCount'        => count( $variations ),
				'inStockVariationCount' => $in_stock_count,
				'variationMatrix'       => dtb_catalog_build_variation_matrix( $variations ),
				'variationDiagnostics'  => $variation_diagnostics,
			],
		], 200 );
	}

	/**
	 * Build the public PDP merchandising rail.
	 *
	 * Canonical compatibility metadata is preferred when it exists. WooCommerce
	 * upsells/related products remain a bounded fallback so products without
	 * compatibility coverage retain useful merchandising without creating a
	 * second recommendation authority.
	 *
	 * @return array{products:array<int,array<string,mixed>>,context:string}
	 */
	private static function get_related_products( array $product ): array {
		$product_id = absint( $product['id'] ?? 0 );
		if ( $product_id <= 0 ) {
			return [ 'products' => [], 'context' => 'related' ];
		}

		$source_product = wc_get_product( $product_id );
		if ( ! $source_product ) {
			return [ 'products' => [], 'context' => 'related' ];
		}

		$compatibility_ids = self::get_compatibility_candidate_ids( $product );
		$fallback_ids      = array_merge(
			$source_product->get_upsell_ids(),
			wc_get_related_products( $product_id, self::RELATED_PRODUCT_LIMIT * 2, [ $product_id ] )
		);
		$candidate_ids = array_values( array_unique( array_filter( array_map(
			'absint',
			array_merge( $compatibility_ids, $fallback_ids )
		) ) ) );
		$visible_ids = [];

		foreach ( $candidate_ids as $candidate_id ) {
			if ( $candidate_id === $product_id ) {
				continue;
			}

			$candidate = wc_get_product( $candidate_id );
			if ( ! $candidate || 'publish' !== get_post_status( $candidate_id ) || ! $candidate->is_visible() ) {
				continue;
			}

			$visible_ids[] = $candidate_id;
			if ( count( $visible_ids ) >= self::RELATED_PRODUCT_LIMIT ) {
				break;
			}
		}

		$normalized = array_values( array_map(
			'dtb_catalog_normalize_product',
			dtb_catalog_wc_fetch_products_by_ids( $visible_ids )
		) );

		$visible_compatibility_ids = array_intersect( $visible_ids, $compatibility_ids );
		$context = ! empty( $visible_compatibility_ids )
			? ( ! empty( $product['isParts'] ) ? 'compatible_tools' : 'compatible_parts' )
			: 'related';

		return [
			'products' => $normalized,
			'context'  => $context,
		];
	}

	/**
	 * Resolve compatibility-backed merchandising candidates from the canonical
	 * product meta graph. Reads are bounded to the PDP rail size and never infer
	 * compatibility from names, brands, or category proximity.
	 *
	 * @param  array $product Canonical catalog DTO.
	 * @return int[]
	 */
	private static function get_compatibility_candidate_ids( array $product ): array {
		$source_sku = strtoupper( trim( (string) ( $product['sku'] ?? '' ) ) );
		if ( '' === $source_sku ) {
			return [];
		}

		$compatibility = is_array( $product['compatibility'] ?? null )
			? $product['compatibility']
			: [];

		if ( ! empty( $product['isParts'] ) ) {
			$tool_skus = array_values( array_unique( array_filter( array_merge(
				self::normalize_sku_list( $compatibility['compatibleToolSkus'] ?? [] ),
				self::normalize_sku_list( $compatibility['replacementPartFor'] ?? [] )
			) ) ) );
			$ids = [];

			foreach ( array_slice( $tool_skus, 0, self::RELATED_PRODUCT_LIMIT * 2 ) as $tool_sku ) {
				$product_id = absint( wc_get_product_id_by_sku( $tool_sku ) );
				if ( $product_id > 0 ) {
					$ids[] = $product_id;
				}
			}

			return array_values( array_unique( $ids ) );
		}

		$candidate_ids = get_posts( [
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => self::RELATED_PRODUCT_LIMIT * 4,
			'fields'         => 'ids',
			'no_found_rows'  => true,
			'meta_query'     => [
				'relation' => 'OR',
				[
					'key'     => DTB_ProductMeta::COMPATIBLE_TOOL_SKUS,
					'value'   => $source_sku,
					'compare' => 'LIKE',
				],
				[
					'key'     => DTB_ProductMeta::REPLACEMENT_PART_FOR,
					'value'   => $source_sku,
					'compare' => 'LIKE',
				],
			],
		] );

		$verified_ids = [];
		foreach ( (array) $candidate_ids as $candidate_id ) {
			$candidate = wc_get_product( absint( $candidate_id ) );
			if ( ! $candidate ) {
				continue;
			}

			$declared_tool_skus = array_values( array_unique( array_merge(
				self::normalize_sku_list( $candidate->get_meta( DTB_ProductMeta::COMPATIBLE_TOOL_SKUS, true ) ),
				self::normalize_sku_list( $candidate->get_meta( DTB_ProductMeta::REPLACEMENT_PART_FOR, true ) )
			) ) );

			if ( in_array( $source_sku, $declared_tool_skus, true ) ) {
				$verified_ids[] = absint( $candidate_id );
			}

			if ( count( $verified_ids ) >= self::RELATED_PRODUCT_LIMIT ) {
				break;
			}
		}

		return $verified_ids;
	}

	/** Normalize a canonical SKU list without inventing compatibility. */
	private static function normalize_sku_list( mixed $raw ): array {
		if ( is_array( $raw ) ) {
			$values = $raw;
		} elseif ( is_string( $raw ) && '' !== trim( $raw ) ) {
			$values = explode( ',', $raw );
		} else {
			return [];
		}

		return array_values( array_filter( array_unique( array_map(
			static fn( $value ) => strtoupper( trim( (string) $value ) ),
			$values
		) ) ) );
	}

	/** GET /dtb/v1/catalog/products/:id/variations */
	public static function handle_variations( WP_REST_Request $request ): WP_REST_Response {
		$product_id = absint( $request->get_param( 'id' ) );

		if ( $product_id <= 0 ) {
			return new WP_REST_Response( dtb_error_envelope( 'invalid_id', 'Valid product ID required.', 400 ), 400 );
		}

		$parent_response = dtb_catalog_wc_get_response( 'wc/v3/products/' . $product_id, [] );
		if ( ! $parent_response instanceof WP_REST_Response ) {
			return new WP_REST_Response( dtb_error_envelope( 'upstream_error', 'Product catalog is temporarily unavailable.', 503 ), 503 );
		}
		if ( 200 !== $parent_response->get_status() ) {
			return $parent_response;
		}

		$wc_parent = $parent_response->get_data();
		if ( ! is_array( $wc_parent ) || empty( $wc_parent ) ) {
			return new WP_REST_Response( dtb_error_envelope( 'not_found', 'Product not found.', 404 ), 404 );
		}

		$variations = DTB_VariationReadModelService::get_normalized( $product_id, $wc_parent );
		$variation_diagnostics = method_exists( 'DTB_VariationReadModelService', 'get_last_diagnostics' )
			? DTB_VariationReadModelService::get_last_diagnostics()
			: [ 'available' => false ];

		return new WP_REST_Response( [
			'productId'   => $product_id,
			'variations'  => $variations,
			'count'       => count( $variations ),
			'diagnostics' => $variation_diagnostics,
		], 200 );
	}
}
