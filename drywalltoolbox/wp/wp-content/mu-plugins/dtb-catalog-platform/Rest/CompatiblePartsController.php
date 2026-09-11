<?php
/**
 * DTB_CompatiblePartsController
 *
 * Exposes the schematic/parts compatibility graph via read-only REST endpoints.
 * All relationships are owned by product meta — no extra database tables needed.
 *
 * Routes:
 *   GET /wp-json/dtb/v1/products/:sku/compatible-parts
 *     Returns all part products whose _dtb_compatible_tool_skus or
 *     _dtb_replacement_part_for includes the given tool SKU.
 *
 *   GET /wp-json/dtb/v1/parts/:sku/compatible-tools
 *     Returns all tool products whose SKU appears in the given part's
 *     _dtb_compatible_tool_skus or _dtb_replacement_part_for meta.
 *
 *   GET /wp-json/dtb/v1/schematics/:schematicId/parts
 *     Returns all parts whose _dtb_schematic_brand + _dtb_schematic_group
 *     concatenate to the given schematicId (format: brand--group).
 *
 * Response shape for all three routes:
 *   { products: [ DTB product DTO, ... ], count: int }
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CompatiblePartsController {

	private const SKU_PATTERN = '[A-Z0-9._-]+';

	public static function register_routes(): void {
		register_rest_route( 'dtb/v1', '/products/(?P<sku>' . self::SKU_PATTERN . ')/compatible-parts', [
			'methods'             => 'GET',
			'callback'            => [ self::class, 'handle_compatible_parts' ],
			'permission_callback' => '__return_true',
			'args'                => [
				'sku' => [
					'sanitize_callback' => 'sanitize_text_field',
					'validate_callback' => static fn( $v ) => (bool) preg_match( '/^[A-Z0-9._-]+$/i', (string) $v ),
				],
			],
		] );

		register_rest_route( 'dtb/v1', '/parts/(?P<sku>' . self::SKU_PATTERN . ')/compatible-tools', [
			'methods'             => 'GET',
			'callback'            => [ self::class, 'handle_compatible_tools' ],
			'permission_callback' => '__return_true',
			'args'                => [
				'sku' => [
					'sanitize_callback' => 'sanitize_text_field',
					'validate_callback' => static fn( $v ) => (bool) preg_match( '/^[A-Z0-9._-]+$/i', (string) $v ),
				],
			],
		] );

		register_rest_route( 'dtb/v1', '/schematics/(?P<schematicId>[a-zA-Z0-9_-]+)/parts', [
			'methods'             => 'GET',
			'callback'            => [ self::class, 'handle_schematic_parts' ],
			'permission_callback' => '__return_true',
			'args'                => [
				'schematicId' => [
					'sanitize_callback' => 'sanitize_title',
				],
			],
		] );
	}

	/** GET /dtb/v1/products/:sku/compatible-parts */
	public static function handle_compatible_parts( WP_REST_Request $request ): WP_REST_Response {
		$tool_sku = self::normalize_sku( $request->get_param( 'sku' ) );

		if ( '' === $tool_sku ) {
			return new WP_REST_Response(
				dtb_error_envelope( 'invalid_sku', 'Tool SKU is required.', 400 ),
				400
			);
		}

		$dtos = self::get_compatible_parts_for_tool_sku( $tool_sku );

		return new WP_REST_Response( [
			'toolSku'  => $tool_sku,
			'products' => $dtos,
			'count'    => count( $dtos ),
		], 200 );
	}

	/** GET /dtb/v1/parts/:sku/compatible-tools */
	public static function handle_compatible_tools( WP_REST_Request $request ): WP_REST_Response {
		$part_sku = self::normalize_sku( $request->get_param( 'sku' ) );

		if ( '' === $part_sku ) {
			return new WP_REST_Response(
				dtb_error_envelope( 'invalid_sku', 'Part SKU is required.', 400 ),
				400
			);
		}

		$part_post = self::get_product_id_by_sku( $part_sku );
		if ( ! $part_post ) {
			return new WP_REST_Response(
				dtb_error_envelope( 'not_found', "Part '{$part_sku}' not found.", 404 ),
				404
			);
		}

		$dtos = self::get_compatible_tools_for_part_sku( $part_sku );

		return new WP_REST_Response( [
			'partSku'  => $part_sku,
			'products' => $dtos,
			'count'    => count( $dtos ),
		], 200 );
	}

	/**
	 * Canonical read helper used by REST and bounded merchandising consumers.
	 * Every broad meta candidate is exact-membership verified before return.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function get_compatible_parts_for_tool_sku( string $tool_sku, int $limit = 0 ): array {
		$tool_sku = self::normalize_sku( $tool_sku );
		if ( '' === $tool_sku ) {
			return [];
		}

		$product_ids = self::find_products_with_sku_in_meta(
			$tool_sku,
			[ DTB_ProductMeta::COMPATIBLE_TOOL_SKUS, DTB_ProductMeta::REPLACEMENT_PART_FOR ],
			$limit
		);

		return self::normalize_product_ids( $product_ids, $limit );
	}

	/**
	 * Canonical read helper for tools explicitly named by a part's compatibility meta.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function get_compatible_tools_for_part_sku( string $part_sku, int $limit = 0 ): array {
		$part_sku = self::normalize_sku( $part_sku );
		if ( '' === $part_sku ) {
			return [];
		}

		$part_post = self::get_product_id_by_sku( $part_sku );
		if ( ! $part_post ) {
			return [];
		}

		$compatible_raw  = get_post_meta( $part_post, DTB_ProductMeta::COMPATIBLE_TOOL_SKUS, true );
		$replacement_raw = get_post_meta( $part_post, DTB_ProductMeta::REPLACEMENT_PART_FOR, true );
		$tool_skus       = array_values( array_unique( array_filter( array_merge(
			self::decode_sku_list( $compatible_raw ),
			self::decode_sku_list( $replacement_raw )
		) ) ) );
		$dtos            = [];

		foreach ( $tool_skus as $tool_sku ) {
			$tool_id = self::get_product_id_by_sku( $tool_sku );
			if ( ! $tool_id ) {
				continue;
			}

			$dto = self::normalize_single( $tool_id );
			if ( $dto ) {
				$dtos[] = $dto;
			}

			if ( $limit > 0 && count( $dtos ) >= $limit ) {
				break;
			}
		}

		return $dtos;
	}

	/** GET /dtb/v1/schematics/:schematicId/parts */
	public static function handle_schematic_parts( WP_REST_Request $request ): WP_REST_Response {
		$schematic_id = sanitize_title( $request->get_param( 'schematicId' ) );

		if ( '' === $schematic_id || ! str_contains( $schematic_id, '--' ) ) {
			return new WP_REST_Response(
				dtb_error_envelope(
					'invalid_schematic_id',
					"schematicId must be in the format '{brand}--{group}' (e.g. columbia--compound_tube).",
					400
				),
				400
			);
		}

		[ $brand, $group ] = explode( '--', $schematic_id, 2 );
		$brand = sanitize_title( $brand );
		$group = sanitize_title( $group );

		if ( '' === $brand || '' === $group ) {
			return new WP_REST_Response(
				dtb_error_envelope( 'invalid_schematic_id', 'Both brand and group must be non-empty.', 400 ),
				400
			);
		}

		$product_ids = get_posts( [
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => 200,
			'fields'         => 'ids',
			'meta_query'     => [
				'relation' => 'AND',
				[
					'key'     => DTB_ProductMeta::SCHEMATIC_BRAND,
					'value'   => $brand,
					'compare' => '=',
				],
				[
					'key'     => DTB_ProductMeta::SCHEMATIC_GROUP,
					'value'   => $group,
					'compare' => '=',
				],
			],
		] );

		$dtos = self::normalize_product_ids( (array) $product_ids );

		usort( $dtos, static function ( array $a, array $b ): int {
			$pos_a = $a['schematics']['position'] ?? PHP_INT_MAX;
			$pos_b = $b['schematics']['position'] ?? PHP_INT_MAX;
			return $pos_a <=> $pos_b;
		} );

		return new WP_REST_Response( [
			'schematicId' => $schematic_id,
			'brand'       => $brand,
			'group'       => $group,
			'products'    => $dtos,
			'count'       => count( $dtos ),
		], 200 );
	}

	/**
	 * Find published product IDs containing the SKU in any requested compatibility
	 * meta key, then exact-membership verify each candidate to prevent substring
	 * matches from becoming compatibility claims.
	 *
	 * @param string   $sku       Normalized SKU to search for.
	 * @param string[] $meta_keys Compatibility meta keys.
	 * @param int      $limit     Optional final result bound; 0 means endpoint default.
	 * @return int[]
	 */
	private static function find_products_with_sku_in_meta( string $sku, array $meta_keys, int $limit = 0 ): array {
		$ids          = [];
		$query_limit  = $limit > 0 ? max( 20, $limit * 4 ) : 500;
		$target_limit = $limit > 0 ? $limit : PHP_INT_MAX;

		foreach ( $meta_keys as $key ) {
			$found = get_posts( [
				'post_type'      => 'product',
				'post_status'    => 'publish',
				'posts_per_page' => $query_limit,
				'fields'         => 'ids',
				'no_found_rows'  => true,
				'meta_query'     => [
					[
						'key'     => $key,
						'value'   => $sku,
						'compare' => 'LIKE',
					],
				],
			] );

			foreach ( (array) $found as $candidate_id ) {
				$candidate_id = absint( $candidate_id );
				if ( $candidate_id <= 0 || in_array( $candidate_id, $ids, true ) ) {
					continue;
				}

				$declared_skus = self::decode_sku_list( get_post_meta( $candidate_id, $key, true ) );
				if ( ! in_array( $sku, $declared_skus, true ) ) {
					continue;
				}

				$ids[] = $candidate_id;
				if ( count( $ids ) >= $target_limit ) {
					return $ids;
				}
			}
		}

		return $ids;
	}

	/**
	 * @param int[] $product_ids
	 * @return array<int,array<string,mixed>>
	 */
	private static function normalize_product_ids( array $product_ids, int $limit = 0 ): array {
		$dtos = [];
		foreach ( $product_ids as $id ) {
			$dto = self::normalize_single( (int) $id );
			if ( $dto ) {
				$dtos[] = $dto;
			}
			if ( $limit > 0 && count( $dtos ) >= $limit ) {
				break;
			}
		}
		return $dtos;
	}

	/** Normalize a single product ID into the canonical DTB product DTO. */
	private static function normalize_single( int $product_id ): ?array {
		if ( $product_id <= 0 ) {
			return null;
		}

		$response = dtb_cached_wc_get( 'wc/v3/products/' . $product_id, [
			'_fields' => DTB_PRODUCT_DETAIL_FIELDS,
		] );

		if ( $response->get_status() !== 200 ) {
			return null;
		}

		$wc = $response->get_data();
		if ( ! is_array( $wc ) || empty( $wc ) ) {
			return null;
		}

		return dtb_catalog_normalize_product( $wc );
	}

	/** Look up a product post ID by its WooCommerce SKU. */
	private static function get_product_id_by_sku( string $sku ): ?int {
		$product_id = wc_get_product_id_by_sku( self::normalize_sku( $sku ) );
		return $product_id > 0 ? $product_id : null;
	}

	/** Normalize a SKU without changing protected identifier characters. */
	private static function normalize_sku( mixed $sku ): string {
		return strtoupper( trim( sanitize_text_field( (string) $sku ) ) );
	}

	/** Decode array, serialized-array, or comma-separated SKU meta into exact values. */
	private static function decode_sku_list( mixed $raw ): array {
		if ( is_array( $raw ) ) {
			$values = $raw;
		} elseif ( is_string( $raw ) && '' !== trim( $raw ) ) {
			$unserialized = maybe_unserialize( $raw );
			$values       = is_array( $unserialized ) ? $unserialized : explode( ',', $raw );
		} else {
			return [];
		}

		return array_values( array_filter( array_unique( array_map(
			static fn( $value ) => self::normalize_sku( $value ),
			$values
		) ) ) );
	}
}
