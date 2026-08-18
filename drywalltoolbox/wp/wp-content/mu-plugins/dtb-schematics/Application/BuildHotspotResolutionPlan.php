<?php
/**
 * DTB Schematics — consolidated hotspot resolution plan.
 *
 * Converts the existing authoritative optimizer result into one immutable,
 * operator-reviewable plan. This layer does not create a second resolver and
 * never mutates WooCommerce or repository-owned source/catalog identifiers.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_SCHEMATIC_HOTSPOT_PLAN_SCHEMA_VERSION = 1;

/**
 * Build the complete operator plan from an optimizer result.
 *
 * @param array $result Existing dry-run/apply optimizer result.
 * @return array
 */
function dtb_schematic_hotspot_build_resolution_plan( array $result ): array {
	$metrics = (array) ( $result['metrics'] ?? [] );
	$groups  = array_values( (array) ( $result['resolution_groups'] ?? [] ) );
	$repairs = array_values( (array) ( $result['repairs'] ?? [] ) );

	$artifacts = [
		'catalog_corrections' => [],
		'source_corrections'  => [],
		'manual_review'       => [],
	];

	foreach ( $groups as $group ) {
		$code = sanitize_key( (string) ( $group['issue_code'] ?? 'unclassified' ) );
		$row  = dtb_schematic_hotspot_plan_artifact_row( $group );

		if ( in_array( $code, [ 'catalog_identity_gap', 'catalog_product_missing_or_identifier_mismatch', 'mpn_brand_mismatch', 'catalog_eligibility_mismatch' ], true ) ) {
			$artifacts['catalog_corrections'][] = $row;
			continue;
		}
		if ( in_array( $code, [ 'source_identifier_gap', 'source_sku_missing_or_catalog_gap', 'source_unavailable', 'source_sync_required', 'source_reference_only' ], true ) ) {
			$artifacts['source_corrections'][] = $row;
			continue;
		}
		$artifacts['manual_review'][] = $row;
	}

	$blockers = [];
	if ( ! empty( $result['fatal_error'] ) ) {
		$blockers[] = [ 'code' => 'fatal_error', 'message' => sanitize_text_field( (string) $result['fatal_error'] ) ];
	}
	if ( (int) ( $result['failed'] ?? 0 ) > 0 ) {
		$blockers[] = [ 'code' => 'failed_records', 'message' => sprintf( '%d schematic record(s) failed analysis.', (int) $result['failed'] ) ];
	}
	if ( ! empty( $result['groups_truncated'] ) || ! empty( $result['repairs_truncated'] ) ) {
		$blockers[] = [ 'code' => 'truncated_plan', 'message' => 'The generated plan exceeded a bounded reporting limit and must not be approved.' ];
	}

	$projected = (int) ( $metrics['projected_repairs'] ?? $metrics['projected_exact_repairs'] ?? 0 );
	$plan = [
		'schema_version' => DTB_SCHEMATIC_HOTSPOT_PLAN_SCHEMA_VERSION,
		'generated_at'   => gmdate( 'c' ),
		'mode'           => ! empty( $result['dry_run'] ) ? 'pre_apply' : 'post_apply',
		'status'         => empty( $blockers ) ? 'reviewable' : 'blocked',
		'can_apply'      => empty( $blockers ) && $projected > 0,
		'fingerprint'    => sanitize_text_field( (string) ( $result['plan_fingerprint'] ?? '' ) ),
		'summary'        => [
			'schematics_examined'        => (int) ( $result['examined'] ?? 0 ),
			'source_files'               => (int) ( $metrics['source_files'] ?? 0 ),
			'source_parts'               => (int) ( $metrics['source_parts'] ?? 0 ),
			'hotspot_occurrences'        => (int) ( $metrics['source_hotspots'] ?? 0 ),
			'exactly_resolvable_signal'  => (int) ( $metrics['exactly_resolvable'] ?? 0 ),
			'projected_new_mappings'     => $projected,
			'applied_new_mappings'       => (int) ( $metrics['applied_repairs'] ?? $metrics['applied_exact_repairs'] ?? 0 ),
			'active_hotspot_unresolved'  => (int) ( $metrics['active_hotspot_unresolved'] ?? 0 ),
			'catalog_only_unresolved'    => (int) ( $metrics['inactive_catalog_unresolved'] ?? 0 ),
			'resolution_groups'          => (int) ( $metrics['resolution_groups'] ?? count( $groups ) ),
			'source_read_errors'         => (int) ( $metrics['source_read_errors'] ?? 0 ),
			'source_drift'               => (int) ( $metrics['source_drift_before'] ?? 0 ),
		],
		'proposed_mappings' => $repairs,
		'blockers'          => $blockers,
		'reason_counts'     => (array) ( $result['reason_counts'] ?? [] ),
		'artifacts'         => $artifacts,
		'source_errors'     => array_values( (array) ( $result['source_errors'] ?? [] ) ),
		'record_results'    => array_values( (array) ( $result['results'] ?? [] ) ),
	];

	return $plan;
}

