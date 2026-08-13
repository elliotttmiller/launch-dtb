<?php
/**
 * DTB Schematics Pipeline Suite — HotspotDataScreen.
 *
 * Manages, tracks, previews, replaces, and exports hotspot datasets. Never
 * authors/creates/drags/repositions hotspot coordinates — read-only overlay
 * preview only, per spec.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_schematics_suite_render_hotspots(): void {
	$focus_id = (int) ( $_GET['schematic_id'] ?? 0 ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	if ( $focus_id ) {
		dtb_schematics_suite_render_hotspot_focus( $focus_id );
		return;
	}

	$records = dtb_schematics_suite_all_records();
	$rows    = [];
	foreach ( $records as $record ) {
		if ( $record->lifecycle->is_retired() ) {
			continue;
		}
		$rows[] = $record;
	}

	if ( empty( $rows ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No active schematic records yet.', 'drywall-toolbox' ), __( 'Run Sync & Reconciliation to create records first.', 'drywall-toolbox' ) );
		return;
	}

	echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		[ 'label' => __( 'Schematic', 'drywall-toolbox' ) ], [ 'label' => __( 'Dataset Source', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Schema Version', 'drywall-toolbox' ) ], [ 'label' => __( 'Unique Parts', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Occurrences', 'drywall-toolbox' ) ], [ 'label' => __( 'Sync State', 'drywall-toolbox' ) ], [ 'label' => '' ],
	] );

	foreach ( $rows as $record ) {
		$dataset = function_exists( 'dtb_schematic_hotspot_dataset_repo_get' ) ? dtb_schematic_hotspot_dataset_repo_get( $record->id ) : null;
		$ref     = $record->hotspot_dataset['reference'] ?? '';

		$state_label = 'neutral';
		$state_text  = __( 'Not associated', 'drywall-toolbox' );
		if ( $dataset ) {
			$state_label = 'success';
			$state_text  = __( 'Migrated', 'drywall-toolbox' );
		} elseif ( '' !== $ref ) {
			$state_label = 'warning';
			$state_text  = __( 'Reference set, not migrated', 'drywall-toolbox' );
		}

		echo '<tr class="dtb-table__row">';
		echo '<td class="dtb-table__cell"><a href="' . esc_url( add_query_arg( [ 'view' => 'hotspots', 'schematic_id' => $record->id ], admin_url( 'admin.php?page=dtb-schematics' ) ) ) . '">' . esc_html( $record->canonical_id ) . '</a><div class="dtb-object-meta">' . esc_html( $record->title ) . '</div></td>';
		echo '<td class="dtb-table__cell">' . esc_html( $ref ?: '—' ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( (string) ( $dataset['schema_version'] ?? '—' ) ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( (string) count( $dataset['parts_catalog'] ?? [] ) ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( (string) count( $dataset['hotspots'] ?? [] ) ) . '</td>';
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_badge( $state_text, $state_label ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_button( __( 'Manage', 'drywall-toolbox' ), [ 'href' => add_query_arg( [ 'view' => 'hotspots', 'schematic_id' => $record->id ], admin_url( 'admin.php?page=dtb-schematics' ) ), 'size' => 'xs', 'type' => 'ghost' ] ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

function dtb_schematics_suite_render_hotspot_focus( int $schematic_id ): void {
	$record = dtb_schematic_record_repo_get( $schematic_id );
	if ( ! $record ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'Schematic not found.', 'drywall-toolbox' ) );
		return;
	}

	echo dtb_admin_ui_button( __( '← All Hotspot Data', 'drywall-toolbox' ), [ 'href' => admin_url( 'admin.php?page=dtb-schematics&view=hotspots' ), 'size' => 'sm', 'type' => 'ghost' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	$dataset = function_exists( 'dtb_schematic_hotspot_dataset_repo_get' ) ? dtb_schematic_hotspot_dataset_repo_get( $record->id ) : null;

	// Data-management actions (associate / replace reference — existence
	// pointer only; never coordinate authoring).
	$form  = dtb_schematics_suite_action_form_open( 'associate_hotspot_dataset' );
	$form .= '<input type="hidden" name="schematic_id" value="' . esc_attr( (string) $record->id ) . '">';
	$form .= dtb_admin_ui_field(
		dtb_admin_ui_input( 'reference', $record->hotspot_dataset['reference'] ?? '', [ 'placeholder' => 'frontend/public/brands/.../schematic_data.json' ] ),
		__( 'Dataset Reference', 'drywall-toolbox' ),
		[ 'hint' => __( 'Existence-check-only pointer to the source hotspot dataset file. Content migration into the normalized dataset happens separately via the hotspot migration batch.', 'drywall-toolbox' ) ]
	);
	$form .= dtb_admin_ui_button( __( 'Associate / Replace Reference', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'type' => 'primary', 'size' => 'sm' ] );
	$form .= dtb_schematics_suite_action_form_close();

	echo dtb_admin_ui_card( $form, [ 'title' => esc_html( $record->title ), 'subtitle' => __( 'Associate / Replace Dataset', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	if ( ! $dataset ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state(
			__( 'No migrated hotspot dataset for this schematic yet.', 'drywall-toolbox' ),
			__( 'Once a reference is associated, run the hotspot dataset migration (Application/MigrateSchematicHotspotDatasets.php) to normalize it into parts_catalog/hotspots.', 'drywall-toolbox' )
		);
		return;
	}

	// Summary.
	echo dtb_admin_ui_card( dtb_schematics_suite_render_hotspot_summary_for_record( $record ), [ 'title' => __( 'Dataset Summary', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// Read-only preview with per-page hotspot overlay (simple img + absolutely
	// positioned overlay divs — no canvas/drag editor, no coordinate authoring).
	echo dtb_admin_ui_card( dtb_schematics_suite_render_hotspot_preview( $record, $dataset ), [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'title'    => __( 'Read-Only Diagram Preview', 'drywall-toolbox' ),
		'subtitle' => __( 'Hover a marker for its resolved part. Zoom/pan via the browser image viewer; page switching below.', 'drywall-toolbox' ),
	] );

	// Unresolved parts.
	$unresolved = array_filter( $record->parts, fn( $p ) => DTB_SCHEMATIC_PART_STATE_UNRESOLVED === $p['resolution_state'] );
	if ( ! empty( $unresolved ) ) {
		$list = '<ul>';
		foreach ( $unresolved as $p ) {
			$list .= '<li>' . esc_html( $p['part_ref'] . ' — ' . ( $p['title'] ?: $p['mpn'] ?: $p['sku'] ) ) . '</li>';
		}
		$list .= '</ul>';
		echo dtb_admin_ui_card( $list, [ 'title' => __( 'Unresolved Parts', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	// Export.
	echo dtb_admin_ui_button( __( 'Export Canonical Dataset (JSON)', 'drywall-toolbox' ), [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'href' => wp_nonce_url( add_query_arg( [ 'dtb_export_hotspots' => $record->id ], admin_url( 'admin.php?page=dtb-schematics&view=hotspots&schematic_id=' . $record->id ) ), 'dtb_schematics_export' ),
		'size' => 'sm', 'icon' => 'dashicons-download',
	] );

	if ( isset( $_GET['dtb_export_hotspots'] ) && wp_verify_nonce( $_GET['_wpnonce'] ?? '', 'dtb_schematics_export' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		nocache_headers();
		header( 'Content-Type: application/json' );
		header( 'Content-Disposition: attachment; filename="' . sanitize_file_name( $record->canonical_id ) . '-hotspots.json"' );
		echo wp_json_encode( $dataset, JSON_PRETTY_PRINT ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		exit;
	}
}

function dtb_schematics_suite_render_hotspot_preview( DTB_Schematic_Record_Entity $record, array $dataset ): string {
	if ( empty( $record->pages ) ) {
		return dtb_admin_ui_empty_state( __( 'No pages to preview.', 'drywall-toolbox' ) );
	}

	$html = '<div style="display:flex;gap:16px;flex-wrap:wrap;">';
	foreach ( $record->pages as $page ) {
		if ( ! dtb_schematic_page_is_attached( $page ) ) {
			continue;
		}
		$described = dtb_schematic_attachment_repo_describe( (int) $page['attachment_id'] );
		if ( ! $described || '' === $described['url'] ) {
			continue;
		}

		$occurrences = function_exists( 'dtb_schematic_hotspot_dataset_occurrences_for_page' )
			? dtb_schematic_hotspot_dataset_occurrences_for_page( $dataset, (int) $page['page_number'] )
			: [];
		$parts = $dataset['parts_catalog'] ?? [];

		$html .= '<div style="position:relative;display:inline-block;border:1px solid var(--dtb-border,#ddd);border-radius:6px;overflow:hidden;">';
		$html .= '<img src="' . esc_url( $described['url'] ) . '" loading="lazy" style="display:block;max-width:320px;height:auto;" alt="">';
		foreach ( $occurrences as $occ ) {
			if ( ! dtb_schematic_hotspot_occurrence_has_valid_coordinates( $occ ) ) {
				continue;
			}
			$x = (float) ( $occ['coordinates']['x_pct'] ?? 0 );
			$y = (float) ( $occ['coordinates']['y_pct'] ?? 0 );
			$title = esc_attr( $parts[ $occ['part_ref'] ]['title'] ?? $occ['part_ref'] );
			$html .= sprintf(
				'<span title="%s" style="position:absolute;left:%s%%;top:%s%%;width:10px;height:10px;margin:-5px;border-radius:50%%;background:var(--dtb-accent,#2271b1);border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3);"></span>',
				$title,
				esc_attr( (string) $x ),
				esc_attr( (string) $y )
			);
		}
		$html .= '<div style="padding:4px 6px;font-size:11px;color:var(--dtb-muted,#666);">' . esc_html( $page['label'] . ' — ' . count( $occurrences ) . ' hotspots' ) . '</div>';
		$html .= '</div>';
	}
	$html .= '</div>';
	return $html;
}
