<?php
/**
 * Drywall Toolbox native WooCommerce Checkout Block document.
 *
 * WooCommerce owns the rendered checkout baseline and Payment Plugins for
 * Stripe WooCommerce owns its payment surfaces; nothing below reparents,
 * clones, or duplicates a native field, wallet, or order-submission control.
 * The only DTB-owned markup here is the branded top bar. The in-page step
 * wizard (progress rail + Back/Continue bar) is built entirely by
 * checkout.js as progressive enhancement over the native Woo Checkout
 * Block groups — no separate step markup lives in this template, so there
 * is exactly one source of truth for step definitions. Both are
 * registered in functions.php (dtb_enqueue_native_checkout_assets()). See
 * docs/checkout-ui-architecture.md for the full redesign contract.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

$storefront_home_url = home_url( '/' );
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
		<a class="dtb-checkout__brand" href="<?php echo esc_url( $storefront_home_url ); ?>">
			<img src="<?php echo esc_url( home_url( '/logo-white.svg' ) ); ?>" alt="<?php esc_attr_e( 'Drywall Toolbox', 'drywall-toolbox' ); ?>" width="3000" height="917">
		</a>
		<span class="dtb-checkout__stripe-badge">
			<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
				<path fill="currentColor" d="M8 0a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1V3a3 3 0 0 0-3-3Zm0 1.5A1.5 1.5 0 0 1 9.5 3v2h-3V3A1.5 1.5 0 0 1 8 1.5Z"/>
			</svg>
			<img src="<?php echo esc_url( home_url( '/logos/powered_by_stripe.svg' ) ); ?>" alt="<?php esc_attr_e( 'Powered by Stripe', 'drywall-toolbox' ); ?>">
		</span>
	</header>
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
