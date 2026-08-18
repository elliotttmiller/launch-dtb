<?php
/**
 * DTB Schematics — consolidated hotspot resolver workflow.
 *
 * One operator workflow: generate a truthful read-only pre-apply report,
 * review it, explicitly approve it, then run the existing deterministic
 * migration/resolution pipeline. Underlying source, resolver, repository and
 * operation services remain the authorities; this file is transport/UI only.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_SCHEMATIC_HOTSPOT_REPORT_NONCE_ACTION = 'dtb_schematic_hotspot_export_report';
const DTB_SCHEMATIC_HOTSPOT_WORKFLOW_NONCE_ACTION = 'dtb_schematic_hotspot_workflow';
const DTB_SCHEMATIC_HOTSPOT_REPORT_SCHEMA_VERSION = 2;
const DTB_SCHEMATIC_HOTSPOT_REPORT_MAX_AUDIT_PAGES = 50;
const DTB_SCHEMATIC_HOTSPOT_WORKFLOW_UI_GROUP_LIMIT = 200;

// Keep the existing resolver transport loaded for compatibility, but replace
// its page with this single end-to-end operator workflow.
remove_action( 'admin_menu', 'dtb_schematic_hotspot_resolver_register_page', 6 );
add_action( 'admin_menu', 'dtb_schematic_hotspot_workflow_register_page', 6 );
remove_action( 'admin_notices', 'dtb_schematic_hotspot_source_audit_render_panel' );
remove_action( 'admin_notices', 'dtb_schematic_hotspot_optimizer_render_panel' );

add_action( 'admin_post_dtb_schematic_hotspot_workflow_preview', 'dtb_schematic_hotspot_workflow_handle_preview' );
add_action( 'admin_post_dtb_schematic_hotspot_workflow_apply', 'dtb_schematic_hotspot_workflow_handle_apply' );
add_action( 'admin_post_dtb_schematic_hotspot_export_report', 'dtb_schematic_hotspot_workflow_export_report' );

function dtb_schematic_hotspot_workflow_register_page(): void {
	if ( ! function_exists( 'dtb_register_admin_page' ) ) {
		return;
	}
	dtb_register_admin_page(
		[
			'library'    => 'tools',
			'slug'       => DTB_SCHEMATIC_HOTSPOT_RESOLVER_SLUG,
			'title'      => __( 'Hotspot Resolver', 'drywall-toolbox' ),
			'menu_title' => __( 'Hotspot Resolver', 'drywall-toolbox' ),
			'capability' => 'dtb_manage_schematics',
			'callback'   => 'dtb_schematic_hotspot_workflow_render_page',
			'position'   => 11,
			'template'   => 'tool',
			'section'    => 'Catalog Maintenance',
		]
	);
}

/** Generate the mandatory read-only pre-apply report. */
function dtb_schematic_hotspot_workflow_handle_preview(): void {
	if ( ! dtb_schematics_can_manage() ) {
		wp_die( esc_html__( 'You do not have permission to manage schematics.', 'drywall-toolbox' ), 403 );
	}
	check_admin_referer( DTB_SCHEMATIC_HOTSPOT_WORKFLOW_NONCE_ACTION . ':preview', '_dtb_hotspot_workflow_nonce' );

	$run = dtb_schematic_run_operation(
		[
			'kind'        => DTB_SCHEMATIC_OPERATION_OPTIMIZE_HOTSPOTS,
			'dry_run'     => true,
			'all_records' => true,
			'per_page'    => DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_PER_PAGE,
			'operator_id' => get_current_user_id(),
		]
	);
	dtb_schematic_hotspot_workflow_redirect_from_run( $run, 'preview_run_id' );
}

