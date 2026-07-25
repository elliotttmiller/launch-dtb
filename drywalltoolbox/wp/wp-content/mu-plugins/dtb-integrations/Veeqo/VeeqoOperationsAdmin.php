<?php
/**
 * Veeqo operations console for wp-admin.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_VEEQO_OPERATIONS_HOOK          = 'dtb_veeqo_inventory_operation';
const DTB_VEEQO_OPERATIONS_ACTIVE_OPTION = 'dtb_veeqo_inventory_operation_active';
const DTB_VEEQO_OPERATIONS_INDEX_OPTION  = 'dtb_veeqo_inventory_operation_index';
const DTB_VEEQO_OPERATIONS_OPTION_PREFIX = 'dtb_veeqo_inventory_operation_';
const DTB_VEEQO_OPERATIONS_RETENTION     = 20;
const DTB_VEEQO_OPERATIONS_POLL_LIMIT    = 100;

function dtb_veeqo_operations_can_manage(): bool {
	return current_user_can( 'manage_woocommerce' );
}

function dtb_veeqo_operations_option_name( string $operation_id ): string {
	return DTB_VEEQO_OPERATIONS_OPTION_PREFIX . sanitize_key( $operation_id );
}

function dtb_veeqo_operations_get( string $operation_id ): array {
	$operation_id = sanitize_key( $operation_id );
	return '' === $operation_id ? [] : (array) get_option( dtb_veeqo_operations_option_name( $operation_id ), [] );
}

function dtb_veeqo_operations_save( array $operation ): void {
	$operation_id = sanitize_key( (string) ( $operation['operation_id'] ?? '' ) );
	if ( '' === $operation_id ) {
		return;
	}
	$operation['operation_id'] = $operation_id;
	update_option( dtb_veeqo_operations_option_name( $operation_id ), $operation, false );
	$index = array_values( array_unique( array_filter( array_map( 'sanitize_key', (array) get_option( DTB_VEEQO_OPERATIONS_INDEX_OPTION, [] ) ) ) ) );
	$index = array_values( array_diff( $index, [ $operation_id ] ) );
	array_unshift( $index, $operation_id );
	$expired = array_slice( $index, DTB_VEEQO_OPERATIONS_RETENTION );
	update_option( DTB_VEEQO_OPERATIONS_INDEX_OPTION, array_slice( $index, 0, DTB_VEEQO_OPERATIONS_RETENTION ), false );
	foreach ( $expired as $expired_id ) {
		delete_option( dtb_veeqo_operations_option_name( $expired_id ) );
	}
}

/** Return a field-whitelisted operation summary. */
function dtb_veeqo_operations_summary( array $operation ): array {
	$result = is_array( $operation['result'] ?? null ) ? $operation['result'] : [];
	return [
		'operation_id' => sanitize_key( (string) ( $operation['operation_id'] ?? '' ) ),
		'mode'         => sanitize_key( (string) ( $operation['mode'] ?? '' ) ),
		'status'       => sanitize_key( (string) ( $operation['status'] ?? '' ) ),
		'created_at'   => sanitize_text_field( (string) ( $operation['created_at'] ?? '' ) ),
		'started_at'   => sanitize_text_field( (string) ( $operation['started_at'] ?? '' ) ),
		'completed_at' => sanitize_text_field( (string) ( $operation['completed_at'] ?? '' ) ),
		'action_id'    => absint( $operation['action_id'] ?? 0 ),
		'error'        => sanitize_text_field( (string) ( $operation['error'] ?? '' ) ),
		'counts'       => [
			'pages'          => absint( $result['pages'] ?? 0 ),
			'sellables_seen' => absint( $result['sellables_seen'] ?? 0 ),
			'updated'        => absint( $result['updated'] ?? 0 ),
			'unchanged'      => absint( $result['unchanged'] ?? 0 ),
			'unmapped'       => count( (array) ( $result['unmapped_skus'] ?? [] ) ),
			'duplicates'     => count( (array) ( $result['duplicate_skus'] ?? [] ) ),
		],
	];
}

