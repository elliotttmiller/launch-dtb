<?php
/**
 * Recover declined or failed DTB checkout payments without committing a failed order.
 *
 * WooCommerce Checkout Block creates a provisional checkout order before the payment
 * gateway is invoked. For the official Stripe flow, a recoverable payment failure is
 * converted back to WooCommerce's checkout-draft state so the shopper remains in the
 * same checkout session and can retry without leaving a failed customer order behind.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_FailedPaymentRecovery {
	private const RECOVERY_META       = '_dtb_payment_retry_recovered';
	private const ATTEMPT_COUNT_META  = '_dtb_payment_attempt_count';
	private const LAST_FAILURE_META   = '_dtb_last_payment_failure_at';
	private const LAST_STATUS_META    = '_dtb_last_payment_failure_status';
	private const CHECKOUT_DRAFT      = 'checkout-draft';
	private const CHECKOUT_GATEWAY    = 'woo_native_stripe';
	private const CHECKOUT_CONTRACT   = 'woo-stripe-v1';

	/**
	 * Register the recovery boundary after lifecycle observers have recorded the
	 * failed attempt, but before the failed status becomes durable customer state.
	 */
	public static function register(): void {
		add_action( 'woocommerce_order_status_failed', [ __CLASS__, 'recover' ], 100 );
	}

	/**
	 * Convert a recoverable failed checkout attempt back into a provisional draft.
	 *
	 * This does not suppress WooCommerce or Stripe validation. It only changes the
	 * lifecycle state after the gateway has authoritatively reported failure.
	 *
	 * @param int $order_id WooCommerce order ID.
	 */
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
		 * Fires after a failed DTB Stripe checkout attempt is restored to a draft.
		 *
		 * Consumers must remain idempotent and must not enqueue fulfillment,
		 * accounting, notification, or inventory-allocation side effects.
		 *
		 * @param int      $order_id     WooCommerce order ID.
		 * @param WC_Order $order        Recovered checkout draft.
		 * @param int      $attempt_count Number of recorded failed attempts.
		 */
		do_action( 'dtb_checkout_payment_retry_recovered', (int) $order->get_id(), $order, $attempt_count );
	}

	/**
	 * Determine whether a failed order is an unpaid, retryable DTB checkout attempt.
	 */
	private static function is_recoverable_checkout_attempt( WC_Order $order ): bool {
		if ( self::CHECKOUT_GATEWAY !== (string) $order->get_meta( '_dtb_checkout_gateway', true ) ) {
			return false;
		}

		if ( self::CHECKOUT_CONTRACT !== (string) $order->get_meta( '_dtb_checkout_contract_version', true ) ) {
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
		if ( '' === $payment_method || ! str_contains( $payment_method, 'stripe' ) ) {
			return false;
		}

		return ! self::has_irreversible_downstream_state( $order );
	}

	/**
	 * Never recycle an order that has crossed a downstream processing boundary.
	 */
	private static function has_irreversible_downstream_state( WC_Order $order ): bool {
		$protected_meta_keys = [
			'_dtb_payment_handoff_completed',
			'_dtb_processing_jobs_dispatched',
			'_dtb_veeqo_order_id',
			'_dtb_quickbooks_transaction_id',
			'_dtb_fulfillment_started',
		];

		foreach ( $protected_meta_keys as $meta_key ) {
			$value = $order->get_meta( $meta_key, true );
			if ( '' !== (string) $value && '0' !== (string) $value ) {
				return true;
			}
		}

		return false;
	}
}

DTB_FailedPaymentRecovery::register();
