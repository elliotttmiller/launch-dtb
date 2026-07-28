<?php
/**
 * Drywall Toolbox native WooCommerce Checkout Block document.
 *
 * The active theme owns checkout document structure and presentation assets.
 * WooCommerce remains authoritative for checkout fields, cart/session state,
 * validation, shipping, tax, totals, order creation, and submission. Payment
 * Plugins for Stripe WooCommerce remains authoritative for Stripe payment UI,
 * wallets, tokenization, authentication, capture, and payment execution.
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

/* One authoritative checkout stylesheet. WooCommerce and the configured payment
 * providers retain all form, payment, and submission ownership. */
wp_enqueue_style(
	'dtb-checkout-theme',
	$theme_uri . '/assets/checkout/checkout.css',
	[],
	$asset_version( 'assets/checkout/checkout.css' )
);

/* Narrowly-scoped dependent stylesheet for the below-1024px Contact -> Shipping
 * -> Payment presentation wizard. Provider controls remain mounted and owned by
 * WooCommerce/Payment Plugins throughout step navigation. */
wp_enqueue_style(
	'dtb-checkout-theme-flow',
	$theme_uri . '/assets/checkout/checkout-flow.css',
	[ 'dtb-checkout-theme' ],
	$asset_version( 'assets/checkout/checkout-flow.css' )
);

/* Provider compatibility rules are attached to the authoritative style handle:
 * - desktop Express Checkout remains first without DOM reparenting;
 * - eligible express controls use a compact two-column layout and an odd final
 *   provider may span both columns (for an independently installed PayPal plugin);
 * - payment inputs remain native/focusable while their visible radio circles are
 *   replaced by touch-card selected states.
 */
