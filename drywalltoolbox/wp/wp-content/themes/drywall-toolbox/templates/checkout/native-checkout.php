<?php
/**
 * Drywall Toolbox native WooCommerce Checkout Block document.
 *
 * The active theme owns checkout document structure and presentation assets.
 * WooCommerce remains authoritative for checkout fields, cart/session state,
 * validation, shipping, tax, totals, order creation, and submission. The official
 * WooCommerce Stripe gateway remains authoritative for payment UI, wallets,
 * tokenization, authentication, and payment execution.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

$storefront_base_path = function_exists( 'dtb_detect_storefront_base_path' )
	? dtb_detect_storefront_base_path()
	: '';
$storefront_home_url = home_url( $storefront_base_path . '/' );
$theme_dir            = get_template_directory();
$theme_uri            = get_template_directory_uri();
$asset_version        = static function ( string $relative_path ) use ( $theme_dir ): string {
	$path = $theme_dir . '/' . ltrim( $relative_path, '/' );
	return is_readable( $path ) ? (string) filemtime( $path ) : DTB_VERSION;
};

/*
 * Theme presentation is intentionally one ordered stack: base design -> wrapper
 * refinements -> responsive flow -> narrow live-context/touch layer -> canonical
 * mobile contact identity presentation -> mechanical boot/UI/login handoff. No
 * theme asset creates/replaces payment controls or owns checkout submit/business
 * persistence.
 */
wp_enqueue_style(
	'dtb-checkout-theme',
	$theme_uri . '/assets/checkout/checkout.css',
	[],
	$asset_version( 'assets/checkout/checkout.css' )
);
wp_enqueue_style(
	'dtb-checkout-theme-refinements',
	$theme_uri . '/assets/checkout/checkout-refinements.css',
	[ 'dtb-checkout-theme' ],
	$asset_version( 'assets/checkout/checkout-refinements.css' )
);
wp_enqueue_style(
	'dtb-checkout-theme-flow',
	$theme_uri . '/assets/checkout/checkout-flow.css',
	[ 'dtb-checkout-theme-refinements' ],
	$asset_version( 'assets/checkout/checkout-flow.css' )
);
wp_enqueue_style(
	'dtb-checkout-theme-runtime-context',
	$theme_uri . '/assets/checkout/checkout-runtime-context.css',
	[ 'dtb-checkout-theme-flow' ],
	$asset_version( 'assets/checkout/checkout-runtime-context.css' )
);
wp_enqueue_style(
	'dtb-checkout-theme-contact-identity',
	$theme_uri . '/assets/checkout/checkout-contact-identity.css',
	[ 'dtb-checkout-theme-runtime-context' ],
	$asset_version( 'assets/checkout/checkout-contact-identity.css' )
);

