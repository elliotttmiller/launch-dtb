<?php
/**
 * DTB branded fulfillment (shipment) details table shown in emails.
 *
 * Traced against WooCommerce core emails/email-fulfillment-details.php
 * v10.7.0 (wp-content/plugins/woocommerce/templates/emails/email-fulfillment-details.php).
 * DTB customization: presentation only. woocommerce_email_before_fulfillment_table
 * / woocommerce_email_after_fulfillment_table preserved unchanged.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

if ( null === $fulfillment->get_date_deleted() ) {
	$tracking_number   = $fulfillment->get_tracking_number();
	$tracking_url      = $fulfillment->get_tracking_url();
	$shipment_provider = $fulfillment->get_shipment_provider();

	if ( ! $tracking_number && ! $tracking_url && ! $shipment_provider ) {
		echo '<p>' . esc_html__( 'Tracking information for this shipment isn\'t available yet.', 'drywall-toolbox' ) . '</p>';
	} else {
		$tracking_rows = [];
		if ( $shipment_provider ) {
			$tracking_rows[] = [ 'label' => __( 'Carrier', 'drywall-toolbox' ), 'value' => $shipment_provider ];
		}
		if ( $tracking_number ) {
			$tracking_rows[] = [ 'label' => __( 'Tracking number', 'drywall-toolbox' ), 'value' => $tracking_number ];
		}
		echo function_exists( 'dtb_email_details_table_light' ) ? dtb_email_details_table_light( $tracking_rows ) : '';
		if ( $tracking_url ) {
			echo function_exists( 'dtb_email_button' ) ? dtb_email_button( $tracking_url, __( 'Track this shipment', 'drywall-toolbox' ) ) : '<p><a class="link" href="' . esc_url( $tracking_url ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Track this shipment', 'drywall-toolbox' ) . '</a></p>';
		}
	}

	echo '<p>' . wp_kses_post(
		sprintf(
			/* translators: %s: Link to My Account > Orders page. */
			__( 'Full order and shipment details are always available from <a href="%s" target="_blank">My Account &gt; Orders</a>.', 'drywall-toolbox' ),
			esc_url( site_url( 'my-account/orders/' ) )
		)
	) . '</p>';
}

/**
 * Action hook to add custom content before fulfillment details in email.
 *
 * @param WC_Order    $order         Order object.
 * @param Fulfillment  $fulfillment   Fulfillment object.
 * @param bool         $sent_to_admin Whether it's sent to admin or customer.
 * @param bool         $plain_text    Whether it's a plain text email.
 * @param WC_Email     $email         Email object.
 */
do_action( 'woocommerce_email_before_fulfillment_table', $order, $fulfillment, $sent_to_admin, $plain_text, $email );
?>

<h2>
	<?php
	echo esc_html__( 'Shipment summary', 'drywall-toolbox' );
	$before = $sent_to_admin ? '<a class="link" href="' . esc_url( $order->get_edit_order_url() ) . '">' : '';
	$after  = $sent_to_admin ? '</a>' : '';
	/* translators: %s: Order ID. */
	$order_number_string = __( 'Order #%s', 'drywall-toolbox' );
	echo '<br><span style="font-size:13px;font-weight:500;">' . wp_kses_post( $before . sprintf( $order_number_string . $after . ' (<time datetime="%s">%s</time>)', $order->get_order_number(), $order->get_date_created()->format( 'c' ), wc_format_datetime( $order->get_date_created() ) ) ) . '</span>';
	?>
</h2>

<div style="margin-bottom:20px;">
	<table class="td font-family email-order-details" cellspacing="0" cellpadding="6" style="width:100%;" border="1" role="presentation">
		<tbody>
			<?php
			echo wc_get_email_fulfillment_items( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				$order,
				$fulfillment,
				[
					'show_sku'      => $sent_to_admin,
					'show_image'    => true,
					'image_size'    => [ 48, 48 ],
					'plain_text'    => $plain_text,
					'sent_to_admin' => $sent_to_admin,
				]
			);
			?>
		</tbody>
	</table>
</div>

<?php
/**
 * Action hook to add custom content after fulfillment details in email.
 *
 * @param WC_Order    $order         Order object.
 * @param Fulfillment  $fulfillment   Fulfillment object.
 * @param bool         $sent_to_admin Whether it's sent to admin or customer.
 * @param bool         $plain_text    Whether it's a plain text email.
 * @param WC_Email     $email         Email object.
 */
do_action( 'woocommerce_email_after_fulfillment_table', $order, $fulfillment, $sent_to_admin, $plain_text, $email );
?>
