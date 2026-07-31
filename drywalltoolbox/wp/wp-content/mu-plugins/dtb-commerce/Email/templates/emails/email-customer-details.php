<?php
/**
 * DTB branded additional customer details shown in emails.
 *
 * Traced against WooCommerce core emails/email-customer-details.php v9.7.0
 * (wp-content/plugins/woocommerce/templates/emails/email-customer-details.php).
 * DTB customization: presentation only.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;
?>
<?php if ( ! empty( $fields ) ) : ?>
	<div class="font-family" style="margin-top:18px;">
		<h2><?php esc_html_e( 'Customer details', 'drywall-toolbox' ); ?></h2>
		<ul style="margin:0;padding:0 0 0 18px;">
			<?php foreach ( $fields as $field ) : ?>
				<li><strong><?php echo wp_kses_post( $field['label'] ); ?>:</strong> <span class="text"><?php echo wp_kses_post( $field['value'] ); ?></span></li>
			<?php endforeach; ?>
		</ul>
	</div>
<?php endif; ?>
