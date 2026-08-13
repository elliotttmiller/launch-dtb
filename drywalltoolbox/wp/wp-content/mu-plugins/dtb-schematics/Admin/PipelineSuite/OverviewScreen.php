<?php
/**
 * DTB Schematics Pipeline Suite — OverviewScreen.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_schematics_suite_render_overview(): void {
	$m        = dtb_schematics_suite_overview_metrics();
	$base_url = admin_url( 'admin.php?page=dtb-schematics' );

	if ( ! $m['source_available'] ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_alert(
			sprintf(
				/* translators: %s: error code */
				__( 'Canonical source package is not reachable from this runtime (%s). Source-stage counts below are unavailable until the source package is present at the configured path — see Configuration Reference.', 'drywall-toolbox' ),
				$m['source_error']
			),
			'warning',
			__( 'Source package unavailable', 'drywall-toolbox' )
		);
	}

	if ( 0 === $m['canonical_records'] ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state(
			__( 'No schematic records exist yet.', 'drywall-toolbox' ),
			$m['source_available']
				? sprintf(
					/* translators: %d: source row count */
					__( '%d source rows were discovered in the canonical source package, but no WordPress attachments or domain records have been created yet. Run "Scan Source" and "Register Missing Attachments" from Sync & Reconciliation to begin.', 'drywall-toolbox' ),
					$m['source_row_count']
				)
				: __( 'No canonical source package was found either — nothing has been discovered yet. Confirm the source package location in Configuration Reference, then run Sync & Reconciliation.', 'drywall-toolbox' ),
			[
				'icon'        => 'dashicons-media-code',
				'action_html' => dtb_admin_ui_button( __( 'Go to Sync & Reconciliation', 'drywall-toolbox' ), [
					'href' => add_query_arg( 'view', 'reconciliation', $base_url ),
					'type' => 'primary',
				] ),
			]
		);
		return;
	}

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_kpi_grid( [
		[ 'value' => $m['canonical_records'], 'label' => __( 'Canonical Records', 'drywall-toolbox' ), 'icon' => 'dashicons-media-code', 'icon_color' => 'primary', 'href' => add_query_arg( 'view', 'inventory', $base_url ) ],
		[ 'value' => $m['published'], 'label' => __( 'Published', 'drywall-toolbox' ), 'icon' => 'dashicons-yes-alt', 'icon_color' => 'success', 'href' => add_query_arg( [ 'view' => 'inventory', 'saved_view' => 'published' ], $base_url ) ],
		[ 'value' => $m['storefront_visible'], 'label' => __( 'Storefront Visible', 'drywall-toolbox' ), 'icon' => 'dashicons-store', 'icon_color' => 'success', 'href' => add_query_arg( 'view', 'publication', $base_url ) ],
		[ 'value' => $m['source_row_count'], 'label' => __( 'Source Assets', 'drywall-toolbox' ), 'icon' => 'dashicons-media-archive', 'icon_color' => 'info', 'href' => add_query_arg( 'view', 'assets', $base_url ) ],
		[ 'value' => $m['attachments'], 'label' => __( 'WordPress Attachments', 'drywall-toolbox' ), 'icon' => 'dashicons-admin-media', 'icon_color' => 'info', 'href' => add_query_arg( 'view', 'assets', $base_url ) ],
		[ 'value' => $m['pages'], 'label' => __( 'Diagram Pages', 'drywall-toolbox' ), 'icon' => 'dashicons-images-alt2', 'icon_color' => 'neutral', 'href' => add_query_arg( 'view', 'inventory', $base_url ) ],
		[ 'value' => $m['missing_pages'], 'label' => __( 'Missing Pages', 'drywall-toolbox' ), 'icon' => 'dashicons-warning', 'icon_color' => $m['missing_pages'] > 0 ? 'warning' : 'neutral', 'href' => add_query_arg( [ 'view' => 'inventory', 'saved_view' => 'missing_pages' ], $base_url ) ],
		[ 'value' => $m['previews_explicit'] + $m['previews_first_page'], 'label' => __( 'Previews Available', 'drywall-toolbox' ), 'icon' => 'dashicons-format-image', 'icon_color' => 'success', 'href' => add_query_arg( 'view', 'inventory', $base_url ) ],
		[ 'value' => $m['previews_first_page'], 'label' => __( 'First-Page Fallback Previews', 'drywall-toolbox' ), 'icon' => 'dashicons-image-flip-horizontal', 'icon_color' => 'neutral', 'href' => add_query_arg( 'view', 'inventory', $base_url ) ],
		[ 'value' => $m['missing_hotspot_datasets'], 'label' => __( 'Missing Hotspot Datasets', 'drywall-toolbox' ), 'icon' => 'dashicons-editor-help', 'icon_color' => $m['missing_hotspot_datasets'] > 0 ? 'warning' : 'neutral', 'href' => add_query_arg( [ 'view' => 'inventory', 'saved_view' => 'missing_hotspot_data' ], $base_url ) ],
		[ 'value' => $m['unresolved_products'], 'label' => __( 'Unresolved Product Relationships', 'drywall-toolbox' ), 'icon' => 'dashicons-cart', 'icon_color' => $m['unresolved_products'] > 0 ? 'warning' : 'neutral', 'href' => add_query_arg( [ 'view' => 'inventory', 'saved_view' => 'unresolved_products' ], $base_url ) ],
		[ 'value' => $m['retired'], 'label' => __( 'Retired', 'drywall-toolbox' ), 'icon' => 'dashicons-trash', 'icon_color' => 'neutral', 'href' => add_query_arg( [ 'view' => 'inventory', 'saved_view' => 'retired' ], $base_url ) ],
	] );

	// Pipeline flow.
	echo dtb_admin_ui_card( dtb_schematics_suite_render_pipeline_flow( $m ), [
		'title'    => __( 'Pipeline Flow', 'drywall-toolbox' ),
		'subtitle' => __( 'Source → Attachments → Records → Pages → Hotspots → Products → API → Frontend', 'drywall-toolbox' ),
	] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// Recent operations feed.
	$recent = dtb_schematic_activity_query( [ 'per_page' => 10, 'page' => 1 ] );
	$items  = [];
	foreach ( $recent['items'] as $row ) {
		$items[] = [
			'time'  => human_time_diff( strtotime( $row['completed_at'] ) ) . ' ' . __( 'ago', 'drywall-toolbox' ),
			'title' => ucwords( str_replace( '_', ' ', $row['operation_type'] ) ),
			'desc'  => esc_html( $row['summary'] ),
			'badge' => 'error' === $row['result'] ? 'danger' : ( 'partial' === $row['result'] ? 'warning' : 'success' ),
		];
	}
	$feed_body = $items
		? dtb_admin_ui_timeline( $items )
		: dtb_admin_ui_empty_state( __( 'No recent operations recorded yet.', 'drywall-toolbox' ), __( 'Operations run from this Suite (reconciliation, publish, retire, product refresh) are logged here.', 'drywall-toolbox' ) );

	echo dtb_admin_ui_card( $feed_body, [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'title'       => __( 'Recent Operations', 'drywall-toolbox' ),
		'header_html' => dtb_admin_ui_button( __( 'View All Activity', 'drywall-toolbox' ), [ 'href' => add_query_arg( 'view', 'activity', $base_url ), 'size' => 'sm' ] ),
	] );
}

