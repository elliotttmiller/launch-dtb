<?php
/**
 * DTB branded admin new order email.
 *
 * Traced against WooCommerce core emails/admin-new-order.php v10.4.0
 * (wp-content/plugins/woocommerce/templates/emails/admin-new-order.php).
 * DTB customization: operational, action-oriented copy for the operations
 * team; hook sequence (order_details/order_meta/customer_details/footer)
 * preserved unchanged.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email ); ?>

<div class="email-introduction">
	<p><?php printf( esc_html__( 'New order #%1$s from %2$s. Review payment and begin fulfillment.', 'drywall-toolbox' ), esc_html( $order->get_order_number() ), esc_html( $order->get_formatted_billing_full_name() ) ); ?></p>
</div>

<?php
/*
 * @hooked WC_Emails::order_details() Shows the order details table.
 * @hooked WC_Structured_Data::generate_order_data() Generates structured data.
 * @hooked WC_Structured_Data::output_structured_data() Outputs structured data.
 */
do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );

/*
 * @hooked WC_Emails::order_meta() Shows order meta data.
 */
do_action( 'woocommerce_email_order_meta', $order, $sent_to_admin, $plain_text, $email );

/*
 * @hooked WC_Emails::customer_details() Shows customer details
 * @hooked WC_Emails::email_address() Shows email address
 */
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

if ( $additional_content ) {
	echo '<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr><td class="email-additional-content">';
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
	echo '</td></tr></table>';
}

do_action( 'woocommerce_email_footer', $email );
