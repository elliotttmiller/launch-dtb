<?php
/**
 * DTB Schematics — SchematicHotspotDatasetRepository (Phase 5).
 *
 * Persists the normalized canonical hotspot dataset (Domain/SchematicHotspotDataset.php)
 * for a schematic record. Storage mechanism: a single postmeta blob per
 * schematic record, `_dtb_schematic_hotspot_data`, mirroring how Phase 2
 * stored `_dtb_schematic_pages` — the simplest WordPress-compatible
 * mechanism consistent with the rest of this module, with no new table and
 * no new generic media platform.
 *
 * This is intentionally a separate meta key from `_dtb_schematic_hotspot_dataset`
 * (the Phase 2 *relationship pointer* written by
 * Application/ManageSchematicRecord.php::dtb_schematic_associate_hotspot_dataset()).
 * The pointer says *where* the dataset comes from and its checksum/version;
 * this repository holds the actual normalized occurrence content. Only
 * Application/MigrateSchematicHotspotDatasets.php writes here, and it always
 * also calls dtb_schematic_associate_hotspot_dataset() so the two stay in
 * sync — never a second competing relationship authority.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_SCHEMATIC_HOTSPOT_DATA_META_KEY = '_dtb_schematic_hotspot_data';

/**
 * Persist the normalized dataset for a schematic record.
 */
function dtb_schematic_hotspot_dataset_repo_save( int $schematic_post_id, array $dataset ): bool {
	$normalized = dtb_schematic_hotspot_dataset_make( $dataset );
	return (bool) update_post_meta( $schematic_post_id, DTB_SCHEMATIC_HOTSPOT_DATA_META_KEY, $normalized );
}

/**
 * Fetch the normalized dataset for a schematic record, or null if none has
 * been migrated yet.
 */
function dtb_schematic_hotspot_dataset_repo_get( int $schematic_post_id ): ?array {
	$raw = get_post_meta( $schematic_post_id, DTB_SCHEMATIC_HOTSPOT_DATA_META_KEY, true );
	if ( ! is_array( $raw ) || empty( $raw ) ) {
		return null;
	}
	return dtb_schematic_hotspot_dataset_make( $raw );
}

function dtb_schematic_hotspot_dataset_repo_delete( int $schematic_post_id ): bool {
	return delete_post_meta( $schematic_post_id, DTB_SCHEMATIC_HOTSPOT_DATA_META_KEY );
}
