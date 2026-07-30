<?php
/**
 * QuickBooks enterprise wp-admin workspace.
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
	dtb_register_admin_page( [
		'library' => 'operations', 'slug' => DTB_QBO_ADMIN_PAGE_SLUG,
		'title' => __( 'QuickBooks', 'drywall-toolbox' ), 'menu_title' => __( 'QuickBooks', 'drywall-toolbox' ),
		'capability' => 'manage_options', 'callback' => 'dtb_qbo_admin_render_page', 'position' => 58,
		'template' => 'dashboard', 'section' => 'Integrations', 'icon' => 'dashicons-chart-area', 'menu_visible' => true,
		'assets' => [
			'css' => [ [ 'id' => 'dtb-qbo-admin', 'dir' => $assets_dir, 'url' => $assets_url, 'file' => 'quickbooks-admin.css' ] ],
			'js'  => [ [ 'id' => 'dtb-qbo-admin', 'dir' => $assets_dir, 'url' => $assets_url, 'file' => 'quickbooks-admin.js' ] ],
		],
	] );
}

function dtb_qbo_admin_is_current_screen(): bool {
	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return DTB_QBO_ADMIN_PAGE_SLUG === $page;
}

function dtb_qbo_admin_body_class( string $classes ): string {
	return dtb_qbo_admin_is_current_screen() ? $classes . ' dtb-qbo-admin-screen' : $classes;
}

function dtb_qbo_admin_localize_config(): void {
	if ( ! dtb_qbo_admin_is_current_screen() || ! current_user_can( 'manage_options' ) || ! wp_script_is( 'dtb-qbo-admin', 'registered' ) ) {
		return;
	}
	$config = [
		'restRoot' => esc_url_raw( rest_url() ), 'nonce' => wp_create_nonce( 'wp_rest' ), 'basePath' => 'dtb/v1/admin/qbo',
		'environment' => dtb_qbo_environment(), 'pollInterval' => 15000, 'pageSize' => 25,
		'labels' => [
			'confirmDisconnect' => __( 'Disconnect QuickBooks from this environment? Existing WooCommerce and QuickBooks records will not be deleted.', 'drywall-toolbox' ),
			'connectionPassed' => __( 'QuickBooks connection verified.', 'drywall-toolbox' ),
			'itemsMapped' => __( 'Accounting items discovered and mapped.', 'drywall-toolbox' ),
			'copied' => __( 'Copied to clipboard.', 'drywall-toolbox' ),
		],
	];
	wp_add_inline_script( 'dtb-qbo-admin', 'window.DTBQuickBooksAdmin=' . wp_json_encode( $config ) . ';', 'before' );
}

function dtb_qbo_admin_render_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to manage QuickBooks.', 'drywall-toolbox' ) );
	}
	$tabs = [
		'overview' => [ __( 'Overview', 'drywall-toolbox' ), 'dashboard' ],
		'transactions' => [ __( 'Sales', 'drywall-toolbox' ), 'cart' ],
		'refunds' => [ __( 'Refunds', 'drywall-toolbox' ), 'undo' ],
		'customers' => [ __( 'Customers', 'drywall-toolbox' ), 'groups' ],
		'reconciliation' => [ __( 'Reconciliation', 'drywall-toolbox' ), 'yes-alt' ],
		'activity' => [ __( 'Activity', 'drywall-toolbox' ), 'backup' ],
		'settings' => [ __( 'Settings', 'drywall-toolbox' ), 'admin-generic' ],
	];
	?>
	<div class="wrap dtb-qbo-admin" id="dtb-qbo-admin-root" aria-live="polite">
		<header class="dtb-qbo-appbar">
			<div class="dtb-qbo-brand"><span class="dtb-qbo-mark" aria-hidden="true">qb</span><div><h1><?php esc_html_e( 'QuickBooks', 'drywall-toolbox' ); ?></h1><p><?php esc_html_e( 'Accounting operations, synchronization, reconciliation, and controls.', 'drywall-toolbox' ); ?></p></div></div>
			<div class="dtb-qbo-appbar__status"><span class="dtb-qbo-live"><i></i><?php esc_html_e( 'Local projection live', 'drywall-toolbox' ); ?></span><span data-qbo-last-refresh>—</span><button class="button" type="button" data-qbo-action="refresh"><?php esc_html_e( 'Refresh', 'drywall-toolbox' ); ?></button></div>
		</header>
		<div class="dtb-qbo-alert" data-qbo-alert hidden role="status"></div>
		<nav class="dtb-qbo-primary-nav" role="tablist" aria-label="<?php esc_attr_e( 'QuickBooks sections', 'drywall-toolbox' ); ?>">
			<?php foreach ( $tabs as $key => $tab ) : $panel_id = 'dtb-qbo-panel-' . $key; ?>
				<button id="dtb-qbo-tab-<?php echo esc_attr( $key ); ?>" type="button" role="tab" class="dtb-qbo-nav-item<?php echo 'overview' === $key ? ' is-active' : ''; ?>" data-qbo-tab="<?php echo esc_attr( $key ); ?>" aria-controls="<?php echo esc_attr( $panel_id ); ?>" aria-selected="<?php echo 'overview' === $key ? 'true' : 'false'; ?>" tabindex="<?php echo 'overview' === $key ? '0' : '-1'; ?>"><span class="dashicons dashicons-<?php echo esc_attr( $tab[1] ); ?>" aria-hidden="true"></span><?php echo esc_html( $tab[0] ); ?></button>
			<?php endforeach; ?>
		</nav>
		<main class="dtb-qbo-content">
			<?php foreach ( [ 'overview', 'transactions', 'refunds', 'customers', 'reconciliation', 'activity' ] as $view ) : ?>
			<section id="dtb-qbo-panel-<?php echo esc_attr( $view ); ?>" class="dtb-qbo-panel<?php echo 'overview' === $view ? ' is-active' : ''; ?>" role="tabpanel" aria-labelledby="dtb-qbo-tab-<?php echo esc_attr( $view ); ?>" data-qbo-panel="<?php echo esc_attr( $view ); ?>" <?php echo 'overview' === $view ? '' : 'hidden'; ?>>
				<div class="dtb-qbo-panel__header"><div><h2 data-qbo-title><?php echo esc_html( $tabs[ $view ][0] ); ?></h2><p data-qbo-subtitle></p></div><div class="dtb-qbo-pagination" data-qbo-pagination hidden></div></div>
				<div class="dtb-qbo-kpis" data-qbo-kpis hidden></div>
				<div data-qbo-table="<?php echo esc_attr( $view ); ?>"><div class="dtb-qbo-loading"><span class="spinner is-active"></span><?php esc_html_e( 'Loading…', 'drywall-toolbox' ); ?></div></div>
			</section>
			<?php endforeach; ?>
			<section id="dtb-qbo-panel-settings" class="dtb-qbo-panel" role="tabpanel" aria-labelledby="dtb-qbo-tab-settings" data-qbo-panel="settings" hidden>
				<div class="dtb-qbo-settings-grid">
					<section class="dtb-qbo-settings-card"><div class="dtb-qbo-panel__header"><div><h2><?php esc_html_e( 'Connection and readiness', 'drywall-toolbox' ); ?></h2><p><?php esc_html_e( 'Active environment, company, token, webhook, and accounting prerequisites.', 'drywall-toolbox' ); ?></p></div><span class="dtb-qbo-score" data-qbo-readiness-score>—</span></div><div class="dtb-qbo-connection-summary"><strong data-qbo-company>—</strong><span class="dtb-qbo-state" data-qbo-connection-state>—</span></div><dl class="dtb-qbo-facts"><div><dt><?php esc_html_e( 'Environment', 'drywall-toolbox' ); ?></dt><dd data-qbo-environment>—</dd></div><div><dt><?php esc_html_e( 'Realm', 'drywall-toolbox' ); ?></dt><dd data-qbo-realm>—</dd></div><div><dt><?php esc_html_e( 'Token expiration', 'drywall-toolbox' ); ?></dt><dd data-qbo-token>—</dd></div><div><dt><?php esc_html_e( 'Last verified', 'drywall-toolbox' ); ?></dt><dd data-qbo-verified>—</dd></div></dl><div class="dtb-qbo-actions"><button class="button" data-qbo-action="test"><?php esc_html_e( 'Test connection', 'drywall-toolbox' ); ?></button><button class="button button-primary" data-qbo-action="connect" hidden><?php esc_html_e( 'Connect QuickBooks', 'drywall-toolbox' ); ?></button><a class="button" data-qbo-open-link href="#" target="_blank" rel="noopener noreferrer" hidden><?php esc_html_e( 'Open QuickBooks', 'drywall-toolbox' ); ?></a></div><div class="dtb-qbo-checks" data-qbo-checks></div></section>
					<section class="dtb-qbo-settings-card"><div class="dtb-qbo-panel__header"><div><h2><?php esc_html_e( 'Accounting mappings', 'drywall-toolbox' ); ?></h2><p><?php esc_html_e( 'Exact active QuickBooks Service items used by the accounting projection.', 'drywall-toolbox' ); ?></p></div><button class="button button-primary" data-qbo-action="discover"><?php esc_html_e( 'Discover and map', 'drywall-toolbox' ); ?></button></div><div data-qbo-items></div></section>
					<section class="dtb-qbo-settings-card"><div class="dtb-qbo-panel__header"><div><h2><?php esc_html_e( 'Synchronization and recovery', 'drywall-toolbox' ); ?></h2><p><?php esc_html_e( 'Queue eligible captured-payment orders through the canonical dtb-orders pipeline.', 'drywall-toolbox' ); ?></p></div><button class="button button-primary" data-qbo-action="queue"><?php esc_html_e( 'Queue eligible orders', 'drywall-toolbox' ); ?></button></div><div data-qbo-sync-status></div><div class="dtb-qbo-links"><a data-qbo-orders-link href="#"><?php esc_html_e( 'WooCommerce orders', 'drywall-toolbox' ); ?></a><a data-qbo-scheduler-link href="#"><?php esc_html_e( 'Action Scheduler', 'drywall-toolbox' ); ?></a></div></section>
					<section class="dtb-qbo-settings-card"><div class="dtb-qbo-panel__header"><div><h2><?php esc_html_e( 'Diagnostics', 'drywall-toolbox' ); ?></h2><p><?php esc_html_e( 'Redacted endpoints and environment controls.', 'drywall-toolbox' ); ?></p></div></div><div class="dtb-qbo-endpoints"><div><span><?php esc_html_e( 'OAuth redirect URI', 'drywall-toolbox' ); ?></span><code data-qbo-redirect>—</code><button class="button-link" data-qbo-copy="redirect"><?php esc_html_e( 'Copy', 'drywall-toolbox' ); ?></button></div><div><span><?php esc_html_e( 'Webhook endpoint', 'drywall-toolbox' ); ?></span><code data-qbo-webhook>—</code><button class="button-link" data-qbo-copy="webhook"><?php esc_html_e( 'Copy', 'drywall-toolbox' ); ?></button></div></div><div class="dtb-qbo-danger"><div><h3><?php esc_html_e( 'Disconnect this environment', 'drywall-toolbox' ); ?></h3><p><?php esc_html_e( 'Tokens and company connection state are cleared. Orders and QuickBooks records are not deleted.', 'drywall-toolbox' ); ?></p></div><button class="button" data-qbo-action="disconnect"><?php esc_html_e( 'Disconnect', 'drywall-toolbox' ); ?></button></div></section>
				</div>
			</section>
		</main>
	</div>
	<noscript><div class="notice notice-error"><p><?php esc_html_e( 'The QuickBooks workspace requires JavaScript in wp-admin.', 'drywall-toolbox' ); ?></p></div></noscript>
	<?php
}
