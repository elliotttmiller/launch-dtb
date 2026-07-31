<?php
/**
 * DTB branded customer fulfillment updated email.
 *
 * Traced against WooCommerce core emails/customer-fulfillment-updated.php
 * v10.8.0 (native WooCommerce Fulfillments feature — fired by
 * WC_Email_Customer_Fulfillment_Updated::trigger() via the
 * woocommerce_fulfillment_updated_notification action; see
 * dtb-integrations/Veeqo/VeeqoFulfillmentProjector.php). DTB customization:
 * copy/visual redesign. Hook sequence preserved.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email ); ?>

<div class="email-introduction">
	<?php echo function_exists( 'dtb_email_status_badge' ) ? dtb_email_status_badge( __( 'Shipment updated', 'drywall-toolbox' ), 'info' ) : ''; ?>
	<p><?php esc_html_e( 'There\'s an update on your shipment — this may be new tracking information, a carrier update, or a change to what\'s included. Here\'s the latest:', 'drywall-toolbox' ); ?></p>
</div>

<?php
$customer_note_text = is_scalar( $customer_note ?? null ) ? trim( (string) $customer_note ) : '';
if ( '' !== $customer_note_text ) :
	echo function_exists( 'dtb_email_note_box' ) ? dtb_email_note_box( $customer_note_text ) : '<blockquote>' . esc_html( $customer_note_text ) . '</blockquote>';
endif;

do_action( 'woocommerce_email_fulfillment_details', $order, $fulfillment, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_fulfillment_meta', $order, $fulfillment, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

if ( $additional_content ) {
	echo '<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr><td class="email-additional-content">';
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
	echo '</td></tr></table>';
}

do_action( 'woocommerce_email_footer', $email );
