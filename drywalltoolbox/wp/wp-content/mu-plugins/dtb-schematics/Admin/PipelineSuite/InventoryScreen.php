<?php
/**
 * DTB Schematics Pipeline Suite — InventoryScreen.
 *
 * Full authoritative-record table with search, filters, saved views, and
 * bounded bulk operations. All bulk operations run in a single admin-post.php
 * request over the selected/scoped record set (never a per-row fetch loop) —
 * see Admin/PipelineSuite/SuiteActions.php.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_SCHEMATICS_SUITE_SAVED_VIEWS = [
	''                       => 'All',
	'ready_to_publish'       => 'Ready to Publish',
	'published'              => 'Published',
	'incomplete'             => 'Incomplete',
	'missing_pages'          => 'Missing Pages',
	'missing_hotspot_data'   => 'Missing Hotspot Data',
	'unresolved_products'    => 'Unresolved Products',
	'retired'                => 'Retired',
];

function dtb_schematics_suite_render_inventory(): void {
	$base_url   = admin_url( 'admin.php?page=dtb-schematics&view=inventory' );
	$search     = sanitize_text_field( wp_unslash( $_GET['s'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$saved_view = sanitize_key( $_GET['saved_view'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$paged      = max( 1, (int) ( $_GET['paged'] ?? 1 ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	// All records (bounded — see SuiteMetrics.php), then apply saved-view /
	// search filtering in-memory. The domain corpus size documented for this
	// module (~100-150 canonical schematics) makes this safe; if the corpus
	// grows materially, the saved-view predicates below should move into
	// dtb_schematic_record_repo_query()'s meta_query instead.
	$all = dtb_schematics_suite_all_records();

	$filtered = array_values( array_filter( $all, function ( $record ) use ( $saved_view, $search ) {
		$state = dtb_schematics_suite_record_pipeline_state( $record );

		if ( '' !== $search ) {
			$haystack = strtolower( implode( ' ', [
				$record->canonical_id, $record->title, $record->model,
				implode( ' ', $record->aliases ),
			] ) );
			if ( false === strpos( $haystack, strtolower( $search ) ) ) {
				return false;
			}
		}

		switch ( $saved_view ) {
			case 'ready_to_publish':
				return DTB_Schematic_Lifecycle_Status::READY === $record->lifecycle->value() && $state['publication_eligible'];
			case 'published':
				return $record->lifecycle->is_published();
			case 'incomplete':
				return DTB_Schematic_Lifecycle_Status::INCOMPLETE === $record->lifecycle->value();
			case 'missing_pages':
				return $state['missing_pages'] > 0;
			case 'missing_hotspot_data':
				return ! $state['has_hotspot_ref'];
			case 'unresolved_products':
				return $state['unresolved_parts'] > 0;
			case 'retired':
				return $record->lifecycle->is_retired();
			default:
				return true;
		}
	} ) );

	$total       = count( $filtered );
	$per_page    = 20;
	$total_pages = max( 1, (int) ceil( $total / $per_page ) );
	$page_items  = array_slice( $filtered, ( $paged - 1 ) * $per_page, $per_page );

	// Saved-view chips (plain navigation links — Inventory does not use the
	// live-region JS layer, so real <a> hrefs are used rather than
	// dtb_admin_ui_filter_chip()'s data-dtb-live-filter binding).
	echo '<div class="dtb-filter-chip-row" style="margin-bottom:12px;display:flex;gap:6px;flex-wrap:wrap;">';
	foreach ( DTB_SCHEMATICS_SUITE_SAVED_VIEWS as $key => $label ) {
		$count = '' === $key ? count( $all ) : count( array_filter( $all, function ( $r ) use ( $key ) {
			$s = dtb_schematics_suite_record_pipeline_state( $r );
			switch ( $key ) {
				case 'ready_to_publish': return DTB_Schematic_Lifecycle_Status::READY === $r->lifecycle->value() && $s['publication_eligible'];
				case 'published': return $r->lifecycle->is_published();
				case 'incomplete': return DTB_Schematic_Lifecycle_Status::INCOMPLETE === $r->lifecycle->value();
				case 'missing_pages': return $s['missing_pages'] > 0;
				case 'missing_hotspot_data': return ! $s['has_hotspot_ref'];
				case 'unresolved_products': return $s['unresolved_parts'] > 0;
				case 'retired': return $r->lifecycle->is_retired();
				default: return false;
			}
		} ) );
		$url    = add_query_arg( [ 'saved_view' => $key, 's' => $search ], $base_url );
		$active = $saved_view === $key ? ' is-active' : '';
		printf(
			'<a href="%s" class="dtb-filter-chip%s">%s (%d)</a>',
			esc_url( $url ),
			esc_attr( $active ),
			esc_html( $label ),
			(int) $count
		);
	}
	echo '</div>';

	// Toolbar: search + saved-view links (plain <a> — no live-region JS dependency here).
	echo dtb_admin_ui_toolbar_open(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '<form method="get" action="' . esc_url( admin_url( 'admin.php' ) ) . '" style="display:flex;gap:8px;align-items:center;">';
	echo '<input type="hidden" name="page" value="dtb-schematics"><input type="hidden" name="view" value="inventory">';
	if ( $saved_view ) {
		echo '<input type="hidden" name="saved_view" value="' . esc_attr( $saved_view ) . '">';
	}
	echo dtb_admin_ui_input( 's', $search, [ 'placeholder' => __( 'Search canonical ID, title, alias, model…', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Search', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'size' => 'sm' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '</form>';
	echo dtb_admin_ui_toolbar_spacer(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Export CSV', 'drywall-toolbox' ), [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'href' => wp_nonce_url( admin_url( 'admin.php?page=dtb-schematics&view=inventory&dtb_export=csv&saved_view=' . $saved_view . '&s=' . rawurlencode( $search ) ), 'dtb_schematics_export' ),
		'size' => 'sm', 'type' => 'secondary', 'icon' => 'dashicons-download',
	] );
	echo dtb_admin_ui_toolbar_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	if ( isset( $_GET['dtb_export'] ) && wp_verify_nonce( $_GET['_wpnonce'] ?? '', 'dtb_schematics_export' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		dtb_schematics_suite_export_inventory_csv( $filtered );
		return;
	}

	if ( empty( $all ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state(
			__( 'No schematic records exist yet.', 'drywall-toolbox' ),
			__( 'Run Sync & Reconciliation to discover source assets and create records.', 'drywall-toolbox' ),
			[ 'action_html' => dtb_admin_ui_button( __( 'Go to Sync & Reconciliation', 'drywall-toolbox' ), [ 'href' => admin_url( 'admin.php?page=dtb-schematics&view=reconciliation' ), 'type' => 'primary' ] ) ]
		);
		return;
	}

	if ( empty( $page_items ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No schematics match this filter.', 'drywall-toolbox' ), __( 'Try a different saved view or clear the search term.', 'drywall-toolbox' ) );
		return;
	}

	// Bulk operations form wraps the table.
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	echo wp_nonce_field( dtb_schematics_suite_nonce_action(), 'dtb_schematics_nonce', true, false );
	echo '<input type="hidden" name="action" value="dtb_schematics_suite_action">';

	echo '<div class="dtb-toolbar" style="margin-bottom:8px;">';
	echo '<select name="sub_action" class="dtb-select">';
	echo '<option value="bulk_publish_eligible">' . esc_html__( 'Publish eligible records', 'drywall-toolbox' ) . '</option>';
	echo '<option value="bulk_retire">' . esc_html__( 'Retire selected', 'drywall-toolbox' ) . '</option>';
	echo '<option value="bulk_refresh_products">' . esc_html__( 'Refresh product projections (selected)', 'drywall-toolbox' ) . '</option>';
	echo '</select> ';
	echo dtb_admin_ui_button( __( 'Run Bulk Operation', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'type' => 'primary', 'size' => 'sm', 'confirm' => __( 'Run this bulk operation over the selected/eligible records?', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '<span class="description"> ' . esc_html__( '"Publish eligible" scopes to all non-retired records meeting publication requirements. "Retire" and "Refresh product projections" scope to checked rows.', 'drywall-toolbox' ) . '</span>';
	echo '</div>';

	echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		[ 'label' => '', 'class' => 'dtb-table__select-col' ],
		[ 'label' => __( 'Preview', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Canonical ID / Title', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Brand / Category', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Lifecycle', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Pages', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Hotspots', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Products', 'drywall-toolbox' ) ],
		[ 'label' => __( 'API', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Updated', 'drywall-toolbox' ) ],
		[ 'label' => '' ],
	] );

	foreach ( $page_items as $record ) {
		$state   = dtb_schematics_suite_record_pipeline_state( $record );
		$preview = dtb_schematic_resolve_preview( $record );
		$detail  = dtb_schematics_suite_detail_url( $record->id );

		echo '<tr class="dtb-table__row">';
		echo '<td class="dtb-table__cell"><input type="checkbox" name="schematic_ids[]" value="' . esc_attr( (string) $record->id ) . '"></td>';
		echo '<td class="dtb-table__cell">';
		if ( '' !== $preview['url'] ) {
			echo '<img src="' . esc_url( $preview['url'] ) . '" loading="lazy" width="40" height="40" style="object-fit:cover;border-radius:4px;" alt="">';
		} else {
			echo '<span class="dtb-table__cell--muted">—</span>';
		}
		echo '</td>';
		echo '<td class="dtb-table__cell"><a href="' . esc_url( $detail ) . '"><strong>' . esc_html( $record->canonical_id ) . '</strong></a><div class="dtb-object-meta">' . esc_html( $record->title ) . '</div></td>';
		echo '<td class="dtb-table__cell">' . esc_html( $record->brand_name ?: $record->brand_id ) . '<div class="dtb-object-meta">' . esc_html( $record->category_name ?: $record->category_id ) . '</div></td>';
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_badge( $record->lifecycle->label(), dtb_schematics_suite_lifecycle_badge_type( $record->lifecycle->value() ) ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . esc_html( $state['attached_pages'] . '/' . $state['page_count'] ) . ( $state['missing_pages'] > 0 ? ' ' . dtb_admin_ui_badge( '!', 'warning' ) : '' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . ( $state['has_hotspot_ref'] ? dtb_admin_ui_badge( __( 'Linked', 'drywall-toolbox' ), 'success' ) : dtb_admin_ui_badge( __( 'Missing', 'drywall-toolbox' ), 'warning' ) ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . esc_html( $state['resolved_parts'] . '/' . $state['part_count'] ) . ( $state['unresolved_parts'] > 0 ? ' ' . dtb_admin_ui_badge( (string) $state['unresolved_parts'], 'warning' ) : '' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . ( $record->lifecycle->is_published() ? dtb_admin_ui_badge( __( 'Published', 'drywall-toolbox' ), 'success' ) : dtb_admin_ui_badge( __( 'Not published', 'drywall-toolbox' ), 'neutral' ) ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . esc_html( human_time_diff( strtotime( $record->updated_at ) ) . ' ago' ) . '</td>';
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_button( __( 'View', 'drywall-toolbox' ), [ 'href' => $detail, 'size' => 'xs', 'type' => 'ghost' ] ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</tr>';
	}

	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '</form>';

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_pagination( $paged, $total_pages, add_query_arg( [ 'saved_view' => $saved_view, 's' => $search ], $base_url ) );
}

/**
 * Stream a bounded CSV export of the filtered record set (spec: "export
 * selected records" bulk operation, implemented here as "export filtered
 * view" since Inventory rows aren't individually selectable for export
 * without JS — checkboxes remain reserved for the destructive bulk actions).
 */
function dtb_schematics_suite_export_inventory_csv( array $records ): void {
	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="dtb-schematics-inventory-' . gmdate( 'Ymd-His' ) . '.csv"' );

	$out = fopen( 'php://output', 'w' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fopen
	fputcsv( $out, [ 'canonical_id', 'title', 'brand', 'category', 'lifecycle', 'pages', 'attached_pages', 'hotspot_dataset', 'resolved_parts', 'part_count', 'publication_version', 'updated_at' ] );

	foreach ( $records as $record ) {
		$state = dtb_schematics_suite_record_pipeline_state( $record );
		fputcsv( $out, [
			$record->canonical_id,
			$record->title,
			$record->brand_name ?: $record->brand_id,
			$record->category_name ?: $record->category_id,
			$record->lifecycle->value(),
			$state['page_count'],
			$state['attached_pages'],
			$state['has_hotspot_ref'] ? 'linked' : 'missing',
			$state['resolved_parts'],
			$state['part_count'],
			$record->publication_version,
			$record->updated_at,
		] );
	}
	fclose( $out ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fclose
	exit;
}
