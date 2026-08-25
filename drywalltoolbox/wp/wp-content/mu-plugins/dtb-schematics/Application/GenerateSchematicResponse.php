<?php
/**
 * DTB Schematics — GenerateSchematicResponse (application service).
 *
 * Builds public-safe response DTOs from an authoritative schematic record.
 * No controller consumes these yet (the public detail/collection REST
 * endpoints are Phase 4), but the shape is deliberately final so Phase 4 can
 * build thin controllers on top of these functions without re-architecting.
 *
 * Never expose: local filesystem paths, unpublished records, administrative
 * notes, raw WordPress metadata, or implementation-specific WooCommerce
 * internals. Callers are responsible for only invoking these against
 * records they intend to expose (e.g. after filtering on lifecycle).
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * The option name backing the public schematics catalog/cache version.
 * Bumped by dtb_schematics_invalidate_domain_cache() (see
 * Application/ManageSchematicRecord.php) so the public REST layer
 * (Rest/SchematicPublicApiController.php) has one coherent version number to
 * key ETags/Cache-Control validation off of, without a second invalidation
 * mechanism.
 */
function dtb_schematics_public_catalog_version_option_name(): string {
	return 'dtb_schematics_public_catalog_version';
}

/**
 * Current public catalog/cache version. Starts at 1 and increments on every
 * domain-cache invalidation (schematic create/update/publish/retire/etc.).
 */
function dtb_schematics_public_catalog_version(): int {
	$version = (int) get_option( dtb_schematics_public_catalog_version_option_name(), 1 );
	return $version > 0 ? $version : 1;
}

/**
 * Bump the public catalog/cache version. Only called from
 * dtb_schematics_invalidate_domain_cache().
 */
function dtb_schematics_bump_public_catalog_version(): int {
	$next = dtb_schematics_public_catalog_version() + 1;
	update_option( dtb_schematics_public_catalog_version_option_name(), $next, false );
	return $next;
}

/**
 * Resolve the single preview to use for a schematic per the documented
 * priority: explicit curated preview -> linked product image ->
 * first published diagram page -> explicit unavailable state.
 *
 * Catalog/card contexts must never receive an original full-resolution
 * diagram (see MEDIA OPTIMIZATION: "Do not load original full-resolution
 * diagrams on category-card screens") — every branch here resolves through
 * a thumbnail-sized WordPress image derivative, falling back to the full
 * URL only when no attachment-based derivative exists (e.g. WordPress could
 * not generate one for that mime type).
 *
 * @return array{url:string,source:string} source is one of explicit|product_image|first_page|unavailable.
 */
function dtb_schematic_resolve_preview( DTB_Schematic_Record_Entity $record ): array {
	$policy = $record->preview_policy;

	if ( DTB_SCHEMATIC_PREVIEW_MODE_EXPLICIT === $policy['mode'] && $policy['explicit_attachment_id'] > 0 ) {
		$described = dtb_schematic_attachment_repo_describe( $policy['explicit_attachment_id'] );
		if ( $described && $described['exists'] ) {
			$thumbnail_url = dtb_wp_media_get_attachment_image_url( $policy['explicit_attachment_id'], 'medium' );
			$url           = '' !== $thumbnail_url ? $thumbnail_url : $described['url'];
			if ( '' !== $url ) {
				return [ 'url' => $url, 'source' => 'explicit' ];
			}
		}
	}

	if ( ! empty( $record->linked_products ) ) {
		foreach ( $record->linked_products as $product_id ) {
			$image_url = get_the_post_thumbnail_url( $product_id, 'medium' );
			if ( $image_url ) {
				return [ 'url' => (string) $image_url, 'source' => 'product_image' ];
			}
		}
	}

	foreach ( $record->pages as $page ) {
		if ( DTB_SCHEMATIC_PAGE_STATE_MISSING_ASSET === $page['lifecycle_state'] ) {
			continue;
		}
		$attachment_id = (int) $page['attachment_id'];
		$described     = dtb_schematic_attachment_repo_describe( $attachment_id );
		if ( $described && $described['exists'] ) {
			$thumbnail_url = dtb_wp_media_get_attachment_image_url( $attachment_id, 'medium' );
			$url           = '' !== $thumbnail_url ? $thumbnail_url : $described['url'];
			if ( '' !== $url ) {
				return [ 'url' => $url, 'source' => 'first_page' ];
			}
		}
	}

	return [ 'url' => '', 'source' => 'unavailable' ];
}

