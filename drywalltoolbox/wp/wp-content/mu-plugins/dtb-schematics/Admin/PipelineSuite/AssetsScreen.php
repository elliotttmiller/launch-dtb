<?php
/**
 * DTB Schematics Pipeline Suite — AssetsScreen.
 *
 * Per-asset disposition table driven directly by Phase 3's reconciliation
 * engine (Application/ReconcileSchematicSource.php) — this screen never
 * reimplements disposition classification, it only runs the engine in
 * dry-run mode and renders the resulting per-asset report.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Run the reconciliation engine dry-run across the *entire* source manifest
 * (looping bounded batches, capped to avoid runaway execution on an
 * unexpectedly large source package) and return the combined per-asset list.
 * Read-only: always dry_run, and resume=false so this screen's own read
 * never disturbs the engine's resumable commit-mode cursor
 * (Infrastructure/SchematicReconciliationStateStore.php).
 */
function dtb_schematics_suite_full_dry_run_assets( int $max_batches = 6, int $batch_size = 50 ): array {
	$assets       = [];
	$report       = null;
	$offset_state = [ 'cursor' => 0, 'seen_canonical_ids' => [] ];

	// Reset to pass start, then step through batches manually without
	// touching the persisted resumable state (dry-run reads only).
	for ( $i = 0; $i < $max_batches; $i++ ) {
		$report = dtb_schematic_reconcile_source( [
			'dry_run'    => true,
			'batch_size' => $batch_size,
			'resume'     => 0 === $i ? false : true,
		] );
		$assets = array_merge( $assets, $report['assets'] );
		if ( ! empty( $report['is_last_batch'] ) ) {
			break;
		}
	}

	// Reset the resumable cursor back to 0 so this read-only screen never
	// leaves the engine mid-pass for the next real (possibly commit-mode) run.
	dtb_schematic_reconcile_state_save( [ 'cursor' => 0, 'seen_canonical_ids' => [], 'last_run_at' => '', 'last_run_mode' => 'dry_run' ] );

	return [ 'assets' => $assets, 'report' => $report ];
}

