<?php
/**
 * DTB Schematics — ReconcileSchematicSource (Phase 3 reconciliation engine).
 *
 * The one deterministic reconciliation engine required by the schematics
 * platform rebuild. Compares the canonical source manifest/binaries
 * (Infrastructure/SchematicSourceManifestReader.php) against WordPress
 * attachments, legacy attachment metadata, the authoritative `dtb_schematic`
 * domain records, page relationships, hotspot dataset references, and
 * SKU/product linkage (Data/SkuSchematicMap.php) — and assigns every
 * discovered source asset exactly one DTB_Schematic_Asset_Disposition.
 *
 * Identity resolution (source filename -> canonical schematic ID/page) is
 * delegated entirely to the existing, already-authoritative
 * dtb_schematics_parse_upload_filename() / dtb_schematics_retired_upload_reason()
 * (Application/RegisterSchematicUploads.php). This engine does not
 * reimplement fuzzy filename matching — doing so would create a second,
 * competing identity authority, which is explicitly disallowed.
 *
 * All domain-record writes go through Application/ManageSchematicRecord.php.
 * Nothing in this file calls dtb_schematic_record_repo_save() directly.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// Fallback only, used when a source binary cannot be located under any
// wp-content/uploads/{year}/schematics candidate directory (e.g. the
// dev-only repo-relative source package) — in the normal production case
// each row's actual uploads-relative path is derived per-file via
// dtb_schematics_relative_uploads_file_for_filename()
// (Infrastructure/SchematicSourceManifestReader.php), so this is never
// hardcoded to a single year for real uploaded assets.
const DTB_SCHEMATIC_RECONCILE_DEFAULT_UPLOAD_PATH = '2026/schematics';
const DTB_SCHEMATIC_RECONCILE_DEFAULT_BATCH_SIZE  = 25;
const DTB_SCHEMATIC_RECONCILE_MAX_BATCH_SIZE      = 100;

/**
 * Run one bounded batch of the reconciliation pipeline.
 *
 * @param array $args {
 *     @type bool   $dry_run     Default true. When false, eligible dispositions are written.
 *     @type int    $batch_size  Rows processed this call, capped at DTB_SCHEMATIC_RECONCILE_MAX_BATCH_SIZE.
 *     @type bool   $resume      Default true. When false, restarts the pass from row 0.
 *     @type string $upload_path Relative wp-content/uploads path schematic binaries are expected to live under.
 * }
 * @return array Structured result report (see dtb_schematic_reconcile_empty_report()).
 */
