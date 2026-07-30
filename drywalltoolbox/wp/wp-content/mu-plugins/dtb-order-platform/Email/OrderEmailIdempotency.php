<?php
/**
 * Customer order-email idempotency.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_CUSTOMER_PROCESSING_EMAIL_SENT_META = '_dtb_customer_processing_email_sent_at';

/**
 * Prevent an automatic processing-order email after a successful prior send.
 *
 * This is intentionally limited to the initial customer processing email.
 * Shipping, refund, customer-note, and explicitly different lifecycle emails
 * retain their own delivery policies.
 */
add_filter( 'woocommerce_email_enabled_customer_processing_order', 'dtb_order_email_processing_is_enabled', 10, 3 );
function dtb_order_email_processing_is_enabled( bool $enabled, $order, $email = null ): bool {
	if ( ! $enabled || ! $order instanceof WC_Order ) {
		return $enabled;
	}

	if ( '' === (string) $order->get_meta( DTB_CUSTOMER_PROCESSING_EMAIL_SENT_META, true ) ) {
		return true;
	}

	$order_id = (int) $order->get_id();
	$log_key  = 'dtb_processing_email_duplicate_log_' . $order_id;
	if ( false === get_transient( $log_key ) ) {
		error_log( sprintf( '[DTB Orders] Suppressed duplicate customer_processing_order email for order %d.', $order_id ) );
		set_transient( $log_key, '1', HOUR_IN_SECONDS );
	}

	return false;
}

/**
 * Record only a mail transport result WooCommerce reports as successful.
 */
add_action( 'woocommerce_email_sent', 'dtb_order_email_record_successful_processing_send', 10, 3 );
function dtb_order_email_record_successful_processing_send( bool $sent, string $email_id, $email ): void {
	if ( ! $sent || 'customer_processing_order' !== $email_id || ! is_object( $email ) ) {
		return;
	}

	$order = $email->object ?? null;
	if ( ! $order instanceof WC_Order || '' !== (string) $order->get_meta( DTB_CUSTOMER_PROCESSING_EMAIL_SENT_META, true ) ) {
		return;
	}

	$order->update_meta_data( DTB_CUSTOMER_PROCESSING_EMAIL_SENT_META, current_time( 'mysql', true ) );
	$order->save_meta_data();
}