wp_enqueue_script(
	'dtb-checkout-theme-boot',
	$theme_uri . '/assets/checkout/checkout-boot.js',
	[],
	$asset_version( 'assets/checkout/checkout-boot.js' ),
	true
);
wp_enqueue_script(
	'dtb-checkout-theme-ui',
	$theme_uri . '/assets/checkout/checkout-ui.js',
	[ 'dtb-checkout-theme-boot', 'wp-data', 'wc-blocks-data-store' ],
	$asset_version( 'assets/checkout/checkout-ui.js' ),
	true
);
wp_enqueue_script(
	'dtb-checkout-theme-contact-identity',
	$theme_uri . '/assets/checkout/checkout-contact-identity.js',
	[ 'dtb-checkout-theme-ui', 'wp-data', 'wc-blocks-data-store' ],
	$asset_version( 'assets/checkout/checkout-contact-identity.js' ),
	true
);
wp_enqueue_script(
	'dtb-checkout-theme-login-handoff',
	$theme_uri . '/assets/checkout/checkout-login-handoff.js',
	[ 'dtb-checkout-theme-ui' ],
	$asset_version( 'assets/checkout/checkout-login-handoff.js' ),
	true
);
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
	<meta name="robots" content="noindex,nofollow">
	<script>document.documentElement.classList.add('dtb-native-checkout-booting');window.setTimeout(function(){document.documentElement.classList.remove('dtb-native-checkout-booting');},8000);</script>
	<style>
		.dtb-native-checkout-loader{position:fixed;z-index:2147483000;inset:0;display:none;min-height:100vh;background:#f8fafc;color:#0f172a;align-items:center;justify-content:center;opacity:1;transition:opacity 260ms cubic-bezier(.4,0,.2,1)}
		html.dtb-native-checkout-booting .dtb-native-checkout-loader{display:flex}html.dtb-native-checkout-ready .dtb-native-checkout-loader{opacity:0;pointer-events:none}html.dtb-native-checkout-booting .dtb-native-woocommerce-document{overflow:hidden}html.dtb-native-checkout-booting .dtb-checkout-header,html.dtb-native-checkout-booting .dtb-native-woocommerce-main{opacity:0}.dtb-native-checkout-loader__content{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}.dtb-secure-checkout-spinner{display:block;width:3.25em;height:3.25em;transform-origin:center;animation:dtb-secure-checkout-rotate 2s linear infinite}.dtb-secure-checkout-spinner__circle{fill:none;stroke:hsl(214,97%,59%);stroke-width:2;stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dtb-secure-checkout-dash 1.5s ease-in-out infinite}.dtb-native-checkout-loader__content p{margin:0;color:#475569;font:650 14px/1.5 system-ui,sans-serif}@keyframes dtb-secure-checkout-rotate{100%{transform:rotate(360deg)}}@keyframes dtb-secure-checkout-dash{0%{stroke-dasharray:1,200;stroke-dashoffset:0}50%{stroke-dasharray:90,200;stroke-dashoffset:-35px}100%{stroke-dashoffset:-125px}}@media (prefers-reduced-motion:reduce){.dtb-native-checkout-loader{transition-duration:1ms}.dtb-secure-checkout-spinner,.dtb-secure-checkout-spinner__circle{animation:none}.dtb-secure-checkout-spinner__circle{stroke-dasharray:90,200;stroke-dashoffset:-35px}}
	</style>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'dtb-native-woocommerce-document dtb-woo-native-checkout dtb-official-stripe-checkout dtb-checkout-native-page' ); ?>>
<?php wp_body_open(); ?>
	<div class="dtb-native-checkout-loader" role="status" aria-live="polite">
		<div class="dtb-native-checkout-loader__content">
			<svg class="dtb-secure-checkout-spinner" viewBox="25 25 50 50" aria-hidden="true" focusable="false">
				<circle class="dtb-secure-checkout-spinner__circle" r="20" cy="50" cx="50"></circle>
			</svg>
			<p><?php esc_html_e( 'Preparing your secure checkout…', 'drywall-toolbox' ); ?></p>
		</div>
	</div>
	<header class="dtb-checkout-header">
		<div class="dtb-checkout-header__inner">
			<a class="dtb-checkout-header__brand" href="<?php echo esc_url( $storefront_home_url ); ?>" aria-label="<?php esc_attr_e( 'Return to Drywall Toolbox', 'drywall-toolbox' ); ?>">
				<img src="<?php echo esc_url( home_url( '/logos/logo-white.svg' ) ); ?>" alt="<?php esc_attr_e( 'Drywall Toolbox', 'drywall-toolbox' ); ?>" width="3000" height="917">
			</a>
			<div class="dtb-checkout-header__secure" aria-label="<?php esc_attr_e( 'Secure checkout powered by Stripe', 'drywall-toolbox' ); ?>">
				<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10m-10 0h11a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-7A1.5 1.5 0 0 1 6.5 10Z" /></svg>
				<img class="dtb-checkout-header__stripe" src="<?php echo esc_url( home_url( '/logos/powered_by_stripe.svg' ) ); ?>" alt="" aria-hidden="true" width="2340" height="540">
			</div>
		</div>
	</header>
	<main id="primary" class="dtb-native-woocommerce-main" role="main">
		<div class="dtb-checkout-intro"><h1><?php esc_html_e( 'Checkout', 'drywall-toolbox' ); ?></h1></div>
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