function dtb_schematic_reconcile_source( array $args = [] ): array {
	$dry_run     = array_key_exists( 'dry_run', $args ) ? (bool) $args['dry_run'] : true;
	$batch_size  = max( 1, min( DTB_SCHEMATIC_RECONCILE_MAX_BATCH_SIZE, (int) ( $args['batch_size'] ?? DTB_SCHEMATIC_RECONCILE_DEFAULT_BATCH_SIZE ) ) );
	$resume      = array_key_exists( 'resume', $args ) ? (bool) $args['resume'] : true;
	$upload_path = trim( (string) ( $args['upload_path'] ?? DTB_SCHEMATIC_RECONCILE_DEFAULT_UPLOAD_PATH ), '/' );

	$report = dtb_schematic_reconcile_empty_report( $dry_run );

	$manifest = dtb_schematics_read_source_manifest();
	if ( ! $manifest['ok'] ) {
		$report['fatal_error'] = $manifest['error'];
		return $report;
	}

	$all_rows = $manifest['rows'];
	$report['source_row_count'] = count( $all_rows );

	// Resolve identity for the *entire* manifest up front (bounded — the
	// source package is on the order of a few hundred rows at most) so
	// duplicate-page collisions are detected consistently regardless of
	// which batch window is currently being processed.
	$resolved_all  = dtb_schematic_reconcile_resolve_all_identities( $all_rows );
	$duplicate_keys = dtb_schematic_reconcile_find_duplicate_keys( $resolved_all );

	$state = $resume ? dtb_schematic_reconcile_state_get() : dtb_schematic_reconcile_state_start_pass();
	$cursor = min( (int) $state['cursor'], count( $all_rows ) );

	$batch = array_slice( $resolved_all, $cursor, $batch_size, true );
	$is_last_batch = ( $cursor + count( $batch ) ) >= count( $all_rows );

	$wp_context = dtb_schematic_reconcile_wp_context_available();
	$report['wordpress_context_available'] = $wp_context;

	$seen_canonical_ids = $state['seen_canonical_ids'];

	foreach ( $batch as $index => $resolved ) {
		$row = $all_rows[ $index ];
		$asset_report = dtb_schematic_reconcile_process_row(
			$row,
			$resolved,
			$duplicate_keys,
			$wp_context,
			$dry_run,
			$upload_path
		);

		$report['examined']++;
		$report['dispositions'][ $asset_report['disposition'] ] = 1 + ( $report['dispositions'][ $asset_report['disposition'] ] ?? 0 );

		if ( $asset_report['changed'] ) {
			$report['changed']++;
		} elseif ( $asset_report['skipped'] ) {
			$report['skipped']++;
		} elseif ( DTB_Schematic_Asset_Disposition::AMBIGUOUS_AND_UNRESOLVED === $asset_report['disposition'] ) {
			$report['unresolved']++;
		} else {
			$report['unchanged']++;
		}

		$report['assets'][] = $asset_report;

		if ( ! empty( $resolved['canonical_id'] ) && DTB_Schematic_Asset_Disposition::RETIRED !== $asset_report['disposition'] ) {
			$seen_canonical_ids[] = $resolved['canonical_id'];
		}
	}

	$new_cursor = $cursor + count( $batch );
	$state['cursor']             = $is_last_batch ? 0 : $new_cursor;
	$state['seen_canonical_ids'] = $is_last_batch ? [] : array_values( array_unique( $seen_canonical_ids ) );
	$state['last_run_at']        = function_exists( 'current_time' ) ? current_time( 'mysql', true ) : gmdate( 'Y-m-d H:i:s' );
	$state['last_run_mode']      = $dry_run ? 'dry_run' : 'commit';

	$report['batch_start']  = $cursor;
	$report['batch_end']    = $new_cursor;
	$report['is_last_batch'] = $is_last_batch;
	$report['next_offset']  = $is_last_batch ? null : $new_cursor;

	// Retirement sweep only runs on the batch that completes a full pass, and
	// only in commit mode, and only when WordPress context is available.
	if ( $is_last_batch && ! $dry_run && $wp_context ) {
		$report['retired'] = dtb_schematic_reconcile_retire_uncovered( array_values( array_unique( $seen_canonical_ids ) ) );
	}

	if ( ! $dry_run && $wp_context ) {
		dtb_schematics_invalidate_domain_cache();
	}

	dtb_schematic_reconcile_state_save( $state );

	return $report;
}

function dtb_schematic_reconcile_empty_report( bool $dry_run ): array {
	return [
		'dry_run'                     => $dry_run,
		'source_row_count'            => 0,
		'wordpress_context_available' => false,
		'examined'                    => 0,
		'unchanged'                   => 0,
		'changed'                     => 0,
		'skipped'                     => 0,
		'unresolved'                  => 0,
		'retired'                     => 0,
		'dispositions'                => [],
		'assets'                      => [],
		'batch_start'                 => 0,
		'batch_end'                   => 0,
		'is_last_batch'               => true,
		'next_offset'                 => null,
		'fatal_error'                 => null,
	];
}

/**
 * A live WordPress runtime is required for every attachment/domain-record
 * comparison and for all writes. This repository checkout has no such
 * runtime, so a dry-run here can only validate manifest parsing and identity
 * resolution — see the static harness at
 * scripts/catalog/reconcile_schematics_dry_run_harness.php.
 */
