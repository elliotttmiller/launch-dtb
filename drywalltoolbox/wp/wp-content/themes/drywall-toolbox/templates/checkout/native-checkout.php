<?php
/**
 * Drywall Toolbox native WooCommerce Checkout Block document.
 *
 * This intentionally neutral shell loads no DTB checkout stylesheet,
 * presentation controller, inline design rule, loader, header, or field proxy.
 * WooCommerce owns the rendered checkout baseline and Payment Plugins for Stripe
 * WooCommerce owns its payment surfaces. A future redesign must begin from this
 * single unstyled boundary instead of reviving the removed cascade.
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
