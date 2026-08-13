<?php
/**
 * DTB Schematics Pipeline Suite — SuiteActions.
 *
 * Thin admin-post.php action controller for every operator-triggered write
 * in the Suite. Every handler here: verifies the `dtb_manage_schematics`
 * capability, verifies a nonce, delegates the actual write to the existing
 * Application-layer service (Application/ManageSchematicRecord.php,
 * Application/ReconcileSchematicSource.php), records the result via
 * Application/RecordSchematicActivity.php, and redirects back to the
 * originating Suite screen with a result notice. No business logic lives in
 * this file.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_post_dtb_schematics_suite_action', 'dtb_schematics_suite_handle_action' );

function dtb_schematics_suite_nonce_action(): string {
	return 'dtb_schematics_suite_action';
}

function dtb_schematics_suite_redirect_back( array $extra_args = [] ): void {
	$referer = wp_get_referer();
	$base    = $referer ? $referer : admin_url( 'admin.php?page=dtb-schematics' );
	$url     = add_query_arg( $extra_args, remove_query_arg( [ 'dtb_notice', 'dtb_notice_type' ], $base ) );
	wp_safe_redirect( $url );
	exit;
}

function dtb_schematics_suite_handle_action(): void {
	if ( ! current_user_can( 'dtb_manage_schematics' ) ) {
		wp_die( esc_html__( 'You do not have permission to perform this action.', 'drywall-toolbox' ) );
	}

	check_admin_referer( dtb_schematics_suite_nonce_action(), 'dtb_schematics_nonce' );

	$sub_action = sanitize_key( $_POST['sub_action'] ?? '' );

	switch ( $sub_action ) {
		case 'publish':
			dtb_schematics_suite_action_publish();
			break;
		case 'retire':
			dtb_schematics_suite_action_retire();
			break;
		case 'update_published_projection':
			dtb_schematics_suite_action_update_projection();
			break;
		case 'refresh_products':
			dtb_schematics_suite_action_refresh_products();
			break;
		case 'associate_hotspot_dataset':
			dtb_schematics_suite_action_associate_hotspot_dataset();
			break;
		case 'reconcile_run':
			dtb_schematics_suite_action_reconcile_run();
			break;
		case 'bulk_publish_eligible':
			dtb_schematics_suite_action_bulk_publish_eligible();
			break;
		case 'bulk_retire':
			dtb_schematics_suite_action_bulk_retire();
			break;
		case 'bulk_refresh_products':
			dtb_schematics_suite_action_bulk_refresh_products();
			break;
		case 'update_part_relationship':
			dtb_schematics_suite_action_update_part_relationship();
			break;
		default:
			dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'unknown_action', 'dtb_notice_type' => 'danger' ] );
	}
}

function dtb_schematics_suite_action_publish(): void {
	$id     = (int) ( $_POST['schematic_id'] ?? 0 );
	$record = dtb_schematic_record_repo_get( $id );
	$result = dtb_schematic_publish( $id );

	if ( is_wp_error( $result ) ) {
		dtb_schematic_activity_log( [
			'operation_type' => 'publish',
			'schematic_id'   => $id,
			'schematic_canonical_id' => $record->canonical_id ?? '',
			'result'         => 'error',
			'summary'        => $result->get_error_message(),
		] );
		dtb_schematics_suite_redirect_back( [ 'dtb_notice' => rawurlencode( $result->get_error_message() ), 'dtb_notice_type' => 'danger' ] );
	}

	dtb_schematic_activity_log( [
		'operation_type'         => 'publish',
		'schematic_id'           => $id,
		'schematic_canonical_id' => $result->canonical_id,
		'result'                 => 'ok',
		'catalog_version'        => $result->publication_version,
		'summary'                => sprintf( 'Published "%s" (publication v%d).', $result->title, $result->publication_version ),
	] );

	dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'published', 'dtb_notice_type' => 'success' ] );
}

function dtb_schematics_suite_action_retire(): void {
	$id     = (int) ( $_POST['schematic_id'] ?? 0 );
	$record = dtb_schematic_record_repo_get( $id );
	$result = dtb_schematic_retire( $id );

	if ( is_wp_error( $result ) ) {
		dtb_schematics_suite_redirect_back( [ 'dtb_notice' => rawurlencode( $result->get_error_message() ), 'dtb_notice_type' => 'danger' ] );
	}

	dtb_schematic_activity_log( [
		'operation_type'         => 'retire',
		'schematic_id'           => $id,
		'schematic_canonical_id' => $result->canonical_id,
		'result'                 => 'ok',
		'summary'                => sprintf( 'Retired "%s". Removed from public catalog; administrative record preserved.', $result->title ),
	] );

	dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'retired', 'dtb_notice_type' => 'success' ] );
}

function dtb_schematics_suite_action_update_projection(): void {
	$id     = (int) ( $_POST['schematic_id'] ?? 0 );
	$result = dtb_schematic_update_published_projection( $id );

	if ( is_wp_error( $result ) ) {
		dtb_schematics_suite_redirect_back( [ 'dtb_notice' => rawurlencode( $result->get_error_message() ), 'dtb_notice_type' => 'danger' ] );
	}

	dtb_schematic_activity_log( [
		'operation_type'         => 'update_published_projection',
		'schematic_id'           => $id,
		'schematic_canonical_id' => $result->canonical_id,
		'result'                 => 'ok',
		'catalog_version'        => $result->publication_version,
		'summary'                => sprintf( 'Refreshed published projection for "%s" (publication v%d).', $result->title, $result->publication_version ),
	] );

	dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'projection_updated', 'dtb_notice_type' => 'success' ] );
}

function dtb_schematics_suite_action_refresh_products(): void {
	$id     = (int) ( $_POST['schematic_id'] ?? 0 );
	$record = dtb_schematic_record_repo_get( $id );

	if ( ! $record ) {
		dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'schematic_not_found', 'dtb_notice_type' => 'danger' ] );
	}

	$changed = dtb_schematic_reconcile_refresh_linked_products( $record );

	dtb_schematic_activity_log( [
		'operation_type'         => 'product_projection_refresh',
		'schematic_id'           => $id,
		'schematic_canonical_id' => $record->canonical_id,
		'result'                 => 'ok',
		'changed'                => $changed ? 1 : 0,
		'summary'                => $changed
			? sprintf( 'Linked-product projection changed for "%s".', $record->title )
			: sprintf( 'Linked-product projection already current for "%s".', $record->title ),
	] );

	dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'products_refreshed', 'dtb_notice_type' => 'success' ] );
}

function dtb_schematics_suite_action_associate_hotspot_dataset(): void {
	$id        = (int) ( $_POST['schematic_id'] ?? 0 );
	$reference = sanitize_text_field( (string) ( $_POST['reference'] ?? '' ) );

	if ( '' === $reference ) {
		dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'reference_required', 'dtb_notice_type' => 'danger' ] );
	}

	$result = dtb_schematic_associate_hotspot_dataset(
		$id,
		[ 'type' => 'frontend_json', 'reference' => $reference ]
	);

	if ( is_wp_error( $result ) ) {
		dtb_schematics_suite_redirect_back( [ 'dtb_notice' => rawurlencode( $result->get_error_message() ), 'dtb_notice_type' => 'danger' ] );
	}

	dtb_schematic_activity_log( [
		'operation_type'         => 'hotspot_dataset_association',
		'schematic_id'           => $id,
		'schematic_canonical_id' => $result->canonical_id,
		'result'                 => 'ok',
		'summary'                => sprintf( 'Associated hotspot dataset reference "%s" with "%s".', $reference, $result->title ),
	] );

	dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'hotspot_dataset_associated', 'dtb_notice_type' => 'success' ] );
}

function dtb_schematics_suite_action_reconcile_run(): void {
	$dry_run    = ! isset( $_POST['commit'] ) || '1' !== $_POST['commit'];
	$batch_size = max( 1, min( 100, (int) ( $_POST['batch_size'] ?? 25 ) ) );
	$resume     = isset( $_POST['resume'] ) ? ( '1' === $_POST['resume'] ) : true;

	$started_at = current_time( 'mysql', true );
	$report     = dtb_schematic_reconcile_source(
		[
			'dry_run'    => $dry_run,
			'batch_size' => $batch_size,
			'resume'     => $resume,
		]
	);

	dtb_schematic_activity_log_reconciliation( $report, $started_at );

	// Store the full report in a short-lived per-user transient so the
	// Reconciliation screen can render it after the redirect without a
	// second, unbounded query.
	set_transient( 'dtb_schematics_last_reconcile_' . get_current_user_id(), $report, 5 * MINUTE_IN_SECONDS );

	dtb_schematics_suite_redirect_back(
		[
			'dtb_notice'      => $dry_run ? 'reconcile_dry_run_complete' : 'reconcile_commit_complete',
			'dtb_notice_type' => empty( $report['fatal_error'] ) ? 'success' : 'danger',
		]
	);
}

function dtb_schematics_suite_action_bulk_publish_eligible(): void {
	$records = dtb_schematics_suite_all_records();
	$published = 0;
	$skipped   = 0;

	foreach ( $records as $record ) {
		if ( $record->lifecycle->is_published() || $record->lifecycle->is_retired() ) {
			continue;
		}
		$unmet = dtb_schematic_publication_requirements( $record->to_array() );
		if ( ! empty( $unmet ) ) {
			$skipped++;
			continue;
		}
		if ( ! DTB_Schematic_Lifecycle_Status::can_transition( $record->lifecycle->value(), DTB_Schematic_Lifecycle_Status::PUBLISHED ) ) {
			$skipped++;
			continue;
		}
		$result = dtb_schematic_publish( $record->id );
		if ( ! is_wp_error( $result ) ) {
			$published++;
		} else {
			$skipped++;
		}
	}

	dtb_schematic_activity_log( [
		'operation_type' => 'publish',
		'result'         => 'ok',
		'changed'        => $published,
		'skipped'        => $skipped,
		'summary'        => sprintf( 'Bulk "Publish eligible": published %d, skipped %d.', $published, $skipped ),
	] );

	dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'bulk_publish_complete', 'dtb_notice_type' => 'success' ] );
}

function dtb_schematics_suite_action_bulk_retire(): void {
	$ids = array_map( 'intval', (array) ( $_POST['schematic_ids'] ?? [] ) );
	$retired = 0;
	$skipped = 0;

	foreach ( $ids as $id ) {
		$result = dtb_schematic_retire( $id );
		if ( ! is_wp_error( $result ) ) {
			$retired++;
		} else {
			$skipped++;
		}
	}

	dtb_schematic_activity_log( [
		'operation_type' => 'retire',
		'result'         => 'ok',
		'changed'        => $retired,
		'skipped'        => $skipped,
		'summary'        => sprintf( 'Bulk "Retire selected": retired %d, skipped %d.', $retired, $skipped ),
	] );

	dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'bulk_retire_complete', 'dtb_notice_type' => 'success' ] );
}

/**
 * Product Relationships screen actions: manually select a product, clear a
 * relationship, or mark a part intentionally not sold. Never fuzzy-matches —
 * only accepts an explicit product ID, an explicit "clear", or an explicit
 * "not sold" flag, consistent with the resolution order documented on
 * Domain/SchematicPartRelationship.php.
 */
