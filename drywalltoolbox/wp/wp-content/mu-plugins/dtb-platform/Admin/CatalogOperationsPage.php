<?php
/**
 * DTB Catalog Operations workspace.
 *
 * This is the operator-facing composition surface for catalog administration.
 * Domain behavior remains in its owning module; this page only presents
 * capability-filtered entry points into those bounded tools.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_notices', 'dtb_catalog_operations_render_context_navigation', 1 );
add_action( 'admin_enqueue_scripts', 'dtb_catalog_operations_enqueue_context_styles', 30 );

/** Load the shared workspace navigation styles on consolidated catalog pages. */
function dtb_catalog_operations_enqueue_context_styles(): void {
	$current = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$pages   = [ 'dtb-catalog-operations', 'dtb-catalog-health', 'dtb-import-export', 'dtb-product-mapping', 'dtb-parts-manager', 'dtb-inventory-intelligence', 'dtb-image-sync', 'dtb-pricing-manager', 'dtb-seo-tools' ];
	if ( ! in_array( $current, $pages, true ) ) {
		return;
	}

	$file = __DIR__ . '/assets/dtb-catalog-operations.css';
	wp_enqueue_style( 'dtb-catalog-operations', plugin_dir_url( __FILE__ ) . 'assets/dtb-catalog-operations.css', [ 'dtb-admin' ], is_file( $file ) ? (string) filemtime( $file ) : '1.0.0' );
}

/**
 * Return the catalog operation cards the current operator may use.
 *
 * @return array<int, array<string, string>>
 */
function dtb_catalog_operations_cards(): array {
	$cards = [
		[ 'capability' => 'dtb_manage_catalog_health', 'title' => __( 'Overview & Health', 'drywall-toolbox' ), 'description' => __( 'Audit variable products, required metadata, catalog integrity, and remediation queues.', 'drywall-toolbox' ), 'slug' => 'dtb-catalog-health', 'icon' => 'dashicons-heart' ],
		[ 'capability' => 'dtb_manage_import_export', 'title' => __( 'Import / Export', 'drywall-toolbox' ), 'description' => __( 'Validate, import, and export the supported DTB catalog CSV contract.', 'drywall-toolbox' ), 'slug' => 'dtb-import-export', 'icon' => 'dashicons-database-import' ],
		[ 'capability' => 'dtb_manage_product_mapping', 'title' => __( 'Product Relationships', 'drywall-toolbox' ), 'description' => __( 'Resolve product mappings and review relationship conflicts without changing protected identifiers.', 'drywall-toolbox' ), 'slug' => 'dtb-product-mapping', 'icon' => 'dashicons-randomize' ],
		[ 'capability' => 'dtb_manage_parts', 'title' => __( 'Parts & Compatibility', 'drywall-toolbox' ), 'description' => __( 'Manage parts, compatible-tool relationships, schematic mappings, and universal-part projections.', 'drywall-toolbox' ), 'slug' => 'dtb-parts-manager', 'icon' => 'dashicons-admin-tools' ],
		[ 'capability' => 'dtb_manage_inventory_intelligence', 'title' => __( 'Inventory Projections', 'drywall-toolbox' ), 'description' => __( 'Inspect WooCommerce stock projections and universal-part rollups; Veeqo remains inventory authority.', 'drywall-toolbox' ), 'slug' => 'dtb-inventory-intelligence', 'icon' => 'dashicons-chart-area' ],
		[ 'capability' => 'dtb_manage_image_sync', 'title' => __( 'Media Sync', 'drywall-toolbox' ), 'description' => __( 'Register and link catalog media from the active WordPress uploads directory.', 'drywall-toolbox' ), 'slug' => 'dtb-image-sync', 'icon' => 'dashicons-images-alt2' ],
		[ 'capability' => 'dtb_manage_catalog_pricing', 'title' => __( 'Pricing', 'drywall-toolbox' ), 'description' => __( 'Review pricing data and apply authorized WooCommerce price updates.', 'drywall-toolbox' ), 'slug' => 'dtb-pricing-manager', 'icon' => 'dashicons-money-alt' ],
		[ 'capability' => 'dtb_manage_seo_tools', 'title' => __( 'SEO Health', 'drywall-toolbox' ), 'description' => __( 'Audit product search metadata and the canonical WordPress sitemap endpoint.', 'drywall-toolbox' ), 'slug' => 'dtb-seo-tools', 'icon' => 'dashicons-search' ],
	];

	return array_values(
		array_filter(
			$cards,
			static fn( array $card ): bool => current_user_can( $card['capability'] )
		)
	);
}

