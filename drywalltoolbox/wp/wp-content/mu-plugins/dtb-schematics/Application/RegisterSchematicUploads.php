<?php
/**
 * Register filesystem schematic images as WordPress media attachments.
 *
 * Expected filename contract:
 *   {schematic-id}--page-{n}.{ext}
 *   {schematic-id}--preview.{ext}
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
	return new WP_Error( 'dtb_invalid_schematic_filename', 'Filename must match {schematic-id}--page-{n} or {schematic-id}--preview.' );
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
