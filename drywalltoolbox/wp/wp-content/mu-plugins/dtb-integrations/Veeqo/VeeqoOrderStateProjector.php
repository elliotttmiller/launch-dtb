<?php
declare(strict_types=1);

/**
 * Projects a Veeqo order snapshot into WooCommerce, DTB tracking, and repair state.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_Veeqo_Order_State_Projector' ) ) {
	return;
}

final class DTB_Veeqo_Order_State_Projector {
	/**
	 * Apply one provider snapshot to the linked WooCommerce order.
	 *
	 * @param WC_Order $order   WooCommerce order.
	 * @param array    $payload Veeqo order payload.
	 * @param string   $source  Projection source.
	 * @param string   $event_key Stable provider event identity when available.
	 * @return array<string,mixed>
	 */
	public static function apply( WC_Order $order, array $payload, string $source, string $event_key = '' ): array {
		$snapshot = self::unwrap_order( $payload );
		$status   = self::normalize_status( $snapshot );
		$mapping  = self::status_mapping( $status );
		$tracking = self::extract_tracking( $snapshot );
		$order_id = (int) $order->get_id();
		$veeqo_id = absint( $snapshot['id'] ?? $snapshot['order_id'] ?? 0 );
		$rank     = (int) ( $mapping['rank'] ?? 0 );
		$current_rank = absint( $order->get_meta( '_dtb_veeqo_fulfillment_rank', true ) );
		$previous_tracking = trim( (string) ( $order->get_meta( '_dtb_veeqo_tracking_number', true ) ?: $order->get_meta( '_tracking_number', true ) ) );

		if ( '' === $status || $rank <= 0 ) {
			return [
				'status'          => 'ignored',
				'provider_status' => $status,
				'changed'         => false,
				'terminal'        => false,
				'message'         => 'Veeqo payload does not contain a mapped order status.',
			];
		}

		if ( $rank < $current_rank && ! in_array( $status, [ 'cancelled', 'refunded' ], true ) ) {
			self::append_event( $order_id, 'integration.veeqo.projection_stale', $source, $event_key, [
				'provider_status' => $status,
				'incoming_rank'   => $rank,
				'current_rank'    => $current_rank,
			] );
			return [
				'status'          => 'stale',
				'provider_status' => $status,
				'changed'         => false,
				'terminal'        => false,
				'message'         => 'Older Veeqo fulfillment state ignored.',
			];
		}

		$changed = false;
		if ( $veeqo_id > 0 ) {
			$changed = self::update_meta_if_changed( $order, '_dtb_veeqo_order_id', $veeqo_id ) || $changed;
			$changed = self::update_meta_if_changed( $order, '_veeqo_order_id', $veeqo_id ) || $changed;
		}
		$changed = self::update_meta_if_changed( $order, '_dtb_veeqo_fulfillment_rank', $rank ) || $changed;
		$changed = self::update_meta_if_changed( $order, '_dtb_veeqo_source_status', $status ) || $changed;
		$changed = self::update_meta_if_changed( $order, '_dtb_veeqo_last_projected_at', gmdate( 'c' ) ) || $changed;

		if ( '' !== $tracking['tracking_number'] ) {
			$changed = self::update_meta_if_changed( $order, '_tracking_number', $tracking['tracking_number'] ) || $changed;
			$changed = self::update_meta_if_changed( $order, '_dtb_veeqo_tracking_number', $tracking['tracking_number'] ) || $changed;
		}
		if ( '' !== $tracking['carrier'] ) {
			$changed = self::update_meta_if_changed( $order, '_tracking_carrier', $tracking['carrier'] ) || $changed;
			$changed = self::update_meta_if_changed( $order, '_dtb_veeqo_tracking_carrier', $tracking['carrier'] ) || $changed;
		}
		if ( '' !== $tracking['estimated_delivery'] ) {
			$changed = self::update_meta_if_changed( $order, '_dtb_estimated_delivery', $tracking['estimated_delivery'] ) || $changed;
		}

		$order->save_meta_data();

		$wc_status = (string) ( $mapping['wc_status'] ?? '' );
		if ( '' !== $wc_status && $wc_status !== (string) $order->get_status() ) {
			if ( ! ( function_exists( 'dtb_checkout_handoff_is_unpaid_order' ) && dtb_checkout_handoff_is_unpaid_order( $order ) && in_array( $wc_status, [ 'processing', 'completed' ], true ) ) ) {
				set_transient( 'dtb_veeqo_webhook_updating_order_' . $order_id, '1', 60 );
				try {
					$order->update_status( $wc_status, sprintf( '[Veeqo] %s projection applied from %s.', $status, $source ) );
					$changed = true;
				} finally {
					delete_transient( 'dtb_veeqo_webhook_updating_order_' . $order_id );
				}
			}
		}

		$substate = (string) ( $mapping['substate'] ?? '' );
		if ( '' !== $substate && function_exists( 'dtb_order_set_fulfillment_substate' ) ) {
			dtb_order_set_fulfillment_substate( $order_id, $substate, [
				'tracking_number' => $tracking['tracking_number'] ?: null,
				'carrier'         => $tracking['carrier'] ?: null,
			] );
		}

		if ( function_exists( 'dtb_order_update_integration_state' ) ) {
			dtb_order_update_integration_state( $order_id, 'veeqo', [
				'status'          => 'synced',
				'order_id'        => $veeqo_id ?: null,
				'source_status'   => $status,
				'tracking'        => $tracking['tracking_number'] ?: null,
				'carrier'         => $tracking['carrier'] ?: null,
				'last_success_at' => current_time( 'mysql', true ),
				'error'           => null,
			] );
		}

		$event_payload = [
			'provider_status'   => $status,
			'wc_status'         => $wc_status ?: (string) $order->get_status(),
			'fulfillment_state' => $substate,
			'veeqo_order_id'    => $veeqo_id ?: null,
			'tracking_number'   => $tracking['tracking_number'] ?: null,
			'carrier'           => $tracking['carrier'] ?: null,
		];
		self::append_event( $order_id, 'integration.veeqo.projection_applied', $source, $event_key, $event_payload );

		if ( '' !== $tracking['tracking_number'] && $tracking['tracking_number'] !== $previous_tracking ) {
			self::append_event( $order_id, 'order.shipment_tracking_updated', $source, $event_key ? $event_key . ':tracking' : '', $event_payload, 'customer' );
			if ( function_exists( 'dtb_order_enqueue_job' ) ) {
				dtb_order_enqueue_job( 'dtb_order_send_notification', $order_id, [ 'template' => 'order-shipped' ] );
			}
		}

		self::sync_linked_repair( $order_id, $status, $tracking, $veeqo_id, $source, $event_key );
		self::invalidate_tracking_projection( $order_id );

		return [
			'status'          => 'synced',
			'provider_status' => $status,
			'wc_status'       => $wc_status ?: (string) $order->get_status(),
			'changed'         => $changed,
			'terminal'        => ! empty( $mapping['terminal'] ),
			'tracking_number' => $tracking['tracking_number'] ?: null,
			'carrier'         => $tracking['carrier'] ?: null,
			'veeqo_order_id'  => $veeqo_id ?: null,
		];
	}

	private static function unwrap_order( array $payload ): array {
		return isset( $payload['order'] ) && is_array( $payload['order'] ) ? $payload['order'] : $payload;
	}

	private static function normalize_status( array $snapshot ): string {
		$candidates = [ $snapshot['status'] ?? null, $snapshot['status_name'] ?? null, $snapshot['fulfillment_status'] ?? null, $snapshot['state'] ?? null ];
		foreach ( $candidates as $candidate ) {
			$status = sanitize_key( strtolower( str_replace( [ ' ', '-' ], '_', (string) $candidate ) ) );
			if ( '' !== $status ) {
				$aliases = [
					'awaitingfulfillment' => 'awaiting_fulfillment',
					'awaiting_stock'      => 'awaiting_fulfillment',
					'picking'             => 'picked',
					'pick'                => 'picked',
					'packing'             => 'packed',
					'pack'                => 'packed',
					'ready_to_dispatch'   => 'ready_to_ship',
					'dispatched'          => 'shipped',
					'fulfilled'           => 'shipped',
					'complete'            => 'delivered',
					'completed'           => 'delivered',
					'canceled'            => 'cancelled',
				];
				return $aliases[ $status ] ?? $status;
			}
		}
		return '';
	}

	/** @return array{rank:int,wc_status:string,substate:string,terminal:bool} */
	private static function status_mapping( string $status ): array {
		$map = [
			'awaiting_fulfillment' => [ 'rank' => 10, 'wc_status' => 'processing', 'substate' => 'inventory_reserved', 'terminal' => false ],
			'allocated'            => [ 'rank' => 20, 'wc_status' => 'processing', 'substate' => 'inventory_reserved', 'terminal' => false ],
			'picked'               => [ 'rank' => 30, 'wc_status' => 'processing', 'substate' => 'picked', 'terminal' => false ],
			'printed'              => [ 'rank' => 35, 'wc_status' => 'processing', 'substate' => 'packed', 'terminal' => false ],
			'packed'               => [ 'rank' => 40, 'wc_status' => 'processing', 'substate' => 'packed', 'terminal' => false ],
			'ready_to_ship'        => [ 'rank' => 45, 'wc_status' => 'processing', 'substate' => 'packed', 'terminal' => false ],
			'shipped'              => [ 'rank' => 50, 'wc_status' => 'processing', 'substate' => 'shipped', 'terminal' => false ],
			'delivered'            => [ 'rank' => 60, 'wc_status' => 'completed', 'substate' => 'delivered', 'terminal' => true ],
			'cancelled'            => [ 'rank' => 90, 'wc_status' => 'cancelled', 'substate' => 'exception', 'terminal' => true ],
			'refunded'             => [ 'rank' => 100, 'wc_status' => 'refunded', 'substate' => 'exception', 'terminal' => true ],
		];
		return $map[ $status ] ?? [ 'rank' => 0, 'wc_status' => '', 'substate' => '', 'terminal' => false ];
	}

	/** @return array{tracking_number:string,carrier:string,estimated_delivery:string} */
	private static function extract_tracking( array $snapshot ): array {
		$shipments = isset( $snapshot['shipments'] ) && is_array( $snapshot['shipments'] ) ? $snapshot['shipments'] : [];
		$shipment  = [];
		for ( $index = count( $shipments ) - 1; $index >= 0; $index-- ) {
			if ( is_array( $shipments[ $index ] ) ) {
				$shipment = $shipments[ $index ];
				if ( ! empty( $shipment['tracking_number'] ) || ! empty( $shipment['tracking_code'] ) ) {
					break;
				}
			}
		}
		return [
			'tracking_number'    => sanitize_text_field( (string) ( $snapshot['tracking_number'] ?? $snapshot['tracking_code'] ?? $shipment['tracking_number'] ?? $shipment['tracking_code'] ?? '' ) ),
			'carrier'            => sanitize_text_field( (string) ( $snapshot['carrier'] ?? $snapshot['tracking_carrier'] ?? $shipment['carrier'] ?? $shipment['tracking_carrier'] ?? $shipment['shipping_carrier']['name'] ?? '' ) ),
			'estimated_delivery' => sanitize_text_field( (string) ( $snapshot['estimated_delivery'] ?? $shipment['estimated_delivery'] ?? $shipment['estimated_delivery_at'] ?? '' ) ),
		];
	}

	private static function update_meta_if_changed( WC_Order $order, string $key, mixed $value ): bool {
		if ( (string) $order->get_meta( $key, true ) === (string) $value ) {
			return false;
		}
		$order->update_meta_data( $key, $value );
		return true;
	}

	private static function append_event( int $order_id, string $type, string $source, string $event_key, array $payload, string $visibility = 'operator' ): void {
		if ( ! function_exists( 'dtb_order_append_event' ) ) {
			return;
		}
		$args = [ 'source' => sanitize_key( $source ), 'actor_type' => 'veeqo', 'visibility' => $visibility, 'payload' => $payload ];
		if ( '' !== $event_key ) {
			$args['idempotency_key'] = 'veeqo-projection:' . hash( 'sha256', $order_id . '|' . $type . '|' . $event_key );
		}
		dtb_order_append_event( $order_id, $type, $args );
	}

	private static function invalidate_tracking_projection( int $order_id ): void {
		delete_transient( 'dtb_order_tracking_v2_' . $order_id );
		delete_post_meta( $order_id, '_dtb_tracking_projection' );
		delete_post_meta( $order_id, '_dtb_tracking_projection_built_at' );
		if ( function_exists( 'dtb_order_enqueue_job' ) ) {
			dtb_order_enqueue_job( 'dtb_order_refresh_tracking_projection', $order_id, [ 'trigger' => 'veeqo_projection' ] );
		}
	}

	private static function sync_linked_repair( int $order_id, string $status, array $tracking, int $veeqo_id, string $source, string $event_key ): void {
		$repair_id = absint( get_post_meta( $order_id, '_dtb_repair_id', true ) );
		if ( $repair_id <= 0 ) {
			$repair_ids = get_posts( [
				'post_type'      => 'dtb_repair_request',
				'post_status'    => 'any',
				'fields'         => 'ids',
				'posts_per_page' => 1,
				'no_found_rows'  => true,
				'meta_key'       => '_repair_wc_order_id',
				'meta_value'     => $order_id,
			] );
			$repair_id = absint( $repair_ids[0] ?? 0 );
		}
		if ( $repair_id <= 0 ) {
			return;
		}

		update_post_meta( $repair_id, '_repair_veeqo_sync_status', $status );
		if ( $veeqo_id > 0 ) {
			update_post_meta( $repair_id, '_repair_veeqo_order_id', $veeqo_id );
		}
		if ( '' !== $tracking['tracking_number'] ) {
			update_post_meta( $repair_id, '_repair_veeqo_tracking', $tracking['tracking_number'] );
		}
		if ( function_exists( 'dtb_update_repair_integration_state' ) ) {
			dtb_update_repair_integration_state( $repair_id, 'veeqo', [
				'state'           => 'synced',
				'order_id'        => $veeqo_id ?: null,
				'source_status'   => $status,
				'tracking_number' => $tracking['tracking_number'] ?: null,
				'carrier'         => $tracking['carrier'] ?: null,
				'last_success_at' => gmdate( 'c' ),
				'last_error_code' => null,
			] );
		}
		if ( function_exists( 'dtb_repair_append_event' ) ) {
			$args = [
				'visibility' => 'operator',
				'payload'    => [
					'source'          => $source,
					'provider_status' => $status,
					'veeqo_order_id'  => $veeqo_id ?: null,
					'tracking_number' => $tracking['tracking_number'] ?: null,
					'carrier'         => $tracking['carrier'] ?: null,
				],
			];
			if ( '' !== $event_key ) {
				$args['idempotency_key'] = 'repair-veeqo:' . hash( 'sha256', $repair_id . '|' . $event_key );
			}
			dtb_repair_append_event( $repair_id, 'integration.veeqo.fulfillment_updated', $args );
		}
	}
}
