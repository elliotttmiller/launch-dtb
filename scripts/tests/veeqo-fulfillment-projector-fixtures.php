<?php
/**
 * Focused regression fixtures for the Veeqo -> native WooCommerce
 * Fulfillment projector's shipment-identity normalizer and idempotency
 * behavior.
 *
 * Run: php scripts/tests/veeqo-fulfillment-projector-fixtures.php
 */

namespace {

define( 'ABSPATH', __DIR__ );

// -----------------------------------------------------------------------
// WordPress/WooCommerce function + class stubs.
// -----------------------------------------------------------------------

$dtb_test_transients            = [];
$dtb_test_fulfillments          = [];
$dtb_test_next_fulfillment_id   = 1;
$dtb_test_save_should_throw     = false;
$dtb_test_notify_should_throw   = false;
$dtb_test_events                = [];
$dtb_test_notifications_fired   = [];

function absint( $value ) {
	return abs( (int) $value );
}
function sanitize_text_field( $value ) {
	return trim( (string) $value );
}
function sanitize_key( $value ) {
	return strtolower( preg_replace( '/[^a-z0-9_\-]/', '', (string) $value ) );
}
function esc_url_raw( $value ) {
	return (string) $value;
}
function esc_url( $value ) {
	return (string) $value;
}
function wp_json_encode( $value ) {
	return json_encode( $value ); // phpcs:ignore
}
function current_time( $type, $gmt = 0 ) {
	return '2026-07-31 12:00:00';
}
function get_transient( $key ) {
	global $dtb_test_transients;
	return $dtb_test_transients[ $key ] ?? false;
}
function set_transient( $key, $value, $expiration ) {
	global $dtb_test_transients;
	$dtb_test_transients[ $key ] = $value;
	return true;
}
function delete_transient( $key ) {
	global $dtb_test_transients;
	unset( $dtb_test_transients[ $key ] );
	return true;
}
function wp_generate_password( $length = 20, $special = true ) {
	static $n = 0;
	return 'token-' . ( ++$n );
}
function apply_filters( $tag, $value = null, ...$args ) {
	if ( 'dtb_veeqo_fulfillment_projection_enabled' === $tag ) {
		return true;
	}
	// woocommerce_fulfillment_parse_tracking_number and friends: no-op passthrough.
	return $value;
}
function do_action( $tag, ...$args ) {
	global $dtb_test_notify_should_throw, $dtb_test_notifications_fired;
	if ( in_array( $tag, [ 'woocommerce_fulfillment_created_notification', 'woocommerce_fulfillment_updated_notification' ], true ) ) {
		if ( $dtb_test_notify_should_throw ) {
			throw new \Exception( 'forced notification failure' );
		}
		$dtb_test_notifications_fired[] = $tag;
	}
}
function dtb_order_append_event( $order_id, $type, $args = [] ) {
	global $dtb_test_events;
	$dtb_test_events[] = compact( 'order_id', 'type', 'args' );
	return true;
}
function dtb_veeqo_log( $level, $event, $message, $context = [] ) {}

function dtb_test_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		throw new RuntimeException( $message );
	}
}

class WC_Product {
	public function __construct( private string $sku ) {}
	public function get_sku(): string {
		return $this->sku;
	}
}

class WC_Order_Item_Product {
	private static int $next_id = 100;
	public int $id;
	public function __construct( private WC_Product $product, private int $qty ) {
		$this->id = self::$next_id++;
	}
	public function get_id(): int {
		return $this->id;
	}
	public function get_product(): WC_Product {
		return $this->product;
	}
	public function get_quantity(): int {
		return $this->qty;
	}
}

class WC_Order {
	private array $items = [];
	private array $refunded = [];
	public function __construct( private int $id ) {}
	public function get_id(): int {
		return $this->id;
	}
	public function add_item( WC_Order_Item_Product $item ): void {
		$this->items[ $item->get_id() ] = $item;
	}
	public function get_items(): array {
		return $this->items;
	}
	public function get_qty_refunded_for_item( int $item_id ): int {
		return $this->refunded[ $item_id ] ?? 0;
	}
	public function get_shipping_country(): string {
		return 'US';
	}
	public function get_billing_country(): string {
		return 'US';
	}
}

