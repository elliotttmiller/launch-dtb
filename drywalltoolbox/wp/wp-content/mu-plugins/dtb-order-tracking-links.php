<?php
/**
 * Plugin Name: DTB Order Tracking Links
 * Description: Routes customer-facing product orders to the React order tracking page and injects tracking links into customer emails.
 * Version: 1.0.1
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_tracking_links_is_public_request' ) ) {
	function dtb_tracking_links_is_public_request(): bool {
		return ! is_admin()
			&& ! ( defined( 'REST_REQUEST' ) && REST_REQUEST )
			&& ! ( defined( 'DOING_AJAX' ) && DOING_AJAX )
			&& ! ( defined( 'DOING_CRON' ) && DOING_CRON )
			&& ! ( defined( 'WP_CLI' ) && WP_CLI );
	}
}

if ( ! function_exists( 'dtb_tracking_links_frontend_base_for_order' ) ) {
	function dtb_tracking_links_frontend_base_for_order( WC_Order $order ): string { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		return rtrim( home_url( '/' ), '/' );
	}
}

if ( ! function_exists( 'dtb_order_tracking_url' ) ) {
	function dtb_order_tracking_url( WC_Order $order ): string {
		$base = dtb_tracking_links_frontend_base_for_order( $order );
		$url  = $base . '/order-tracking/' . absint( $order->get_id() );

		return add_query_arg( 'order_key', rawurlencode( (string) $order->get_order_key() ), $url );
	}
}

if ( ! function_exists( 'dtb_order_tracking_checkout_complete_url' ) ) {
	function dtb_order_tracking_checkout_complete_url( WC_Order $order ): string {
		return add_query_arg( 'checkout_complete', '1', dtb_order_tracking_url( $order ) );
	}
}

/*
 * Deliberately NOT rewriting `woocommerce_get_checkout_order_received_url` and
 * NOT redirecting away from `/checkout/order-received/{id}/` at `template_redirect`.
 *
 * That URL is also the Stripe gateway's own `return_url` for redirect-based
 * payment methods (3DS, some wallets), and native WooCommerce order-received
 * page loads are where the Stripe gateway synchronously verifies the payment
 * intent and calls `$order->payment_complete()`. Bouncing the browser away from
 * that page before it renders — as this file previously did — skips that
 * verification entirely, leaving the order stuck on "pending" until (and
 * unless) an external Stripe webhook eventually reconciles it.
 *
 * Instead, redirect to the React tracking page from `woocommerce_thankyou`,
 * which WooCommerce's own order-received template fires only after it has
 * already resolved the order's real payment status. The customer still lands
 * on the tracking page; it just now reflects the correct status.
 */
add_action(
	'woocommerce_thankyou',
	static function ( $order_id ): void {
		if ( ! dtb_tracking_links_is_public_request() || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order = wc_get_order( absint( $order_id ) );
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		$key = isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( '' !== $key && ! hash_equals( (string) $order->get_order_key(), $key ) ) {
			return;
		}

		$url = dtb_order_tracking_checkout_complete_url( $order );
		echo '<script>window.location.replace(' . wp_json_encode( $url ) . ');</script>';
	},
	100
);

add_action(
	'woocommerce_email_after_order_table',
	static function ( $order, $sent_to_admin, $plain_text, $email ): void {
		if ( $sent_to_admin || ! $order instanceof WC_Order ) {
			return;
		}

		$url = dtb_order_tracking_url( $order );
		if ( '' === $url ) {
			return;
		}

		if ( $plain_text ) {
			echo "\nTrack Order: " . esc_url_raw( $url ) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			return;
		}

		echo '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:26px 0 22px;border-collapse:separate;">';
		echo '<tr><td align="center" style="padding:0;">';
		echo '<a href="' . esc_url( $url ) . '" style="display:block;width:100%;box-sizing:border-box;padding:16px 22px;border-radius:16px;background:#2563eb;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:16px;font-weight:800;line-height:22px;text-align:center;text-decoration:none;box-shadow:0 14px 28px rgba(37,99,235,0.24);">Track Order</a>';
		echo '</td></tr></table>';
	},
	20,
	4
);
