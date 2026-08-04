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
 * is exactly one source of truth for step definitions. Base checkout assets
 * are registered in functions.php (dtb_enqueue_native_checkout_assets());
 * the desktop-only layout layer is enqueued here before wp_head() with an
 * explicit dependency on the base stylesheet. See
 * docs/checkout-ui-architecture.md for the full redesign contract.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

$storefront_home_url = home_url( '/' );
$desktop_style_path  = get_template_directory() . '/assets/checkout/checkout-desktop.css';
$desktop_style_ver   = file_exists( $desktop_style_path ) ? (string) filemtime( $desktop_style_path ) : DTB_VERSION;

wp_enqueue_style(
	'dtb-checkout-desktop',
	get_template_directory_uri() . '/assets/checkout/checkout-desktop.css',
	[ 'dtb-checkout' ],
	$desktop_style_ver
);
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="robots" content="noindex,nofollow,noarchive">
	<?php
	/*
	 * Critical-CSS guard for the branded top bar, inlined ahead of wp_head()
	 * so the logo/badge are never at the mercy of external stylesheet load
	 * timing. dtb-checkout (assets/checkout/checkout.css) owns the full,
	 * authoritative styling for this markup and matches these values exactly
	 * — this block only needs to hold until that stylesheet arrives. Without
	 * it, a slow/blocked/failed request for checkout.css leaves the <img>
	 * governed solely by its width="3000" height="917" attributes, which
	 * renders the logo at native (3000x917) size and breaks the entire page
	 * layout — reproducible on any slow mobile connection.
	 */
	?>
	<style>
		.dtb-checkout__topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;overflow:hidden}
		.dtb-checkout__brand{display:flex;align-items:center;flex:none;line-height:0;max-width:60vw}
		.dtb-checkout__brand img{height:clamp(30px,7vw,40px);width:auto;max-width:100%;display:block}
		.dtb-checkout__stripe-badge{display:inline-flex;align-items:center;gap:6px;flex:none}
		.dtb-checkout__stripe-badge img{height:18px;width:auto;display:block}
		@media (min-width:768px){.dtb-checkout__brand img{height:44px}.dtb-checkout__stripe-badge img{height:20px}}
	</style>
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
