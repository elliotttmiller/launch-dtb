<?php
/**
 * DTB Schematics — one-time hotspot synchronization optimizer.
 *
 * This is an operator-triggered, bounded orchestration service used by the
 * temporary Hotspot Resolver. It performs an end-to-end source audit, runs
 * the existing hotspot migration/resolution pipeline, and classifies every
 * remaining unresolved source identity into an actionable resolution group.
 *
 * WooCommerce remains authoritative for products. The optimizer never creates
 * products, rewrites SKU/MPN/brand identifiers, or auto-applies fuzzy matches.
 * Commit mode only applies the existing deterministic migration and exact
 * resolver contract through the established schematic application services.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_MAX_PAGES  = 50;
const DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_MAX_GROUPS = 1500;
const DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_PER_PAGE   = 25;

/**
 * Run a full one-time optimizer pass across authoritative schematic records.
 *
 * @param array $args {
 *     @type bool          $dry_run          Preview only when true.
 *     @type int           $per_page         Records per page, capped at 50.
 *     @type callable|null $lease_heartbeat  Commit lease renewal callback.
 * }
 * @return array
 */
function dtb_schematic_hotspot_optimizer_run( array $args = [] ): array {
	$dry_run   = array_key_exists( 'dry_run', $args ) ? (bool) $args['dry_run'] : true;
	$per_page  = max( 1, min( 50, (int) ( $args['per_page'] ?? DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_PER_PAGE ) ) );
	$heartbeat = isset( $args['lease_heartbeat'] ) && is_callable( $args['lease_heartbeat'] ) ? $args['lease_heartbeat'] : null;

	$report = [
		'dry_run'        => $dry_run,
		'examined'       => 0,
		'changed'        => 0,
		'would_change'   => 0,
		'skipped'        => 0,
		'failed'         => 0,
		'unresolved'     => 0,
		'fatal_error'    => '',
		'metrics'        => [
			'source_files'             => 0,
			'source_parts'             => 0,
			'source_hotspots'          => 0,
			'source_drift_before'      => 0,
			'source_read_errors'       => 0,
			'source_unavailable'       => 0,
			'exactly_resolvable'       => 0,
			'unresolved_at_source'     => 0,
			'projected_exact_repairs'  => 0,
			'applied_exact_repairs'    => 0,
			'remaining_unresolved'     => 0,
			'resolution_groups'        => 0,
		],
		'reason_counts'  => [],
		'resolution_groups' => [],
		'source_errors'  => [],
		'results'        => [],
		'groups_truncated' => false,
	];

	$groups = [];
	$page   = 1;

	do {
		$query = dtb_schematic_record_repo_query( [ 'page' => $page, 'per_page' => $per_page ] );
		foreach ( (array) $query['items'] as $record ) {
			if ( $heartbeat ) {
				$renewed = $heartbeat();
				if ( is_wp_error( $renewed ) ) {
					$report['failed']++;
					$report['fatal_error'] = $renewed->get_error_message();
					break 2;
				}
			}

			$report['examined']++;
			$audit = dtb_schematic_hotspot_source_audit_record( $record );
			$report['metrics']['source_files']         += count( (array) ( $audit['source_files'] ?? [] ) );
			$report['metrics']['source_parts']         += (int) ( $audit['parts_count'] ?? 0 );
			$report['metrics']['source_hotspots']      += (int) ( $audit['hotspot_count'] ?? 0 );
			$report['metrics']['source_drift_before']  += ! empty( $audit['drift'] ) ? 1 : 0;
			$report['metrics']['source_read_errors']   += count( (array) ( $audit['read_errors'] ?? [] ) );
			$report['metrics']['source_unavailable']   += in_array( (string) ( $audit['status'] ?? '' ), [ 'missing', 'error' ], true ) ? 1 : 0;
			$report['metrics']['exactly_resolvable']   += (int) ( $audit['exactly_resolvable'] ?? 0 );
			$report['metrics']['unresolved_at_source'] += (int) ( $audit['unresolved_at_source'] ?? 0 );

			foreach ( (array) ( $audit['read_errors'] ?? [] ) as $error ) {
				if ( count( $report['source_errors'] ) >= 100 ) {
					break;
				}
				$report['source_errors'][] = [
					'canonical_id' => $record->canonical_id,
					'message'      => sanitize_text_field( (string) $error ),
				];
			}

			$before_unresolved = [];
			foreach ( (array) $record->parts as $part ) {
				if ( dtb_schematic_hotspot_part_is_unresolved( $part ) ) {
					$before_unresolved[ (string) ( $part['part_ref'] ?? '' ) ] = true;
				}
			}

			$migration = dtb_schematic_migrate_hotspot_dataset_for_record( $record, $dry_run );
			$status    = (string) ( $migration['status'] ?? 'failed' );
			if ( 'migrated' === $status ) {
				if ( $dry_run ) {
					$report['would_change']++;
				} else {
					$report['changed']++;
				}
			} elseif ( in_array( $status, [ 'no_source_file', 'source_file_missing' ], true ) ) {
				$report['skipped']++;
			} elseif ( 'unchanged' !== $status ) {
				$report['failed']++;
			}

			$record_result = [
				'schematic_id'     => $record->id,
				'canonical_id'     => $record->canonical_id,
				'source_status'    => sanitize_key( (string) ( $audit['status'] ?? '' ) ),
				'source_drift'     => ! empty( $audit['drift'] ),
				'migration_status' => sanitize_key( $status ),
				'parts_resolved'   => (int) ( $migration['parts_resolved'] ?? 0 ),
				'parts_unresolved' => (int) ( $migration['parts_unresolved'] ?? 0 ),
			];
			if ( count( $report['results'] ) < 100 ) {
				$report['results'][] = $record_result;
			}

			if ( in_array( (string) ( $audit['status'] ?? '' ), [ 'missing', 'error' ], true ) ) {
				dtb_schematic_hotspot_optimizer_add_group(
					$groups,
					$record,
					[
						'part_ref'   => '',
						'display_id' => '',
						'name'       => __( 'Hotspot source unavailable', 'drywall-toolbox' ),
						'sku'        => '',
					],
					[
						'code'       => 'source_unavailable',
						'label'      => __( 'Source unavailable', 'drywall-toolbox' ),
						'resolution' => __( 'Restore or associate the authoritative schematic_data JSON under the approved brand source root, then rerun the optimizer.', 'drywall-toolbox' ),
						'candidates' => [],
					],
					0
				);
				continue;
			}

			// A preview never diagnoses stale persisted rows as if they were current
			// source truth. Commit mode synchronizes first, then classifies the new
			// authoritative projection.
			if ( $dry_run && ! empty( $audit['drift'] ) ) {
				dtb_schematic_hotspot_optimizer_add_group(
					$groups,
					$record,
					[
						'part_ref'   => '',
						'display_id' => '',
						'name'       => __( 'Source projection drift', 'drywall-toolbox' ),
						'sku'        => '',
					],
					[
						'code'       => 'source_sync_required',
						'label'      => __( 'Source synchronization required', 'drywall-toolbox' ),
						'resolution' => __( 'Run the one-time optimizer to synchronize the normalized hotspot dataset before applying part-level resolution decisions.', 'drywall-toolbox' ),
						'candidates' => [],
					],
					0
				);
				continue;
			}

			$fresh_record = $dry_run ? $record : dtb_schematic_record_repo_get( $record->id );
			$dataset      = dtb_schematic_hotspot_dataset_repo_get( $record->id );
			if ( ! $fresh_record || ! $dataset ) {
				continue;
			}

			$projection = dtb_schematic_resolve_part_occurrences_for_record( $fresh_record, $dataset );
			$source_by_ref = [];
			foreach ( (array) ( $dataset['parts_catalog'] ?? [] ) as $source_part ) {
				$source_by_ref[ (string) ( $source_part['part_ref'] ?? '' ) ] = $source_part;
			}

			$repairs = 0;
			foreach ( $projection as $part ) {
				$ref = (string) ( $part['part_ref'] ?? '' );
				if ( isset( $before_unresolved[ $ref ] ) && (int) ( $part['product_id'] ?? 0 ) > 0 ) {
					$repairs++;
				}
				if ( ! dtb_schematic_hotspot_part_is_unresolved( $part ) ) {
					continue;
				}

				$source_part = (array) ( $source_by_ref[ $ref ] ?? [
					'part_ref'   => $ref,
					'display_id' => (string) ( $part['mpn'] ?? '' ),
					'name'       => (string) ( $part['title'] ?? '' ),
					'sku'        => (string) ( $part['sku'] ?? '' ),
				] );
				$classification = dtb_schematic_hotspot_optimizer_classify_unresolved( $fresh_record, $source_part );
				dtb_schematic_hotspot_optimizer_add_group(
					$groups,
					$fresh_record,
					$source_part,
					$classification,
					max( 0, (int) ( $part['occurrence_count'] ?? 0 ) )
				);
			}

			if ( $dry_run ) {
				$report['metrics']['projected_exact_repairs'] += $repairs;
			} else {
				$report['metrics']['applied_exact_repairs'] += $repairs;
			}
		}

		$page++;
	} while ( $page <= (int) ( $query['pages'] ?? 1 ) && $page <= DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_MAX_PAGES );

	$groups = array_values( $groups );
	usort(
		$groups,
		static function ( array $a, array $b ): int {
			$impact_a = (int) ( $a['occurrences'] ?? 0 ) + (int) ( $a['relationship_count'] ?? 0 );
			$impact_b = (int) ( $b['occurrences'] ?? 0 ) + (int) ( $b['relationship_count'] ?? 0 );
			return $impact_b <=> $impact_a;
		}
	);
	if ( count( $groups ) > DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_MAX_GROUPS ) {
		$report['groups_truncated'] = true;
		$groups = array_slice( $groups, 0, DTB_SCHEMATIC_HOTSPOT_OPTIMIZER_MAX_GROUPS );
	}

	foreach ( $groups as $group ) {
		$code = sanitize_key( (string) ( $group['issue_code'] ?? 'unclassified' ) );
		$report['reason_counts'][ $code ] = (int) ( $report['reason_counts'][ $code ] ?? 0 ) + (int) ( $group['relationship_count'] ?? 1 );
	}
	ksort( $report['reason_counts'] );

	$report['resolution_groups'] = $groups;
	$report['metrics']['resolution_groups']    = count( $groups );
	$report['metrics']['remaining_unresolved'] = array_sum( array_map( static fn( $group ) => (int) ( $group['relationship_count'] ?? 0 ), $groups ) );
	$report['unresolved'] = $report['metrics']['remaining_unresolved'];

	if ( ! $dry_run && $report['changed'] > 0 ) {
		dtb_schematics_invalidate_domain_cache();
	}

	return $report;
}