function dtb_schematic_reconcile_wp_context_available(): bool {
	return function_exists( 'get_posts' ) && function_exists( 'wp_upload_dir' ) && function_exists( 'dtb_schematic_record_repo_find_by_canonical_id' );
}

/**
 * Resolve canonical identity for every manifest row via the existing
 * authoritative filename resolver. Returns a map keyed by the same index as
 * $rows so batches can be sliced consistently.
 *
 * @return array<int, array{retired_reason:?string, canonical_id:?string, type:?string, page:?int, error:?string}>
 */
function dtb_schematic_reconcile_resolve_all_identities( array $rows ): array {
	$resolved = [];
	foreach ( $rows as $index => $row ) {
		$filename = $row['filename'];
		$retired_reason = dtb_schematics_retired_upload_reason( $filename );
		if ( null !== $retired_reason ) {
			$resolved[ $index ] = [
				'retired_reason' => $retired_reason,
				'canonical_id'   => null,
				'type'           => null,
				'page'           => null,
				'error'          => null,
			];
			continue;
		}

		$parsed = dtb_schematics_parse_upload_filename( $filename );
		if ( is_wp_error( $parsed ) ) {
			$resolved[ $index ] = [
				'retired_reason' => null,
				'canonical_id'   => null,
				'type'           => null,
				'page'           => null,
				'error'          => $parsed->get_error_message(),
			];
			continue;
		}

		$resolved[ $index ] = [
			'retired_reason' => null,
			'canonical_id'   => $parsed['schematic_id'],
			'type'           => $parsed['type'],
			'page'           => (int) $parsed['page'],
			'error'          => null,
		];
	}
	return $resolved;
}

/**
 * @return array<string,int[]> Map of "{canonical_id}|{page}" -> row indexes, for keys with more than one row.
 */
function dtb_schematic_reconcile_find_duplicate_keys( array $resolved_all ): array {
	$by_key = [];
	foreach ( $resolved_all as $index => $resolved ) {
		if ( null === $resolved['canonical_id'] ) {
			continue;
		}
		$key = $resolved['canonical_id'] . '|' . $resolved['page'];
		$by_key[ $key ][] = $index;
	}
	return array_filter( $by_key, static fn( $indexes ) => count( $indexes ) > 1 );
}

/**
 * Process a single manifest row and return its per-asset report, applying
 * writes when $dry_run is false and the disposition is writable.
 */
function dtb_schematic_reconcile_process_row( array $row, array $resolved, array $duplicate_keys, bool $wp_context, bool $dry_run, string $upload_path ): array {
	$asset = [
		'source_filename' => $row['filename'],
		'source_schematic_manifest_id' => $row['schematic_id'],
		'sku_or_alias'    => $row['sku_or_alias'],
		'brand'           => $row['brand'],
		'canonical_id'    => $resolved['canonical_id'],
		'page'            => $resolved['page'],
		'disposition'     => DTB_Schematic_Asset_Disposition::AMBIGUOUS_AND_UNRESOLVED,
		'notes'           => [],
		'changed'         => false,
		'skipped'         => false,
	];

	if ( null !== $resolved['retired_reason'] ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::RETIRED;
		$asset['notes'][]     = $resolved['retired_reason'];
		$asset['skipped']     = true;
		return $asset;
	}

	if ( null !== $resolved['error'] ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::AMBIGUOUS_AND_UNRESOLVED;
		$asset['notes'][]     = $resolved['error'];
		return $asset;
	}

	$canonical_id = $resolved['canonical_id'];
	$page         = $resolved['page'];
	$key          = $canonical_id . '|' . $page;

	if ( isset( $duplicate_keys[ $key ] ) ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::DUPLICATE_SCHEMATIC_PAGE;
		$asset['notes'][]     = 'Multiple source rows resolve to the same schematic/page; no write performed until an operator resolves the collision.';
		return $asset;
	}

	// Source binary check — bounded to this row's file only.
	$binary = dtb_schematics_describe_source_binary( $row['filename'], true );
	if ( ! $binary['exists'] ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::MISSING_SOURCE_BINARY;
		$asset['notes'][]     = 'Source manifest references a file that is not present in the source package.';
		return $asset;
	}
	if ( '' !== $row['checksum_sha256'] && $binary['checksum_sha256'] !== $row['checksum_sha256'] ) {
		$asset['notes'][] = 'Source binary checksum does not match the manifest (source drift) — flagged, not auto-corrected.';
	}

	if ( ! $wp_context ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::SOURCE_ONLY;
		$asset['notes'][]     = 'No WordPress runtime in this process — attachment/domain-record state could not be verified.';
		return $asset;
	}

	// Prefer the uploads-relative path actually derived from where this
	// row's source binary was found (correct regardless of which
	// wp-content/uploads/{year}/schematics directory it lives under); fall
	// back to the caller-supplied/default $upload_path only when the binary
	// was not found under any candidate uploads directory at all (e.g. it
	// only exists in the dev-only repo-relative source package).
	$derived_relative_file = dtb_schematics_relative_uploads_file_for_filename( $row['filename'] );
	$effective_upload_path = $derived_relative_file ? dirname( $derived_relative_file ) : $upload_path;

	return dtb_schematic_reconcile_process_row_with_wp( $asset, $row, $canonical_id, $page, $dry_run, $effective_upload_path );
}

