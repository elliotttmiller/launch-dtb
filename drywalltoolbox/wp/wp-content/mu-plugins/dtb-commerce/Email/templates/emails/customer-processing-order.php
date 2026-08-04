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
		[ 'label' => __( 'Payment received', 'drywall-toolbox' ), 'state' => 'done', 'icon' => 'payment' ],
		[ 'label' => __( 'Being prepared', 'drywall-toolbox' ), 'state' => 'active', 'icon' => 'package' ],
		[ 'label' => __( 'On the way soon', 'drywall-toolbox' ), 'state' => 'upcoming', 'icon' => 'truck' ],
	]
) : '';
?>

<?php
do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_order_meta', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

echo function_exists( 'dtb_email_next_steps_grid' ) ? dtb_email_next_steps_grid( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	[
		[ 'text' => __( 'We\'ll email you when your order ships.', 'drywall-toolbox' ), 'icon' => 'mail' ],
		[ 'text' => __( 'Carefully packed and built for the job.', 'drywall-toolbox' ), 'icon' => 'package' ],
		[ 'text' => __( 'Fast, reliable delivery straight to you.', 'drywall-toolbox' ), 'icon' => 'truck' ],
	]
) : '';

echo function_exists( 'dtb_email_support_card' ) ? dtb_email_support_card( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	__( 'Our team is here to help with any questions about your order.', 'drywall-toolbox' ),
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