/** Apply only after an operator explicitly approves a completed preview run. */
function dtb_schematic_hotspot_workflow_handle_apply(): void {
	if ( ! dtb_schematics_can_manage() ) {
		wp_die( esc_html__( 'You do not have permission to manage schematics.', 'drywall-toolbox' ), 403 );
	}

	$preview_run_id = sanitize_text_field( wp_unslash( $_POST['preview_run_id'] ?? '' ) );
	check_admin_referer( DTB_SCHEMATIC_HOTSPOT_WORKFLOW_NONCE_ACTION . ':apply:' . $preview_run_id, '_dtb_hotspot_workflow_nonce' );

	$approved = '1' === (string) ( $_POST['approve_report'] ?? '' );
	$preview  = dtb_schematic_operation_run_get_for_operator( $preview_run_id, get_current_user_id() );
	if ( ! $approved ) {
		dtb_schematic_hotspot_workflow_redirect_error( __( 'Review and approve the pre-apply report before running Apply.', 'drywall-toolbox' ), $preview_run_id );
	}
	if ( ! $preview
		|| DTB_SCHEMATIC_OPERATION_OPTIMIZE_HOTSPOTS !== (string) ( $preview['kind'] ?? '' )
		|| empty( $preview['dry_run'] )
		|| 'completed' !== (string) ( $preview['status'] ?? '' )
		|| ! empty( $preview['error'] ) ) {
		dtb_schematic_hotspot_workflow_redirect_error( __( 'The selected pre-apply report is not a completed, successful preview owned by this operator. Generate a new report.', 'drywall-toolbox' ), '' );
	}

	$run = dtb_schematic_run_operation(
		[
			'kind'        => DTB_SCHEMATIC_OPERATION_OPTIMIZE_HOTSPOTS,
			'dry_run'     => false,
			'all_records' => true,
			'per_page'    => DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_PER_PAGE,
			'operator_id' => get_current_user_id(),
		]
	);
	dtb_schematic_hotspot_workflow_redirect_from_run( $run, 'apply_run_id', $preview_run_id );
}

function dtb_schematic_hotspot_workflow_redirect_from_run( $run, string $arg, string $preview_run_id = '' ): void {
	if ( is_wp_error( $run ) ) {
		dtb_schematic_hotspot_workflow_redirect_error( $run->get_error_message(), $preview_run_id );
	}
	$args = [
		'page' => DTB_SCHEMATIC_HOTSPOT_RESOLVER_SLUG,
		$arg   => sanitize_text_field( (string) ( $run['id'] ?? '' ) ),
	];
	if ( '' !== $preview_run_id ) {
		$args['preview_run_id'] = $preview_run_id;
	}
	wp_safe_redirect( add_query_arg( $args, admin_url( 'admin.php' ) ) . '#dtb-hotspot-workflow' );
	exit;
}

function dtb_schematic_hotspot_workflow_redirect_error( string $message, string $preview_run_id = '' ): void {
	$args = [
		'page'           => DTB_SCHEMATIC_HOTSPOT_RESOLVER_SLUG,
		'workflow_error' => sanitize_text_field( $message ),
	];
	if ( '' !== $preview_run_id ) {
		$args['preview_run_id'] = $preview_run_id;
	}
	wp_safe_redirect( add_query_arg( $args, admin_url( 'admin.php' ) ) . '#dtb-hotspot-workflow' );
	exit;
}