function dtb_veeqo_operations_recent(): array {
	$rows = [];
	$ids  = array_slice( (array) get_option( DTB_VEEQO_OPERATIONS_INDEX_OPTION, [] ), 0, DTB_VEEQO_OPERATIONS_RETENTION );
	foreach ( $ids as $operation_id ) {
		$operation = dtb_veeqo_operations_get( (string) $operation_id );
		if ( ! empty( $operation ) ) {
			$rows[] = dtb_veeqo_operations_summary( $operation );
		}
	}
	return $rows;
}

/** Clear the active marker only when this operation owns it. */
function dtb_veeqo_operations_release_active( string $operation_id ): void {
	$operation_id = sanitize_key( $operation_id );
	if ( '' !== $operation_id && $operation_id === sanitize_key( (string) get_option( DTB_VEEQO_OPERATIONS_ACTIVE_OPTION, '' ) ) ) {
		delete_option( DTB_VEEQO_OPERATIONS_ACTIVE_OPTION );
	}
}

/** Return the active operation, recovering stale running records. */
function dtb_veeqo_operations_active(): array {
	$operation_id = sanitize_key( (string) get_option( DTB_VEEQO_OPERATIONS_ACTIVE_OPTION, '' ) );
	$operation    = dtb_veeqo_operations_get( $operation_id );
	$status       = (string) ( $operation['status'] ?? '' );
	if ( empty( $operation ) || ! in_array( $status, [ 'queued', 'running' ], true ) ) {
		dtb_veeqo_operations_release_active( $operation_id );
		return [];
	}
	if ( 'running' === $status ) {
		$started_at = strtotime( (string) ( $operation['started_at'] ?? '' ) );
		$ttl        = defined( 'DTB_VEEQO_INVENTORY_LOCK_TTL' ) ? DTB_VEEQO_INVENTORY_LOCK_TTL : 20 * MINUTE_IN_SECONDS;
		if ( false !== $started_at && $started_at + $ttl < time() ) {
			$operation['status']       = 'failed';
			$operation['error']        = 'Operation exceeded the reconciliation lease and was marked stale.';
			$operation['completed_at'] = gmdate( 'c' );
			dtb_veeqo_operations_save( $operation );
			dtb_veeqo_operations_release_active( $operation_id );
			return [];
		}
	}
	return $operation;
}

function dtb_veeqo_operations_enqueue( bool $dry_run ): array {
	$readiness = function_exists( 'dtb_veeqo_inventory_readiness' ) ? dtb_veeqo_inventory_readiness() : [ 'ready' => false, 'missing' => [ 'inventory_projection' ] ];
	if ( empty( $readiness['ready'] ) ) {
		return [ 'ok' => false, 'status' => 503, 'code' => 'veeqo_inventory_not_ready', 'message' => 'Veeqo inventory projection is not ready.', 'missing' => array_values( (array) ( $readiness['missing'] ?? [] ) ) ];
	}
	if ( ! function_exists( 'as_enqueue_async_action' ) ) {
		return [ 'ok' => false, 'status' => 503, 'code' => 'action_scheduler_unavailable', 'message' => 'Action Scheduler is unavailable.' ];
	}
	$active = dtb_veeqo_operations_active();
	if ( ! empty( $active ) ) {
		return [ 'ok' => true, 'status' => 202, 'operation' => dtb_veeqo_operations_summary( $active ), 'message' => 'A Veeqo inventory operation is already queued or running.' ];
	}

	$operation_id = sanitize_key( wp_generate_uuid4() );
	if ( ! add_option( DTB_VEEQO_OPERATIONS_ACTIVE_OPTION, $operation_id, '', 'no' ) ) {
		$active = dtb_veeqo_operations_active();
		return [ 'ok' => true, 'status' => 202, 'operation' => empty( $active ) ? [] : dtb_veeqo_operations_summary( $active ), 'message' => 'A Veeqo inventory operation is already queued or running.' ];
	}

	$operation = [
		'operation_id' => $operation_id,
		'mode'         => $dry_run ? 'dry_run' : 'reconcile',
		'status'       => 'queued',
		'created_at'   => gmdate( 'c' ),
		'created_by'   => get_current_user_id(),
		'action_id'    => 0,
		'result'       => null,
		'error'        => '',
	];
	dtb_veeqo_operations_save( $operation );
	$action_id = as_enqueue_async_action( DTB_VEEQO_OPERATIONS_HOOK, [ $operation_id, $dry_run ], defined( 'DTB_VEEQO_INVENTORY_ACTION_GROUP' ) ? DTB_VEEQO_INVENTORY_ACTION_GROUP : 'dtb-integrations', true );
	if ( empty( $action_id ) ) {
		$operation['status']       = 'failed';
		$operation['error']        = 'Action Scheduler did not return an action ID.';
		$operation['completed_at'] = gmdate( 'c' );
		dtb_veeqo_operations_save( $operation );
		dtb_veeqo_operations_release_active( $operation_id );
		return [ 'ok' => false, 'status' => 503, 'code' => 'queue_failed', 'message' => $operation['error'] ];
	}
	$operation['action_id'] = absint( $action_id );
	dtb_veeqo_operations_save( $operation );
	if ( function_exists( 'dtb_veeqo_log' ) ) {
		dtb_veeqo_log( 'info', 'inventory_operation_queued', 'Veeqo inventory operation queued.', [ 'operation_id' => $operation_id, 'action_id' => absint( $action_id ), 'mode' => $operation['mode'], 'operator_id' => get_current_user_id() ] );
	}
	return [ 'ok' => true, 'status' => 202, 'operation' => dtb_veeqo_operations_summary( $operation ), 'message' => 'Veeqo inventory operation queued.' ];
}

