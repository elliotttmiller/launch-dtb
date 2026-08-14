<?php
/**
 * DTB Schematics — MigrateSchematicHotspotDatasets (Phase 5 application service).
 *
 * Bounded batch operation that, for every authoritative schematic record:
 *   1. locates its source hotspot JSON file (reusing the same
 *      Phase 3 locator, dtb_schematic_reconcile_locate_hotspot_dataset_file(),
 *      or an already-associated `_dtb_schematic_hotspot_dataset` reference);
 *   2. reads + normalizes it (Infrastructure/SchematicHotspotDatasetReader.php);
 *   3. persists the normalized dataset (Infrastructure/SchematicHotspotDatasetRepository.php);
 *   4. resolves its parts_catalog against WooCommerce in one bounded batch
 *      (Application/ResolveSchematicPartOccurrences.php);
 *   5. writes both results through the existing authoritative application
 *      service (Application/ManageSchematicRecord.php) — never bypassing it.
 *
 * This is the batch integration point referenced by the spec's "resolve
 * products in bounded backend batches" requirement — nothing here runs
 * per-hotspot-click or per public API request; the public API only reads
 * what this operation already stored.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_SCHEMATIC_HOTSPOT_MIGRATE_MAX_PAGES = 50; // Safety cap: at most 5,000 schematic records (100/page) per invocation.

/**
 * Run the migration across every schematic record (or a single record when
 * `$only_canonical_id` is supplied — used by the WP-CLI `--schematic=` flag).
 *
 * @param array $args {
 *     @type bool   $dry_run           Default true. When false, eligible records are written.
 *     @type int    $per_page          Records per WP_Query page (default 50, capped at 100).
 *     @type string $only_canonical_id Optional: restrict to a single schematic.
 * }
 * @return array{
 *   dry_run:bool, examined:int, migrated:int, unchanged:int, skipped:int, failed:int,
 *   results: array[]
 * }
 */
function dtb_schematic_migrate_hotspot_datasets( array $args = [] ): array {
	$dry_run   = array_key_exists( 'dry_run', $args ) ? (bool) $args['dry_run'] : true;
	$per_page  = max( 1, min( 100, (int) ( $args['per_page'] ?? 50 ) ) );
	$only_id   = isset( $args['only_canonical_id'] ) ? sanitize_key( (string) $args['only_canonical_id'] ) : '';

	$report = [
		'dry_run'   => $dry_run,
		'examined'  => 0,
		'migrated'  => 0,
		'unchanged' => 0,
		'skipped'   => 0,
		'failed'    => 0,
		'results'   => [],
	];

	if ( '' !== $only_id ) {
		$record = dtb_schematic_record_repo_find_by_canonical_id( $only_id );
		if ( ! $record ) {
			$report['results'][] = [ 'canonical_id' => $only_id, 'status' => 'schematic_not_found' ];
			$report['failed']++;
			return $report;
		}
		$result = dtb_schematic_migrate_hotspot_dataset_for_record( $record, $dry_run );
		dtb_schematic_migrate_hotspot_tally( $report, $result );
		return $report;
	}

	$page = 1;
	do {
		$query_result = dtb_schematic_record_repo_query( [ 'page' => $page, 'per_page' => $per_page ] );
		foreach ( $query_result['items'] as $record ) {
			$result = dtb_schematic_migrate_hotspot_dataset_for_record( $record, $dry_run );
			dtb_schematic_migrate_hotspot_tally( $report, $result );
		}
		$page++;
	} while ( $page <= $query_result['pages'] && $page <= DTB_SCHEMATIC_HOTSPOT_MIGRATE_MAX_PAGES );

	if ( ! $dry_run ) {
		dtb_schematics_invalidate_domain_cache();
	}

	return $report;
}

function dtb_schematic_migrate_hotspot_tally( array &$report, array $result ): void {
	$report['examined']++;
	$report['results'][] = $result;
	switch ( $result['status'] ) {
		case 'migrated':
			$report['migrated']++;
			break;
		case 'unchanged':
			$report['unchanged']++;
			break;
		case 'no_source_file':
		case 'source_file_missing':
			$report['skipped']++;
			break;
		default:
			$report['failed']++;
			break;
	}
}

/**
 * Migrate a single schematic record's hotspot dataset.
 *
 * @return array{canonical_id:string, status:string, detail:string, source_file:?string, parts_resolved:int, parts_unresolved:int}
 */
