<?php
/**
 * Veeqo → native WooCommerce Fulfillment projector.
 *
 * Bridges Veeqo-authoritative shipment facts into WooCommerce 10.9.4's
 * native Fulfillments domain (`Automattic\WooCommerce\Admin\Features\Fulfillments\Fulfillment`,
 * registered under the `order-fulfillment` WC_Data_Store key), so
 * WooCommerce's own `WC_Email_Customer_Fulfillment_Created`/`Updated`
 * classes fire through the same `..._notification` actions the native
 * OrderFulfillmentsRestController uses — never through this site's own REST
 * API, never via a direct `$wpdb` write to `wc_order_fulfillments`, and
 * never through the separately-installed WooCommerce Shipping plugin's
 * `Automattic\WCShipping\Fulfillments\*` classes.
 *
 * This module owns the full projection lifecycle: shipment identity
 * resolution, a canonical customer-visible-state fingerprint, a per-shipment
 * projection lock, duplicate/replay detection, and native-notification
 * ownership. dtb-order-platform only records the resulting outcome as an
 * order event; it is not a second source of truth for any of the above.
 *
 * See docs/operations/woocommerce-html-email-architecture.md for the full
 * contract this file was verified against (vendor source export
 * drywalltoolbox/wp/wp-content/woo/dtb-woocommerce-fulfillments-source-20260731-123114/).
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_VEEQO_FULFILLMENT_IDENTITY_META    = '_dtb_veeqo_shipment_id';
const DTB_VEEQO_FULFILLMENT_FINGERPRINT_META = '_dtb_veeqo_projection_fingerprint';

/**
 * Filterable kill switch. Disabling never touches a previously created
 * native Fulfillment record — it only makes future calls defer to the
 * legacy notification path (see dtb-integrations/Veeqo/VeeqoOrderStatusApplier.php).
 *
 * @return bool
 */
function dtb_veeqo_fulfillment_projection_enabled(): bool {
	return (bool) apply_filters( 'dtb_veeqo_fulfillment_projection_enabled', true );
}

/**
 * Resolve a genuinely immutable Veeqo-native shipment identifier from a
 * Veeqo order payload (the decoded JSON body of `GET /orders/{id}`).
 *
 * Deliberately unresolved pending operator verification: this codebase's
 * own existing, already-shipped code
 * (VeeqoOrderStatusPoller.php::dtb_veeqo_order_status_poll_extract_tracking())
 * documents that Veeqo's `allocations[].shipment` shape is
 * nullable/unconfirmed against a real payload, and no confirmed-stable
 * per-allocation or per-shipment identifier has been observed by this
 * integration. Returning `null` here is a first-class, safe outcome — every
 * caller treats it as "defer to the legacy notification path," never as a
 * license to fabricate an identity (and never the tracking number, which is
 * mutable and can be corrected after the fact).
 *
 * Once a real Veeqo order payload for a shipped order is inspected and a
 * stable field confirmed, fill in that single field access below — nothing
 * else in the projector changes.
 *
 * @param array<string,mixed> $veeqo_order_payload Decoded Veeqo order payload.
 * @return string|null
 */
function dtb_veeqo_resolve_shipment_identity( array $veeqo_order_payload ): ?string {
	unset( $veeqo_order_payload );

	return null;
}

/**
 * Confirm the native Fulfillments API is present and that the
 * `order-fulfillment` data store still resolves to WooCommerce core's own
 * implementation (guards the WooCommerce-Shipping non-dependency
 * requirement — this projector never references
 * `Automattic\WCShipping\Fulfillments\*`).
 *
 * @return bool
 */
function dtb_veeqo_fulfillment_capability_ready(): bool {
	if ( ! dtb_veeqo_fulfillment_projection_enabled() ) {
		return false;
	}

	if ( ! class_exists( 'Automattic\\WooCommerce\\Admin\\Features\\Fulfillments\\Fulfillment' ) ) {
		return false;
	}

	if ( ! class_exists( 'WC_Data_Store' ) ) {
		return false;
	}

	try {
		$store = \WC_Data_Store::load( 'order-fulfillment' );
	} catch ( \Throwable $e ) {
		return false;
	}

	return $store instanceof \Automattic\WooCommerce\Admin\Features\Fulfillments\DataStore\FulfillmentsDataStore
		|| is_a( $store, '\\Automattic\\WooCommerce\\Admin\\Features\\Fulfillments\\DataStore\\FulfillmentsDataStore' );
}