function dtb_veeqo_operations_run( string $operation_id, bool $dry_run = false ): void {
	$operation_id = sanitize_key( $operation_id );
	$operation    = dtb_veeqo_operations_get( $operation_id );
	if ( empty( $operation ) || in_array( (string) ( $operation['status'] ?? '' ), [ 'completed', 'failed' ], true ) ) {
		return;
	}
	$operation['status']     = 'running';
	$operation['started_at'] = gmdate( 'c' );
	dtb_veeqo_operations_save( $operation );
	try {
		if ( ! function_exists( 'dtb_veeqo_inventory_reconcile_all' ) ) {
			throw new RuntimeException( 'Canonical Veeqo inventory projection service is unavailable.' );
		}
		$result = dtb_veeqo_inventory_reconcile_all( $dry_run );
		if ( is_wp_error( $result ) ) {
			throw new RuntimeException( $result->get_error_message() );
		}
		$operation['status']       = 'completed';
		$operation['result']       = $result;
		$operation['completed_at'] = gmdate( 'c' );
	} catch ( Throwable $throwable ) {
		$operation['status']       = 'failed';
		$operation['error']        = sanitize_text_field( $throwable->getMessage() );
		$operation['completed_at'] = gmdate( 'c' );
	}
	dtb_veeqo_operations_save( $operation );
	dtb_veeqo_operations_release_active( $operation_id );
}
add_action( DTB_VEEQO_OPERATIONS_HOOK, 'dtb_veeqo_operations_run', 10, 2 );

function dtb_veeqo_operations_overview(): array {
	$config = function_exists( 'dtb_veeqo_config' ) ? dtb_veeqo_config() : [];
	$active = dtb_veeqo_operations_active();
	return [
		'connection' => [
			'api_key_configured' => function_exists( 'dtb_veeqo_production_api_key_configured' ) && dtb_veeqo_production_api_key_configured(),
			'channel_id' => absint( $config['channel_id'] ?? 0 ),
			'warehouse_id' => absint( $config['warehouse_id'] ?? 0 ),
			'delivery_method_id' => absint( $config['delivery_method_id'] ?? 0 ),
		],
		'production_readiness' => function_exists( 'dtb_veeqo_production_readiness' ) ? dtb_veeqo_production_readiness() : [ 'ready' => false ],
		'inventory_readiness' => function_exists( 'dtb_veeqo_inventory_readiness' ) ? dtb_veeqo_inventory_readiness() : [ 'ready' => false ],
		'inventory_diagnostics' => defined( 'DTB_VEEQO_INVENTORY_DIAGNOSTICS' ) ? (array) get_option( DTB_VEEQO_INVENTORY_DIAGNOSTICS, [] ) : [],
		'coverage' => function_exists( 'dtb_veeqo_inventory_coverage_audit' ) ? dtb_veeqo_inventory_coverage_audit( 25 ) : [],
		'active_operation' => empty( $active ) ? null : dtb_veeqo_operations_summary( $active ),
		'recent_operations' => dtb_veeqo_operations_recent(),
	];
}

