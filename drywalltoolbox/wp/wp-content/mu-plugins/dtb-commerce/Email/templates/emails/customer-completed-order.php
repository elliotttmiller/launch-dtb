<?php
/**
 * DTB branded customer completed order email.
 *
 * Traced against WooCommerce core emails/customer-completed-order.php
 * v10.4.0. DTB customization: copy no longer equates WooCommerce
 * "completed" with "shipped" or "delivered" (it is an order close-out
 * state, while shipment notice is the separate native
 * customer_fulfillment_created/updated email); hero + progress tracker (its
 * final stage reads "Order complete", never "Delivered" — this template has
 * no authoritative delivery/carrier data, only WooCommerce's own "completed"
 * order status, so it must not claim delivery happened). Hook sequence
 * preserved.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email );

echo function_exists( 'dtb_email_hero' ) ? dtb_email_hero( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	$email_heading,
	'',
	/* translators: %s: order number. */
	sprintf( __( 'Order #%s', 'drywall-toolbox' ), $order->get_order_number() )
) : '';

echo function_exists( 'dtb_email_progress_steps' ) ? dtb_email_progress_steps( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	[
		[ 'label' => __( 'Payment received', 'drywall-toolbox' ), 'state' => 'done', 'icon' => 'payment' ],
		[ 'label' => __( 'Prepared', 'drywall-toolbox' ), 'state' => 'done', 'icon' => 'package' ],
		[ 'label' => __( 'Order complete', 'drywall-toolbox' ), 'state' => 'done', 'icon' => 'clipboard' ],
	]
) : '';
?>

<?php
do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_order_meta', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

echo function_exists( 'dtb_email_support_card' ) ? dtb_email_support_card( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	__( 'Questions about this order? Our team is here to help.', 'drywall-toolbox' ),
	function_exists( 'dtb_email_support_url' ) ? dtb_email_support_url() : home_url( '/contact/' ),
	__( 'Contact support', 'drywall-toolbox' ),
	'support',
	__( 'Need help?', 'drywall-toolbox' )
) : '';

if ( $additional_content ) {
	echo '<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr><td class="email-additional-content">';
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
	echo '</td></tr></table>';
}

do_action( 'woocommerce_email_footer', $email );
