<?php
/**
 * Consolidated temporary schematic hotspot diagnostic/resolution workflow.
 *
 * Replaces the separate resolver, source-audit, and optimizer presentation
 * surfaces with one operator workflow while continuing to delegate all
 * analysis and mutations to the existing application services.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_SCHEMATIC_HOTSPOT_REPORT_NONCE_ACTION = 'dtb_schematic_hotspot_export_report';
const DTB_SCHEMATIC_HOTSPOT_REPORT_SCHEMA_VERSION = 1;
const DTB_SCHEMATIC_HOTSPOT_REPORT_MAX_AUDIT_PAGES = 50;

// Replace the legacy page registration before admin_menu executes. The legacy
// transport/actions remain loaded for compatibility, but are no longer exposed
// as separate top-level workflows.
remove_action( 'admin_menu', 'dtb_schematic_hotspot_resolver_register_page', 6 );
add_action( 'admin_menu', 'dtb_schematic_hotspot_workflow_register_page', 6 );

// The unified page renders these concerns itself; avoid three disconnected
// admin-notice panels above the page callback.
remove_action( 'admin_notices', 'dtb_schematic_hotspot_source_audit_render_panel' );
remove_action( 'admin_notices', 'dtb_schematic_hotspot_optimizer_render_panel' );

add_action( 'admin_post_dtb_schematic_hotspot_export_report', 'dtb_schematic_hotspot_workflow_export_report' );

/** Register the existing Hotspot Resolver slug with the consolidated callback. */
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

