<?php
/**
 * DTB Order Projection Service — status and tracking projection builders.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Resolve the fulfillment-facing product for an order item.
 *
 * Variation products retain their own SKU/image, while product-kind and kit
 * composition metadata may fall back to the parent product.
 */
function dtb_order_get_line_item_product( WC_Order_Item_Product $item ): ?WC_Product {
	$product = $item->get_product();
	return $product instanceof WC_Product ? $product : null;
}

/**
 * Resolve the canonical DTB product kind for a WooCommerce product.
 */
function dtb_order_get_product_kind( ?WC_Product $product ): string {
	if ( ! $product instanceof WC_Product ) {
		return 'product';
	}

	$kind = sanitize_key( (string) $product->get_meta( '_dtb_product_kind', true ) );
	if ( '' === $kind && $product->is_type( 'variation' ) ) {
		$parent = wc_get_product( $product->get_parent_id() );
		if ( $parent instanceof WC_Product ) {
			$kind = sanitize_key( (string) $parent->get_meta( '_dtb_product_kind', true ) );
		}
	}

	return '' !== $kind ? $kind : 'product';
}

/**
 * Extract toolset component rows from canonical catalog metadata.
 *
 * The catalog remains authoritative for component definitions. Order item
 * snapshots preserve the definition that existed when a new order was placed.
 *
 * @return array<int,array{name:string,sku:string,quantity:int}>
 */
function dtb_order_extract_toolset_components( ?WC_Product $product ): array {
	if ( ! $product instanceof WC_Product ) {
		return [];
	}

	$source = $product;
	if ( $product->is_type( 'variation' ) ) {
		$parent = wc_get_product( $product->get_parent_id() );
		if ( $parent instanceof WC_Product ) {
			$source = $parent;
		}
	}

	$components = [];
	for ( $index = 0; $index < 50; $index++ ) {
		$name = trim( wp_strip_all_tags( (string) $source->get_meta( '_includes_' . $index . '_name', true ) ) );
		$sku  = trim( wp_strip_all_tags( (string) $source->get_meta( '_includes_' . $index . '_sku', true ) ) );

		if ( '' === $name && '' === $sku ) {
			continue;
		}

		$quantity = 1;
		if ( preg_match( '/^\s*(\d+)\s*[x×]\s*/iu', $name, $matches ) ) {
			$quantity = max( 1, absint( $matches[1] ) );
			$name     = trim( preg_replace( '/^\s*\d+\s*[x×]\s*/iu', '', $name ) ?? $name );
		}

		$components[] = [
			'name'     => $name,
			'sku'      => $sku,
			'quantity' => $quantity,
		];
	}

	return $components;
}

/**
 * Snapshot fulfillment identity and kit composition onto a WooCommerce order item.
 *
 * Protected order-item meta is intentionally used so customer-facing order
 * templates are not polluted. WooCommerce remains the commerce system of
 * record; this is historical transaction context, not a parallel catalog.
 */
function dtb_order_snapshot_line_item_fulfillment_meta( WC_Order_Item_Product $item, ?WC_Product $product = null, bool $save = false ): void {
	$product = $product instanceof WC_Product ? $product : dtb_order_get_line_item_product( $item );
	if ( ! $product instanceof WC_Product ) {
		return;
	}

	if ( '' === (string) $item->get_meta( '_dtb_ordered_sku', true ) ) {
		$item->add_meta_data( '_dtb_ordered_sku', (string) $product->get_sku(), true );
	}

	$kind = (string) $item->get_meta( '_dtb_ordered_product_kind', true );
	if ( '' === $kind ) {
		$kind = dtb_order_get_product_kind( $product );
		$item->add_meta_data( '_dtb_ordered_product_kind', $kind, true );
	}

	if ( 'toolset' === $kind && '' === (string) $item->get_meta( '_dtb_toolset_components_json', true ) ) {
		$components = dtb_order_extract_toolset_components( $product );
		if ( ! empty( $components ) ) {
			$item->add_meta_data( '_dtb_toolset_components_json', wp_json_encode( $components ), true );
		}
	}

	if ( $save ) {
		$item->save();
	}
}

/**
 * Snapshot order-item fulfillment metadata during classic checkout.
 */
function dtb_order_snapshot_checkout_line_item( $item, $cart_item_key, $values, $order ): void {
	unset( $cart_item_key, $order );

	if ( ! $item instanceof WC_Order_Item_Product ) {
		return;
	}

	$product = isset( $values['data'] ) && $values['data'] instanceof WC_Product
		? $values['data']
		: null;

	dtb_order_snapshot_line_item_fulfillment_meta( $item, $product, false );
}
add_action( 'woocommerce_checkout_create_order_line_item', 'dtb_order_snapshot_checkout_line_item', 20, 4 );