function dtb_veeqo_operations_lookup_sku( string $sku ) {
	$sku = trim( sanitize_text_field( $sku ) );
	if ( '' === $sku || strlen( $sku ) > 100 ) {
		return new WP_Error( 'invalid_sku', 'Enter a valid SKU.', [ 'status' => 400 ] );
	}
	$woo_id  = function_exists( 'wc_get_product_id_by_sku' ) ? absint( wc_get_product_id_by_sku( $sku ) ) : 0;
	$product = $woo_id > 0 && function_exists( 'wc_get_product' ) ? wc_get_product( $woo_id ) : null;
	$woo = null;
	if ( $product instanceof WC_Product ) {
		$woo = [ 'product_id' => $product->get_id(), 'parent_id' => $product->get_parent_id(), 'name' => $product->get_name(), 'sku' => $product->get_sku(), 'manage_stock' => $product->managing_stock(), 'stock_quantity' => $product->get_stock_quantity(), 'stock_status' => $product->get_stock_status(), 'veeqo_sellable_id' => absint( $product->get_meta( '_veeqo_sellable_id', true ) ), 'veeqo_mapped_sku' => sanitize_text_field( (string) $product->get_meta( '_veeqo_mapped_sku', true ) ), 'edit_url' => get_edit_post_link( $product->get_id(), 'raw' ) ];
	}
	$veeqo_rows = [];
	if ( function_exists( 'dtb_veeqo_request' ) ) {
		$response = dtb_veeqo_request( 'GET', '/products', [ 'query' => $sku, 'page' => '1', 'page_size' => '20' ] );
		if ( ! empty( $response['ok'] ) && is_array( $response['data'] ?? null ) ) {
			foreach ( $response['data'] as $veeqo_product ) {
				if ( ! is_array( $veeqo_product ) ) {
					continue;
				}
				foreach ( (array) ( $veeqo_product['sellables'] ?? [] ) as $sellable ) {
					if ( ! is_array( $sellable ) || $sku !== trim( (string) ( $sellable['sku_code'] ?? '' ) ) ) {
						continue;
					}
					$entries = [];
					foreach ( (array) ( $sellable['stock_entries'] ?? [] ) as $entry ) {
						if ( ! is_array( $entry ) ) {
							continue;
						}
						$entries[] = [ 'warehouse_id' => absint( $entry['warehouse_id'] ?? ( $entry['warehouse']['id'] ?? 0 ) ), 'warehouse_name' => sanitize_text_field( (string) ( $entry['warehouse']['name'] ?? $entry['warehouse_name'] ?? '' ) ), 'available_stock_level' => array_key_exists( 'available_stock_level', $entry ) && is_numeric( $entry['available_stock_level'] ) ? (int) $entry['available_stock_level'] : null, 'available_stock' => array_key_exists( 'available_stock', $entry ) && is_numeric( $entry['available_stock'] ) ? (int) $entry['available_stock'] : null, 'physical_stock_level' => array_key_exists( 'physical_stock_level', $entry ) && is_numeric( $entry['physical_stock_level'] ) ? (int) $entry['physical_stock_level'] : null, 'allocated_stock_level' => array_key_exists( 'allocated_stock_level', $entry ) && is_numeric( $entry['allocated_stock_level'] ) ? (int) $entry['allocated_stock_level'] : null, 'infinite' => ! empty( $entry['infinite'] ) ];
					}
					$veeqo_rows[] = [ 'product_id' => absint( $veeqo_product['id'] ?? 0 ), 'product_name' => sanitize_text_field( (string) ( $veeqo_product['title'] ?? $veeqo_product['name'] ?? '' ) ), 'sellable_id' => absint( $sellable['id'] ?? 0 ), 'sku' => $sku, 'stock_entries' => $entries ];
				}
			}
		}
	}
	return [ 'sku' => $sku, 'woo' => $woo, 'veeqo' => $veeqo_rows ];
}

