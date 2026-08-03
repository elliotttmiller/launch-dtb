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
 * this). DTB customization: hero + progress tracker whose final stage
 * ("On the way") is marked active here specifically because this email only
 * ever fires from real, authoritative Veeqo shipment data (unlike
 * customer-completed-order.php, which must not make the same claim). Hook
 * sequence preserved (woocommerce_email_fulfillment_details,
 * woocommerce_email_fulfillment_meta, woocommerce_email_customer_details all
 * fire with identical arguments).
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email );

echo function_exists( 'dtb_email_hero' ) ? dtb_email_hero( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	$email_heading,
	__( 'Good news — part or all of your order is on its way. Use the tracking information below to follow your shipment.', 'drywall-toolbox' ),
	/* translators: %s: order number. */
	sprintf( __( 'Order #%s', 'drywall-toolbox' ), $order->get_order_number() )
) : '';

echo function_exists( 'dtb_email_progress_steps' ) ? dtb_email_progress_steps( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	[
		[ 'label' => __( 'Payment received', 'drywall-toolbox' ), 'state' => 'done', 'icon' => '&#128179;' ],
		[ 'label' => __( 'Prepared', 'drywall-toolbox' ), 'state' => 'done', 'icon' => '&#128230;' ],
		[ 'label' => __( 'On the way', 'drywall-toolbox' ), 'state' => 'active', 'icon' => '&#128666;' ],
	]
) : '';

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
