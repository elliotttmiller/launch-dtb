<?php
/**
 * Drywall Toolbox native WooCommerce Checkout Block document.
 *
 * WooCommerce owns the rendered checkout baseline and Payment Plugins for
 * Stripe WooCommerce owns its payment surfaces; nothing below reparents,
 * clones, or duplicates a native field, wallet, or order-submission control.
 * The only DTB-owned markup is the branded top bar and the visual step rail,
 * both presentation-only, styled and progressively enhanced by the
 * `dtb-checkout` stylesheet/script registered in functions.php
 * (dtb_enqueue_native_checkout_assets()). See
 * docs/checkout-ui-architecture.md for the full redesign contract.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="robots" content="noindex,nofollow,noarchive">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
	<header class="dtb-checkout__topbar">
		<span class="dtb-checkout__brand">
			<span aria-hidden="true">Dry<span class="dtb-checkout__brand-mark">Wall</span></span>
			<span class="screen-reader-text"><?php esc_html_e( 'Drywall Toolbox', 'drywall-toolbox' ); ?></span>
		</span>
		<span class="dtb-checkout__secure">
			<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
				<path fill="currentColor" d="M8 0a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1V3a3 3 0 0 0-3-3Zm0 1.5A1.5 1.5 0 0 1 9.5 3v2h-3V3A1.5 1.5 0 0 1 8 1.5Z"/>
			</svg>
			<?php esc_html_e( 'Secure checkout', 'drywall-toolbox' ); ?>
		</span>
		<span class="dtb-checkout__stripe-badge"><?php esc_html_e( 'Powered by Stripe', 'drywall-toolbox' ); ?></span>
	</header>
	<nav class="dtb-checkout__steps" aria-label="<?php esc_attr_e( 'Checkout progress', 'drywall-toolbox' ); ?>">
		<span class="dtb-checkout__step" data-state="active">
			<span class="dtb-checkout__step-dot" aria-hidden="true">1</span>
			<span class="dtb-checkout__step-label"><?php esc_html_e( 'Contact', 'drywall-toolbox' ); ?></span>
		</span>
		<span class="dtb-checkout__step" data-state="upcoming">
			<span class="dtb-checkout__step-dot" aria-hidden="true">2</span>
			<span class="dtb-checkout__step-label"><?php esc_html_e( 'Shipping', 'drywall-toolbox' ); ?></span>
		</span>
		<span class="dtb-checkout__step" data-state="upcoming">
			<span class="dtb-checkout__step-dot" aria-hidden="true">3</span>
			<span class="dtb-checkout__step-label"><?php esc_html_e( 'Payment', 'drywall-toolbox' ); ?></span>
		</span>
	</nav>
	<main id="primary" role="main">
		<?php
		if ( have_posts() ) {
			while ( have_posts() ) {
				the_post();
				the_content();
			}
		} else {
			status_header( 404 );
			echo '<div class="woocommerce-error" role="alert">' . esc_html__( 'Checkout is temporarily unavailable. Please return to your cart and try again.', 'drywall-toolbox' ) . '</div>';
		}
		?>
	</main>
<?php wp_footer(); ?>
</body>
</html>
