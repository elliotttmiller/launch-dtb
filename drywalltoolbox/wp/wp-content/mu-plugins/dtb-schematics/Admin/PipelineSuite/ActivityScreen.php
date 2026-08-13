<?php
/**
 * DTB Schematics Pipeline Suite — ActivityScreen.
 *
 * Bounded/paginated operation history from Application/RecordSchematicActivity.php.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_schematics_suite_render_activity(): void {
	$type    = sanitize_key( $_GET['type'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$result  = sanitize_key( $_GET['result'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$paged   = max( 1, (int) ( $_GET['paged'] ?? 1 ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$base    = admin_url( 'admin.php?page=dtb-schematics&view=activity' );

	echo '<form method="get" action="' . esc_url( admin_url( 'admin.php' ) ) . '" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:end;">';
	echo '<input type="hidden" name="page" value="dtb-schematics"><input type="hidden" name="view" value="activity">';
	echo dtb_admin_ui_field( dtb_admin_ui_select( 'type', array_merge( [ '' => __( 'All types', 'drywall-toolbox' ) ], array_combine( DTB_SCHEMATIC_ACTIVITY_TYPES, array_map( fn( $t ) => ucwords( str_replace( '_', ' ', $t ) ), DTB_SCHEMATIC_ACTIVITY_TYPES ) ) ), $type ), __( 'Type', 'drywall-toolbox' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_field( dtb_admin_ui_select( 'result', [ '' => __( 'All results', 'drywall-toolbox' ), 'ok' => __( 'OK', 'drywall-toolbox' ), 'partial' => __( 'Partial', 'drywall-toolbox' ), 'error' => __( 'Error', 'drywall-toolbox' ) ], $result ), __( 'Result', 'drywall-toolbox' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Filter', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'size' => 'sm' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '</form>';

	$result_set = dtb_schematic_activity_query( [
		'type'     => $type,
		'result'   => $result,
		'page'     => $paged,
		'per_page' => 25,
	] );

	if ( empty( $result_set['items'] ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state(
			__( 'No operations recorded yet for this filter.', 'drywall-toolbox' ),
			__( 'Operations run through this Suite (reconciliation, publish, retire, product refresh, hotspot association) are logged here. CLI-triggered runs are not yet captured — see the Phase 6 handoff notes.', 'drywall-toolbox' )
		);
		return;
	}

	echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		[ 'label' => __( 'Type', 'drywall-toolbox' ) ], [ 'label' => __( 'Operator', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Schematic', 'drywall-toolbox' ) ], [ 'label' => __( 'Result', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Examined / Changed / Skipped / Unresolved', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Catalog v', 'drywall-toolbox' ) ], [ 'label' => __( 'Summary', 'drywall-toolbox' ) ], [ 'label' => __( 'When', 'drywall-toolbox' ) ],
	] );

	foreach ( $result_set['items'] as $row ) {
		$badge_type = 'error' === $row['result'] ? 'danger' : ( 'partial' === $row['result'] ? 'warning' : 'success' );
		echo '<tr class="dtb-table__row">';
		echo '<td class="dtb-table__cell">' . esc_html( ucwords( str_replace( '_', ' ', $row['operation_type'] ) ) ) . ( $row['dry_run'] ? ' <span class="description">(' . esc_html__( 'dry-run', 'drywall-toolbox' ) . ')</span>' : '' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . esc_html( $row['operator_name'] ) . '</td>';
		echo '<td class="dtb-table__cell">' . ( $row['schematic_id'] ? '<a href="' . esc_url( dtb_schematics_suite_detail_url( $row['schematic_id'] ) ) . '">' . esc_html( $row['schematic_canonical_id'] ?: ( '#' . $row['schematic_id'] ) ) . '</a>' : '<span class="dtb-table__cell--muted">—</span>' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_badge( ucfirst( $row['result'] ), $badge_type ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . esc_html( sprintf( '%d / %d / %d / %d', $row['examined'], $row['changed'], $row['skipped'], $row['unresolved'] ) ) . '</td>';
		echo '<td class="dtb-table__cell">' . ( $row['catalog_version'] ? (int) $row['catalog_version'] : '—' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell"><span class="description">' . esc_html( wp_trim_words( $row['summary'], 20 ) ) . '</span></td>';
		echo '<td class="dtb-table__cell">' . esc_html( human_time_diff( strtotime( $row['completed_at'] ) ) . ' ago' ) . '</td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_pagination( $paged, $result_set['pages'], add_query_arg( [ 'type' => $type, 'result' => $result ], $base ) );
}