add_action( 'rest_api_init', static function (): void {
	register_rest_route( 'dtb/v1', '/veeqo/admin/operations/overview', [ 'methods' => WP_REST_Server::READABLE, 'permission_callback' => 'dtb_veeqo_operations_can_manage', 'callback' => static fn(): WP_REST_Response => rest_ensure_response( dtb_veeqo_operations_overview() ) ] );
	register_rest_route( 'dtb/v1', '/veeqo/admin/operations/sku', [ 'methods' => WP_REST_Server::READABLE, 'permission_callback' => 'dtb_veeqo_operations_can_manage', 'args' => [ 'sku' => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ] ], 'callback' => static function ( WP_REST_Request $request ) { $result = dtb_veeqo_operations_lookup_sku( (string) $request->get_param( 'sku' ) ); return is_wp_error( $result ) ? $result : rest_ensure_response( $result ); } ] );
	register_rest_route( 'dtb/v1', '/veeqo/admin/operations/reconcile', [ 'methods' => WP_REST_Server::CREATABLE, 'permission_callback' => 'dtb_veeqo_operations_can_manage', 'args' => [ 'dry_run' => [ 'type' => 'boolean', 'default' => true ] ], 'callback' => static function ( WP_REST_Request $request ): WP_REST_Response { $result = dtb_veeqo_operations_enqueue( rest_sanitize_boolean( $request->get_param( 'dry_run' ) ) ); return new WP_REST_Response( $result, absint( $result['status'] ?? 200 ) ); } ] );
	register_rest_route( 'dtb/v1', '/veeqo/admin/operations/(?P<operation_id>[a-z0-9\-]+)', [ 'methods' => WP_REST_Server::READABLE, 'permission_callback' => 'dtb_veeqo_operations_can_manage', 'callback' => static function ( WP_REST_Request $request ) { $operation = dtb_veeqo_operations_get( (string) $request['operation_id'] ); return empty( $operation ) ? new WP_Error( 'operation_not_found', 'Operation not found.', [ 'status' => 404 ] ) : rest_ensure_response( $operation ); } ] );
}, 50 );

add_action( 'admin_menu', static function (): void {
	add_submenu_page( 'woocommerce', __( 'Veeqo Operations', 'drywall-toolbox' ), __( 'Veeqo Operations', 'drywall-toolbox' ), 'manage_woocommerce', 'dtb-veeqo-operations', 'dtb_veeqo_operations_render_page' );
}, 35 );

add_action( 'admin_enqueue_scripts', static function ( string $hook_suffix ): void {
	if ( 'woocommerce_page_dtb-veeqo-operations' === $hook_suffix ) {
		wp_enqueue_script( 'wp-api-fetch' );
	}
}, 20 );

