<?php
/**
 * DTB branded customer fulfillment created email.
 *
 * Traced against WooCommerce core emails/customer-fulfillment-created.php
 * v10.4.0 (native WooCommerce Fulfillments feature — fired by
 * WC_Email_Customer_Fulfillment_Created::trigger() via the
 * woocommerce_fulfillment_created_notification action; see
 * dtb-integrations/Veeqo/VeeqoFulfillmentProjector.php for how DTB projects
 * Veeqo shipment facts into the native Fulfillment record that triggers
 * this). DTB customization: copy/visual redesign. Hook sequence preserved
 * (woocommerce_email_fulfillment_details, woocommerce_email_fulfillment_meta,
 * woocommerce_email_customer_details all fire with identical arguments).
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email ); ?>

<div class="email-introduction">
	<?php echo function_exists( 'dtb_email_status_badge' ) ? dtb_email_status_badge( __( 'Shipped', 'drywall-toolbox' ), 'success' ) : ''; ?>
	<p><?php esc_html_e( 'Good news — part or all of your order is on its way. Use the tracking information below to follow your shipment.', 'drywall-toolbox' ); ?></p>
</div>

<?php
/**
 * @param WC_Order    $order         Order object.
 * @param Fulfillment  $fulfillment   Fulfillment object.
 * @param bool         $sent_to_admin Whether it's sent to admin or customer.
 * @param bool         $plain_text    Whether it's a plain text email.
 * @param WC_Email     $email         Email object.
 */
do_action( 'woocommerce_email_fulfillment_details', $order, $fulfillment, $sent_to_admin, $plain_text, $email );

/**
 * @param WC_Order    $order         Order object.
 * @param Fulfillment  $fulfillment   Fulfillment object.
 * @param bool         $sent_to_admin Whether it's sent to admin or customer.
 * @param bool         $plain_text    Whether it's a plain text email.
 * @param WC_Email     $email         Email object.
 */
do_action( 'woocommerce_email_fulfillment_meta', $order, $fulfillment, $sent_to_admin, $plain_text, $email );

do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

if ( $additional_content ) {
	echo '<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr><td class="email-additional-content">';
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
	echo '</td></tr></table>';
}

do_action( 'woocommerce_email_footer', $email );
