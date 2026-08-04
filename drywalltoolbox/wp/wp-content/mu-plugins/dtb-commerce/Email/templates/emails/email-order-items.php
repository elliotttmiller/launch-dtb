<?php
/**
 * DTB branded email order item rows.
 *
 * Traced against WooCommerce core emails/email-order-items.php v10.8.0
 * (wp-content/plugins/woocommerce/templates/emails/email-order-items.php).
 * DTB customization: presentation only. Every order-item filter
 * (woocommerce_order_item_visible, woocommerce_order_item_class,
 * woocommerce_order_item_thumbnail, woocommerce_order_item_name,
 * woocommerce_order_item_meta_start/end, woocommerce_email_order_item_quantity)
 * fires with the exact same name/argument order as upstream, satisfying
 * "preserve order-item filters."
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

foreach ( $items as $item_id => $item ) :
	$product       = $item->get_product();
	$sku           = '';
	$purchase_note = '';

	/**
	 * Email Order Item Visibility hook.
	 *
	 * @param bool                  $visible Whether the item is visible in the email.
	 * @param WC_Order_Item_Product $item    The order item object.
	 */
	if ( ! apply_filters( 'woocommerce_order_item_visible', true, $item ) ) {
		continue;
	}

	if ( is_object( $product ) ) {
		$sku           = $product->get_sku();
		$purchase_note = $product->get_purchase_note();
	}

	$order_item_class = apply_filters( 'woocommerce_order_item_class', 'order_item', $item, $order );
	?>
	<tr class="<?php echo esc_attr( $order_item_class ); ?>">
		<td class="td font-family text-align-left" style="vertical-align:middle;word-wrap:break-word;">
			<table class="order-item-data" role="presentation" width="100%">
				<tr>
					<?php if ( $show_image ) : ?>
						<td width="136" valign="middle" style="padding:0 16px 0 0;">
							<?php
							$thumbnail = function_exists( 'dtb_email_render_item_thumbnail' ) ? dtb_email_render_item_thumbnail( $item ) : '';
							/**
							 * Email Order Item Thumbnail hook.
							 *
							 * @param string                $image The image HTML.
							 * @param WC_Order_Item_Product $item  The item being displayed.
							 */
							echo wp_kses_post( apply_filters( 'woocommerce_order_item_thumbnail', $thumbnail, $item ) );
							?>
						</td>
					<?php endif; ?>
					<td valign="middle">
						<?php
						$item_name = function_exists( 'dtb_email_render_item_name' ) ? dtb_email_render_item_name( $item->get_name() ) : esc_html( $item->get_name() );
						/**
						 * Order Item Name hook.
						 *
						 * @param string                $item_name The item name HTML.
						 * @param WC_Order_Item_Product $item      The item being displayed.
						 */
						echo wp_kses_post( apply_filters( 'woocommerce_order_item_name', $item_name, $item, false ) );

						if ( $show_sku && $sku ) {
							echo wp_kses_post( ' <span style="color:#94a3b8;">(#' . $sku . ')</span>' );
						}

						/**
						 * Allow other plugins to add additional product information.
						 *
						 * @param int                   $item_id    The item ID.
						 * @param WC_Order_Item_Product $item       The item object.
						 * @param WC_Order              $order      The order object.
						 * @param bool                  $plain_text Whether the email is plain text or not.
						 */
						do_action( 'woocommerce_order_item_meta_start', $item_id, $item, $order, $plain_text );

						$item_meta = wc_display_item_meta(
							$item,
							[
								'before'       => '',
								'after'        => '',
								'separator'    => '<br>',
								'echo'         => false,
								'label_before' => '<span>',
								'label_after'  => ':</span> ',
							]
						);
						echo '<div class="email-order-item-meta" style="color:#94a3b8;font-size:13px;line-height:140%;">';
						echo wp_kses(
							$item_meta,
							[
								'br'   => [],
								'span' => [],
								'a'    => [
									'href'   => true,
									'target' => true,
									'rel'    => true,
									'title'  => true,
								],
							]
						);
						echo '</div>';

						/**
						 * Allow other plugins to add additional product information.
						 *
						 * @param int                   $item_id    The item ID.
						 * @param WC_Order_Item_Product $item       The item object.
						 * @param WC_Order              $order      The order object.
						 * @param bool                  $plain_text Whether the email is plain text or not.
						 */
						do_action( 'woocommerce_order_item_meta_end', $item_id, $item, $order, $plain_text );
						?>
					</td>
				</tr>
			</table>
		</td>
		<td class="td font-family text-align-right" style="vertical-align:middle;">
			<?php
			$qty_display = esc_html( $item->get_quantity() );
			/**
			 * Email Order Item Quantity hook.
			 */
			$quantity = apply_filters( 'woocommerce_email_order_item_quantity', $qty_display, $item );
				if ( '' !== $quantity ) {
					echo '<span style="white-space:nowrap;">Qty: ' . wp_kses_post( $quantity ) . '</span>';
			}
			?>
		</td>
		<td class="td font-family text-align-right" style="vertical-align:middle;">
			<?php echo wp_kses_post( $order->get_formatted_line_subtotal( $item ) ); ?>
		</td>
	</tr>
	<?php if ( $show_purchase_note && $purchase_note ) : ?>
		<tr>
			<td colspan="3" class="font-family text-align-left" style="vertical-align:middle;">
				<?php echo wp_kses_post( wpautop( do_shortcode( $purchase_note ) ) ); ?>
			</td>
		</tr>
	<?php endif; ?>
<?php endforeach; ?>