/**
 * Build a customer-facing catalog/navigation entry.
 *
 * @return array{
 *   schema_version:string,
 *   catalog_version:int,
 *   id:string,
 *   title:string,
 *   brand:array{id:string,name:string},
 *   category:array{id:string,name:string},
 *   preview:array{url:string,source:string},
 *   page_count:int
 * }
 */
function dtb_schematic_generate_catalog_entry( DTB_Schematic_Record_Entity $record ): array {
	$display = dtb_schematic_resolve_display_metadata( $record );
	return [
		'schema_version'  => $record->source_schema_version ?: 'v1',
		'catalog_version' => $record->publication_version,
		'id'              => $record->canonical_id,
		'title'           => $display['title'],
		'brand'           => [
			'id'   => $display['brand_id'],
			'name' => $display['brand_name'],
		],
		'category'        => [
			'id'   => $display['category_id'],
			'name' => $display['category_name'],
		],
		// Groups size/variant siblings of one WooCommerce parent product
		// (e.g. 8FFBA/10FFBA/12FFBA/14FFBA) under a shared id so the
		// frontend can render them as one family with variant selection.
		// Empty when this schematic has no known family (see
		// Data/SkuSchematicMap.php::DTB_SCHEMATIC_FAMILY_MAP).
		'family_id'       => $record->family_id,
		// Only non-empty when this record unambiguously represents exactly
		// one variant of its family (see DTB_Schematic_Record_Entity::$variant_label).
		'variant_label'   => $record->variant_label,
		'preview'         => dtb_schematic_resolve_preview( $record ),
		'page_count'      => count( $record->pages ),
	];
}

/**
 * Build a customer-facing schematic detail response.
 *
 * Part resolution against WooCommerce is deliberately out of scope here —
 * this reads only the already-resolved `parts` relationships stored on the
 * record (see Domain/SchematicPartRelationship.php); actually resolving
 * unresolved parts in bounded batches belongs to Phase 5's product
 * resolution service.
 */