/**
 * WordPress-runtime-dependent half of row processing. Split out so the
 * WP-independent parsing/duplicate/source-binary logic above stays testable
 * without a WordPress bootstrap.
 */
function dtb_schematic_reconcile_process_row_with_wp( array $asset, array $row, string $canonical_id, int $page, bool $dry_run, string $upload_path ): array {
	$relative_file = $upload_path . '/' . $row['filename'];
	$attachment_id = dtb_schematics_find_attachment_by_relative_file( $relative_file );

	$record  = dtb_schematic_record_repo_find_by_canonical_id( $canonical_id );
	$page_id = sanitize_key( $canonical_id . '-page-' . $page );

	if ( 0 === $attachment_id ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::MISSING_WORDPRESS_ATTACHMENT;
		$asset['notes'][]     = sprintf( 'No attachment found for expected uploads path "%s".', $relative_file );

		if ( ! $dry_run ) {
			$created = dtb_schematic_reconcile_create_attachment_from_uploads( $relative_file, $canonical_id, $page );
			if ( is_wp_error( $created ) ) {
				$asset['notes'][] = $created->get_error_message();
			} else {
				$attachment_id = $created;
				$asset['notes'][] = sprintf( 'Created attachment #%d from existing uploads file.', $attachment_id );
			}
		}
	}

	if ( 0 === $attachment_id ) {
		// Still nothing to attach to — the binary only exists in the source
		// package, not yet copied into wp-content/uploads. Reported, not written.
		return dtb_schematic_reconcile_finalize_asset( $asset, $record, $canonical_id, $page, $page_id, null, $dry_run, $row );
	}

	$legacy_schematic_id = (string) get_post_meta( $attachment_id, '_dtb_schematic_id', true );
	$legacy_page         = (string) get_post_meta( $attachment_id, '_dtb_schematic_page', true );
	$legacy_is_schematic = (string) get_post_meta( $attachment_id, '_dtb_is_schematic', true );

	$asset['attachment_id'] = $attachment_id;

	if ( '' !== $legacy_schematic_id && $legacy_schematic_id !== $canonical_id ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::REGISTERED_TO_WRONG_SCHEMATIC;
		$asset['notes'][]     = sprintf( 'Attachment #%d legacy identity is "%s", expected "%s". Not auto-corrected.', $attachment_id, $legacy_schematic_id, $canonical_id );
		return $asset;
	}

	if ( '' !== $legacy_schematic_id && (int) $legacy_page !== $page ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::REGISTERED_TO_WRONG_PAGE;
		$asset['notes'][]     = sprintf( 'Attachment #%d legacy page is "%s", expected "%d".', $attachment_id, $legacy_page, $page );
		// Writable: legacy page metadata is corrected (not the domain page — the
		// domain record itself is the source of truth and is reconciled below).
	}

	if ( '' === $legacy_schematic_id && '1' === $legacy_is_schematic ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::ATTACHED_BUT_UNIDENTIFIED;
		$asset['notes'][]     = sprintf( 'Attachment #%d has legacy `_dtb_is_schematic` flag but no resolvable schematic identity.', $attachment_id );
	}

	return dtb_schematic_reconcile_finalize_asset( $asset, $record, $canonical_id, $page, $page_id, $attachment_id, $dry_run, $row );
}

