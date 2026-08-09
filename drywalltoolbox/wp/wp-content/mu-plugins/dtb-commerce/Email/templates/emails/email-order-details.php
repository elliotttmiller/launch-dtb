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

use Automattic\WooCommerce\Utilities\FeaturesUtil;

defined( 'ABSPATH' ) || exit;

$email_improvements_enabled = FeaturesUtil::feature_is_enabled( 'email_improvements' );

/** Preserve WooCommerce's section-divider extension point. */
$display_section_divider = (bool) apply_filters( 'woocommerce_email_body_display_section_divider', true );

if ( $email_improvements_enabled ) {
	add_filter( 'woocommerce_order_shipping_to_display_shipped_via', '__return_false' );
}

/**
 * Action hook to add custom content before order details in email.
 *
 * @param WC_Order $order Order object.
 * @param bool     $sent_to_admin Whether it's sent to admin or customer.
 * @param bool     $plain_text Whether it's a plain text email.
 * @param WC_Email $email Email object.
 */
do_action( 'woocommerce_email_before_order_table', $order, $sent_to_admin, $plain_text, $email );

/** Preserve WooCommerce's configurable order-summary heading. */
$order_details_heading = $email_improvements_enabled
	? apply_filters( 'woocommerce_email_order_details_heading', __( 'Order summary', 'woocommerce' ), $order, $email )
	: __( 'Order details', 'woocommerce' );

/**
 * Preserve WooCommerce's order-number visibility extension point. The DTB
 * composition places the order number in the lifecycle hero, so the summary
 * card intentionally reserves its compact meta position for the order date.
 */
$display_order_number = (bool) apply_filters( 'woocommerce_email_display_order_number', true, $order, $email );
unset( $display_order_number );

$order_number_meta = $order->get_date_created() ? $order->get_date_created()->date_i18n( 'F j, Y' ) : '';

echo function_exists( 'dtb_email_card_open' )
	? dtb_email_card_open( wp_strip_all_tags( (string) $order_details_heading ), $order_number_meta ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	: '<div style="margin-bottom:20px;">';
?>

<table class="td font-family email-order-details" cellspacing="0" cellpadding="0" style="width:100%;" border="0" role="presentation">
	<thead>
		<tr class="dtb-order-column-headings">
			<th class="td text-align-left" scope="col"><?php esc_html_e( 'Item', 'drywall-toolbox' ); ?></th>
			<th class="td text-align-right" scope="col"><?php esc_html_e( 'Qty', 'drywall-toolbox' ); ?></th>
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
				'image_size'    => [ 72, 72 ],
				'plain_text'    => $plain_text,
				'sent_to_admin' => $sent_to_admin,
			]
		);
		?>
	</tbody>
</table>
<?php if ( $display_section_divider ) : ?>
	<hr class="hr" style="margin:6px 0 12px;">
<?php endif; ?>
<table class="td font-family email-order-details email-order-totals" cellspacing="0" cellpadding="0" style="width:100%;" border="0" role="presentation">
	<?php
	$item_totals = $order->get_order_item_totals();
	foreach ( $item_totals as $total ) {
		$total_type     = sanitize_html_class( (string) ( $total['type'] ?? 'unknown' ) );
		$is_grand_total = 'total' === $total_type;
		$total_label    = (string) ( $total['label'] ?? '' );
		$total_value    = (string) ( $total['value'] ?? '' );

		// WooCommerce can place the selected shipping method in both the row
		// label and value. Collapse only that duplicated presentation; rates,
		// totals and the selected method remain entirely WooCommerce-owned.
		if ( 'shipping' === $total_type ) {
			$label_text = trim( wp_strip_all_tags( html_entity_decode( $total_label ) ), " \t\n\r\0\x0B:" );
			$value_text = trim( wp_strip_all_tags( html_entity_decode( $total_value ) ) );
			if ( '' !== $value_text && false !== stripos( $label_text, $value_text ) ) {
				$total_label = __( 'Shipping:', 'drywall-toolbox' );
			}
		}
		?>
		<tr class="order-totals order-totals-<?php echo esc_attr( $total_type ); ?><?php echo $is_grand_total ? ' order-totals-total' : ''; ?>">
			<th class="td text-align-left" scope="row" colspan="2"><?php echo wp_kses_post( $total_label ); ?> <?php echo isset( $total['meta'] ) ? wp_kses_post( $total['meta'] ) : ''; ?></th>
			<td class="td text-align-right"><?php echo wp_kses_post( $total_value ); ?></td>
		</tr>
		<?php
	}
	?>
</table>
<?php if ( $order->get_customer_note() ) : ?>
	<hr class="hr" style="margin:18px 0;">
	<table class="td font-family email-order-details" cellspacing="0" cellpadding="6" style="width:100%;" border="0" role="presentation">
		<tr class="order-customer-note">
			<td class="td text-align-left">
				<b><?php esc_html_e( 'Order note', 'drywall-toolbox' ); ?></b><br>
				<?php echo wp_kses( nl2br( wc_wptexturize_order_note( $order->get_customer_note() ) ), [ 'br' => [] ] ); ?>
			</td>
		</tr>
	</table>
<?php endif; ?>

<?php
if ( $email_improvements_enabled ) {
	remove_filter( 'woocommerce_order_shipping_to_display_shipped_via', '__return_false' );
}

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