/**
 * Render a consistent Catalog Operations navigation bar on the hidden domain
 * pages. The stable page slugs deliberately remain the routing contract.
 */
function dtb_catalog_operations_render_context_navigation(): void {
	$current = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$pages   = [
		'dtb-catalog-operations'   => [ 'dtb_view_catalog_operations', __( 'Overview', 'drywall-toolbox' ) ],
		'dtb-catalog-health'       => [ 'dtb_manage_catalog_health', __( 'Health', 'drywall-toolbox' ) ],
		'dtb-import-export'        => [ 'dtb_manage_import_export', __( 'Data Transfer', 'drywall-toolbox' ) ],
		'dtb-product-mapping'      => [ 'dtb_manage_product_mapping', __( 'Relationships', 'drywall-toolbox' ) ],
		'dtb-parts-manager'        => [ 'dtb_manage_parts', __( 'Parts', 'drywall-toolbox' ) ],
		'dtb-inventory-intelligence' => [ 'dtb_manage_inventory_intelligence', __( 'Projections', 'drywall-toolbox' ) ],
		'dtb-image-sync'           => [ 'dtb_manage_image_sync', __( 'Media', 'drywall-toolbox' ) ],
		'dtb-pricing-manager'      => [ 'dtb_manage_catalog_pricing', __( 'Pricing', 'drywall-toolbox' ) ],
		'dtb-seo-tools'            => [ 'dtb_manage_seo_tools', __( 'SEO', 'drywall-toolbox' ) ],
	];

	if ( ! isset( $pages[ $current ] ) ) {
		return;
	}

	echo '<nav class="dtb-catalog-operations-nav" aria-label="' . esc_attr__( 'Catalog Operations', 'drywall-toolbox' ) . '"><strong>' . esc_html__( 'Catalog Operations:', 'drywall-toolbox' ) . '</strong> ';
	foreach ( $pages as $slug => [ $capability, $label ] ) {
		if ( ! current_user_can( $capability ) ) {
			continue;
		}
		$class = $slug === $current ? 'button button-primary' : 'button';
		echo '<a class="' . esc_attr( $class ) . '" href="' . esc_url( admin_url( 'admin.php?page=' . $slug ) ) . '">' . esc_html( $label ) . '</a> ';
	}
	echo '</nav>';
}

/** Render the unified catalog operations landing page. */
function dtb_catalog_operations_render_page(): void {
	$cards = dtb_catalog_operations_cards();
	if ( ! $cards ) {
		dtb_admin_shell_access_denied();
		return;
	}

	dtb_admin_shell_open( [
		'title'    => __( 'Catalog Operations', 'drywall-toolbox' ),
		'subtitle' => __( 'One workspace for catalog health, data transfer, relationships, parts, media, pricing, and SEO.', 'drywall-toolbox' ),
		'section'  => 'tools',
		'page'     => 'dtb-catalog-operations',
		'template' => 'dashboard',
		'icon'     => 'dashicons-products',
	] );

	echo '<div class="dtb-card-grid">';
	foreach ( $cards as $card ) {
		$url = admin_url( 'admin.php?page=' . $card['slug'] );
		echo '<section class="dtb-card"><div class="dtb-card__body">';
		echo '<span class="dashicons ' . esc_attr( $card['icon'] ) . '" aria-hidden="true"></span>';
		echo '<h2 class="dtb-card__title">' . esc_html( $card['title'] ) . '</h2>';
		echo '<p>' . esc_html( $card['description'] ) . '</p>';
		echo '<p><a class="button button-primary" href="' . esc_url( $url ) . '">' . esc_html__( 'Open tool', 'drywall-toolbox' ) . '</a></p>';
		echo '</div></section>';
	}
	echo '</div>';

	if ( current_user_can( 'dtb_manage_inventory_intelligence' ) ) {
		$veeqo_url = admin_url( 'admin.php?page=dtb-veeqo' );
		echo '<section class="dtb-card"><div class="dtb-card__body"><h2 class="dtb-card__title">' . esc_html__( 'Inventory authority', 'drywall-toolbox' ) . '</h2>';
		echo '<p>' . esc_html__( 'Veeqo owns inventory, allocation, fulfillment, shipping, and tracking. Catalog Operations manages only WooCommerce catalog data and explicit projections.', 'drywall-toolbox' ) . '</p>';
		echo '<p><a class="button" href="' . esc_url( $veeqo_url ) . '">' . esc_html__( 'Open Veeqo', 'drywall-toolbox' ) . '</a></p></div></section>';
	}

	dtb_admin_shell_close();
}
