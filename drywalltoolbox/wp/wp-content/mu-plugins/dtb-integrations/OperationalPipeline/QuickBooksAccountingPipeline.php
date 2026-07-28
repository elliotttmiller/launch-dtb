<?php
/**
 * DTB Integrations — QuickBooks accounting projection pipeline.
 *
 * All accounting writes are queue-owned. This file maps one captured order or
 * one concrete refund to QuickBooks and reconciles deterministic document IDs
 * before creating anything remotely.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_qbo_accounting_ref( string $key, string $default_id = '', string $default_name = '' ): array {
	$key        = strtoupper( sanitize_key( $key ) );
	$id_const   = 'DTB_QBO_ITEM_' . $key . '_ID';
	$name_const = 'DTB_QBO_ITEM_' . $key . '_NAME';
	$value      = defined( $id_const ) ? constant( $id_const ) : get_option( strtolower( $id_const ), $default_id );
	$name       = defined( $name_const ) ? constant( $name_const ) : get_option( strtolower( $name_const ), $default_name );
	return [ 'value' => sanitize_text_field( (string) $value ), 'name' => sanitize_text_field( (string) $name ) ];
}

function dtb_qbo_money( mixed $amount ): float {
	return (float) wc_format_decimal( (float) $amount, 2 );
}

function dtb_qbo_require_ref( string $key, string $name ): array|WP_Error {
	$ref = dtb_qbo_accounting_ref( $key, '', $name );
	return '' === $ref['value'] ? new WP_Error( 'qbo_reference_missing', sprintf( 'QuickBooks %s item reference is not configured.', strtolower( $name ) ) ) : $ref;
}

function dtb_qbo_product_item_ref_for_order_item( WC_Order_Item_Product $item ): array|WP_Error {
	$product = $item->get_product();
	if ( $product instanceof WC_Product ) {
		foreach ( [ '_dtb_qbo_item_id', '_qbo_item_id', '_quickbooks_item_id' ] as $meta_key ) {
			$item_id = sanitize_text_field( (string) $product->get_meta( $meta_key, true ) );
			if ( '' !== $item_id ) {
				return [ 'value' => $item_id, 'name' => sanitize_text_field( $product->get_sku() ?: $product->get_name() ) ];
			}
		}
	}
	return dtb_qbo_require_ref( 'product', 'Product Sales' );
}

function dtb_qbo_build_sales_lines_for_order( WC_Order $order, bool $refund_mode = false ): array|WP_Error {
	$lines = [];
	foreach ( $order->get_items( 'line_item' ) as $item ) {
		if ( ! $item instanceof WC_Order_Item_Product ) {
			continue;
		}
		$amount = dtb_qbo_money( $order->get_line_total( $item, true ) );
		if ( $amount <= 0 ) {
			continue;
		}
		$ref = dtb_qbo_product_item_ref_for_order_item( $item );
		if ( is_wp_error( $ref ) ) {
			return $ref;
		}
		$qty     = max( 1, (int) $item->get_quantity() );
		$product = $item->get_product();
		$sku     = $product instanceof WC_Product ? (string) $product->get_sku() : '';
		$lines[] = [
			'Amount'      => $amount,
			'DetailType'  => 'SalesItemLineDetail',
			'Description' => implode( ' — ', array_filter( [ $item->get_name(), $sku ? 'SKU: ' . $sku : '' ] ) ),
			'SalesItemLineDetail' => [ 'Qty' => $qty, 'UnitPrice' => dtb_qbo_money( $amount / $qty ), 'ItemRef' => $ref ],
		];
	}
	$shipping = dtb_qbo_money( $order->get_shipping_total() );
	if ( $shipping > 0 ) {
		$ref = dtb_qbo_require_ref( 'shipping', 'Shipping' );
		if ( is_wp_error( $ref ) ) {
			return $ref;
		}
		$lines[] = [
			'Amount'      => $shipping,
			'DetailType'  => 'SalesItemLineDetail',
			'Description' => 'Shipping for WooCommerce order #' . $order->get_order_number(),
			'SalesItemLineDetail' => [ 'Qty' => 1, 'UnitPrice' => $shipping, 'ItemRef' => $ref ],
		];
	}
	$discount = dtb_qbo_money( $order->get_discount_total() );
	if ( $discount > 0 ) {
		$ref = dtb_qbo_require_ref( 'discount', 'Discount' );
		if ( is_wp_error( $ref ) ) {
			return $ref;
		}
		$lines[] = [
			'Amount'      => -1 * $discount,
			'DetailType'  => 'SalesItemLineDetail',
			'Description' => 'Discount for WooCommerce order #' . $order->get_order_number(),
			'SalesItemLineDetail' => [ 'Qty' => 1, 'UnitPrice' => -1 * $discount, 'ItemRef' => $ref ],
		];
	}
	$tax     = dtb_qbo_money( $order->get_total_tax() );
	$tax_ref = dtb_qbo_accounting_ref( 'tax', '', 'Sales Tax' );
	if ( $tax > 0 && '' !== $tax_ref['value'] ) {
		$lines[] = [
			'Amount'      => $tax,
			'DetailType'  => 'SalesItemLineDetail',
			'Description' => 'Tax for WooCommerce order #' . $order->get_order_number(),
			'SalesItemLineDetail' => [ 'Qty' => 1, 'UnitPrice' => $tax, 'ItemRef' => $tax_ref ],
		];
	}
	return $lines;
}

function dtb_qbo_build_refund_lines_for_order( WC_Order $order, WC_Order_Refund $refund ): array|WP_Error {
	$total = dtb_qbo_money( abs( (float) $refund->get_amount() ) );
	if ( $total <= 0 ) {
		return new WP_Error( 'no_refund_total', 'WooCommerce refund has no positive amount.' );
	}
	$ref = dtb_qbo_require_ref( 'refund', 'Refund' );
	if ( is_wp_error( $ref ) ) {
		return $ref;
	}
	return [ [
		'Amount'      => $total,
		'DetailType'  => 'SalesItemLineDetail',
		'Description' => sprintf( 'Refund #%d for Drywall Toolbox order #%s', $refund->get_id(), $order->get_order_number() ),
		'SalesItemLineDetail' => [ 'Qty' => 1, 'UnitPrice' => $total, 'ItemRef' => $ref ],
	] ];
}

function dtb_qbo_order_doc_number( WC_Order $order, string $prefix = 'DTB' ): string {
	return substr( sanitize_text_field( $prefix . '-' . $order->get_id() ), 0, 21 );
}

function dtb_qbo_refund_doc_number( WC_Order $order, int $refund_id ): string {
	return substr( sanitize_text_field( 'DTB-R-' . absint( $refund_id ) ), 0, 21 );
}

function dtb_qbo_refund_meta_key( int $refund_id ): string {
	return '_dtb_quickbooks_refund_id_' . absint( $refund_id );
}

function dtb_qbo_find_entity_by_doc_number( string $entity, string $doc_number ): array|WP_Error|null {
	if ( ! in_array( $entity, [ 'SalesReceipt', 'RefundReceipt' ], true ) ) {
		return new WP_Error( 'qbo_invalid_entity', 'Unsupported QuickBooks entity query.' );
	}
	$safe   = str_replace( "'", "''", $doc_number );
	$result = dtb_qbo_request( 'GET', '/query', [ 'query' => "SELECT * FROM {$entity} WHERE DocNumber = '{$safe}' MAXRESULTS 2" ] );
	if ( empty( $result['ok'] ) ) {
		return new WP_Error( 'qbo_reconciliation_failed', (string) ( $result['error'] ?? 'QuickBooks reconciliation query failed.' ) );
	}
	$rows = (array) ( $result['data']['QueryResponse'][ $entity ] ?? [] );
	if ( count( $rows ) > 1 ) {
		return new WP_Error( 'qbo_duplicate_ambiguous', 'Multiple QuickBooks records use the same DTB document number.' );
	}
	return $rows[0] ?? null;
}

function dtb_qbo_store_order_entity( WC_Order $order, string $id ): void {
	$order->update_meta_data( '_dtb_qbo_synced', '1' );
	$order->update_meta_data( '_dtb_qbo_receipt_id', $id );
	$order->update_meta_data( '_dtb_quickbooks_entity_id', $id );
	$order->update_meta_data( '_dtb_quickbooks_entity_type', 'sales_receipt' );
	$order->save_meta_data();
}

function dtb_qbo_sync_order_pipeline( WC_Order $order ): array|WP_Error {
	$existing_id = (string) ( $order->get_meta( '_dtb_quickbooks_entity_id', true ) ?: $order->get_meta( '_dtb_qbo_receipt_id', true ) );
	if ( '' !== $existing_id || $order->get_meta( '_dtb_qbo_synced' ) ) {
		return new WP_Error( 'already_synced', 'Order already synced to QuickBooks.', [ 'entity_id' => $existing_id ] );
	}
	if ( ! $order->get_date_paid() || '' === (string) $order->get_transaction_id() ) {
		return new WP_Error( 'payment_not_captured', 'QuickBooks projection requires a captured WooCommerce payment.' );
	}
	if ( ! dtb_qbo_enabled() ) {
		return new WP_Error( 'qbo_not_connected', 'QuickBooks is not connected.' );
	}
	if ( function_exists( 'dtb_order_integration_acquire_lock' ) && ! dtb_order_integration_acquire_lock( 'quickbooks', (int) $order->get_id() ) ) {
		return new WP_Error( 'qbo_locked', 'A QuickBooks sync is already in progress for this order.' );
	}
	try {
		$doc_number = dtb_qbo_order_doc_number( $order );
		$found      = dtb_qbo_find_entity_by_doc_number( 'SalesReceipt', $doc_number );
		if ( is_wp_error( $found ) ) {
			return $found;
		}
		if ( is_array( $found ) && ! empty( $found['Id'] ) ) {
			dtb_qbo_store_order_entity( $order, (string) $found['Id'] );
			return [ 'SalesReceipt' => $found, 'reconciled' => true ];
		}
		$lines = dtb_qbo_build_sales_lines_for_order( $order );
		if ( is_wp_error( $lines ) ) {
			return $lines;
		}
		if ( empty( $lines ) ) {
			return new WP_Error( 'no_line_items', 'Order has no valid accounting lines.' );
		}
		$customer_id = dtb_qbo_get_or_create_customer( $order );
		if ( '' === $customer_id ) {
			return new WP_Error( 'qbo_customer_failed', 'QuickBooks customer projection failed.' );
		}
		$created = $order->get_date_created();
		$result  = dtb_qbo_request( 'POST', '/salesreceipt', [], [
			'Line'        => $lines,
			'CustomerRef' => [ 'value' => $customer_id ],
			'DocNumber'   => $doc_number,
			'TxnDate'     => $created ? gmdate( 'Y-m-d', $created->getTimestamp() ) : gmdate( 'Y-m-d' ),
			'PrivateNote' => 'Drywall Toolbox WooCommerce order #' . $order->get_order_number(),
			'CurrencyRef' => [ 'value' => strtoupper( $order->get_currency() ?: get_woocommerce_currency() ) ],
		] );
		if ( empty( $result['ok'] ) ) {
			return new WP_Error( 'qbo_sync_failed', (string) ( $result['error'] ?? 'QuickBooks SalesReceipt creation failed.' ), [ 'status' => $result['status'] ?? 0, 'retryable' => $result['retryable'] ?? false ] );
		}
		$id = (string) ( $result['data']['SalesReceipt']['Id'] ?? '' );
		if ( '' === $id ) {
			return new WP_Error( 'qbo_invalid_success', 'QuickBooks did not return a SalesReceipt ID.' );
		}
		$verified = dtb_qbo_find_entity_by_doc_number( 'SalesReceipt', $doc_number );
		if ( is_wp_error( $verified ) || ! is_array( $verified ) || (string) ( $verified['Id'] ?? '' ) !== $id ) {
			return new WP_Error( 'qbo_reconciliation_failed', 'QuickBooks SalesReceipt could not be reconciled after creation.' );
		}
		dtb_qbo_store_order_entity( $order, $id );
		return $result['data'];
	} finally {
		if ( function_exists( 'dtb_order_integration_release_lock' ) ) {
			dtb_order_integration_release_lock( 'quickbooks', (int) $order->get_id() );
		}
	}
}

function dtb_qbo_sync_refund( WC_Order $order, int $refund_id ): array|WP_Error {
	$refund_id = absint( $refund_id );
	$refund    = $refund_id ? wc_get_order( $refund_id ) : null;
	if ( ! $refund instanceof WC_Order_Refund || (int) $refund->get_parent_id() !== (int) $order->get_id() ) {
		return new WP_Error( 'invalid_refund', 'The WooCommerce refund could not be verified for this order.' );
	}
	$meta_key = dtb_qbo_refund_meta_key( $refund_id );
	if ( '' !== (string) $order->get_meta( $meta_key, true ) ) {
		return new WP_Error( 'already_synced', 'This refund is already synced to QuickBooks.' );
	}
	if ( ! dtb_qbo_enabled() ) {
		return new WP_Error( 'qbo_not_connected', 'QuickBooks is not connected.' );
	}
	if ( function_exists( 'dtb_order_integration_acquire_lock' ) && ! dtb_order_integration_acquire_lock( 'quickbooks', (int) $order->get_id() ) ) {
		return new WP_Error( 'qbo_locked', 'A QuickBooks sync is already in progress for this order.' );
	}
	try {
		$doc_number = dtb_qbo_refund_doc_number( $order, $refund_id );
		$found      = dtb_qbo_find_entity_by_doc_number( 'RefundReceipt', $doc_number );
		if ( is_wp_error( $found ) ) {
			return $found;
		}
		if ( is_array( $found ) && ! empty( $found['Id'] ) ) {
			$order->update_meta_data( $meta_key, (string) $found['Id'] );
			$order->save_meta_data();
			return [ 'RefundReceipt' => $found, 'reconciled' => true ];
		}
		$lines = dtb_qbo_build_refund_lines_for_order( $order, $refund );
		if ( is_wp_error( $lines ) ) {
			return $lines;
		}
		$customer_id = dtb_qbo_get_or_create_customer( $order );
		if ( '' === $customer_id ) {
			return new WP_Error( 'qbo_customer_failed', 'QuickBooks customer projection failed.' );
		}
		$created = $refund->get_date_created();
		$result  = dtb_qbo_request( 'POST', '/refundreceipt', [], [
			'Line'        => $lines,
			'CustomerRef' => [ 'value' => $customer_id ],
			'DocNumber'   => $doc_number,
			'TxnDate'     => $created ? gmdate( 'Y-m-d', $created->getTimestamp() ) : gmdate( 'Y-m-d' ),
			'PrivateNote' => sprintf( 'WooCommerce refund #%d for order #%s', $refund_id, $order->get_order_number() ),
			'CurrencyRef' => [ 'value' => strtoupper( $order->get_currency() ?: get_woocommerce_currency() ) ],
		] );
		if ( empty( $result['ok'] ) ) {
			return new WP_Error( 'qbo_refund_sync_failed', (string) ( $result['error'] ?? 'QuickBooks RefundReceipt creation failed.' ), [ 'status' => $result['status'] ?? 0, 'retryable' => $result['retryable'] ?? false ] );
		}
		$id = (string) ( $result['data']['RefundReceipt']['Id'] ?? '' );
		if ( '' === $id ) {
			return new WP_Error( 'qbo_invalid_success', 'QuickBooks did not return a RefundReceipt ID.' );
		}
		$verified = dtb_qbo_find_entity_by_doc_number( 'RefundReceipt', $doc_number );
		if ( is_wp_error( $verified ) || ! is_array( $verified ) || (string) ( $verified['Id'] ?? '' ) !== $id ) {
			return new WP_Error( 'qbo_reconciliation_failed', 'QuickBooks RefundReceipt could not be reconciled after creation.' );
		}
		$order->update_meta_data( $meta_key, $id );
		$order->update_meta_data( '_dtb_quickbooks_refund_id', $id );
		$order->update_meta_data( '_dtb_quickbooks_refund_type', 'refund_receipt' );
		$order->save_meta_data();
		return $result['data'];
	} finally {
		if ( function_exists( 'dtb_order_integration_release_lock' ) ) {
			dtb_order_integration_release_lock( 'quickbooks', (int) $order->get_id() );
		}
	}
}
