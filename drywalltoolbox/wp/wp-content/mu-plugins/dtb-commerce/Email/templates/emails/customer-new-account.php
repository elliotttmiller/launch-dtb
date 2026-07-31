<?php
/**
 * DTB branded customer new account email.
 *
 * Traced against WooCommerce core emails/customer-new-account.php v10.9.0
 * (this is WooCommerce's native My Account registration email — distinct
 * from the SPA's own /auth/forgot-password flow in
 * dtb-platform/Auth/AuthRoutes.php, which is untouched). DTB customization:
 * copy/visual redesign. Hook sequence preserved.
 *
 * @package DrywalltoolboxCommerce
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email ); ?>

<div class="email-introduction">
	<p><?php printf( esc_html__( 'Hi %s,', 'drywall-toolbox' ), esc_html( $user_display_name ) ); ?></p>
	<p><?php printf( esc_html__( 'Your account on %s is ready. Use it to track orders, save addresses, and see your order history.', 'drywall-toolbox' ), esc_html( $blogname ) ); ?></p>
	<p><?php echo wp_kses( sprintf( __( 'Username: <b>%s</b>', 'drywall-toolbox' ), esc_html( $user_login ) ), [ 'b' => [] ] ); ?></p>
	<?php if ( $password_generated && $set_password_url ) : ?>
		<?php echo function_exists( 'dtb_email_button' ) ? dtb_email_button( $set_password_url, __( 'Set your password', 'drywall-toolbox' ) ) : ''; ?>
	<?php else : ?>
		<?php echo function_exists( 'dtb_email_button' ) ? dtb_email_button( wc_get_page_permalink( 'myaccount' ), __( 'Go to my account', 'drywall-toolbox' ) ) : ''; ?>
	<?php endif; ?>
</div>

<?php
if ( $additional_content ) {
	echo '<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr><td class="email-additional-content">';
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
	echo '</td></tr></table>';
}

do_action( 'woocommerce_email_footer', $email );