function dtb_schematics_suite_action_update_part_relationship(): void {
	$id       = (int) ( $_POST['schematic_id'] ?? 0 );
	$part_ref = sanitize_key( (string) ( $_POST['part_ref'] ?? '' ) );
	$op       = sanitize_key( (string) ( $_POST['part_op'] ?? '' ) );
	$record   = dtb_schematic_record_repo_get( $id );

	if ( ! $record || '' === $part_ref ) {
		dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'schematic_not_found', 'dtb_notice_type' => 'danger' ] );
	}

	$parts = $record->parts;
	foreach ( $parts as $index => $part ) {
		if ( $part['part_ref'] !== $part_ref ) {
			continue;
		}
		if ( 'select_product' === $op ) {
			$product_id = (int) ( $_POST['product_id'] ?? 0 );
			if ( $product_id > 0 && function_exists( 'wc_get_product' ) && wc_get_product( $product_id ) ) {
				$parts[ $index ]['product_id']        = $product_id;
				$parts[ $index ]['resolution_method']  = DTB_SCHEMATIC_PART_RESOLUTION_EXPLICIT_ID;
				$parts[ $index ]['resolution_state']   = DTB_SCHEMATIC_PART_STATE_RESOLVED;
			}
		} elseif ( 'clear' === $op ) {
			$parts[ $index ]['product_id']       = 0;
			$parts[ $index ]['resolution_method'] = DTB_SCHEMATIC_PART_RESOLUTION_UNRESOLVED;
			$parts[ $index ]['resolution_state']  = DTB_SCHEMATIC_PART_STATE_UNRESOLVED;
		} elseif ( 'mark_not_sold' === $op ) {
			$parts[ $index ]['product_id']       = 0;
			$parts[ $index ]['resolution_state']  = DTB_SCHEMATIC_PART_STATE_NOT_SOLD;
		}
		break;
	}

	$result = dtb_schematic_update( $id, [ 'parts' => $parts ] );

	dtb_schematic_activity_log( [
		'operation_type'         => 'record_update',
		'schematic_id'           => $id,
		'schematic_canonical_id' => $record->canonical_id,
		'result'                 => is_wp_error( $result ) ? 'error' : 'ok',
		'summary'                => sprintf( 'Product relationship "%s" updated: %s.', $part_ref, $op ),
	] );

	dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'part_relationship_updated', 'dtb_notice_type' => is_wp_error( $result ) ? 'danger' : 'success' ] );
}

function dtb_schematics_suite_action_bulk_refresh_products(): void {
	$ids = array_map( 'intval', (array) ( $_POST['schematic_ids'] ?? [] ) );
	$changed = 0;

	foreach ( $ids as $id ) {
		$record = dtb_schematic_record_repo_get( $id );
		if ( ! $record ) {
			continue;
		}
		if ( dtb_schematic_reconcile_refresh_linked_products( $record ) ) {
			$changed++;
		}
	}

	dtb_schematic_activity_log( [
		'operation_type' => 'product_projection_refresh',
		'result'         => 'ok',
		'changed'        => $changed,
		'examined'       => count( $ids ),
		'summary'        => sprintf( 'Bulk "Refresh product projections": %d of %d records changed.', $changed, count( $ids ) ),
	] );

	dtb_schematics_suite_redirect_back( [ 'dtb_notice' => 'bulk_products_refreshed', 'dtb_notice_type' => 'success' ] );
}
