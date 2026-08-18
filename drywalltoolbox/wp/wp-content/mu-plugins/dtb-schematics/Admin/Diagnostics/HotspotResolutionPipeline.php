<?php
/**
 * DTB Schematics — unified hotspot resolution pipeline UI/transport.
 *
 * One admin workflow: build plan -> review/export -> approve -> freshness
 * check -> apply -> verify/export. Existing diagnostic panels remain internal
 * implementation dependencies and are not separate operator workflows.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_SCHEMATIC_HOTSPOT_PIPELINE_NONCE = 'dtb_schematic_hotspot_pipeline';

remove_action( 'admin_menu', 'dtb_schematic_hotspot_workflow_register_page', 6 );
add_action( 'admin_menu', 'dtb_schematic_hotspot_pipeline_register_page', 7 );
add_action( 'admin_post_dtb_hotspot_pipeline_build', 'dtb_schematic_hotspot_pipeline_build' );
add_action( 'admin_post_dtb_hotspot_pipeline_apply', 'dtb_schematic_hotspot_pipeline_apply' );
add_action( 'admin_post_dtb_hotspot_pipeline_export', 'dtb_schematic_hotspot_pipeline_export' );

function dtb_schematic_hotspot_pipeline_register_page(): void {
	if ( ! function_exists( 'dtb_register_admin_page' ) ) {
		return;
	}
	dtb_register_admin_page( [
		'library' => 'tools', 'slug' => DTB_SCHEMATIC_HOTSPOT_RESOLVER_SLUG,
		'title' => __( 'Hotspot Resolver', 'drywall-toolbox' ), 'menu_title' => __( 'Hotspot Resolver', 'drywall-toolbox' ),
		'capability' => 'dtb_manage_schematics', 'callback' => 'dtb_schematic_hotspot_pipeline_render',
		'position' => 11, 'template' => 'tool', 'section' => 'Catalog Maintenance',
	] );
}

function dtb_schematic_hotspot_pipeline_build(): void {
	if ( ! dtb_schematics_can_manage() ) { wp_die( esc_html__( 'You do not have permission to manage schematics.', 'drywall-toolbox' ), 403 ); }
	check_admin_referer( DTB_SCHEMATIC_HOTSPOT_PIPELINE_NONCE . ':build', '_dtb_pipeline_nonce' );
	$run = dtb_schematic_run_operation( [
		'kind' => DTB_SCHEMATIC_OPERATION_OPTIMIZE_HOTSPOTS, 'dry_run' => true, 'all_records' => true,
		'per_page' => DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_PER_PAGE, 'operator_id' => get_current_user_id(),
	] );
	dtb_schematic_hotspot_pipeline_redirect_run( $run, 'plan_run_id' );
}

function dtb_schematic_hotspot_pipeline_apply(): void {
	if ( ! dtb_schematics_can_manage() ) { wp_die( esc_html__( 'You do not have permission to manage schematics.', 'drywall-toolbox' ), 403 ); }
	$run_id = sanitize_text_field( wp_unslash( $_POST['plan_run_id'] ?? '' ) );
	check_admin_referer( DTB_SCHEMATIC_HOTSPOT_PIPELINE_NONCE . ':apply:' . $run_id, '_dtb_pipeline_nonce' );
	$run = dtb_schematic_operation_run_get_for_operator( $run_id, get_current_user_id() );
	if ( ! is_array( $run ) || empty( $run['dry_run'] ) || 'completed' !== (string) ( $run['status'] ?? '' ) || ! empty( $run['error'] ) ) {
		dtb_schematic_hotspot_pipeline_redirect_error( 'The selected pre-apply plan is not eligible for Apply.' );
	}
	if ( '1' !== (string) ( $_POST['approve_plan'] ?? '' ) ) {
		dtb_schematic_hotspot_pipeline_redirect_error( 'Review and explicitly approve the complete plan before Apply.', $run_id );
	}
	$approved_result = (array) ( $run['result'] ?? [] );
	$approved_plan   = dtb_schematic_hotspot_build_resolution_plan( $approved_result );
	if ( empty( $approved_plan['can_apply'] ) ) {
		dtb_schematic_hotspot_pipeline_redirect_error( 'Apply is blocked because this plan contains no safe deterministic writes or has blocking integrity failures.', $run_id );
	}

	// Recompute from authoritative source + live WooCommerce immediately before commit.
	$fresh_result = dtb_schematic_hotspot_optimizer_run( [ 'dry_run' => true, 'per_page' => DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_PER_PAGE ] );
	$fresh_plan   = dtb_schematic_hotspot_build_resolution_plan( $fresh_result );
	$approved_fp  = (string) ( $approved_plan['fingerprint'] ?? '' );
	$fresh_fp     = (string) ( $fresh_plan['fingerprint'] ?? '' );
	if ( '' === $approved_fp || '' === $fresh_fp || ! hash_equals( $approved_fp, $fresh_fp ) || 'blocked' === (string) ( $fresh_plan['status'] ?? '' ) ) {
		dtb_schematic_hotspot_pipeline_redirect_error( 'Authoritative source/catalog state changed after approval, or the freshness check failed. No writes were made. Build and review a new plan.', '' );
	}

	$apply = dtb_schematic_run_operation( [
		'kind' => DTB_SCHEMATIC_OPERATION_OPTIMIZE_HOTSPOTS, 'dry_run' => false, 'all_records' => true,
		'per_page' => DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_PER_PAGE, 'operator_id' => get_current_user_id(),
	] );
	if ( is_wp_error( $apply ) ) { dtb_schematic_hotspot_pipeline_redirect_error( $apply->get_error_message(), $run_id ); }
	wp_safe_redirect( add_query_arg( [ 'page' => DTB_SCHEMATIC_HOTSPOT_RESOLVER_SLUG, 'plan_run_id' => $run_id, 'apply_run_id' => sanitize_text_field( (string) ( $apply['id'] ?? '' ) ) ], admin_url( 'admin.php' ) ) . '#dtb-hotspot-pipeline' );
	exit;
}

function dtb_schematic_hotspot_pipeline_export(): void {
	if ( ! dtb_schematics_can_manage() ) { wp_die( esc_html__( 'You do not have permission to manage schematics.', 'drywall-toolbox' ), 403 ); }
	$run_id = sanitize_text_field( wp_unslash( $_GET['run_id'] ?? '' ) );
	$type   = sanitize_key( (string) ( $_GET['artifact'] ?? 'report_json' ) );
	check_admin_referer( DTB_SCHEMATIC_HOTSPOT_PIPELINE_NONCE . ':export:' . $run_id, '_dtb_pipeline_nonce' );
	$run = dtb_schematic_operation_run_get_for_operator( $run_id, get_current_user_id() );
	if ( ! is_array( $run ) ) { wp_die( esc_html__( 'The requested resolver run is unavailable.', 'drywall-toolbox' ), 404 ); }
	$payload = dtb_schematic_hotspot_plan_export_payload( $run );
	$plan    = (array) ( $payload['plan'] ?? [] );

	if ( 'report_json' === $type ) {
		nocache_headers(); header( 'Content-Type: application/json; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="dtb-hotspot-resolution-' . sanitize_file_name( $run_id ) . '.json"' );
		echo wp_json_encode( $payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ); exit;
	}
	$map = [ 'catalog_csv' => 'catalog_corrections', 'source_csv' => 'source_corrections', 'manual_csv' => 'manual_review' ];
	if ( ! isset( $map[ $type ] ) ) { wp_die( esc_html__( 'Unsupported resolver artifact.', 'drywall-toolbox' ), 400 ); }
	$rows = (array) ( $plan['artifacts'][ $map[ $type ] ] ?? [] );
	nocache_headers(); header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="dtb-hotspot-' . sanitize_file_name( $map[ $type ] ) . '-' . sanitize_file_name( $run_id ) . '.csv"' );
	$out = fopen( 'php://output', 'w' );
	$columns = [ 'issue_code','issue_label','brand','part_ref','source_sku','source_display_id','part_name','relationship_count','hotspot_occurrences','schematics','candidate_evidence','required_action' ];
	fputcsv( $out, $columns );
	foreach ( $rows as $row ) { fputcsv( $out, array_map( static fn( $key ) => (string) ( $row[ $key ] ?? '' ), $columns ) ); }
	fclose( $out ); exit;
}

function dtb_schematic_hotspot_pipeline_render(): void {
	if ( ! dtb_schematics_can_manage() ) { wp_die( esc_html__( 'You do not have permission to manage schematics.', 'drywall-toolbox' ), 403 ); }
	$plan_id  = sanitize_text_field( wp_unslash( $_GET['plan_run_id'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$apply_id = sanitize_text_field( wp_unslash( $_GET['apply_run_id'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$error    = sanitize_text_field( wp_unslash( $_GET['pipeline_error'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$plan_run = '' !== $plan_id ? dtb_schematic_operation_run_get_for_operator( $plan_id, get_current_user_id() ) : null;
	$apply_run= '' !== $apply_id ? dtb_schematic_operation_run_get_for_operator( $apply_id, get_current_user_id() ) : null;

	echo '<main class="wrap dtb-hotspot-resolver" id="dtb-hotspot-pipeline"><h1>' . esc_html__( 'Schematic Hotspot Resolution Pipeline', 'drywall-toolbox' ) . '</h1>';
	echo '<p class="description">' . esc_html__( 'One workflow: analyze authoritative schematic sources and live WooCommerce, build every safe mapping and remediation artifact, review the complete plan, approve once, apply through the existing commit boundary, then verify the result.', 'drywall-toolbox' ) . '</p>';
	if ( '' !== $error ) { echo '<div class="notice notice-error inline"><p>' . esc_html( $error ) . '</p></div>'; }

	echo '<section class="dtb-hotspot-optimizer"><div class="dtb-hotspot-optimizer__head"><div><h2>1. Analyze & build complete plan</h2><p>Read-only. No schematic or catalog data is changed.</p></div>';
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="dtb_hotspot_pipeline_build">';
	wp_nonce_field( DTB_SCHEMATIC_HOTSPOT_PIPELINE_NONCE . ':build', '_dtb_pipeline_nonce' );
	echo '<button class="button button-primary" type="submit">' . esc_html__( 'Build full resolution plan', 'drywall-toolbox' ) . '</button></form></div></section>';

	if ( ! $plan_run ) { echo '<div class="dtb-hotspot-resolver__empty"><p>' . esc_html__( 'Build the plan to generate the complete audit, deterministic mapping set, upstream correction manifests, and manual-review queue.', 'drywall-toolbox' ) . '</p></div></main>'; return; }
	$plan = dtb_schematic_hotspot_build_resolution_plan( (array) ( $plan_run['result'] ?? [] ) );
	dtb_schematic_hotspot_pipeline_render_plan( $plan_run, $plan, true );
	if ( $apply_run ) {
		$post = dtb_schematic_hotspot_build_resolution_plan( (array) ( $apply_run['result'] ?? [] ) );
		echo '<hr><h2>4. Post-apply verification</h2>';
		dtb_schematic_hotspot_pipeline_render_plan( $apply_run, $post, false );
	}
	echo '</main>';
}

function dtb_schematic_hotspot_pipeline_render_plan( array $run, array $plan, bool $pre_apply ): void {
	$s = (array) ( $plan['summary'] ?? [] );
	$cards = [ 'Schematics' => 'schematics_examined', 'Source parts' => 'source_parts', 'Hotspots' => 'hotspot_occurrences', 'Proposed new mappings' => 'projected_new_mappings', 'Applied mappings' => 'applied_new_mappings', 'Active unresolved' => 'active_hotspot_unresolved', 'Catalog-only unresolved' => 'catalog_only_unresolved', 'Resolution groups' => 'resolution_groups' ];
	echo '<section class="dtb-hotspot-optimizer"><h2>' . esc_html( $pre_apply ? '2. Review complete pre-apply plan' : 'Verified result' ) . '</h2><div class="dtb-hotspot-optimizer__metrics">';
	foreach ( $cards as $label => $key ) { echo '<div class="dtb-hotspot-optimizer__metric"><strong>' . esc_html( number_format_i18n( (int) ( $s[ $key ] ?? 0 ) ) ) . '</strong><span>' . esc_html( $label ) . '</span></div>'; }
	echo '</div>';

	if ( ! empty( $plan['blockers'] ) ) { echo '<div class="notice notice-error inline"><p><strong>Apply blocked.</strong> Resolve the integrity failures below and rebuild the plan.</p><ul>'; foreach ( $plan['blockers'] as $b ) { echo '<li>' . esc_html( (string) ( $b['message'] ?? '' ) ) . '</li>'; } echo '</ul></div>'; }

	$repairs = (array) ( $plan['proposed_mappings'] ?? [] );
	echo '<h3>Deterministic mapping plan</h3>';
	if ( empty( $repairs ) ) { echo '<p>No new deterministic relationship writes are currently available.</p>'; }
	else { echo '<table class="widefat striped"><thead><tr><th>Schematic</th><th>Source part</th><th>Target product</th><th>Method</th></tr></thead><tbody>'; foreach ( array_slice( $repairs, 0, 250 ) as $r ) { echo '<tr><td>' . esc_html( (string) ( $r['canonical_id'] ?? $r['schematic_id'] ?? '' ) ) . '</td><td>' . esc_html( trim( (string) ( $r['source_sku'] ?? $r['sku'] ?? '' ) . ' ' . (string) ( $r['name'] ?? '' ) ) ) . '</td><td>' . esc_html( trim( '#' . (int) ( $r['product_id'] ?? 0 ) . ' ' . (string) ( $r['product_name'] ?? '' ) ) ) . '</td><td>' . esc_html( (string) ( $r['resolution_method'] ?? '' ) ) . '</td></tr>'; } echo '</tbody></table>'; }

	echo '<h3>Generated remediation artifacts</h3><p>These are correction manifests, not parallel authorities. Source/catalog identifiers are never rewritten by this pipeline.</p><div class="dtb-hotspot-optimizer__actions">';
	dtb_schematic_hotspot_pipeline_export_link( $run, 'report_json', 'Export complete JSON report' );
	dtb_schematic_hotspot_pipeline_export_link( $run, 'catalog_csv', 'Catalog corrections CSV' );
	dtb_schematic_hotspot_pipeline_export_link( $run, 'source_csv', 'Source corrections CSV' );
	dtb_schematic_hotspot_pipeline_export_link( $run, 'manual_csv', 'Manual review CSV' );
	echo '</div>';

	if ( $pre_apply ) {
		if ( ! empty( $plan['can_apply'] ) ) {
			echo '<section class="dtb-hotspot-resolver__bulk"><h2>3. Approve & apply</h2><p>Apply will recompute the complete plan from authoritative state and abort before mutation unless its fingerprint exactly matches this reviewed plan.</p><form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="dtb_hotspot_pipeline_apply"><input type="hidden" name="plan_run_id" value="' . esc_attr( (string) ( $run['id'] ?? '' ) ) . '">';
			wp_nonce_field( DTB_SCHEMATIC_HOTSPOT_PIPELINE_NONCE . ':apply:' . (string) ( $run['id'] ?? '' ), '_dtb_pipeline_nonce' );
			echo '<label><input type="checkbox" name="approve_plan" value="1" required> I reviewed the complete deterministic mapping plan and generated remediation artifacts.</label><p><button class="button button-primary" type="submit">Approve & apply resolution plan</button></p></form></section>';
		} else {
			echo '<div class="notice notice-info inline"><p><strong>Apply unavailable.</strong> There are no safe new mappings to write, or the plan has blocking integrity failures. Use the generated correction manifests, update the owning source/catalog data, then rebuild this same plan.</p></div>';
		}
	}
	echo '</section>';
}

function dtb_schematic_hotspot_pipeline_export_link( array $run, string $artifact, string $label ): void {
	$url = wp_nonce_url( add_query_arg( [ 'action' => 'dtb_hotspot_pipeline_export', 'run_id' => (string) ( $run['id'] ?? '' ), 'artifact' => $artifact ], admin_url( 'admin-post.php' ) ), DTB_SCHEMATIC_HOTSPOT_PIPELINE_NONCE . ':export:' . (string) ( $run['id'] ?? '' ), '_dtb_pipeline_nonce' );
	echo '<a class="button" href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a> ';
}

function dtb_schematic_hotspot_pipeline_redirect_run( $run, string $arg ): void {
	if ( is_wp_error( $run ) ) { dtb_schematic_hotspot_pipeline_redirect_error( $run->get_error_message() ); }
	wp_safe_redirect( add_query_arg( [ 'page' => DTB_SCHEMATIC_HOTSPOT_RESOLVER_SLUG, $arg => sanitize_text_field( (string) ( $run['id'] ?? '' ) ) ], admin_url( 'admin.php' ) ) . '#dtb-hotspot-pipeline' ); exit;
}

function dtb_schematic_hotspot_pipeline_redirect_error( string $message, string $plan_id = '' ): void {
	$args = [ 'page' => DTB_SCHEMATIC_HOTSPOT_RESOLVER_SLUG, 'pipeline_error' => sanitize_text_field( $message ) ];
	if ( '' !== $plan_id ) { $args['plan_run_id'] = $plan_id; }
	wp_safe_redirect( add_query_arg( $args, admin_url( 'admin.php' ) ) . '#dtb-hotspot-pipeline' ); exit;
}
