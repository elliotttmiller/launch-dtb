<?php
/**
 * Admin — DeploymentAdminMenu
 *
 * Registers the Deployment Center page with the shared AdminPageRegistry
 * (Drywall Toolbox > Deployment Center, between System Manager and Settings).
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'dtb_deployment_admin_menu_register_page', 10 );

function dtb_deployment_admin_menu_register_page(): void {
	dtb_register_admin_page( [
		'library'    => 'operations',
		'slug'       => 'dtb-deployment-center',
		'title'      => __( 'Deployment Center', 'drywall-toolbox' ),
		'menu_title' => __( 'Deployment Center', 'drywall-toolbox' ),
		'capability' => 'dtb_manage_deployments',
		'callback'   => 'dtb_deployment_center_render_page',
		'position'   => 65,
		'template'   => 'dashboard',
		'section'    => 'Technical',
		'icon'       => 'dashicons-cloud-upload',
	] );
}