class WC_Data_Store {
	public static function load( string $key ) {
		if ( 'order-fulfillment' === $key ) {
			return new \Automattic\WooCommerce\Admin\Features\Fulfillments\DataStore\FulfillmentsDataStore();
		}
		throw new \Exception( 'unknown data store: ' . $key );
	}
}

/**
 * Minimal $wpdb stand-in that answers the two queries
 * dtb_veeqo_fulfillment_identity_conflicts() issues, backed by the
 * in-memory $dtb_test_fulfillments fixture data instead of a real table.
 */
class DTB_Test_Wpdb {
	public string $prefix = 'wp_';

	public function prepare( string $query, ...$args ) {
		return [ 'query' => $query, 'args' => $args ];
	}

	public function get_var( $prepared ) {
		global $dtb_test_fulfillments;

		[ 'query' => $query, 'args' => $args ] = $prepared;

		if ( str_contains( $query, 'wc_order_fulfillment_meta' ) ) {
			// Looking up a fulfillment_id owning a given meta key/value.
			[ $meta_key, $meta_value ] = $args;
			foreach ( $dtb_test_fulfillments as $fulfillment_id => $fulfillment ) {
				if ( (string) $fulfillment->get_meta( $meta_key, true ) === json_decode( $meta_value ) ) {
					return $fulfillment_id;
				}
			}
			return null;
		}

		if ( str_contains( $query, 'wc_order_fulfillments' ) ) {
			// Looking up the owning entity_id for a fulfillment_id.
			[ $fulfillment_id ] = $args;
			$fulfillment = $dtb_test_fulfillments[ $fulfillment_id ] ?? null;
			return $fulfillment ? $fulfillment->get_entity_id() : null;
		}

		return null;
	}
}

$GLOBALS['wpdb'] = new DTB_Test_Wpdb();

} // end global namespace block

namespace Automattic\WooCommerce\Admin\Features\Fulfillments\DataStore {
	class FulfillmentsDataStore {
		public function read_fulfillments( string $entity_type, string $entity_id ): array {
			global $dtb_test_fulfillments;
			return array_values(
				array_filter(
					$dtb_test_fulfillments,
					static fn( $f ) => $f->get_entity_type() === $entity_type && $f->get_entity_id() === $entity_id && null === $f->get_date_deleted()
				)
			);
		}
	}
}

namespace Automattic\WooCommerce\Admin\Features\Fulfillments {
	class Fulfillment {
		private int $id = 0;
		private ?string $entity_type = null;
		private ?string $entity_id = null;
		private ?string $status = null;
		private bool $is_fulfilled = false;
		private array $meta = [];
		private ?string $date_deleted = null;

