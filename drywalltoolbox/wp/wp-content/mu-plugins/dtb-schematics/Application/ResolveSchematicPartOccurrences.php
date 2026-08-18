<?php
/**
 * DTB Schematics — specific hotspot-part to WooCommerce resolution.
 *
 * WooCommerce remains authoritative for product identity. This service owns
 * only the schematic-part relationship and never creates products or rewrites
 * SKU, MPN, GTIN, brand, or other catalog identifiers.
 *
 * Resolution order:
 *   1. preserve an existing explicit product/variation override;
 *   2. preserve an operator-set intentionally-not-sold state;
 *   3. exact WooCommerce SKU;
 *   4. exact brand + protected manufacturer part number;
 *   5. unique same-brand normalized SKU where the only difference is
 *      formatting punctuation/spacing;
 *   6. explicit compatibility relationship by exact SKU/MPN;
 *   7. unresolved.
 *
 * The normalized-SKU step is intentionally narrow. It never uses title
 * similarity, never crosses brands, rejects weak numeric callout identifiers,
 * and resolves only when all generated formatting aliases identify one and
 * only one WooCommerce product/variation.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/** Resolve every normalized parts_catalog entry for one schematic record. */
function dtb_schematic_resolve_part_occurrences_for_record( DTB_Schematic_Record_Entity $record, array $dataset ): array {
	$existing_by_ref = [];
	foreach ( $record->parts as $existing ) {
		$existing_by_ref[ $existing['part_ref'] ] = $existing;
	}

	$compatible_part_ids = dtb_schematic_resolve_compatible_part_product_ids( $record->linked_products );
	$resolved            = [];

	foreach ( (array) ( $dataset['parts_catalog'] ?? [] ) as $catalog_part ) {
		$part_ref = (string) ( $catalog_part['part_ref'] ?? '' );
		if ( '' === $part_ref ) {
			continue;
		}

		$occurrence_count = dtb_schematic_hotspot_dataset_occurrence_count_for_part( $dataset, $part_ref );
		$existing          = $existing_by_ref[ $part_ref ] ?? null;

		if ( $existing
			&& DTB_SCHEMATIC_PART_RESOLUTION_EXPLICIT_ID === (string) ( $existing['resolution_method'] ?? '' )
			&& (int) ( $existing['product_id'] ?? 0 ) > 0 ) {
			$resolved[] = dtb_schematic_part_relationship_make( array_merge( $existing, [ 'occurrence_count' => $occurrence_count ] ) );
			continue;
		}
		if ( $existing && DTB_SCHEMATIC_PART_STATE_NOT_SOLD === (string) ( $existing['resolution_state'] ?? '' ) ) {
			$resolved[] = dtb_schematic_part_relationship_make( array_merge( $existing, [ 'occurrence_count' => $occurrence_count ] ) );
			continue;
		}

		$resolution = dtb_schematic_resolve_single_part( $record, $catalog_part, $compatible_part_ids );
		$resolved[] = dtb_schematic_part_relationship_make(
			[
				'part_ref'          => $part_ref,
				// Legacy datasets may use display_id as a diagram callout rather
				// than a manufacturer number. It remains preserved for display /
				// provenance; source SKU is the stronger identity when present.
				'mpn'               => (string) ( $catalog_part['display_id'] ?? $part_ref ),
				'sku'               => (string) ( $catalog_part['sku'] ?? '' ),
				'brand'             => $record->brand_name ?: $record->brand_id,
				'title'             => (string) ( $catalog_part['name'] ?? '' ),
				'product_id'        => $resolution['product_id'],
				'resolution_method' => $resolution['method'],
				'resolution_state'  => $resolution['state'],
				'occurrence_count'  => $occurrence_count,
			]
		);
	}

	return $resolved;
}

/**
 * Resolve one source part using deterministic product-identity evidence only.
 *
 * @return array{product_id:int,method:string,state:string}
 */
