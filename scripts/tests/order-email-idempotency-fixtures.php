<?php
/**
 * Focused regression fixtures for order-email/Veeqo poll idempotency.
 */

define( 'ABSPATH', __DIR__ );
define( 'MINUTE_IN_SECONDS', 60 );
define( 'HOUR_IN_SECONDS', 3600 );
define( 'DAY_IN_SECONDS', 86400 );
define( 'WEEK_IN_SECONDS', 604800 );

$dtb_test_transients = [];
$dtb_test_options    = [];
$dtb_test_candidates = [];
$dtb_test_scheduled  = [];
$dtb_test_unscheduled = [];

function add_filter() {}
function add_action() {}
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
function get_option( $key, $default = false ) {
	global $dtb_test_options;
	return $dtb_test_options[ $key ] ?? $default;
}
function update_option( $key, $value, $autoload = null ) {
	global $dtb_test_options;
	$dtb_test_options[ $key ] = $value;
	return true;
}
function wc_get_orders( $args ) {
	global $dtb_test_candidates;
	return array_slice( $dtb_test_candidates, 0, (int) ( $args['limit'] ?? count( $dtb_test_candidates ) ) );
}
function dtb_veeqo_production_readiness() {
	return [ 'ready' => true ];
}
function as_next_scheduled_action( $hook, $args, $group ) {
	global $dtb_test_scheduled;
	return isset( $dtb_test_scheduled[ $hook ] ) ? $dtb_test_scheduled[ $hook ]['timestamp'] : false;
}
function as_schedule_single_action( $timestamp, $hook, $args, $group, $unique = false ) {
	global $dtb_test_scheduled;
	$dtb_test_scheduled[ $hook ] = compact( 'timestamp', 'hook', 'args', 'group', 'unique' );
	return count( $dtb_test_scheduled );
}
function as_unschedule_all_actions( $hook, $args, $group ) {
	global $dtb_test_scheduled, $dtb_test_unscheduled;
	unset( $dtb_test_scheduled[ $hook ] );
	$dtb_test_unscheduled[] = $hook;
	return 1;
}
function current_time() {
	return '2026-07-30 17:00:00';
}
function sanitize_key( $value ) {
	return strtolower( preg_replace( '/[^a-z0-9_\-]/', '', (string) $value ) );
}
function sanitize_text_field( $value ) {
	return trim( (string) $value );
}
function absint( $value ) {
	return abs( (int) $value );
}

class WC_Order {
	public int $id;
	public string $status;
	public array $meta;
	public int $meta_saves = 0;
	public int $status_updates = 0;
	public int $created_at;

	public function __construct( int $id, string $status = 'processing', array $meta = [] ) {
		$this->id     = $id;
		$this->status = $status;
		$this->meta   = $meta;
		$this->created_at = time() - HOUR_IN_SECONDS;
	}
	public function get_id(): int {
		return $this->id;
	}
	public function get_status(): string {
		return $this->status;
	}
	public function get_date_created(): object {
		return new class( $this->created_at ) {
			private int $timestamp;
			public function __construct( int $timestamp ) {
				$this->timestamp = $timestamp;
			}
			public function getTimestamp(): int {
				return $this->timestamp;
			}
		};
	}
	public function get_meta( string $key, bool $single = true ) {
		return $this->meta[ $key ] ?? '';
	}
	public function update_meta_data( string $key, $value ): void {
		$this->meta[ $key ] = $value;
	}
	public function save_meta_data(): void {
		++$this->meta_saves;
	}
	public function update_status( string $status, string $note = '' ): void {
		$this->status = $status;
		++$this->status_updates;
	}
}

function dtb_test_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		throw new RuntimeException( $message );
	}
}

require_once __DIR__ . '/../../drywalltoolbox/wp/wp-content/mu-plugins/dtb-order-platform/Email/OrderEmailIdempotency.php';
require_once __DIR__ . '/../../drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/Veeqo/VeeqoOrderStatusApplier.php';
require_once __DIR__ . '/../../drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/Veeqo/VeeqoOrderStatusPoller.php';

$order = new WC_Order( 5830 );
dtb_test_assert( dtb_order_email_processing_is_enabled( true, $order ), 'First processing email should be enabled.' );

$email         = new stdClass();
$email->object = $order;
dtb_order_email_record_successful_processing_send( false, 'customer_processing_order', $email );
dtb_test_assert( dtb_order_email_processing_is_enabled( true, $order ), 'Failed transport must not mark the email sent.' );

dtb_order_email_record_successful_processing_send( true, 'customer_processing_order', $email );
dtb_test_assert( ! dtb_order_email_processing_is_enabled( true, $order ), 'Successful processing email must suppress a duplicate.' );

set_transient( 'dtb_veeqo_webhook_updating_order_5830', '1', 60 );
dtb_test_assert( ! dtb_veeqo_suppress_processing_email_during_fulfillment_sync( true, $order ), 'Veeqo fulfillment sync must not emit a processing email.' );
delete_transient( 'dtb_veeqo_webhook_updating_order_5830' );

$unchanged = new WC_Order(
	5831,
	'processing',
	[
		'_dtb_veeqo_fulfillment_rank' => 20,
		'_dtb_veeqo_order_id'         => 991,
	]
);
$result    = dtb_veeqo_apply_order_fulfillment_status(
	$unchanged,
	'awaiting_fulfillment',
	[
		'source'         => 'poll',
		'veeqo_order_id' => 991,
	]
);
dtb_test_assert( 'no_change' === $result['result'], 'An unchanged Veeqo poll must be a no-op.' );
dtb_test_assert( 0 === $unchanged->meta_saves, 'An unchanged Veeqo poll must not save order meta.' );
dtb_test_assert( 0 === $unchanged->status_updates, 'An unchanged Veeqo poll must not update order status.' );

$dtb_test_candidates = [
	new WC_Order( 5832, 'processing', [ '_dtb_veeqo_order_id' => 992 ] ),
];
dtb_test_assert( dtb_veeqo_order_status_poll_schedule_if_needed( 2 * MINUTE_IN_SECONDS ), 'An eligible order should schedule one bounded poll.' );
dtb_test_assert( isset( $dtb_test_scheduled[ DTB_VEEQO_ORDER_STATUS_POLL_HOOK ] ), 'The bounded poll hook should be pending.' );
dtb_test_assert( DTB_VEEQO_ORDER_STATUS_POLL_HOOK !== DTB_VEEQO_ORDER_STATUS_POLL_LEGACY_HOOK, 'The permanent recurring hook must be retired.' );
dtb_test_assert( ! dtb_veeqo_order_status_poll_schedule_if_needed( 2 * MINUTE_IN_SECONDS ), 'A pending poll must deduplicate a second schedule request.' );

dtb_veeqo_order_status_poll_migrate_scheduler();
dtb_test_assert( in_array( DTB_VEEQO_ORDER_STATUS_POLL_LEGACY_HOOK, $dtb_test_unscheduled, true ), 'Migration must remove the legacy recurrence.' );
dtb_test_assert( DTB_VEEQO_ORDER_STATUS_POLL_SCHEDULER_VERSION === (int) get_option( DTB_VEEQO_ORDER_STATUS_POLL_MIGRATION_OPTION ), 'Migration version must be durable.' );

echo "Order email idempotency fixtures passed.\n";
