<?php
/**
 * DTB Schematics Pipeline Suite — PublicationScreen.
 *
 * Lifecycle + publication/frontend-synchronization view. Publish/retire
 * always call Application/ManageSchematicRecord.php — never postmeta
 * directly. Frontend drift detection here is a best-effort, repository-only
 * comparison: it scans the two remaining presentation-only frontend data
 * files that legitimately still reference schematic IDs for unrelated
 * features (frontend/src/data/schematicMappings.js and
 * data/productSchematicLinks.generated.js — see docs/architecture/
 * schematics-platform.md) against published domain records. It is not a
 * live frontend-state comparison and cannot run outside a repository
 * checkout (no live WP DB exists in this project).
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_schematics_suite_render_publication(): void {
	$records = dtb_schematics_suite_all_records();

	$groups = [
		DTB_Schematic_Lifecycle_Status::DRAFT      => [],
		DTB_Schematic_Lifecycle_Status::INCOMPLETE => [],
		DTB_Schematic_Lifecycle_Status::READY      => [],
		DTB_Schematic_Lifecycle_Status::PUBLISHED  => [],
		DTB_Schematic_Lifecycle_Status::RETIRED    => [],
	];
	foreach ( $records as $record ) {
		$groups[ $record->lifecycle->value() ][] = $record;
	}

	// KPI row.
	$kpis = [];
	foreach ( $groups as $key => $items ) {
		$kpis[] = [ 'value' => count( $items ), 'label' => DTB_Schematic_Lifecycle_Status::labels()[ $key ], 'icon' => 'dashicons-flag', 'icon_color' => dtb_schematics_suite_lifecycle_badge_type( $key ) ];
	}
	echo dtb_admin_ui_kpi_grid( $kpis ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// Frontend drift — best-effort, repository-only comparison against the
	// remaining presentation-only frontend data files (see file header).
	echo dtb_admin_ui_card( dtb_schematics_suite_render_frontend_drift( $records ), [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'title'    => __( 'Frontend Drift (best-effort)', 'drywall-toolbox' ),
		'subtitle' => __( 'Compares published backend records against schematic-ID references still present in frontend/src data files. Repository-only; not a live frontend-state comparison.', 'drywall-toolbox' ),
	] );

	if ( empty( $records ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No schematic records yet.', 'drywall-toolbox' ) );
		return;
	}

	echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		[ 'label' => __( 'Schematic', 'drywall-toolbox' ) ], [ 'label' => __( 'Lifecycle', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Publication v', 'drywall-toolbox' ) ], [ 'label' => __( 'In Public API', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Actions', 'drywall-toolbox' ) ],
	] );

	foreach ( array_slice( $records, 0, 200 ) as $record ) {
		$eligible = empty( dtb_schematic_publication_requirements( $record->to_array() ) );
		echo '<tr class="dtb-table__row">';
		echo '<td class="dtb-table__cell"><a href="' . esc_url( dtb_schematics_suite_detail_url( $record->id ) ) . '">' . esc_html( $record->canonical_id ) . '</a><div class="dtb-object-meta">' . esc_html( $record->title ) . '</div></td>';
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_badge( $record->lifecycle->label(), dtb_schematics_suite_lifecycle_badge_type( $record->lifecycle->value() ) ) . ( ! $eligible && ! $record->lifecycle->is_published() && ! $record->lifecycle->is_retired() ? ' ' . dtb_admin_ui_badge( __( 'Not eligible', 'drywall-toolbox' ), 'warning' ) : '' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . (int) $record->publication_version . '</td>';
		echo '<td class="dtb-table__cell">' . ( $record->lifecycle->is_published() ? dtb_admin_ui_badge( __( 'Yes', 'drywall-toolbox' ), 'success' ) : dtb_admin_ui_badge( __( 'No', 'drywall-toolbox' ), 'neutral' ) ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell"><div class="dtb-table__actions">';

		echo dtb_admin_ui_button( __( 'Preview Draft', 'drywall-toolbox' ), [ 'href' => dtb_schematics_suite_detail_url( $record->id ), 'size' => 'xs', 'type' => 'ghost' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		if ( DTB_Schematic_Lifecycle_Status::can_transition( $record->lifecycle->value(), DTB_Schematic_Lifecycle_Status::PUBLISHED ) && $eligible ) {
			echo dtb_schematics_suite_action_form_open( 'publish' ) . '<input type="hidden" name="schematic_id" value="' . esc_attr( (string) $record->id ) . '">' . dtb_admin_ui_button( __( 'Publish', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'size' => 'xs', 'type' => 'primary' ] ) . dtb_schematics_suite_action_form_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
		if ( $record->lifecycle->is_published() ) {
			echo dtb_schematics_suite_action_form_open( 'update_published_projection' ) . '<input type="hidden" name="schematic_id" value="' . esc_attr( (string) $record->id ) . '">' . dtb_admin_ui_button( __( 'Refresh Projection', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'size' => 'xs' ] ) . dtb_schematics_suite_action_form_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo dtb_admin_ui_button( __( 'Open Storefront', 'drywall-toolbox' ), [ 'href' => home_url( '/schematics/' . rawurlencode( $record->canonical_id ) ), 'size' => 'xs', 'type' => 'ghost' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo dtb_admin_ui_button( __( 'View API Record', 'drywall-toolbox' ), [ 'href' => rest_url( 'dtb/v1/schematics/' . rawurlencode( $record->canonical_id ) ), 'size' => 'xs', 'type' => 'ghost' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
		if ( DTB_Schematic_Lifecycle_Status::can_transition( $record->lifecycle->value(), DTB_Schematic_Lifecycle_Status::RETIRED ) ) {
			echo dtb_schematics_suite_action_form_open( 'retire' ) . '<input type="hidden" name="schematic_id" value="' . esc_attr( (string) $record->id ) . '">' . dtb_admin_ui_button( __( 'Retire', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'size' => 'xs', 'type' => 'danger', 'confirm' => __( 'Retire this schematic?', 'drywall-toolbox' ) ] ) . dtb_schematics_suite_action_form_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
		echo '</div></td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

/**
 * Best-effort frontend drift: compares published canonical IDs against IDs
 * referenced by the remaining presentation-only frontend data files (see
 * dtb_schematics_suite_scan_legacy_frontend_ids()). Explicitly not a live
 * frontend-state comparison — see file header.
 */
