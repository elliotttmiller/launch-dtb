<?php
/**
 * Veeqo control-center wp-admin page and asset registration.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_VEEQO_ADMIN_PAGE_SLUG = 'dtb-veeqo-control-center';

/** Redirect the retired operations-page bookmark to the canonical control center. */
add_action(
	'admin_init',
	static function (): void {
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only navigation compatibility.
		if ( 'dtb-veeqo-operations' !== $page || ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}
		wp_safe_redirect( admin_url( 'admin.php?page=' . DTB_VEEQO_ADMIN_PAGE_SLUG ) );
		exit;
	},
	5
);

/** Register the Veeqo control center as a first-class operator surface. */
add_action(
	'admin_menu',
	static function (): void {
		add_menu_page(
			__( 'Veeqo Control Center', 'drywall-toolbox' ),
			__( 'Veeqo', 'drywall-toolbox' ),
			'manage_woocommerce',
			DTB_VEEQO_ADMIN_PAGE_SLUG,
			'dtb_veeqo_admin_render_page',
			'dashicons-store',
			56
		);
	},
	35
);

/** Add a page-specific body class for a contained application shell. */
add_filter(
	'admin_body_class',
	static function ( string $classes ): string {
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only screen selection.
		return DTB_VEEQO_ADMIN_PAGE_SLUG === $page ? $classes . ' dtb-veeqo-control-center-page' : $classes;
	}
);

/** Enqueue versioned, page-scoped assets with native REST dependencies. */
add_action(
	'admin_enqueue_scripts',
	static function ( string $hook_suffix ): void {
		if ( 'toplevel_page_' . DTB_VEEQO_ADMIN_PAGE_SLUG !== $hook_suffix ) {
			return;
		}
		$base_dir = dirname( __DIR__ );
		$css_path = $base_dir . '/assets/veeqo-admin.css';
		$js_path  = $base_dir . '/assets/veeqo-admin.js';
		$base_url = content_url( 'mu-plugins/dtb-integrations/Veeqo/assets/' );
		$css_ver  = is_file( $css_path ) ? (string) filemtime( $css_path ) : '1';
		$js_ver   = is_file( $js_path ) ? (string) filemtime( $js_path ) : '1';

		wp_enqueue_style( 'dtb-veeqo-admin', $base_url . 'veeqo-admin.css', [], $css_ver );
		wp_enqueue_script( 'wp-api-fetch' );
		wp_enqueue_script( 'dtb-veeqo-admin', $base_url . 'veeqo-admin.js', [ 'wp-api-fetch' ], $js_ver, true );

		$config = [
			'restRoot' => esc_url_raw( rest_url() ),
			'basePath' => '/dtb/v1/veeqo/admin/control-center',
			'pageUrl'  => esc_url_raw( admin_url( 'admin.php?page=' . DTB_VEEQO_ADMIN_PAGE_SLUG ) ),
			'currency' => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'USD',
			'locale'   => get_user_locale(),
			'pageSize' => 50,
			'pollMs'   => 3000,
			'pollLimit'=> 100,
			'labels'   => [
				'confirmReconcile' => __( 'Apply configured-warehouse Veeqo stock to WooCommerce?', 'drywall-toolbox' ),
				'confirmRetry'     => __( 'Queue a Veeqo retry for this WooCommerce order?', 'drywall-toolbox' ),
			],
		];
		wp_add_inline_script( 'dtb-veeqo-admin', 'window.DTBVeeqoAdmin=' . wp_json_encode( $config ) . ';', 'before' );
	},
	20
);

/** Render only the application mount point; all interaction lives in the asset bundle. */
function dtb_veeqo_admin_render_page(): void {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		wp_die( esc_html__( 'You do not have permission to manage Veeqo operations.', 'drywall-toolbox' ) );
	}
	?>
	<div class="wrap dtb-veeqo-admin-wrap">
		<div id="dtb-veeqo-admin-root" class="dtb-veeqo-admin-root" aria-live="polite">
			<div class="dtb-veeqo-boot">
				<span class="spinner is-active" aria-hidden="true"></span>
				<p><?php esc_html_e( 'Loading Veeqo Control Center…', 'drywall-toolbox' ); ?></p>
			</div>
		</div>
		<noscript>
			<div class="notice notice-error"><p><?php esc_html_e( 'Veeqo Control Center requires JavaScript in wp-admin.', 'drywall-toolbox' ); ?></p></div>
		</noscript>
	</div>
	<?php
}