/**
 * Snapshot fulfillment metadata for Store API / Blocks checkout orders.
 */
function dtb_order_snapshot_store_api_order( $order ): void {
	if ( ! $order instanceof WC_Order ) {
		return;
	}

	foreach ( $order->get_items( 'line_item' ) as $item ) {
		if ( $item instanceof WC_Order_Item_Product ) {
			dtb_order_snapshot_line_item_fulfillment_meta( $item, null, true );
		}
	}
}
add_action( 'woocommerce_store_api_checkout_order_processed', 'dtb_order_snapshot_store_api_order', 20, 1 );

function dtb_order_format_product_item( WC_Order_Item_Product $item ): array {
	$product      = dtb_order_get_line_item_product( $item );
	$image_id     = $product instanceof WC_Product ? (int) $product->get_image_id() : 0;
	if ( $image_id <= 0 && $item->get_variation_id() > 0 ) {
		$parent_product = wc_get_product( $item->get_product_id() );
		$image_id       = $parent_product instanceof WC_Product ? (int) $parent_product->get_image_id() : 0;
	}
	$image_url    = $image_id > 0 ? (string) wp_get_attachment_image_url( $image_id, 'woocommerce_thumbnail' ) : '';
	$image_srcset = $image_id > 0 ? (string) wp_get_attachment_image_srcset( $image_id, 'woocommerce_thumbnail' ) : '';

	if ( '' === $image_url && function_exists( 'wc_placeholder_img_src' ) ) {
		$image_url = (string) wc_placeholder_img_src( 'woocommerce_thumbnail' );
	}

	$quantity     = max( 1, (int) $item->get_quantity() );
	$subtotal     = (float) $item->get_subtotal();
	$total        = (float) $item->get_total();
	$ordered_sku  = trim( (string) $item->get_meta( '_dtb_ordered_sku', true ) );
	$product_kind = sanitize_key( (string) $item->get_meta( '_dtb_ordered_product_kind', true ) );
	if ( '' === $ordered_sku && $product instanceof WC_Product ) {
		$ordered_sku = (string) $product->get_sku();
	}
	if ( '' === $product_kind ) {
		$product_kind = dtb_order_get_product_kind( $product );
	}

	$components        = [];
	$components_source = '';
	$snapshot_json     = (string) $item->get_meta( '_dtb_toolset_components_json', true );
	if ( '' !== $snapshot_json ) {
		$decoded = json_decode( $snapshot_json, true );
		if ( is_array( $decoded ) ) {
			foreach ( $decoded as $component ) {
				if ( ! is_array( $component ) ) {
					continue;
				}
				$name = trim( wp_strip_all_tags( (string) ( $component['name'] ?? '' ) ) );
				$sku  = trim( wp_strip_all_tags( (string) ( $component['sku'] ?? '' ) ) );
				if ( '' === $name && '' === $sku ) {
					continue;
				}
				$components[] = [
					'name'           => $name,
					'sku'            => $sku,
					'quantity'       => max( 1, absint( $component['quantity'] ?? 1 ) ),
					'total_quantity' => max( 1, absint( $component['quantity'] ?? 1 ) ) * $quantity,
				];
			}
			$components_source = 'order_snapshot';
		}
	}

	if ( empty( $components ) && 'toolset' === $product_kind ) {
		foreach ( dtb_order_extract_toolset_components( $product ) as $component ) {
			$component['total_quantity'] = max( 1, absint( $component['quantity'] ?? 1 ) ) * $quantity;
			$components[]                = $component;
		}
		if ( ! empty( $components ) ) {
			$components_source = 'catalog_current';
		}
	}

	$variation_meta = [];
	foreach ( $item->get_formatted_meta_data( '', true ) as $meta ) {
		$raw_key = isset( $meta->key ) ? (string) $meta->key : '';
		if ( '' === $raw_key || str_starts_with( $raw_key, '_' ) ) {
			continue;
		}
		$variation_meta[] = [
			'label' => wp_strip_all_tags( (string) ( $meta->display_key ?? $raw_key ) ),
			'value' => wp_strip_all_tags( (string) ( $meta->display_value ?? $meta->value ?? '' ) ),
		];
	}

	$component_units = 0;
	foreach ( $components as $component ) {
		$component_units += absint( $component['total_quantity'] ?? 0 );
	}

	return [
		'id'                => (int) $item->get_id(),
		'name'              => wp_strip_all_tags( $item->get_name() ),
		'quantity'          => (int) $item->get_quantity(),
		'unit_price'        => $quantity > 0 ? $subtotal / $quantity : $subtotal,
		'subtotal'          => $subtotal,
		'total'             => $total,
		'discount'          => max( 0, $subtotal - $total ),
		'product_id'        => (int) $item->get_product_id(),
		'variation_id'      => (int) $item->get_variation_id(),
		'sku'               => $ordered_sku,
		'product_kind'      => $product_kind,
		'image'             => esc_url_raw( $image_url ),
		'image_srcset'      => $image_srcset,
		'image_alt'         => $product instanceof WC_Product
			? wp_strip_all_tags( $product->get_name() )
			: wp_strip_all_tags( $item->get_name() ),
		'variation_meta'    => $variation_meta,
		'components'        => $components,
		'components_source' => $components_source,
		'component_count'   => count( $components ),
		'component_units'   => $component_units,
	];
}