/** Render one end-to-end workflow instead of separate diagnostics/actions. */
function dtb_schematic_hotspot_workflow_render_page(): void {
	if ( ! dtb_schematics_can_manage() ) {
		wp_die( esc_html__( 'You do not have permission to manage schematics.', 'drywall-toolbox' ), 403 );
	}

	$run_id = sanitize_text_field( wp_unslash( $_GET['optimizer_run_id'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only selected run.
	$run    = '' !== $run_id ? dtb_schematic_operation_run_get_for_operator( $run_id, get_current_user_id() ) : null;
	$error  = sanitize_text_field( wp_unslash( $_GET['optimizer_error'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- escaped operator message.

	echo '<main class="wrap dtb-hotspot-resolver">';
	echo '<header class="dtb-hotspot-resolver__hero">';
	echo '<div><span class="dtb-hotspot-resolver__eyebrow">' . esc_html__( 'End-to-end maintenance workflow', 'drywall-toolbox' ) . '</span><h1>' . esc_html__( 'Schematic Hotspot Resolver', 'drywall-toolbox' ) . '</h1><p>' . esc_html__( 'One workflow audits the current frontend/public/brands source data, validates hotspot integrity, synchronizes normalized datasets, evaluates deterministic WooCommerce mappings, classifies every remaining problem, and produces an exportable remediation report.', 'drywall-toolbox' ) . '</p></div>';
	echo '<a class="button" href="' . esc_url( admin_url( 'admin.php?page=dtb-schematics&view=operations' ) ) . '">' . esc_html__( 'Open Schematics Operations', 'drywall-toolbox' ) . '</a>';
	echo '</header>';

	echo '<section id="dtb-hotspot-optimizer" class="dtb-hotspot-optimizer">';
	echo '<div class="dtb-hotspot-optimizer__head">';
	echo '<div><span class="dtb-hotspot-resolver__eyebrow">' . esc_html__( '1 · Analyze, 2 · apply safe synchronization, 3 · export', 'drywall-toolbox' ) . '</span><h2>' . esc_html__( 'Full hotspot integrity and resolution workflow', 'drywall-toolbox' ) . '</h2><p>' . esc_html__( 'Preview and Apply are two modes of the same pipeline. Preview is read-only. Apply uses the existing schematic commit lease and can only synchronize hotspot projections and persist deterministic exact relationships. Fuzzy/review candidates are never auto-linked.', 'drywall-toolbox' ) . '</p></div>';
	echo '<div class="dtb-hotspot-optimizer__actions">';
	dtb_schematic_hotspot_optimizer_render_form( true );
	dtb_schematic_hotspot_optimizer_render_form( false );
	if ( $run ) {
		dtb_schematic_hotspot_workflow_render_export_form( $run );
	}
	echo '</div></div>';

	echo '<div class="dtb-hotspot-optimizer__contract"><strong>' . esc_html__( 'Authority and safety contract', 'drywall-toolbox' ) . '</strong><span>' . esc_html__( 'frontend/public/brands remains schematic source truth; WooCommerce remains product identity truth. The workflow never creates products, rewrites SKU/MPN/GTIN/brand identifiers, or converts fuzzy similarity into an automatic mapping.', 'drywall-toolbox' ) . '</span></div>';

	if ( '' !== $error ) {
		echo '<div class="notice notice-error inline"><p>' . esc_html( $error ) . '</p></div>';
	}

	if ( ! $run ) {
		echo '<section class="dtb-hotspot-resolver__empty"><h2>' . esc_html__( 'Run Preview full optimizer first', 'drywall-toolbox' ) . '</h2><p>' . esc_html__( 'The preview establishes one consistent full-catalog scope and produces the baseline report. Review that result before running Apply.', 'drywall-toolbox' ) . '</p></section>';
		echo '</section></main>';
		return;
	}

	dtb_schematic_hotspot_workflow_render_mapping_outcome( $run );

	// Render the authoritative optimizer result once. This is the resolution
	// work queue and root-cause analysis; no second diagnostic scan is run.
	dtb_schematic_hotspot_optimizer_render_result( $run );

	// Provide one full-scope source snapshot so operators no longer compare a
	// paginated 25-record source audit with the all-record optimizer metrics.
	$source_audit = dtb_schematic_hotspot_workflow_collect_source_audit();
	dtb_schematic_hotspot_workflow_render_source_summary( $source_audit );

	echo '</section></main>';
}

/** Make mapping writes explicit so an operator can tell whether Apply changed anything. */
function dtb_schematic_hotspot_workflow_render_mapping_outcome( array $run ): void {
	$result  = (array) ( $run['result'] ?? [] );
	$metrics = (array) ( $result['metrics'] ?? [] );
	$dry_run = ! empty( $run['dry_run'] );
	$repairs = $dry_run
		? (int) ( $metrics['projected_exact_repairs'] ?? 0 )
		: (int) ( $metrics['applied_exact_repairs'] ?? 0 );
	$remaining = (int) ( $metrics['remaining_unresolved'] ?? $result['unresolved'] ?? 0 );

	if ( $dry_run ) {
		$headline = sprintf( _n( '%d exact mapping would be written', '%d exact mappings would be written', $repairs, 'drywall-toolbox' ), $repairs );
		$detail   = __( 'This was a preview. No schematic relationship was changed. Run Apply only after reviewing the source errors and work queue.', 'drywall-toolbox' );
	} elseif ( $repairs > 0 ) {
		$headline = sprintf( _n( '%d new exact mapping was written', '%d new exact mappings were written', $repairs, 'drywall-toolbox' ), $repairs );
		$detail   = __( 'These writes satisfied the existing deterministic resolver contract. Review the remaining work queue for catalog/source issues that still require operator action.', 'drywall-toolbox' );
	} else {
		$headline = __( 'No new exact hotspot mappings were written', 'drywall-toolbox' );
		$detail   = __( 'The Apply pass completed, but it did not persist any newly resolved part-to-product relationship. “Exactly resolvable” is an audit signal and can include relationships that were already resolved before the run; it is not the count of new writes.', 'drywall-toolbox' );
	}

	echo '<section class="dtb-hotspot-resolver__bulk"><div><strong>' . esc_html( $headline ) . '</strong><p>' . esc_html( $detail ) . '</p><p><strong>' . esc_html( sprintf( __( '%d relationship(s) remain unresolved in the full workflow scope.', 'drywall-toolbox' ), $remaining ) ) . '</strong></p></div></section>';
}

/** Render the single report-export action for the selected workflow run. */
function dtb_schematic_hotspot_workflow_render_export_form( array $run ): void {
	$run_id = (string) ( $run['id'] ?? '' );
	if ( '' === $run_id ) {
		return;
	}

	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="dtb-hotspot-optimizer__form">';
	echo '<input type="hidden" name="action" value="dtb_schematic_hotspot_export_report">';
	echo '<input type="hidden" name="run_id" value="' . esc_attr( $run_id ) . '">';
	wp_nonce_field( DTB_SCHEMATIC_HOTSPOT_REPORT_NONCE_ACTION . ':' . $run_id, '_dtb_hotspot_report_nonce' );
	echo '<button type="submit" class="button">' . esc_html__( 'Export full report (.json)', 'drywall-toolbox' ) . '</button>';
	echo '</form>';
}

/**
 * Collect a complete read-only source audit across the same authoritative
 * record population used by the optimizer, not just the current UI page.
 */
function dtb_schematic_hotspot_workflow_collect_source_audit(): array {
	$aggregate = [
		'records_examined'      => 0,
		'source_files_examined' => 0,
		'source_read_errors'    => 0,
		'source_missing'        => 0,
		'source_drift_records'  => 0,
		'source_parts'          => 0,
		'source_hotspots'       => 0,
		'source_only_parts'     => 0,
		'stored_only_parts'     => 0,
		'dangling_hotspots'     => 0,
		'invalid_hotspots'      => 0,
		'duplicate_hotspot_ids' => 0,
		'page_mismatches'       => 0,
		'exactly_resolvable'    => 0,
		'unresolved_at_source'  => 0,
		'items'                 => [],
		'truncated'             => false,
	];

	for ( $page = 1; $page <= DTB_SCHEMATIC_HOTSPOT_REPORT_MAX_AUDIT_PAGES; $page++ ) {
		$batch = dtb_schematic_hotspot_source_audit_scan(
			[
				'page'         => $page,
				'per_page'     => DTB_SCHEMATIC_SOURCE_AUDIT_MAX_RECORDS,
				'schematic_id' => 0,
				'search'       => '',
			]
		);

		foreach ( array_keys( $aggregate ) as $key ) {
			if ( in_array( $key, [ 'items', 'truncated' ], true ) ) {
				continue;
			}
			$aggregate[ $key ] += (int) ( $batch[ $key ] ?? 0 );
		}
		foreach ( (array) ( $batch['items'] ?? [] ) as $item ) {
			$aggregate['items'][] = $item;
		}

		$examined = (int) ( $batch['records_examined'] ?? 0 );
		if ( $examined < DTB_SCHEMATIC_SOURCE_AUDIT_MAX_RECORDS ) {
			break;
		}
		if ( DTB_SCHEMATIC_HOTSPOT_REPORT_MAX_AUDIT_PAGES === $page ) {
			$aggregate['truncated'] = true;
		}
	}

	return $aggregate;
}

/** Show only the source facts that materially affect operator decisions. */
function dtb_schematic_hotspot_workflow_render_source_summary( array $report ): void {
	$invalid = (int) ( $report['invalid_hotspots'] ?? 0 ) + (int) ( $report['dangling_hotspots'] ?? 0 );
	$metrics = [
		[ __( 'Records audited', 'drywall-toolbox' ), (int) ( $report['records_examined'] ?? 0 ) ],
		[ __( 'Source files', 'drywall-toolbox' ), (int) ( $report['source_files_examined'] ?? 0 ) ],
		[ __( 'Parts', 'drywall-toolbox' ), (int) ( $report['source_parts'] ?? 0 ) ],
		[ __( 'Hotspots', 'drywall-toolbox' ), (int) ( $report['source_hotspots'] ?? 0 ) ],
		[ __( 'Drifted records', 'drywall-toolbox' ), (int) ( $report['source_drift_records'] ?? 0 ) ],
		[ __( 'Source errors', 'drywall-toolbox' ), (int) ( $report['source_read_errors'] ?? 0 ) ],
		[ __( 'Invalid / dangling', 'drywall-toolbox' ), $invalid ],
		[ __( 'Exact source signal', 'drywall-toolbox' ), (int) ( $report['exactly_resolvable'] ?? 0 ) ],
		[ __( 'Unresolved source signal', 'drywall-toolbox' ), (int) ( $report['unresolved_at_source'] ?? 0 ) ],
	];

	echo '<section class="dtb-hotspot-resolver__source-audit" aria-label="' . esc_attr__( 'Full source integrity summary', 'drywall-toolbox' ) . '">';
	echo '<div class="dtb-hotspot-resolver__source-audit-heading"><div><span class="dtb-hotspot-resolver__eyebrow">' . esc_html__( 'Full-scope source truth', 'drywall-toolbox' ) . '</span><h2>' . esc_html__( 'Current frontend/public/brands integrity snapshot', 'drywall-toolbox' ) . '</h2><p>' . esc_html__( 'This summary always scans the complete authoritative schematic population so its scope matches the optimizer. The full per-record evidence is included in the exported report.', 'drywall-toolbox' ) . '</p></div></div>';
	echo '<div class="dtb-hotspot-resolver__source-metrics">';
	foreach ( $metrics as $metric ) {
		echo '<div><strong>' . esc_html( (string) $metric[1] ) . '</strong><span>' . esc_html( $metric[0] ) . '</span></div>';
	}
	echo '</div>';

	$problem_items = array_filter(
		(array) ( $report['items'] ?? [] ),
		static function ( array $item ): bool {
			return ! empty( $item['read_errors'] ) || ! empty( $item['drift'] ) || ! empty( $item['dangling_hotspots'] ) || ! empty( $item['invalid_hotspots'] ) || ! empty( $item['duplicate_hotspot_ids'] ) || ! empty( $item['page_mismatches'] );
		}
	);
	if ( $problem_items ) {
		echo '<details class="dtb-hotspot-optimizer__errors"><summary>' . esc_html( sprintf( __( 'Source records requiring attention (%d)', 'drywall-toolbox' ), count( $problem_items ) ) ) . '</summary><ul>';
		foreach ( $problem_items as $item ) {
			$issues = [];
			if ( ! empty( $item['read_errors'] ) ) { $issues[] = sprintf( __( '%d read error(s)', 'drywall-toolbox' ), count( $item['read_errors'] ) ); }
			if ( ! empty( $item['drift'] ) ) { $issues[] = __( 'projection drift', 'drywall-toolbox' ); }
			if ( ! empty( $item['dangling_hotspots'] ) ) { $issues[] = sprintf( __( '%d dangling hotspot(s)', 'drywall-toolbox' ), count( $item['dangling_hotspots'] ) ); }
			if ( ! empty( $item['invalid_hotspots'] ) ) { $issues[] = sprintf( __( '%d invalid hotspot(s)', 'drywall-toolbox' ), count( $item['invalid_hotspots'] ) ); }
			if ( ! empty( $item['duplicate_hotspot_ids'] ) ) { $issues[] = sprintf( __( '%d duplicate hotspot ID(s)', 'drywall-toolbox' ), count( $item['duplicate_hotspot_ids'] ) ); }
			if ( ! empty( $item['page_mismatches'] ) ) { $issues[] = sprintf( __( '%d page mismatch(es)', 'drywall-toolbox' ), count( $item['page_mismatches'] ) ); }
			echo '<li><code>' . esc_html( (string) ( $item['canonical_id'] ?? '' ) ) . '</code> — ' . esc_html( implode( '; ', $issues ) ) . '</li>';
		}
		echo '</ul></details>';
	}
	echo '</section>';
}

/** Export the selected operator-owned run plus a complete current source audit. */
function dtb_schematic_hotspot_workflow_export_report(): void {
	if ( ! dtb_schematics_can_manage() ) {
		wp_die( esc_html__( 'You do not have permission to manage schematics.', 'drywall-toolbox' ), 403 );
	}

	$run_id = sanitize_text_field( wp_unslash( $_POST['run_id'] ?? '' ) );
	check_admin_referer( DTB_SCHEMATIC_HOTSPOT_REPORT_NONCE_ACTION . ':' . $run_id, '_dtb_hotspot_report_nonce' );

	$run = dtb_schematic_operation_run_get_for_operator( $run_id, get_current_user_id() );
	if ( ! $run || DTB_SCHEMATIC_OPERATION_OPTIMIZE_HOTSPOTS !== (string) ( $run['kind'] ?? '' ) ) {
		wp_die( esc_html__( 'The requested hotspot workflow report is unavailable for this operator.', 'drywall-toolbox' ), 404 );
	}

	$source_audit = dtb_schematic_hotspot_workflow_collect_source_audit();
	$result       = (array) ( $run['result'] ?? [] );
	$metrics      = (array) ( $result['metrics'] ?? [] );
	$dry_run      = ! empty( $run['dry_run'] );
	$repairs      = $dry_run ? (int) ( $metrics['projected_exact_repairs'] ?? 0 ) : (int) ( $metrics['applied_exact_repairs'] ?? 0 );

	$report = [
		'schema_version' => DTB_SCHEMATIC_HOTSPOT_REPORT_SCHEMA_VERSION,
		'report_type'    => 'dtb_schematic_hotspot_end_to_end',
		'generated_at'   => gmdate( 'c' ),
		'authority'      => [
			'schematic_source' => 'frontend/public/brands schematic_data*.json via approved reader/normalizer/merge pipeline',
			'product_source'   => 'WooCommerce',
			'automatic_resolution_contract' => 'exact SKU / brand+MPN / explicit compatibility only',
			'protected_identifiers_mutated'  => false,
			'fuzzy_matches_auto_applied'      => false,
		],
		'run' => [
			'id'           => (string) ( $run['id'] ?? '' ),
			'mode'         => $dry_run ? 'preview' : 'apply',
			'status'       => (string) ( $run['status'] ?? '' ),
			'operator_id'  => (int) ( $run['operator_id'] ?? 0 ),
			'created_at'   => (string) ( $run['created_at'] ?? '' ),
			'completed_at' => (string) ( $run['completed_at'] ?? '' ),
			'error'        => (string) ( $run['error'] ?? '' ),
		],
		'mapping_outcome' => [
			'new_exact_mappings_written' => $dry_run ? 0 : $repairs,
			'projected_exact_mappings'   => $dry_run ? $repairs : 0,
			'did_write_new_exact_mappings' => ! $dry_run && $repairs > 0,
			'exactly_resolvable_signal'    => (int) ( $metrics['exactly_resolvable'] ?? 0 ),
			'remaining_unresolved_relationships' => (int) ( $metrics['remaining_unresolved'] ?? $result['unresolved'] ?? 0 ),
		],
		'optimizer'    => $result,
		'source_truth' => $source_audit,
	];

	$filename = 'dtb-hotspot-workflow-report-' . preg_replace( '/[^a-z0-9-]/', '', strtolower( $run_id ) ) . '.json';
	nocache_headers();
	header( 'Content-Type: application/json; charset=utf-8' );
	header( 'X-Content-Type-Options: nosniff' );
	header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
	echo wp_json_encode( $report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON download, not HTML.
	exit;
}
