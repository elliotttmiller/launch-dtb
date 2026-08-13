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
	$mode      = dtb_schematics_source_resolution_mode();
	$mode_labels = [
		'manifest_csv'    => __( 'Manifest CSV (schematic_source_manifest.csv found)', 'drywall-toolbox' ),
		'filesystem_scan' => __( 'Filesystem scan (no manifest CSV — deriving from uploaded files directly)', 'drywall-toolbox' ),
		'unavailable'     => __( 'Unavailable — no candidate directory contains a manifest or image files', 'drywall-toolbox' ),
	];

	$rows = [
		[ __( 'Effective Source Resolution Mode', 'drywall-toolbox' ), $mode_labels[ $mode ] ?? $mode ],
		[ __( 'Canonical Source Package Directory (primary)', 'drywall-toolbox' ), dtb_schematics_source_package_dir() ?: '—' ],
		[ __( 'Source Package Reachable', 'drywall-toolbox' ), dtb_schematics_source_package_available() ? __( 'Yes', 'drywall-toolbox' ) : __( 'No', 'drywall-toolbox' ) ],
		[ __( 'Source Manifest Filename (used when present)', 'drywall-toolbox' ), DTB_SCHEMATIC_SOURCE_MANIFEST_FILENAME ],
		[ __( 'Staged/Live Uploads Path (fallback default)', 'drywall-toolbox' ), DTB_SCHEMATIC_RECONCILE_DEFAULT_UPLOAD_PATH ],
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

	// Effective source directory resolution — every candidate directory this
	// runtime will actually search, in priority order, with existence /
	// manifest / file-count facts so an operator can self-diagnose an
	// unreachable source package directly from wp-admin instead of hitting
	// an opaque "source_package_directory_not_found" error.
	$summary = dtb_schematics_source_resolution_summary();
	ob_start();
	echo dtb_admin_ui_table_open(
		[
			[ 'label' => __( 'Candidate Directory (priority order)', 'drywall-toolbox' ) ],
			[ 'label' => __( 'Exists', 'drywall-toolbox' ) ],
			[ 'label' => __( 'Has Manifest CSV', 'drywall-toolbox' ) ],
			[ 'label' => __( 'Image Files Found', 'drywall-toolbox' ) ],
		]
	); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	if ( empty( $summary ) ) {
		echo '<tr class="dtb-table__row"><td class="dtb-table__cell" colspan="4">' . esc_html__( 'No candidate directories resolved at all — wp_upload_dir() may be unavailable in this context.', 'drywall-toolbox' ) . '</td></tr>';
	}
	foreach ( $summary as $entry ) {
		printf(
			'<tr class="dtb-table__row"><td class="dtb-table__cell"><code>%1$s</code></td><td class="dtb-table__cell">%2$s</td><td class="dtb-table__cell">%3$s</td><td class="dtb-table__cell">%4$d</td></tr>',
			esc_html( $entry['directory'] ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			$entry['exists'] ? esc_html__( 'Yes', 'drywall-toolbox' ) : esc_html__( 'No', 'drywall-toolbox' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			$entry['has_manifest_csv'] ? esc_html__( 'Yes', 'drywall-toolbox' ) : esc_html__( 'No', 'drywall-toolbox' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			(int) $entry['image_file_count']
		);
	}
	echo dtb_admin_ui_table_close(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_card(
		ob_get_clean(),
		[
			'title'    => __( 'Effective Source Directory Resolution', 'drywall-toolbox' ),
			'subtitle' => __( 'Every directory this runtime actually searches, in priority order — the first with a manifest CSV wins; otherwise the pipeline derives rows directly from image files found here.', 'drywall-toolbox' ),
		]
	); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

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