/** Classify one unresolved current-source identity without mutating catalog data. */
function dtb_schematic_hotspot_optimizer_classify_unresolved( DTB_Schematic_Record_Entity $record, array $source_part ): array {
	$sku      = trim( (string) ( $source_part['sku'] ?? '' ) );
	$mpn      = trim( (string) ( $source_part['display_id'] ?? '' ) );
	$part_ref = trim( (string) ( $source_part['part_ref'] ?? '' ) );
	$candidates = dtb_schematic_hotspot_review_candidates( $record, $source_part );

	foreach ( $candidates as $candidate ) {
		$candidate_mpn = trim( (string) ( $candidate['mpn'] ?? '' ) );
		if ( '' !== $mpn && '' !== $candidate_mpn && 0 === strcasecmp( $mpn, $candidate_mpn ) ) {
			if ( empty( $candidate['brand_matches'] ) ) {
				return [
					'code'       => 'mpn_brand_mismatch',
					'label'      => __( 'Exact MPN, brand mismatch', 'drywall-toolbox' ),
					'resolution' => __( 'Inspect the candidate. If it is the same manufacturer part, correct the authoritative WooCommerce brand metadata; otherwise link explicitly only after operator verification.', 'drywall-toolbox' ),
					'candidates' => array_slice( $candidates, 0, 3 ),
				];
			}
			return [
				'code'       => 'catalog_eligibility_mismatch',
				'label'      => __( 'Exact MPN candidate is not eligible for automatic resolution', 'drywall-toolbox' ),
				'resolution' => __( 'Inspect product type/status and identifier placement. Correct the authoritative catalog record if the candidate is valid, then rerun exact resolution.', 'drywall-toolbox' ),
				'candidates' => array_slice( $candidates, 0, 3 ),
			];
		}
	}

	$normalized_sku = dtb_schematic_hotspot_optimizer_normalize_identifier( $sku );
	if ( '' !== $normalized_sku ) {
		foreach ( $candidates as $candidate ) {
			$candidate_sku = trim( (string) ( $candidate['sku'] ?? '' ) );
			if ( '' !== $candidate_sku
				&& 0 !== strcasecmp( $sku, $candidate_sku )
				&& $normalized_sku === dtb_schematic_hotspot_optimizer_normalize_identifier( $candidate_sku ) ) {
				return [
					'code'       => 'sku_format_mismatch',
					'label'      => __( 'Probable SKU formatting mismatch', 'drywall-toolbox' ),
					'resolution' => __( 'Verify the manufacturer identifier. Correct the authoritative source or WooCommerce SKU only if the normalized values represent the same protected identifier; do not auto-rewrite either value.', 'drywall-toolbox' ),
					'candidates' => array_slice( $candidates, 0, 3 ),
				];
			}
		}
	}

	if ( ! empty( $candidates ) ) {
		return [
			'code'       => 'operator_review_candidate',
			'label'      => __( 'Review candidate available', 'drywall-toolbox' ),
			'resolution' => __( 'Compare the source name, SKU/MPN, brand, and product record. Use an explicit link only when the identity is confirmed; otherwise correct the authoritative catalog/source data and rerun.', 'drywall-toolbox' ),
			'candidates' => array_slice( $candidates, 0, 3 ),
		];
	}

	if ( '' === $sku ) {
		return [
			'code'       => 'source_sku_missing_or_catalog_gap',
			'label'      => __( 'No source SKU and no catalog candidate', 'drywall-toolbox' ),
			'resolution' => ( '' === $mpn || 0 === strcasecmp( $mpn, $part_ref ) )
				? __( 'The source does not provide a strong secondary identifier. Verify the manufacturer part number and add/correct it in the authoritative source or catalog before rerunning.', 'drywall-toolbox' )
				: __( 'Verify that the source MPN exists on the authoritative WooCommerce part product with the correct brand metadata, then rerun.', 'drywall-toolbox' ),
			'candidates' => [],
		];
	}

	return [
		'code'       => 'catalog_product_missing_or_identifier_mismatch',
		'label'      => __( 'No exact catalog identity found', 'drywall-toolbox' ),
		'resolution' => __( 'Verify the source SKU/MPN against the authoritative WooCommerce catalog. Create the product only if it is genuinely sold, or correct the protected identifier at its authoritative source, then rerun.', 'drywall-toolbox' ),
		'candidates' => [],
	];
}