/** Render one workflow: Analyze -> Review/Approve -> Apply -> Export. */
function dtb_schematic_hotspot_workflow_render_page(): void {
	if ( ! dtb_schematics_can_manage() ) {
		wp_die( esc_html__( 'You do not have permission to manage schematics.', 'drywall-toolbox' ), 403 );
	}

	$preview_id = sanitize_text_field( wp_unslash( $_GET['preview_run_id'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only run selection.
	$apply_id   = sanitize_text_field( wp_unslash( $_GET['apply_run_id'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only run selection.
	$error      = sanitize_text_field( wp_unslash( $_GET['workflow_error'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- escaped message.
	$preview    = '' !== $preview_id ? dtb_schematic_operation_run_get_for_operator( $preview_id, get_current_user_id() ) : null;
	$apply      = '' !== $apply_id ? dtb_schematic_operation_run_get_for_operator( $apply_id, get_current_user_id() ) : null;

	echo '<main class="wrap dtb-hotspot-resolver" id="dtb-hotspot-workflow">';
	echo '<header class="dtb-hotspot-resolver__hero"><div><span class="dtb-hotspot-resolver__eyebrow">' . esc_html__( 'Single end-to-end workflow', 'drywall-toolbox' ) . '</span><h1>' . esc_html__( 'Schematic Hotspot Resolver', 'drywall-toolbox' ) . '</h1><p>' . esc_html__( 'Generate one complete pre-apply report from current frontend/public/brands data and WooCommerce, audit it, explicitly approve it, then run the same resolver in Apply mode. No separate diagnostic, audit, synchronization, or optimizer workflow is required.', 'drywall-toolbox' ) . '</p></div><a class="button" href="' . esc_url( admin_url( 'admin.php?page=dtb-schematics&view=operations' ) ) . '">' . esc_html__( 'Operations history', 'drywall-toolbox' ) . '</a></header>';

	echo '<section class="dtb-hotspot-optimizer">';
	echo '<div class="dtb-hotspot-optimizer__head"><div><h2>' . esc_html__( '1. Generate pre-apply report', 'drywall-toolbox' ) . '</h2><p>' . esc_html__( 'Read-only. It evaluates every authoritative schematic record, source-file integrity, projection drift, deterministic mapping potential, unresolved relationships, root causes, and reliable review evidence. Nothing is written.', 'drywall-toolbox' ) . '</p></div>';
	dtb_schematic_hotspot_workflow_render_preview_form();
	echo '</div>';
	echo '<div class="dtb-hotspot-optimizer__contract"><strong>' . esc_html__( 'Safe-write boundary', 'drywall-toolbox' ) . '</strong><span>' . esc_html__( 'Apply can synchronize schematic hotspot projections and persist exact SKU / brand+MPN / explicit compatibility relationships only. It never creates products, rewrites protected SKU/MPN/GTIN/brand identifiers, or auto-links similarity-only candidates.', 'drywall-toolbox' ) . '</span></div>';

	if ( '' !== $error ) {
		echo '<div class="notice notice-error inline"><p>' . esc_html( $error ) . '</p></div>';
	}
	if ( ! $preview ) {
		echo '<section class="dtb-hotspot-resolver__empty"><h2>' . esc_html__( 'No pre-apply report yet', 'drywall-toolbox' ) . '</h2><p>' . esc_html__( 'Generate the report first. Apply is intentionally unavailable until a successful report exists and is explicitly approved.', 'drywall-toolbox' ) . '</p></section></section></main>';
		return;
	}

	$preview_result = dtb_schematic_hotspot_workflow_normalize_result( (array) ( $preview['result'] ?? [] ) );
	dtb_schematic_hotspot_workflow_render_report( $preview, $preview_result, true );

	if ( 'completed' === (string) ( $preview['status'] ?? '' ) && empty( $preview['error'] ) ) {
		dtb_schematic_hotspot_workflow_render_apply_approval( $preview, $preview_result );
	}

	if ( $apply ) {
		$apply_result = dtb_schematic_hotspot_workflow_normalize_result( (array) ( $apply['result'] ?? [] ) );
		dtb_schematic_hotspot_workflow_render_report( $apply, $apply_result, false );
		dtb_schematic_hotspot_workflow_render_export_form( $apply );
	} else {
		dtb_schematic_hotspot_workflow_render_export_form( $preview );
	}
	echo '</section></main>';
}

function dtb_schematic_hotspot_workflow_render_preview_form(): void {
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="dtb-hotspot-optimizer__form">';
	echo '<input type="hidden" name="action" value="dtb_schematic_hotspot_workflow_preview">';
	wp_nonce_field( DTB_SCHEMATIC_HOTSPOT_WORKFLOW_NONCE_ACTION . ':preview', '_dtb_hotspot_workflow_nonce' );
	echo '<button type="submit" class="button button-primary">' . esc_html__( 'Generate full pre-apply report', 'drywall-toolbox' ) . '</button></form>';
}

function dtb_schematic_hotspot_workflow_render_apply_approval( array $preview, array $result ): void {
	$run_id  = (string) ( $preview['id'] ?? '' );
	$metrics = (array) ( $result['metrics'] ?? [] );
	$projected = (int) ( $metrics['projected_exact_repairs'] ?? 0 );
	$drift     = (int) ( $metrics['source_drift_before'] ?? 0 );
	$errors    = (int) ( $metrics['source_read_errors'] ?? 0 );

	echo '<section class="dtb-hotspot-resolver__bulk"><div><strong>' . esc_html__( '2. Review and approve Apply', 'drywall-toolbox' ) . '</strong><p>' . esc_html( sprintf( __( 'This report projects %1$d new exact mapping(s), %2$d drifted record(s), and %3$d source read error(s). Review the report and remediation queue below before approval.', 'drywall-toolbox' ), $projected, $drift, $errors ) ) . '</p></div>';
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="dtb-hotspot-optimizer__form">';
	echo '<input type="hidden" name="action" value="dtb_schematic_hotspot_workflow_apply"><input type="hidden" name="preview_run_id" value="' . esc_attr( $run_id ) . '">';
	wp_nonce_field( DTB_SCHEMATIC_HOTSPOT_WORKFLOW_NONCE_ACTION . ':apply:' . $run_id, '_dtb_hotspot_workflow_nonce' );
	echo '<label style="display:block;margin-bottom:8px"><input type="checkbox" name="approve_report" value="1" required> ' . esc_html__( 'I reviewed this pre-apply report and approve the deterministic Apply workflow.', 'drywall-toolbox' ) . '</label>';
	echo '<button type="submit" class="button button-primary">' . esc_html__( 'Approve & apply full resolver', 'drywall-toolbox' ) . '</button></form></section>';
}

function dtb_schematic_hotspot_workflow_render_export_form( array $run ): void {
	$run_id = (string) ( $run['id'] ?? '' );
	if ( '' === $run_id ) {
		return;
	}
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="dtb-hotspot-optimizer__form" style="margin-top:16px">';
	echo '<input type="hidden" name="action" value="dtb_schematic_hotspot_export_report"><input type="hidden" name="run_id" value="' . esc_attr( $run_id ) . '">';
	wp_nonce_field( DTB_SCHEMATIC_HOTSPOT_REPORT_NONCE_ACTION . ':' . $run_id, '_dtb_hotspot_report_nonce' );
	echo '<button type="submit" class="button">' . esc_html__( 'Export full report (.json)', 'drywall-toolbox' ) . '</button></form>';
}

/** Reduce noisy candidate evidence without changing the deterministic resolver. */
function dtb_schematic_hotspot_workflow_normalize_result( array $result ): array {
	$groups = [];
	foreach ( (array) ( $result['resolution_groups'] ?? [] ) as $group ) {
		$groups[] = dtb_schematic_hotspot_workflow_normalize_group( (array) $group );
	}
	usort( $groups, static function ( array $a, array $b ): int {
		$priority = [ 'source_unavailable' => 0, 'source_sync_required' => 1, 'strong_review_candidate' => 2, 'catalog_identity_gap' => 3, 'source_identifier_gap' => 4 ];
		$pa = $priority[ $a['issue_code'] ] ?? 9;
		$pb = $priority[ $b['issue_code'] ] ?? 9;
		if ( $pa !== $pb ) { return $pa <=> $pb; }
		return ( (int) ( $b['relationship_count'] ?? 0 ) + (int) ( $b['occurrences'] ?? 0 ) ) <=> ( (int) ( $a['relationship_count'] ?? 0 ) + (int) ( $a['occurrences'] ?? 0 ) );
	} );
	$counts = [];
	foreach ( $groups as $group ) {
		$code = (string) ( $group['issue_code'] ?? 'unclassified' );
		$counts[ $code ] = (int) ( $counts[ $code ] ?? 0 ) + (int) ( $group['relationship_count'] ?? 1 );
	}
	ksort( $counts );
	$result['resolution_groups'] = $groups;
	$result['reason_counts'] = $counts;
	$result['metrics']['resolution_groups'] = count( $groups );
	return $result;
}

function dtb_schematic_hotspot_workflow_normalize_group( array $group ): array {
	$code = (string) ( $group['issue_code'] ?? '' );
	if ( in_array( $code, [ 'source_unavailable', 'source_sync_required' ], true ) ) {
		return $group;
	}
	$brand = dtb_schematic_hotspot_workflow_brand_key( (string) ( $group['brand'] ?? '' ) );
	$sku   = trim( (string) ( $group['sku'] ?? '' ) );
	$mpn   = trim( (string) ( $group['mpn'] ?? '' ) );
	$title = trim( (string) ( $group['title'] ?? '' ) );
	$reliable = [];
	foreach ( (array) ( $group['candidates'] ?? [] ) as $candidate ) {
		$candidate = (array) $candidate;
		$cbrand = dtb_schematic_hotspot_workflow_brand_key( (string) ( $candidate['brand'] ?? '' ) );
		$csku = trim( (string) ( $candidate['sku'] ?? '' ) );
		$cmpn = trim( (string) ( $candidate['mpn'] ?? '' ) );
		$sku_exact = '' !== $sku && '' !== $csku && 0 === strcasecmp( $sku, $csku );
		$mpn_exact = '' !== $mpn && '' !== $cmpn && 0 === strcasecmp( $mpn, $cmpn );
		$title_score = dtb_schematic_hotspot_workflow_title_score( $title, (string) ( $candidate['name'] ?? '' ) );
		if ( $sku_exact || $mpn_exact || ( '' !== $brand && $brand === $cbrand && $title_score >= 0.60 ) ) {
			$candidate['evidence'] = $sku_exact ? 'exact_sku' : ( $mpn_exact ? 'exact_mpn' : 'same_brand_title' );
			$reliable[] = $candidate;
		}
	}
	$group['candidates'] = array_slice( $reliable, 0, 3 );
	if ( $group['candidates'] ) {
		$group['issue_code'] = 'strong_review_candidate';
		$group['issue_label'] = __( 'Strong review candidate', 'drywall-toolbox' );
		$group['recommended_fix'] = __( 'Verify the candidate identity. If confirmed, use the existing explicit-link path or correct authoritative catalog/source metadata, then rerun the resolver.', 'drywall-toolbox' );
	} elseif ( '' === $sku && ( '' === $mpn || 0 === strcasecmp( $mpn, (string) ( $group['part_ref'] ?? '' ) ) ) ) {
		$group['issue_code'] = 'source_identifier_gap';
		$group['issue_label'] = __( 'Source identifier gap', 'drywall-toolbox' );
		$group['recommended_fix'] = __( 'The source lacks a sufficiently strong manufacturer identifier. Correct the authoritative schematic source data before rerunning.', 'drywall-toolbox' );
	} else {
		$group['issue_code'] = 'catalog_identity_gap';
		$group['issue_label'] = __( 'Catalog identity gap', 'drywall-toolbox' );
		$group['recommended_fix'] = __( 'The source provides an identifier, but no deterministic WooCommerce relationship exists. Verify that the product exists and its protected SKU/MPN/brand metadata is correct, then rerun.', 'drywall-toolbox' );
	}
	return $group;
}

function dtb_schematic_hotspot_workflow_brand_key( string $brand ): string {
	$key = strtolower( preg_replace( '/[^a-z0-9]+/i', '', $brand ) ?: '' );
	foreach ( [ 'drywalltools', 'drywalltool', 'tools', 'tool' ] as $suffix ) {
		if ( strlen( $key ) > strlen( $suffix ) && str_ends_with( $key, $suffix ) ) { $key = substr( $key, 0, -strlen( $suffix ) ); }
	}
	return $key;
}

function dtb_schematic_hotspot_workflow_title_score( string $a, string $b ): float {
	$tokenize = static function ( string $value ): array {
		$value = strtolower( preg_replace( '/[^a-z0-9]+/i', ' ', $value ) ?: '' );
		$stop = [ 'part', 'assembly', 'the', 'for', 'and', 'with' ];
		return array_values( array_unique( array_filter( preg_split( '/\s+/', trim( $value ) ) ?: [], static fn( $token ) => strlen( $token ) >= 3 && ! in_array( $token, $stop, true ) ) ) );
	};
	$left = $tokenize( $a ); $right = $tokenize( $b );
	if ( ! $left || ! $right ) { return 0.0; }
	$union = count( array_unique( array_merge( $left, $right ) ) );
	return $union ? count( array_intersect( $left, $right ) ) / $union : 0.0;
}

/** Render either the truthful pre-apply report or the post-apply result. */
function dtb_schematic_hotspot_workflow_render_report( array $run, array $result, bool $pre_apply ): void {
	$metrics = (array) ( $result['metrics'] ?? [] );
	$mapping_count = $pre_apply ? (int) ( $metrics['projected_exact_repairs'] ?? 0 ) : (int) ( $metrics['applied_exact_repairs'] ?? 0 );
	$remaining = (int) ( $metrics['remaining_unresolved'] ?? $result['unresolved'] ?? 0 );
	$mode = $pre_apply ? __( 'Pre-apply · read-only', 'drywall-toolbox' ) : __( 'Applied', 'drywall-toolbox' );

	echo '<div class="dtb-hotspot-optimizer__result"><div class="dtb-hotspot-optimizer__result-head"><div><span class="dtb-hotspot-optimizer__run-mode">' . esc_html( $mode ) . '</span><h3>' . esc_html( $pre_apply ? __( 'Full pre-apply audit report', 'drywall-toolbox' ) : __( 'Post-apply resolver result', 'drywall-toolbox' ) ) . '</h3><code>' . esc_html( (string) ( $run['id'] ?? '' ) ) . '</code></div><span class="dtb-hotspot-optimizer__run-status dtb-hotspot-optimizer__run-status--' . esc_attr( ! empty( $run['error'] ) ? 'error' : 'ok' ) . '">' . esc_html( (string) ( $run['status'] ?? '' ) ) . '</span></div>';
	if ( ! empty( $run['error'] ) ) { echo '<div class="notice notice-error inline"><p>' . esc_html( (string) $run['error'] ) . '</p></div>'; }

	$headline = $pre_apply
		? sprintf( _n( '%d new exact mapping is projected.', '%d new exact mappings are projected.', $mapping_count, 'drywall-toolbox' ), $mapping_count )
		: sprintf( _n( '%d new exact mapping was written.', '%d new exact mappings were written.', $mapping_count, 'drywall-toolbox' ), $mapping_count );
	echo '<section class="dtb-hotspot-resolver__bulk"><div><strong>' . esc_html( $headline ) . '</strong><p>' . esc_html( sprintf( __( '%1$d relationship(s)/workflow issue(s) remain unresolved. Exact-source signals are reported separately and are not counted as new writes.', 'drywall-toolbox' ), $remaining ) ) . '</p></div></section>';

	$cards = [
		[ __( 'Records', 'drywall-toolbox' ), (int) ( $result['examined'] ?? 0 ) ],
		[ __( 'Source files', 'drywall-toolbox' ), (int) ( $metrics['source_files'] ?? 0 ) ],
		[ __( 'Source parts', 'drywall-toolbox' ), (int) ( $metrics['source_parts'] ?? 0 ) ],
		[ __( 'Hotspots', 'drywall-toolbox' ), (int) ( $metrics['source_hotspots'] ?? 0 ) ],
		[ $pre_apply ? __( 'Projected mappings', 'drywall-toolbox' ) : __( 'New mappings', 'drywall-toolbox' ), $mapping_count ],
		[ __( 'Exactly resolvable signal', 'drywall-toolbox' ), (int) ( $metrics['exactly_resolvable'] ?? 0 ) ],
		[ __( 'Remaining unresolved', 'drywall-toolbox' ), $remaining ],
		[ __( 'Drifted records', 'drywall-toolbox' ), (int) ( $metrics['source_drift_before'] ?? 0 ) ],
		[ __( 'Source errors', 'drywall-toolbox' ), (int) ( $metrics['source_read_errors'] ?? 0 ) ],
		[ __( 'Remediation groups', 'drywall-toolbox' ), count( (array) ( $result['resolution_groups'] ?? [] ) ) ],
	];
	echo '<div class="dtb-hotspot-optimizer__metrics">';
	foreach ( $cards as $card ) { echo '<div><strong>' . esc_html( (string) $card[1] ) . '</strong><span>' . esc_html( $card[0] ) . '</span></div>'; }
	echo '</div>';

	if ( ! empty( $result['reason_counts'] ) ) {
		echo '<div class="dtb-hotspot-optimizer__reasons"><h4>' . esc_html__( 'Root-cause summary', 'drywall-toolbox' ) . '</h4><div class="dtb-hotspot-optimizer__reason-grid">';
		foreach ( (array) $result['reason_counts'] as $code => $count ) { echo '<div><code>' . esc_html( (string) $code ) . '</code><strong>' . esc_html( (string) (int) $count ) . '</strong></div>'; }
		echo '</div></div>';
	}

	if ( ! empty( $result['source_errors'] ) ) {
		echo '<details class="dtb-hotspot-optimizer__errors" open><summary>' . esc_html( sprintf( __( 'Source errors (%d)', 'drywall-toolbox' ), count( (array) $result['source_errors'] ) ) ) . '</summary><ul>';
		foreach ( (array) $result['source_errors'] as $item ) { echo '<li><code>' . esc_html( (string) ( $item['canonical_id'] ?? '' ) ) . '</code> — ' . esc_html( (string) ( $item['message'] ?? '' ) ) . '</li>'; }
		echo '</ul></details>';
	}

	$groups = (array) ( $result['resolution_groups'] ?? [] );
	if ( $groups ) {
		echo '<div class="dtb-hotspot-optimizer__queue"><div class="dtb-hotspot-optimizer__queue-head"><h4>' . esc_html__( 'Prioritized remediation queue', 'drywall-toolbox' ) . '</h4><p>' . esc_html__( 'Only reliable candidate evidence is shown. Similarity-only cross-brand noise is suppressed. The export contains the complete queue.', 'drywall-toolbox' ) . '</p></div><div class="dtb-hotspot-optimizer__table-wrap"><table class="widefat striped"><thead><tr><th>' . esc_html__( 'Issue', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'Source identity', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'Impact', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'Reliable evidence', 'drywall-toolbox' ) . '</th><th>' . esc_html__( 'Required fix', 'drywall-toolbox' ) . '</th></tr></thead><tbody>';
		foreach ( array_slice( $groups, 0, DTB_SCHEMATIC_HOTSPOT_WORKFLOW_UI_GROUP_LIMIT ) as $group ) { dtb_schematic_hotspot_workflow_render_group_row( (array) $group ); }
		echo '</tbody></table></div>';
		if ( count( $groups ) > DTB_SCHEMATIC_HOTSPOT_WORKFLOW_UI_GROUP_LIMIT ) { echo '<p class="description">' . esc_html( sprintf( __( '%d additional groups are included in the exported report.', 'drywall-toolbox' ), count( $groups ) - DTB_SCHEMATIC_HOTSPOT_WORKFLOW_UI_GROUP_LIMIT ) ) . '</p>'; }
		echo '</div>';
	}
	echo '</div>';
}

function dtb_schematic_hotspot_workflow_render_group_row( array $group ): void {
	$identity = array_filter( [ (string) ( $group['brand'] ?? '' ), ! empty( $group['sku'] ) ? 'SKU ' . $group['sku'] : '', ! empty( $group['mpn'] ) ? 'MPN ' . $group['mpn'] : '' ] );
	echo '<tr><td><strong>' . esc_html( (string) ( $group['issue_label'] ?? '' ) ) . '</strong><br><code>' . esc_html( (string) ( $group['issue_code'] ?? '' ) ) . '</code></td><td><strong>' . esc_html( (string) ( $group['title'] ?? $group['part_ref'] ?? '' ) ) . '</strong><br>' . esc_html( implode( ' · ', $identity ) ) . '</td><td>' . esc_html( sprintf( __( '%1$d relationship(s) · %2$d hotspot occurrence(s)', 'drywall-toolbox' ), (int) ( $group['relationship_count'] ?? 0 ), (int) ( $group['occurrences'] ?? 0 ) ) ) . '<br><small>' . esc_html( implode( ', ', array_slice( (array) ( $group['schematics'] ?? [] ), 0, 5 ) ) ) . '</small></td><td>';
	if ( ! empty( $group['candidates'] ) ) {
		foreach ( (array) $group['candidates'] as $candidate ) { echo '<div class="dtb-hotspot-optimizer__candidate"><strong>#' . esc_html( (string) (int) ( $candidate['id'] ?? 0 ) ) . ' ' . esc_html( (string) ( $candidate['name'] ?? '' ) ) . '</strong><span>' . esc_html( (string) ( $candidate['brand'] ?? '' ) . ' · SKU ' . (string) ( $candidate['sku'] ?? '—' ) . ' · MPN ' . (string) ( $candidate['mpn'] ?? '—' ) ) . '</span><code>' . esc_html( (string) ( $candidate['evidence'] ?? '' ) ) . '</code></div>'; }
	} else { echo '<span class="dtb-hotspot-optimizer__none">' . esc_html__( 'No reliable candidate evidence', 'drywall-toolbox' ) . '</span>'; }
	echo '</td><td>' . esc_html( (string) ( $group['recommended_fix'] ?? '' ) ) . '</td></tr>';
}

/** Full current-source audit included in every exported report. */
function dtb_schematic_hotspot_workflow_collect_source_audit(): array {
	$aggregate = [
		'records_examined' => 0, 'source_files_examined' => 0, 'source_read_errors' => 0, 'source_missing' => 0,
		'source_drift_records' => 0, 'source_parts' => 0, 'source_hotspots' => 0, 'source_only_parts' => 0,
		'stored_only_parts' => 0, 'dangling_hotspots' => 0, 'invalid_hotspots' => 0, 'duplicate_hotspot_ids' => 0,
		'page_mismatches' => 0, 'exactly_resolvable' => 0, 'unresolved_at_source' => 0, 'items' => [], 'truncated' => false,
	];
	for ( $page = 1; $page <= DTB_SCHEMATIC_HOTSPOT_REPORT_MAX_AUDIT_PAGES; $page++ ) {
		$batch = dtb_schematic_hotspot_source_audit_scan( [ 'page' => $page, 'per_page' => DTB_SCHEMATIC_SOURCE_AUDIT_MAX_RECORDS, 'schematic_id' => 0, 'search' => '' ] );
		foreach ( array_keys( $aggregate ) as $key ) {
			if ( in_array( $key, [ 'items', 'truncated' ], true ) ) { continue; }
			$aggregate[ $key ] += (int) ( $batch[ $key ] ?? 0 );
		}
		foreach ( (array) ( $batch['items'] ?? [] ) as $item ) { $aggregate['items'][] = $item; }
		if ( (int) ( $batch['records_examined'] ?? 0 ) < DTB_SCHEMATIC_SOURCE_AUDIT_MAX_RECORDS ) { break; }
		if ( DTB_SCHEMATIC_HOTSPOT_REPORT_MAX_AUDIT_PAGES === $page ) { $aggregate['truncated'] = true; }
	}
	return $aggregate;
}

/** Export either the pre-apply or post-apply report without mutating state. */
function dtb_schematic_hotspot_workflow_export_report(): void {
	if ( ! dtb_schematics_can_manage() ) { wp_die( esc_html__( 'You do not have permission to manage schematics.', 'drywall-toolbox' ), 403 ); }
	$run_id = sanitize_text_field( wp_unslash( $_POST['run_id'] ?? '' ) );
	check_admin_referer( DTB_SCHEMATIC_HOTSPOT_REPORT_NONCE_ACTION . ':' . $run_id, '_dtb_hotspot_report_nonce' );
	$run = dtb_schematic_operation_run_get_for_operator( $run_id, get_current_user_id() );
	if ( ! $run || DTB_SCHEMATIC_OPERATION_OPTIMIZE_HOTSPOTS !== (string) ( $run['kind'] ?? '' ) ) { wp_die( esc_html__( 'The requested hotspot workflow report is unavailable for this operator.', 'drywall-toolbox' ), 404 ); }

	$result = dtb_schematic_hotspot_workflow_normalize_result( (array) ( $run['result'] ?? [] ) );
	$metrics = (array) ( $result['metrics'] ?? [] );
	$dry_run = ! empty( $run['dry_run'] );
	$report = [
		'schema_version' => DTB_SCHEMATIC_HOTSPOT_REPORT_SCHEMA_VERSION,
		'report_type' => $dry_run ? 'dtb_schematic_hotspot_pre_apply' : 'dtb_schematic_hotspot_post_apply',
		'generated_at' => gmdate( 'c' ),
		'authority' => [
			'schematic_source' => 'frontend/public/brands schematic_data*.json via approved reader/normalizer/merge pipeline',
			'product_source' => 'WooCommerce',
			'automatic_resolution_contract' => 'exact SKU / brand+MPN / explicit compatibility only',
			'protected_identifiers_mutated' => false,
			'fuzzy_matches_auto_applied' => false,
		],
		'run' => [ 'id' => (string) ( $run['id'] ?? '' ), 'mode' => $dry_run ? 'pre_apply' : 'apply', 'status' => (string) ( $run['status'] ?? '' ), 'operator_id' => (int) ( $run['operator_id'] ?? 0 ), 'created_at' => (string) ( $run['created_at'] ?? '' ), 'completed_at' => (string) ( $run['completed_at'] ?? '' ), 'error' => (string) ( $run['error'] ?? '' ) ],
		'mapping_outcome' => [
			'projected_new_exact_mappings' => $dry_run ? (int) ( $metrics['projected_exact_repairs'] ?? 0 ) : 0,
			'new_exact_mappings_written' => $dry_run ? 0 : (int) ( $metrics['applied_exact_repairs'] ?? 0 ),
			'exactly_resolvable_signal' => (int) ( $metrics['exactly_resolvable'] ?? 0 ),
			'remaining_unresolved_relationships' => (int) ( $metrics['remaining_unresolved'] ?? $result['unresolved'] ?? 0 ),
		],
		'resolver' => $result,
		'source_truth' => dtb_schematic_hotspot_workflow_collect_source_audit(),
	];
	$filename = 'dtb-hotspot-' . ( $dry_run ? 'pre-apply-' : 'post-apply-' ) . preg_replace( '/[^a-z0-9-]/', '', strtolower( $run_id ) ) . '.json';
	nocache_headers(); header( 'Content-Type: application/json; charset=utf-8' ); header( 'X-Content-Type-Options: nosniff' ); header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
	echo wp_json_encode( $report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON response.
	exit;
}
