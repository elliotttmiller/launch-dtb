<?php
/**
 * DTB branded customer invoice / order details email.
 *
 * Traced against WooCommerce core emails/customer-invoice.php v10.4.0.
 * DTB customization: hero (no progress tracker — this email covers both a
 * failed-payment retry and a pre-payment reference copy, an ambiguous state
 * a forward-progress tracker shouldn't claim); uses WooCommerce's own secure
 * $order->get_checkout_payment_url() for both the failed-payment and
 * payable-invoice cases. Hook sequence preserved.
 *
 * @package DrywalltoolboxCommerce
 */

use Automattic\WooCommerce\Enums\OrderStatus;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

do_action( 'woocommerce_email_header', $email_heading, $email );

echo function_exists( 'dtb_email_hero' ) ? dtb_email_hero( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	$email_heading,
	'',
	/* translators: %s: order number. */
	sprintf( __( 'Order #%s', 'drywall-toolbox' ), $order->get_order_number() )
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
	<?php if ( $order->needs_payment() ) : ?>
		<?php if ( $order->has_status( OrderStatus::FAILED ) ) : ?>
			<p><?php printf( esc_html__( 'Your last payment attempt on %s wasn\'t successful. Your order details are below — pay securely to complete your purchase.', 'drywall-toolbox' ), esc_html( get_bloginfo( 'name', 'display' ) ) ); ?></p>
		<?php else : ?>
			<p><?php printf( esc_html__( 'Here\'s an invoice for your order on %s. Pay securely using the link below whenever you\'re ready.', 'drywall-toolbox' ), esc_html( get_bloginfo( 'name', 'display' ) ) ); ?></p>
		<?php endif; ?>
		<?php echo function_exists( 'dtb_email_button' ) ? dtb_email_button( $order->get_checkout_payment_url(), __( 'Pay for this order', 'drywall-toolbox' ) ) : ''; ?>
	<?php else : ?>
		<p><?php printf( esc_html__( 'Here are the details of your order placed on %s:', 'drywall-toolbox' ), esc_html( wc_format_datetime( $order->get_date_created() ) ) ); ?></p>
	<?php endif; ?>
</div>

<?php
do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_order_meta', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

echo function_exists( 'dtb_email_support_card' ) ? dtb_email_support_card( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	__( 'Questions about this invoice? Our team is here to help.', 'drywall-toolbox' ),
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