function dtb_schematics_suite_render_frontend_drift( array $records ): string {
	$published_ids = array_map( fn( $r ) => $r->canonical_id, array_filter( $records, fn( $r ) => $r->lifecycle->is_published() ) );

	$frontend_ids = dtb_schematics_suite_scan_legacy_frontend_ids();
	if ( null === $frontend_ids ) {
		return dtb_admin_ui_alert( __( 'Legacy frontend registry files were not found on this runtime — frontend drift cannot be computed from here. This is expected on a deployed host without the repository checkout.', 'drywall-toolbox' ), 'info' );
	}

	$missing_from_frontend = array_values( array_diff( $published_ids, $frontend_ids ) );
	$missing_from_backend  = array_values( array_diff( $frontend_ids, $published_ids ) );

	$grid  = '<div class="dtb-grid dtb-grid--two">';
	$grid .= dtb_admin_ui_stat_card( __( 'Published, not in legacy frontend registry', 'drywall-toolbox' ), (string) count( $missing_from_frontend ), '', count( $missing_from_frontend ) ? 'warning' : '' );
	$grid .= dtb_admin_ui_stat_card( __( 'In legacy frontend registry, not published', 'drywall-toolbox' ), (string) count( $missing_from_backend ), '', count( $missing_from_backend ) ? 'warning' : '' );
	$grid .= '</div>';

	if ( ! empty( $missing_from_backend ) ) {
		$grid .= '<p class="description" style="margin-top:8px;">' . esc_html__( 'IDs referenced by the legacy frontend but absent from published backend records:', 'drywall-toolbox' ) . ' ' . esc_html( implode( ', ', array_slice( $missing_from_backend, 0, 20 ) ) ) . '</p>';
	}

	return $grid;
}

/**
 * Bounded scan of frontend/src for hardcoded schematic ID string literals in
 * the known legacy registry files, if present. Returns null (not an empty
 * array) when no such files are found, so callers can distinguish
 * "compared and found none" from "could not compare".
 *
 * @return string[]|null
 */
function dtb_schematics_suite_scan_legacy_frontend_ids(): ?array {
	if ( ! defined( 'ABSPATH' ) ) {
		return null;
	}
	$repo_root = dirname( dirname( untrailingslashit( ABSPATH ) ) );
	$candidates = [
		$repo_root . '/frontend/src/data/schematicMappings.js',
		$repo_root . '/frontend/src/data/productSchematicLinks.generated.js',
	];

	$ids = [];
	$found_any_file = false;
	foreach ( $candidates as $path ) {
		if ( ! is_file( $path ) ) {
			continue;
		}
		$found_any_file = true;
		$contents = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_file_get_contents
		if ( false === $contents ) {
			continue;
		}
		// Bounded, best-effort extraction: quoted string keys/values that look
		// like slug-style schematic IDs (kebab-case, at least one hyphen).
		if ( preg_match_all( '/["\']([a-z0-9]+(?:-[a-z0-9]+){2,})["\']/', $contents, $matches ) ) {
			$ids = array_merge( $ids, $matches[1] );
		}
	}

	if ( ! $found_any_file ) {
		return null;
	}

	return array_values( array_unique( $ids ) );
}
