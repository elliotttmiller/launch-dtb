<?php
/**
 * Authoritative server-rendered Schematics Workspace.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_post_dtb_schematics_workspace_action', 'dtb_schematics_workspace_handle_action' );
add_action( 'admin_enqueue_scripts', 'dtb_schematics_workspace_enqueue_assets' );

function dtb_schematics_workspace_url( array $args = [] ): string {
	return add_query_arg( $args, admin_url( 'admin.php?page=dtb-schematics' ) );
}

function dtb_schematics_workspace_detail_url( int $id ): string {
	return dtb_schematics_workspace_url( [ 'view' => 'record', 'schematic_id' => max( 0, $id ) ] );
}

function dtb_schematics_workspace_enqueue_assets( string $hook ): void {
	if ( false === strpos( $hook, 'dtb-schematics' ) ) {
		return;
	}

	$path = __DIR__ . '/../assets/schematics-workspace.css';
	if ( is_file( $path ) ) {
		wp_enqueue_style(
			'dtb-schematics-workspace',
			content_url( '/mu-plugins/dtb-schematics/Admin/assets/schematics-workspace.css' ),
			[],
			(string) filemtime( $path )
		);
	}
}

function dtb_schematics_workspace_render_page(): void {
	if ( ! dtb_schematics_can_manage() ) {
		wp_die( esc_html__( 'You do not have permission to manage schematics.', 'drywall-toolbox' ), 403 );
	}
	$view = sanitize_key( wp_unslash( $_GET['view'] ?? 'dashboard' ) );
	$view = in_array( $view, [ 'dashboard', 'catalog', 'record', 'operations' ], true ) ? $view : 'dashboard';
	echo '<main class="wrap dtb-schematics-workspace"><h1>' . esc_html__( 'Schematics & Hotspots', 'drywall-toolbox' ) . '</h1><p class="description">' . esc_html__( 'Control schematic records, hotspot synchronization, exact product links, and storefront readiness.', 'drywall-toolbox' ) . '</p>';
	dtb_schematics_workspace_notice_and_run();
	dtb_schematics_workspace_navigation( $view );
	if ( 'catalog' === $view ) { dtb_schematics_workspace_render_catalog(); } elseif ( 'record' === $view ) { dtb_schematics_workspace_render_record(); } elseif ( 'operations' === $view ) { dtb_schematics_workspace_render_operations(); } else { dtb_schematics_workspace_render_dashboard(); }
	echo '</main>';
}

function dtb_schematics_workspace_navigation( string $active ): void {
	echo '<nav class="nav-tab-wrapper" aria-label="' . esc_attr__( 'Schematics sections', 'drywall-toolbox' ) . '">';
	foreach ( [ 'dashboard' => __( 'Dashboard', 'drywall-toolbox' ), 'catalog' => __( 'Catalog', 'drywall-toolbox' ), 'operations' => __( 'Operations & history', 'drywall-toolbox' ) ] as $view => $label ) {
		echo '<a class="nav-tab ' . ( $view === $active ? 'nav-tab-active' : '' ) . '" href="' . esc_url( dtb_schematics_workspace_url( [ 'view' => $view ] ) ) . '">' . esc_html( $label ) . '</a>';
	}
	echo '</nav>';
}

function dtb_schematics_workspace_notice_and_run(): void {
	if ( ! empty( $_GET['dtb_schematics_notice'] ) ) {
		$error = 'error' === sanitize_key( wp_unslash( $_GET['dtb_schematics_notice_type'] ?? '' ) );
		echo '<div class="notice ' . ( $error ? 'notice-error' : 'notice-success' ) . '"><p>' . esc_html( sanitize_text_field( wp_unslash( $_GET['dtb_schematics_notice'] ) ) ) . '</p></div>';
	}
	$run_id = sanitize_text_field( wp_unslash( $_GET['run_id'] ?? '' ) );
	if ( '' === $run_id || ! function_exists( 'dtb_schematic_operation_run_get_for_operator' ) ) { return; }
	$run = dtb_schematic_operation_run_get_for_operator( $run_id, get_current_user_id() );
	if ( ! $run ) { return; }
	$result = (array) ( $run['result'] ?? [] );
	$ok = 'completed' === ( $run['status'] ?? '' ) && empty( $result['failed'] ) && empty( $result['unresolved'] );
	echo '<section class="notice ' . ( $ok ? 'notice-info' : 'notice-error' ) . '" aria-label="' . esc_attr__( 'Operation result', 'drywall-toolbox' ) . '"><p><strong>' . esc_html__( 'Operation run', 'drywall-toolbox' ) . ':</strong> <code>' . esc_html( $run['id'] ) . '</code> · ' . esc_html( $run['kind'] ) . ' · ' . esc_html( ! empty( $run['dry_run'] ) ? __( 'preview', 'drywall-toolbox' ) : __( 'applied', 'drywall-toolbox' ) ) . ' · ' . esc_html( $run['status'] ) . '</p>';
	if ( ! empty( $run['error'] ) ) { echo '<p>' . esc_html( $run['error'] ) . '</p>'; } elseif ( $ok ) { echo '<p>' . esc_html( sprintf( __( 'Examined %1$d; changed %2$d; unresolved/failed %3$d.', 'drywall-toolbox' ), (int) ( $result['examined'] ?? 0 ), (int) ( $result['changed'] ?? 0 ), (int) ( $result['unresolved'] ?? $result['failed'] ?? 0 ) ) ) . '</p>'; }
	echo '</section>';
}

function dtb_schematics_workspace_health( DTB_Schematic_Record_Entity $record ): array {
	$missing_pages = 0;
	foreach ( array_slice( $record->pages, 0, 50 ) as $page ) { if ( empty( $page['attachment_id'] ) || DTB_SCHEMATIC_PAGE_STATE_MISSING_ASSET === $page['lifecycle_state'] ) { $missing_pages++; } }
	$unresolved_parts = count( array_filter( $record->parts, static fn( $part ) => empty( $part['product_id'] ) && ( $part['resolution_state'] ?? '' ) !== DTB_SCHEMATIC_PART_STATE_NOT_SOLD ) );
	return [ 'missing_pages' => $missing_pages, 'dataset' => dtb_schematic_hotspot_dataset_repo_get( $record->id ), 'reference' => (string) ( $record->hotspot_dataset['reference'] ?? '' ), 'unresolved_parts' => $unresolved_parts, 'requirements' => dtb_schematic_publication_requirements( $record->to_array() ), 'preview' => dtb_schematic_resolve_preview( $record ) ];
}

function dtb_schematics_workspace_source_status(): array {
	$uploads      = wp_upload_dir();
	$expected_dir = ! empty( $uploads['basedir'] ) ? trailingslashit( (string) $uploads['basedir'] ) . DTB_SCHEMATIC_PRIMARY_UPLOADS_YEAR . '/schematics' : '';
	$detected     = '' !== $expected_dir && is_dir( $expected_dir );
	$mode         = dtb_schematics_source_resolution_mode();
	$active_pages      = 0;
	$retired_files     = 0;
	$source_schematics = [];
	if ( $detected ) {
		$manifest = dtb_schematics_read_source_manifest();
		foreach ( (array) ( $manifest['rows'] ?? [] ) as $row ) {
			$filename = (string) ( $row['filename'] ?? '' );
			if ( null !== dtb_schematics_retired_upload_reason( $filename ) ) {
				$retired_files++;
				continue;
			}
			$identity = dtb_schematics_parse_upload_filename( $filename );
			if ( is_array( $identity ) && ! empty( $identity['schematic_id'] ) ) {
				$active_pages++;
				$source_schematics[ sanitize_key( (string) $identity['schematic_id'] ) ] = true;
			}
		}
	}

	return [
		'available'   => 'unavailable' !== $mode,
		'mode'        => $mode,
		'detected'    => $detected,
		'image_count' => $detected ? count( dtb_schematics_scan_directory_image_files( $expected_dir ) ) : 0,
		'active_pages' => $active_pages,
		'retired_files' => $retired_files,
		'source_schematics' => count( $source_schematics ),
	];
}

function dtb_schematics_workspace_problem_summary( DTB_Schematic_Record_Entity $record, array $health ): string {
	$items = [];
	if ( $health['missing_pages'] ) { $items[] = sprintf( _n( '%d missing attachment', '%d missing attachments', $health['missing_pages'], 'drywall-toolbox' ), $health['missing_pages'] ); }
	if ( $health['reference'] && ! $health['dataset'] ) { $items[] = __( 'dataset not migrated', 'drywall-toolbox' ); }
	if ( $health['unresolved_parts'] ) { $items[] = sprintf( _n( '%d unresolved part', '%d unresolved parts', $health['unresolved_parts'], 'drywall-toolbox' ), $health['unresolved_parts'] ); }
	if ( ! $record->lifecycle->is_published() && $health['requirements'] ) {
		$labels = [
			'canonical_id_required'  => __( 'canonical ID missing', 'drywall-toolbox' ),
			'title_required'         => __( 'title missing', 'drywall-toolbox' ),
			'brand_id_required'      => __( 'brand missing', 'drywall-toolbox' ),
			'category_id_required'   => __( 'category missing', 'drywall-toolbox' ),
			'attached_page_required' => __( 'attached page missing', 'drywall-toolbox' ),
		];
		foreach ( $health['requirements'] as $requirement ) {
			$items[] = $labels[ $requirement ] ?? sanitize_text_field( (string) $requirement );
		}
	}
	return $items ? implode( '; ', $items ) : __( 'No readiness issues detected.', 'drywall-toolbox' );
}

function dtb_schematics_workspace_render_dashboard(): void {
	$all = dtb_schematic_record_repo_query( [ 'per_page' => 1 ] ); $published = dtb_schematic_record_repo_query( [ 'lifecycle' => DTB_Schematic_Lifecycle_Status::PUBLISHED, 'per_page' => 1 ] ); $recent = dtb_schematic_record_repo_query( [ 'per_page' => 25 ] ); $source = dtb_schematics_workspace_source_status();
	echo '<section>'; foreach ( [ __( 'Schematics registered', 'drywall-toolbox' ) => $all['total'], __( 'Active diagram pages', 'drywall-toolbox' ) => $source['active_pages'], __( 'Published to storefront', 'drywall-toolbox' ) => $published['total'] ] as $label => $value ) { echo '<div class="card"><h2>' . esc_html( (string) $value ) . '</h2><p>' . esc_html( $label ) . '</p></div>'; } echo '</section>';
	echo '<section class="card"><h2>' . esc_html__( 'SiteGround source and storefront', 'drywall-toolbox' ) . '</h2><dl class="dtb-schematics-workspace__details"><dt>' . esc_html__( 'uploads/2026/schematics', 'drywall-toolbox' ) . '</dt><dd>' . esc_html( $source['detected'] ? sprintf( __( '%1$d files: %2$d active pages across %3$d schematics; %4$d retired residuals', 'drywall-toolbox' ), $source['image_count'], $source['active_pages'], $source['source_schematics'], $source['retired_files'] ) : __( 'Not detected', 'drywall-toolbox' ) ) . '</dd><dt>' . esc_html__( 'Effective source', 'drywall-toolbox' ) . '</dt><dd>' . esc_html( $source['available'] ? $source['mode'] : __( 'Unavailable', 'drywall-toolbox' ) ) . '</dd><dt>' . esc_html__( 'Public API', 'drywall-toolbox' ) . '</dt><dd><a href="' . esc_url( rest_url( 'dtb/v1/schematics' ) ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Open schematic catalog endpoint', 'drywall-toolbox' ) . '</a></dd><dt>' . esc_html__( 'Storefront', 'drywall-toolbox' ) . '</dt><dd><a href="' . esc_url( home_url( '/schematics' ) ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Open Schematics page', 'drywall-toolbox' ) . '</a></dd></dl></section>';
	echo '<section class="card"><h2>' . esc_html__( 'Needs attention', 'drywall-toolbox' ) . '</h2><p class="description">' . esc_html__( 'The 25 most recently updated records are checked here. Use Catalog to inspect the full collection.', 'drywall-toolbox' ) . '</p><ul>';
	$count = 0; foreach ( $recent['items'] as $record ) { $summary = dtb_schematics_workspace_problem_summary( $record, dtb_schematics_workspace_health( $record ) ); if ( __( 'No readiness issues detected.', 'drywall-toolbox' ) !== $summary ) { $count++; echo '<li><a href="' . esc_url( dtb_schematics_workspace_detail_url( $record->id ) ) . '">' . esc_html( $record->title ) . '</a>: ' . esc_html( $summary ) . '</li>'; } } if ( ! $count ) { echo '<li>' . esc_html__( 'No readiness issues detected in this review.', 'drywall-toolbox' ) . '</li>'; } echo '</ul></section>';
}

function dtb_schematics_workspace_render_catalog(): void {
	$search = sanitize_text_field( wp_unslash( $_GET['s'] ?? '' ) ); $lifecycle = sanitize_key( wp_unslash( $_GET['lifecycle'] ?? '' ) ); $lifecycle = in_array( $lifecycle, DTB_Schematic_Lifecycle_Status::all(), true ) ? $lifecycle : ''; $page = min( 10000, max( 1, absint( $_GET['paged'] ?? 1 ) ) ); $results = dtb_schematic_record_repo_query( [ 'search' => $search, 'lifecycle' => $lifecycle, 'page' => $page, 'per_page' => 25 ] );
	echo '<form method="get" class="dtb-schematics-workspace__filters"><input type="hidden" name="page" value="dtb-schematics"><input type="hidden" name="view" value="catalog"><input type="search" name="s" value="' . esc_attr( $search ) . '" placeholder="' . esc_attr__( 'Search title or ID', 'drywall-toolbox' ) . '" aria-label="' . esc_attr__( 'Search schematics', 'drywall-toolbox' ) . '"><select name="lifecycle"><option value="">' . esc_html__( 'All lifecycle states', 'drywall-toolbox' ) . '</option>'; foreach ( DTB_Schematic_Lifecycle_Status::all() as $state ) { echo '<option value="' . esc_attr( $state ) . '" ' . selected( $lifecycle, $state, false ) . '>' . esc_html( ( new DTB_Schematic_Lifecycle_Status( $state ) )->label() ) . '</option>'; } echo '</select><button class="button">' . esc_html__( 'Filter', 'drywall-toolbox' ) . '</button></form><table class="widefat striped"><thead><tr><th>' . esc_html__( 'Schematic', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'Lifecycle', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'Readiness', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'Updated', 'drywall-toolbox' ) . '</th></tr></thead><tbody>';
	foreach ( $results['items'] as $record ) { echo '<tr><td><a href="' . esc_url( dtb_schematics_workspace_detail_url( $record->id ) ) . '">' . esc_html( $record->title ) . '</a><br><code>' . esc_html( $record->canonical_id ) . '</code></td><td>' . esc_html( $record->lifecycle->label() ) . '</td><td>' . esc_html( dtb_schematics_workspace_problem_summary( $record, dtb_schematics_workspace_health( $record ) ) ) . '</td><td>' . esc_html( $record->updated_at ) . '</td></tr>'; } if ( ! $results['items'] ) { echo '<tr><td colspan="4">' . esc_html__( 'No schematics match this filter.', 'drywall-toolbox' ) . '</td></tr>'; } echo '</tbody></table>'; dtb_schematics_workspace_pagination( $page, $results['pages'], [ 'view' => 'catalog', 's' => $search, 'lifecycle' => $lifecycle ] );
}

function dtb_schematics_workspace_render_record(): void {
	$id = absint( $_GET['schematic_id'] ?? 0 ); $record = $id ? dtb_schematic_record_repo_get( $id ) : null; if ( ! $record ) { echo '<div class="notice notice-error"><p>' . esc_html__( 'The requested schematic record was not found.', 'drywall-toolbox' ) . '</p></div>'; return; } $health = dtb_schematics_workspace_health( $record );
	echo '<p><a href="' . esc_url( dtb_schematics_workspace_url( [ 'view' => 'catalog' ] ) ) . '">&larr; ' . esc_html__( 'Back to catalog', 'drywall-toolbox' ) . '</a></p><section class="card"><div><h2>' . esc_html( $record->title ) . '</h2><code>' . esc_html( $record->canonical_id ) . '</code><p>' . esc_html( $record->lifecycle->label() ) . '</p></div><div>';
	if ( $record->lifecycle->is_published() ) { dtb_schematics_workspace_action_form( 'refresh_projection', __( 'Refresh public projection', 'drywall-toolbox' ), $id, true ); dtb_schematics_workspace_action_form( 'retire', __( 'Retire', 'drywall-toolbox' ), $id, true ); } elseif ( DTB_Schematic_Lifecycle_Status::READY === $record->lifecycle->value() ) { dtb_schematics_workspace_action_form( 'publish', __( 'Publish', 'drywall-toolbox' ), $id, true ); } echo '</div></section>';
	echo '<section class="dtb-schematics-workspace__panel"><h3>' . esc_html__( 'Readiness and health', 'drywall-toolbox' ) . '</h3><dl class="dtb-schematics-workspace__details"><dt>' . esc_html__( 'Pages', 'drywall-toolbox' ) . '</dt><dd>' . esc_html( sprintf( __( '%1$d pages; %2$d missing attachments', 'drywall-toolbox' ), count( $record->pages ), $health['missing_pages'] ) ) . '</dd><dt>' . esc_html__( 'Hotspot dataset', 'drywall-toolbox' ) . '</dt><dd>' . esc_html( $health['dataset'] ? __( 'Normalized dataset available', 'drywall-toolbox' ) : ( $health['reference'] ? __( 'Reference exists but dataset is not migrated', 'drywall-toolbox' ) : __( 'No dataset reference', 'drywall-toolbox' ) ) ) . '</dd><dt>' . esc_html__( 'Parts and products', 'drywall-toolbox' ) . '</dt><dd>' . esc_html( sprintf( __( '%1$d linked products; %2$d unresolved parts', 'drywall-toolbox' ), count( $record->linked_products ), $health['unresolved_parts'] ) ) . '</dd><dt>' . esc_html__( 'Publication requirements', 'drywall-toolbox' ) . '</dt><dd>' . esc_html( $health['requirements'] ? implode( '; ', array_map( 'strval', array_slice( $health['requirements'], 0, 10 ) ) ) : __( 'All requirements satisfied.', 'drywall-toolbox' ) ) . '</dd><dt>' . esc_html__( 'Preview', 'drywall-toolbox' ) . '</dt><dd>' . esc_html( ucfirst( $health['preview']['source'] ) ) . ( $health['preview']['url'] ? ' <a href="' . esc_url( $health['preview']['url'] ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Open preview', 'drywall-toolbox' ) . '</a>' : '' ) . '</dd></dl></section>';
	echo '<section class="dtb-schematics-workspace__panel"><h3>' . esc_html__( 'Pages and attachments', 'drywall-toolbox' ) . '</h3><table class="widefat striped"><thead><tr><th>' . esc_html__( 'Page', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'Attachment', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'State', 'drywall-toolbox' ) . '</th></tr></thead><tbody>'; foreach ( array_slice( $record->pages, 0, 50 ) as $page ) { echo '<tr><td>' . esc_html( $page['page_number'] . ': ' . $page['label'] ) . '</td><td>' . esc_html( $page['attachment_id'] ? '#' . $page['attachment_id'] : '—' ) . '</td><td>' . esc_html( $page['lifecycle_state'] ) . '</td></tr>'; } if ( ! $record->pages ) { echo '<tr><td colspan="3">' . esc_html__( 'No pages synchronized.', 'drywall-toolbox' ) . '</td></tr>'; } echo '</tbody></table></section>';
	echo '<section class="dtb-schematics-workspace__panel"><h3>' . esc_html__( 'Selected-record operations', 'drywall-toolbox' ) . '</h3><p>' . esc_html__( 'No path fields are accepted. Each operation is restricted to this record.', 'drywall-toolbox' ) . '</p>'; dtb_schematics_workspace_action_form( 'migrate_hotspots_preview', __( 'Preview hotspot synchronization', 'drywall-toolbox' ), $id ); dtb_schematics_workspace_action_form( 'migrate_hotspots_commit', __( 'Apply hotspot synchronization', 'drywall-toolbox' ), $id, true ); dtb_schematics_workspace_action_form( 'refresh_products_preview', __( 'Preview product linking', 'drywall-toolbox' ), $id ); dtb_schematics_workspace_action_form( 'refresh_products_commit', __( 'Apply product linking', 'drywall-toolbox' ), $id, true ); echo '</section>';
}

function dtb_schematics_workspace_render_operations(): void {
	$page = min( 10000, max( 1, absint( $_GET['paged'] ?? 1 ) ) ); $history = dtb_schematic_activity_query( [ 'page' => $page, 'per_page' => 25 ] ); $source = dtb_schematics_workspace_source_status();
	echo '<section class="dtb-schematics-workspace__panel"><h2>' . esc_html__( 'Schematic synchronization', 'drywall-toolbox' ) . '</h2><p>' . esc_html__( 'Register and link a bounded batch from uploads/2026/schematics.', 'drywall-toolbox' ) . '</p>'; if ( $source['available'] ) { dtb_schematics_workspace_action_form( 'reconcile_preview', __( 'Preview schematic sync', 'drywall-toolbox' ) ); dtb_schematics_workspace_action_form( 'reconcile_commit', __( 'Register & link schematics', 'drywall-toolbox' ), 0, true ); } else { echo '<div class="notice notice-error inline"><p>' . esc_html__( 'Synchronization is unavailable because no usable schematic source images were detected.', 'drywall-toolbox' ) . '</p></div>'; } echo '</section><section class="dtb-schematics-workspace__panel"><h2>' . esc_html__( 'Operation history', 'drywall-toolbox' ) . '</h2>'; dtb_schematics_workspace_activity_table( $history['items'] ); echo '</section>'; dtb_schematics_workspace_pagination( $page, $history['pages'], [ 'view' => 'operations' ] );
}

function dtb_schematics_workspace_activity_table( array $items ): void { echo '<table class="widefat striped"><thead><tr><th>' . esc_html__( 'When', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'Operation', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'Result', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'Summary', 'drywall-toolbox' ) . '</th></tr></thead><tbody>'; foreach ( $items as $item ) { $summary = str_ireplace( [ 'Reconcile commit', 'Reconcile dry run' ], [ 'Schematic sync applied', 'Schematic sync previewed' ], (string) $item['summary'] ); $error = sanitize_text_field( (string) ( $item['detail']['error'] ?? '' ) ); if ( 'error' === $item['result'] && '' !== $error ) { $summary .= ' — ' . $error; } echo '<tr><td>' . esc_html( $item['completed_at'] ) . '</td><td>' . esc_html( $item['operation_type'] ) . '</td><td>' . esc_html( $item['result'] ) . '</td><td>' . esc_html( $summary ) . '</td></tr>'; } if ( ! $items ) { echo '<tr><td colspan="4">' . esc_html__( 'No recorded operations.', 'drywall-toolbox' ) . '</td></tr>'; } echo '</tbody></table>'; }
function dtb_schematics_workspace_pagination( int $current, int $pages, array $args ): void { if ( $pages > 1 ) { echo '<div class="tablenav"><div class="tablenav-pages">' . wp_kses_post( paginate_links( [ 'base' => esc_url_raw( add_query_arg( array_merge( $args, [ 'paged' => '%#%' ] ), admin_url( 'admin.php?page=dtb-schematics' ) ) ), 'format' => '', 'current' => $current, 'total' => $pages ] ) ) . '</div></div>'; } }
function dtb_schematics_workspace_action_form( string $operation, string $label, int $id = 0, bool $commit = false ): void { echo '<form class="dtb-schematics-workspace__inline-form" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="dtb_schematics_workspace_action"><input type="hidden" name="operation" value="' . esc_attr( $operation ) . '"><input type="hidden" name="schematic_id" value="' . esc_attr( (string) $id ) . '">'; wp_nonce_field( 'dtb_schematics_workspace_action', 'dtb_schematics_workspace_nonce' ); if ( $commit ) { echo '<label class="dtb-schematics-workspace__confirm"><input type="checkbox" name="commit_confirmation" value="1" required> ' . esc_html__( 'I confirm these changes.', 'drywall-toolbox' ) . '</label>'; } echo '<button class="button ' . ( $commit ? 'button-secondary' : 'button-primary' ) . '">' . esc_html( $label ) . '</button></form>'; }

function dtb_schematics_workspace_handle_action(): void {
	if ( ! dtb_schematics_can_manage() ) { wp_die( esc_html__( 'You do not have permission to perform this action.', 'drywall-toolbox' ), 403 ); }
	check_admin_referer( 'dtb_schematics_workspace_action', 'dtb_schematics_workspace_nonce' );
	$operation = sanitize_key( wp_unslash( $_POST['operation'] ?? '' ) );
	$id        = absint( $_POST['schematic_id'] ?? 0 );
	$allowed   = [ 'publish', 'retire', 'refresh_projection', 'reconcile_preview', 'reconcile_commit', 'migrate_hotspots_preview', 'migrate_hotspots_commit', 'refresh_products_preview', 'refresh_products_commit' ];
	if ( ! in_array( $operation, $allowed, true ) ) { dtb_schematics_workspace_redirect( $id, __( 'Unsupported workspace action.', 'drywall-toolbox' ), 'error' ); }
	$commit                = str_ends_with( $operation, '_commit' );
	$requires_confirmation = $commit || in_array( $operation, [ 'publish', 'retire', 'refresh_projection' ], true );
	if ( $requires_confirmation && '1' !== (string) ( $_POST['commit_confirmation'] ?? '' ) ) { dtb_schematics_workspace_redirect( $id, __( 'Confirm the requested changes before submitting them.', 'drywall-toolbox' ), 'error' ); }
	$is_global_reconcile = str_starts_with( $operation, 'reconcile_' );
	$is_record_run       = str_starts_with( $operation, 'migrate_hotspots_' ) || str_starts_with( $operation, 'refresh_products_' );
	$is_record_mutation  = in_array( $operation, [ 'publish', 'retire', 'refresh_projection' ], true );
	$requires_record     = $is_record_run || $is_record_mutation;
	if ( $requires_record && ! dtb_schematic_record_repo_get( $id ) ) { dtb_schematics_workspace_redirect( $id, __( 'Schematic record not found.', 'drywall-toolbox' ), 'error' ); }
	dtb_schematics_workspace_execute_run( $operation, $id, $commit || $is_record_mutation );
}

function dtb_schematics_workspace_execute_run( string $operation, int $id, bool $commit ): void { if ( str_starts_with( $operation, 'reconcile_' ) ) { $kind = DTB_SCHEMATIC_OPERATION_RECONCILE; } elseif ( str_starts_with( $operation, 'migrate_hotspots_' ) ) { $kind = DTB_SCHEMATIC_OPERATION_MIGRATE_HOTSPOTS; } elseif ( str_starts_with( $operation, 'refresh_products_' ) ) { $kind = DTB_SCHEMATIC_OPERATION_REFRESH_PRODUCTS; } else { $kind = [ 'publish' => DTB_SCHEMATIC_OPERATION_PUBLISH, 'retire' => DTB_SCHEMATIC_OPERATION_RETIRE, 'refresh_projection' => DTB_SCHEMATIC_OPERATION_REFRESH_PUBLIC ][ $operation ]; } $args = [ 'kind' => $kind, 'dry_run' => ! $commit, 'operator_id' => get_current_user_id() ]; if ( DTB_SCHEMATIC_OPERATION_RECONCILE === $kind ) { $args['batch_size'] = 25; $args['resume'] = true; } else { $args['schematic_ids'] = [ $id ]; } $run = dtb_schematic_run_operation( $args ); if ( is_wp_error( $run ) ) { dtb_schematics_workspace_redirect( $id, $run->get_error_message(), 'error' ); } $result = (array) ( $run['result'] ?? [] ); $ok = 'completed' === ( $run['status'] ?? '' ) && empty( $result['failed'] ) && empty( $result['unresolved'] ); dtb_schematics_workspace_redirect( $id, $ok ? __( 'Operation run completed.', 'drywall-toolbox' ) : (string) ( $run['error'] ?? __( 'Operation completed with unresolved or failed items.', 'drywall-toolbox' ) ), $ok ? 'success' : 'error', $run['id'] ); }
function dtb_schematics_workspace_redirect( int $id, string $notice, string $type = 'success', string $run_id = '' ): void { $args = [ 'view' => $id ? 'record' : 'operations', 'dtb_schematics_notice' => $notice, 'dtb_schematics_notice_type' => $type ]; if ( $id ) { $args['schematic_id'] = $id; } if ( $run_id ) { $args['run_id'] = sanitize_text_field( $run_id ); } wp_safe_redirect( dtb_schematics_workspace_url( $args ) ); exit; }
