<?php
/**
 * Admin — DesignerPage: registers the "DTB Visual Designer" wp-admin page,
 * its assets, and renders the editor shell markup that dtb-visual-designer.js
 * progressively enhances into the full surface navigator / component tree /
 * inspector / preview / history experience.
 *
 * Follows the same server-rendered-PHP-shell + vanilla-JS-behavior pattern as
 * every other DTB admin screen (see dtb-integrations/Veeqo/Admin/VeeqoAdminPage.php)
 * — no build step, no framework, consistent with the rest of mu-plugins.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_VD_ADMIN_PAGE_SLUG = 'dtb-visual-designer';

add_action( 'init', 'dtb_vd_admin_register_page', 15 );
add_action( 'admin_enqueue_scripts', 'dtb_vd_admin_localize_config', 20 );

function dtb_vd_admin_is_current_screen(): bool {
	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return DTB_VD_ADMIN_PAGE_SLUG === $page;
}

function dtb_vd_admin_register_page(): void {
	if ( ! function_exists( 'dtb_register_admin_page' ) ) {
		return;
	}

	$assets_dir = __DIR__ . '/assets/';
	$assets_url = plugin_dir_url( __FILE__ ) . 'assets/';

	dtb_register_admin_page( [
		'library'      => 'tools',
		'slug'         => DTB_VD_ADMIN_PAGE_SLUG,
		'title'        => __( 'Visual Designer', 'drywall-toolbox' ),
		'menu_title'   => __( 'Visual Designer', 'drywall-toolbox' ),
		'capability'   => DTB_VD_CAPABILITY,
		'callback'     => 'dtb_vd_admin_render_page',
		'position'     => 15,
		'template'     => 'tool',
		'section'      => 'Storefront Presentation',
		'icon'         => 'dashicons-art',
		'menu_visible' => true,
		'assets'       => [
			'css' => [
				[ 'id' => 'dtb-visual-designer', 'dir' => $assets_dir, 'url' => $assets_url, 'file' => 'dtb-visual-designer.css' ],
			],
			'js'  => [
				[ 'id' => 'dtb-visual-designer', 'dir' => $assets_dir, 'url' => $assets_url, 'file' => 'dtb-visual-designer.js' ],
			],
		],
	] );
}

/**
 * Render the editor shell. All interactivity — data fetching, the component
 * tree, the inspector, publish/rollback, and the preview iframe/postMessage
 * bridge — is owned by dtb-visual-designer.js against the dtb/v1 REST API.
 */
function dtb_vd_admin_render_page(): void {
	if ( ! current_user_can( DTB_VD_CAPABILITY ) ) {
		wp_die( esc_html__( 'You do not have permission to access the Visual Designer.', 'drywall-toolbox' ) );
	}
	?>
	<div class="wrap dtb-admin dtb-vd" id="dtb-vd-root" data-dtb-vd-root>
		<div class="dtb-vd__loading" data-dtb-vd-loading>
			<div class="dtb-vd__spinner" aria-hidden="true"></div>
			<p><?php esc_html_e( 'Loading Visual Designer…', 'drywall-toolbox' ); ?></p>
		</div>
	</div>
	<?php
}

/**
 * Localize page-specific runtime config. The shared restUrl/nonce are already
 * available globally on window.dtbAdminConfig (see dtb-platform/Admin/AdminAssets.php);
 * this adds only what is specific to the designer (storefront origin, surface
 * routes for the preview iframe).
 */
function dtb_vd_admin_localize_config(): void {
	if ( ! dtb_vd_admin_is_current_screen() || ! current_user_can( DTB_VD_CAPABILITY ) ) {
		return;
	}

	if ( ! wp_script_is( 'dtb-visual-designer', 'enqueued' ) && ! wp_script_is( 'dtb-visual-designer', 'registered' ) ) {
		return;
	}

	$surfaces = [];
	foreach ( dtb_vd_get_surfaces() as $surface_id => $surface ) {
		$surfaces[] = [
			'id'       => $surface_id,
			'name'     => $surface['name'],
			'category' => $surface['category'],
			'route'    => $surface['route'],
		];
	}

	wp_localize_script( 'dtb-visual-designer', 'dtbVisualDesignerConfig', [
		'storefrontOrigin' => untrailingslashit( home_url() ),
		'surfaces'         => $surfaces,
		'breakpoints'      => dtb_vd_breakpoints(),
	] );
}
