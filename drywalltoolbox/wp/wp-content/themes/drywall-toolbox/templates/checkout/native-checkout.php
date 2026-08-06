<?php
/**
 * Drywall Toolbox native WooCommerce Checkout Block document.
 *
 * WooCommerce owns the rendered checkout baseline and Payment Plugins for
 * Stripe WooCommerce owns its payment surfaces; nothing below reparents,
 * clones, or duplicates a native field, wallet, or order-submission control.
 * The only DTB-owned markup here is the branded top bar, a static decorative
 * breadcrumb, and a static decorative trust-signal footer — none of these
 * read from or write to checkout/cart/order state, they are presentation
 * only. The mobile-only single-open accordion (Contact / Shipping / Payment)
 * is built entirely by checkout.js as progressive enhancement over the
 * native Woo Checkout Block groups — no separate step markup lives in this
 * template, so there is exactly one source of truth for step definitions.
 * Base checkout assets
 * are registered in functions.php (dtb_enqueue_native_checkout_assets());
 * the desktop-only layout layer is enqueued here before wp_head() with an
 * explicit dependency on the base stylesheet. See
 * docs/checkout/checkout-ui-architecture.md for the full redesign contract.
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
	 * Checkout is a server-rendered document outside the React SPA's webpack
	 * build, so it has no access to the self-hosted @fontsource-variable
	 * Geist/Nunito files the storefront uses (see frontend/src/main.jsx).
	 * Google Fonts is the pragmatic source for this one page — same two
	 * families (Geist for headings, Nunito for body/UI) so the checkout
	 * experience reads as the same brand, not a separate, unstyled document.
	 */
	?>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link rel="preload" href="https://fonts.googleapis.com/css2?family=Geist:wght@500;600;650;700;800&family=Nunito:wght@400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
	<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@500;600;650;700;800&family=Nunito:wght@400;500;600;700&display=swap"></noscript>
	<?php
	/*
	 * The branded top bar's critical-CSS guard (logo/badge sizing) is
	 * enqueued as an inline style on the dtb-checkout handle in
	 * dtb_enqueue_native_checkout_assets() (functions.php) so it prints
	 * here via wp_head(), immediately alongside checkout.css's own <link>
	 * tag rather than waiting for that stylesheet's network request.
	 */
	wp_head();
	?>
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
	<nav class="dtb-checkout__breadcrumb" aria-label="Checkout progress">
		<a href="<?php echo esc_url( wc_get_cart_url() ); ?>">Cart</a>
		<span class="dtb-checkout__breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
		<span class="dtb-checkout__breadcrumb-current" aria-current="step">Checkout</span>
		<span class="dtb-checkout__breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
		<span>Order complete</span>
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
	<footer class="dtb-checkout__trust" aria-label="Purchase assurances">
		<div class="dtb-checkout__trust-item">
			<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M2 8h13v9H2zM15 11h4l3 3v3h-7zM6 20a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 6 20Zm12 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z"/></svg>
			<span><strong>Fast shipping</strong>On orders over $149</span>
		</div>
		<div class="dtb-checkout__trust-item">
			<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5"/></svg>
			<span><strong>Easy returns</strong>30-day return policy</span>
		</div>
		<div class="dtb-checkout__trust-item">
			<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M6 11V7a6 6 0 0 1 12 0v4M5 11h14v10H5z"/></svg>
			<span><strong>Secure checkout</strong>256-bit encryption</span>
		</div>
		<div class="dtb-checkout__trust-item">
			<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 14v-2a8 8 0 0 1 16 0v2M2 14h4v6H4a2 2 0 0 1-2-2Zm20 0h-4v6h2a2 2 0 0 0 2-2Z"/></svg>
			<span><strong>Expert support</strong>(320) 288-0432</span>
		</div>
	</footer>
<?php wp_footer(); ?>
</body>
</html>