		public function set_entity_type( ?string $t ): void {
			$this->entity_type = $t;
		}
		public function get_entity_type(): ?string {
			return $this->entity_type;
		}
		public function set_entity_id( ?string $id ): void {
			$this->entity_id = $id;
		}
		public function get_entity_id(): ?string {
			return $this->entity_id;
		}
		public function set_status( ?string $status ): void {
			$this->status       = $status;
			$this->is_fulfilled = ( 'fulfilled' === $status );
		}
		public function get_status(): ?string {
			return $this->status;
		}
		public function get_is_fulfilled(): bool {
			return $this->is_fulfilled;
		}
		public function is_locked(): bool {
			return ! empty( $this->meta['_is_locked'] );
		}
		public function set_items( array $items ): void {
			$this->meta['_items'] = $items;
		}
		public function get_items(): array {
			return $this->meta['_items'] ?? [];
		}
		public function set_tracking_number( string $v ): void {
			$this->meta['_tracking_number'] = $v;
		}
		public function set_shipment_provider( string $v ): void {
			$this->meta['_shipment_provider'] = $v;
		}
		public function set_tracking_url( string $v ): void {
			$this->meta['_tracking_url'] = $v;
		}
		public function update_meta_data( string $key, $value ): void {
			$this->meta[ $key ] = $value;
		}
		public function get_meta( string $key, bool $single = true ) {
			return $this->meta[ $key ] ?? '';
		}
		public function get_id(): int {
			return $this->id;
		}
		public function get_date_deleted(): ?string {
			return $this->date_deleted;
		}
		public function save(): void {
			global $dtb_test_fulfillments, $dtb_test_next_fulfillment_id, $dtb_test_save_should_throw;
			if ( $dtb_test_save_should_throw ) {
				throw new \Exception( 'forced save failure' );
			}
			if ( $this->id <= 0 ) {
				$this->id                              = $dtb_test_next_fulfillment_id++;
				$dtb_test_fulfillments[ $this->id ]     = $this;
			}
		}
	}
}

