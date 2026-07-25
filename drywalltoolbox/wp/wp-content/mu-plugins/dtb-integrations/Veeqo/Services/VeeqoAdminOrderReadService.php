<?php
/**
 * Veeqo admin order read model.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/** Normalize one Veeqo order list record. */
function dtb_veeqo_admin_normalize_order_summary( array $order ): array {
	$deliver_to = is_array( $order['deliver_to'] ?? null ) ? $order['deliver_to'] : [];
	$customer   = is_array( $order['customer'] ?? null ) ? $order['customer'] : [];
	$channel    = is_array( $order['channel'] ?? null ) ? $order['channel'] : [];
	$allocations = [];
	foreach ( (array) ( $order['allocations'] ?? [] ) as $allocation ) {
		if ( ! is_array( $allocation ) ) {
			continue;
		}
		$shipment = is_array( $allocation['shipment'] ?? null ) ? $allocation['shipment'] : [];
		$tracking = is_array( $shipment['tracking_number'] ?? null ) ? $shipment['tracking_number'] : [];
		$allocations[] = [
			'id'             => absint( $allocation['id'] ?? 0 ),
			'warehouse_id'   => absint( $allocation['warehouse_id'] ?? ( $allocation['warehouse']['id'] ?? 0 ) ),
			'warehouse_name' => sanitize_text_field( (string) ( $allocation['warehouse']['name'] ?? '' ) ),
			'packed'         => ! empty( $allocation['packed_completely'] ),
			'picked'         => ! empty( $allocation['picked_completely'] ),
			'shipped'        => ! empty( $shipment ),
			'tracking'       => sanitize_text_field( (string) ( $tracking['tracking_number'] ?? $shipment['tracking_number'] ?? '' ) ),
		];
	}
	$first_name = sanitize_text_field( (string) ( $deliver_to['first_name'] ?? $customer['first_name'] ?? '' ) );
	$last_name  = sanitize_text_field( (string) ( $deliver_to['last_name'] ?? $customer['last_name'] ?? '' ) );
	return [
		'id'            => absint( $order['id'] ?? 0 ),
		'number'        => sanitize_text_field( (string) ( $order['number'] ?? $order['channel_order_number'] ?? '' ) ),
		'status'        => sanitize_key( (string) ( $order['status'] ?? '' ) ),
		'created_at'    => sanitize_text_field( (string) ( $order['created_at'] ?? '' ) ),
		'updated_at'    => sanitize_text_field( (string) ( $order['updated_at'] ?? '' ) ),
		'due_date'      => sanitize_text_field( (string) ( $order['due_date'] ?? '' ) ),
		'shipped_at'    => sanitize_text_field( (string) ( $order['shipped_at'] ?? '' ) ),
		'customer_name' => trim( $first_name . ' ' . $last_name ),
		'customer_city' => sanitize_text_field( (string) ( $deliver_to['city'] ?? '' ) ),
		'channel_id'    => absint( $channel['id'] ?? 0 ),
		'channel_name'  => sanitize_text_field( (string) ( $channel['name'] ?? $channel['short_name'] ?? '' ) ),
		'currency'      => sanitize_text_field( (string) ( $channel['currency_code'] ?? $order['currency_code'] ?? 'USD' ) ),
		'total_price'   => is_numeric( $order['total_price'] ?? null ) ? (float) $order['total_price'] : 0.0,
		'allocations'   => $allocations,
		'tags'          => array_values( array_filter( array_map( static function ( $tag ): string {
			return sanitize_text_field( (string) ( is_array( $tag ) ? ( $tag['name'] ?? '' ) : $tag ) );
		}, (array) ( $order['tags'] ?? [] ) ) ) ),
	];
}

/** Return a paginated Veeqo orders page. */
function dtb_veeqo_admin_orders_page( array $args ) {
	$page         = max( 1, absint( $args['page'] ?? 1 ) );
	$per_page     = min( DTB_VEEQO_ADMIN_MAX_PAGE_SIZE, max( 1, absint( $args['per_page'] ?? 50 ) ) );
	$query        = trim( sanitize_text_field( (string) ( $args['query'] ?? '' ) ) );
	$status       = sanitize_key( (string) ( $args['status'] ?? '' ) );
	$warehouse_id = absint( $args['warehouse_id'] ?? 0 );
	$params       = [ 'page' => (string) $page, 'page_size' => (string) $per_page ];
	if ( '' !== $query ) {
		$params['query'] = $query;
	}
	if ( '' !== $status && 'all' !== $status ) {
		$params['status'] = $status;
	}
	if ( $warehouse_id > 0 ) {
		$params['allocated_at'] = (string) $warehouse_id;
	}
	$response = dtb_veeqo_admin_cached_get( '/orders', $params, 15, ! empty( $args['force'] ) );
	if ( is_wp_error( $response ) ) {
		return $response;
	}
	$orders = dtb_veeqo_admin_extract_list( $response['data'], 'orders' );
	$items  = [];
	foreach ( $orders as $order ) {
		if ( is_array( $order ) ) {
			$items[] = dtb_veeqo_admin_normalize_order_summary( $order );
		}
	}
	return [
		'page'         => $page,
		'per_page'     => $per_page,
		'has_previous' => $page > 1,
		'has_next'     => count( $orders ) === $per_page,
		'items'        => $items,
		'cached'       => (bool) $response['cached'],
		'stale'        => (bool) $response['stale'],
		'fetched_at'   => $response['fetched_at'],
	];
}

