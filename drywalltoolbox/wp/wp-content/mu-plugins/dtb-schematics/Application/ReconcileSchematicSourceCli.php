<?php
/**
 * DTB Schematics — Phase 3 reconciliation operational entry point.
 *
 * Registers a WP-CLI command over Application/ReconcileSchematicSource.php,
 * following the same registration pattern already established in
 * dtb-catalog-platform/Admin/MetaBackfillTool.php (`wp dtb catalog backfill-meta`).
 *
 * Usage:
 *   wp dtb schematics reconcile                      # dry run, one batch, resumes from cursor
 *   wp dtb schematics reconcile --commit              # writes, one batch
 *   wp dtb schematics reconcile --commit --all        # writes, runs every remaining batch to completion
 *   wp dtb schematics reconcile --restart              # ignore the saved cursor, start a fresh pass
 *   wp dtb schematics reconcile --batch=50 --upload-path=2026/schematics
 *
 * There is no admin-UI or REST entry point for this operation — it is
 * intentionally CLI-only for Phase 3. A future Pipeline Suite "Reconcile"
 * screen (spec Phase 6) may call the same
 * Application/ReconcileSchematicSource.php engine through an admin-capability
 * gated AJAX/REST action; that transport does not exist yet.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	add_action( 'init', 'dtb_register_cli_schematic_reconcile', 99 );
}

function dtb_register_cli_schematic_reconcile(): void {
	if ( ! class_exists( 'WP_CLI' ) ) {
		return;
	}
	WP_CLI::add_command( 'dtb schematics reconcile', 'dtb_schematic_reconcile_cli_command' );
}

/**
 * @param array $args
 * @param array $assoc_args {
 *     @type bool   $commit       Write mode. Omitted/absent = dry run (default).
 *     @type bool   $all          Run every remaining batch to completion instead of just one.
 *     @type bool   $restart      Ignore the saved cursor and start a fresh full pass.
 *     @type int    $batch        Rows per batch (default DTB_SCHEMATIC_RECONCILE_DEFAULT_BATCH_SIZE).
 *     @type string $upload_path  Relative wp-content/uploads path (default "2026/schematics").
 *     @type int    $max_batches  Safety cap on batches run in one invocation when --all is passed (default 50).
 * }
 */
function dtb_schematic_reconcile_cli_command( array $args, array $assoc_args ): void {
	$dry_run     = ! isset( $assoc_args['commit'] );
	$run_all     = isset( $assoc_args['all'] );
	$restart     = isset( $assoc_args['restart'] );
	$batch_size  = max( 1, min( DTB_SCHEMATIC_RECONCILE_MAX_BATCH_SIZE, (int) ( $assoc_args['batch'] ?? DTB_SCHEMATIC_RECONCILE_DEFAULT_BATCH_SIZE ) ) );
	$upload_path = (string) ( $assoc_args['upload-path'] ?? DTB_SCHEMATIC_RECONCILE_DEFAULT_UPLOAD_PATH );
	$max_batches = max( 1, (int) ( $assoc_args['max-batches'] ?? 50 ) );

	WP_CLI::log( sprintf(
		'DTB Schematic Reconciliation — %s. Batch size: %d. %s',
		$dry_run ? 'DRY RUN (no writes)' : 'COMMIT MODE',
		$batch_size,
		$restart ? 'Restarting pass from row 0.' : 'Resuming from saved cursor (if any).'
	) );

	if ( $restart ) {
		dtb_schematic_reconcile_state_start_pass();
	}

	$totals = [
		'examined'   => 0,
		'unchanged'  => 0,
		'changed'    => 0,
		'skipped'    => 0,
		'unresolved' => 0,
		'retired'    => 0,
	];

	$batches_run = 0;
	$resume      = ! $restart;

	do {
		$result = dtb_schematic_reconcile_source(
			[
				'dry_run'     => $dry_run,
				'batch_size'  => $batch_size,
				'resume'      => $resume,
				'upload_path' => $upload_path,
			]
		);
		$resume = true; // Subsequent iterations always resume from the cursor this call just advanced.
		$batches_run++;

		if ( ! empty( $result['fatal_error'] ) ) {
			WP_CLI::error( 'Reconciliation could not run: ' . $result['fatal_error'] );
			return;
		}

		foreach ( [ 'examined', 'unchanged', 'changed', 'skipped', 'unresolved', 'retired' ] as $key ) {
			$totals[ $key ] += $result[ $key ];
		}

		WP_CLI::log( sprintf(
			'  Batch rows %d-%d of %d — examined %d, unchanged %d, changed %d, skipped %d, unresolved %d.',
			$result['batch_start'] + 1,
			$result['batch_end'],
			$result['source_row_count'],
			$result['examined'],
			$result['unchanged'],
			$result['changed'],
			$result['skipped'],
			$result['unresolved']
		) );

		foreach ( $result['dispositions'] as $disposition => $count ) {
			WP_CLI::log( sprintf( '    %-32s %d', DTB_Schematic_Asset_Disposition::label( $disposition ), $count ) );
		}

		if ( ! $result['wordpress_context_available'] ) {
			WP_CLI::warning( 'No WordPress runtime detected — only source-manifest parsing and identity resolution were verified. Attachment, domain-record, and write behavior require a live WP-CLI context.' );
		}
	} while ( $run_all && ! $result['is_last_batch'] && $batches_run < $max_batches );

	if ( $run_all && $batches_run >= $max_batches && ! $result['is_last_batch'] ) {
		WP_CLI::warning( sprintf( 'Stopped after the --max-batches cap (%d) with rows remaining. Run the command again to continue.', $max_batches ) );
	}

	if ( $totals['retired'] > 0 ) {
		WP_CLI::log( sprintf( '  Retired %d schematic record(s) with no covering source row in this pass.', $totals['retired'] ) );
	}

	WP_CLI::success( sprintf(
		'Complete (%d batch(es)). Examined %d, unchanged %d, changed %d, skipped %d, unresolved %d, retired %d.',
		$batches_run,
		$totals['examined'],
		$totals['unchanged'],
		$totals['changed'],
		$totals['skipped'],
		$totals['unresolved'],
		$totals['retired']
	) );
}
