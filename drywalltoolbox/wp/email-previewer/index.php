<?php
/**
 * DTB local WooCommerce email previewer.
 *
 * This directory is local-development tooling. It bootstraps the real tracked
 * WordPress/WooCommerce/DTB runtime and renders the actual registered email
 * class without calling trigger() or send().
 *
 * @package DrywallToolbox\EmailPreviewer
 */

declare(strict_types=1);

$wordpress_loader = dirname( __DIR__ ) . '/wp-load.php';

if ( ! is_readable( $wordpress_loader ) ) {
	http_response_code( 500 );
	exit( 'WordPress bootstrap not found.' );
}

require_once $wordpress_loader;

use DrywallToolbox\EmailPreviewer\Renderer;

if ( ! defined( 'DONOTCACHEPAGE' ) ) {
	define( 'DONOTCACHEPAGE', true );
}

nocache_headers();

$environment = wp_get_environment_type();
if ( ! in_array( $environment, array( 'local', 'development' ), true ) ) {
	http_response_code( 404 );
	exit( 'Not found.' );
}

if ( ! is_user_logged_in() ) {
	auth_redirect();
}

if ( ! current_user_can( 'manage_woocommerce' ) ) {
	wp_die( esc_html__( 'You are not allowed to preview WooCommerce emails.', 'drywall-toolbox' ), 403 );
}

if ( ! function_exists( 'WC' ) || ! WC() || ! function_exists( 'wc_get_order' ) ) {
	wp_die( esc_html__( 'WooCommerce is unavailable.', 'drywall-toolbox' ), 500 );
}

require_once __DIR__ . '/src/Renderer.php';

$email_id = isset( $_GET['email'] )
	? sanitize_key( wp_unslash( $_GET['email'] ) )
	: 'customer_processing_order';
$order_id = isset( $_GET['order'] )
	? absint( wp_unslash( $_GET['order'] ) )
	: 0;
$device = isset( $_GET['device'] )
	? sanitize_key( wp_unslash( $_GET['device'] ) )
	: 'desktop';

if ( ! in_array( $device, array( 'desktop', 'mobile' ), true ) ) {
	$device = 'desktop';
}

if ( isset( $_GET['render'] ) && '1' === sanitize_text_field( wp_unslash( $_GET['render'] ) ) ) {
	if ( $order_id <= 0 ) {
		http_response_code( 400 );
		echo '<!doctype html><html><body><p>Choose an existing local WooCommerce order.</p></body></html>';
		exit;
	}

	$rendered = Renderer::render( $order_id, $email_id );
	if ( is_wp_error( $rendered ) ) {
		http_response_code( 422 );
		echo '<!doctype html><html><body style="font-family:Arial,sans-serif;padding:32px">';
		echo '<h1>Email preview failed</h1><p>' . esc_html( $rendered->get_error_message() ) . '</p>';
		echo '</body></html>';
		exit;
	}

	header( 'Content-Type: text/html; charset=' . get_option( 'blog_charset' ) );
	echo $rendered; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit;
}

$supported_emails = Renderer::supported_emails();
$query_args       = array(
	'render' => '1',
	'email'  => $email_id,
	'order'  => $order_id,
);
$preview_url      = add_query_arg( $query_args, './' );
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex,nofollow,noarchive">
	<title>DTB Email Previewer</title>
	<link rel="stylesheet" href="<?php echo esc_url( './assets/app.css?v=1.0.0' ); ?>">
</head>
<body>
	<header class="dtb-preview-header">
		<div>
			<p class="dtb-preview-kicker">LOCAL DEVELOPMENT</p>
			<h1>DTB Email Previewer</h1>
		</div>
		<p class="dtb-preview-status">Actual WooCommerce renderer · Nothing is sent</p>
	</header>

	<main class="dtb-preview-shell">
		<form class="dtb-preview-toolbar" method="get" action="./">
			<label>
				<span>Email</span>
				<select name="email">
					<?php foreach ( $supported_emails as $id => $label ) : ?>
						<option value="<?php echo esc_attr( $id ); ?>" <?php selected( $email_id, $id ); ?>>
							<?php echo esc_html( $label ); ?>
						</option>
					<?php endforeach; ?>
				</select>
			</label>

			<label>
				<span>Local order ID</span>
				<input name="order" type="number" min="1" step="1" required value="<?php echo esc_attr( $order_id > 0 ? (string) $order_id : '' ); ?>">
			</label>

			<fieldset>
				<legend>Viewport</legend>
				<label class="dtb-preview-radio">
					<input type="radio" name="device" value="desktop" <?php checked( $device, 'desktop' ); ?>> Desktop
				</label>
				<label class="dtb-preview-radio">
					<input type="radio" name="device" value="mobile" <?php checked( $device, 'mobile' ); ?>> Mobile
				</label>
			</fieldset>

			<button type="submit">Render email</button>
		</form>

		<section class="dtb-preview-stage" aria-label="Rendered email preview">
			<div class="dtb-preview-device dtb-preview-device--<?php echo esc_attr( $device ); ?>">
				<?php if ( $order_id > 0 ) : ?>
					<iframe
						title="WooCommerce email preview"
						src="<?php echo esc_url( $preview_url ); ?>"
						sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
					></iframe>
				<?php else : ?>
					<div class="dtb-preview-empty">
						<h2>Choose a local order</h2>
						<p>Use an existing sanitized local WooCommerce order. Saving an email PHP or CSS file will reload this page through BrowserSync.</p>
					</div>
				<?php endif; ?>
			</div>
		</section>
	</main>
</body>
</html>