function dtb_schematics_suite_render_assets(): void {
	if ( ! dtb_schematics_source_package_available() ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_alert(
			__( 'The canonical source package is not reachable from this runtime, so asset disposition cannot be computed. See Configuration Reference for the expected path.', 'drywall-toolbox' ),
			'warning'
		);
		return;
	}

	$disposition_filter = sanitize_key( $_GET['disposition'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$result  = dtb_schematics_suite_full_dry_run_assets();
	$assets  = $result['assets'];
	$report  = $result['report'];

	if ( ! ( $report['wordpress_context_available'] ?? false ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_alert(
			__( 'No WordPress runtime context was available while computing dispositions (this can happen during CLI/bootstrap execution). Attachment and domain-record state could not be verified — dispositions below reflect source-only checks.', 'drywall-toolbox' ),
			'info'
		);
	}

	// Disposition summary chips.
	$counts = [];
	foreach ( $assets as $asset ) {
		$counts[ $asset['disposition'] ] = 1 + ( $counts[ $asset['disposition'] ] ?? 0 );
	}
	$base = admin_url( 'admin.php?page=dtb-schematics&view=assets' );
	echo '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">';
	printf( '<a href="%s" class="dtb-filter-chip%s">%s (%d)</a>', esc_url( $base ), '' === $disposition_filter ? ' is-active' : '', esc_html__( 'All', 'drywall-toolbox' ), count( $assets ) );
	foreach ( DTB_Schematic_Asset_Disposition::all() as $d ) {
		if ( empty( $counts[ $d ] ) ) {
			continue;
		}
		$url = add_query_arg( 'disposition', $d, $base );
		printf( '<a href="%s" class="dtb-filter-chip%s">%s (%d)</a>', esc_url( $url ), $disposition_filter === $d ? ' is-active' : '', esc_html( DTB_Schematic_Asset_Disposition::label( $d ) ), (int) $counts[ $d ] );
	}
	echo '</div>';

	if ( $disposition_filter ) {
		$assets = array_values( array_filter( $assets, fn( $a ) => $a['disposition'] === $disposition_filter ) );
	}

	if ( empty( $assets ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No assets match this filter.', 'drywall-toolbox' ) );
		return;
	}

	// Bound the rendered table itself (source package is ~126 rows; still cap
	// defensively so a much larger future package never renders unbounded).
	$rendered = array_slice( $assets, 0, 300 );

	echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		[ 'label' => __( 'Source Filename', 'drywall-toolbox' ) ], [ 'label' => __( 'Brand', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Schematic / Page', 'drywall-toolbox' ) ], [ 'label' => __( 'Attachment', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Disposition', 'drywall-toolbox' ) ], [ 'label' => __( 'Notes', 'drywall-toolbox' ) ], [ 'label' => '' ],
	] );

	foreach ( $rendered as $asset ) {
		$badge_type = dtb_schematics_suite_disposition_badge_type( $asset['disposition'] );
		$record     = ! empty( $asset['canonical_id'] ) ? dtb_schematic_record_repo_find_by_canonical_id( $asset['canonical_id'] ) : null;

		echo '<tr class="dtb-table__row">';
		echo '<td class="dtb-table__cell">' . esc_html( $asset['source_filename'] ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( $asset['brand'] ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( ( $asset['canonical_id'] ?? '—' ) . ( isset( $asset['page'] ) && null !== $asset['page'] ? ' / p' . $asset['page'] : '' ) ) . '</td>';
		echo '<td class="dtb-table__cell">' . ( ! empty( $asset['attachment_id'] ) ? '#' . (int) $asset['attachment_id'] : '<span class="dtb-table__cell--muted">—</span>' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_badge( DTB_Schematic_Asset_Disposition::label( $asset['disposition'] ), $badge_type ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell"><span class="description">' . esc_html( implode( ' ', array_slice( $asset['notes'], 0, 2 ) ) ) . '</span></td>';
		echo '<td class="dtb-table__cell">';
		if ( $record ) {
			echo dtb_admin_ui_button( __( 'Open Schematic', 'drywall-toolbox' ), [ 'href' => dtb_schematics_suite_detail_url( $record->id ), 'size' => 'xs', 'type' => 'ghost' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
		echo '</td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	if ( count( $assets ) > count( $rendered ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_alert( sprintf( __( 'Showing the first %1$d of %2$d assets in this filter. Use Sync & Reconciliation to export the full report or narrow the filter.', 'drywall-toolbox' ), count( $rendered ), count( $assets ) ), 'info' );
	}

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_alert(
		__( 'Write actions (register, connect, assign, regenerate metadata, replace page attachment, mark retired) are performed via Sync & Reconciliation\'s "Register Missing Attachments" and "Reconcile Selected Records" operations, which write through the same reconciliation engine shown here — never independently of it.', 'drywall-toolbox' ),
		'info'
	);
}

function dtb_schematics_suite_disposition_badge_type( string $disposition ): string {
	$map = [
		DTB_Schematic_Asset_Disposition::ACTIVE_AND_SYNCHRONIZED => 'success',
		DTB_Schematic_Asset_Disposition::RETIRED                 => 'neutral',
		DTB_Schematic_Asset_Disposition::LEGACY                  => 'neutral',
		DTB_Schematic_Asset_Disposition::SUPERSEDED              => 'neutral',
		DTB_Schematic_Asset_Disposition::SOURCE_ONLY              => 'info',
		DTB_Schematic_Asset_Disposition::UPLOADED_BUT_UNATTACHED  => 'warning',
		DTB_Schematic_Asset_Disposition::MISSING_MEDIA_METADATA   => 'warning',
		DTB_Schematic_Asset_Disposition::MISSING_WORDPRESS_ATTACHMENT => 'warning',
		DTB_Schematic_Asset_Disposition::MISSING_SOURCE_BINARY     => 'danger',
		DTB_Schematic_Asset_Disposition::REGISTERED_TO_WRONG_SCHEMATIC => 'danger',
		DTB_Schematic_Asset_Disposition::REGISTERED_TO_WRONG_PAGE      => 'warning',
		DTB_Schematic_Asset_Disposition::DUPLICATE_SCHEMATIC_PAGE       => 'danger',
		DTB_Schematic_Asset_Disposition::ATTACHED_BUT_UNIDENTIFIED       => 'danger',
		DTB_Schematic_Asset_Disposition::AMBIGUOUS_AND_UNRESOLVED         => 'danger',
	];
	return $map[ $disposition ] ?? 'neutral';
}
