<?php
/**
 * DTB Schematics Pipeline Suite — DetailScreen.
 *
 * Read-only-except-for-lifecycle-actions workspace for a single schematic:
 * summary, pipeline stage state, pages, hotspot data summary, product
 * relationships, a storefront-parity preview (reuses
 * Application/GenerateSchematicResponse.php directly — no second conversion
 * path), and a per-record activity log.
 *
 * No hotspot-coordinate editing surface exists here or anywhere in the
 * Suite — that is explicitly out of scope per the spec.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_schematics_suite_render_detail(): void {
	$id     = (int) ( $_GET['schematic_id'] ?? 0 ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$record = $id ? dtb_schematic_record_repo_get( $id ) : null;

	if ( ! $record ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'Schematic not found.', 'drywall-toolbox' ), __( 'It may have been deleted, or the link is stale.', 'drywall-toolbox' ), [
			'action_html' => dtb_admin_ui_button( __( 'Back to Inventory', 'drywall-toolbox' ), [ 'href' => admin_url( 'admin.php?page=dtb-schematics&view=inventory' ) ] ),
		] );
		return;
	}

	$state = dtb_schematics_suite_record_pipeline_state( $record );

	echo dtb_admin_ui_button( __( '← Back to Inventory', 'drywall-toolbox' ), [ 'href' => admin_url( 'admin.php?page=dtb-schematics&view=inventory' ), 'size' => 'sm', 'type' => 'ghost' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// SUMMARY
	$summary  = '<div class="dtb-grid dtb-grid--three">';
	$summary .= dtb_admin_ui_stat_card( __( 'Canonical ID', 'drywall-toolbox' ), $record->canonical_id );
	$summary .= dtb_admin_ui_stat_card( __( 'Lifecycle', 'drywall-toolbox' ), $record->lifecycle->label() );
	$summary .= dtb_admin_ui_stat_card( __( 'Brand / Category', 'drywall-toolbox' ), ( $record->brand_name ?: $record->brand_id ) . ' / ' . ( $record->category_name ?: $record->category_id ) );
	$summary .= dtb_admin_ui_stat_card( __( 'Source Version', 'drywall-toolbox' ), $record->source_version ?: '—' );
	$summary .= dtb_admin_ui_stat_card( __( 'Publication Version', 'drywall-toolbox' ), (string) $record->publication_version );
	$summary .= dtb_admin_ui_stat_card( __( 'Public API State', 'drywall-toolbox' ), $record->lifecycle->is_published() ? __( 'Published', 'drywall-toolbox' ) : __( 'Not in public catalog', 'drywall-toolbox' ) );
	$summary .= '</div>';

	$actions = '';
	$actions .= dtb_schematics_suite_action_form_open( 'publish' );
	$actions .= '<input type="hidden" name="schematic_id" value="' . esc_attr( (string) $record->id ) . '">';
	$actions .= dtb_admin_ui_button( __( 'Publish', 'drywall-toolbox' ), [
		'btn_type' => 'submit', 'type' => 'primary', 'size' => 'sm',
		'disabled' => ! DTB_Schematic_Lifecycle_Status::can_transition( $record->lifecycle->value(), DTB_Schematic_Lifecycle_Status::PUBLISHED ) || ! $state['publication_eligible'],
	] );
	$actions .= dtb_schematics_suite_action_form_close();

	$actions .= dtb_schematics_suite_action_form_open( 'retire' );
	$actions .= '<input type="hidden" name="schematic_id" value="' . esc_attr( (string) $record->id ) . '">';
	$actions .= dtb_admin_ui_button( __( 'Retire', 'drywall-toolbox' ), [
		'btn_type' => 'submit', 'type' => 'danger', 'size' => 'sm', 'confirm' => __( 'Retire this schematic? It will be removed from the public catalog.', 'drywall-toolbox' ),
		'disabled' => ! DTB_Schematic_Lifecycle_Status::can_transition( $record->lifecycle->value(), DTB_Schematic_Lifecycle_Status::RETIRED ),
	] );
	$actions .= dtb_schematics_suite_action_form_close();

	echo dtb_admin_ui_card( $summary, [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'title'       => esc_html( $record->title ),
		'subtitle'    => __( 'Summary', 'drywall-toolbox' ),
		'header_html' => $actions,
	] );

	if ( ! empty( $state['unmet_requirements'] ) ) {
		$labels = [
			'canonical_id_required' => __( 'Canonical ID missing', 'drywall-toolbox' ),
			'title_required'        => __( 'Title missing', 'drywall-toolbox' ),
			'brand_id_required'     => __( 'Brand ID missing', 'drywall-toolbox' ),
			'category_id_required'  => __( 'Category ID missing', 'drywall-toolbox' ),
			'attached_page_required'=> __( 'No page has an attached image yet', 'drywall-toolbox' ),
		];
		$msg = implode( '; ', array_map( fn( $k ) => $labels[ $k ] ?? $k, $state['unmet_requirements'] ) );
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_alert( $msg, 'warning', __( 'Not yet publication-eligible', 'drywall-toolbox' ) );
	}

	// PIPELINE
	echo dtb_admin_ui_card( dtb_schematics_suite_render_pipeline_flow_for_record( $record, $state ), [ 'title' => __( 'Pipeline State', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// PAGES
	echo dtb_admin_ui_card( dtb_schematics_suite_render_pages_table( $record ), [ 'title' => __( 'Pages', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// HOTSPOT DATA
	echo dtb_admin_ui_card( dtb_schematics_suite_render_hotspot_summary_for_record( $record ), [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'title'       => __( 'Hotspot Data', 'drywall-toolbox' ),
		'header_html' => dtb_admin_ui_button( __( 'Manage in Hotspot Data', 'drywall-toolbox' ), [ 'href' => add_query_arg( [ 'view' => 'hotspots', 'schematic_id' => $record->id ], admin_url( 'admin.php?page=dtb-schematics' ) ), 'size' => 'sm' ] ),
	] );

	// PRODUCT RELATIONSHIPS
	echo dtb_admin_ui_card( dtb_schematics_suite_render_parts_table( $record ), [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'title'       => __( 'Product Relationships', 'drywall-toolbox' ),
		'header_html' => dtb_admin_ui_button( __( 'Manage in Product Relationships', 'drywall-toolbox' ), [ 'href' => add_query_arg( [ 'view' => 'products', 'schematic_id' => $record->id ], admin_url( 'admin.php?page=dtb-schematics' ) ), 'size' => 'sm' ] ),
	] );

	// PREVIEW — consumes the same public detail-response builder the REST
	// controller uses (Application/GenerateSchematicResponse.php), so this
	// preview and the storefront agree on shape by construction.
	echo dtb_admin_ui_card( dtb_schematics_suite_render_storefront_preview( $record ), [ 'title' => __( 'Storefront Preview', 'drywall-toolbox' ), 'subtitle' => __( 'Rendered from the same detail-response shape the public API serves.', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// ACTIVITY
	$activity = dtb_schematic_activity_query( [ 'schematic_id' => $record->id, 'per_page' => 20 ] );
	$items = [];
	foreach ( $activity['items'] as $row ) {
		$items[] = [
			'time'  => human_time_diff( strtotime( $row['completed_at'] ) ) . ' ' . __( 'ago', 'drywall-toolbox' ),
			'title' => ucwords( str_replace( '_', ' ', $row['operation_type'] ) ),
			'desc'  => esc_html( $row['summary'] ),
			'badge' => 'error' === $row['result'] ? 'danger' : 'success',
		];
	}
	$activity_body = $items ? dtb_admin_ui_timeline( $items ) : dtb_admin_ui_empty_state( __( 'No Suite-recorded operations for this schematic yet.', 'drywall-toolbox' ) );
	echo dtb_admin_ui_card( $activity_body, [ 'title' => __( 'Activity', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

function dtb_schematics_suite_render_pipeline_flow_for_record( DTB_Schematic_Record_Entity $record, array $state ): string {
	ob_start();
	echo dtb_admin_ui_table_open( [ [ 'label' => __( 'Stage', 'drywall-toolbox' ) ], [ 'label' => __( 'State', 'drywall-toolbox' ) ] ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	$rows = [
		[ __( 'Source record', 'drywall-toolbox' ), ! empty( $record->source_provenance ) ? [ 'Linked', 'success' ] : [ 'No provenance recorded', 'neutral' ] ],
		[ __( 'Source files', 'drywall-toolbox' ), dtb_schematics_source_package_available() ? [ 'Package reachable', 'success' ] : [ 'Package unreachable', 'warning' ] ],
		[ __( 'WordPress attachments', 'drywall-toolbox' ), $state['attached_pages'] . '/' . $state['page_count'] === '0/0' ? [ 'No pages', 'neutral' ] : [ $state['attached_pages'] . '/' . $state['page_count'] . ' attached', $state['missing_pages'] > 0 ? 'warning' : 'success' ] ],
		[ __( 'Page relationships', 'drywall-toolbox' ), $state['missing_pages'] > 0 ? [ $state['missing_pages'] . ' missing', 'warning' ] : [ 'Complete', 'success' ] ],
		[ __( 'Hotspot datasets', 'drywall-toolbox' ), $state['has_hotspot_dataset'] ? [ 'Migrated dataset present', 'success' ] : ( $state['has_hotspot_ref'] ? [ 'Reference set, not yet migrated', 'warning' ] : [ 'Not associated', 'warning' ] ) ],
		[ __( 'Product projections', 'drywall-toolbox' ), $state['part_count'] > 0 ? [ $state['resolved_parts'] . '/' . $state['part_count'] . ' resolved', $state['unresolved_parts'] > 0 ? 'warning' : 'success' ] : [ 'No parts recorded', 'neutral' ] ],
		[ __( 'Public API', 'drywall-toolbox' ), $record->lifecycle->is_published() ? [ 'Published', 'success' ] : [ 'Not published', 'neutral' ] ],
		[ __( 'Frontend catalog', 'drywall-toolbox' ), $record->lifecycle->is_published() ? [ 'Should be storefront-visible (see Publication & Frontend)', 'success' ] : [ 'Not storefront-visible', 'neutral' ] ],
	];
	foreach ( $rows as [ $label, $state_pair ] ) {
		echo '<tr class="dtb-table__row"><td class="dtb-table__cell">' . esc_html( $label ) . '</td><td class="dtb-table__cell">' . dtb_admin_ui_badge( $state_pair[0], $state_pair[1] ) . '</td></tr>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	return ob_get_clean();
}

function dtb_schematics_suite_render_pages_table( DTB_Schematic_Record_Entity $record ): string {
	if ( empty( $record->pages ) ) {
		return dtb_admin_ui_empty_state( __( 'No pages defined yet.', 'drywall-toolbox' ) );
	}
	ob_start();
	echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		[ 'label' => '#' ], [ 'label' => __( 'Label', 'drywall-toolbox' ) ], [ 'label' => __( 'Thumbnail', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Attachment', 'drywall-toolbox' ) ], [ 'label' => __( 'Dimensions', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Media Type', 'drywall-toolbox' ) ], [ 'label' => __( 'State', 'drywall-toolbox' ) ],
	] );
	foreach ( $record->pages as $page ) {
		$attached = dtb_schematic_page_is_attached( $page );
		echo '<tr class="dtb-table__row">';
		echo '<td class="dtb-table__cell">' . esc_html( (string) $page['page_number'] ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( $page['label'] ) . '</td>';
		echo '<td class="dtb-table__cell">';
		if ( $attached ) {
			$described = dtb_schematic_attachment_repo_describe( (int) $page['attachment_id'] );
			if ( $described && $described['url'] ) {
				echo '<img src="' . esc_url( $described['url'] ) . '" loading="lazy" width="36" height="36" style="object-fit:cover;border-radius:4px;" alt="">';
			}
		} else {
			echo '<span class="dtb-table__cell--muted">—</span>';
		}
		echo '</td>';
		echo '<td class="dtb-table__cell">' . ( $page['attachment_id'] ? '#' . (int) $page['attachment_id'] : '—' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">' . esc_html( ( $page['width'] ?: '—' ) . ' × ' . ( $page['height'] ?: '—' ) ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( $page['media_type'] ?: '—' ) . '</td>';
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_badge( ucwords( str_replace( '_', ' ', $page['lifecycle_state'] ) ), $attached ? 'success' : 'warning' ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	return ob_get_clean();
}

function dtb_schematics_suite_render_hotspot_summary_for_record( DTB_Schematic_Record_Entity $record ): string {
	$dataset = function_exists( 'dtb_schematic_hotspot_dataset_repo_get' ) ? dtb_schematic_hotspot_dataset_repo_get( $record->id ) : null;

	if ( ! $dataset ) {
		return dtb_admin_ui_alert(
			'' !== $record->hotspot_dataset['reference']
				? sprintf( __( 'A dataset reference is associated ("%s") but has not been migrated into the normalized dataset yet. Run the hotspot dataset migration.', 'drywall-toolbox' ), $record->hotspot_dataset['reference'] )
				: __( 'No hotspot dataset is associated with this schematic yet.', 'drywall-toolbox' ),
			'warning'
		);
	}

	$occurrences = $dataset['hotspots'] ?? [];
	$parts       = $dataset['parts_catalog'] ?? [];
	$by_part     = [];
	foreach ( $occurrences as $occ ) {
		$by_part[ $occ['part_ref'] ] = 1 + ( $by_part[ $occ['part_ref'] ] ?? 0 );
	}
	$repeated = count( array_filter( $by_part, fn( $c ) => $c > 1 ) );
	$missing_refs = 0;
	foreach ( $occurrences as $occ ) {
		if ( ! isset( $parts[ $occ['part_ref'] ] ) ) {
			$missing_refs++;
		}
	}

	$grid  = '<div class="dtb-grid dtb-grid--four">';
	$grid .= dtb_admin_ui_stat_card( __( 'Schema Version', 'drywall-toolbox' ), (string) ( $dataset['schema_version'] ?? '—' ) );
	$grid .= dtb_admin_ui_stat_card( __( 'Checksum', 'drywall-toolbox' ), substr( (string) ( $dataset['checksum'] ?? '' ), 0, 12 ) ?: '—' );
	$grid .= dtb_admin_ui_stat_card( __( 'Unique Parts', 'drywall-toolbox' ), (string) count( $parts ) );
	$grid .= dtb_admin_ui_stat_card( __( 'Occurrences', 'drywall-toolbox' ), (string) count( $occurrences ) );
	$grid .= dtb_admin_ui_stat_card( __( 'Repeated Occurrences', 'drywall-toolbox' ), (string) $repeated );
	$grid .= dtb_admin_ui_stat_card( __( 'Missing Part Refs', 'drywall-toolbox' ), (string) $missing_refs, '', $missing_refs > 0 ? 'warning' : '' );
	$grid .= '</div>';

	return $grid;
}

function dtb_schematics_suite_render_parts_table( DTB_Schematic_Record_Entity $record ): string {
	if ( empty( $record->parts ) ) {
		return dtb_admin_ui_empty_state( __( 'No part relationships recorded yet.', 'drywall-toolbox' ) );
	}
	ob_start();
	echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		[ 'label' => __( 'Part Ref', 'drywall-toolbox' ) ], [ 'label' => __( 'MPN / SKU', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Title', 'drywall-toolbox' ) ], [ 'label' => __( 'Occurrences', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Resolution', 'drywall-toolbox' ) ], [ 'label' => __( 'Product', 'drywall-toolbox' ) ],
	] );
	foreach ( $record->parts as $part ) {
		echo '<tr class="dtb-table__row">';
		echo '<td class="dtb-table__cell">' . esc_html( $part['part_ref'] ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( trim( $part['mpn'] . ' / ' . $part['sku'], ' /' ) ?: '—' ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( $part['title'] ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( (string) $part['occurrence_count'] ) . '</td>';
		$badge_type = DTB_SCHEMATIC_PART_STATE_RESOLVED === $part['resolution_state'] ? 'success' : ( DTB_SCHEMATIC_PART_STATE_NOT_SOLD === $part['resolution_state'] ? 'neutral' : 'warning' );
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_badge( ucwords( str_replace( '_', ' ', $part['resolution_method'] ) ), $badge_type ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">';
		if ( $part['product_id'] > 0 ) {
			echo '<a href="' . esc_url( admin_url( 'post.php?post=' . $part['product_id'] . '&action=edit' ) ) . '">#' . (int) $part['product_id'] . '</a>';
		} else {
			echo '<span class="dtb-table__cell--muted">—</span>';
		}
		echo '</td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	return ob_get_clean();
}

/**
 * Storefront-parity preview: builds the exact detail-response DTO the public
 * REST controller returns (Application/GenerateSchematicResponse.php), then
 * renders it read-only. Never a second bespoke conversion path.
 */