function dtb_schematic_generate_detail_response( DTB_Schematic_Record_Entity $record ): array {
	$display = dtb_schematic_resolve_display_metadata( $record );
	// Phase 5: the normalized hotspot dataset (Infrastructure/SchematicHotspotDatasetRepository.php),
	// if one has been migrated for this record. Read once per response build,
	// never per hotspot/page — the migration batch (Application/MigrateSchematicHotspotDatasets.php)
	// is what populates this, not this response builder.
	$hotspot_dataset = function_exists( 'dtb_schematic_hotspot_dataset_repo_get' )
		? dtb_schematic_hotspot_dataset_repo_get( $record->id )
		: null;

	$pages = [];
	foreach ( $record->pages as $page ) {
		$occurrences = [];
		if ( $hotspot_dataset ) {
			foreach ( dtb_schematic_hotspot_dataset_occurrences_for_page( $hotspot_dataset, (int) $page['page_number'] ) as $occurrence ) {
				if ( ! dtb_schematic_hotspot_occurrence_has_valid_coordinates( $occurrence ) ) {
					continue; // Never default an invalid/missing coordinate to page center.
				}
				$occurrences[] = [
					'hotspot_id'  => $occurrence['hotspot_id'],
					'part_ref'    => $occurrence['part_ref'],
					'shape_type'  => $occurrence['shape_type'],
					'coordinates' => $occurrence['coordinates'],
					'label'       => $occurrence['label'],
				];
			}
		}

		$pages[] = [
			'page_id'         => $page['page_id'],
			'page_number'     => $page['page_number'],
			'label'           => $page['label'],
			'media_type'      => $page['media_type'],
			'width'           => $page['width'],
			'height'          => $page['height'],
			'sources'         => $page['sources'],
			// Carried through so the public API controller
			// (dtb_schematics_public_api_order_and_annotate_pages()) can key
			// versioned media URLs off the real per-page source checksum
			// instead of always falling back to the record's publication
			// version. This is response-shape metadata only — never a raw
			// WordPress meta key — and is dropped from nothing else that
			// reads this array (see also 'source_checksum' plumbing in
			// Application/ReconcileSchematicSource.php).
			'source_checksum' => $page['source_checksum'],
			'hotspot_dataset' => [
				'type'           => $page['hotspot_dataset']['type'],
				'schema_version' => $hotspot_dataset['schema_version'] ?? $page['hotspot_dataset']['schema_version'],
				'checksum'       => $hotspot_dataset['checksum'] ?? $page['hotspot_dataset']['checksum'],
				'occurrences'    => $occurrences,
			],
			'lifecycle_state' => $page['lifecycle_state'],
		];

		if ( $page['attachment_id'] > 0 ) {
			$described = dtb_schematic_attachment_repo_describe( (int) $page['attachment_id'] );
			$pages[ count( $pages ) - 1 ]['url'] = ( $described && $described['exists'] ) ? $described['url'] : '';
		} else {
			$pages[ count( $pages ) - 1 ]['url'] = '';
		}
	}

	$parts = [];
	foreach ( $record->parts as $part ) {
		$product_url = '';
		if ( $part['product_id'] > 0 && DTB_SCHEMATIC_PART_STATE_RESOLVED === $part['resolution_state'] ) {
			$permalink = get_permalink( $part['product_id'] );
			$product_url = $permalink ? (string) $permalink : '';
		}

		$parts[] = [
			'part_ref'          => $part['part_ref'],
			'title'             => $part['title'],
			'brand'             => $part['brand'],
			'mpn'               => $part['mpn'],
			'sku'               => $part['sku'],
			'resolution_method' => $part['resolution_method'],
			'resolution_state'  => $part['resolution_state'],
			'product_url'       => $product_url,
			'occurrence_count'  => $part['occurrence_count'],
		];
	}

	return [
		'schema_version'  => $record->source_schema_version ?: 'v1',
		'catalog_version' => $record->publication_version,
		'id'              => $record->canonical_id,
		'title'           => $display['title'],
		'brand'           => [
			'id'   => $display['brand_id'],
			'name' => $display['brand_name'],
		],
		'category'        => [
			'id'   => $display['category_id'],
			'name' => $display['category_name'],
		],
		'family_id'       => $record->family_id,
		'variant_label'   => $record->variant_label,
		// Some WooCommerce variations intentionally share one diagram record.
		// Project their exact catalog keys/labels/SKUs through the backend so
		// React can reproduce the legacy selector without owning catalog truth.
		'variant_options' => dtb_schematic_shared_variant_options( $record->canonical_id ),
		'pages'           => $pages,
		'parts'           => $parts,
	];
}

/**
 * Return the deterministic catalog variations that share one schematic.
 *
 * @return array<int,array{key:string,label:string,sku:string}>
 */
function dtb_schematic_shared_variant_options( string $canonical_id ): array {
	if ( ! defined( 'DTB_SCHEMATIC_SHARED_VARIANT_MAP' ) ) {
		return [];
	}

	$options = DTB_SCHEMATIC_SHARED_VARIANT_MAP[ $canonical_id ] ?? [];
	if ( ! is_array( $options ) ) {
		return [];
	}

	$normalized = [];
	foreach ( $options as $option ) {
		$key   = sanitize_key( (string) ( $option['key'] ?? '' ) );
		$label = sanitize_text_field( (string) ( $option['label'] ?? '' ) );
		$sku   = sanitize_text_field( (string) ( $option['sku'] ?? '' ) );
		if ( '' === $key || '' === $label || '' === $sku ) {
			continue;
		}
		$normalized[] = [
			'key'   => $key,
			'label' => $label,
			'sku'   => $sku,
		];
	}

	return $normalized;
}
