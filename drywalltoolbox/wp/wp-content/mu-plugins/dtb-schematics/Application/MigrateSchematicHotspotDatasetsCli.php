<?php
/**
 * DTB Schematics — Phase 5 hotspot/product migration operational entry point.
 *
 * Registers a WP-CLI command over Application/MigrateSchematicHotspotDatasets.php,
 * following the same pattern as Application/ReconcileSchematicSourceCli.php.
 *
 * Usage:
 *   wp dtb schematics migrate-hotspots                       # dry run, every schematic
 *   wp dtb schematics migrate-hotspots --commit               # writes
 *   wp dtb schematics migrate-hotspots --schematic=tapetech-07tt --commit
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	add_action( 'init', 'dtb_register_cli_schematic_migrate_hotspots', 99 );
}

function dtb_register_cli_schematic_migrate_hotspots(): void {
	if ( ! class_exists( 'WP_CLI' ) ) {
		return;
	}
	WP_CLI::add_command( 'dtb schematics migrate-hotspots', 'dtb_schematic_migrate_hotspots_cli_command' );
}

/**
 * @param array $args
 * @param array $assoc_args {
 *     @type bool   $commit    Write mode. Omitted/absent = dry run (default).
 *     @type string $schematic Restrict to one canonical schematic ID.
 *     @type int    $per_page  Records per query page (default 50).
 * }
 */
function dtb_schematic_migrate_hotspots_cli_command( array $args, array $assoc_args ): void {
	$dry_run = ! isset( $assoc_args['commit'] );

	WP_CLI::log( sprintf( 'DTB Schematic Hotspot/Part Migration — %s.', $dry_run ? 'DRY RUN (no writes)' : 'COMMIT MODE' ) );

	$result = dtb_schematic_migrate_hotspot_datasets(
		[
			'dry_run'           => $dry_run,
			'per_page'          => (int) ( $assoc_args['per_page'] ?? 50 ),
			'only_canonical_id' => (string) ( $assoc_args['schematic'] ?? '' ),
		]
	);

	foreach ( $result['results'] as $row ) {
		WP_CLI::log(
			sprintf(
				'  %-40s %-28s %s',
				$row['canonical_id'],
				$row['status'],
				$row['detail']
			)
		);
	}

	WP_CLI::success(
		sprintf(
			'Complete. Examined %d, migrated %d, unchanged %d, skipped %d, failed %d.',
			$result['examined'],
			$result['migrated'],
			$result['unchanged'],
			$result['skipped'],
			$result['failed']
		)
	);
}
