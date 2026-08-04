<?php
/**
 * DTB branded customer refunded order email.
 *
 * Traced against WooCommerce core emails/customer-refunded-order.php
 * v10.4.0. DTB customization: hero + status badge (no progress tracker — a
 * refund isn't forward progress), distinguishing full vs. partial refunds
 * via WooCommerce's own $partial_refund flag — no independent refund-amount
 * computation (avoids the cumulative-total bug this redesign fixes). Hook
 * sequence preserved.
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
	<?php
	echo function_exists( 'dtb_email_status_badge' )
		? dtb_email_status_badge( $partial_refund ? __( 'Partial refund issued', 'drywall-toolbox' ) : __( 'Refund issued', 'drywall-toolbox' ), 'info' )
		: '';
	?>
	<p>
	<?php
	if ( $order->get_billing_first_name() ) {
		printf( esc_html__( 'Hi %s,', 'drywall-toolbox' ), esc_html( $order->get_billing_first_name() ) );
	} else {
		esc_html_e( 'Hi,', 'drywall-toolbox' );
	}
	?>
	</p>
	<?php if ( $partial_refund ) : ?>
		<p><?php printf( esc_html__( 'A partial refund has been issued for your order from %s. Only the refunded portion below applies — the rest of your order is unaffected.', 'drywall-toolbox' ), esc_html( $blogname ) ); ?></p>
	<?php else : ?>
		<p><?php printf( esc_html__( 'A refund has been issued for your order from %s.', 'drywall-toolbox' ), esc_html( $blogname ) ); ?></p>
	<?php endif; ?>
	<p><?php esc_html_e( 'Refunds are returned to your original payment method and typically appear within 5-10 business days, depending on your bank or card issuer.', 'drywall-toolbox' ); ?></p>
</div>

<?php
do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_order_meta', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

echo function_exists( 'dtb_email_support_card' ) ? dtb_email_support_card( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	__( 'Questions about this refund? Our team is here to help.', 'drywall-toolbox' ),
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