function dtb_schematic_migrate_hotspot_dataset_for_record( DTB_Schematic_Record_Entity $record, bool $dry_run ): array {
	$base = [
		'canonical_id'     => $record->canonical_id,
		'status'           => 'skipped',
		'detail'           => '',
		'source_file'      => null,
		'parts_resolved'   => 0,
		'parts_unresolved' => 0,
	];

	$relative_reference = $record->hotspot_dataset['reference'] ?? '';
	if ( '' === $relative_reference && function_exists( 'dtb_schematic_reconcile_locate_hotspot_dataset_file' ) ) {
		$relative_reference = (string) dtb_schematic_reconcile_locate_hotspot_dataset_file( $record->canonical_id, $record->brand_name ?: $record->brand_id );
	}

	if ( '' === $relative_reference ) {
		$base['status'] = 'no_source_file';
		$base['detail'] = 'No hotspot dataset reference is associated and none could be located by canonical ID/brand.';
		return $base;
	}

	$relative_reference = str_replace( '\\', '/', trim( $relative_reference ) );
	if ( ! preg_match( '#^frontend/public/brands/(?:[A-Za-z0-9._-]+/)+schematic_data\.json$#', $relative_reference ) ) {
		$base['status'] = 'failed';
		$base['detail'] = 'Hotspot dataset reference is outside the supported frontend brand dataset path.';
		return $base;
	}
	$base['source_file'] = $relative_reference;

	$repo_root       = dtb_schematics_repo_root();
	$source_root     = '' !== $repo_root ? realpath( trailingslashit( $repo_root ) . 'frontend/public/brands' ) : false;
	$absolute_path   = '' !== $repo_root ? realpath( trailingslashit( $repo_root ) . $relative_reference ) : false;
	$normalized_root = false !== $source_root ? trailingslashit( str_replace( '\\', '/', $source_root ) ) : '';
	$normalized_path = false !== $absolute_path ? str_replace( '\\', '/', $absolute_path ) : '';
	if ( '' === $normalized_root || '' === $normalized_path || 0 !== strpos( $normalized_path, $normalized_root ) ) {
		$base['status'] = false === $absolute_path ? 'source_file_missing' : 'failed';
		$base['detail'] = false === $absolute_path ? 'Hotspot dataset source file does not exist.' : 'Hotspot dataset source resolved outside the supported frontend brand directory.';
		return $base;
	}

	$read = dtb_schematic_hotspot_read_file( $absolute_path );
	if ( DTB_SCHEMATIC_HOTSPOT_READ_OK !== $read['status'] ) {
		// Missing-file is a skip (nothing to migrate this pass); every other
		// read failure (malformed JSON, BOM-only corruption beyond the strip,
		// unrecognized shape, no parts found) is reported as a failure so it
		// surfaces in the artifact list rather than silently disappearing.
		$base['status'] = DTB_SCHEMATIC_HOTSPOT_READ_FILE_NOT_FOUND === $read['status'] ? 'source_file_missing' : 'failed';
		$base['detail']  = ( $read['error'] ?? $read['status'] ) . ( $read['bom_stripped'] ? ' (BOM stripped)' : '' );
		return $base;
	}

	$dataset = $read['dataset'];

	$parts_resolved = dtb_schematic_resolve_part_occurrences_for_record( $record, $dataset );
	$unresolved_count = count(
		array_filter( $parts_resolved, static fn( $p ) => DTB_SCHEMATIC_PART_STATE_UNRESOLVED === $p['resolution_state'] )
	);

	$base['parts_resolved']   = count( $parts_resolved ) - $unresolved_count;
	$base['parts_unresolved'] = $unresolved_count;

	$existing_dataset = dtb_schematic_hotspot_dataset_repo_get( $record->id );
	$dataset_unchanged = $existing_dataset && ( $existing_dataset['checksum'] ?? '' ) === $dataset['checksum']
		&& ( $record->hotspot_dataset['reference'] ?? '' ) === $relative_reference;

	if ( $dataset_unchanged ) {
		$base['status'] = 'unchanged';
		$base['detail'] = 'Dataset checksum and reference already match the stored state.';
		return $base;
	}

	if ( $dry_run ) {
		$base['status'] = 'migrated';
		$base['detail'] = sprintf(
			'Would persist %s-schema dataset (%d parts, %d hotspot occurrences) and refresh %d part relationship(s).',
			$dataset['source_schema'],
			count( $dataset['parts_catalog'] ),
			count( $dataset['hotspots'] ),
			count( $parts_resolved )
		);
		return $base;
	}

	$record_update = dtb_schematic_update(
		$record->id,
		[
			'hotspot_dataset' => [
				'type'           => 'frontend_json',
				'reference'      => $relative_reference,
				'schema_version' => $dataset['schema_version'],
				'checksum'       => $dataset['checksum'],
			],
			'parts'           => $parts_resolved,
		]
	);
	if ( is_wp_error( $record_update ) ) {
		$base['status'] = 'failed';
		$base['detail'] = $record_update->get_error_message();
		return $base;
	}

	$dataset_saved = dtb_schematic_hotspot_dataset_repo_save( $record->id, $dataset );
	$stored_dataset = dtb_schematic_hotspot_dataset_repo_get( $record->id );
	if ( ! $dataset_saved && ( $stored_dataset['checksum'] ?? '' ) !== $dataset['checksum'] ) {
		$rollback = dtb_schematic_update(
			$record->id,
			[
				'hotspot_dataset' => $record->hotspot_dataset,
				'parts'           => $record->parts,
			]
		);
		$base['status'] = 'failed';
		$base['detail'] = is_wp_error( $rollback )
			? 'Normalized dataset persistence failed and the record projection could not be restored: ' . $rollback->get_error_message()
			: 'Normalized dataset persistence failed; the record projection was restored.';
		return $base;
	}

	$base['status'] = 'migrated';
	$base['detail'] = sprintf(
		'Persisted %s-schema dataset (%d parts, %d hotspot occurrences); %d/%d part relationship(s) resolved.',
		$dataset['source_schema'],
		count( $dataset['parts_catalog'] ),
		count( $dataset['hotspots'] ),
		$base['parts_resolved'],
		count( $parts_resolved )
	);

	return $base;
}

/**
 * Repository root, resolved the same way
 * Infrastructure/SchematicSourceManifestReader.php resolves the source
 * package directory (ABSPATH is .../drywalltoolbox/wp/).
 */
function dtb_schematics_repo_root(): string {
	if ( ! defined( 'ABSPATH' ) ) {
		return '';
	}
	$wp_root = untrailingslashit( ABSPATH );
	return dirname( dirname( $wp_root ) );
}
