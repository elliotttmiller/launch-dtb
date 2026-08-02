<?php
/**
 * Register filesystem schematic images as WordPress media attachments.
 *
 * Expected filename contract (either form accepted):
 *   {schematic-id}--page-{n}.{ext}
 *   {schematic-id}--preview.{ext}
 *   {sku}_SCH-page-{n}.{ext}       (SKU resolved via DTB_SKU_SCHEMATIC_MAP)
 *   {sku}_SCH-preview.{ext}
 *
 * Files remain in place under wp-content/uploads; no copy or rename occurs.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_schematics_register_uploads( string $upload_path, bool $dry_run = true, int $limit = 100, int $offset = 0 ): array {
	$upload_path = trim( $upload_path, '/' );
	if ( ! preg_match( '#^\d{4}/[a-z0-9-]+$#', $upload_path ) ) {
		return [ 'error' => 'Invalid uploads path.' ];
	}

	$uploads = wp_upload_dir();
	$base_dir = trailingslashit( $uploads['basedir'] );
	$base_url = trailingslashit( $uploads['baseurl'] );
	$directory = $base_dir . $upload_path;
	if ( ! is_dir( $directory ) ) {
		return [ 'error' => 'Uploads directory does not exist.' ];
	}

	$files = glob( trailingslashit( $directory ) . '*.{webp,jpg,jpeg,png,avif,gif}', GLOB_BRACE );
	$files = is_array( $files ) ? array_values( array_filter( $files, 'is_file' ) ) : [];
	sort( $files, SORT_NATURAL | SORT_FLAG_CASE );
	$total = count( $files );
	$batch = array_slice( $files, max( 0, $offset ), max( 1, min( 250, $limit ) ) );

	$result = [
		'upload_path' => $upload_path,
		'dry_run' => $dry_run,
		'total' => $total,
		'processed' => 0,
		'registered' => 0,
		'updated' => 0,
		'skipped' => 0,
		'errors' => [],
		'next_offset' => null,
	];

	foreach ( $batch as $file ) {
		$result['processed']++;
		$parsed = dtb_schematics_parse_upload_filename( basename( $file ) );
		if ( is_wp_error( $parsed ) ) {
			$result['errors'][] = [ 'file' => basename( $file ), 'message' => $parsed->get_error_message() ];
			continue;
		}

		$relative_file = $upload_path . '/' . basename( $file );
		$attachment_id = dtb_schematics_find_attachment_by_relative_file( $relative_file );
		if ( $dry_run ) {
			$result[ $attachment_id ? 'updated' : 'registered' ]++;
			continue;
		}

		if ( ! $attachment_id ) {
			$filetype = wp_check_filetype( basename( $file ), null );
			if ( empty( $filetype['type'] ) || 0 !== strpos( (string) $filetype['type'], 'image/' ) ) {
				$result['errors'][] = [ 'file' => basename( $file ), 'message' => 'Unsupported image MIME type.' ];
				continue;
			}
			$attachment_id = wp_insert_attachment(
				[
					'post_mime_type' => $filetype['type'],
					'post_title' => sanitize_text_field( $parsed['schematic_id'] . ' ' . $parsed['type'] ),
					'post_status' => 'inherit',
				],
				$file
			);
			if ( is_wp_error( $attachment_id ) ) {
				$result['errors'][] = [ 'file' => basename( $file ), 'message' => $attachment_id->get_error_message() ];
				continue;
			}
			update_post_meta( $attachment_id, '_wp_attached_file', $relative_file );
			require_once ABSPATH . 'wp-admin/includes/image.php';
			$metadata = wp_generate_attachment_metadata( $attachment_id, $file );
			if ( is_array( $metadata ) ) {
				wp_update_attachment_metadata( $attachment_id, $metadata );
			}
			$result['registered']++;
		} else {
			$result['updated']++;
		}

		update_post_meta( $attachment_id, '_dtb_schematic_id', $parsed['schematic_id'] );
		update_post_meta( $attachment_id, '_dtb_schematic_type', $parsed['type'] );
		update_post_meta( $attachment_id, '_dtb_schematic_page', $parsed['page'] );
		update_post_meta( $attachment_id, '_dtb_schematic_source_path', $relative_file );
	}

	$next = $offset + count( $batch );
	if ( $next < $total ) {
		$result['next_offset'] = $next;
	}
	if ( ! $dry_run && ( $result['registered'] > 0 || $result['updated'] > 0 ) ) {
		dtb_schematics_manifest_repo_delete_cache();
	}
	return $result;
}

function dtb_schematics_parse_upload_filename( string $filename ) {
	$name = pathinfo( $filename, PATHINFO_FILENAME );
	if ( preg_match( '/^([a-z0-9][a-z0-9-]*)--preview$/', strtolower( $name ), $matches ) ) {
		return [ 'schematic_id' => sanitize_key( $matches[1] ), 'type' => 'preview', 'page' => '1' ];
	}
	if ( preg_match( '/^([a-z0-9][a-z0-9-]*)--page-([1-9][0-9]*)$/', strtolower( $name ), $matches ) ) {
		return [ 'schematic_id' => sanitize_key( $matches[1] ), 'type' => 'diagram', 'page' => (string) absint( $matches[2] ) ];
	}

	$sku_match = dtb_schematics_parse_sku_upload_filename( $name );
	if ( ! is_wp_error( $sku_match ) ) {
		return $sku_match;
	}

	$dura_stilts_match = dtb_schematics_parse_dura_stilts_upload_filename( $name );
	if ( ! is_wp_error( $dura_stilts_match ) ) {
		return $dura_stilts_match;
	}

	$verbose_match = dtb_schematics_parse_verbose_upload_filename( $name );
	if ( ! is_wp_error( $verbose_match ) ) {
		return $verbose_match;
	}

	return new WP_Error( 'dtb_invalid_schematic_filename', 'Filename must match {schematic-id}--page-{n}, {schematic-id}--preview, {sku}_SCH-page-{n}, {verbose-id}-schematic-page-{n}, or model-4-{range}.' );
}

/**
 * Accept the SiteGround export naming convention, which varies in separator and infix
 * across export batches: {sku}_SCH-page-{n}, {sku}_SCH_page_{n}, {sku}_SCH-{n},
 * {sku}_SCH_v{n}_page_{n}, {sku}-page_{n}, {sku}_SCH-preview, etc. Resolves the SKU to a
 * schematic id (and, where the catalog map pins a specific page for that SKU, that page)
 * via DTB_SKU_SCHEMATIC_MAP.
 */