function dtb_schematic_resolve_single_part( DTB_Schematic_Record_Entity $record, array $catalog_part, array $compatible_part_ids ): array {
	$sku = trim( (string) ( $catalog_part['sku'] ?? '' ) );
	if ( '' !== $sku && function_exists( 'wc_get_product_id_by_sku' ) ) {
		$product_id = (int) wc_get_product_id_by_sku( $sku );
		if ( $product_id > 0 ) {
			return [
				'product_id' => $product_id,
				'method'     => DTB_SCHEMATIC_PART_RESOLUTION_EXACT_SKU,
				'state'      => DTB_SCHEMATIC_PART_STATE_RESOLVED,
			];
		}
	}

	$mpn   = trim( (string) ( $catalog_part['display_id'] ?? '' ) );
	$brand = (string) ( $record->brand_name ?: $record->brand_id );
	if ( '' !== $mpn && '' !== $brand && function_exists( 'get_posts' ) && class_exists( 'DTB_ProductMeta' ) ) {
		$product_id = dtb_schematic_find_product_by_exact_brand_and_mpn( $brand, $mpn );
		if ( $product_id > 0 ) {
			return [
				'product_id' => $product_id,
				'method'     => DTB_SCHEMATIC_PART_RESOLUTION_BRAND_MPN,
				'state'      => DTB_SCHEMATIC_PART_STATE_RESOLVED,
			];
		}
	}

	// Formatting-only SKU reconciliation. The source SKU remains unchanged;
	// this only establishes a relationship when one same-brand Woo product is
	// uniquely identified by punctuation/spacing variants of that SKU.
	$normalized_product_id = dtb_schematic_find_product_by_unique_normalized_sku( $brand, $sku );
	if ( $normalized_product_id > 0 ) {
		return [
			'product_id' => $normalized_product_id,
			'method'     => DTB_SCHEMATIC_PART_RESOLUTION_NORMALIZED_SKU,
			'state'      => DTB_SCHEMATIC_PART_STATE_RESOLVED,
		];
	}

	if ( ! empty( $compatible_part_ids ) && function_exists( 'wc_get_product' ) ) {
		foreach ( $compatible_part_ids as $compatible_id ) {
			$product = wc_get_product( $compatible_id );
			if ( ! $product ) {
				continue;
			}
			$candidate_sku = trim( (string) $product->get_sku() );
			if ( '' !== $sku && '' !== $candidate_sku && 0 === strcasecmp( $candidate_sku, $sku ) ) {
				return [
					'product_id' => $compatible_id,
					'method'     => DTB_SCHEMATIC_PART_RESOLUTION_COMPATIBILITY,
					'state'      => DTB_SCHEMATIC_PART_STATE_RESOLVED,
				];
			}
			$candidate_mpn = class_exists( 'DTB_ProductMeta' ) ? trim( (string) get_post_meta( $compatible_id, DTB_ProductMeta::MPN, true ) ) : '';
			if ( '' !== $mpn && '' !== $candidate_mpn && 0 === strcasecmp( $candidate_mpn, $mpn ) ) {
				return [
					'product_id' => $compatible_id,
					'method'     => DTB_SCHEMATIC_PART_RESOLUTION_COMPATIBILITY,
					'state'      => DTB_SCHEMATIC_PART_STATE_RESOLVED,
				];
			}
		}
	}

	return [
		'product_id' => 0,
		'method'     => DTB_SCHEMATIC_PART_RESOLUTION_UNRESOLVED,
		'state'      => DTB_SCHEMATIC_PART_STATE_UNRESOLVED,
	];
}

/** Exact brand + protected MPN lookup. Ambiguous matches remain unresolved. */
function dtb_schematic_find_product_by_exact_brand_and_mpn( string $brand, string $mpn ): int {
	$ids = get_posts(
		[
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => 2,
			'fields'         => 'ids',
			'meta_query'     => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'relation' => 'AND',
				[
					'key'     => DTB_ProductMeta::MPN,
					'value'   => $mpn,
					'compare' => '=',
				],
				[
					'relation' => 'OR',
					[
						'key'     => DTB_ProductMeta::BRAND_KEY,
						'value'   => $brand,
						'compare' => '=',
					],
					[
						'key'     => DTB_ProductMeta::BRAND_LABEL,
						'value'   => $brand,
						'compare' => '=',
					],
				],
			],
		]
	);

	$ids = array_values( array_map( 'intval', (array) $ids ) );
	return 1 === count( $ids ) ? $ids[0] : 0;
}

/**
 * Find exactly one same-brand product whose SKU differs from the source SKU
 * only by punctuation/spacing.
 *
 * This does not scan the product catalog and does not perform fuzzy matching.
 * It generates a small bounded set of deterministic aliases and asks the
 * WooCommerce SKU lookup for each one.
 */
function dtb_schematic_find_product_by_unique_normalized_sku( string $brand, string $source_sku ): int {
	if ( ! function_exists( 'wc_get_product_id_by_sku' ) || ! function_exists( 'wc_get_product' ) ) {
		return 0;
	}
	if ( ! dtb_schematic_normalized_sku_is_strong( $source_sku ) ) {
		return 0;
	}

	$source_normalized = dtb_schematic_normalize_product_identifier( $source_sku );
	$product_ids       = [];
	foreach ( dtb_schematic_normalized_sku_aliases( $source_sku ) as $alias ) {
		if ( 0 === strcasecmp( trim( $source_sku ), $alias ) ) {
			continue;
		}
		$product_id = (int) wc_get_product_id_by_sku( $alias );
		if ( $product_id <= 0 ) {
			continue;
		}
		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			continue;
		}
		$candidate_sku = trim( (string) $product->get_sku() );
		if ( $source_normalized !== dtb_schematic_normalize_product_identifier( $candidate_sku ) ) {
			continue;
		}
		if ( ! dtb_schematic_product_brand_matches( $product_id, $brand ) ) {
			continue;
		}
		$product_ids[ $product_id ] = true;
		if ( count( $product_ids ) > 1 ) {
			return 0;
		}
	}

	$ids = array_keys( $product_ids );
	return 1 === count( $ids ) ? (int) $ids[0] : 0;
}

