<?php
/**
 * DTB Schematics — SchematicPublicApiController (transport).
 *
 * Public REST surface for the authoritative `dtb_schematic` domain record:
 *
 *   GET /dtb/v1/schematics             collection (published records only)
 *   GET /dtb/v1/schematics/{schematic_id}   detail (published records only)
 *
 * This controller is intentionally thin: request mapping + response
 * serialization only. All response shape comes from
 * Application/GenerateSchematicResponse.php; all record access comes from
 * Infrastructure/SchematicRecordRepository.php. No business logic and no
 * direct persistence calls live here.
 *
 * This is the sole public schematic REST surface. The legacy `/dtb/v1/
 * schematics/media` and `/dtb/v1/schematics/manifest` routes (formerly
 * Rest/SchematicMediaController.php / Rest/SchematicManifestController.php)
 * and their backing Infrastructure/SchematicMediaRepository.php and
 * Infrastructure/SchematicManifestRepository.php were removed in Phase 9
 * after confirming zero live frontend callers (the rebuilt
 * frontend/src/pages/SchematicsPage.jsx consumes only this controller).
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', 'dtb_register_schematics_public_api_routes' );

function dtb_register_schematics_public_api_routes(): void {
	register_rest_route(
		'dtb/v1',
		'/schematics',
		[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'dtb_schematics_public_api_collection',
			'permission_callback' => '__return_true',
		]
	);

	register_rest_route(
		'dtb/v1',
		'/schematics/(?P<schematic_id>[a-zA-Z0-9_-]+)',
		[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'dtb_schematics_public_api_detail',
			'permission_callback' => '__return_true',
			'args'                => [
				'schematic_id' => [
					'required'          => true,
					'validate_callback' => static function ( $value ) {
						return is_string( $value ) && '' !== sanitize_key( $value );
					},
				],
			],
		]
	);
}

/**
 * One coherent public cache policy shared by both endpoints:
 *   - a single `public, max-age=<ttl>` Cache-Control directive (never mixed
 *     with private/no-store/no-cache);
 *   - an ETag derived from the catalog/publication version so proxies and
 *     browsers can revalidate cheaply;
 *   - conditional-GET (If-None-Match) support returning a bare 304.
 *
 * @return true If the caller should short-circuit with a 304 (headers already sent via $response).
 */
function dtb_schematics_public_api_apply_cache_headers( WP_REST_Request $request, WP_REST_Response $response, string $etag_seed, int $ttl = 300 ): bool {
	$etag = '"' . md5( $etag_seed ) . '"';

	$response->header( 'Cache-Control', 'public, max-age=' . max( 0, $ttl ) );
	$response->header( 'ETag', $etag );

	$if_none_match = $request->get_header( 'if_none_match' );
	if ( is_string( $if_none_match ) && trim( $if_none_match ) === $etag ) {
		return true;
	}

	return false;
}

/**
 * Append a version query argument to a media URL so caches can treat the URL
 * itself as immutable/versioned. Prefers the page's own source checksum;
 * falls back to the record's publication version when no checksum is known.
 */
function dtb_schematics_public_api_versioned_url( string $url, string $checksum, int $publication_version ): string {
	if ( '' === $url ) {
		return '';
	}

	$version = '' !== $checksum ? $checksum : ( 'v' . max( 0, $publication_version ) );

	return add_query_arg( 'v', rawurlencode( $version ), $url );
}

/**
 * Enforce deterministic page ordering (page_number ascending) regardless of
 * stored array order, and attach versioned media URLs + an explicit
 * hotspot-availability shape to each serialized page.
 *
 * @param array $pages Raw page definitions as stored on the domain record (see dtb_schematic_page_make()).
 */
function dtb_schematics_public_api_order_and_annotate_pages( array $pages, int $publication_version ): array {
	usort( $pages, fn( $a, $b ) => ( $a['page_number'] ?? 0 ) <=> ( $b['page_number'] ?? 0 ) );

	// Enforce unique page relationships: if a page_id repeats (should not
	// happen at the domain layer, but the public serializer must not trust
	// that blindly), keep only the first (lowest page_number) occurrence.
	$seen  = [];
	$pages = array_values(
		array_filter(
			$pages,
			static function ( $page ) use ( &$seen ) {
				$page_id = (string) ( $page['page_id'] ?? '' );
				if ( '' === $page_id || isset( $seen[ $page_id ] ) ) {
					return false;
				}
				$seen[ $page_id ] = true;
				return true;
			}
		)
	);

	return array_map(
		static function ( array $page ) use ( $publication_version ) {
			$checksum = (string) ( $page['source_checksum'] ?? '' );

			if ( '' !== ( $page['url'] ?? '' ) ) {
				$page['url'] = dtb_schematics_public_api_versioned_url( $page['url'], $checksum, $publication_version );
			}

			$page['sources'] = array_map(
				static function ( array $source ) use ( $checksum, $publication_version ) {
					$source['url'] = dtb_schematics_public_api_versioned_url( (string) ( $source['url'] ?? '' ), $checksum, $publication_version );
					return $source;
				},
				(array) ( $page['sources'] ?? [] )
			);

			$dataset          = (array) ( $page['hotspot_dataset'] ?? [] );
			$occurrences      = (array) ( $dataset['occurrences'] ?? [] );
			$has_reference    = ! empty( $dataset['type'] ) && 'none' !== $dataset['type'];
			$has_occurrences  = ! empty( $occurrences );

			if ( $has_occurrences ) {
				// Phase 5: real migrated hotspot occurrence data for this page
				// (Application/MigrateSchematicHotspotDatasets.php). Never
				// collapsed to one-per-part — every physical occurrence is
				// preserved as its own entry.
				$page['hotspot_dataset'] = [
					'available'      => true,
					'schema_version' => $dataset['schema_version'] ?? DTB_SCHEMATIC_HOTSPOT_SCHEMA_VERSION,
					'checksum'       => $dataset['checksum'] ?? '',
					'occurrences'    => $occurrences,
				];
			} elseif ( $has_reference ) {
				// A dataset reference exists but migration has not yet produced
				// real occurrence data for it (e.g. a legacy-schema source file
				// with no coordinates, or migration has not run for this record).
				$page['hotspot_dataset'] = [
					'available' => false,
					'reason'    => 'hotspot_data_unavailable',
				];
			} else {
				$page['hotspot_dataset'] = [
					'available' => false,
					'reason'    => 'hotspot_data_unavailable',
				];
			}

			return $page;
		},
		$pages
	);
}

