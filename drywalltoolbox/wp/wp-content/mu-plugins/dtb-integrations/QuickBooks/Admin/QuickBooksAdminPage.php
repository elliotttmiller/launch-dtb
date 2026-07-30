<?php
/**
 * QuickBooks control-center wp-admin page.
 *
 * Renders a scoped application surface that shares the platform-wide DTB admin
 * design system (dtb-admin.css + the dtb-brikpanel-components bridge layer).
 * CSS/JS are declared through the AdminPageRegistry `assets` key so the
 * central AdminAssets pipeline owns enqueue order and dependency wiring —
 * matching the Orders/Repairs/Returns module pattern.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_QBO_ADMIN_PAGE_SLUG = 'dtb-quickbooks';

add_action( 'init', 'dtb_qbo_admin_register_page', 15 );
// Queue wp-api-fetch *before* the central AdminAssets pipeline (default
// priority 10) enqueues the dtb-qbo-admin script, so wp-api-fetch is earlier
// in the print queue — the module JS reads window.wp.apiFetch (indirectly,
// via fetch()) and quickbooks-admin.js uses the global config synchronously.
add_action( 'admin_enqueue_scripts', 'dtb_qbo_admin_enqueue_api_fetch', 5 );
add_action( 'admin_enqueue_scripts', 'dtb_qbo_admin_localize_config', 20 );
add_filter( 'admin_body_class', 'dtb_qbo_admin_body_class' );

function dtb_qbo_admin_enqueue_api_fetch(): void {
	if ( ! dtb_qbo_admin_is_current_screen() || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	wp_enqueue_script( 'wp-api-fetch' );
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
				'css' => [
					[
						'id'   => 'dtb-qbo-admin',
						'dir'  => $assets_dir,
						'url'  => $assets_url,
						'file' => 'quickbooks-admin.css',
					],
				],
				'js'  => [
					[
						'id'   => 'dtb-qbo-admin',
						'dir'  => $assets_dir,
						'url'  => $assets_url,
						'file' => 'quickbooks-admin.js',
					],
				],
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

/**
 * Localize runtime config onto the `dtb-qbo-admin` script handle enqueued by
 * the central AdminAssets pipeline (registered via the page's `assets.js`).
 * Runs after the default-priority pipeline enqueue so the handle exists.
 */
function dtb_qbo_admin_localize_config(): void {
	if ( ! dtb_qbo_admin_is_current_screen() || ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( ! wp_script_is( 'dtb-qbo-admin', 'enqueued' ) && ! wp_script_is( 'dtb-qbo-admin', 'registered' ) ) {
		return;
	}

	$config = [
		'restRoot'    => esc_url_raw( rest_url() ),
		'nonce'       => wp_create_nonce( 'wp_rest' ),
		'basePath'    => 'dtb/v1/admin/qbo',
		'pageUrl'     => esc_url_raw( admin_url( 'admin.php?page=' . DTB_QBO_ADMIN_PAGE_SLUG ) ),
		'notice'      => sanitize_key( wp_unslash( $_GET['dtb_qbo_notice'] ?? '' ) ), // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		'environment' => dtb_qbo_environment(),
		'labels'      => [
			'confirmDisconnect' => __( 'Disconnect QuickBooks from this environment? Existing WooCommerce and QuickBooks records will not be deleted.', 'drywall-toolbox' ),
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
	</div>
	<?php
}
