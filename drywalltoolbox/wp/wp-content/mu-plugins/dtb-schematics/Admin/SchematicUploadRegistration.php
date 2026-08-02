<?php
/**
 * Integrate schematic filesystem registration into the DTB Image Sync screen.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_notices', 'dtb_schematics_render_image_sync_registration_panel' );

function dtb_schematics_render_image_sync_registration_panel(): void {
	if ( ! is_admin() || ! current_user_can( 'upload_files' ) ) {
		return;
	}

	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( (string) $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( 'dtb-image-sync' !== $page ) {
		return;
	}

	$result = null;
	if ( isset( $_POST['dtb_schematic_register_action'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		check_admin_referer( 'dtb_schematic_register_uploads', 'dtb_schematic_register_nonce' );
		$upload_path = isset( $_POST['dtb_schematic_upload_path'] )
			? sanitize_text_field( wp_unslash( (string) $_POST['dtb_schematic_upload_path'] ) )
			: '2026/schematics';
		$dry_run = ! empty( $_POST['dtb_schematic_dry_run'] );
		$limit = isset( $_POST['dtb_schematic_limit'] ) ? absint( $_POST['dtb_schematic_limit'] ) : 100;
		$offset = isset( $_POST['dtb_schematic_offset'] ) ? absint( $_POST['dtb_schematic_offset'] ) : 0;
		$result = dtb_schematics_register_uploads( $upload_path, $dry_run, $limit, $offset );
	}

	?>
	<div class="notice notice-info" style="padding:16px 20px;margin:18px 20px 18px 0;">
		<h2 style="margin-top:0;">DTB Schematic Media Registration</h2>
		<p>Register existing schematic files from <code>wp-content/uploads/2026/schematics/</code> without moving, copying, renaming, or linking them as WooCommerce product images.</p>
		<p><strong>Accepted filename formats:</strong> <code>{schematic-id}--page-{n}.webp</code> / <code>{schematic-id}--preview.webp</code>, or the SKU export format <code>{sku}_SCH-page-{n}.webp</code> / <code>{sku}_SCH-preview.webp</code> (SKU resolved via <code>DTB_SKU_SCHEMATIC_MAP</code>).</p>
		<form method="post">
			<?php wp_nonce_field( 'dtb_schematic_register_uploads', 'dtb_schematic_register_nonce' ); ?>
			<input type="hidden" name="dtb_schematic_register_action" value="register" />
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="dtb_schematic_upload_path">Uploads path</label></th>
					<td><input id="dtb_schematic_upload_path" name="dtb_schematic_upload_path" class="regular-text" value="2026/schematics" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="dtb_schematic_limit">Batch limit</label></th>
					<td><input id="dtb_schematic_limit" name="dtb_schematic_limit" type="number" min="1" max="250" value="100" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="dtb_schematic_offset">Offset</label></th>
					<td><input id="dtb_schematic_offset" name="dtb_schematic_offset" type="number" min="0" value="0" /></td>
				</tr>
			</table>
			<label><input type="checkbox" name="dtb_schematic_dry_run" value="1" checked /> Dry run</label>
			<p class="submit"><button type="submit" class="button button-primary">Register Schematic Uploads</button></p>
		</form>
		<?php if ( is_array( $result ) ) : ?>
			<pre style="white-space:pre-wrap;background:#f6f7f7;padding:12px;overflow:auto;"><?php echo esc_html( wp_json_encode( $result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) ?: '{}' ); ?></pre>
		<?php endif; ?>
	</div>
	<?php
}