/** Normalize identifier punctuation for comparison only. */
function dtb_schematic_normalize_product_identifier( string $value ): string {
	$value = strtolower( trim( $value ) );
	return preg_replace( '/[^a-z0-9]+/', '', $value ) ?: '';
}

/** Reject diagram callout numbers and other weak identifiers. */
function dtb_schematic_normalized_sku_is_strong( string $sku ): bool {
	$normalized = dtb_schematic_normalize_product_identifier( $sku );
	if ( strlen( $normalized ) < 4 ) {
		return false;
	}
	if ( ctype_digit( $normalized ) ) {
		return strlen( $normalized ) >= 4;
	}
	return (bool) preg_match( '/[a-z]/', $normalized ) && (bool) preg_match( '/[0-9]/', $normalized );
}

/** Generate a bounded set of punctuation/spacing aliases for a strong SKU. */
function dtb_schematic_normalized_sku_aliases( string $sku ): array {
	$sku = trim( $sku );
	if ( '' === $sku ) {
		return [];
	}

	$aliases = [ $sku => true ];
	$clean   = trim( preg_replace( '/[\x{2018}\x{2019}\x{201C}\x{201D}\'\"]+/u', '', $sku ) ?: $sku );
	$aliases[ $clean ] = true;

	preg_match_all( '/[A-Za-z]+|\d+(?:\.\d+)?/', $clean, $matches );
	$tokens = array_values( array_filter( (array) ( $matches[0] ?? [] ), static fn( $token ) => '' !== $token ) );
	if ( count( $tokens ) >= 2 && count( $tokens ) <= 5 ) {
		$separators = [ '', '-', ' ' ];
		$build = static function ( array $parts, int $index, string $current ) use ( &$build, $tokens, $separators, &$aliases ): void {
			if ( count( $aliases ) >= 64 ) {
				return;
			}
			if ( $index >= count( $tokens ) ) {
				$aliases[ $current ] = true;
				return;
			}
			foreach ( $separators as $separator ) {
				$build( $parts, $index + 1, $current . $separator . $tokens[ $index ] );
			}
		};
		$build( $tokens, 1, $tokens[0] );
	}

	$normalized = dtb_schematic_normalize_product_identifier( $clean );
	if ( '' !== $normalized ) {
		$aliases[ $normalized ] = true;
		$aliases[ strtoupper( $normalized ) ] = true;
	}

	return array_slice( array_keys( $aliases ), 0, 64 );
}

/** Same-brand guard for normalized-SKU resolution, including variations. */
function dtb_schematic_product_brand_matches( int $product_id, string $expected_brand ): bool {
	if ( $product_id <= 0 || '' === trim( $expected_brand ) || ! class_exists( 'DTB_ProductMeta' ) ) {
		return false;
	}

	$product = function_exists( 'wc_get_product' ) ? wc_get_product( $product_id ) : null;
	$ids     = [ $product_id ];
	if ( $product && $product->is_type( 'variation' ) && $product->get_parent_id() > 0 ) {
		$ids[] = $product->get_parent_id();
	}

	$expected_key = dtb_schematic_resolution_brand_key( $expected_brand );
	foreach ( array_values( array_unique( $ids ) ) as $id ) {
		foreach ( [ DTB_ProductMeta::BRAND_KEY, DTB_ProductMeta::BRAND_LABEL ] as $meta_key ) {
			$actual = trim( (string) get_post_meta( $id, $meta_key, true ) );
			if ( '' !== $actual && $expected_key === dtb_schematic_resolution_brand_key( $actual ) ) {
				return true;
			}
		}
	}
	return false;
}

/** Canonical comparison key for known brand-label formatting differences. */
function dtb_schematic_resolution_brand_key( string $brand ): string {
	$key = strtolower( preg_replace( '/[^a-z0-9]+/', '', trim( $brand ) ) ?: '' );
	$aliases = [
		'columbiatools'         => 'columbia',
		'columbia'              => 'columbia',
		'platinumdrywalltools'  => 'platinum',
		'platinumtools'         => 'platinum',
		'platinum'              => 'platinum',
		'level5tools'           => 'level5',
		'level5'                => 'level5',
		'tapetech'              => 'tapetech',
		'durastilts'            => 'durastilts',
		'durastilt'             => 'durastilts',
		'surpro'                => 'surpro',
	];
	return $aliases[ $key ] ?? $key;
}

/** Products explicitly recorded as compatible with linked tool products. */
function dtb_schematic_resolve_compatible_part_product_ids( array $linked_product_ids ): array {
	if ( empty( $linked_product_ids ) || ! function_exists( 'dtb_product_mapping_repo_get_compatibility' ) ) {
		return [];
	}

	$ids = [];
	foreach ( $linked_product_ids as $tool_id ) {
		$compat = dtb_product_mapping_repo_get_compatibility( (int) $tool_id, 'tool' );
		foreach ( (array) ( $compat['related'] ?? [] ) as $related ) {
			if ( ! empty( $related['id'] ) ) {
				$ids[] = (int) $related['id'];
			}
		}
	}

	return array_values( array_unique( $ids ) );
}
