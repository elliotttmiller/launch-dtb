<?php
/**
 * DTB branded customer cancelled order email.
 *
 * Traced against WooCommerce core emails/customer-cancelled-order.php
 * v10.4.0. DTB customization: hero + status badge (no progress tracker — a
 * cancelled order isn't forward progress). Hook sequence preserved.
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
?>

<div class="email-introduction">
	<?php echo function_exists( 'dtb_email_status_badge' ) ? dtb_email_status_badge( __( 'Order cancelled', 'drywall-toolbox' ), 'neutral' ) : ''; ?>
	<p><?php printf( esc_html__( 'Your order #%1$s has been cancelled. If you were charged, no funds were captured, or a refund is already in progress — you\'ll receive a separate confirmation once it completes.', 'drywall-toolbox' ), esc_html( $order->get_order_number() ) ); ?></p>
	<p><?php esc_html_e( 'If this wasn\'t expected, reply to this email or contact support and we\'ll help sort it out.', 'drywall-toolbox' ); ?></p>
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
	__( 'Wasn\'t expecting this? Our team is here to help.', 'drywall-toolbox' ),
	function_exists( 'dtb_email_support_url' ) ? dtb_email_support_url() : home_url( '/contact/' ),
	__( 'Contact support', 'drywall-toolbox' ),
	'&#127911;',
	__( 'Need help?', 'drywall-toolbox' )
) : '';

if ( $additional_content ) {
	echo '<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr><td class="email-additional-content">';
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
	echo '</td></tr></table>';
}

do_action( 'woocommerce_email_footer', $email );
