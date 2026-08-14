<?php
/**
 * DTB Schematics — SchematicHotspotDataset value objects (Phase 5).
 *
 * Canonical, backend-owned hotspot dataset shape. Standardizes on the v2
 * model described in docs/_working/schematics_prompt.md "HOTSPOT PIPELINE":
 *
 *   - `parts_catalog` contains unique parts (one entry per distinct part);
 *   - `hotspots` contains physical diagram occurrences (one entry per
 *     physical mark on a diagram page — multiple occurrences may reference
 *     the same part_ref; never collapsed to one-per-part).
 *
 * This file only defines the normalized in-memory shape and light
 * structural validation. Reading/normalizing the 95 source JSON files
 * (legacy `parts`-keyed and native v2 `parts_catalog`/`hotspots`-keyed) is
 * Infrastructure/SchematicHotspotDatasetReader.php. Persisting a normalized
 * dataset is Infrastructure/SchematicHotspotDatasetRepository.php.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_SCHEMATIC_HOTSPOT_SCHEMA_VERSION = 'v2';

/**
 * Normalize a single parts_catalog entry (a unique part).
 *
 * @param array $data {
 *     @type string $part_ref  Stable reference used by hotspot occurrences (e.g. source "id").
 *     @type string $display_id Human-readable part id/number as printed on the diagram legend.
 *     @type string $name       Part name/description.
 *     @type string $sku        Source SKU as recorded in the dataset (may be empty; not necessarily a live WooCommerce SKU).
 *     @type string $source_sku Alternate/legacy SKU field seen in some source files.
 *     @type float  $quantity   Quantity used at this occurrence's context, 0 if unknown.
 *     @type string $notes      Optional free-text notes.
 * }
 */
function dtb_schematic_hotspot_part_make( array $data ): array {
	return [
		'part_ref'   => sanitize_text_field( (string) ( $data['part_ref'] ?? '' ) ),
		'display_id' => sanitize_text_field( (string) ( $data['display_id'] ?? '' ) ),
		'name'       => sanitize_text_field( (string) ( $data['name'] ?? '' ) ),
		'sku'        => sanitize_text_field( (string) ( $data['sku'] ?? '' ) ),
		'source_sku' => sanitize_text_field( (string) ( $data['source_sku'] ?? '' ) ),
		'quantity'   => max( 0, (float) ( $data['quantity'] ?? 0 ) ),
		'notes'      => sanitize_text_field( (string) ( $data['notes'] ?? '' ) ),
	];
}

/**
 * Normalize a single hotspot occurrence (a physical mark on a diagram page).
 *
 * Coordinates use one canonical 0..100 percentage contract. x_pct/y_pct are
 * the visual center of the hit region; width_pct/height_pct are its complete
 * size. Source readers are responsible for translating shape-specific source
 * geometry into this contract before persistence.
 *
 * @param array $data {
 *     @type string $hotspot_id Stable ID for this physical occurrence (immutable once migrated).
 *     @type string $part_ref   References a parts_catalog entry's part_ref. Not required to be unique across hotspots.
 *     @type int    $page       1-based page number within the schematic (matches SchematicPageDefinition page_number).
 *     @type string $shape_type One of rect|circle|polygon|point.
 *     @type array  $coordinates Normalized coordinate payload, shape-dependent (see dtb_schematic_hotspot_normalize_coordinates()).
 *     @type string $label      Optional display label/override distinct from the part name.
 * }
 */
function dtb_schematic_hotspot_occurrence_make( array $data ): array {
	return [
		'hotspot_id'  => sanitize_text_field( (string) ( $data['hotspot_id'] ?? '' ) ),
		'part_ref'    => sanitize_text_field( (string) ( $data['part_ref'] ?? '' ) ),
		'page'        => max( 1, (int) ( $data['page'] ?? 1 ) ),
		'shape_type'  => dtb_schematic_hotspot_normalize_shape_type( (string) ( $data['shape_type'] ?? 'point' ) ),
		'coordinates' => dtb_schematic_hotspot_normalize_coordinates( is_array( $data['coordinates'] ?? null ) ? $data['coordinates'] : [] ),
		'label'       => sanitize_text_field( (string) ( $data['label'] ?? '' ) ),
	];
}

function dtb_schematic_hotspot_normalize_shape_type( string $type ): string {
	$valid = [ 'rect', 'circle', 'polygon', 'point' ];
	$type  = strtolower( trim( $type ) );
	return in_array( $type, $valid, true ) ? $type : 'point';
}

/**
 * Coordinates are stored as a flat, shape-agnostic map of normalized
 * (percentage-of-page, 0..100) numeric fields. Unknown/absent fields are
 * dropped rather than defaulted to zero or image-center — callers
 * (Rest/SchematicPublicApiController.php, the future frontend) must treat a
 * missing coordinate as invalid rather than silently rendering at (0,0)/center.
 */