function dtb_schematics_parse_sku_upload_filename( string $name ) {
	if ( preg_match( '/^(.+?)[-_]+sch[-_]+preview$/i', $name, $matches ) ) {
		$sku = strtoupper( $matches[1] );
		if ( ! isset( DTB_SKU_SCHEMATIC_MAP[ $sku ] ) ) {
			return new WP_Error( 'dtb_unknown_schematic_sku', sprintf( 'SKU "%s" is not present in the schematic catalog map.', $sku ) );
		}
		return [ 'schematic_id' => sanitize_key( DTB_SKU_SCHEMATIC_MAP[ $sku ]['schematic_id'] ), 'type' => 'preview', 'page' => '1' ];
	}

	// {sku}_SCH[_v{n}][_page]_{n} — "sch" required, "page" word and version infix optional.
	$matched = preg_match( '/^(.+?)[-_]+sch(?:[-_]+v[0-9]+)?[-_]+(?:page[-_]*)?([0-9]+)$/i', $name, $matches );
	if ( ! $matched ) {
		// {sku}-page_{n} — no "sch" token at all.
		$matched = preg_match( '/^(.+?)[-_]+page[-_]*([0-9]+)$/i', $name, $matches );
	}
	if ( ! $matched ) {
		return new WP_Error( 'dtb_invalid_schematic_filename', 'Filename does not match a known {sku}...page-{n} or {sku}...preview convention.' );
	}

	$sku = strtoupper( $matches[1] );
	if ( ! isset( DTB_SKU_SCHEMATIC_MAP[ $sku ] ) ) {
		return new WP_Error( 'dtb_unknown_schematic_sku', sprintf( 'SKU "%s" is not present in the schematic catalog map.', $sku ) );
	}

	$mapped = DTB_SKU_SCHEMATIC_MAP[ $sku ];
	$page = null !== $mapped['page'] ? (int) $mapped['page'] : absint( $matches[2] );
	return [ 'schematic_id' => sanitize_key( $mapped['schematic_id'] ), 'type' => 'diagram', 'page' => (string) $page ];
}