/** Normalize identifier punctuation only for diagnostic comparison, never writes. */
function dtb_schematic_hotspot_optimizer_normalize_identifier( string $value ): string {
	$value = strtolower( trim( $value ) );
	return preg_replace( '/[^a-z0-9]+/', '', $value ) ?: '';
}

/** Aggregate repeated unresolved identities across schematics into one work item. */
function dtb_schematic_hotspot_optimizer_add_group( array &$groups, DTB_Schematic_Record_Entity $record, array $source_part, array $classification, int $occurrences ): void {
	$brand    = sanitize_text_field( (string) ( $record->brand_name ?: $record->brand_id ) );
	$sku      = sanitize_text_field( (string) ( $source_part['sku'] ?? '' ) );
	$mpn      = sanitize_text_field( (string) ( $source_part['display_id'] ?? '' ) );
	$part_ref = sanitize_text_field( (string) ( $source_part['part_ref'] ?? '' ) );
	$title    = sanitize_text_field( (string) ( $source_part['name'] ?? '' ) );
	$identity = '' !== $sku ? $sku : ( '' !== $mpn ? $mpn : ( '' !== $title ? $title : $part_ref ) );
	$key      = sanitize_key( $brand . '-' . dtb_schematic_hotspot_optimizer_normalize_identifier( $identity ) . '-' . (string) ( $classification['code'] ?? '' ) );
	if ( '' === $key ) {
		$key = 'unclassified-' . $record->id . '-' . count( $groups );
	}

	if ( ! isset( $groups[ $key ] ) ) {
		$groups[ $key ] = [
			'group_key'          => $key,
			'issue_code'         => sanitize_key( (string) ( $classification['code'] ?? 'unclassified' ) ),
			'issue_label'        => sanitize_text_field( (string) ( $classification['label'] ?? __( 'Unclassified', 'drywall-toolbox' ) ) ),
			'recommended_fix'    => sanitize_text_field( (string) ( $classification['resolution'] ?? '' ) ),
			'brand'              => $brand,
			'sku'                => $sku,
			'mpn'                => $mpn,
			'part_ref'           => $part_ref,
			'title'              => $title,
			'relationship_count' => 0,
			'occurrences'        => 0,
			'schematics'         => [],
			'candidates'         => [],
		];
		foreach ( array_slice( (array) ( $classification['candidates'] ?? [] ), 0, 3 ) as $candidate ) {
			$groups[ $key ]['candidates'][] = [
				'id'      => (int) ( $candidate['id'] ?? 0 ),
				'name'    => sanitize_text_field( (string) ( $candidate['name'] ?? '' ) ),
				'sku'     => sanitize_text_field( (string) ( $candidate['sku'] ?? '' ) ),
				'mpn'     => sanitize_text_field( (string) ( $candidate['mpn'] ?? '' ) ),
				'brand'   => sanitize_text_field( (string) ( $candidate['brand'] ?? '' ) ),
				'status'  => sanitize_key( (string) ( $candidate['status'] ?? '' ) ),
				'type'    => sanitize_key( (string) ( $candidate['type'] ?? '' ) ),
			];
		}
	}

	$groups[ $key ]['relationship_count']++;
	$groups[ $key ]['occurrences'] += max( 0, $occurrences );
	$schematic_label = sanitize_text_field( $record->canonical_id );
	if ( ! in_array( $schematic_label, $groups[ $key ]['schematics'], true ) && count( $groups[ $key ]['schematics'] ) < 20 ) {
		$groups[ $key ]['schematics'][] = $schematic_label;
	}
}