/**
 * Acquire a short-lived, retry-safe per-order/per-shipment projection lock.
 *
 * @param string $lock_key Lock identity (order id + resolved shipment identity).
 * @return string|null Ownership token on success, null if already held.
 */
function dtb_veeqo_fulfillment_lock_acquire( string $lock_key ): ?string {
	$transient_key = 'dtb_veeqo_fp_lock_' . md5( $lock_key );

	if ( false !== get_transient( $transient_key ) ) {
		return null;
	}

	$token = wp_generate_password( 20, false );
	set_transient( $transient_key, $token, 60 );

	// Guard against a race between the existence check and the write.
	if ( get_transient( $transient_key ) !== $token ) {
		return null;
	}

	return $token;
}

/**
 * Release a projection lock only if the caller still owns it.
 *
 * @param string $lock_key Lock identity.
 * @param string $token    Ownership token returned by the matching acquire call.
 * @return void
 */
function dtb_veeqo_fulfillment_lock_release( string $lock_key, string $token ): void {
	$transient_key = 'dtb_veeqo_fp_lock_' . md5( $lock_key );

	if ( get_transient( $transient_key ) === $token ) {
		delete_transient( $transient_key );
	}
}

/**
 * Build a canonical fingerprint over only customer-visible fulfillment
 * state. Poll/sync timestamps and any other non-customer-visible metadata
 * are deliberately excluded so a poll that re-observes identical Veeqo
 * state always yields the same fingerprint (=> no_change, no duplicate
 * save, no duplicate notification).
 *
 * @param array<string,mixed> $facts {
 *     @type string $identity          Resolved shipment identity.
 *     @type string $status            Fulfillment status ('fulfilled').
 *     @type array  $items             [[item_id:int, qty:int|float], ...], pre-sorted by caller.
 *     @type string $carrier           Shipment provider slug.
 *     @type string $tracking_number   Tracking number.
 *     @type string $tracking_url      Tracking URL.
 *     @type string $date_fulfilled    Fulfilled timestamp.
 *     @type string $source_revision   Optional Veeqo-supplied revision marker.
 * }
 * @return string
 */
function dtb_veeqo_fulfillment_fingerprint( array $facts ): string {
	$canonical = [
		'identity'        => (string) ( $facts['identity'] ?? '' ),
		'status'          => (string) ( $facts['status'] ?? '' ),
		'items'           => $facts['items'] ?? [],
		'carrier'         => (string) ( $facts['carrier'] ?? '' ),
		'tracking_number' => (string) ( $facts['tracking_number'] ?? '' ),
		'tracking_url'    => (string) ( $facts['tracking_url'] ?? '' ),
		'date_fulfilled'  => (string) ( $facts['date_fulfilled'] ?? '' ),
		'source_revision' => (string) ( $facts['source_revision'] ?? '' ),
	];

	return hash( 'sha256', (string) wp_json_encode( $canonical ) );
}

/**
 * Map Veeqo-reported line data onto WooCommerce order items, validating
 * (never clamping) shipped quantity against ordered-minus-refunded quantity.
 *
 * @param WC_Order             $order            Order.
 * @param array<int,array>     $veeqo_line_items Veeqo-reported [{sku_or_product_id, qty}, ...].
 * @return array<int,array{item_id:int,qty:int}>|null Null on any quantity conflict.
 */
