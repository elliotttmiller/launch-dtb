<?php
/**
 * DTB Schematics Pipeline Suite — ReconciliationScreen.
 *
 * The one interface for triggering Phase 3's reconciliation engine
 * (Application/ReconcileSchematicSource.php) — dry-run by default, explicit
 * confirmation required for a write ("commit") batch. Scoped operations only
 * — no unexplained "Sync Everything" button, per spec.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_schematics_suite_render_reconciliation(): void {
	$last = get_transient( 'dtb_schematics_last_reconcile_' . get_current_user_id() );

	// Run form: dry-run by default; commit requires an explicit checkbox.
	$form  = dtb_schematics_suite_action_form_open( 'reconcile_run' );
	$form .= '<div class="dtb-grid dtb-grid--three">';
	$form .= dtb_admin_ui_field(
		dtb_admin_ui_select( 'batch_size', [ '25' => '25', '50' => '50', '100' => '100' ], '50' ),
		__( 'Batch Size', 'drywall-toolbox' ),
		[ 'hint' => __( 'Rows examined this run.', 'drywall-toolbox' ) ]
	);
	$form .= dtb_admin_ui_field(
		dtb_admin_ui_select( 'resume', [ '1' => __( 'Resume from cursor', 'drywall-toolbox' ), '0' => __( 'Restart from row 0', 'drywall-toolbox' ) ], '1' ),
		__( 'Position', 'drywall-toolbox' )
	);
	$form .= dtb_admin_ui_field(
		'<label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" name="commit" value="1"> ' . esc_html__( 'Commit (write) — otherwise dry-run only', 'drywall-toolbox' ) . '</label>',
		__( 'Mode', 'drywall-toolbox' )
	);
	$form .= '</div>';
	$form .= dtb_admin_ui_button( __( 'Run Reconciliation Batch', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'type' => 'primary', 'confirm' => __( 'If "Commit" is checked, this batch will write to domain records and attachments. Continue?', 'drywall-toolbox' ) ] );
	$form .= dtb_schematics_suite_action_form_close();

	echo dtb_admin_ui_card( $form, [ 'title' => __( 'Run Reconciliation', 'drywall-toolbox' ), 'subtitle' => __( 'Dry-run by default. Resumable and idempotent — see Application/ReconcileSchematicSource.php.', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	if ( $last ) {
		echo dtb_admin_ui_card( dtb_schematics_suite_render_reconcile_report( $last ), [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			'title'    => __( 'Last Run Results', 'drywall-toolbox' ),
			'subtitle' => sprintf( '%s — %s', ! empty( $last['dry_run'] ) ? __( 'Dry run', 'drywall-toolbox' ) : __( 'Commit', 'drywall-toolbox' ), sprintf( __( 'rows %1$d–%2$d of %3$d', 'drywall-toolbox' ), $last['batch_start'] ?? 0, $last['batch_end'] ?? 0, $last['source_row_count'] ?? 0 ) ),
		] );
	}

	// Scoped operations — exactly the list the spec requires, each delegating
	// to the same engine/service with a narrowed argument set. No
	// "Sync Everything" catch-all.
	echo dtb_admin_ui_card( dtb_schematics_suite_render_scoped_operations(), [ 'title' => __( 'Scoped Operations', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// Recent reconciliation activity (from the activity log).
	$recent = dtb_schematic_activity_query( [ 'type' => 'reconciliation', 'per_page' => 15 ] );
	if ( ! empty( $recent['items'] ) ) {
		$items = array_map( fn( $r ) => [
			'time'  => human_time_diff( strtotime( $r['completed_at'] ) ) . ' ago',
			'title' => ( $r['dry_run'] ? __( 'Dry run', 'drywall-toolbox' ) : __( 'Commit', 'drywall-toolbox' ) ) . ' — ' . $r['examined'] . ' examined, ' . $r['changed'] . ' changed',
			'desc'  => esc_html( $r['summary'] ),
			'badge' => 'error' === $r['result'] ? 'danger' : 'success',
		], $recent['items'] );
		echo dtb_admin_ui_card( dtb_admin_ui_timeline( $items ), [ 'title' => __( 'Recent Reconciliation Runs', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}

function dtb_schematics_suite_render_reconcile_report( array $report ): string {
	if ( ! empty( $report['fatal_error'] ) ) {
		return dtb_admin_ui_alert( esc_html( $report['fatal_error'] ), 'danger', __( 'Reconciliation failed', 'drywall-toolbox' ) );
	}

	$grid  = '<div class="dtb-grid dtb-grid--four">';
	$grid .= dtb_admin_ui_stat_card( __( 'Examined', 'drywall-toolbox' ), (string) $report['examined'] );
	$grid .= dtb_admin_ui_stat_card( __( 'Unchanged', 'drywall-toolbox' ), (string) $report['unchanged'] );
	$grid .= dtb_admin_ui_stat_card( __( 'Changed', 'drywall-toolbox' ), (string) $report['changed'], '', $report['changed'] > 0 ? 'success' : '' );
	$grid .= dtb_admin_ui_stat_card( __( 'Skipped', 'drywall-toolbox' ), (string) $report['skipped'] );
	$grid .= dtb_admin_ui_stat_card( __( 'Unresolved', 'drywall-toolbox' ), (string) $report['unresolved'], '', $report['unresolved'] > 0 ? 'warning' : '' );
	$grid .= dtb_admin_ui_stat_card( __( 'Retired (sweep)', 'drywall-toolbox' ), (string) ( $report['retired'] ?? 0 ) );
	$grid .= '</div>';

	// Discrepancies grouped by drift type — derived from disposition codes,
	// which already encode the drift category (source/attachment/identity/
	// page/duplicate). Hotspot/product/API/frontend drift are not yet
	// produced by this engine pass (see Publication & Frontend for the
	// best-effort API/frontend comparison) — grouped honestly below.
	$drift_groups = [
		'source_drift'     => [ DTB_Schematic_Asset_Disposition::MISSING_SOURCE_BINARY, DTB_Schematic_Asset_Disposition::SOURCE_ONLY ],
		'attachment_drift' => [ DTB_Schematic_Asset_Disposition::UPLOADED_BUT_UNATTACHED, DTB_Schematic_Asset_Disposition::MISSING_WORDPRESS_ATTACHMENT, DTB_Schematic_Asset_Disposition::MISSING_MEDIA_METADATA ],
		'identity_drift'   => [ DTB_Schematic_Asset_Disposition::ATTACHED_BUT_UNIDENTIFIED, DTB_Schematic_Asset_Disposition::AMBIGUOUS_AND_UNRESOLVED ],
		'page_drift'       => [ DTB_Schematic_Asset_Disposition::REGISTERED_TO_WRONG_PAGE, DTB_Schematic_Asset_Disposition::REGISTERED_TO_WRONG_SCHEMATIC, DTB_Schematic_Asset_Disposition::DUPLICATE_SCHEMATIC_PAGE ],
	];

	$by_disposition = [];
	foreach ( $report['assets'] ?? [] as $asset ) {
		$by_disposition[ $asset['disposition'] ][] = $asset;
	}

	$html = $grid;
	foreach ( $drift_groups as $group_key => $dispositions ) {
		$rows = [];
		foreach ( $dispositions as $d ) {
			$rows = array_merge( $rows, $by_disposition[ $d ] ?? [] );
		}
		if ( empty( $rows ) ) {
			continue;
		}
		$html .= '<h4 style="margin-top:16px;">' . esc_html( ucwords( str_replace( '_', ' ', $group_key ) ) ) . ' (' . count( $rows ) . ')</h4>';
		$html .= '<ul>';
		foreach ( array_slice( $rows, 0, 10 ) as $row ) {
			$html .= '<li>' . esc_html( $row['source_filename'] . ' — ' . DTB_Schematic_Asset_Disposition::label( $row['disposition'] ) . ( ! empty( $row['notes'] ) ? ' (' . $row['notes'][0] . ')' : '' ) ) . '</li>';
		}
		$html .= '</ul>';
	}
	$html .= '<p class="description">' . esc_html__( 'Hotspot, product, API, and frontend drift are not produced by this scan — hotspot/product drift is visible on Hotspot Data / Product Relationships; API/frontend drift (best-effort, pending the Phase 7 React rebuild) is on Publication & Frontend.', 'drywall-toolbox' ) . '</p>';

	return $html;
}

function dtb_schematics_suite_render_scoped_operations(): string {
	$ops = [
		[ 'label' => __( 'Scan Source', 'drywall-toolbox' ), 'desc' => __( 'Parse the canonical source manifest only (no WordPress writes).', 'drywall-toolbox' ), 'commit' => false ],
		[ 'label' => __( 'Compare Source to WordPress', 'drywall-toolbox' ), 'desc' => __( 'Dry-run comparison against attachments and domain records.', 'drywall-toolbox' ), 'commit' => false ],
		[ 'label' => __( 'Register Missing Attachments', 'drywall-toolbox' ), 'desc' => __( 'Commit run: creates WordPress attachments for uploads-present, unregistered binaries.', 'drywall-toolbox' ), 'commit' => true ],
		[ 'label' => __( 'Reconcile Schematic Records', 'drywall-toolbox' ), 'desc' => __( 'Commit run: attaches/updates domain record pages from resolved identity.', 'drywall-toolbox' ), 'commit' => true ],
		[ 'label' => __( 'Refresh Product Projections', 'drywall-toolbox' ), 'desc' => __( 'Refreshes linked-product projections for every record from Data/SkuSchematicMap.php.', 'drywall-toolbox' ), 'commit' => true ],
	];

	$html = '<div class="dtb-grid dtb-grid--two">';
	foreach ( $ops as $op ) {
		$form  = dtb_schematics_suite_action_form_open( 'reconcile_run' );
		$form .= '<input type="hidden" name="batch_size" value="100"><input type="hidden" name="resume" value="0">';
		if ( $op['commit'] ) {
			$form .= '<input type="hidden" name="commit" value="1">';
		}
		$form .= dtb_admin_ui_button( $op['label'], [ 'btn_type' => 'submit', 'size' => 'sm', 'type' => $op['commit'] ? 'primary' : 'secondary', 'confirm' => $op['commit'] ? __( 'This will write changes. Continue?', 'drywall-toolbox' ) : '' ] );
		$form .= dtb_schematics_suite_action_form_close();
		$html .= dtb_admin_ui_card( '<p class="description">' . esc_html( $op['desc'] ) . '</p>' . $form, [] );
	}
	$html .= '</div>';

	$html .= '<p class="description" style="margin-top:12px;">' . esc_html__( '"Rebuild Public Projection" and "Refresh Frontend Catalog State" are covered by Publication & Frontend\'s "Refresh Public Projection" action (bumps the shared catalog/cache version consumed by the public API). "Reconcile Selected Records" and bulk product refresh are on the Inventory screen, scoped to a checked selection. "Export Reconciliation Report" is the CSV export on Inventory / the JSON export on Hotspot Data.', 'drywall-toolbox' ) . '</p>';

	return $html;
}