/**
 * Compare the resolved source truth against the domain record's current page
 * state, assign the remaining dispositions (active/synchronized, missing
 * metadata, uploaded-but-unattached), and perform the write when eligible.
 *
 * @param array $row Source manifest row for this asset (carries `filename`
 *                    and `checksum_sha256` so the domain page's
 *                    `source_checksum`/`source_filename` fields stay in sync
 *                    with the canonical source manifest — see
 *                    Infrastructure/SchematicSourceManifestReader.php).
 */
function dtb_schematic_reconcile_finalize_asset( array $asset, ?DTB_Schematic_Record_Entity $record, string $canonical_id, int $page, string $page_id, ?int $attachment_id, bool $dry_run, array $row = [] ): array {
	if ( $record && $record->lifecycle->is_retired() ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::RETIRED;
		$asset['notes'][]     = 'Owning schematic record is retired; not reactivated automatically.';
		return $asset;
	}

	if ( DTB_Schematic_Asset_Disposition::AMBIGUOUS_AND_UNRESOLVED !== $asset['disposition']
		&& in_array(
			$asset['disposition'],
			[ DTB_Schematic_Asset_Disposition::REGISTERED_TO_WRONG_SCHEMATIC, DTB_Schematic_Asset_Disposition::ATTACHED_BUT_UNIDENTIFIED ],
			true
		)
	) {
		// Collision/unidentified states are never auto-written.
		return $asset;
	}

	$existing_page = null;
	if ( $record ) {
		foreach ( $record->pages as $existing ) {
			if ( $existing['page_id'] === $page_id ) {
				$existing_page = $existing;
				break;
			}
		}
	}

	if ( null === $attachment_id ) {
		if ( DTB_Schematic_Asset_Disposition::MISSING_WORDPRESS_ATTACHMENT !== $asset['disposition'] ) {
			$asset['disposition'] = DTB_Schematic_Asset_Disposition::MISSING_WORDPRESS_ATTACHMENT;
		}
		return $asset;
	}

	$described = dtb_schematic_attachment_repo_describe( $attachment_id );
	$has_dimensions = $described && $described['exists'] && $described['width'] > 0 && $described['height'] > 0;

	$already_synchronized = $existing_page
		&& (int) $existing_page['attachment_id'] === $attachment_id
		&& (int) $existing_page['page_number'] === $page
		&& $has_dimensions;

	if ( $already_synchronized ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::ACTIVE_AND_SYNCHRONIZED;
		return $asset;
	}

	if ( $existing_page && (int) $existing_page['attachment_id'] === $attachment_id && ! $has_dimensions ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::MISSING_MEDIA_METADATA;
	} elseif ( DTB_Schematic_Asset_Disposition::REGISTERED_TO_WRONG_PAGE !== $asset['disposition'] ) {
		$asset['disposition'] = DTB_Schematic_Asset_Disposition::UPLOADED_BUT_UNATTACHED;
	}

	if ( $dry_run ) {
		return $asset;
	}

	if ( ! in_array( $asset['disposition'], DTB_Schematic_Asset_Disposition::writable(), true ) ) {
		return $asset;
	}

	$write_result = dtb_schematic_reconcile_write_row( $record, $canonical_id, $page, $page_id, $attachment_id, $row );
	if ( is_wp_error( $write_result ) ) {
		$asset['notes'][] = $write_result->get_error_message();
		return $asset;
	}

	if ( $write_result['record_changed'] ) {
		$asset['changed'] = true;
		$asset['notes'][] = 'Domain record page attached/updated via ManageSchematicRecord.';
	}

	return $asset;
}