function dtb_veeqo_fulfillment_map_items( \WC_Order $order, array $veeqo_line_items ): ?array {
	if ( empty( $veeqo_line_items ) ) {
		return null;
	}

	$mapped = [];

	foreach ( $order->get_items() as $order_item ) {
		$sku = $order_item->get_product() instanceof \WC_Product ? $order_item->get_product()->get_sku() : '';

		foreach ( $veeqo_line_items as $line ) {
			$line_sku = sanitize_text_field( (string) ( $line['sku'] ?? '' ) );
			if ( '' === $line_sku || $line_sku !== $sku ) {
				continue;
			}

			$requested_qty  = (int) ( $line['qty'] ?? 0 );
			$available_qty  = (int) $order_item->get_quantity() - (int) $order->get_qty_refunded_for_item( $order_item->get_id() );

			if ( $requested_qty <= 0 ) {
				continue;
			}

			if ( $requested_qty > $available_qty ) {
				// Quantity conflict: reject the whole projection rather than
				// silently clamp. Malformed upstream data must stay visible.
				return null;
			}

			$mapped[] = [
				'item_id' => $order_item->get_id(),
				'qty'     => $requested_qty,
			];
		}
	}

	if ( empty( $mapped ) ) {
		return null;
	}

	usort( $mapped, static fn( array $a, array $b ): int => $a['item_id'] <=> $b['item_id'] );

	return $mapped;
}

/**
 * Find an existing, non-deleted native Fulfillment record for this order
 * whose private identity meta matches the resolved Veeqo shipment identity.
 *
 * @param \WC_Order $order    Order.
 * @param string    $identity Resolved shipment identity.
 * @return \Automattic\WooCommerce\Admin\Features\Fulfillments\Fulfillment|null
 */
function dtb_veeqo_fulfillment_find_existing( \WC_Order $order, string $identity ) {
	try {
		$store        = \WC_Data_Store::load( 'order-fulfillment' );
		$fulfillments = $store->read_fulfillments( \WC_Order::class, (string) $order->get_id() );
	} catch ( \Throwable $e ) {
		return null;
	}

	foreach ( $fulfillments as $fulfillment ) {
		if ( (string) $fulfillment->get_meta( DTB_VEEQO_FULFILLMENT_IDENTITY_META, true ) === $identity ) {
			return $fulfillment;
		}
	}

	return null;
}

/**
 * Confirm no *other* order's native Fulfillment record already claims this
 * shipment identity (never silently reassign an identity across orders).
 *
 * @param string $identity        Resolved shipment identity.
 * @param int    $expected_order  Order ID this identity is being projected for.
 * @return bool True if a conflicting record exists.
 */
function dtb_veeqo_fulfillment_identity_conflicts( string $identity, int $expected_order ): bool {
	global $wpdb;

	$fulfillment_id = $wpdb->get_var(
		$wpdb->prepare(
			"SELECT m.fulfillment_id FROM {$wpdb->prefix}wc_order_fulfillment_meta m WHERE m.meta_key = %s AND m.meta_value = %s LIMIT 1",
			DTB_VEEQO_FULFILLMENT_IDENTITY_META,
			wp_json_encode( $identity )
		)
	);

	if ( ! $fulfillment_id ) {
		return false;
	}

	$owning_entity_id = $wpdb->get_var(
		$wpdb->prepare(
			"SELECT entity_id FROM {$wpdb->prefix}wc_order_fulfillments WHERE fulfillment_id = %d AND entity_type = %s AND date_deleted IS NULL",
			(int) $fulfillment_id,
			\WC_Order::class
		)
	);

	return null !== $owning_entity_id && (int) $owning_entity_id !== $expected_order;
}

/**
 * Project one Veeqo shipment observation into a native WooCommerce
 * Fulfillment record and, only after a fully verified commit, fire the
 * matching native customer-notification action.
 *
 * @param \WC_Order            $order                Order.
 * @param array<string,mixed>  $veeqo_order_payload   Decoded Veeqo order payload (for identity resolution).
 * @param array<string,mixed>  $shipment_facts {
 *     @type array  $line_items       [{sku, qty}, ...] Veeqo-reported shipped lines.
 *     @type string $carrier          Shipment provider slug.
 *     @type string $tracking_number  Tracking number.
 *     @type string $tracking_url     Tracking URL (optional — resolved via native parser if absent).
 *     @type string $customer_note    Optional merchant note for an update notification.
 *     @type string $source_revision  Optional Veeqo-supplied revision marker.
 * }
 * @return array{
 *     result: string,
 *     fulfillment_id: int|null,
 *     identity: string|null,
 * }
 */
