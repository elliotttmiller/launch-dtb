<?php
/**
 * DTB_CatalogFacetsController
 *
 * Handles GET /wp-json/dtb/v1/catalog/facets.
 *
 * Public storefront facets are built in-process from the canonical WordPress
 * product index plus WooCommerce product objects. They must not depend on a
 * self-HTTP Woo REST call or server consumer credentials.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CatalogFacetsController {

	public static function register_routes(): void {
		register_rest_route( 'dtb/v1', '/catalog/facets', [
			'methods'             => 'GET',
			'callback'            => [ self::class, 'handle' ],
			'permission_callback' => '__return_true',
			'args'                => [
				'brand'            => [ 'sanitize_callback' => 'sanitize_text_field' ],
				'category'         => [ 'sanitize_callback' => 'sanitize_key' ],
				'display_category' => [ 'sanitize_callback' => 'sanitize_key' ],
				'product_kind'     => [ 'sanitize_callback' => 'sanitize_key' ],
				'is_parts'         => [ 'sanitize_callback' => 'sanitize_text_field' ],
			],
		] );
	}

	public static function handle( WP_REST_Request $request ): WP_REST_Response {
		if ( ! dtb_check_origin() ) {
			return new WP_REST_Response( dtb_error_envelope( 'forbidden_origin', 'Origin not allowed.', 403 ), 403 );
		}

		$scope = [
			'brand'            => (string) $request->get_param( 'brand' ),
			'category'         => (string) $request->get_param( 'category' ),
			'display_category' => (string) $request->get_param( 'display_category' ),
			'product_kind'     => (string) $request->get_param( 'product_kind' ),
			'is_parts'         => $request->get_param( 'is_parts' ),
		];

		$facets = self::build_local_facets( $scope );
		if ( is_wp_error( $facets ) ) {
			$status = (int) ( $facets->get_error_data()['status'] ?? 503 );
			return new WP_REST_Response(
				dtb_error_envelope( $facets->get_error_code(), $facets->get_error_message(), $status ),
				$status
			);
		}

		return new WP_REST_Response( $facets, 200 );
	}

	/**
	 * Build scoped facets without self-HTTP or credential-bearing proxy calls.
	 *
	 * @param array<string,mixed> $scope
	 * @return array<string,mixed>|WP_Error
	 */
	private static function build_local_facets( array $scope ) {
		$brands           = [];
		$categories       = [];
		$display_by_brand = [];
		$page             = 1;
		$per_page         = 100;

		do {
			$query = DTB_CatalogProductRepository::find_ids( [
				'brand'            => (string) ( $scope['brand'] ?? '' ),
				'category'         => (string) ( $scope['category'] ?? '' ),
				'display_category' => (string) ( $scope['display_category'] ?? '' ),
				'product_kind'     => (string) ( $scope['product_kind'] ?? '' ),
				'is_parts'         => self::normalize_optional_bool( $scope['is_parts'] ?? null ),
				'page'             => $page,
				'per_page'         => $per_page,
				'sort'             => 'az',
			] );

			$ids = array_values( array_filter( array_map( 'absint', (array) ( $query['ids'] ?? [] ) ) ) );
			if ( [] === $ids ) {
				break;
			}

			$response = dtb_catalog_wc_get_products_by_ids_response( $ids );
			if ( ! $response instanceof WP_REST_Response || 200 !== $response->get_status() ) {
				if ( class_exists( 'DTB_Logger' ) ) {
					DTB_Logger::warning( 'Catalog facet local Woo read failed', [
						'page'   => $page,
						'status' => $response instanceof WP_REST_Response ? $response->get_status() : 0,
					] );
				}
				return new WP_Error( 'catalog_facets_unavailable', 'Catalog navigation data is temporarily unavailable.', [ 'status' => 503 ] );
			}

			$raw_products = $response->get_data();
			if ( ! is_array( $raw_products ) ) {
				return new WP_Error( 'catalog_facets_invalid_response', 'Catalog navigation data is temporarily unavailable.', [ 'status' => 503 ] );
			}

			foreach ( $raw_products as $raw ) {
				if ( ! is_array( $raw ) ) {
					continue;
				}

				$dto      = dtb_catalog_normalize_product( $raw );
				$brand    = self::canonical_brand( $dto['brand'] ?? [] );
				$category = is_array( $dto['category'] ?? null ) ? $dto['category'] : [];
				$display  = self::customer_display_category( $dto );

				if ( '' !== $brand['key'] ) {
					if ( ! isset( $brands[ $brand['key'] ] ) ) {
						$brands[ $brand['key'] ] = [
							'key'          => $brand['key'],
							'label'        => $brand['label'],
							'slug'         => $brand['slug'],
							'productCount' => 0,
						];
					}
					$brands[ $brand['key'] ]['productCount']++;
				}

				$category_key = sanitize_key( (string) ( $category['key'] ?? '' ) );
				if ( '' !== $category_key ) {
					if ( ! isset( $categories[ $category_key ] ) ) {
						$categories[ $category_key ] = [
							'key'          => $category_key,
							'label'        => sanitize_text_field( (string) ( $category['label'] ?? $category_key ) ),
							'slug'         => sanitize_title( (string) ( $category['slug'] ?? $category_key ) ),
							'productCount' => 0,
						];
					}
					$categories[ $category_key ]['productCount']++;
				}

				$display_key = sanitize_key( (string) ( $display['key'] ?? '' ) );
				if ( '' !== $brand['key'] && '' !== $display_key ) {
					$display_by_brand[ $brand['key'] ] ??= [];
					if ( ! isset( $display_by_brand[ $brand['key'] ][ $display_key ] ) ) {
						$display_by_brand[ $brand['key'] ][ $display_key ] = [
							'key'          => $display_key,
							'label'        => sanitize_text_field( (string) ( $display['label'] ?? $display_key ) ),
							'slug'         => sanitize_title( (string) ( $display['slug'] ?? $display_key ) ),
							'productCount' => 0,
							'image'        => '',
						];
					}
					$entry =& $display_by_brand[ $brand['key'] ][ $display_key ];
					$entry['productCount']++;
					if ( '' === $entry['image'] && empty( $dto['isParts'] ) ) {
						$entry['image'] = esc_url_raw( (string) ( $dto['media']['image'] ?? '' ) );
					}
					unset( $entry );
				}
			}

			$page++;
			$total_pages = max( 1, absint( $query['totalPages'] ?? 1 ) );
		} while ( $page <= $total_pages );

		$brands     = array_values( $brands );
		$categories = array_values( $categories );
		usort( $brands, static fn ( $a, $b ): int => strcmp( (string) $a['label'], (string) $b['label'] ) );
		usort( $categories, static fn ( $a, $b ): int => strcmp( (string) $a['label'], (string) $b['label'] ) );

		$display_result = [];
		foreach ( $display_by_brand as $brand_key => $entries ) {
			$display_result[ $brand_key ] = array_values( $entries );
			usort( $display_result[ $brand_key ], static fn ( $a, $b ): int => strcmp( (string) $a['label'], (string) $b['label'] ) );
		}

		return [
			'brands'                   => $brands,
			'categories'               => $categories,
			'displayCategoriesByBrand' => $display_result,
		];
	}

	/** @return int|null */
	private static function normalize_optional_bool( $value ): ?int {
		if ( null === $value || '' === $value ) {
			return null;
		}
		return filter_var( $value, FILTER_VALIDATE_BOOLEAN ) ? 1 : 0;
	}

	/** @param array<string,mixed> $brand */
	private static function canonical_brand( array $brand ): array {
		$source     = trim( (string) ( $brand['label'] ?? $brand['key'] ?? $brand['slug'] ?? '' ) );
		$normalized = DTB_BrandNormalizer::normalize( $source );
		return [
			'key'   => sanitize_key( (string) ( $normalized['key'] ?? '' ) ),
			'label' => sanitize_text_field( (string) ( $normalized['label'] ?? $source ) ),
			'slug'  => sanitize_title( (string) ( $normalized['slug'] ?? $source ) ),
		];
	}

	/** @param array<string,mixed> $dto */
	private static function customer_display_category( array $dto ): array {
		if ( ! empty( $dto['isParts'] ) ) {
			return [ 'key' => 'parts', 'label' => 'Parts', 'slug' => 'parts' ];
		}
		if ( function_exists( 'dtb_catalog_product_is_compound_tube' ) && dtb_catalog_product_is_compound_tube( $dto ) ) {
			return [ 'key' => 'compound_tubes', 'label' => 'Compound Tubes', 'slug' => 'compound-tubes' ];
		}
		return is_array( $dto['displayCategory'] ?? null ) ? $dto['displayCategory'] : [];
	}
}
