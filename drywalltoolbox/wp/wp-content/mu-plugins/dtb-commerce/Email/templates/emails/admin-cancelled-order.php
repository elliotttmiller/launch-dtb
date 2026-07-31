<?php
/**
 * DTB branded admin cancelled order email.
 *
 * Traced against WooCommerce core emails/admin-cancelled-order.php v9.8.0
 * (wp-content/plugins/woocommerce/templates/emails/admin-cancelled-order.php).
 * DTB customization: operational copy; hook sequence preserved unchanged.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email ); ?>

<div class="email-introduction">
	<p><?php printf( esc_html__( 'Order #%1$s from %2$s was cancelled. Release any reserved inventory and stop fulfillment if it has not already shipped.', 'drywall-toolbox' ), esc_html( $order->get_order_number() ), esc_html( $order->get_formatted_billing_full_name() ) ); ?></p>
</div>

<?php
do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_order_meta', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

if ( $additional_content ) {
	echo '<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr><td class="email-additional-content">';
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
	echo '</td></tr></table>';
}

do_action( 'woocommerce_email_footer', $email );
