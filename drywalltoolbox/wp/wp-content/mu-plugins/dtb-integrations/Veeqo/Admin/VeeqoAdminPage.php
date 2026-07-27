<?php
/**
 * Veeqo control-center wp-admin page and asset registration.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_VEEQO_ADMIN_PAGE_SLUG = 'dtb-veeqo-control-center';

function dtb_veeqo_admin_browser_locale(): string {
	$locale = str_replace( '_', '-', (string) get_user_locale() );
	if ( 1 !== preg_match( '/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/', $locale ) ) {
		return 'en-US';
	}
	return $locale;
}

add_action(
	'admin_init',
	static function (): void {
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 'dtb-veeqo-operations' !== $page || ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}
		wp_safe_redirect( admin_url( 'admin.php?page=' . DTB_VEEQO_ADMIN_PAGE_SLUG ) );
		exit;
	},
	5
);

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

add_filter(
	'admin_body_class',
	static function ( string $classes ): string {
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return DTB_VEEQO_ADMIN_PAGE_SLUG === $page ? $classes . ' dtb-veeqo-control-center-page' : $classes;
	}
);

add_action(
	'admin_enqueue_scripts',
	static function ( string $hook_suffix ): void {
		if ( 'toplevel_page_' . DTB_VEEQO_ADMIN_PAGE_SLUG !== $hook_suffix ) {
			return;
		}

		$base_dir      = dirname( __DIR__ );
		$base_url      = content_url( 'mu-plugins/dtb-integrations/Veeqo/assets/' );
		$css_path      = $base_dir . '/assets/veeqo-admin.css';
		$js_path       = $base_dir . '/assets/veeqo-admin.js';
		$workspace_css = $base_dir . '/assets/veeqo-inventory-workspace.css';
		$workspace_js  = $base_dir . '/assets/veeqo-inventory-workspace.js';

		wp_enqueue_style(
			'dtb-veeqo-admin',
			$base_url . 'veeqo-admin.css',
			[],
			is_file( $css_path ) ? (string) filemtime( $css_path ) : '1'
		);
		wp_enqueue_style(
			'dtb-veeqo-inventory-workspace',
			$base_url . 'veeqo-inventory-workspace.css',
			[ 'dtb-veeqo-admin' ],
			is_file( $workspace_css ) ? (string) filemtime( $workspace_css ) : '1'
		);

		wp_enqueue_script( 'wp-api-fetch' );
		wp_enqueue_script(
			'dtb-veeqo-admin',
			$base_url . 'veeqo-admin.js',
			[ 'wp-api-fetch' ],
			is_file( $js_path ) ? (string) filemtime( $js_path ) : '1',
			true
		);

		$config = [
			'restRoot' => esc_url_raw( site_url( '/wp-json/' ) ),
			'basePath' => '/dtb/v1/veeqo/admin/control-center',
			'pageUrl'  => esc_url_raw( admin_url( 'admin.php?page=' . DTB_VEEQO_ADMIN_PAGE_SLUG ) ),
			'currency' => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'USD',
			'locale'   => dtb_veeqo_admin_browser_locale(),
			'pageSize' => 50,
			'pollMs'   => 3000,
			'pollLimit'=> 100,
			'labels'   => [
				'confirmReconcile' => __( 'Apply configured-warehouse Veeqo stock to WooCommerce?', 'drywall-toolbox' ),
				'confirmRetry'     => __( 'Queue a Veeqo retry for this WooCommerce order?', 'drywall-toolbox' ),
			],
		];
		wp_add_inline_script( 'dtb-veeqo-admin', 'window.DTBVeeqoAdmin=' . wp_json_encode( $config ) . ';', 'before' );
		wp_enqueue_script(
			'dtb-veeqo-inventory-workspace',
			$base_url . 'veeqo-inventory-workspace.js',
			[ 'dtb-veeqo-admin', 'wp-api-fetch' ],
			is_file( $workspace_js ) ? (string) filemtime( $workspace_js ) : '1',
			true
		);
	},
	20
);

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
		<noscript><div class="notice notice-error"><p><?php esc_html_e( 'Veeqo Control Center requires JavaScript in wp-admin.', 'drywall-toolbox' ); ?></p></div></noscript>
	</div>
	<?php
}