/** Normalize one remediation group for CSV/JSON export. */
function dtb_schematic_hotspot_plan_artifact_row( array $group ): array {
	$schematics = array_values( array_filter( array_map( 'sanitize_text_field', (array) ( $group['schematics'] ?? [] ) ) ) );
	$candidates = [];
	foreach ( (array) ( $group['candidates'] ?? [] ) as $candidate ) {
		$candidates[] = implode( ':', [
			(int) ( $candidate['product_id'] ?? 0 ),
			sanitize_text_field( (string) ( $candidate['sku'] ?? '' ) ),
			sanitize_text_field( (string) ( $candidate['name'] ?? '' ) ),
		] );
	}

	return [
		'issue_code'         => sanitize_key( (string) ( $group['issue_code'] ?? 'unclassified' ) ),
		'issue_label'        => sanitize_text_field( (string) ( $group['issue_label'] ?? '' ) ),
		'brand'              => sanitize_text_field( (string) ( $group['brand'] ?? '' ) ),
		'part_ref'           => sanitize_text_field( (string) ( $group['part_ref'] ?? '' ) ),
		'source_sku'         => sanitize_text_field( (string) ( $group['sku'] ?? $group['source_sku'] ?? '' ) ),
		'source_display_id'  => sanitize_text_field( (string) ( $group['display_id'] ?? $group['source_display_id'] ?? '' ) ),
		'part_name'          => sanitize_text_field( (string) ( $group['name'] ?? $group['part_name'] ?? '' ) ),
		'relationship_count' => max( 0, (int) ( $group['relationship_count'] ?? 0 ) ),
		'hotspot_occurrences'=> max( 0, (int) ( $group['occurrences'] ?? 0 ) ),
		'schematics'         => implode( '|', $schematics ),
		'candidate_evidence' => implode( '|', $candidates ),
		'required_action'    => sanitize_text_field( (string) ( $group['resolution'] ?? $group['required_resolution'] ?? '' ) ),
	];
}

/** Stable export payload for the complete plan. */
function dtb_schematic_hotspot_plan_export_payload( array $run ): array {
	$result = (array) ( $run['result'] ?? [] );
	return [
		'report_type' => ! empty( $run['dry_run'] ) ? 'dtb_hotspot_resolution_pre_apply' : 'dtb_hotspot_resolution_post_apply',
		'run' => [
			'id'         => sanitize_text_field( (string) ( $run['id'] ?? '' ) ),
			'status'     => sanitize_key( (string) ( $run['status'] ?? '' ) ),
			'dry_run'    => ! empty( $run['dry_run'] ),
			'created_at' => sanitize_text_field( (string) ( $run['created_at'] ?? '' ) ),
			'error'      => sanitize_text_field( (string) ( $run['error'] ?? '' ) ),
		],
		'plan' => dtb_schematic_hotspot_build_resolution_plan( $result ),
		'raw_optimizer_metrics' => (array) ( $result['metrics'] ?? [] ),
	];
}
