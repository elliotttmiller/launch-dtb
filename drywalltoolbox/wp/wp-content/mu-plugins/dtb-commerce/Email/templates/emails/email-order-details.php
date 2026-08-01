<?php
/**
 * DTB branded order details table shown in emails.
 *
 * Traced against WooCommerce core emails/email-order-details.php v10.8.0
 * (wp-content/plugins/woocommerce/templates/emails/email-order-details.php).
 * DTB customization: presentation only. woocommerce_email_before_order_table
 * and woocommerce_email_after_order_table fire with the exact same
 * arguments as upstream — dtb-order-tracking-links.php's "Track your order"
 * button hooks the latter and depends on this being unchanged; it now
 * renders visually inside this file's card (the card's closing tag moved to
 * after that hook fires, not before it, purely a markup-nesting change).
 * `show_sku` is now `true` unconditionally (was `$sent_to_admin`-gated) so
 * customers see SKU under each item name too, not just operators — a
 * content addition, not a hook/filter change.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

/**
 * Action hook to add custom content before order details in email.
 *
 * @param WC_Order $order Order object.
 * @param bool     $sent_to_admin Whether it's sent to admin or customer.
 * @param bool     $plain_text Whether it's a plain text email.
 * @param WC_Email $email Email object.
 */
do_action( 'woocommerce_email_before_order_table', $order, $sent_to_admin, $plain_text, $email );

$order_number_meta = $order->get_date_created()
	/* translators: %1$s: order number, %2$s: formatted order date. */
	? sprintf( __( 'Order #%1$s - %2$s', 'drywall-toolbox' ), $order->get_order_number(), wc_format_datetime( $order->get_date_created() ) )
	/* translators: %s: order number. */
	: sprintf( __( 'Order #%s', 'drywall-toolbox' ), $order->get_order_number() );

echo function_exists( 'dtb_email_card_open' )
	? dtb_email_card_open( __( 'Order summary', 'drywall-toolbox' ), $order_number_meta ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	: '<div style="margin-bottom:20px;">';
?>

<table class="td font-family email-order-details" cellspacing="0" cellpadding="6" style="width:100%;" border="1" role="presentation">
	<thead>
		<tr>
			<th class="td text-align-left" scope="col"><?php esc_html_e( 'Product', 'drywall-toolbox' ); ?></th>
			<th class="td text-align-right" scope="col"><?php esc_html_e( 'Quantity', 'drywall-toolbox' ); ?></th>
			<th class="td text-align-right" scope="col"><?php esc_html_e( 'Price', 'drywall-toolbox' ); ?></th>
		</tr>
	</thead>
	<tbody>
		<?php
		echo wc_get_email_order_items( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			$order,
			[
				'show_sku'      => true,
				'show_image'    => true,
				'image_size'    => [ 48, 48 ],
				'plain_text'    => $plain_text,
				'sent_to_admin' => $sent_to_admin,
			]
		);
		?>
	</tbody>
</table>
<hr class="hr" style="margin:18px 0;">
<table class="td font-family email-order-details" cellspacing="0" cellpadding="6" style="width:100%;" border="1" role="presentation">
	<?php
	$item_totals = $order->get_order_item_totals();
	foreach ( $item_totals as $total ) {
		$is_grand_total = 'payment_method' !== ( $total['type'] ?? '' ) && false !== stripos( (string) $total['label'], 'total' ) && ! str_contains( (string) $total['label'], 'Subtotal' );
		?>
		<tr class="order-totals order-totals-<?php echo esc_attr( $total['type'] ?? 'unknown' ); ?><?php echo $is_grand_total ? ' order-totals-total' : ''; ?>">
			<th class="td text-align-left" scope="row" colspan="2"><?php echo wp_kses_post( $total['label'] ); ?></th>
			<td class="td text-align-right"><?php echo wp_kses_post( $total['value'] ); ?></td>
		</tr>
		<?php
	}
	?>
</table>
<?php if ( $order->get_customer_note() ) : ?>
	<hr class="hr" style="margin:18px 0;">
	<table class="td font-family email-order-details" cellspacing="0" cellpadding="6" style="width:100%;" border="1" role="presentation">
		<tr class="order-customer-note">
			<td class="td text-align-left">
				<b><?php esc_html_e( 'Order note', 'drywall-toolbox' ); ?></b><br>
				<?php echo wp_kses( nl2br( wc_wptexturize_order_note( $order->get_customer_note() ) ), [ 'br' => [] ] ); ?>
			</td>
		</tr>
	</table>
<?php endif; ?>

<?php
/**
 * Action hook to add custom content after order details in email. This is
 * where dtb-order-tracking-links.php's "Track your order" button (and
 * secondary "View order details" link) render — deliberately still inside
 * this card, not after it closes.
 *
 * @param WC_Order $order Order object.
 * @param bool     $sent_to_admin Whether it's sent to admin or customer.
 * @param bool     $plain_text Whether it's a plain text email.
 * @param WC_Email $email Email object.
 */
do_action( 'woocommerce_email_after_order_table', $order, $sent_to_admin, $plain_text, $email );

echo function_exists( 'dtb_email_card_close' ) ? dtb_email_card_close() : '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
?>
