<?php
/**
 * Admin — GitControlCenterAdminMenu
 *
 * Registers the Git Control Center page with the shared AdminPageRegistry
 * (Drywall Toolbox > Git Control Center, between System Manager and Settings).
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'dtb_deployment_admin_menu_register_page', 10 );

function dtb_deployment_admin_menu_register_page(): void {
	dtb_register_admin_page( [
		'library'    => 'operations',
		'slug'       => 'dtb-git-control-center',
		'title'      => __( 'Git Control Center', 'drywall-toolbox' ),
		'menu_title' => __( 'Git Control Center', 'drywall-toolbox' ),
		'capability' => 'dtb_manage_deployments',
		'callback'   => 'dtb_deployment_center_render_page',
		'position'   => 65,
		'template'   => 'dashboard',
		'section'    => 'Technical',
		'icon'       => 'dashicons-cloud-upload',
		'assets'     => [
			'css' => [
				[
					'id'   => 'dtb-git-control-center',
					'dir'  => WP_CONTENT_DIR . '/mu-plugins/dtb-deployment/Admin/assets/',
					'url'  => content_url( '/mu-plugins/dtb-deployment/Admin/assets/' ),
					'file' => 'dtb-git-control-center.css',
				],
			],
		],
	] );
}
