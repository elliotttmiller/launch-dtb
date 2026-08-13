<?php
/**
 * DTB Schematics — ResolveSchematicPartOccurrences (Phase 5 application service).
 *
 * The single backend part-resolution service for schematic hotspot parts
 * (Domain/SchematicPartRelationship.php). This is distinct from
 * Application/ResolveSchematicParts.php / Services/SchematicPartResolver.php,
 * which resolve the schematic's *linked tool products* (the whole tool a
 * schematic belongs to) — a different relationship. See this file's
 * docblock section "RELATION TO EXISTING RESOLVERS" below.
 *
 * WooCommerce remains authoritative for the products themselves. This
 * service only decides which WooCommerce product/variation ID a schematic
 * part relationship should point at, using exact-match resolution only:
 *
 *   1. explicit WooCommerce product/variation ID already recorded for this
 *      part_ref (an operator-set override — never re-resolved/clobbered);
 *   2. exact SKU match (wc_get_product_id_by_sku);
 *   3. exact brand + protected manufacturer part number
 *      (DTB_ProductMeta::BRAND_KEY + DTB_ProductMeta::MPN, dtb-catalog-platform);
 *   4. explicit compatibility relationship already recorded against one of
 *      the schematic's linked tool products (dtb-catalog-platform
 *      Infrastructure/ProductRelationshipRepository.php — exact product IDs
 *      only, never fuzzy text matching);
 *   5. unresolved.
 *
 * An operator-set "intentionally not sold" state is likewise preserved
 * verbatim across batch runs, never re-resolved.
 *
 * Resolution runs in bounded backend batches (see
 * dtb_schematic_resolve_part_occurrences_for_record() — bounded by the
 * dataset's own parts_catalog size, itself bounded to one schematic) as part
 * of Application/MigrateSchematicHotspotDatasets.php. Nothing here is called
 * per-hotspot-click or per-request; the public API only reads the result
 * stored by Infrastructure/SchematicRecordRepository.php's `parts` field.
 *
 * RELATION TO EXISTING RESOLVERS: Application/ResolveSchematicParts.php and
 * Services/SchematicPartResolver.php answer "which WooCommerce products does
 * this whole schematic represent" (used for `linked_products` /
 * cross-linking, e.g. via `_dtb_schematic_id` product meta). This service
 * answers "which WooCommerce product does this specific hotspot part
 * reference." Both may legitimately coexist; they resolve different
 * relationships. See this phase's report for what, if anything, should be
 * retired in Phase 9.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Resolve every parts_catalog entry in a normalized hotspot dataset against
 * WooCommerce, producing a full replacement `parts` array (SchematicPartRelationship
 * shape) for the schematic record. Existing operator overrides
 * (explicit_id / not_sold) for a given part_ref are preserved verbatim.
 *
 * @param DTB_Schematic_Record_Entity $record  The schematic record (read for its
 *                                              existing `parts`, `brand_id`/`brand_name`, and `linked_products`).
 * @param array                       $dataset Normalized hotspot dataset, see dtb_schematic_hotspot_dataset_make().
 * @return array[] List of dtb_schematic_part_relationship_make() entries.
 */
