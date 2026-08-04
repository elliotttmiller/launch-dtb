<?php
/**
 * DTB branded customer on-hold order email.
 *
 * Traced against WooCommerce core emails/customer-on-hold-order.php v10.4.0.
 * DTB customization: hero + progress tracker (first stage shown as
 * "pending"/warning tone, not "done" — payment isn't confirmed yet, so the
 * step must not claim it is). Hook sequence preserved.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email );

echo function_exists( 'dtb_email_hero' ) ? dtb_email_hero( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	$email_heading,
	__( 'We\'ve received your order and it\'s on hold while we confirm payment. As soon as it clears, we\'ll begin preparing it for shipment.', 'drywall-toolbox' ),
	/* translators: %s: order number. */
	sprintf( __( 'Order #%s', 'drywall-toolbox' ), $order->get_order_number() )
) : '';

echo function_exists( 'dtb_email_progress_steps' ) ? dtb_email_progress_steps( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	[
		[ 'label' => __( 'Payment pending', 'drywall-toolbox' ), 'state' => 'warning' ],
		[ 'label' => __( 'Being prepared', 'drywall-toolbox' ), 'state' => 'upcoming' ],
		[ 'label' => __( 'Shipping update', 'drywall-toolbox' ), 'state' => 'upcoming' ],
	]
) : '';
?>

<div class="email-introduction">
	<p>
	<?php
	if ( $order->get_billing_first_name() ) {
		printf( esc_html__( 'Hi %s,', 'drywall-toolbox' ), esc_html( $order->get_billing_first_name() ) );
	} else {
		esc_html_e( 'Hi,', 'drywall-toolbox' );
	}
	?>
	</p>
	<p><?php esc_html_e( 'No action is needed from you unless we reach out.', 'drywall-toolbox' ); ?></p>
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

echo function_exists( 'dtb_email_support_card' ) ? dtb_email_support_card( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	__( 'Questions about your payment or order? Our team is here to help.', 'drywall-toolbox' ),
	function_exists( 'dtb_email_support_url' ) ? dtb_email_support_url() : home_url( '/contact/' ),
	__( 'Contact support', 'drywall-toolbox' ),
	'',
	__( 'Need help?', 'drywall-toolbox' )
) : '';

if ( $additional_content ) {
	echo '<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr><td class="email-additional-content">';
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
	echo '</td></tr></table>';
}

do_action( 'woocommerce_email_footer', $email );