namespace {

require_once __DIR__ . '/../../drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/Veeqo/VeeqoFulfillmentProjector.php';

// -----------------------------------------------------------------------
// Shared fixture data.
// -----------------------------------------------------------------------

$sku_a = 'DTB-TAPER-10';
$sku_b = 'DTB-MUD-5G';

function dtb_test_make_order(): WC_Order {
	global $sku_a, $sku_b;
	$order = new WC_Order( 5834 );
	$order->add_item( new WC_Order_Item_Product( new WC_Product( $sku_a ), 2 ) );
	$order->add_item( new WC_Order_Item_Product( new WC_Product( $sku_b ), 1 ) );
	return $order;
}

function dtb_test_allocation( int $allocation_id, ?int $shipment_id, int $order_id, array $skus_qty, string $tracking_number = '', ?int $shipment_allocation_id = null, ?int $shipment_order_id = null ): array {
	if ( null === $shipment_id ) {
		return [ 'id' => $allocation_id ];
	}
	return [
		'id'         => $allocation_id,
		'line_items' => array_map( static fn( $sku_qty ) => [ 'sku' => $sku_qty[0], 'qty' => $sku_qty[1] ], $skus_qty ),
		'shipment'   => [
			'id'              => $shipment_id,
			'allocation_id'   => $shipment_allocation_id ?? $allocation_id,
			'order_id'        => $shipment_order_id ?? $order_id,
			'tracking_number' => $tracking_number,
		],
	];
}

// -----------------------------------------------------------------------
// 1. One allocation with one shipment.
// -----------------------------------------------------------------------
$obs = dtb_veeqo_normalize_shipment_observations(
	[ 'allocations' => [ dtb_test_allocation( 10, 500, 1995719253, [ [ $sku_a, 2 ] ] ) ] ],
	1995719253
);
dtb_test_assert( 1 === count( $obs ), 'One allocation/one shipment should yield exactly one observation.' );
dtb_test_assert( 'valid' === $obs[0]['status'], 'A well-formed allocation/shipment should be valid.' );
dtb_test_assert( 500 === $obs[0]['shipment_id'], 'Shipment ID must be the confirmed allocations[*].shipment.id field.' );

// -----------------------------------------------------------------------
// 2. Multiple allocations with separate shipments.
// -----------------------------------------------------------------------
$obs = dtb_veeqo_normalize_shipment_observations(
	[
		'allocations' => [
			dtb_test_allocation( 10, 500, 1995719253, [ [ $sku_a, 1 ] ] ),
			dtb_test_allocation( 11, 501, 1995719253, [ [ $sku_b, 1 ] ] ),
		],
	],
	1995719253
);
dtb_test_assert( 2 === count( $obs ), 'Two allocations with separate shipments should yield two observations.' );
dtb_test_assert( 'valid' === $obs[0]['status'] && 'valid' === $obs[1]['status'], 'Both should be valid.' );
dtb_test_assert( $obs[0]['shipment_id'] !== $obs[1]['shipment_id'], 'Shipment IDs must be distinct.' );

$order = dtb_test_make_order();
$r1    = dtb_veeqo_project_order_shipments( $order, [ 'allocations' => [ dtb_test_allocation( 10, 500, 1995719253, [ [ $sku_a, 1 ] ] ), dtb_test_allocation( 11, 501, 1995719253, [ [ $sku_b, 1 ] ] ) ] ], 1995719253 );
dtb_test_assert( true === $r1['native_notified'], 'Multi-shipment payload should be natively notified.' );
dtb_test_assert( 2 === count( array_unique( array_column( $r1['results'], 'fulfillment_id' ) ) ), 'Each shipment must produce its own distinct native Fulfillment record.' );

// -----------------------------------------------------------------------
// 3. Shipment absent.
// -----------------------------------------------------------------------
$obs = dtb_veeqo_normalize_shipment_observations( [ 'allocations' => [ dtb_test_allocation( 12, null, 1995719253, [] ) ] ], 1995719253 );
dtb_test_assert( 'deferred_incomplete_source' === $obs[0]['status'], 'A missing shipment must defer, not fabricate identity.' );

// -----------------------------------------------------------------------
// 4. Duplicate identical replay (within one payload).
// -----------------------------------------------------------------------
$alloc = dtb_test_allocation( 13, 502, 1995719253, [ [ $sku_a, 1 ] ] );
$obs   = dtb_veeqo_normalize_shipment_observations( [ 'allocations' => [ $alloc, $alloc ] ], 1995719253 );
dtb_test_assert( 1 === count( $obs ) && 'valid' === $obs[0]['status'], 'Identical duplicate allocation entries must collapse to one valid observation.' );

// -----------------------------------------------------------------------
// 5. Duplicate conflicting shipment record.
// -----------------------------------------------------------------------
$obs = dtb_veeqo_normalize_shipment_observations(
	[
		'allocations' => [
			dtb_test_allocation( 14, 503, 1995719253, [ [ $sku_a, 1 ] ], 'TRACK-A' ),
			dtb_test_allocation( 15, 503, 1995719253, [ [ $sku_b, 1 ] ], 'TRACK-B', 15, 1995719253 ),
		],
	],
	1995719253
);
dtb_test_assert( 2 === count( $obs ), 'Conflicting duplicates should still surface as two rejected observations.' );
foreach ( $obs as $o ) {
	dtb_test_assert( 'rejected_identity_conflict' === $o['status'], 'Conflicting duplicate shipment IDs must be rejected, not merged.' );
}

// -----------------------------------------------------------------------
// 6. Mismatched allocation reference.
// -----------------------------------------------------------------------
$obs = dtb_veeqo_normalize_shipment_observations(
	[ 'allocations' => [ dtb_test_allocation( 16, 504, 1995719253, [ [ $sku_a, 1 ] ], '', 99 ) ] ],
	1995719253
);
dtb_test_assert( 'rejected_identity_conflict' === $obs[0]['status'] && 'allocation_mismatch' === $obs[0]['reason'], 'shipment.allocation_id must match the enclosing allocation.id.' );

// -----------------------------------------------------------------------
// 7. Mismatched order reference.
// -----------------------------------------------------------------------
$obs = dtb_veeqo_normalize_shipment_observations(
	[ 'allocations' => [ dtb_test_allocation( 17, 505, 1995719253, [ [ $sku_a, 1 ] ], '', null, 999999 ) ] ],
	1995719253
);
dtb_test_assert( 'rejected_identity_conflict' === $obs[0]['status'] && 'order_mismatch' === $obs[0]['reason'], 'shipment.order_id must match the correlated Veeqo order.' );

// -----------------------------------------------------------------------
// 8. Tracking changes with unchanged shipment ID.
// -----------------------------------------------------------------------
$order  = dtb_test_make_order();
$first  = dtb_veeqo_project_order_shipments( $order, [ 'allocations' => [ dtb_test_allocation( 18, 506, 1995719253, [ [ $sku_a, 2 ] ], 'TRACK-OLD' ) ] ], 1995719253 );
dtb_test_assert( 'created' === $first['results'][0]['result'], 'First observation of a shipment should create a Fulfillment.' );
$second = dtb_veeqo_project_order_shipments( $order, [ 'allocations' => [ dtb_test_allocation( 18, 506, 1995719253, [ [ $sku_a, 2 ] ], 'TRACK-NEW' ) ] ], 1995719253 );
dtb_test_assert( 'updated' === $second['results'][0]['result'], 'A tracking-only change to the same shipment ID must update, not create.' );
dtb_test_assert( $first['results'][0]['fulfillment_id'] === $second['results'][0]['fulfillment_id'], 'The same shipment ID must reuse the same native Fulfillment record.' );
$third = dtb_veeqo_project_order_shipments( $order, [ 'allocations' => [ dtb_test_allocation( 18, 506, 1995719253, [ [ $sku_a, 2 ] ], 'TRACK-NEW' ) ] ], 1995719253 );
dtb_test_assert( 'no_change' === $third['results'][0]['result'], 'An identical re-observation must be a no-op (no duplicate save, no duplicate notification).' );

// -----------------------------------------------------------------------
// 9. Shipment ID collision across orders.
// -----------------------------------------------------------------------
$order_a = new WC_Order( 6001 );
$order_a->add_item( new WC_Order_Item_Product( new WC_Product( $sku_a ), 1 ) );
$order_b = new WC_Order( 6002 );
$order_b->add_item( new WC_Order_Item_Product( new WC_Product( $sku_a ), 1 ) );

$r_a = dtb_veeqo_project_order_shipments( $order_a, [ 'allocations' => [ dtb_test_allocation( 20, 900, 1000, [ [ $sku_a, 1 ] ] ) ] ], 1000 );
dtb_test_assert( 'created' === $r_a['results'][0]['result'], 'Order A should own shipment 900.' );
$r_b = dtb_veeqo_project_order_shipments( $order_b, [ 'allocations' => [ dtb_test_allocation( 21, 900, 1001, [ [ $sku_a, 1 ] ], '', 21, 1001 ) ] ], 1001 );
dtb_test_assert( 'rejected_identity_conflict' === $r_b['results'][0]['result'], 'A shipment ID already owned by a different WooCommerce order must never be reassigned.' );

// -----------------------------------------------------------------------
// 10. Partial shipment followed by a later shipment.
// -----------------------------------------------------------------------
$order   = dtb_test_make_order();
$partial = dtb_veeqo_project_order_shipments( $order, [ 'allocations' => [ dtb_test_allocation( 30, 700, 1995719253, [ [ $sku_a, 1 ] ] ) ] ], 1995719253 );
dtb_test_assert( 'created' === $partial['results'][0]['result'], 'The first (partial) shipment should be created independently.' );
$remainder = dtb_veeqo_project_order_shipments(
	$order,
	[
		'allocations' => [
			dtb_test_allocation( 30, 700, 1995719253, [ [ $sku_a, 1 ] ] ), // unchanged first shipment
			dtb_test_allocation( 31, 701, 1995719253, [ [ $sku_a, 1 ] ] ), // remainder, new shipment
		],
	],
	1995719253
);
dtb_test_assert( 'no_change' === $remainder['results'][0]['result'], 'The unchanged first shipment must not be re-saved or re-notified.' );
dtb_test_assert( 'created' === $remainder['results'][1]['result'], 'The later remainder shipment must be created as its own independent Fulfillment.' );
dtb_test_assert( $remainder['results'][0]['fulfillment_id'] !== $remainder['results'][1]['fulfillment_id'], 'Partial and remainder shipments must be two distinct native Fulfillment records.' );

echo "Veeqo fulfillment projector fixtures passed.\n";

}