function dtb_schematic_hotspot_normalize_coordinates( array $raw ): array {
	$allowed = [ 'x_pct', 'y_pct', 'width_pct', 'height_pct', 'r_pct_w', 'r_pct_h', 'points_pct' ];
	$out     = [];
	foreach ( $allowed as $key ) {
		if ( ! array_key_exists( $key, $raw ) ) {
			continue;
		}
		if ( 'points_pct' === $key ) {
			if ( is_array( $raw[ $key ] ) ) {
				$points = [];
				foreach ( $raw[ $key ] as $point ) {
					if ( is_array( $point ) && count( $point ) >= 2 ) {
						$points[] = [ (float) $point[0], (float) $point[1] ];
					}
				}
				if ( ! empty( $points ) ) {
					$out[ $key ] = $points;
				}
			}
			continue;
		}
		if ( is_numeric( $raw[ $key ] ) ) {
			$out[ $key ] = (float) $raw[ $key ];
		}
	}
	return $out;
}

/**
 * Whether a normalized hotspot occurrence carries usable coordinate data.
 * Used by the public API / future frontend to decide whether to render an
 * occurrence at all rather than defaulting invalid coordinates to center.
 */
function dtb_schematic_hotspot_occurrence_has_valid_coordinates( array $occurrence ): bool {
	$coords = $occurrence['coordinates'] ?? [];
	if ( ! empty( $coords['points_pct'] ) ) {
		return true;
	}
	if ( isset( $coords['x_pct'], $coords['y_pct'] ) ) {
		return true;
	}
	if ( isset( $coords['x_pct'], $coords['y_pct'], $coords['width_pct'], $coords['height_pct'] ) ) {
		return true;
	}
	if ( isset( $coords['r_pct_w'], $coords['r_pct_h'] ) && isset( $coords['x_pct'], $coords['y_pct'] ) ) {
		return true;
	}
	return false;
}

/**
 * Build/normalize a full canonical hotspot dataset for one schematic
 * (potentially spanning multiple pages).
 *
 * @param array $data {
 *     @type string $schema_version    Always DTB_SCHEMATIC_HOTSPOT_SCHEMA_VERSION after normalization.
 *     @type string $source_schema     'legacy' or 'v2' — which source shape this was migrated from.
 *     @type string $checksum          sha256 of the normalized payload, used as the dataset version.
 *     @type array  $parts_catalog     List of dtb_schematic_hotspot_part_make() entries, unique by part_ref.
 *     @type array  $hotspots          List of dtb_schematic_hotspot_occurrence_make() entries.
 * }
 */
function dtb_schematic_hotspot_dataset_make( array $data ): array {
	$parts_catalog = [];
	$seen_refs     = [];
	foreach ( (array) ( $data['parts_catalog'] ?? [] ) as $part ) {
		$normalized = dtb_schematic_hotspot_part_make( is_array( $part ) ? $part : [] );
		if ( '' === $normalized['part_ref'] || isset( $seen_refs[ $normalized['part_ref'] ] ) ) {
			continue;
		}
		$seen_refs[ $normalized['part_ref'] ] = true;
		$parts_catalog[]                      = $normalized;
	}

	$hotspots = [];
	foreach ( (array) ( $data['hotspots'] ?? [] ) as $hotspot ) {
		$normalized = dtb_schematic_hotspot_occurrence_make( is_array( $hotspot ) ? $hotspot : [] );
		if ( '' === $normalized['hotspot_id'] ) {
			continue; // Never collapse/synthesize — an occurrence without a stable ID is dropped, not merged into another.
		}
		$hotspots[] = $normalized;
	}

	return [
		'schema_version' => DTB_SCHEMATIC_HOTSPOT_SCHEMA_VERSION,
		'source_schema'  => in_array( ( $data['source_schema'] ?? '' ), [ 'legacy', 'v2' ], true ) ? $data['source_schema'] : 'v2',
		'checksum'       => preg_replace( '/[^a-f0-9]/i', '', (string) ( $data['checksum'] ?? '' ) ),
		'parts_catalog'  => $parts_catalog,
		'hotspots'       => $hotspots,
	];
}

/**
 * Hotspot occurrences targeting a specific page number.
 */
function dtb_schematic_hotspot_dataset_occurrences_for_page( array $dataset, int $page_number ): array {
	return array_values(
		array_filter(
			(array) ( $dataset['hotspots'] ?? [] ),
			static fn( $h ) => (int) ( $h['page'] ?? 0 ) === $page_number
		)
	);
}

/**
 * Count of hotspot occurrences referencing a given part_ref (used to
 * populate SchematicPartRelationship::occurrence_count).
 */
function dtb_schematic_hotspot_dataset_occurrence_count_for_part( array $dataset, string $part_ref ): int {
	$count = 0;
	foreach ( (array) ( $dataset['hotspots'] ?? [] ) as $hotspot ) {
		if ( ( $hotspot['part_ref'] ?? '' ) === $part_ref ) {
			$count++;
		}
	}
	return $count;
}
