<?php
/**
 * Static verification harness for the Phase 3 schematic reconciliation
 * engine — exercises REAL production code (manifest parsing, identity
 * resolution, duplicate-key detection) with a minimal set of WordPress
 * function/class stubs, WITHOUT a WordPress bootstrap.
 *
 * This is not a substitute for running the actual `wp dtb schematics
 * reconcile` command against a live WordPress database. Everything that
 * depends on WP_Query, postmeta, attachments, or the `dtb_schematic` CPT
 * (i.e. most of the engine's disposition and write logic) is NOT exercised
 * here — dtb_schematic_reconcile_wp_context_available() is false in this
 * process, so a real run in this environment would fall back to reporting
 * every resolvable row as `source_only` and perform zero writes, exactly as
 * this harness demonstrates.
 *
 * Run with: php scripts/catalog/reconcile_schematics_dry_run_harness.php
 *
 * @package drywall-toolbox
 */

declare( strict_types=1 );

$repo_root = dirname( __DIR__, 2 );

// ── Minimal WordPress shims (only what the required files call) ────────────

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', $repo_root . '/drywalltoolbox/wp/' );
}

if ( ! function_exists( 'sanitize_key' ) ) {
	function sanitize_key( $key ) {
		$key = strtolower( (string) $key );
		return preg_replace( '/[^a-z0-9_\-]/', '', str_replace( [ ' ', '/' ], '-', $key ) );
	}
}
if ( ! function_exists( 'absint' ) ) {
	function absint( $n ) {
		return abs( (int) $n );
	}
}
if ( ! function_exists( 'trailingslashit' ) ) {
	function trailingslashit( $s ) {
		return rtrim( (string) $s, '/\\' ) . '/';
	}
}
if ( ! function_exists( 'untrailingslashit' ) ) {
	function untrailingslashit( $s ) {
		return rtrim( (string) $s, '/\\' );
	}
}
if ( ! function_exists( 'apply_filters' ) ) {
	function apply_filters( $tag, $value ) {
		return $value;
	}
}
if ( ! function_exists( 'add_action' ) ) {
	function add_action( ...$args ) {}
}
if ( ! function_exists( 'check_ajax_referer' ) ) {
	function check_ajax_referer( ...$args ) {}
}
if ( ! function_exists( 'wp_send_json_error' ) ) {
	function wp_send_json_error( ...$args ) {}
}
if ( ! class_exists( 'WP_Error' ) ) {
	class WP_Error {
		private string $code;
		private string $message;
		private array $data;
		public function __construct( string $code = '', string $message = '', $data = [] ) {
			$this->code    = $code;
			$this->message = $message;
			$this->data    = (array) $data;
		}
		public function get_error_code(): string {
			return $this->code;
		}
		public function get_error_message(): string {
			return $this->message;
		}
	}
}
if ( ! function_exists( 'is_wp_error' ) ) {
	function is_wp_error( $thing ) {
		return $thing instanceof WP_Error;
	}
}

// ── Require real production files ───────────────────────────────────────────

require $repo_root . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Domain/SchematicAssetDisposition.php';
require $repo_root . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Infrastructure/SchematicSourceManifestReader.php';
require $repo_root . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Data/SkuSchematicMap.php';
require $repo_root . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Application/RegisterSchematicUploads.php';

// Load only the WP-independent identity/duplicate-detection functions out of
// the reconciliation engine by requiring the whole file — PHP does not fail
// to parse/define a function merely because a *different*, uncalled function
// in the same file references undefined WP symbols.
require $repo_root . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Application/ReconcileSchematicSource.php';

// ── Run ──────────────────────────────────────────────────────────────────────

echo "DTB Schematic Reconciliation — static verification harness\n";
echo str_repeat( '=', 70 ) . "\n";

echo 'Source package directory: ' . dtb_schematics_source_package_dir() . "\n";
echo 'Source package available: ' . ( dtb_schematics_source_package_available() ? 'yes' : 'no' ) . "\n";
echo 'WordPress runtime context: ' . ( dtb_schematic_reconcile_wp_context_available() ? 'yes' : 'no (expected — this is a bare PHP process)' ) . "\n\n";

$manifest = dtb_schematics_read_source_manifest();
if ( ! $manifest['ok'] ) {
	fwrite( STDERR, 'FATAL: could not read source manifest — ' . $manifest['error'] . "\n" );
	exit( 1 );
}

$rows = $manifest['rows'];
printf( "Parsed %d manifest rows.\n", count( $rows ) );

$resolved = dtb_schematic_reconcile_resolve_all_identities( $rows );

$counts = [
	'resolved'  => 0,
	'retired'   => 0,
	'unresolved' => 0,
];
$unresolved_samples = [];
$binary_missing     = 0;
$checksum_mismatch  = 0;

foreach ( $rows as $index => $row ) {
	$r = $resolved[ $index ];
	if ( null !== $r['retired_reason'] ) {
		$counts['retired']++;
		continue;
	}
	if ( null !== $r['error'] ) {
		$counts['unresolved']++;
		if ( count( $unresolved_samples ) < 10 ) {
			$unresolved_samples[] = $row['filename'] . ' — ' . $r['error'];
		}
		continue;
	}
	$counts['resolved']++;

	$binary = dtb_schematics_describe_source_binary( $row['filename'], true );
	if ( ! $binary['exists'] ) {
		$binary_missing++;
	} elseif ( '' !== $row['checksum_sha256'] && $binary['checksum_sha256'] !== $row['checksum_sha256'] ) {
		$checksum_mismatch++;
	}
}

$duplicates = dtb_schematic_reconcile_find_duplicate_keys( $resolved );

echo "\nIdentity resolution (via existing dtb_schematics_parse_upload_filename / dtb_schematics_retired_upload_reason):\n";
printf( "  resolved:    %d\n", $counts['resolved'] );
printf( "  retired:     %d\n", $counts['retired'] );
printf( "  unresolved:  %d\n", $counts['unresolved'] );
foreach ( $unresolved_samples as $sample ) {
	echo '    - ' . $sample . "\n";
}

echo "\nSource binary verification (existence + checksum against manifest):\n";
printf( "  missing binaries:    %d\n", $binary_missing );
printf( "  checksum mismatches: %d\n", $checksum_mismatch );

echo "\nDuplicate schematic/page keys detected: " . count( $duplicates ) . "\n";
foreach ( $duplicates as $key => $indexes ) {
	echo '  - ' . $key . ': rows ' . implode( ', ', array_map( static fn( $i ) => $rows[ $i ]['filename'], $indexes ) ) . "\n";
}

echo "\nEvery disposition constant is well-formed: ";
foreach ( array_keys( $counts ) as $unused ) {
	// no-op, keeps linters quiet about unused var above
}
foreach ( DTB_Schematic_Asset_Disposition::all() as $d ) {
	if ( '' === DTB_Schematic_Asset_Disposition::label( $d ) ) {
		fwrite( STDERR, "FATAL: disposition {$d} has no label\n" );
		exit( 1 );
	}
}
echo "ok (" . count( DTB_Schematic_Asset_Disposition::all() ) . " dispositions).\n";

echo str_repeat( '=', 70 ) . "\n";
echo "Static verification complete. Attachment/domain-record comparison, all\n";
echo "write behavior, and the retirement sweep were NOT exercised — they\n";
echo "require a live `wp dtb schematics reconcile` run against WordPress.\n";