/**
 * Accept the Columbia/TapeTech/Platinum export convention:
 *   {verbose-schematic-id}-schematic-page-{n}.{ext}   (Columbia/TapeTech)
 *   {name}-page-{n}.{ext}                             (Platinum, underscore-separated)
 * The captured id is normalized (lowercase, non-alphanumeric stripped) and looked up in
 * DTB_VERBOSE_SCHEMATIC_ID_MAP, which always overrides the filename's own page number —
 * each verbose id represents exactly one page of the combined frontend tool.
 */
function dtb_schematics_parse_verbose_upload_filename( string $name ) {
	if ( ! preg_match( '/^(.+?)(?:-schematic)?-page-([0-9]+)$/i', $name, $matches ) ) {
		return new WP_Error( 'dtb_invalid_schematic_filename', 'Filename does not match {verbose-id}-schematic-page-{n} or {name}-page-{n}.' );
	}

	$key = strtolower( preg_replace( '/[^a-z0-9]+/i', '', $matches[1] ) );
	if ( ! isset( DTB_VERBOSE_SCHEMATIC_ID_MAP[ $key ] ) ) {
		return new WP_Error( 'dtb_unknown_verbose_schematic_id', sprintf( 'Verbose schematic id "%s" is not present in the schematic catalog map.', $matches[1] ) );
	}

	$mapped = DTB_VERBOSE_SCHEMATIC_ID_MAP[ $key ];
	return [ 'schematic_id' => sanitize_key( $mapped['schematic_id'] ), 'type' => 'diagram', 'page' => (string) (int) $mapped['page'] ];
}

/**
 * Accept the Dura-Stilts export convention: model-4-{range}.{ext}, e.g. model-4-14-22.webp.
 * Reconstructs the catalog SKU (D{range}) and resolves via DTB_SKU_SCHEMATIC_MAP, which
 * pins each Dura-Stilts size to its correct page of the combined "Dura III" schematic.
 */
function dtb_schematics_parse_dura_stilts_upload_filename( string $name ) {
	if ( ! preg_match( '/^model-4-([0-9]+-[0-9]+)$/i', $name, $matches ) ) {
		return new WP_Error( 'dtb_invalid_schematic_filename', 'Filename does not match model-4-{range}.' );
	}

	$sku = 'D' . $matches[1];
	if ( ! isset( DTB_SKU_SCHEMATIC_MAP[ $sku ] ) ) {
		return new WP_Error( 'dtb_unknown_schematic_sku', sprintf( 'SKU "%s" is not present in the schematic catalog map.', $sku ) );
	}

	$mapped = DTB_SKU_SCHEMATIC_MAP[ $sku ];
	$page = null !== $mapped['page'] ? (int) $mapped['page'] : 1;
	return [ 'schematic_id' => sanitize_key( $mapped['schematic_id'] ), 'type' => 'diagram', 'page' => (string) $page ];
}

function dtb_schematics_find_attachment_by_relative_file( string $relative_file ): int {
	$ids = get_posts(
		[
			'post_type' => 'attachment',
			'post_status' => 'inherit',
			'posts_per_page' => 1,
			'fields' => 'ids',
			'meta_key' => '_wp_attached_file',
			'meta_value' => $relative_file,
		]
	);
	return empty( $ids ) ? 0 : (int) $ids[0];
}

/**
 * AJAX entry point wired into the Schematics admin page (Import & Audit tab).
 * Reuses that page's existing 'dtb_schematics_nonce' and capability check.
 */
add_action( 'wp_ajax_dtb_schematics_register_by_filename', 'dtb_schematics_ajax_register_by_filename' );

function dtb_schematics_ajax_register_by_filename(): void {
	check_ajax_referer( 'dtb_schematics_nonce', 'nonce' );
	if ( ! dtb_schematics_can_manage() ) {
		wp_send_json_error( [ 'message' => 'Insufficient permissions.' ], 403 );
	}

	$upload_path = isset( $_POST['upload_path'] ) ? sanitize_text_field( wp_unslash( (string) $_POST['upload_path'] ) ) : '2026/schematics';
	$dry_run = ! empty( $_POST['dry_run'] );
	$limit = isset( $_POST['limit'] ) ? absint( $_POST['limit'] ) : 100;
	$offset = isset( $_POST['offset'] ) ? absint( $_POST['offset'] ) : 0;

	$result = dtb_schematics_register_uploads( $upload_path, $dry_run, $limit, $offset );

	if ( isset( $result['error'] ) ) {
		wp_send_json_error( [ 'message' => $result['error'] ] );
	}

	wp_send_json_success( $result );
}
