<?php
/**
 * DTB Schematics — SchematicSourceManifestReader
 *
 * Deterministic reader for the canonical Phase 1 source package:
 *   products/launch/media/schematics/schematic_source_manifest.csv
 * plus the binaries living alongside it.
 *
 * This is a read-only infrastructure component. It never writes to the
 * source package and never writes domain state — see
 * Application/ReconcileSchematicSource.php for the engine that consumes it.
 *
 * The source package may not exist on every runtime (e.g. a deployed
 * WordPress host that only carries the already-synced wp-content/uploads
 * copies). Callers must treat an absent source directory as an explicit,
 * reportable condition rather than a fatal error.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_SCHEMATIC_SOURCE_MANIFEST_FILENAME = 'schematic_source_manifest.csv';

/**
 * Resolve the canonical source package directory. Overridable via the
 * `dtb_schematics_source_package_dir` filter for hosts where the repository
 * checkout does not live in the conventional location relative to ABSPATH.
 */
function dtb_schematics_source_package_dir(): string {
	$default = '';

	if ( defined( 'ABSPATH' ) ) {
		// ABSPATH -> .../drywalltoolbox/wp/ ; repo root is two levels up.
		$wp_root   = untrailingslashit( ABSPATH );
		$repo_root = dirname( dirname( $wp_root ) );
		$default   = $repo_root . '/products/launch/media/schematics';
	}

	/**
	 * Filter the canonical schematic source package directory.
	 *
	 * @param string $default Computed default path.
	 */
	return (string) apply_filters( 'dtb_schematics_source_package_dir', $default );
}

/**
 * Whether the canonical source package is reachable from this runtime.
 */
function dtb_schematics_source_package_available(): bool {
	$dir = dtb_schematics_source_package_dir();
	return '' !== $dir && is_dir( $dir ) && is_file( trailingslashit( $dir ) . DTB_SCHEMATIC_SOURCE_MANIFEST_FILENAME );
}

/**
 * Parse the canonical source manifest CSV into a deterministic, ordered list
 * of rows. Order is stable (sorted by schematic_id, then page, then filename)
 * so batch offsets are reproducible across runs.
 *
 * @return array{ok:bool, error?:string, rows: array[]}
 */
function dtb_schematics_read_source_manifest(): array {
	return dtb_schematics_read_manifest_file( dtb_schematics_source_package_dir(), DTB_SCHEMATIC_SOURCE_MANIFEST_FILENAME );
}

/**
 * Testable core: parses a manifest CSV located in an arbitrary directory.
 * Split out from dtb_schematics_read_source_manifest() so the static
 * verification harness (scripts/catalog/reconcile_schematics_dry_run_harness.php)
 * can exercise real parsing logic without a WordPress bootstrap.
 *
 * @return array{ok:bool, error?:string, rows: array[]}
 */
function dtb_schematics_read_manifest_file( string $dir, string $filename ): array {
	if ( '' === $dir || ! is_dir( $dir ) ) {
		return [ 'ok' => false, 'error' => 'source_package_directory_not_found', 'rows' => [] ];
	}

	$path = trailingslashit( $dir ) . $filename;
	if ( ! is_file( $path ) ) {
		return [ 'ok' => false, 'error' => 'source_manifest_file_not_found', 'rows' => [] ];
	}

	$handle = fopen( $path, 'rb' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fopen
	if ( ! $handle ) {
		return [ 'ok' => false, 'error' => 'source_manifest_unreadable', 'rows' => [] ];
	}

	$header = fgetcsv( $handle );
	if ( ! is_array( $header ) ) {
		fclose( $handle ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fclose
		return [ 'ok' => false, 'error' => 'source_manifest_empty', 'rows' => [] ];
	}

	// Strip a UTF-8 BOM from the first header cell if present.
	$header[0] = preg_replace( '/^\xEF\xBB\xBF/', '', (string) $header[0] );
	$header    = array_map( 'trim', $header );

	$required = [ 'schematic_id', 'brand', 'sku_or_alias', 'page', 'filename', 'checksum_sha256', 'size_bytes' ];
	foreach ( $required as $col ) {
		if ( ! in_array( $col, $header, true ) ) {
			fclose( $handle ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fclose
			return [ 'ok' => false, 'error' => 'source_manifest_missing_column:' . $col, 'rows' => [] ];
		}
	}

	$rows = [];
	while ( false !== ( $line = fgetcsv( $handle ) ) ) {
		if ( 1 === count( $line ) && null === $line[0] ) {
			continue; // Blank line.
		}
		$row = array_combine( $header, array_pad( $line, count( $header ), '' ) );
		if ( false === $row ) {
			continue;
		}
		$rows[] = [
			'schematic_id'    => trim( (string) $row['schematic_id'] ),
			'brand'           => trim( (string) $row['brand'] ),
			'sku_or_alias'    => trim( (string) $row['sku_or_alias'] ),
			'page'            => (int) $row['page'],
			'filename'        => trim( (string) $row['filename'] ),
			'checksum_sha256' => strtolower( trim( (string) $row['checksum_sha256'] ) ),
			'size_bytes'      => (int) $row['size_bytes'],
		];
	}
	fclose( $handle ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fclose

	// Deterministic ordering: source-manifest identity, then page, then filename.
	usort(
		$rows,
		static function ( $a, $b ) {
			return [ $a['schematic_id'], $a['page'], $a['filename'] ] <=> [ $b['schematic_id'], $b['page'], $b['filename'] ];
		}
	);

	return [ 'ok' => true, 'rows' => $rows ];
}

/**
 * Describe the source binary for a manifest row: existence, actual size, and
 * (only when requested — checksum computation is not free) actual checksum.
 *
 * @return array{exists:bool, path:string, size_bytes:int, checksum_sha256:string}
 */
function dtb_schematics_describe_source_binary( string $filename, bool $compute_checksum = true ): array {
	$dir  = dtb_schematics_source_package_dir();
	$path = '' !== $dir ? trailingslashit( $dir ) . $filename : '';

	if ( '' === $path || ! is_file( $path ) ) {
		return [ 'exists' => false, 'path' => $path, 'size_bytes' => 0, 'checksum_sha256' => '' ];
	}

	return [
		'exists'          => true,
		'path'            => $path,
		'size_bytes'      => (int) filesize( $path ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_filesize
		'checksum_sha256' => $compute_checksum ? (string) hash_file( 'sha256', $path ) : '',
	];
}