function dtb_schematic_resolve_part_occurrences_for_record( DTB_Schematic_Record_Entity $record, array $dataset ): array {
	$existing_by_ref = [];
	foreach ( $record->parts as $existing ) {
		$existing_by_ref[ $existing['part_ref'] ] = $existing;
	}

	$compatible_part_ids = dtb_schematic_resolve_compatible_part_product_ids( $record->linked_products );

	$resolved = [];
	foreach ( (array) ( $dataset['parts_catalog'] ?? [] ) as $catalog_part ) {
		$part_ref = (string) ( $catalog_part['part_ref'] ?? '' );
		if ( '' === $part_ref ) {
			continue;
		}

		$occurrence_count = dtb_schematic_hotspot_dataset_occurrence_count_for_part( $dataset, $part_ref );
		$existing          = $existing_by_ref[ $part_ref ] ?? null;

		// Preserve operator overrides verbatim — never re-resolved by the batch pipeline.
		if ( $existing && in_array( $existing['resolution_method'], [ DTB_SCHEMATIC_PART_RESOLUTION_EXPLICIT_ID ], true ) && $existing['product_id'] > 0 ) {
			$resolved[] = dtb_schematic_part_relationship_make( array_merge( $existing, [ 'occurrence_count' => $occurrence_count ] ) );
			continue;
		}
		if ( $existing && DTB_SCHEMATIC_PART_STATE_NOT_SOLD === $existing['resolution_state'] ) {
			$resolved[] = dtb_schematic_part_relationship_make( array_merge( $existing, [ 'occurrence_count' => $occurrence_count ] ) );
			continue;
		}

		$resolution = dtb_schematic_resolve_single_part( $record, $catalog_part, $compatible_part_ids );

		$resolved[] = dtb_schematic_part_relationship_make(
			[
				'part_ref'          => $part_ref,
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
 * Apply the exact-match resolution order (steps 2-4; step 1/5 are handled by
 * the caller via existing-override preservation / default-unresolved).
 *
 * @return array{product_id:int, method:string, state:string}
 */
function dtb_schematic_resolve_single_part( DTB_Schematic_Record_Entity $record, array $catalog_part, array $compatible_part_ids ): array {
	$sku = trim( (string) ( $catalog_part['sku'] ?? '' ) );
	if ( '' !== $sku && function_exists( 'wc_get_product_id_by_sku' ) ) {
		$product_id = (int) wc_get_product_id_by_sku( $sku );
		if ( $product_id > 0 ) {
			return [ 'product_id' => $product_id, 'method' => DTB_SCHEMATIC_PART_RESOLUTION_EXACT_SKU, 'state' => DTB_SCHEMATIC_PART_STATE_RESOLVED ];
		}
	}

	$mpn = trim( (string) ( $catalog_part['display_id'] ?? '' ) );
	$brand = $record->brand_name ?: $record->brand_id;
	if ( '' !== $mpn && '' !== $brand && function_exists( 'get_posts' ) && class_exists( 'DTB_ProductMeta' ) ) {
		$product_id = dtb_schematic_find_product_by_exact_brand_and_mpn( $brand, $mpn );
		if ( $product_id > 0 ) {
			return [ 'product_id' => $product_id, 'method' => DTB_SCHEMATIC_PART_RESOLUTION_BRAND_MPN, 'state' => DTB_SCHEMATIC_PART_STATE_RESOLVED ];
		}
	}

	// Explicit compatibility relationship: exact SKU/MPN cross-referenced
	// against products already recorded as compatible with one of this
	// schematic's linked tool products. Never a text/fuzzy match.
	if ( ! empty( $compatible_part_ids ) && function_exists( 'wc_get_product' ) ) {
		foreach ( $compatible_part_ids as $compatible_id ) {
			$product = wc_get_product( $compatible_id );
			if ( ! $product ) {
				continue;
			}
			$candidate_sku = trim( (string) $product->get_sku() );
			if ( '' !== $sku && '' !== $candidate_sku && 0 === strcasecmp( $candidate_sku, $sku ) ) {
				return [ 'product_id' => $compatible_id, 'method' => DTB_SCHEMATIC_PART_RESOLUTION_COMPATIBILITY, 'state' => DTB_SCHEMATIC_PART_STATE_RESOLVED ];
			}
			$candidate_mpn = trim( (string) get_post_meta( $compatible_id, DTB_ProductMeta::MPN, true ) );
			if ( '' !== $mpn && '' !== $candidate_mpn && 0 === strcasecmp( $candidate_mpn, $mpn ) ) {
				return [ 'product_id' => $compatible_id, 'method' => DTB_SCHEMATIC_PART_RESOLUTION_COMPATIBILITY, 'state' => DTB_SCHEMATIC_PART_STATE_RESOLVED ];
			}
		}
	}

	return [ 'product_id' => 0, 'method' => DTB_SCHEMATIC_PART_RESOLUTION_UNRESOLVED, 'state' => DTB_SCHEMATIC_PART_STATE_UNRESOLVED ];
}

/**
 * Exact brand + protected MPN lookup against dtb-catalog-platform's product
 * meta contract (DTB_ProductMeta::BRAND_KEY / DTB_ProductMeta::MPN). No
 * fuzzy/partial matching — both fields must match exactly (case-insensitive
 * on the MPN only, since manufacturer part numbers are frequently
 * transcribed with inconsistent casing; brand comparison is exact).
 */
function dtb_schematic_find_product_by_exact_brand_and_mpn( string $brand, string $mpn ): int {
	$ids = get_posts(
		[
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => 2, // Only need to know if exactly one match exists; >1 is ambiguous and treated as unresolved.
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
 * Products explicitly recorded (via dtb-catalog-platform's
 * `_dtb_compatible_parts` relationship) as compatible with any of the
 * schematic's linked tool products. Exact relationship data only.
 *
 * @param int[] $linked_product_ids
 * @return int[]
 */
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