function dtb_schematics_suite_render_storefront_preview( DTB_Schematic_Record_Entity $record ): string {
	$response = dtb_schematic_generate_detail_response( $record );

	$html  = '<div class="dtb-grid dtb-grid--two">';
	$html .= '<div>';
	$html .= '<h4>' . esc_html( $response['title'] ) . '</h4>';
	$html .= '<p class="description">' . esc_html( $response['brand']['name'] . ' · ' . $response['category']['name'] ) . '</p>';
	$html .= '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
	foreach ( $response['pages'] as $page ) {
		if ( '' === $page['url'] ) {
			$html .= '<div class="dtb-empty-state" style="padding:12px;"><span class="dashicons dashicons-format-image"></span><br>' . esc_html( sprintf( __( 'Page %d: missing media', 'drywall-toolbox' ), $page['page_number'] ) ) . '</div>';
			continue;
		}
		$html .= '<figure style="margin:0;">';
		$html .= '<img src="' . esc_url( $page['url'] ) . '" loading="lazy" width="120" height="120" style="object-fit:contain;border:1px solid var(--dtb-border,#ddd);border-radius:6px;background:#fff;" alt="">';
		$html .= '<figcaption class="description">' . esc_html( $page['label'] ) . ' — ' . count( $page['hotspot_dataset']['occurrences'] ) . ' ' . esc_html__( 'hotspots', 'drywall-toolbox' ) . '</figcaption>';
		$html .= '</figure>';
	}
	$html .= '</div></div>';

	$html .= '<div>';
	$html .= '<h4>' . esc_html__( 'Resolved Parts (customer-facing)', 'drywall-toolbox' ) . '</h4>';
	if ( empty( $response['parts'] ) ) {
		$html .= '<p class="description">' . esc_html__( 'No parts in the public response yet.', 'drywall-toolbox' ) . '</p>';
	} else {
		$html .= '<ul>';
		foreach ( array_slice( $response['parts'], 0, 12 ) as $part ) {
			$html .= '<li>' . esc_html( $part['title'] ?: $part['part_ref'] ) . ' — ' . esc_html( ucwords( str_replace( '_', ' ', $part['resolution_state'] ) ) ) . '</li>';
		}
		$html .= '</ul>';
	}
	$html .= '</div>';
	$html .= '</div>';

	return $html;
}