/**
 * The only place in this engine that calls into Application/ManageSchematicRecord.php
 * for a given manifest row. Idempotent: only calls a write function when the
 * target state actually differs from the current stored state.
 *
 * @param array $row Source manifest row for this asset; its `checksum_sha256`
 *                    and `filename` are written through to the domain page's
 *                    `source_checksum`/`source_filename` fields so the public
 *                    API's versioned media URLs stay keyed off the real
 *                    source checksum (see Rest/SchematicPublicApiController.php
 *                    dtb_schematics_public_api_versioned_url()).
 * @return array{record_changed:bool}|WP_Error
 */
function dtb_schematic_reconcile_write_row( ?DTB_Schematic_Record_Entity $record, string $canonical_id, int $page, string $page_id, int $attachment_id, array $row = [] ) {
	$record_changed   = false;
	$source_checksum  = (string) ( $row['checksum_sha256'] ?? '' );
	$source_filename  = (string) ( $row['filename'] ?? '' );

	if ( ! $record ) {
		$created = dtb_schematic_create(
			[
				'canonical_id'      => $canonical_id,
				'title'             => dtb_schematic_reconcile_default_title( $canonical_id ),
				'source_provenance' => [ 'source' => 'reconciliation_pipeline', 'created_at' => gmdate( 'c' ) ],
			]
		);
		if ( is_wp_error( $created ) ) {
			return $created;
		}
		$record          = $created;
		$record_changed  = true;
	}

	$existing_page = null;
	foreach ( $record->pages as $existing ) {
		if ( $existing['page_id'] === $page_id ) {
			$existing_page = $existing;
			break;
		}
	}

	$needs_attach = ! $existing_page
		|| (int) $existing_page['attachment_id'] !== $attachment_id
		|| (int) $existing_page['page_number'] !== $page;

	// Never let a manifest row missing a checksum wipe out a previously
	// recorded good one — the checksum only ever moves forward from a real
	// value to another real value.
	if ( '' === $source_checksum && $existing_page ) {
		$source_checksum = (string) $existing_page['source_checksum'];
	}
	if ( '' === $source_filename && $existing_page ) {
		$source_filename = (string) $existing_page['source_filename'];
	}

	if ( $needs_attach ) {
		$updated = dtb_schematic_attach_page(
			$record->id,
			[
				'page_id'         => $page_id,
				'page_number'     => $page,
				'label'           => sprintf( 'Page %d', $page ),
				'attachment_id'   => $attachment_id,
				'source_checksum' => $source_checksum,
				'source_filename' => $source_filename,
			]
		);
		if ( is_wp_error( $updated ) ) {
			return $updated;
		}
		$record         = $updated;
		$record_changed = true;
	} elseif ( ! dtb_schematic_page_is_metadata_current( $existing_page, $attachment_id )
		|| ( '' !== $source_checksum && $existing_page['source_checksum'] !== $source_checksum ) ) {
		// Metadata-only refresh (dimensions/sources/checksum) without disturbing ordering.
		$updated = dtb_schematic_attach_page(
			$record->id,
			[
				'page_id'         => $page_id,
				'page_number'     => $page,
				'label'           => $existing_page['label'],
				'attachment_id'   => $attachment_id,
				'source_checksum' => $source_checksum,
				'source_filename' => $source_filename,
			]
		);
		if ( is_wp_error( $updated ) ) {
			return $updated;
		}
		$record         = $updated;
		$record_changed = true;
	}

	$hotspot_result = dtb_schematic_reconcile_associate_hotspot_dataset( $record );
	$record_changed = $record_changed || $hotspot_result;

	$products_result = dtb_schematic_reconcile_refresh_linked_products( $record );
	$record_changed  = $record_changed || $products_result;

	return [ 'record_changed' => $record_changed ];
}

