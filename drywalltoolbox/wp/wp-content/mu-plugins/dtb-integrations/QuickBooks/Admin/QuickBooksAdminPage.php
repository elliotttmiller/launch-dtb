<?php
/**
 * QuickBooks control-center wp-admin page.
 *
 * BrikPanel retains ownership of global wp-admin chrome. This module renders a
 * scoped application surface and adds only component-level layout styles.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_QBO_ADMIN_PAGE_SLUG = 'dtb-quickbooks';

add_action( 'init', 'dtb_qbo_admin_register_page', 15 );
add_action( 'admin_enqueue_scripts', 'dtb_qbo_admin_enqueue_assets', 100 );
add_filter( 'admin_body_class', 'dtb_qbo_admin_body_class' );

function dtb_qbo_admin_register_page(): void {
	if ( ! function_exists( 'dtb_register_admin_page' ) ) {
		return;
	}

	dtb_register_admin_page(
		[
			'library'      => 'operations',
			'slug'         => DTB_QBO_ADMIN_PAGE_SLUG,
			'title'        => __( 'QuickBooks Control Center', 'drywall-toolbox' ),
			'menu_title'   => __( 'QuickBooks', 'drywall-toolbox' ),
			'capability'   => 'manage_options',
			'callback'     => 'dtb_qbo_admin_render_page',
			'position'     => 58,
			'template'     => 'dashboard',
			'section'      => 'Integrations',
			'icon'         => 'dashicons-chart-area',
			'menu_visible' => true,
		]
	);
}

function dtb_qbo_admin_is_current_screen(): bool {
	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return DTB_QBO_ADMIN_PAGE_SLUG === $page;
}

function dtb_qbo_admin_body_class( string $classes ): string {
	if ( dtb_qbo_admin_is_current_screen() ) {
		$classes .= ' dtb-qbo-admin-screen';
	}

	return $classes;
}

function dtb_qbo_admin_enqueue_assets(): void {
	if ( ! dtb_qbo_admin_is_current_screen() || ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$base_dir = dirname( __DIR__ );
	$base_url = content_url( 'mu-plugins/dtb-integrations/QuickBooks/assets/' );
	$css_path = $base_dir . '/assets/quickbooks-admin.css';
	$js_path  = $base_dir . '/assets/quickbooks-admin.js';

	// BrikPanel owns global wp-admin presentation. Add only the strictly scoped
	// QuickBooks component layer to WordPress' stable common admin stylesheet.
	wp_enqueue_style( 'common' );
	if ( is_readable( $css_path ) ) {
		$css = file_get_contents( $css_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( is_string( $css ) && '' !== $css ) {
			wp_add_inline_style( 'common', $css );
		}
	}

	wp_enqueue_script( 'wp-api-fetch' );
	wp_enqueue_script(
		'dtb-qbo-admin',
		$base_url . 'quickbooks-admin.js',
		[ 'wp-api-fetch' ],
		is_file( $js_path ) ? (string) filemtime( $js_path ) : '1.0.0',
		true
	);

	$config = [
		'restRoot'  => esc_url_raw( rest_url() ),
		'nonce'     => wp_create_nonce( 'wp_rest' ),
		'basePath'  => 'dtb/v1/admin/qbo',
		'pageUrl'   => esc_url_raw( admin_url( 'admin.php?page=' . DTB_QBO_ADMIN_PAGE_SLUG ) ),
		'notice'    => sanitize_key( wp_unslash( $_GET['dtb_qbo_notice'] ?? '' ) ), // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		'environment' => dtb_qbo_environment(),
		'labels'    => [
			'confirmDisconnect' => __( 'Disconnect QuickBooks from this environment? Existing WooCommerce and QuickBooks records will not be deleted.', 'drywall-toolbox' ),
			'connectionPassed'  => __( 'QuickBooks connection verified.', 'drywall-toolbox' ),
			'itemsMapped'       => __( 'Accounting items discovered and mapped.', 'drywall-toolbox' ),
			'copied'            => __( 'Copied to clipboard.', 'drywall-toolbox' ),
		],
	];

	wp_add_inline_script( 'dtb-qbo-admin', 'window.DTBQuickBooksAdmin=' . wp_json_encode( $config ) . ';', 'before' );
}

function dtb_qbo_admin_render_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to manage QuickBooks.', 'drywall-toolbox' ) );
	}
	?>
	<div class="wrap dtb-qbo-admin" id="dtb-qbo-admin-root" aria-live="polite">
		<header class="dtb-qbo-hero">
			<div class="dtb-qbo-hero__identity">
				<div class="dtb-qbo-mark" aria-hidden="true">qb</div>
				<div>
					<h1><?php esc_html_e( 'QuickBooks Control Center', 'drywall-toolbox' ); ?></h1>
					<p><?php esc_html_e( 'Connection, accounting readiness, reconciliation, and operator controls for the DTB accounting projection.', 'drywall-toolbox' ); ?></p>
				</div>
			</div>
			<div class="dtb-qbo-hero__actions">
				<button type="button" class="button" data-qbo-action="refresh">
					<span class="dashicons dashicons-update" aria-hidden="true"></span>
					<?php esc_html_e( 'Refresh', 'drywall-toolbox' ); ?>
				</button>
				<button type="button" class="button button-primary" data-qbo-action="test" disabled>
					<span class="dashicons dashicons-yes-alt" aria-hidden="true"></span>
					<?php esc_html_e( 'Test connection', 'drywall-toolbox' ); ?>
				</button>
			</div>
		</header>

		<div class="dtb-qbo-alert" data-qbo-alert hidden role="status"></div>

		<section class="dtb-qbo-overview" aria-label="<?php esc_attr_e( 'QuickBooks overview', 'drywall-toolbox' ); ?>">
			<div class="dtb-qbo-readiness">
				<div class="dtb-qbo-readiness__summary">
					<div>
						<span class="dtb-qbo-section-label"><?php esc_html_e( 'Launch readiness', 'drywall-toolbox' ); ?></span>
						<h2 data-qbo-readiness-title><?php esc_html_e( 'Loading integration status…', 'drywall-toolbox' ); ?></h2>
						<p data-qbo-readiness-copy><?php esc_html_e( 'Verifying the active environment and accounting prerequisites.', 'drywall-toolbox' ); ?></p>
					</div>
					<div class="dtb-qbo-score" data-qbo-readiness-score aria-label="<?php esc_attr_e( 'Readiness score', 'drywall-toolbox' ); ?>">—</div>
				</div>
				<ol class="dtb-qbo-checks" data-qbo-checks></ol>
			</div>

			<aside class="dtb-qbo-connection" aria-labelledby="dtb-qbo-connection-title">
				<div class="dtb-qbo-connection__head">
					<div>
						<span class="dtb-qbo-section-label"><?php esc_html_e( 'Active connection', 'drywall-toolbox' ); ?></span>
						<h2 id="dtb-qbo-connection-title" data-qbo-company><?php esc_html_e( 'Loading…', 'drywall-toolbox' ); ?></h2>
					</div>
					<span class="dtb-qbo-state" data-qbo-connection-state><?php esc_html_e( 'Checking', 'drywall-toolbox' ); ?></span>
				</div>
				<dl class="dtb-qbo-facts">
					<div><dt><?php esc_html_e( 'Environment', 'drywall-toolbox' ); ?></dt><dd data-qbo-environment>—</dd></div>
					<div><dt><?php esc_html_e( 'Realm', 'drywall-toolbox' ); ?></dt><dd data-qbo-realm>—</dd></div>
					<div><dt><?php esc_html_e( 'Token expiration', 'drywall-toolbox' ); ?></dt><dd data-qbo-token>—</dd></div>
					<div><dt><?php esc_html_e( 'Last verified', 'drywall-toolbox' ); ?></dt><dd data-qbo-verified>—</dd></div>
				</dl>
				<div class="dtb-qbo-connection__actions">
					<button type="button" class="button button-primary" data-qbo-action="connect" hidden><?php esc_html_e( 'Connect QuickBooks', 'drywall-toolbox' ); ?></button>
					<a class="button" data-qbo-open-link href="#" target="_blank" rel="noopener noreferrer" hidden><?php esc_html_e( 'Open QuickBooks', 'drywall-toolbox' ); ?></a>
				</div>
			</aside>
		</section>

		<nav class="dtb-qbo-tabs" aria-label="<?php esc_attr_e( 'QuickBooks control center sections', 'drywall-toolbox' ); ?>">
			<button type="button" class="dtb-qbo-tab is-active" data-qbo-tab="configuration" aria-selected="true"><?php esc_html_e( 'Configuration', 'drywall-toolbox' ); ?></button>
			<button type="button" class="dtb-qbo-tab" data-qbo-tab="workflow" aria-selected="false"><?php esc_html_e( 'Workflow', 'drywall-toolbox' ); ?></button>
			<button type="button" class="dtb-qbo-tab" data-qbo-tab="diagnostics" aria-selected="false"><?php esc_html_e( 'Diagnostics', 'drywall-toolbox' ); ?></button>
		</nav>

		<main class="dtb-qbo-content">
			<section class="dtb-qbo-panel is-active" data-qbo-panel="configuration">
				<div class="dtb-qbo-panel__header">
					<div>
						<h2><?php esc_html_e( 'Accounting item mappings', 'drywall-toolbox' ); ?></h2>
						<p><?php esc_html_e( 'Exact QuickBooks Service items used by the queue-owned SalesReceipt and RefundReceipt projection.', 'drywall-toolbox' ); ?></p>
					</div>
					<button type="button" class="button button-primary" data-qbo-action="discover" disabled>
						<span class="dashicons dashicons-search" aria-hidden="true"></span>
						<?php esc_html_e( 'Discover and map', 'drywall-toolbox' ); ?>
					</button>
				</div>
				<div class="dtb-qbo-item-table" role="table" aria-label="<?php esc_attr_e( 'QuickBooks accounting item mappings', 'drywall-toolbox' ); ?>">
					<div class="dtb-qbo-item-table__head" role="row">
						<span role="columnheader"><?php esc_html_e( 'Role', 'drywall-toolbox' ); ?></span>
						<span role="columnheader"><?php esc_html_e( 'QuickBooks item', 'drywall-toolbox' ); ?></span>
						<span role="columnheader"><?php esc_html_e( 'Item ID', 'drywall-toolbox' ); ?></span>
						<span role="columnheader"><?php esc_html_e( 'Source', 'drywall-toolbox' ); ?></span>
						<span role="columnheader"><?php esc_html_e( 'Status', 'drywall-toolbox' ); ?></span>
					</div>
					<div data-qbo-items></div>
				</div>
				<div class="dtb-qbo-guidance">
					<span class="dashicons dashicons-info-outline" aria-hidden="true"></span>
					<p><?php esc_html_e( 'Discovery is read-only in QuickBooks. It maps exact active Service items named DTB Product Sales, DTB Shipping, DTB Discount, and DTB Refund. It never creates or changes remote accounting records.', 'drywall-toolbox' ); ?></p>
				</div>
			</section>

			<section class="dtb-qbo-panel" data-qbo-panel="workflow" hidden>
				<div class="dtb-qbo-panel__header">
					<div>
						<h2><?php esc_html_e( 'Authoritative accounting workflow', 'drywall-toolbox' ); ?></h2>
						<p><?php esc_html_e( 'QuickBooks receives accounting projections only after WooCommerce payment or refund authority is established.', 'drywall-toolbox' ); ?></p>
					</div>
				</div>
				<?php
				/**
				 * The queue/backfill control for this panel is injected by
				 * QuickBooksAdminEnhancements.php (quickbooks-admin-sync.js —
				 * "Synchronization operations" card), which gates on real readiness
				 * (connection + verified item mappings + queue availability, including
				 * detecting leftover wp-config.php placeholder item IDs) rather than
				 * connection state alone. A duplicate static button here was removed
				 * to avoid two controls for the same action in the same panel.
				 */
				?>
				<div class="dtb-qbo-flow" aria-label="<?php esc_attr_e( 'QuickBooks accounting workflow', 'drywall-toolbox' ); ?>">
					<div><span class="dashicons dashicons-cart" aria-hidden="true"></span><strong><?php esc_html_e( 'WooCommerce', 'drywall-toolbox' ); ?></strong><small><?php esc_html_e( 'Order, payment, refund authority', 'drywall-toolbox' ); ?></small></div>
					<i aria-hidden="true"></i>
					<div><span class="dashicons dashicons-database" aria-hidden="true"></span><strong><?php esc_html_e( 'DTB event ledger', 'drywall-toolbox' ); ?></strong><small><?php esc_html_e( 'Idempotency and business state', 'drywall-toolbox' ); ?></small></div>
					<i aria-hidden="true"></i>
					<div><span class="dashicons dashicons-clock" aria-hidden="true"></span><strong><?php esc_html_e( 'dtb-orders queue', 'drywall-toolbox' ); ?></strong><small><?php esc_html_e( 'Retries and failure isolation', 'drywall-toolbox' ); ?></small></div>
					<i aria-hidden="true"></i>
					<div><span class="dashicons dashicons-chart-area" aria-hidden="true"></span><strong><?php esc_html_e( 'QuickBooks', 'drywall-toolbox' ); ?></strong><small><?php esc_html_e( 'Accounting projection', 'drywall-toolbox' ); ?></small></div>
				</div>
				<div class="dtb-qbo-workflow-actions">
					<a class="button" data-qbo-orders-link href="#"><?php esc_html_e( 'View WooCommerce orders', 'drywall-toolbox' ); ?></a>
					<a class="button" data-qbo-scheduler-link href="#"><?php esc_html_e( 'View Action Scheduler', 'drywall-toolbox' ); ?></a>
				</div>
			</section>

			<section class="dtb-qbo-panel" data-qbo-panel="diagnostics" hidden>
				<div class="dtb-qbo-panel__header">
					<div>
						<h2><?php esc_html_e( 'Endpoints and operational diagnostics', 'drywall-toolbox' ); ?></h2>
						<p><?php esc_html_e( 'Redacted runtime details for setup verification and incident response.', 'drywall-toolbox' ); ?></p>
					</div>
				</div>
				<div class="dtb-qbo-endpoints">
					<div><span><?php esc_html_e( 'OAuth redirect URI', 'drywall-toolbox' ); ?></span><code data-qbo-redirect>—</code><button type="button" class="button-link" data-qbo-copy="redirect"><?php esc_html_e( 'Copy', 'drywall-toolbox' ); ?></button></div>
					<div><span><?php esc_html_e( 'Webhook endpoint', 'drywall-toolbox' ); ?></span><code data-qbo-webhook>—</code><button type="button" class="button-link" data-qbo-copy="webhook"><?php esc_html_e( 'Copy', 'drywall-toolbox' ); ?></button></div>
				</div>
				<div class="dtb-qbo-danger">
					<div>
						<h3><?php esc_html_e( 'Disconnect this environment', 'drywall-toolbox' ); ?></h3>
						<p><?php esc_html_e( 'Removes encrypted OAuth tokens, the connected realm, and the cached company snapshot. Existing orders, refunds, queue history, and QuickBooks transactions are preserved.', 'drywall-toolbox' ); ?></p>
					</div>
					<button type="button" class="button" data-qbo-action="disconnect" disabled><?php esc_html_e( 'Disconnect QuickBooks', 'drywall-toolbox' ); ?></button>
				</div>
			</section>
		</main>

		<div class="dtb-qbo-loading" data-qbo-loading>
			<span class="spinner is-active" aria-hidden="true"></span>
			<p><?php esc_html_e( 'Loading QuickBooks Control Center…', 'drywall-toolbox' ); ?></p>
		</div>
	</div>
	<noscript><div class="notice notice-error"><p><?php esc_html_e( 'QuickBooks Control Center requires JavaScript in wp-admin.', 'drywall-toolbox' ); ?></p></div></noscript>
	<?php
}