wp_add_inline_style(
	'dtb-checkout-theme',
	'@media (min-width:1024px){body.dtb-payment-plugins-stripe-checkout .wc-block-components-main,body.dtb-payment-plugins-stripe-checkout .wc-block-checkout__main{display:flex!important;flex-direction:column!important}body.dtb-payment-plugins-stripe-checkout .wc-block-components-main>.wp-block-woocommerce-checkout-express-payment-block,body.dtb-payment-plugins-stripe-checkout .wc-block-checkout__main>.wp-block-woocommerce-checkout-express-payment-block,body.dtb-payment-plugins-stripe-checkout .wc-block-components-main>.wc-block-components-express-payment,body.dtb-payment-plugins-stripe-checkout .wc-block-checkout__main>.wc-block-components-express-payment{order:-100!important}}body.dtb-payment-plugins-stripe-checkout .wc-block-components-express-payment__event-buttons{grid-template-columns:repeat(2,minmax(0,1fr))!important}body.dtb-payment-plugins-stripe-checkout .wc-block-components-express-payment__event-buttons>:last-child:nth-child(odd){grid-column:1/-1}body.dtb-payment-plugins-stripe-checkout .wc-block-components-express-payment__event-buttons>li,body.dtb-payment-plugins-stripe-checkout .wc-block-components-express-payment__event-buttons>div{border-radius:16px!important}body.dtb-payment-plugins-stripe-checkout .wc-block-components-payment-methods .wc-block-components-radio-control__input{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;border:0!important}body.dtb-payment-plugins-stripe-checkout .wc-block-components-payment-methods .wc-block-components-radio-control__option,body.dtb-payment-plugins-stripe-checkout .wc-block-components-payment-methods .wc-block-components-radio-control-accordion-option{padding-left:18px!important;cursor:pointer}body.dtb-payment-plugins-stripe-checkout .wc-block-components-payment-methods .wc-block-components-radio-control__option-checked,body.dtb-payment-plugins-stripe-checkout .wc-block-components-payment-methods .wc-block-components-radio-control-accordion-option--checked{border-color:var(--dtb-checkout-primary)!important;background:var(--dtb-checkout-primary-soft)!important;box-shadow:0 0 0 1px var(--dtb-checkout-primary)!important}@media (max-width:420px){body.dtb-payment-plugins-stripe-checkout .wc-block-components-express-payment__event-buttons{gap:8px!important}}'
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
	'dtb-checkout-theme-express-entry',
	$theme_uri . '/assets/checkout/checkout-express-entry.js',
	[ 'dtb-checkout-theme-ui' ],
	$asset_version( 'assets/checkout/checkout-express-entry.js' ),
	true
);
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
	<meta name="theme-color" content="#071225">
	<meta name="robots" content="noindex,nofollow,noarchive">
	<script>document.documentElement.classList.add('dtb-native-checkout-booting');window.setTimeout(function(){document.documentElement.classList.remove('dtb-native-checkout-booting');},8000);</script>
	<style>
		.dtb-native-checkout-loader{position:fixed;z-index:2147483000;inset:0;display:none;min-height:100vh;background:#f5f7fb;color:#101828;align-items:center;justify-content:center;opacity:1;transition:opacity 260ms cubic-bezier(.4,0,.2,1)}
		html.dtb-native-checkout-booting .dtb-native-checkout-loader{display:flex}html.dtb-native-checkout-ready .dtb-native-checkout-loader{opacity:0;pointer-events:none}html.dtb-native-checkout-booting .dtb-native-woocommerce-document{overflow:hidden}html.dtb-native-checkout-booting .dtb-checkout-header,html.dtb-native-checkout-booting .dtb-native-woocommerce-main{opacity:0}.dtb-native-checkout-loader__content{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}.dtb-secure-checkout-spinner{display:block;width:3.25em;height:3.25em;transform-origin:center;animation:dtb-secure-checkout-rotate 2s linear infinite}.dtb-secure-checkout-spinner__circle{fill:none;stroke:#2457e6;stroke-width:2;stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dtb-secure-checkout-dash 1.5s ease-in-out infinite}.dtb-native-checkout-loader__content p{margin:0;color:#475467;font:700 14px/1.5 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}@keyframes dtb-secure-checkout-rotate{100%{transform:rotate(360deg)}}@keyframes dtb-secure-checkout-dash{0%{stroke-dasharray:1,200;stroke-dashoffset:0}50%{stroke-dasharray:90,200;stroke-dashoffset:-35px}100%{stroke-dashoffset:-125px}}@media (prefers-reduced-motion:reduce){.dtb-native-checkout-loader{transition-duration:1ms}.dtb-secure-checkout-spinner,.dtb-secure-checkout-spinner__circle{animation:none}.dtb-secure-checkout-spinner__circle{stroke-dasharray:90,200;stroke-dashoffset:-35px}}
	</style>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'dtb-native-woocommerce-document dtb-woo-native-checkout dtb-payment-plugins-stripe-checkout dtb-official-stripe-checkout dtb-checkout-native-page' ); ?>>
<?php wp_body_open(); ?>
	<div class="dtb-native-checkout-loader" role="status" aria-live="polite" aria-label="<?php esc_attr_e( 'Loading secure checkout', 'drywall-toolbox' ); ?>">
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
			<?php
			$show_stripe_badge = class_exists( 'DTB_PaymentPluginsStripeNativeCheckout' )
				&& DTB_PaymentPluginsStripeNativeCheckout::stripe_badge_visible();
			?>
			<div class="dtb-checkout-header__secure" aria-label="<?php echo esc_attr( $show_stripe_badge ? __( 'Secure checkout powered by Stripe', 'drywall-toolbox' ) : __( 'Secure checkout', 'drywall-toolbox' ) ); ?>">
				<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10m-10 0h11a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-7A1.5 1.5 0 0 1 6.5 10Z" /></svg>
				<?php if ( $show_stripe_badge ) : ?>
					<img class="dtb-checkout-header__stripe" src="<?php echo esc_url( home_url( '/logos/powered_by_stripe.svg' ) ); ?>" alt="<?php esc_attr_e( 'Powered by Stripe', 'drywall-toolbox' ); ?>" width="2340" height="540">
				<?php endif; ?>
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