/**
 * Annotate resolved/unresolved part summaries with an explicit unavailable
 * state (nothing is fabricated — the underlying relationship data comes
 * unchanged from dtb_schematic_generate_detail_response()).
 */
function dtb_schematics_public_api_annotate_parts( array $parts ): array {
	return array_map(
		static function ( array $part ) {
			$part['available'] = DTB_SCHEMATIC_PART_STATE_RESOLVED === ( $part['resolution_state'] ?? '' );
			return $part;
		},
		$parts
	);
}

/**
 * GET /dtb/v1/schematics
 */
function dtb_schematics_public_api_collection( WP_REST_Request $request ) {
	$per_page = 200;
	$page     = 1;
	$items    = [];

	do {
		$result = dtb_schematic_record_repo_query(
			[
				'lifecycle' => DTB_Schematic_Lifecycle_Status::PUBLISHED,
				'page'      => $page,
				'per_page'  => $per_page,
			]
		);

		foreach ( $result['items'] as $record ) {
			if ( ! $record->lifecycle->is_published() ) {
				continue; // Defense in depth: never leak a non-published record.
			}

			$entry = dtb_schematic_generate_catalog_entry( $record );

			// Catalog card previews get the same immutable/versioned URL
			// treatment as detail-page media (see
			// dtb_schematics_public_api_versioned_url()). No page-level
			// checksum is available at catalog granularity, so this keys
			// off the record's publication version — still cache-busted on
			// every reconciled change.
			if ( '' !== ( $entry['preview']['url'] ?? '' ) ) {
				$entry['preview']['url'] = dtb_schematics_public_api_versioned_url(
					$entry['preview']['url'],
					'',
					$record->publication_version
				);
			}

			$items[] = $entry;
		}

		++$page;
	} while ( $page <= $result['pages'] && $page <= 50 ); // Bounded: at most 10,000 records.

	$catalog_version = dtb_schematics_public_catalog_version();

	$response = rest_ensure_response(
		[
			'schema_version'  => 'v1',
			'catalog_version' => $catalog_version,
			'count'           => count( $items ),
			'items'           => $items,
		]
	);

	$is_not_modified = dtb_schematics_public_api_apply_cache_headers(
		$request,
		$response,
		'collection:' . $catalog_version . ':' . count( $items )
	);

	if ( $is_not_modified ) {
		return new WP_REST_Response( null, 304 );
	}

	return $response;
}

/**
 * GET /dtb/v1/schematics/{schematic_id}
 */
function dtb_schematics_public_api_detail( WP_REST_Request $request ) {
	$schematic_id = sanitize_key( (string) $request->get_param( 'schematic_id' ) );

	$record = dtb_schematic_record_repo_find_by_canonical_id( $schematic_id );

	if ( ! $record || ! $record->lifecycle->is_published() ) {
		return new WP_Error(
			'dtb_schematic_not_found',
			__( 'Schematic not found.', 'drywall-toolbox' ),
			[ 'status' => 404 ]
		);
	}

	$body = dtb_schematic_generate_detail_response( $record );

	$body['pages'] = dtb_schematics_public_api_order_and_annotate_pages( $body['pages'], $record->publication_version );
	$body['parts'] = dtb_schematics_public_api_annotate_parts( $body['parts'] );

	$response = rest_ensure_response( $body );

	$is_not_modified = dtb_schematics_public_api_apply_cache_headers(
		$request,
		$response,
		'detail:' . $record->canonical_id . ':' . $record->publication_version
	);

	if ( $is_not_modified ) {
		return new WP_REST_Response( null, 304 );
	}

	$last_modified = mysql2date( 'D, d M Y H:i:s', $record->updated_at, false );
	if ( $last_modified ) {
		$response->header( 'Last-Modified', $last_modified . ' GMT' );
	}

	return $response;
}
