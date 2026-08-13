<?php
/**
 * Static verification harness for the Phase 5 hotspot dataset reader
 * (Infrastructure/SchematicHotspotDatasetReader.php) — exercises REAL
 * production parsing/normalization code against every real
 * frontend/public/brands/**\/schematic_data*.json file, WITHOUT a WordPress
 * bootstrap.
 *
 * This validates file discovery, JSON/BOM handling, and legacy/v2 schema
 * normalization only. It does NOT exercise WooCommerce part resolution,
 * postmeta persistence, or the WP-CLI batch operation — those require a
 * live WordPress + WooCommerce runtime (see
 * Application/MigrateSchematicHotspotDatasets.php and
 * Application/MigrateSchematicHotspotDatasetsCli.php).
 *
 * Run with: php scripts/catalog/hotspot_migration_dry_run_harness.php
 *
 * @package drywall-toolbox
 */

declare( strict_types=1 );

$repo_root = dirname( __DIR__, 2 );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', $repo_root . '/drywalltoolbox/wp/' );
}

if ( ! function_exists( 'sanitize_text_field' ) ) {
	function sanitize_text_field( $value ) {
		return trim( (string) $value );
	}
}
if ( ! function_exists( 'untrailingslashit' ) ) {
	function untrailingslashit( $s ) {
		return rtrim( (string) $s, '/\\' );
	}
}
if ( ! function_exists( 'trailingslashit' ) ) {
	function trailingslashit( $s ) {
		return rtrim( (string) $s, '/\\' ) . '/';
	}
}

require $repo_root . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Domain/SchematicHotspotDataset.php';
require $repo_root . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-schematics/Infrastructure/SchematicHotspotDatasetReader.php';

echo "DTB Schematic Hotspot Dataset Migration — static verification harness\n";
echo str_repeat( '=', 74 ) . "\n";

$files = dtb_schematic_hotspot_enumerate_source_files();
printf( "Discovered %d dataset files under frontend/public/brands (excluding schema.json/template).\n\n", count( $files ) );

$counts = [
	'ok_v2'      => 0,
	'ok_legacy'  => 0,
	'failed'     => 0,
];
$failures      = [];
$bom_files     = [];
$total_parts   = 0;
$total_hotspots = 0;
$empty_hotspot_legacy = [];

foreach ( $files as $relative ) {
	$absolute = $repo_root . '/' . $relative;
	$result   = dtb_schematic_hotspot_read_file( $absolute );

	if ( $result['bom_stripped'] ) {
		$bom_files[] = $relative;
	}

	if ( DTB_SCHEMATIC_HOTSPOT_READ_OK !== $result['status'] ) {
		$counts['failed']++;
		$failures[] = sprintf( '%s — %s: %s', $relative, $result['status'], $result['error'] ?? '' );
		continue;
	}

	$dataset = $result['dataset'];
	$total_parts    += count( $dataset['parts_catalog'] );
	$total_hotspots += count( $dataset['hotspots'] );

	if ( 'v2' === $dataset['source_schema'] ) {
		$counts['ok_v2']++;
	} else {
		$counts['ok_legacy']++;
		if ( empty( $dataset['hotspots'] ) ) {
			$empty_hotspot_legacy[] = $relative;
		}
	}
}

printf( "Clean v2-native files:        %d\n", $counts['ok_v2'] );
printf( "Legacy files normalized:      %d (parts_catalog only — no coordinate data exists in this schema)\n", $counts['ok_legacy'] );
printf( "Failed to read/normalize:     %d\n", $counts['failed'] );
printf( "Files with a BOM stripped:    %d\n", count( $bom_files ) );
printf( "Total normalized parts_catalog entries across all files: %d\n", $total_parts );
printf( "Total normalized hotspot occurrences across all files:   %d\n", $total_hotspots );

if ( ! empty( $failures ) ) {
	echo "\nFailures:\n";
	foreach ( $failures as $f ) {
		echo '  - ' . $f . "\n";
	}
}

if ( ! empty( $bom_files ) ) {
	echo "\nBOM-corrupted files (BOM stripped automatically, flagged for Phase 9 cleanup review):\n";
	foreach ( $bom_files as $f ) {
		echo '  - ' . $f . "\n";
	}
}

echo str_repeat( '=', 74 ) . "\n";
echo "Static verification complete. WooCommerce part resolution, postmeta\n";
echo "persistence, and the WP-CLI batch operation were NOT exercised — they\n";
echo "require a live `wp dtb schematics migrate-hotspots` run against WordPress + WooCommerce.\n";
