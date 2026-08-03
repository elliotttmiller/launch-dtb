<?php
/**
 * DTB branded customer fulfillment updated email.
 *
 * Traced against WooCommerce core emails/customer-fulfillment-updated.php
 * v10.8.0 (native WooCommerce Fulfillments feature — fired by
 * WC_Email_Customer_Fulfillment_Updated::trigger() via the
 * woocommerce_fulfillment_updated_notification action; see
 * dtb-integrations/Veeqo/VeeqoFulfillmentProjector.php). DTB customization:
 * hero; merchant note now uses dtb_email_note_box_light() instead of
 * dtb_email_note_box() — the latter is hardcoded to dark-theme colors (built
 * for the separate dtb_render_branded_email() dark shell) and previously
 * rendered as a stray dark box inside this light-themed email. Hook
 * signatures — including the $fulfillment argument on
 * woocommerce_email_fulfillment_meta — preserved unchanged from
 * WooCommerce core, matching the sibling customer-fulfillment-created.php
 * template.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email );

echo function_exists( 'dtb_email_hero' ) ? dtb_email_hero( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	$email_heading,
	__( 'There\'s an update on your shipment — this may be new tracking information, a carrier update, or a change to what\'s included.', 'drywall-toolbox' ),
	/* translators: %s: order number. */
	sprintf( __( 'Order #%s', 'drywall-toolbox' ), $order->get_order_number() )
) : '';
?>

<div class="email-introduction">
	<?php echo function_exists( 'dtb_email_status_badge' ) ? dtb_email_status_badge( __( 'Shipment updated', 'drywall-toolbox' ), 'info' ) : ''; ?>
	<p><?php esc_html_e( 'Here\'s the latest:', 'drywall-toolbox' ); ?></p>
</div>

<?php
$customer_note_text = is_scalar( $customer_note ?? null ) ? trim( (string) $customer_note ) : '';
if ( '' !== $customer_note_text ) :
	echo function_exists( 'dtb_email_note_box_light' ) ? dtb_email_note_box_light( $customer_note_text ) : '<blockquote>' . esc_html( $customer_note_text ) . '</blockquote>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
endif;

do_action( 'woocommerce_email_fulfillment_details', $order, $fulfillment, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_fulfillment_meta', $order, $fulfillment, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

echo function_exists( 'dtb_email_support_card' ) ? dtb_email_support_card( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	__( 'Questions about your shipment? Our team is here to help.', 'drywall-toolbox' ),
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
