<?php
/**
 * DTB branded customer reset password email.
 *
 * Traced against WooCommerce core emails/customer-reset-password.php
 * v10.9.0 (WooCommerce's native My Account "lost password" email — distinct
 * from the SPA's own /auth/reset-password flow in
 * dtb-platform/Auth/AuthRoutes.php, which is untouched). DTB customization:
 * hero (no progress tracker or support card — an account/security email
 * stays brief and single-CTA per docs/dtb-email-design-system.md's
 * copywriting voice guidance). Hook sequence preserved.
 *
 * @package DrywalltoolboxCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

do_action( 'woocommerce_email_header', $email_heading, $email );

echo function_exists( 'dtb_email_hero' ) ? dtb_email_hero( $email_heading ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
?>

<div class="email-introduction">
	<p><?php printf( esc_html__( 'Hi %s,', 'drywall-toolbox' ), esc_html( $user_display_name ) ); ?></p>
	<p><?php printf( esc_html__( 'Someone requested a password reset for the following account on %s:', 'drywall-toolbox' ), esc_html( $blogname ) ); ?></p>
	<p><?php echo wp_kses( sprintf( __( 'Username: <b>%s</b>', 'drywall-toolbox' ), esc_html( $user_login ) ), [ 'b' => [] ] ); ?></p>
	<p><?php esc_html_e( 'If you didn\'t request this, you can safely ignore this email — your password will not change unless you use the link below.', 'drywall-toolbox' ); ?></p>
	<?php
	$reset_url = add_query_arg(
		[
			'key'   => $reset_key,
			'id'    => $user_id,
			'login' => rawurlencode( $user_login ),
		],
		wc_get_endpoint_url( 'lost-password', '', wc_get_page_permalink( 'myaccount' ) )
	);
	echo function_exists( 'dtb_email_button' ) ? dtb_email_button( $reset_url, __( 'Reset your password', 'drywall-toolbox' ) ) : '';
	?>
</div>

<?php
if ( $additional_content ) {
	echo '<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr><td class="email-additional-content">';
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
	echo '</td></tr></table>';
}

do_action( 'woocommerce_email_footer', $email );
