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

	private const NAVIGATION_GROUP_SLUGS = [
		'automatic-taping-tools',
		'semi-automatic-taping-tools',
		'stilts-accessories',
	];

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
		$brands            = [];
		$categories        = [];
		$display_by_brand  = [];
		$navigation_groups = [];
		$page              = 1;
		$per_page          = 100;

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

				if ( empty( $dto['isParts'] ) ) {
					$navigation = self::canonical_navigation_membership( (array) ( $raw['categories'] ?? [] ) );
					if ( null !== $navigation ) {
						$group      = $navigation['group'];
						$child      = $navigation['child'];
						$group_slug = $group['slug'];

						if ( ! isset( $navigation_groups[ $group_slug ] ) ) {
							$navigation_groups[ $group_slug ] = [
								'key'          => $group_slug,
								'label'        => $group['label'],
								'slug'         => $group_slug,
								'productCount' => 0,
								'children'     => [],
							];
						}

						$navigation_groups[ $group_slug ]['productCount']++;
						if ( null !== $child ) {
							$child_slug = $child['slug'];
							if ( ! isset( $navigation_groups[ $group_slug ]['children'][ $child_slug ] ) ) {
								$navigation_groups[ $group_slug ]['children'][ $child_slug ] = [
									'key'          => $child_slug,
									'label'        => $child['label'],
									'slug'         => $child_slug,
									'productCount' => 0,
								];
							}
							$navigation_groups[ $group_slug ]['children'][ $child_slug ]['productCount']++;
						}
					}
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

		$navigation_result = [];
		foreach ( self::NAVIGATION_GROUP_SLUGS as $group_slug ) {
			if ( ! isset( $navigation_groups[ $group_slug ] ) ) {
				continue;
			}
			$group = $navigation_groups[ $group_slug ];
			$group['children'] = array_values( $group['children'] );
			usort( $group['children'], static fn ( $a, $b ): int => strcmp( (string) $a['label'], (string) $b['label'] ) );
			$navigation_result[] = $group;
		}

		return [
			'brands'                   => $brands,
			'categories'               => $categories,
			'displayCategoriesByBrand' => $display_result,
			'navigationGroups'         => $navigation_result,
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

	/**
	 * Normalize a taxonomy label before exposing it through navigationGroups.
	 * WordPress term names can already contain HTML entities (for example
	 * "&amp;"). React renders API strings as text, so decode once at the API
	 * boundary and then sanitize the resulting plain-text label.
	 */
	private static function navigation_label( string $label, string $slug ): string {
		if ( 'stilts-accessories' === $slug ) {
			return 'Stilts';
		}

		return sanitize_text_field( wp_specialchars_decode( $label, ENT_QUOTES ) );
	}

	/**
	 * Resolve a product's customer navigation membership from the authoritative
	 * WooCommerce product_cat hierarchy. This deliberately ignores legacy
	 * `_dtb_display_category_key` values so storefront navigation cannot drift
	 * into a parallel taxonomy.
	 *
	 * @param array<int,array<string,mixed>> $raw_categories
	 * @return array{group:array{label:string,slug:string},child:?array{label:string,slug:string}}|null
	 */
	private static function canonical_navigation_membership( array $raw_categories ): ?array {
		$best = null;

		foreach ( $raw_categories as $raw_category ) {
			$term_id = absint( $raw_category['id'] ?? 0 );
			if ( ! $term_id ) {
				continue;
			}

			$path = self::product_category_path( $term_id );
			if ( count( $path ) < 2 ) {
				continue;
			}

			foreach ( $path as $index => $term ) {
				if ( ! in_array( $term['slug'], self::NAVIGATION_GROUP_SLUGS, true ) ) {
					continue;
				}

				$child = $path[ $index + 1 ] ?? null;
				$candidate = [
					'group' => $term,
					'child' => $child,
					'depth' => count( $path ),
				];

				if ( null === $best || $candidate['depth'] > $best['depth'] ) {
					$best = $candidate;
				}
				break;
			}
		}

		if ( null === $best ) {
			return null;
		}

		return [
			'group' => $best['group'],
			'child' => $best['child'],
		];
	}

	/**
	 * Return a root-to-leaf product_cat path with request-local term caching.
	 *
	 * @return array<int,array{label:string,slug:string}>
	 */
	private static function product_category_path( int $term_id ): array {
		static $path_cache = [];
		if ( isset( $path_cache[ $term_id ] ) ) {
			return $path_cache[ $term_id ];
		}

		$term = get_term( $term_id, 'product_cat' );
		if ( ! $term instanceof WP_Term || is_wp_error( $term ) ) {
			$path_cache[ $term_id ] = [];
			return [];
		}

		$ancestor_ids = array_reverse( array_map( 'absint', get_ancestors( $term_id, 'product_cat', 'taxonomy' ) ) );
		$term_ids     = array_merge( $ancestor_ids, [ $term_id ] );
		$path         = [];

		foreach ( $term_ids as $path_term_id ) {
			$path_term = get_term( $path_term_id, 'product_cat' );
			if ( ! $path_term instanceof WP_Term || is_wp_error( $path_term ) ) {
				continue;
			}
			$slug   = sanitize_title( $path_term->slug );
			$path[] = [
				'label' => self::navigation_label( (string) $path_term->name, $slug ),
				'slug'  => $slug,
			];
		}

		$path_cache[ $term_id ] = $path;
		return $path;
	}
}