function dtb_veeqo_operations_render_page(): void {
	if ( ! dtb_veeqo_operations_can_manage() ) {
		wp_die( esc_html__( 'You do not have permission to manage Veeqo operations.', 'drywall-toolbox' ) );
	}
	?>
	<div class="wrap dtb-veeqo-ops">
		<h1><?php esc_html_e( 'Veeqo Operations', 'drywall-toolbox' ); ?></h1>
		<p><?php esc_html_e( 'Redacted connection diagnostics, exact-SKU inspection, and queued Veeqo-to-WooCommerce inventory reconciliation.', 'drywall-toolbox' ); ?></p>
		<div id="dtb-veeqo-notice" aria-live="polite"></div>
		<div class="dtb-veeqo-grid">
			<section class="card"><h2><?php esc_html_e( 'Connection & readiness', 'drywall-toolbox' ); ?></h2><div id="dtb-veeqo-overview">Loading…</div><p><button class="button" id="dtb-veeqo-test-connection"><?php esc_html_e( 'Test connection', 'drywall-toolbox' ); ?></button> <button class="button" id="dtb-veeqo-refresh"><?php esc_html_e( 'Refresh', 'drywall-toolbox' ); ?></button></p></section>
			<section class="card"><h2><?php esc_html_e( 'Inventory reconciliation', 'drywall-toolbox' ); ?></h2><p><?php esc_html_e( 'Dry run calculates changes without writing WooCommerce. Reconcile applies configured-warehouse stock.', 'drywall-toolbox' ); ?></p><p><button class="button" id="dtb-veeqo-dry-run"><?php esc_html_e( 'Queue dry run', 'drywall-toolbox' ); ?></button> <button class="button button-primary" id="dtb-veeqo-reconcile"><?php esc_html_e( 'Queue reconciliation', 'drywall-toolbox' ); ?></button></p><pre id="dtb-veeqo-operation">No active operation.</pre></section>
			<section class="card dtb-veeqo-wide"><h2><?php esc_html_e( 'Exact SKU inspector', 'drywall-toolbox' ); ?></h2><form id="dtb-veeqo-sku-form"><label for="dtb-veeqo-sku" class="screen-reader-text"><?php esc_html_e( 'Exact SKU', 'drywall-toolbox' ); ?></label><input type="text" id="dtb-veeqo-sku" maxlength="100" placeholder="SPTAPER" required> <button class="button"><?php esc_html_e( 'Inspect SKU', 'drywall-toolbox' ); ?></button></form><pre id="dtb-veeqo-sku-result">Enter an exact WooCommerce/Veeqo SKU.</pre></section>
			<section class="card dtb-veeqo-wide"><h2><?php esc_html_e( 'Recent operations', 'drywall-toolbox' ); ?></h2><div id="dtb-veeqo-history">Loading…</div></section>
		</div>
	</div>
	<style>.dtb-veeqo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;max-width:1400px}.dtb-veeqo-grid .card{max-width:none;margin:0;padding:20px}.dtb-veeqo-wide{grid-column:1/-1}.dtb-veeqo-ops pre{background:#f6f7f7;border:1px solid #dcdcde;padding:12px;max-height:420px;overflow:auto;white-space:pre-wrap}.dtb-veeqo-kpis{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px}.dtb-veeqo-kpi{background:#f6f7f7;padding:12px;border-left:4px solid #2271b1}.dtb-veeqo-good{border-left-color:#00a32a}.dtb-veeqo-bad{border-left-color:#d63638}.dtb-veeqo-history{width:100%;border-collapse:collapse}.dtb-veeqo-history th,.dtb-veeqo-history td{text-align:left;padding:8px;border-bottom:1px solid #dcdcde}@media(max-width:900px){.dtb-veeqo-grid{grid-template-columns:1fr}.dtb-veeqo-wide{grid-column:auto}.dtb-veeqo-kpis{grid-template-columns:repeat(2,1fr)}}</style>
	<script>
	(function(){
		const noticeEl=document.getElementById('dtb-veeqo-notice');
		const api=window.wp&&wp.apiFetch;
		const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
		const notice=(message,type='success')=>{noticeEl.innerHTML='<div class="notice notice-'+type+'"><p>'+esc(message)+'</p></div>';};
		if(!api){notice('WordPress REST client is unavailable. Reload the page or verify wp-api-fetch is loading.','error');return;}
		const $=id=>document.getElementById(id);let pollTimer=null;let pollAttempts=0;
		function renderHistory(rows){$('dtb-veeqo-history').innerHTML=rows.length?'<table class="dtb-veeqo-history"><thead><tr><th>Created</th><th>Mode</th><th>Status</th><th>Updated</th><th>Error</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.created_at)+'</td><td>'+esc(r.mode)+'</td><td>'+esc(r.status)+'</td><td>'+esc(r.counts&&r.counts.updated||0)+'</td><td>'+esc(r.error||'')+'</td></tr>').join('')+'</tbody></table>':'No operations recorded.';}
		function renderOperation(op){$('dtb-veeqo-operation').textContent=JSON.stringify(op,null,2);}
		function renderOverview(data){const c=data.connection||{},p=data.production_readiness||{},i=data.inventory_readiness||{},d=data.inventory_diagnostics||{},cv=data.coverage||{};$('dtb-veeqo-overview').innerHTML='<div class="dtb-veeqo-kpis"><div class="dtb-veeqo-kpi '+(c.api_key_configured?'dtb-veeqo-good':'dtb-veeqo-bad')+'"><strong>API key</strong><br>'+(c.api_key_configured?'Configured':'Missing')+'</div><div class="dtb-veeqo-kpi '+(p.ready?'dtb-veeqo-good':'dtb-veeqo-bad')+'"><strong>Order readiness</strong><br>'+(p.ready?'Ready':'Missing: '+esc((p.missing||[]).join(', ')))+'</div><div class="dtb-veeqo-kpi '+(i.ready?'dtb-veeqo-good':'dtb-veeqo-bad')+'"><strong>Inventory readiness</strong><br>'+(i.ready?'Ready':'Missing: '+esc((i.missing||[]).join(', ')))+'</div><div class="dtb-veeqo-kpi"><strong>Mappings</strong><br>'+esc(cv.exactly_mapped||0)+' / '+esc(cv.total_sku_products||0)+'</div></div><p><strong>Channel:</strong> '+esc(c.channel_id||0)+' &nbsp; <strong>Warehouse:</strong> '+esc(c.warehouse_id||0)+' &nbsp; <strong>Delivery method:</strong> '+esc(c.delivery_method_id||0)+'</p><p><strong>Last reconciliation:</strong> '+esc(d.completed_at||'Never')+' &nbsp; <strong>Updated:</strong> '+esc(d.updated||0)+'</p>';renderHistory(data.recent_operations||[]);if(data.active_operation){renderOperation(data.active_operation);poll(data.active_operation.operation_id,true);}}
		async function load(){try{renderOverview(await api({path:'/dtb/v1/veeqo/admin/operations/overview'}));}catch(e){notice(e.message||'Overview failed.','error');}}
		async function queue(dry){try{const r=await api({path:'/dtb/v1/veeqo/admin/operations/reconcile',method:'POST',data:{dry_run:dry}});notice(r.message||'Queued.');renderOperation(r.operation||r);if(r.operation){poll(r.operation.operation_id,true);}}catch(e){notice(e.message||'Queue failed.','error');}}
		function poll(id,reset=false){if(!id)return;if(reset)pollAttempts=0;clearTimeout(pollTimer);if(pollAttempts>=<?php echo (int) DTB_VEEQO_OPERATIONS_POLL_LIMIT; ?>){notice('Operation polling timed out. Refresh to check the durable operation status.','error');return;}pollAttempts++;pollTimer=setTimeout(async()=>{try{const op=await api({path:'/dtb/v1/veeqo/admin/operations/'+encodeURIComponent(id)});renderOperation(op);if(op.status==='queued'||op.status==='running'){poll(id);}else{pollAttempts=0;load();}}catch(e){notice(e.message||'Operation status failed.','error');}},3000);}
		$('dtb-veeqo-refresh').onclick=load;$('dtb-veeqo-dry-run').onclick=()=>queue(true);$('dtb-veeqo-reconcile').onclick=()=>{if(confirm('Apply configured-warehouse Veeqo stock to WooCommerce?'))queue(false);};$('dtb-veeqo-test-connection').onclick=async()=>{try{await api({path:'/dtb/v1/veeqo/admin/connection/test',method:'POST'});notice('Connection validated.');load();}catch(e){notice(e.message||'Connection validation failed.','error');}};$('dtb-veeqo-sku-form').onsubmit=async e=>{e.preventDefault();try{$('dtb-veeqo-sku-result').textContent=JSON.stringify(await api({path:'/dtb/v1/veeqo/admin/operations/sku?sku='+encodeURIComponent($('dtb-veeqo-sku').value.trim())}),null,2);}catch(err){notice(err.message||'SKU lookup failed.','error');}};load();
	})();
	</script>
	<?php
}
