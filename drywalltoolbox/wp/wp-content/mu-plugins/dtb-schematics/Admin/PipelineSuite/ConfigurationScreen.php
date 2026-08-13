<?php
/**
 * DTB Schematics Pipeline Suite — ConfigurationScreen.
 *
 * Read-only display of environment truth pulled from real source/config
 * constants and functions — never wp-admin-editable text fields (spec
 * explicitly forbids creating a second, casually-editable configuration
 * authority here).
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_schematics_suite_render_configuration(): void {
	$rows = [
		[ __( 'Canonical Source Package Directory', 'drywall-toolbox' ), dtb_schematics_source_package_dir() ?: '—' ],
		[ __( 'Source Package Reachable', 'drywall-toolbox' ), dtb_schematics_source_package_available() ? __( 'Yes', 'drywall-toolbox' ) : __( 'No', 'drywall-toolbox' ) ],
		[ __( 'Source Manifest Filename', 'drywall-toolbox' ), DTB_SCHEMATIC_SOURCE_MANIFEST_FILENAME ],
		[ __( 'Staged/Live Uploads Path (default)', 'drywall-toolbox' ), DTB_SCHEMATIC_RECONCILE_DEFAULT_UPLOAD_PATH ],
		[ __( 'Filename Contract', 'drywall-toolbox' ), '{brand}_{sku-or-stable-alias}_sch-page-{NNN}.webp' ],
		[ __( 'Supported Source Formats', 'drywall-toolbox' ), 'image/webp' ],
		[ __( 'Reconciliation Default Batch Size', 'drywall-toolbox' ), (string) DTB_SCHEMATIC_RECONCILE_DEFAULT_BATCH_SIZE ],
		[ __( 'Reconciliation Max Batch Size', 'drywall-toolbox' ), (string) DTB_SCHEMATIC_RECONCILE_MAX_BATCH_SIZE ],
		[ __( 'Public Catalog / Cache Version', 'drywall-toolbox' ), (string) dtb_schematics_public_catalog_version() ],
		[ __( 'Public API — Collection', 'drywall-toolbox' ), 'GET /wp-json/dtb/v1/schematics' ],
		[ __( 'Public API — Detail', 'drywall-toolbox' ), 'GET /wp-json/dtb/v1/schematics/{schematic_id}' ],
		[ __( 'Legacy Manifest Endpoint (compatibility)', 'drywall-toolbox' ), rest_url( 'dtb/v1/schematics/manifest' ) ],
		[ __( 'Hotspot Dataset Meta Key', 'drywall-toolbox' ), DTB_SCHEMATIC_HOTSPOT_DATA_META_KEY ],
		[ __( 'Supported Lifecycle States', 'drywall-toolbox' ), implode( ', ', DTB_Schematic_Lifecycle_Status::all() ) ],
		[ __( 'Domain CPT', 'drywall-toolbox' ), DTB_SCHEMATIC_POST_TYPE . ' (private)' ],
		[ __( 'Manage Capability', 'drywall-toolbox' ), 'dtb_manage_schematics' ],
	];

	echo dtb_admin_ui_table_open( [ [ 'label' => __( 'Setting', 'drywall-toolbox' ) ], [ 'label' => __( 'Value', 'drywall-toolbox' ) ] ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	foreach ( $rows as [ $label, $value ] ) {
		echo '<tr class="dtb-table__row"><td class="dtb-table__cell"><strong>' . esc_html( $label ) . '</strong></td><td class="dtb-table__cell"><code>' . esc_html( $value ) . '</code></td></tr>';
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	// Canonical brand/category IDs — read from the live product_brand taxonomy
	// (the same source the storefront and catalog platform use), not a
	// hand-maintained admin list.
	$brand_rows = '';
	if ( taxonomy_exists( 'product_brand' ) ) {
		$terms = get_terms( [ 'taxonomy' => 'product_brand', 'hide_empty' => false ] );
		if ( ! is_wp_error( $terms ) ) {
			foreach ( $terms as $term ) {
				$brand_rows .= '<tr class="dtb-table__row"><td class="dtb-table__cell">' . esc_html( $term->slug ) . '</td><td class="dtb-table__cell">' . esc_html( $term->name ) . '</td></tr>';
			}
		}
	}
	if ( $brand_rows ) {
		ob_start();
		echo dtb_admin_ui_table_open( [ [ 'label' => __( 'Brand ID (slug)', 'drywall-toolbox' ) ], [ 'label' => __( 'Brand Name', 'drywall-toolbox' ) ] ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $brand_rows; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_card( ob_get_clean(), [ 'title' => __( 'Canonical Brand IDs', 'drywall-toolbox' ), 'subtitle' => __( 'Read from the live product_brand taxonomy.', 'drywall-toolbox' ) ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
