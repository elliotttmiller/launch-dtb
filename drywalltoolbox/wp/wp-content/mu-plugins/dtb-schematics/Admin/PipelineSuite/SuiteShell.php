<?php
/**
 * DTB Schematics Pipeline Suite — SuiteShell.
 *
 * Router and shared chrome for the wp-admin Schematics Pipeline Suite.
 * Registered as the `dtb-schematics` admin page callback (see
 * dtb-platform/Admin/ToolLibraryMenu.php) — this file replaces the legacy
 * `dtb_schematics_render_page()` previously defined in the now-removed
 * Admin/SchematicEditorPage.php and Admin/SchematicSyncPage.php monoliths
 * (Phase 9: confirmed zero live callers of their wp_ajax_dtb_schematics_*
 * handlers outside their own dead inline JS, and both files were deleted).
 *
 * The Suite is one admin page with in-page tab navigation across the nine
 * information-architecture sections required by the spec — not nine
 * separate top-level menu entries — so operators have one coherent mental
 * model of "the Schematics Suite" the way dtb-returns/dtb-repair-service
 * already establish for other domains in this admin.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_SCHEMATICS_SUITE_VIEWS = [
	'overview'         => [ 'label' => 'Overview', 'render' => 'dtb_schematics_suite_render_overview' ],
	'inventory'        => [ 'label' => 'Inventory', 'render' => 'dtb_schematics_suite_render_inventory' ],
	'detail'           => [ 'label' => 'Schematic Detail', 'render' => 'dtb_schematics_suite_render_detail', 'hidden' => true ],
	'assets'           => [ 'label' => 'Assets & Attachments', 'render' => 'dtb_schematics_suite_render_assets' ],
	'hotspots'         => [ 'label' => 'Hotspot Data', 'render' => 'dtb_schematics_suite_render_hotspots' ],
	'products'         => [ 'label' => 'Product Relationships', 'render' => 'dtb_schematics_suite_render_products' ],
	'reconciliation'   => [ 'label' => 'Sync & Reconciliation', 'render' => 'dtb_schematics_suite_render_reconciliation' ],
	'publication'      => [ 'label' => 'Publication & Frontend', 'render' => 'dtb_schematics_suite_render_publication' ],
	'activity'         => [ 'label' => 'Activity & Operations', 'render' => 'dtb_schematics_suite_render_activity' ],
	'configuration'    => [ 'label' => 'Configuration Reference', 'render' => 'dtb_schematics_suite_render_configuration' ],
];

/**
 * Primary Suite entry point. Registered by ToolLibraryMenu.php as the
 * `dtb-schematics` page callback.
 */
function dtb_schematics_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_schematics' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$view = sanitize_key( $_GET['view'] ?? 'overview' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! isset( DTB_SCHEMATICS_SUITE_VIEWS[ $view ] ) ) {
		$view = 'overview';
	}

	$base_url = admin_url( 'admin.php?page=dtb-schematics' );
	$tabs     = [];
	foreach ( DTB_SCHEMATICS_SUITE_VIEWS as $id => $def ) {
		if ( ! empty( $def['hidden'] ) ) {
			continue;
		}
		$tabs[] = [
			'id'     => $id,
			'label'  => $def['label'],
			'active' => $view === $id,
			'url'    => add_query_arg( 'view', $id, $base_url ),
		];
	}

	dtb_admin_shell_open( [
		'title'    => __( 'Schematics Pipeline Suite', 'drywall-toolbox' ),
		'subtitle' => __( 'Source-to-storefront operational interface: inventory, attachments, hotspot data, product relationships, reconciliation, and publication.', 'drywall-toolbox' ),
		'section'  => 'tools',
		'page'     => 'dtb-schematics',
		'template' => 'tool',
		'icon'     => 'dashicons-media-code',
		'tabs'     => $tabs,
	] );

	dtb_schematics_suite_render_notice();

	$render = DTB_SCHEMATICS_SUITE_VIEWS[ $view ]['render'];
	if ( function_exists( $render ) ) {
		call_user_func( $render );
	}

	dtb_admin_shell_close();
}

