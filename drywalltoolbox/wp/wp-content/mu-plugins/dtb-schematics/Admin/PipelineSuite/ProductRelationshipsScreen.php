<?php
/**
 * DTB Schematics Pipeline Suite — ProductRelationshipsScreen.
 *
 * Unified schematic-part <-> WooCommerce relationship interface. Queries
 * real WooCommerce products (wc_get_product / wc_get_product_id_by_sku) —
 * never a second product catalog inside dtb-schematics.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_schematics_suite_render_products(): void {
	$focus_id = (int) ( $_GET['schematic_id'] ?? 0 ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$state_filter = sanitize_key( $_GET['state'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	if ( ! function_exists( 'wc_get_product' ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_alert( __( 'WooCommerce is not active in this runtime — product identity cannot be verified.', 'drywall-toolbox' ), 'warning' );
		return;
	}

	$records = $focus_id ? array_filter( [ dtb_schematic_record_repo_get( $focus_id ) ] ) : dtb_schematics_suite_all_records();

	$rows = [];
	foreach ( $records as $record ) {
		if ( ! $record || $record->lifecycle->is_retired() ) {
			continue;
		}
		foreach ( $record->parts as $part ) {
			if ( $state_filter && $part['resolution_state'] !== $state_filter ) {
				continue;
			}
			$rows[] = [ 'record' => $record, 'part' => $part ];
		}
	}

	if ( $focus_id && ( $record = dtb_schematic_record_repo_get( $focus_id ) ) ) { // phpcs:ignore Squiz.PHP.DisallowMultipleAssignments
		echo dtb_admin_ui_button( __( '← All Product Relationships', 'drywall-toolbox' ), [ 'href' => admin_url( 'admin.php?page=dtb-schematics&view=products' ), 'size' => 'sm', 'type' => 'ghost' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<h2 style="margin:8px 0;">' . esc_html( $record->title ) . '</h2>';
	}

	// State filter chips.
	$base = admin_url( 'admin.php?page=dtb-schematics&view=products' . ( $focus_id ? '&schematic_id=' . $focus_id : '' ) );
	$states = [ '' => __( 'All', 'drywall-toolbox' ), DTB_SCHEMATIC_PART_STATE_RESOLVED => __( 'Resolved', 'drywall-toolbox' ), DTB_SCHEMATIC_PART_STATE_UNRESOLVED => __( 'Unresolved', 'drywall-toolbox' ), DTB_SCHEMATIC_PART_STATE_NOT_SOLD => __( 'Not Sold', 'drywall-toolbox' ) ];
	echo '<div style="display:flex;gap:6px;margin-bottom:12px;">';
	foreach ( $states as $key => $label ) {
		$url = add_query_arg( 'state', $key, $base );
		printf( '<a href="%s" class="dtb-filter-chip%s">%s</a>', esc_url( $url ), $state_filter === $key ? ' is-active' : '', esc_html( $label ) );
	}
	echo '</div>';

	if ( empty( $rows ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No part relationships recorded.', 'drywall-toolbox' ), __( 'Part relationships are populated by the reconciliation/product-resolution pipeline; run Sync & Reconciliation first.', 'drywall-toolbox' ) );
		return;
	}

	echo dtb_admin_ui_table_open( [ // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		[ 'label' => __( 'Schematic', 'drywall-toolbox' ) ], [ 'label' => __( 'Part Ref', 'drywall-toolbox' ) ],
		[ 'label' => __( 'MPN / SKU', 'drywall-toolbox' ) ], [ 'label' => __( 'Brand', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Occurrences', 'drywall-toolbox' ) ], [ 'label' => __( 'Product', 'drywall-toolbox' ) ],
		[ 'label' => __( 'Method / State', 'drywall-toolbox' ) ], [ 'label' => __( 'Actions', 'drywall-toolbox' ) ],
	] );

	foreach ( array_slice( $rows, 0, 200 ) as $row ) {
		$record = $row['record'];
		$part   = $row['part'];
		$product = $part['product_id'] > 0 ? wc_get_product( $part['product_id'] ) : null;

		echo '<tr class="dtb-table__row">';
		echo '<td class="dtb-table__cell"><a href="' . esc_url( dtb_schematics_suite_detail_url( $record->id ) ) . '">' . esc_html( $record->canonical_id ) . '</a></td>';
		echo '<td class="dtb-table__cell">' . esc_html( $part['part_ref'] ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( trim( $part['mpn'] . ' / ' . $part['sku'], ' /' ) ?: '—' ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( $part['brand'] ?: '—' ) . '</td>';
		echo '<td class="dtb-table__cell">' . esc_html( (string) $part['occurrence_count'] ) . '</td>';
		echo '<td class="dtb-table__cell">';
		if ( $product ) {
			echo '<a href="' . esc_url( get_edit_post_link( $product->get_id() ) ) . '">' . esc_html( $product->get_name() ) . '</a> <span class="description">#' . (int) $product->get_id() . '</span>';
		} else {
			echo '<span class="dtb-table__cell--muted">—</span>';
		}
		echo '</td>';
		$badge_type = DTB_SCHEMATIC_PART_STATE_RESOLVED === $part['resolution_state'] ? 'success' : ( DTB_SCHEMATIC_PART_STATE_NOT_SOLD === $part['resolution_state'] ? 'neutral' : 'warning' );
		echo '<td class="dtb-table__cell">' . dtb_admin_ui_badge( ucwords( str_replace( '_', ' ', $part['resolution_method'] ) ), $badge_type ) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<td class="dtb-table__cell">';
		$suggested = $part['sku'] ? (int) wc_get_product_id_by_sku( $part['sku'] ) : 0;
		if ( $suggested && $suggested !== (int) $part['product_id'] ) {
			echo '<p class="description" style="margin:0 0 4px;">' . esc_html( sprintf( __( 'Exact SKU match: #%d', 'drywall-toolbox' ), $suggested ) ) . '</p>';
			echo dtb_schematics_suite_action_form_open( 'update_part_relationship' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo '<input type="hidden" name="schematic_id" value="' . esc_attr( (string) $record->id ) . '">';
			echo '<input type="hidden" name="part_ref" value="' . esc_attr( $part['part_ref'] ) . '">';
			echo '<input type="hidden" name="part_op" value="select_product"><input type="hidden" name="product_id" value="' . esc_attr( (string) $suggested ) . '">';
			echo dtb_admin_ui_button( __( 'Accept', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'size' => 'xs', 'type' => 'primary' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo dtb_schematics_suite_action_form_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
		echo dtb_schematics_suite_action_form_open( 'update_part_relationship' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<input type="hidden" name="schematic_id" value="' . esc_attr( (string) $record->id ) . '">';
		echo '<input type="hidden" name="part_ref" value="' . esc_attr( $part['part_ref'] ) . '">';
		echo '<input type="number" name="product_id" placeholder="' . esc_attr__( 'Product ID', 'drywall-toolbox' ) . '" style="width:90px;" class="dtb-input">';
		echo '<input type="hidden" name="part_op" value="select_product">';
		echo dtb_admin_ui_button( __( 'Select', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'size' => 'xs' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_schematics_suite_action_form_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_schematics_suite_action_form_open( 'update_part_relationship' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<input type="hidden" name="schematic_id" value="' . esc_attr( (string) $record->id ) . '"><input type="hidden" name="part_ref" value="' . esc_attr( $part['part_ref'] ) . '"><input type="hidden" name="part_op" value="clear">';
		echo dtb_admin_ui_button( __( 'Clear', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'size' => 'xs', 'type' => 'ghost' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_schematics_suite_action_form_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_schematics_suite_action_form_open( 'update_part_relationship' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<input type="hidden" name="schematic_id" value="' . esc_attr( (string) $record->id ) . '"><input type="hidden" name="part_ref" value="' . esc_attr( $part['part_ref'] ) . '"><input type="hidden" name="part_op" value="mark_not_sold">';
		echo dtb_admin_ui_button( __( 'Not Sold', 'drywall-toolbox' ), [ 'btn_type' => 'submit', 'size' => 'xs', 'type' => 'ghost' ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_schematics_suite_action_form_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</td>';
		echo '</tr>';
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_alert(
		__( 'Part relationships are primarily populated by the reconciliation/product-resolution pipeline (Application/ResolveSchematicPartOccurrences.php). "Select"/"Accept"/"Clear"/"Not Sold" above write directly through Application/ManageSchematicRecord.php\'s existing update() call — no fuzzy matching is performed; "Select" requires an exact WooCommerce product ID.', 'drywall-toolbox' ),
		'info'
	);
}