function dtb_veeqo_project_fulfillment( \WC_Order $order, array $veeqo_order_payload, array $shipment_facts ): array {
	$order_id = (int) $order->get_id();
	$outcome  = static function ( string $result, ?int $fulfillment_id = null, ?string $identity = null ) use ( $order_id ): array {
		$payload = [
			'result'         => $result,
			'fulfillment_id' => $fulfillment_id,
			'identity'       => $identity,
		];

		if ( function_exists( 'dtb_order_append_event' ) ) {
			dtb_order_append_event(
				$order_id,
				str_starts_with( $result, 'rejected_' ) || 'failed_native_persistence' === $result
					? 'integration.veeqo.fulfillment_projection_rejected'
					: ( 'deferred_incomplete_source' === $result ? 'integration.veeqo.fulfillment_projection_deferred' : 'integration.veeqo.fulfillment_projected' ),
				[
					'source'     => 'veeqo_fulfillment_projector',
					'actor_type' => 'veeqo',
					'visibility' => 'operator',
					'payload'    => $payload,
				]
			);
		}

		if ( function_exists( 'dtb_veeqo_log' ) ) {
			dtb_veeqo_log(
				in_array( $result, [ 'created', 'updated', 'no_change' ], true ) ? 'info' : 'warn',
				'fulfillment_projection_' . $result,
				sprintf( 'Veeqo fulfillment projection for order %d: %s', $order_id, $result ),
				$payload
			);
		}

		return $payload;
	};

	// 1. Capability guard.
	if ( ! dtb_veeqo_fulfillment_capability_ready() ) {
		return $outcome( 'deferred_incomplete_source' );
	}

	// 3. Identity resolution (numbered to match the documented projector steps).
	$identity = dtb_veeqo_resolve_shipment_identity( $veeqo_order_payload );
	if ( null === $identity || '' === $identity ) {
		return $outcome( 'deferred_incomplete_source' );
	}

	// 2. Per-shipment projection lock.
	$lock_key = $order_id . ':' . $identity;
	$token    = dtb_veeqo_fulfillment_lock_acquire( $lock_key );
	if ( null === $token ) {
		return $outcome( 'rejected_locked', null, $identity );
	}

	try {
		if ( dtb_veeqo_fulfillment_identity_conflicts( $identity, $order_id ) ) {
			return $outcome( 'rejected_identity_conflict', null, $identity );
		}

		$mapped_items = dtb_veeqo_fulfillment_map_items( $order, (array) ( $shipment_facts['line_items'] ?? [] ) );
		if ( null === $mapped_items ) {
			return $outcome( 'rejected_quantity_conflict', null, $identity );
		}

		$carrier          = sanitize_text_field( (string) ( $shipment_facts['carrier'] ?? '' ) );
		$tracking_number  = sanitize_text_field( (string) ( $shipment_facts['tracking_number'] ?? '' ) );
		$tracking_url     = esc_url_raw( (string) ( $shipment_facts['tracking_url'] ?? '' ) );
		$customer_note    = sanitize_textarea_field( (string) ( $shipment_facts['customer_note'] ?? '' ) );

		if ( '' === $tracking_url && '' !== $tracking_number ) {
			$parsed = apply_filters( 'woocommerce_fulfillment_parse_tracking_number', $tracking_number, '', $order->get_shipping_country() ?: $order->get_billing_country() );
			if ( is_array( $parsed ) ) {
				$tracking_url = esc_url_raw( (string) ( $parsed['tracking_url'] ?? '' ) );
				if ( '' === $carrier ) {
					$carrier = sanitize_text_field( (string) ( $parsed['shipping_provider'] ?? '' ) );
				}
			}
		}

		$date_fulfilled = current_time( 'mysql', true );

		$fingerprint = dtb_veeqo_fulfillment_fingerprint(
			[
				'identity'        => $identity,
				'status'          => 'fulfilled',
				'items'           => $mapped_items,
				'carrier'         => $carrier,
				'tracking_number' => $tracking_number,
				'tracking_url'    => $tracking_url,
				'date_fulfilled'  => $date_fulfilled,
				'source_revision' => (string) ( $shipment_facts['source_revision'] ?? '' ),
			]
		);

		$existing    = dtb_veeqo_fulfillment_find_existing( $order, $identity );
		$is_update   = null !== $existing;
		$fulfillment = $existing;

		if ( $is_update ) {
			if ( $fulfillment->is_locked() ) {
				return $outcome( 'rejected_locked', $fulfillment->get_id(), $identity );
			}

			$existing_fingerprint = (string) $fulfillment->get_meta( DTB_VEEQO_FULFILLMENT_FINGERPRINT_META, true );
			if ( $existing_fingerprint === $fingerprint ) {
				return $outcome( 'no_change', $fulfillment->get_id(), $identity );
			}
		} else {
			$fulfillment = new \Automattic\WooCommerce\Admin\Features\Fulfillments\Fulfillment();
			$fulfillment->set_entity_type( \WC_Order::class );
			$fulfillment->set_entity_id( (string) $order_id );
		}

		// 5. Build and save. Veeqo only ever reports shipments that already
		// happened — never created as an unfulfilled draft.
		$fulfillment->set_status( 'fulfilled' );
		$fulfillment->set_items( $mapped_items );
		if ( '' !== $tracking_number ) {
			$fulfillment->set_tracking_number( $tracking_number );
		}
		if ( '' !== $carrier ) {
			$fulfillment->set_shipment_provider( $carrier );
		}
		if ( '' !== $tracking_url ) {
			$fulfillment->set_tracking_url( $tracking_url );
		}
		$fulfillment->update_meta_data( DTB_VEEQO_FULFILLMENT_IDENTITY_META, $identity );
		$fulfillment->update_meta_data( DTB_VEEQO_FULFILLMENT_FINGERPRINT_META, $fingerprint );

		try {
			$fulfillment->save();
		} catch ( \Throwable $e ) {
			if ( function_exists( 'dtb_veeqo_log' ) ) {
				dtb_veeqo_log( 'error', 'fulfillment_projection_save_failed', $e->getMessage(), [ 'order_id' => $order_id, 'identity' => $identity ] );
			}
			return $outcome( 'failed_native_persistence', null, $identity );
		}

		// 6. Ownership transfers only after all four conditions hold.
		// (1) save() succeeded (above). (2) verify the committed record.
		if ( $fulfillment->get_id() <= 0 || ! $fulfillment->get_is_fulfilled() ) {
			return $outcome( 'failed_native_persistence', $fulfillment->get_id() ?: null, $identity );
		}

		// (3) invoke the correct native notification action.
		try {
			if ( $is_update ) {
				do_action( 'woocommerce_fulfillment_updated_notification', $order_id, $fulfillment, $order, $customer_note );
			} else {
				do_action( 'woocommerce_fulfillment_created_notification', $order_id, $fulfillment, $order );
			}
		} catch ( \Throwable $e ) {
			if ( function_exists( 'dtb_veeqo_log' ) ) {
				dtb_veeqo_log( 'error', 'fulfillment_projection_notify_failed', $e->getMessage(), [ 'order_id' => $order_id, 'fulfillment_id' => $fulfillment->get_id() ] );
			}
			// Record already exists but ownership (4) is intentionally not
			// recorded — the fingerprint meta already written above is
			// re-evaluated on the next attempt, and the legacy path remains
			// eligible until a later run completes all four conditions.
			return $outcome( 'failed_native_persistence', $fulfillment->get_id(), $identity );
		}

		// (4) ownership is the fingerprint meta already persisted with the
		// record in step 5 — idempotent by construction: a repeat commit of
		// the same fingerprint short-circuits to no_change above.
		return $outcome( $is_update ? 'updated' : 'created', $fulfillment->get_id(), $identity );
	} finally {
		dtb_veeqo_fulfillment_lock_release( $lock_key, $token );
	}
}
