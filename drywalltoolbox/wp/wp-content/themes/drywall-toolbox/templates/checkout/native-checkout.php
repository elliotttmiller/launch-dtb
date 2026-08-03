<?php
/**
 * Drywall Toolbox native WooCommerce Checkout Block document.
 *
 * This template owns only the document shell and branded checkout header.
 * The Checkout page content owns the WooCommerce Checkout Block. WooCommerce
 * owns fields, validation, Store API state, shipping, tax, totals and order
 * creation. Payment Plugins for Stripe owns Express Checkout, payment methods,
 * provider elements, authentication and payment execution.
 *
 * No checkout node is cloned, moved, hidden, reordered or replaced here.
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
<body <?php body_class( 'dtb-native-checkout' ); ?>>
<?php wp_body_open(); ?>
	<?php get_template_part( 'template-parts/checkout/header' ); ?>
	<main id="primary" class="dtb-checkout-shell" role="main">
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
