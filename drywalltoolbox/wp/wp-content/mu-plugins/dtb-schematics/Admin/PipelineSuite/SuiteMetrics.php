<?php
/**
 * DTB Schematics Pipeline Suite — SuiteMetrics.
 *
 * Read-only aggregation over the authoritative `dtb_schematic` records for
 * the Overview/Inventory/Publication screens. Never writes. Bounded: the
 * domain corpus is on the order of ~100-150 canonical schematics (see
 * Infrastructure/SchematicSourceManifestReader.php), so a single capped
 * `dtb_schematic_record_repo_query( [ 'per_page' => 200 ] )` call is safe;
 * this helper does not paginate through the full set beyond that cap.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Fetch every schematic record, bounded at 200 (the repository's own cap).
 * Used by dashboard aggregation and CSV export — never by row-level UI.
 *
 * @return DTB_Schematic_Record_Entity[]
 */
function dtb_schematics_suite_all_records(): array {
	static $cache = null;
	if ( null !== $cache ) {
		return $cache;
	}
	$result = dtb_schematic_record_repo_query( [ 'per_page' => 200, 'page' => 1 ] );
	$cache  = $result['items'];
	return $cache;
}

/**
 * A record's per-stage synchronization state, used across Overview,
 * Inventory, and Publication screens so all three agree on the same read.
 */
function dtb_schematics_suite_record_pipeline_state( DTB_Schematic_Record_Entity $record ): array {
	$pages = $record->pages;
	$attached_pages = 0;
	$missing_pages  = 0;
	foreach ( $pages as $page ) {
		if ( dtb_schematic_page_is_attached( $page ) ) {
			$attached_pages++;
		} else {
			$missing_pages++;
		}
	}

	$hotspot_dataset   = function_exists( 'dtb_schematic_hotspot_dataset_repo_get' ) ? dtb_schematic_hotspot_dataset_repo_get( $record->id ) : null;
	$has_hotspot_ref   = '' !== ( $record->hotspot_dataset['reference'] ?? '' );
	$has_hotspot_data  = null !== $hotspot_dataset;

	$parts             = $record->parts;
	$resolved_parts     = 0;
	$unresolved_parts   = 0;
	foreach ( $parts as $part ) {
		if ( DTB_SCHEMATIC_PART_STATE_RESOLVED === $part['resolution_state'] ) {
			$resolved_parts++;
		} elseif ( DTB_SCHEMATIC_PART_STATE_UNRESOLVED === $part['resolution_state'] ) {
			$unresolved_parts++;
		}
	}

	$unmet = dtb_schematic_publication_requirements( $record->to_array() );

	return [
		'page_count'          => count( $pages ),
		'attached_pages'      => $attached_pages,
		'missing_pages'       => $missing_pages,
		'has_hotspot_dataset' => $has_hotspot_data,
		'has_hotspot_ref'     => $has_hotspot_ref,
		'resolved_parts'      => $resolved_parts,
		'unresolved_parts'    => $unresolved_parts,
		'part_count'          => count( $parts ),
		'publication_eligible' => empty( $unmet ),
		'unmet_requirements'   => $unmet,
		'is_published'         => $record->lifecycle->is_published(),
		'is_retired'            => $record->lifecycle->is_retired(),
	];
}

/**
 * Overview-screen operational totals + pipeline-stage counts.
 */
function dtb_schematics_suite_overview_metrics(): array {
	$records = dtb_schematics_suite_all_records();

	$metrics = [
		'canonical_records'        => count( $records ),
		'published'                => 0,
		'storefront_visible'       => 0,
		'retired'                  => 0,
		'attachments'               => 0,
		'pages'                     => 0,
		'missing_pages'             => 0,
		'previews_explicit'         => 0,
		'previews_first_page'       => 0,
		'previews_unavailable'      => 0,
		'missing_hotspot_datasets'  => 0,
		'unresolved_products'       => 0,
		'ready_to_publish'          => 0,
		'incomplete'                => 0,
		'draft'                     => 0,
	];

	foreach ( $records as $record ) {
		$state = dtb_schematics_suite_record_pipeline_state( $record );

		$metrics['pages']         += $state['page_count'];
		$metrics['attachments']   += $state['attached_pages'];
		$metrics['missing_pages'] += $state['missing_pages'];

		if ( $record->lifecycle->is_published() ) {
			$metrics['published']++;
			$metrics['storefront_visible']++;
		} elseif ( $record->lifecycle->is_retired() ) {
			$metrics['retired']++;
		} elseif ( DTB_Schematic_Lifecycle_Status::READY === $record->lifecycle->value() ) {
			$metrics['ready_to_publish']++;
		} elseif ( DTB_Schematic_Lifecycle_Status::INCOMPLETE === $record->lifecycle->value() ) {
			$metrics['incomplete']++;
		} else {
			$metrics['draft']++;
		}

		if ( ! $state['has_hotspot_ref'] ) {
			$metrics['missing_hotspot_datasets']++;
		}
		if ( $state['unresolved_parts'] > 0 ) {
			$metrics['unresolved_products']++;
		}

		$preview = dtb_schematic_resolve_preview( $record );
		if ( 'explicit' === $preview['source'] || 'product_image' === $preview['source'] ) {
			$metrics['previews_explicit']++;
		} elseif ( 'first_page' === $preview['source'] ) {
			$metrics['previews_first_page']++;
		} else {
			$metrics['previews_unavailable']++;
		}
	}

	// Source-side counts, independent of domain records — read from the
	// canonical manifest so "Source" stage totals reflect the source of
	// truth even for rows that have not yet produced a domain record.
	$manifest = dtb_schematics_read_source_manifest();
	$metrics['source_available']  = $manifest['ok'];
	$metrics['source_row_count']  = $manifest['ok'] ? count( $manifest['rows'] ) : 0;
	$metrics['source_error']      = $manifest['ok'] ? '' : ( $manifest['error'] ?? '' );

	return $metrics;
}
