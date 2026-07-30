<?php
/**
 * QuickBooks enterprise operations workspace.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_QBO_ADMIN_PAGE_SLUG = 'dtb-quickbooks';

add_action( 'init', 'dtb_qbo_admin_register_page', 15 );
add_action( 'admin_enqueue_scripts', 'dtb_qbo_admin_enqueue_api_fetch', 5 );
add_action( 'admin_enqueue_scripts', 'dtb_qbo_admin_localize_config', 20 );
add_filter( 'admin_body_class', 'dtb_qbo_admin_body_class' );

function dtb_qbo_admin_enqueue_api_fetch(): void {
	if ( dtb_qbo_admin_is_current_screen() && current_user_can( 'manage_options' ) ) {
		wp_enqueue_script( 'wp-api-fetch' );
	}
}

function dtb_qbo_admin_register_page(): void {
	if ( ! function_exists( 'dtb_register_admin_page' ) ) {
		return;
	}
	$assets_dir = dirname( __DIR__ ) . '/assets/';
	$assets_url = content_url( 'mu-plugins/dtb-integrations/QuickBooks/assets/' );
	dtb_register_admin_page(
		[
			'library'      => 'operations',
			'slug'         => DTB_QBO_ADMIN_PAGE_SLUG,
			'title'        => __( 'QuickBooks', 'drywall-toolbox' ),
			'menu_title'   => __( 'QuickBooks', 'drywall-toolbox' ),
			'capability'   => 'manage_options',
			'callback'     => 'dtb_qbo_admin_render_page',
			'position'     => 58,
			'template'     => 'dashboard',
			'section'      => 'Integrations',
			'icon'         => 'dashicons-chart-area',
			'menu_visible' => true,
			'assets'       => [
				'css' => [ [ 'id' => 'dtb-qbo-admin', 'dir' => $assets_dir, 'url' => $assets_url, 'file' => 'quickbooks-admin.css' ] ],
				'js'  => [ [ 'id' => 'dtb-qbo-admin', 'dir' => $assets_dir, 'url' => $assets_url, 'file' => 'quickbooks-admin.js' ] ],
			],
		]
	);
}

function dtb_qbo_admin_is_current_screen(): bool {
	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return DTB_QBO_ADMIN_PAGE_SLUG === $page;
}

function dtb_qbo_admin_body_class( string $classes ): string {
	return dtb_qbo_admin_is_current_screen() ? $classes . ' dtb-qbo-admin-screen' : $classes;
}

function dtb_qbo_admin_localize_config(): void {
	if ( ! dtb_qbo_admin_is_current_screen() || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$config = [
		'restRoot'    => esc_url_raw( rest_url() ),
		'nonce'       => wp_create_nonce( 'wp_rest' ),
		'basePath'    => 'dtb/v1/admin/qbo',
		'pageUrl'     => esc_url_raw( admin_url( 'admin.php?page=' . DTB_QBO_ADMIN_PAGE_SLUG ) ),
		'environment' => dtb_qbo_environment(),
		'pollMs'      => 15000,
		'labels'      => [
			'confirmDisconnect' => __( 'Disconnect QuickBooks from this environment? Existing records will not be deleted.', 'drywall-toolbox' ),
			'connectionPassed'  => __( 'QuickBooks connection verified.', 'drywall-toolbox' ),
			'itemsMapped'       => __( 'Accounting items discovered and mapped.', 'drywall-toolbox' ),
		],
	];
	wp_add_inline_script( 'dtb-qbo-admin', 'window.DTBQuickBooksAdmin=' . wp_json_encode( $config ) . ';', 'before' );
}

function dtb_qbo_admin_render_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to manage QuickBooks.', 'drywall-toolbox' ) );
	}
	$tabs = [
		'overview' => [ 'Overview', 'dashboard' ],
		'transactions' => [ 'Sales', 'cart' ],
		'refunds' => [ 'Refunds', 'undo' ],
		'customers' => [ 'Customers', 'groups' ],
		'reconciliation' => [ 'Reconciliation', 'yes-alt' ],
		'activity' => [ 'Activity', 'backup' ],
		'settings' => [ 'Settings', 'admin-generic' ],
	];
	?>
	<div class="wrap dtb-qbo-admin" id="dtb-qbo-admin-root" aria-live="polite">
		<header class="dtb-qbo-appbar">
			<div class="dtb-qbo-brand"><span class="dtb-qbo-mark" aria-hidden="true">qb</span><div><h1><?php esc_html_e( 'QuickBooks', 'drywall-toolbox' ); ?></h1><p><?php esc_html_e( 'Accounting operations, synchronization, reconciliation, and controls.', 'drywall-toolbox' ); ?></p></div></div>
			<div class="dtb-qbo-appbar__status"><span class="dtb-qbo-live"><i></i><?php esc_html_e( 'Live', 'drywall-toolbox' ); ?></span><span data-qbo-last-refresh>—</span><button class="button" type="button" data-qbo-action="refresh"><?php esc_html_e( 'Refresh', 'drywall-toolbox' ); ?></button></div>
		</header>
		<div class="dtb-qbo-alert" data-qbo-alert hidden role="status"></div>
		<nav class="dtb-qbo-primary-nav" aria-label="<?php esc_attr_e( 'QuickBooks sections', 'drywall-toolbox' ); ?>">
			<?php foreach ( $tabs as $key => $tab ) : ?>
				<button type="button" class="dtb-qbo-nav-item<?php echo 'overview' === $key ? ' is-active' : ''; ?>" data-qbo-tab="<?php echo esc_attr( $key ); ?>" aria-selected="<?php echo 'overview' === $key ? 'true' : 'false'; ?>"><span class="dashicons dashicons-<?php echo esc_attr( $tab[1] ); ?>" aria-hidden="true"></span><?php echo esc_html( $tab[0] ); ?></button>
			<?php endforeach; ?>
		</nav>
		<main class="dtb-qbo-workspace">
			<section class="dtb-qbo-view is-active" data-qbo-view="overview"><div class="dtb-qbo-kpis" data-qbo-kpis></div><div class="dtb-qbo-grid"><article class="dtb-qbo-card dtb-qbo-card--wide"><header><div><span class="dtb-qbo-eyebrow"><?php esc_html_e( 'Recent accounting activity', 'drywall-toolbox' ); ?></span><h2><?php esc_html_e( 'Latest orders', 'drywall-toolbox' ); ?></h2></div></header><div data-qbo-table="overview"></div></article><aside class="dtb-qbo-card" data-qbo-health></aside></div></section>
			<?php foreach ( [ 'transactions' => 'Sales transactions', 'refunds' => 'Refund projections', 'customers' => 'Customer projections', 'reconciliation' => 'Reconciliation exceptions', 'activity' => 'Queue activity' ] as $key => $title ) : ?>
			<section class="dtb-qbo-view" data-qbo-view="<?php echo esc_attr( $key ); ?>" hidden><article class="dtb-qbo-card dtb-qbo-card--table"><header><div><span class="dtb-qbo-eyebrow"><?php echo esc_html( strtoupper( $key ) ); ?></span><h2><?php echo esc_html( $title ); ?></h2></div><?php if ( 'reconciliation' === $key ) : ?><button class="button button-primary" type="button" data-qbo-queue><?php esc_html_e( 'Queue eligible orders', 'drywall-toolbox' ); ?></button><?php endif; ?></header><div data-qbo-table="<?php echo esc_attr( $key ); ?>"></div></article></section>
			<?php endforeach; ?>
			<section class="dtb-qbo-view" data-qbo-view="settings" hidden>
				<div class="dtb-qbo-settings-grid">
					<article class="dtb-qbo-card"><header><div><span class="dtb-qbo-eyebrow"><?php esc_html_e( 'Connection', 'drywall-toolbox' ); ?></span><h2 data-qbo-company><?php esc_html_e( 'Loading company…', 'drywall-toolbox' ); ?></h2></div><span class="dtb-qbo-state" data-qbo-connection-state>—</span></header><dl class="dtb-qbo-facts"><div><dt><?php esc_html_e( 'Environment', 'drywall-toolbox' ); ?></dt><dd data-qbo-environment>—</dd></div><div><dt><?php esc_html_e( 'Realm', 'drywall-toolbox' ); ?></dt><dd data-qbo-realm>—</dd></div><div><dt><?php esc_html_e( 'Token expires', 'drywall-toolbox' ); ?></dt><dd data-qbo-token>—</dd></div><div><dt><?php esc_html_e( 'Last verified', 'drywall-toolbox' ); ?></dt><dd data-qbo-verified>—</dd></div></dl><div class="dtb-qbo-actions"><button class="button" type="button" data-qbo-action="test"><?php esc_html_e( 'Test connection', 'drywall-toolbox' ); ?></button><button class="button button-primary" type="button" data-qbo-action="connect"><?php esc_html_e( 'Connect', 'drywall-toolbox' ); ?></button><button class="button" type="button" data-qbo-action="disconnect"><?php esc_html_e( 'Disconnect', 'drywall-toolbox' ); ?></button></div></article>
					<article class="dtb-qbo-card"><header><div><span class="dtb-qbo-eyebrow"><?php esc_html_e( 'Readiness', 'drywall-toolbox' ); ?></span><h2 data-qbo-readiness-title><?php esc_html_e( 'Checking…', 'drywall-toolbox' ); ?></h2></div><strong class="dtb-qbo-score" data-qbo-readiness-score>—</strong></header><div class="dtb-qbo-check-list" data-qbo-checks></div></article>
					<article class="dtb-qbo-card dtb-qbo-card--wide"><header><div><span class="dtb-qbo-eyebrow"><?php esc_html_e( 'Accounting mappings', 'drywall-toolbox' ); ?></span><h2><?php esc_html_e( 'Service item configuration', 'drywall-toolbox' ); ?></h2></div><button class="button button-primary" type="button" data-qbo-action="discover"><?php esc_html_e( 'Discover and map', 'drywall-toolbox' ); ?></button></header><div data-qbo-items></div></article>
					<article class="dtb-qbo-card dtb-qbo-card--wide"><header><div><span class="dtb-qbo-eyebrow"><?php esc_html_e( 'Diagnostics', 'drywall-toolbox' ); ?></span><h2><?php esc_html_e( 'Integration endpoints and workflow', 'drywall-toolbox' ); ?></h2></div></header><div class="dtb-qbo-diagnostics"><div><strong><?php esc_html_e( 'Webhook', 'drywall-toolbox' ); ?></strong><code data-qbo-webhook>—</code></div><div><strong><?php esc_html_e( 'OAuth redirect', 'drywall-toolbox' ); ?></strong><code data-qbo-redirect>—</code></div><div><strong><?php esc_html_e( 'Execution', 'drywall-toolbox' ); ?></strong><span><?php esc_html_e( 'WooCommerce → DTB event ledger → dtb-orders → QuickBooks', 'drywall-toolbox' ); ?></span></div></div></article>
				</div>
			</section>
		</main>
	</div>
	<?php
}