function dtb_schematic_page_is_metadata_current( array $page, int $attachment_id ): bool {
	$described = dtb_schematic_attachment_repo_describe( $attachment_id );
	if ( ! $described || ! $described['exists'] ) {
		return true; // Nothing we can refresh.
	}
	return (int) $page['width'] === (int) $described['width'] && (int) $page['height'] === (int) $described['height'];
}

function dtb_schematic_reconcile_default_title( string $canonical_id ): string {
	return ucwords( str_replace( '-', ' ', $canonical_id ) );
}

/**
 * Best-effort, existence-check-only hotspot dataset association. Never
 * parses JSON content (Phase 5's responsibility) — only records where a
 * plausible dataset file lives, if one can be found deterministically.
 * Returns true if the association changed anything.
 */
function dtb_schematic_reconcile_associate_hotspot_dataset( DTB_Schematic_Record_Entity $record ): bool {
	if ( '' !== $record->hotspot_dataset['reference'] ) {
		return false; // Already associated; this pipeline never overwrites an existing pointer.
	}

	$located = dtb_schematic_reconcile_locate_hotspot_dataset_file( $record->canonical_id, $record->brand_name ?: $record->brand_id );
	if ( null === $located ) {
		return false;
	}

	$result = dtb_schematic_associate_hotspot_dataset(
		$record->id,
		[
			'type'      => 'frontend_json',
			'reference' => $located,
		]
	);

	return ! is_wp_error( $result );
}

/**
 * Heuristic (not authoritative) search for a frontend hotspot dataset file
 * matching a canonical schematic ID, under frontend/public/brands/**\/schematic_data.json.
 * Existence-check only — the JSON content is never parsed here.
 */
function dtb_schematic_reconcile_locate_hotspot_dataset_file( string $canonical_id, string $brand ): ?string {
	static $index = null;

	if ( null === $index ) {
		$index = [];
		if ( defined( 'ABSPATH' ) ) {
			$repo_root = dirname( dirname( untrailingslashit( ABSPATH ) ) );
			$brands_dir = $repo_root . '/frontend/public/brands';
			if ( is_dir( $brands_dir ) ) {
				$iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $brands_dir, FilesystemIterator::SKIP_DOTS ) );
				foreach ( $iterator as $file ) {
					if ( 'schematic_data.json' === $file->getFilename() ) {
						$relative = str_replace( $repo_root . '/', '', str_replace( '\\', '/', $file->getPathname() ) );
						$index[]  = $relative;
					}
				}
			}
		}
	}

	$tokens = array_filter( explode( '-', preg_replace( '/[^a-z0-9-]/', '', strtolower( $canonical_id ) ) ) );
	$tokens = array_diff( $tokens, [ strtolower( preg_replace( '/[^a-z0-9]/', '', $brand ) ) ] );
	if ( empty( $tokens ) ) {
		return null;
	}

	foreach ( $index as $path ) {
		$path_tokens = strtolower( preg_replace( '/[^a-z0-9]+/', '', $path ) );
		$all_match   = true;
		foreach ( $tokens as $token ) {
			if ( strlen( $token ) < 3 ) {
				continue;
			}
			if ( false === strpos( $path_tokens, $token ) ) {
				$all_match = false;
				break;
			}
		}
		if ( $all_match ) {
			return $path;
		}
	}

	return null;
}

/**
 * Refresh the schematic's linked-product projection from Data/SkuSchematicMap.php.
 * Read-only against WooCommerce (wc_get_product_id_by_sku); never creates or
 * modifies WooCommerce products. Returns true if the stored list changed.
 */
