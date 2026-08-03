<?php
/**
 * DTB branded customer processing order email.
 *
 * Traced against WooCommerce core emails/customer-processing-order.php
 * v10.4.0 (wp-content/plugins/woocommerce/templates/emails/customer-processing-order.php).
 * DTB customization: full copy/visual redesign — hero (order-number eyebrow
 * + heading + subheading, in the white body, not the dark header band),
 * 3-stage progress tracker, card-wrapped order summary and addresses (see
 * email-order-details.php / email-addresses.php), and a support card. Hook
 * sequence (order_details/order_meta/customer_details/footer) preserved
 * unchanged.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email );

echo function_exists( 'dtb_email_hero' ) ? dtb_email_hero( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	$email_heading,
	__( 'Your payment has been confirmed and we\'re getting your tools ready for shipment. We\'ll notify you as soon as they\'re on the way.', 'drywall-toolbox' ),
	/* translators: %s: order number. */
	sprintf( __( 'Order #%s', 'drywall-toolbox' ), $order->get_order_number() )
) : '';

echo function_exists( 'dtb_email_progress_steps' ) ? dtb_email_progress_steps( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	[
		[ 'label' => __( 'Payment received', 'drywall-toolbox' ), 'state' => 'done', 'icon' => '&#128179;' ],
		[ 'label' => __( 'Being prepared', 'drywall-toolbox' ), 'state' => 'active', 'icon' => '&#128230;' ],
		[ 'label' => __( 'On the way soon', 'drywall-toolbox' ), 'state' => 'upcoming', 'icon' => '&#128666;' ],
	]
) : '';
?>

<div class="email-introduction">
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
	<?php
	echo function_exists( 'dtb_email_details_table_light' ) ? dtb_email_details_table_light(
		[
			[ 'label' => __( 'Order number', 'drywall-toolbox' ), 'value' => (string) $order->get_order_number() ],
			[ 'label' => __( 'Order date', 'drywall-toolbox' ), 'value' => $order->get_date_created() ? $order->get_date_created()->date_i18n( 'F j, Y' ) : '' ],
			[ 'label' => __( 'Order total', 'drywall-toolbox' ), 'value' => wp_strip_all_tags( $order->get_formatted_order_total() ) ],
		]
	) : '';
	?>
</div>

<?php
do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_order_meta', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

echo function_exists( 'dtb_email_next_steps_grid' ) ? dtb_email_next_steps_grid( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	[
		[ 'text' => __( 'We prepare and pack your order', 'drywall-toolbox' ), 'icon' => '&#9993;' ],
		[ 'text' => __( 'You\'ll get a shipping confirmation with tracking once it leaves our warehouse', 'drywall-toolbox' ), 'icon' => '&#128230;' ],
		[ 'text' => __( 'Questions? Reply to this email or contact support', 'drywall-toolbox' ), 'icon' => '&#128666;' ],
	]
) : '';

echo function_exists( 'dtb_email_support_card' ) ? dtb_email_support_card( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	__( 'Our team is here to help with any questions about your order.', 'drywall-toolbox' ),
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
