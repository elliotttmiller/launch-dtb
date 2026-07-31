<?php
/**
 * DTB branded customer on-hold order email.
 *
 * Traced against WooCommerce core emails/customer-on-hold-order.php v10.4.0.
 * DTB customization: copy/visual redesign. Hook sequence preserved.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email ); ?>

<div class="email-introduction">
	<?php echo function_exists( 'dtb_email_status_badge' ) ? dtb_email_status_badge( __( 'Payment pending', 'drywall-toolbox' ), 'warning' ) : ''; ?>
	<p>
	<?php
	if ( $order->get_billing_first_name() ) {
		printf( esc_html__( 'Hi %s,', 'drywall-toolbox' ), esc_html( $order->get_billing_first_name() ) );
	} else {
		esc_html_e( 'Hi,', 'drywall-toolbox' );
	}
	?>
	</p>
	<p><?php esc_html_e( 'We\'ve received your order and it\'s on hold while we confirm payment. As soon as it clears, we\'ll begin preparing your order for shipment — no action is needed from you unless we reach out.', 'drywall-toolbox' ); ?></p>
	<?php
	echo function_exists( 'dtb_email_details_table_light' ) ? dtb_email_details_table_light(
		[
			[ 'label' => __( 'Order number', 'drywall-toolbox' ), 'value' => (string) $order->get_order_number() ],
			[ 'label' => __( 'Order total', 'drywall-toolbox' ), 'value' => wp_strip_all_tags( $order->get_formatted_order_total() ) ],
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
