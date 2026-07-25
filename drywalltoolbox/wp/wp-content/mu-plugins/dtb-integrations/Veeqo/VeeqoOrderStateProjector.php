<?php
declare(strict_types=1);

/**
 * Projects Veeqo fulfillment snapshots into WooCommerce, DTB tracking, and repairs.
 *
 * Pull reconciliation and webhook ingress both converge here so provider state is
 * interpreted once and produces the same durable projection regardless of source.
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
	 * @param WC_Order $order     WooCommerce order.
	 * @param array    $payload   Veeqo order payload.
	 * @param string   $source    Projection source.
	 * @param string   $event_key Stable provider event identity when available.
	 * @return array<string,mixed>
	 */
	public static function apply( WC_Order $order, array $payload, string $source, string $event_key = '' ): array {
		$snapshot = self::unwrap_order( $payload );
		$status   = self::normalize_status( $snapshot );
		$mapping  = self::status_mapping( $status );
		$incoming = self::extract_tracking( $snapshot );
		$order_id = (int) $order->get_id();
		$veeqo_id = absint( $snapshot['id'] ?? $snapshot['order_id'] ?? 0 );
		$rank     = (int) ( $mapping['rank'] ?? 0 );
		$current_rank = absint( $order->get_meta( '_dtb_veeqo_fulfillment_rank', true ) );

		if ( '' === $status || $rank <= 0 ) {
			return self::result( 'ignored', $status, $order, $mapping, false, $incoming, $veeqo_id, 'Veeqo payload does not contain a mapped order status.' );
		}

		if ( $rank < $current_rank && ! in_array( $status, [ 'cancelled', 'refunded' ], true ) ) {
			self::append_event( $order_id, 'integration.veeqo.projection_stale', $source, $event_key, [
				'provider_status' => $status,
				'incoming_rank'   => $rank,
				'current_rank'    => $current_rank,
			] );
			return self::result( 'stale', $status, $order, $mapping, false, $incoming, $veeqo_id, 'Older Veeqo fulfillment state ignored.' );
		}

		$tracking = [
			'tracking_number'    => $incoming['tracking_number'] ?: trim( (string) ( $order->get_meta( '_dtb_veeqo_tracking_number', true ) ?: $order->get_meta( '_tracking_number', true ) ) ),
			'carrier'            => $incoming['carrier'] ?: trim( (string) ( $order->get_meta( '_dtb_veeqo_tracking_carrier', true ) ?: $order->get_meta( '_tracking_carrier', true ) ) ),
			'estimated_delivery' => $incoming['estimated_delivery'] ?: trim( (string) $order->get_meta( '_dtb_estimated_delivery', true ) ),
		];
		$previous_tracking = trim( (string) ( $order->get_meta( '_dtb_veeqo_tracking_number', true ) ?: $order->get_meta( '_tracking_number', true ) ) );
		$wc_status         = (string) ( $mapping['wc_status'] ?? '' );
		$substate          = (string) ( $mapping['substate'] ?? '' );
		$current_substate  = function_exists( 'dtb_order_get_fulfillment_substate' )
			? dtb_order_get_fulfillment_substate( $order_id )
			: sanitize_key( (string) $order->get_meta( '_dtb_fulfillment_substate', true ) );
		$state_hash = self::state_hash( $status, $veeqo_id, $tracking, $wc_status, $substate );
		$stored_hash = (string) $order->get_meta( '_dtb_veeqo_projection_hash', true );
		$already_converged = hash_equals( $stored_hash ?: str_repeat( '0', 64 ), $state_hash )
			&& ( '' === $wc_status || $wc_status === (string) $order->get_status() )
			&& ( '' === $substate || $substate === $current_substate );

		if ( $already_converged ) {
			self::sync_linked_repair( $order, $status, $tracking, $veeqo_id, $source, $event_key );
			return self::result( 'unchanged', $status, $order, $mapping, false, $tracking, $veeqo_id, 'Veeqo state is already projected.' );
		}

		$changed = false;
		if ( $veeqo_id > 0 ) {
			$changed = self::update_meta_if_changed( $order, '_dtb_veeqo_order_id', $veeqo_id ) || $changed;
			$changed = self::update_meta_if_changed( $order, '_veeqo_order_id', $veeqo_id ) || $changed;
		}
		$changed = self::update_meta_if_changed( $order, '_dtb_veeqo_fulfillment_rank', $rank ) || $changed;
		$changed = self::update_meta_if_changed( $order, '_dtb_veeqo_source_status', $status ) || $changed;
		$changed = self::update_meta_if_changed( $order, '_dtb_veeqo_projection_hash', $state_hash ) || $changed;

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
		if ( $changed ) {
			$order->update_meta_data( '_dtb_veeqo_last_projected_at', gmdate( 'c' ) );
			$order->save_meta_data();
		}

		if ( '' !== $wc_status && $wc_status !== (string) $order->get_status() ) {
			$unpaid = function_exists( 'dtb_checkout_handoff_is_unpaid_order' ) && dtb_checkout_handoff_is_unpaid_order( $order );
			if ( ! ( $unpaid && in_array( $wc_status, [ 'processing', 'completed' ], true ) ) ) {
				set_transient( 'dtb_veeqo_webhook_updating_order_' . $order_id, '1', 60 );
				try {
					$order->update_status( $wc_status, sprintf( '[Veeqo] %s projection applied from %s.', $status, $source ) );
					$changed = true;
				} finally {
					delete_transient( 'dtb_veeqo_webhook_updating_order_' . $order_id );
				}
			}
		}

		if ( '' !== $substate && $substate !== $current_substate && function_exists( 'dtb_order_set_fulfillment_substate' ) ) {
			dtb_order_set_fulfillment_substate( $order_id, $substate, [
				'tracking_number' => $tracking['tracking_number'] ?: null,
				'carrier'         => $tracking['carrier'] ?: null,
			] );
			$changed = true;
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
		self::append_event( $order_id, 'integration.veeqo.projection_applied', $source, $event_key ?: $state_hash, $event_payload );

		if ( '' !== $tracking['tracking_number'] && $tracking['tracking_number'] !== $previous_tracking ) {
			self::append_event( $order_id, 'order.shipment_tracking_updated', $source, ( $event_key ?: $state_hash ) . ':tracking', $event_payload, 'customer' );
			if ( in_array( $status, [ 'shipped', 'delivered' ], true ) && function_exists( 'dtb_order_enqueue_job' ) ) {
				dtb_order_enqueue_job( 'dtb_order_send_notification', $order_id, [ 'template' => 'order-shipped' ] );
			}
		}

		self::sync_linked_repair( $order, $status, $tracking, $veeqo_id, $source, $event_key ?: $state_hash );
		if ( $changed ) {
			self::invalidate_tracking_projection( $order_id );
		}

		return self::result( 'synced', $status, $order, $mapping, $changed, $tracking, $veeqo_id );
	}

	private static function unwrap_order( array $payload ): array {
		return isset( $payload['order'] ) && is_array( $payload['order'] ) ? $payload['order'] : $payload;
	}

	private static function normalize_status( array $snapshot ): string {
		$candidates = [ $snapshot['status'] ?? null, $snapshot['status_name'] ?? null, $snapshot['fulfillment_status'] ?? null, $snapshot['state'] ?? null ];
		foreach ( $candidates as $candidate ) {
			if ( ! is_scalar( $candidate ) ) {
				continue;
			}
			$status = sanitize_key( strtolower( str_replace( [ ' ', '-' ], '_', (string) $candidate ) ) );
			if ( '' === $status ) {
				continue;
			}
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
			if ( ! is_array( $shipments[ $index ] ) ) {
				continue;
			}
			$shipment = $shipments[ $index ];
			if ( ! empty( $shipment['tracking_number'] ) || ! empty( $shipment['tracking_code'] ) ) {
				break;
			}
		}
		$shipping_carrier = isset( $shipment['shipping_carrier'] ) && is_array( $shipment['shipping_carrier'] ) ? $shipment['shipping_carrier'] : [];
		return [
			'tracking_number'    => sanitize_text_field( (string) ( $snapshot['tracking_number'] ?? $snapshot['tracking_code'] ?? $shipment['tracking_number'] ?? $shipment['tracking_code'] ?? '' ) ),
			'carrier'            => sanitize_text_field( (string) ( $snapshot['carrier'] ?? $snapshot['tracking_carrier'] ?? $shipment['carrier'] ?? $shipment['tracking_carrier'] ?? $shipping_carrier['name'] ?? '' ) ),
			'estimated_delivery' => sanitize_text_field( (string) ( $snapshot['estimated_delivery'] ?? $shipment['estimated_delivery'] ?? $shipment['estimated_delivery_at'] ?? '' ) ),
		];
	}

	private static function state_hash( string $status, int $veeqo_id, array $tracking, string $wc_status, string $substate ): string {
		return hash( 'sha256', wp_json_encode( [ $status, $veeqo_id, $tracking, $wc_status, $substate ] ) ?: '' );
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

	private static function sync_linked_repair( WC_Order $order, string $status, array $tracking, int $veeqo_id, string $source, string $event_key ): void {
		$order_id  = (int) $order->get_id();
		$repair_id = absint( $order->get_meta( '_dtb_repair_id', true ) );
		$order_type = sanitize_key( (string) $order->get_meta( '_dtb_order_type', true ) );
		if ( $repair_id <= 0 && 'repair' !== $order_type ) {
			return;
		}
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
			if ( $repair_id > 0 ) {
				$order->update_meta_data( '_dtb_repair_id', $repair_id );
				$order->save_meta_data();
			}
		}
		if ( $repair_id <= 0 ) {
			return;
		}

		$repair_hash = hash( 'sha256', wp_json_encode( [ $status, $veeqo_id, $tracking ] ) ?: '' );
		if ( hash_equals( (string) get_post_meta( $repair_id, '_repair_veeqo_projection_hash', true ) ?: str_repeat( '0', 64 ), $repair_hash ) ) {
			return;
		}
		update_post_meta( $repair_id, '_repair_veeqo_projection_hash', $repair_hash );
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
			dtb_repair_append_event( $repair_id, 'integration.veeqo.fulfillment_updated', [
				'visibility' => 'operator',
				'source'     => $source,
				'payload'    => [
					'provider_status' => $status,
					'veeqo_order_id'  => $veeqo_id ?: null,
					'tracking_number' => $tracking['tracking_number'] ?: null,
					'carrier'         => $tracking['carrier'] ?: null,
					'event_key'       => $event_key,
				],
			] );
		}
	}

	/** @return array<string,mixed> */
	private static function result( string $result_status, string $provider_status, WC_Order $order, array $mapping, bool $changed, array $tracking, int $veeqo_id, string $message = '' ): array {
		return [
			'status'          => $result_status,
			'provider_status' => $provider_status,
			'wc_status'       => (string) ( $mapping['wc_status'] ?? $order->get_status() ),
			'changed'         => $changed,
			'terminal'        => ! empty( $mapping['terminal'] ),
			'tracking_number' => $tracking['tracking_number'] ?: null,
			'carrier'         => $tracking['carrier'] ?: null,
			'veeqo_order_id'  => $veeqo_id ?: null,
			'message'         => $message,
		];
	}
}
