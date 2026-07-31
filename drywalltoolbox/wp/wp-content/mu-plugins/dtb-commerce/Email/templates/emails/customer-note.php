<?php
/**
 * DTB branded customer note email.
 *
 * Traced against WooCommerce core emails/customer-note.php v10.4.0. DTB
 * customization: copy/visual redesign. Hook sequence preserved.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email ); ?>

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
	<p><?php esc_html_e( 'A note has been added to your order:', 'drywall-toolbox' ); ?></p>
</div>

<?php
$safe_note = wc_wptexturize_order_note( $customer_note );
echo function_exists( 'dtb_email_note_box' ) ? dtb_email_note_box( wp_strip_all_tags( $safe_note ) ) : '<blockquote>' . wpautop( make_clickable( $safe_note ) ) . '</blockquote>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
?>

<p><?php esc_html_e( 'For reference, here are your order details:', 'drywall-toolbox' ); ?></p>

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