/**
 * Render the one-shot result notice left by SuiteActions.php after a
 * redirect (publish/retire/reconcile/etc results).
 */
function dtb_schematics_suite_render_notice(): void {
	$notice = isset( $_GET['dtb_notice'] ) ? sanitize_text_field( wp_unslash( $_GET['dtb_notice'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( '' === $notice ) {
		return;
	}
	$type = sanitize_key( $_GET['dtb_notice_type'] ?? 'info' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$type = in_array( $type, [ 'success', 'warning', 'danger', 'info' ], true ) ? $type : 'info';

	$labels = [
		'published'                    => __( 'Schematic published.', 'drywall-toolbox' ),
		'retired'                      => __( 'Schematic retired.', 'drywall-toolbox' ),
		'projection_updated'           => __( 'Published projection refreshed.', 'drywall-toolbox' ),
		'products_refreshed'           => __( 'Product projection refreshed.', 'drywall-toolbox' ),
		'hotspot_dataset_associated'   => __( 'Hotspot dataset association updated.', 'drywall-toolbox' ),
		'reconcile_dry_run_complete'   => __( 'Reconciliation dry run complete — see results below.', 'drywall-toolbox' ),
		'reconcile_commit_complete'    => __( 'Reconciliation batch committed — see results below.', 'drywall-toolbox' ),
		'bulk_publish_complete'        => __( 'Bulk publish complete.', 'drywall-toolbox' ),
		'bulk_retire_complete'         => __( 'Bulk retire complete.', 'drywall-toolbox' ),
		'bulk_products_refreshed'      => __( 'Bulk product projection refresh complete.', 'drywall-toolbox' ),
		'schematic_not_found'          => __( 'Schematic record not found.', 'drywall-toolbox' ),
		'part_relationship_updated'    => __( 'Product relationship updated.', 'drywall-toolbox' ),
		'reference_required'           => __( 'A dataset reference is required.', 'drywall-toolbox' ),
		'unknown_action'               => __( 'Unrecognized action.', 'drywall-toolbox' ),
	];

	$message = $labels[ $notice ] ?? urldecode( $notice );

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_alert( $message, $type );
}

/**
 * Build the admin-post.php form-open HTML for a Suite action.
 */
function dtb_schematics_suite_action_form_open( string $sub_action ): string {
	$html  = '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="dtb-schematics-suite-action-form" style="display:inline-block;">';
	$html .= wp_nonce_field( dtb_schematics_suite_nonce_action(), 'dtb_schematics_nonce', true, false );
	$html .= '<input type="hidden" name="action" value="dtb_schematics_suite_action">';
	$html .= '<input type="hidden" name="sub_action" value="' . esc_attr( $sub_action ) . '">';
	return $html;
}

function dtb_schematics_suite_action_form_close(): string {
	return '</form>';
}

/**
 * Detail-workspace deep link for a given internal post ID.
 */
function dtb_schematics_suite_detail_url( int $schematic_id ): string {
	return add_query_arg(
		[ 'view' => 'detail', 'schematic_id' => $schematic_id ],
		admin_url( 'admin.php?page=dtb-schematics' )
	);
}

/**
 * Lifecycle -> badge type mapping shared by Inventory/Detail/Publication.
 */
function dtb_schematics_suite_lifecycle_badge_type( string $lifecycle ): string {
	$map = [
		DTB_Schematic_Lifecycle_Status::DRAFT      => 'neutral',
		DTB_Schematic_Lifecycle_Status::INCOMPLETE => 'warning',
		DTB_Schematic_Lifecycle_Status::READY      => 'info',
		DTB_Schematic_Lifecycle_Status::PUBLISHED  => 'success',
		DTB_Schematic_Lifecycle_Status::RETIRED    => 'neutral',
	];
	return $map[ $lifecycle ] ?? 'neutral';
}