function dtb_order_build_status_projection( int $order_id ): array {
	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		return [
			'status'               => 'unknown',
			'label'                => __( 'Unknown', 'drywall-toolbox' ),
			'wc_status'            => 'unknown',
			'fulfillment_substate' => 'pending',
			'is_terminal'          => false,
		];
	}

	$wc_status  = $order->get_status();
	$map        = dtb_order_get_status_map();
	$entry      = $map[ $wc_status ] ?? null;
	$substate   = dtb_order_get_fulfillment_substate( $order_id );
	$label      = $entry['label'] ?? dtb_order_get_status_label( $wc_status );
	$is_terminal = $entry['is_terminal'] ?? false;

	$substates = dtb_order_fulfillment_substates();
	if ( 'processing' === $wc_status && isset( $substates[ $substate ] ) && 'pending' !== $substate ) {
		$label = $substates[ $substate ];
	}

	return [
		'status'               => in_array( $wc_status, [ 'processing' ], true ) && 'shipped' === $substate ? 'shipped' : $wc_status,
		'label'                => $label,
		'wc_status'            => $wc_status,
		'fulfillment_substate' => $substate,
		'is_terminal'          => $is_terminal,
	];
}

function dtb_order_build_tracking_projection( int $order_id ): ?array {
	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		return null;
	}

	$status_proj = dtb_order_build_status_projection( $order_id );
	$timeline    = dtb_order_get_customer_timeline( $order_id );
	$int_state   = dtb_order_get_integration_state( $order_id );
	$order_type  = function_exists( 'dtb_order_resolve_type' )
		? dtb_order_resolve_type( $order )
		: 'product';

	$veeqo = $int_state['veeqo'] ?? [];
	$tracking_number   = ( ! empty( $veeqo['tracking'] ) && is_string( $veeqo['tracking'] ) )
		? sanitize_text_field( $veeqo['tracking'] ) : null;
	$carrier           = ( ! empty( $veeqo['carrier'] ) && is_string( $veeqo['carrier'] ) )
		? sanitize_text_field( $veeqo['carrier'] ) : null;
	$estimated_delivery = get_post_meta( $order_id, '_dtb_estimated_delivery', true ) ?: null;

	$tracking_url = null;
	if ( $tracking_number && $carrier ) {
		$tracking_url = dtb_order_build_tracking_url( $carrier, $tracking_number );
	}

	$items = [];
	foreach ( $order->get_items() as $item ) {
		/** @var WC_Order_Item_Product $item */
		$formatted_item           = dtb_order_format_product_item( $item );
		$formatted_item['status'] = $status_proj['fulfillment_substate'];
		$items[]                  = $formatted_item;
	}

	return [
		'order_id'           => $order_id,
		'order_type'         => $order_type,
		'status'             => $status_proj['status'],
		'label'              => $status_proj['label'],
		'placed_at'          => $order->get_date_created() ? $order->get_date_created()->format( 'c' ) : null,
		'last_updated_at'    => $order->get_date_modified() ? $order->get_date_modified()->format( 'c' ) : null,
		'tracking_number'    => $tracking_number,
		'carrier'            => $carrier,
		'tracking_url'       => $tracking_url,
		'estimated_delivery' => $estimated_delivery ? sanitize_text_field( (string) $estimated_delivery ) : null,
		'items'              => $items,
		'timeline'           => $timeline,
		'number'             => $order->get_order_number(),
		'currency'           => $order->get_currency(),
		'subtotal'           => $order->get_subtotal(),
		'discount_total'     => $order->get_discount_total(),
		'shipping_total'     => $order->get_shipping_total(),
		'has_shipping'       => ! empty( $order->get_shipping_methods() ),
		'total_tax'          => $order->get_total_tax(),
		'total'              => $order->get_total(),
	];
}

function dtb_order_get_tracking_projection( int $order_id ): ?array {
	$cache_key = 'dtb_order_tracking_v3_' . $order_id;
	$cached    = get_transient( $cache_key );

	if ( is_array( $cached ) ) {
		return $cached;
	}

	$projection = dtb_order_build_tracking_projection( $order_id );

	if ( is_array( $projection ) ) {
		set_transient( $cache_key, $projection, 2 * MINUTE_IN_SECONDS );
	}

	return $projection;
}
