<?php
/**
 * DTB branded customer processing order email.
 *
 * Traced against WooCommerce core emails/customer-processing-order.php
 * v10.4.0 (wp-content/plugins/woocommerce/templates/emails/customer-processing-order.php).
 * DTB customization: full copy/visual redesign — status badge, "what
 * happens next" checklist, and order-summary presentation. Hook sequence
 * (order_details/order_meta/customer_details/footer) preserved unchanged.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email ); ?>

<div class="email-introduction">
	<?php echo function_exists( 'dtb_email_status_badge' ) ? dtb_email_status_badge( __( 'Payment received', 'drywall-toolbox' ), 'success' ) : ''; ?>
	<p>
	<?php
	if ( $order->get_billing_first_name() ) {
		/* translators: %s: Customer first name */
		printf( esc_html__( 'Hi %s, thanks for your order.', 'drywall-toolbox' ), esc_html( $order->get_billing_first_name() ) );
	} else {
		esc_html_e( 'Thanks for your order.', 'drywall-toolbox' );
	}
	?>
	</p>
	<p><?php esc_html_e( 'We\'ve confirmed your payment and your tools are being picked and packed for shipment. You\'ll get a separate email with tracking as soon as your order ships.', 'drywall-toolbox' ); ?></p>
	<?php
	echo function_exists( 'dtb_email_details_table_light' ) ? dtb_email_details_table_light(
		[
			[ 'label' => __( 'Order number', 'drywall-toolbox' ), 'value' => (string) $order->get_order_number() ],
			[ 'label' => __( 'Order date', 'drywall-toolbox' ), 'value' => $order->get_date_created() ? $order->get_date_created()->date_i18n( 'F j, Y' ) : '' ],
			[ 'label' => __( 'Order total', 'drywall-toolbox' ), 'value' => wp_strip_all_tags( $order->get_formatted_order_total() ) ],
		]
	) : '';
	?>
	<?php
	echo function_exists( 'dtb_email_next_steps_list' ) ? dtb_email_next_steps_list(
		[
			__( 'We prepare and pack your order', 'drywall-toolbox' ),
			__( 'You\'ll receive a shipping confirmation with tracking once it leaves our warehouse', 'drywall-toolbox' ),
			__( 'Questions about your order? Reply to this email or contact support', 'drywall-toolbox' ),
		]
	) : '';
	?>
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