function dtb_schematic_reconcile_refresh_linked_products( DTB_Schematic_Record_Entity $record ): bool {
	if ( ! function_exists( 'wc_get_product_id_by_sku' ) ) {
		return false;
	}

	$product_ids = [];
	foreach ( DTB_SKU_SCHEMATIC_MAP as $sku => $mapped ) {
		if ( $mapped['schematic_id'] !== $record->canonical_id ) {
			continue;
		}
		$product_id = (int) wc_get_product_id_by_sku( $sku );
		if ( $product_id > 0 ) {
			$product_ids[] = $product_id;
		}
	}
	$product_ids = array_values( array_unique( $product_ids ) );
	sort( $product_ids );

	$current = $record->linked_products;
	sort( $current );

	if ( $current === $product_ids ) {
		return false;
	}

	$result = dtb_schematic_update( $record->id, [ 'linked_products' => $product_ids ] );
	return ! is_wp_error( $result );
}

/**
 * Create a WordPress attachment from a file already present under
 * wp-content/uploads/{relative_file}. Does not copy the canonical source
 * binary into uploads — that copy is an external deployment step (the
 * canonical source package and the live uploads directory are documented as
 * separate locations; see docs/_working/schematics_prompt.md, "CURRENT
 * SOURCE AND RUNTIME CONTEXT").
 *
 * @return int|WP_Error New attachment ID, or WP_Error if the uploads file does not exist.
 */
function dtb_schematic_reconcile_create_attachment_from_uploads( string $relative_file, string $canonical_id, int $page ) {
	$uploads  = wp_upload_dir();
	$abs_path = trailingslashit( $uploads['basedir'] ) . $relative_file;

	if ( ! is_file( $abs_path ) ) {
		return new WP_Error( 'dtb_schematic_uploads_binary_not_present', sprintf( 'No file at uploads path "%s" — cannot create an attachment without the binary already present in wp-content/uploads.', $relative_file ) );
	}

	$filetype = wp_check_filetype( basename( $abs_path ), null );
	if ( empty( $filetype['type'] ) || 0 !== strpos( (string) $filetype['type'], 'image/' ) ) {
		return new WP_Error( 'dtb_schematic_unsupported_mime', 'Unsupported image MIME type.' );
	}

	$attachment_id = wp_insert_attachment(
		[
			'post_mime_type' => $filetype['type'],
			'post_title'     => sanitize_text_field( $canonical_id . ' page ' . $page ),
			'post_status'    => 'inherit',
		],
		$abs_path
	);
	if ( is_wp_error( $attachment_id ) ) {
		return $attachment_id;
	}

	update_post_meta( $attachment_id, '_wp_attached_file', $relative_file );
	require_once ABSPATH . 'wp-admin/includes/image.php';
	$metadata = wp_generate_attachment_metadata( $attachment_id, $abs_path );
	if ( is_array( $metadata ) ) {
		wp_update_attachment_metadata( $attachment_id, $metadata );
	}

	return (int) $attachment_id;
}

/**
 * Explicitly retire domain records whose canonical ID was not observed as
 * "covered by an active source row" across a just-completed full pass.
 * Never deletes — only transitions lifecycle to retired (preserving the
 * administrative record per Application/ManageSchematicRecord.php).
 */
function dtb_schematic_reconcile_retire_uncovered( array $seen_canonical_ids ): int {
	$retired_count = 0;
	$page          = 1;

	do {
		$results = dtb_schematic_record_repo_query( [ 'page' => $page, 'per_page' => 100 ] );
		foreach ( $results['items'] as $record ) {
			if ( $record->lifecycle->is_retired() ) {
				continue;
			}
			if ( in_array( $record->canonical_id, $seen_canonical_ids, true ) ) {
				continue;
			}
			$result = dtb_schematic_retire( $record->id );
			if ( ! is_wp_error( $result ) ) {
				$retired_count++;
			}
		}
		$page++;
	} while ( $page <= $results['pages'] );

	return $retired_count;
}
