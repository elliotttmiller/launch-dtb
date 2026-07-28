<?php
/**
 * Recover declined/failed replacement-provider checkout attempts without leaving
 * a durable failed customer order when no paid or downstream state exists.
 *
 * WooCommerce Checkout Block creates a provisional order before invoking Payment
 * Plugins for Stripe. A recoverable provider failure may return that order to
 * WooCommerce's checkout-draft state so the shopper can retry in the same session.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_FailedPaymentRecovery {
	private const RECOVERY_META      = '_dtb_payment_retry_recovered';
	private const ATTEMPT_COUNT_META = '_dtb_payment_attempt_count';
	private const LAST_FAILURE_META  = '_dtb_last_payment_failure_at';
	private const LAST_STATUS_META   = '_dtb_last_payment_failure_status';
	private const CHECKOUT_DRAFT     = 'checkout-draft';
	private const CHECKOUT_GATEWAY   = 'woo_native_stripe';
	private const CHECKOUT_CONTRACT  = 'payment-plugins-stripe-v1';

	public static function register(): void {
		add_action( 'woocommerce_order_status_failed', [ __CLASS__, 'recover' ], 100 );
	}

	/** @param int $order_id WooCommerce order ID. */
	public static function recover( $order_id ): void {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order instanceof WC_Order || ! self::is_recoverable_checkout_attempt( $order ) ) {
			return;
		}

		$attempt_count = max( 0, (int) $order->get_meta( self::ATTEMPT_COUNT_META, true ) ) + 1;
		$order->update_meta_data( self::RECOVERY_META, '1' );
		$order->update_meta_data( self::ATTEMPT_COUNT_META, (string) $attempt_count );
		$order->update_meta_data( self::LAST_FAILURE_META, gmdate( 'c' ) );
		$order->update_meta_data( self::LAST_STATUS_META, 'failed' );
		$order->set_status( self::CHECKOUT_DRAFT );
		$order->save();

		/**
		 * Consumers must remain idempotent and must not enqueue fulfillment,
		 * accounting, notification, or inventory-allocation side effects.
		 */
		do_action( 'dtb_checkout_payment_retry_recovered', (int) $order->get_id(), $order, $attempt_count );
	}

	private static function is_recoverable_checkout_attempt( WC_Order $order ): bool {
		if ( self::CHECKOUT_GATEWAY !== sanitize_key( (string) $order->get_meta( '_dtb_checkout_gateway', true ) ) ) {
			return false;
		}
		if ( self::CHECKOUT_CONTRACT !== sanitize_key( (string) $order->get_meta( '_dtb_checkout_contract_version', true ) ) ) {
			return false;
		}
		if ( $order->is_paid() || $order->get_date_paid() ) {
			return false;
		}
		if ( '1' === (string) $order->get_meta( '_dtb_payment_captured', true ) ) {
			return false;
		}
		if ( function_exists( 'dtb_checkout_handoff_has_captured_payment' ) && dtb_checkout_handoff_has_captured_payment( $order ) ) {
			return false;
		}

		$payment_method = sanitize_key( (string) $order->get_payment_method() );
		if (
			'' === $payment_method
			|| ! class_exists( 'DTB_PaymentPluginsStripeNativeCheckout' )
			|| ! DTB_PaymentPluginsStripeNativeCheckout::is_payment_plugins_gateway_id( $payment_method )
		) {
			return false;
		}

		return ! self::has_irreversible_downstream_state( $order );
	}

	private static function has_irreversible_downstream_state( WC_Order $order ): bool {
		foreach (
			[
				'_dtb_payment_handoff_completed',
				'_dtb_processing_jobs_dispatched',
				'_dtb_veeqo_order_id',
				'_dtb_quickbooks_transaction_id',
				'_dtb_fulfillment_started',
			] as $meta_key
		) {
			$value = $order->get_meta( $meta_key, true );
			if ( '' !== (string) $value && '0' !== (string) $value ) {
				return true;
			}
		}
		return false;
	}
}

DTB_FailedPaymentRecovery::register();