/**
 * Render the compact per-stage pipeline flow table.
 */
function dtb_schematics_suite_render_pipeline_flow( array $m ): string {
	$base_url = admin_url( 'admin.php?page=dtb-schematics' );

	$stages = [
		[
			'label'        => __( 'Source', 'drywall-toolbox' ),
			'synchronized' => $m['source_row_count'],
			'attention'    => 0,
			'missing'      => $m['source_available'] ? 0 : 1,
			'href'         => add_query_arg( 'view', 'assets', $base_url ),
		],
		[
			'label'        => __( 'Attachments', 'drywall-toolbox' ),
			'synchronized' => $m['attachments'],
			'attention'    => 0,
			'missing'      => max( 0, $m['source_row_count'] - $m['attachments'] ),
			'href'         => add_query_arg( 'view', 'assets', $base_url ),
		],
		[
			'label'        => __( 'Records', 'drywall-toolbox' ),
			'synchronized' => $m['canonical_records'] - $m['retired'],
			'attention'    => $m['incomplete'] + $m['draft'],
			'missing'      => 0,
			'href'         => add_query_arg( 'view', 'inventory', $base_url ),
		],
		[
			'label'        => __( 'Pages', 'drywall-toolbox' ),
			'synchronized' => $m['pages'] - $m['missing_pages'],
			'attention'    => 0,
			'missing'      => $m['missing_pages'],
			'href'         => add_query_arg( [ 'view' => 'inventory', 'saved_view' => 'missing_pages' ], $base_url ),
		],
		[
			'label'        => __( 'Hotspots', 'drywall-toolbox' ),
			'synchronized' => $m['canonical_records'] - $m['missing_hotspot_datasets'],
			'attention'    => 0,
			'missing'      => $m['missing_hotspot_datasets'],
			'href'         => add_query_arg( 'view', 'hotspots', $base_url ),
		],
		[
			'label'        => __( 'Products', 'drywall-toolbox' ),
			'synchronized' => $m['canonical_records'] - $m['unresolved_products'],
			'attention'    => $m['unresolved_products'],
			'missing'      => 0,
			'href'         => add_query_arg( 'view', 'products', $base_url ),
		],
		[
			'label'        => __( 'API', 'drywall-toolbox' ),
			'synchronized' => $m['published'],
			'attention'    => $m['ready_to_publish'],
			'missing'      => 0,
			'href'         => add_query_arg( 'view', 'publication', $base_url ),
		],
		[
			'label'        => __( 'Frontend', 'drywall-toolbox' ),
			'synchronized' => $m['storefront_visible'],
			'attention'    => 0,
			'missing'      => 0,
			'href'         => add_query_arg( 'view', 'publication', $base_url ),
		],
	];

	ob_start();
	echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		[ 'label' => __( 'Stage', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Synchronized', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Attention', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Missing', 'drywall-toolbox' ) ],
		[ 'label' => '' ],
	] );
	foreach ( $stages as $i => $stage ) {
		echo '<tr class="dtb-table__row">';
		echo '<td class="dtb-table__cell"><strong>' . ( $i + 1 ) . '. ' . esc_html( $stage['label'] ) . '</strong></td>';
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_badge( (string) $stage['synchronized'], 'success' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . ( $stage['attention'] > 0 ? dtb_admin_ui_badge( (string) $stage['attention'], 'warning' ) : '—' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . ( $stage['missing'] > 0 ? dtb_admin_ui_badge( (string) $stage['missing'], 'danger' ) : '—' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_button( __( 'View', 'drywall-toolbox' ), [ 'href' => $stage['href'], 'size' => 'xs', 'type' => 'ghost' ] ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	return ob_get_clean();
}