/** Return a normalized Veeqo order detail for fulfillment operations. */
function dtb_veeqo_admin_order_detail( int $order_id, bool $force = false ) {
	if ( $order_id <= 0 ) {
		return new WP_Error( 'invalid_veeqo_order', 'A valid Veeqo order ID is required.', [ 'status' => 400 ] );
	}
	$response = dtb_veeqo_admin_cached_get( '/orders/' . $order_id, [], 15, $force );
	if ( is_wp_error( $response ) ) {
		return $response;
	}
	$order = is_array( $response['data'] ) ? $response['data'] : [];
	if ( empty( $order ) ) {
		return new WP_Error( 'veeqo_order_not_found', 'Veeqo order was not returned.', [ 'status' => 404 ] );
	}
	$summary     = dtb_veeqo_admin_normalize_order_summary( $order );
	$deliver_to  = is_array( $order['deliver_to'] ?? null ) ? $order['deliver_to'] : [];
	$customer    = is_array( $order['customer'] ?? null ) ? $order['customer'] : [];
	$line_items  = [];
	foreach ( (array) ( $order['line_items'] ?? [] ) as $line_item ) {
		if ( ! is_array( $line_item ) ) {
			continue;
		}
		$sellable = is_array( $line_item['sellable'] ?? null ) ? $line_item['sellable'] : [];
		$line_items[] = [
			'id'          => absint( $line_item['id'] ?? 0 ),
			'sellable_id' => absint( $sellable['id'] ?? 0 ),
			'sku'         => sanitize_text_field( (string) ( $sellable['sku_code'] ?? '' ) ),
			'title'       => sanitize_text_field( (string) ( $sellable['full_title'] ?? $sellable['title'] ?? '' ) ),
			'quantity'    => is_numeric( $line_item['quantity'] ?? null ) ? (float) $line_item['quantity'] : 0,
			'price'       => is_numeric( $line_item['price_per_unit'] ?? null ) ? (float) $line_item['price_per_unit'] : 0.0,
		];
	}
	$allocations = [];
	foreach ( (array) ( $order['allocations'] ?? [] ) as $allocation ) {
		if ( ! is_array( $allocation ) ) {
			continue;
		}
		$shipment        = is_array( $allocation['shipment'] ?? null ) ? $allocation['shipment'] : [];
		$tracking        = is_array( $shipment['tracking_number'] ?? null ) ? $shipment['tracking_number'] : [];
		$allocation_lines = [];
		foreach ( (array) ( $allocation['line_items'] ?? [] ) as $allocation_line ) {
			if ( ! is_array( $allocation_line ) ) {
				continue;
			}
			$sellable = is_array( $allocation_line['sellable'] ?? null ) ? $allocation_line['sellable'] : [];
			$allocation_lines[] = [
				'id'          => absint( $allocation_line['id'] ?? 0 ),
				'sellable_id' => absint( $sellable['id'] ?? 0 ),
				'sku'         => sanitize_text_field( (string) ( $sellable['sku_code'] ?? '' ) ),
				'title'       => sanitize_text_field( (string) ( $sellable['full_title'] ?? $sellable['title'] ?? '' ) ),
				'quantity'    => is_numeric( $allocation_line['quantity'] ?? null ) ? (float) $allocation_line['quantity'] : 0,
			];
		}
		$allocations[] = [
			'id'             => absint( $allocation['id'] ?? 0 ),
			'warehouse_id'   => absint( $allocation['warehouse_id'] ?? ( $allocation['warehouse']['id'] ?? 0 ) ),
			'warehouse_name' => sanitize_text_field( (string) ( $allocation['warehouse']['name'] ?? '' ) ),
			'packed'         => ! empty( $allocation['packed_completely'] ),
			'picked'         => ! empty( $allocation['picked_completely'] ),
			'total_weight'   => is_numeric( $allocation['total_weight'] ?? null ) ? (float) $allocation['total_weight'] : null,
			'shipment'       => empty( $shipment ) ? null : [
				'id'       => absint( $shipment['id'] ?? 0 ),
				'carrier'  => sanitize_text_field( (string) ( $shipment['carrier']['name'] ?? '' ) ),
				'tracking' => sanitize_text_field( (string) ( $tracking['tracking_number'] ?? $shipment['tracking_number'] ?? '' ) ),
			],
			'line_items'     => $allocation_lines,
		];
	}
	return [
		'summary' => $summary,
		'customer' => [
			'name'  => trim( sanitize_text_field( (string) ( $deliver_to['first_name'] ?? '' ) ) . ' ' . sanitize_text_field( (string) ( $deliver_to['last_name'] ?? '' ) ) ),
			'email' => sanitize_email( (string) ( $customer['email'] ?? $deliver_to['email'] ?? '' ) ),
			'phone' => sanitize_text_field( (string) ( $deliver_to['phone'] ?? $customer['phone'] ?? '' ) ),
		],
		'shipping_address' => [
			'company'  => sanitize_text_field( (string) ( $deliver_to['company'] ?? '' ) ),
			'address1' => sanitize_text_field( (string) ( $deliver_to['address1'] ?? '' ) ),
			'address2' => sanitize_text_field( (string) ( $deliver_to['address2'] ?? '' ) ),
			'city'     => sanitize_text_field( (string) ( $deliver_to['city'] ?? '' ) ),
			'state'    => sanitize_text_field( (string) ( $deliver_to['state'] ?? '' ) ),
			'zip'      => sanitize_text_field( (string) ( $deliver_to['zip'] ?? '' ) ),
			'country'  => sanitize_text_field( (string) ( $deliver_to['country'] ?? '' ) ),
		],
		'line_items'  => $line_items,
		'allocations' => $allocations,
		'notes'       => sanitize_textarea_field( (string) ( $order['notes'] ?? '' ) ),
		'cached'      => (bool) $response['cached'],
		'stale'       => (bool) $response['stale'],
		'fetched_at'  => $response['fetched_at'],
	];
}
