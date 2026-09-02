<?php
/**
 * Idempotent runtime repairs for canonical WooCommerce product_cat identity.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CatalogTaxonomyMigration {

	private const OPTION_VERSION = 'dtb_catalog_taxonomy_migration_version';
	private const VERSION        = 1;
	private const BATCH_SIZE     = 100;

	public static function maybe_run(): void {
		if ( (int) get_option( self::OPTION_VERSION, 0 ) >= self::VERSION || ! taxonomy_exists( 'product_cat' ) ) {
			return;
		}

		$result = self::migrate_goosenecks_term();
		if ( is_wp_error( $result ) ) {
			if ( class_exists( 'DTB_Logger' ) ) {
				DTB_Logger::error( 'Catalog taxonomy migration failed', [
					'version' => self::VERSION,
					'code'    => $result->get_error_code(),
				] );
			}
			return;
		}

		update_option( self::OPTION_VERSION, self::VERSION, false );
		dtb_catalog_cache_invalidate_all();
	}

	/** @return true|WP_Error */
	private static function migrate_goosenecks_term() {
		$root = get_term_by( 'slug', 'taping-finishing-tools', 'product_cat' );
		if ( ! $root instanceof WP_Term ) {
			return new WP_Error( 'catalog_taxonomy_root_missing', 'Canonical Taping & Finishing Tools category is missing.' );
		}

		$canonical = get_term_by( 'slug', 'goosenecks-box-fillers-adapters', 'product_cat' );
		$legacy    = get_term_by( 'slug', 'goosenecks', 'product_cat' );

		if ( ! $canonical instanceof WP_Term && $legacy instanceof WP_Term ) {
			$updated = wp_update_term( $legacy->term_id, 'product_cat', [
				'name'   => 'Goosenecks, Box Fillers & Adapters',
				'slug'   => 'goosenecks-box-fillers-adapters',
				'parent' => $root->term_id,
			] );
			if ( is_wp_error( $updated ) ) {
				return $updated;
			}
			$canonical = get_term( absint( $updated['term_id'] ?? 0 ), 'product_cat' );
			$legacy    = false;
		}

		$split_term = get_term_by( 'slug', 'box-fillers-adapters', 'product_cat' );
		if ( ! $canonical instanceof WP_Term && $split_term instanceof WP_Term ) {
			$inserted = wp_insert_term( 'Goosenecks, Box Fillers & Adapters', 'product_cat', [
				'slug'   => 'goosenecks-box-fillers-adapters',
				'parent' => $root->term_id,
			] );
			if ( is_wp_error( $inserted ) ) {
				return $inserted;
			}
			$canonical = get_term( absint( $inserted['term_id'] ?? 0 ), 'product_cat' );
		}

		if ( ! $canonical instanceof WP_Term ) {
			// No affected runtime terms exist yet; a later catalog import may create them.
			return true;
		}

		foreach ( [ $legacy, $split_term ] as $source ) {
			if ( ! $source instanceof WP_Term || (int) $source->term_id === (int) $canonical->term_id ) {
				continue;
			}

			$merged = self::merge_term( $source, $canonical );
			if ( is_wp_error( $merged ) ) {
				return $merged;
			}
		}

		clean_term_cache( [ $root->term_id, $canonical->term_id ], 'product_cat' );
		return true;
	}

	/** @return true|WP_Error */
	private static function merge_term( WP_Term $source, WP_Term $target ) {
		self::copy_term_media_if_missing( $source, $target );

		$page = 1;
		do {
			$object_ids = get_posts( [
				'post_type'              => [ 'product', 'product_variation' ],
				'post_status'            => 'any',
				'fields'                 => 'ids',
				'posts_per_page'         => self::BATCH_SIZE,
				'paged'                  => $page,
				'orderby'                => 'ID',
				'order'                  => 'ASC',
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				'tax_query'              => [
					[
						'taxonomy' => 'product_cat',
						'field'    => 'term_id',
						'terms'    => [ $source->term_id ],
					],
				],
			] );

			foreach ( $object_ids as $object_id ) {
				$result = wp_set_object_terms( absint( $object_id ), [ $target->term_id ], 'product_cat', true );
				if ( is_wp_error( $result ) ) {
					return $result;
				}
			}

			$page++;
		} while ( count( $object_ids ) === self::BATCH_SIZE );

		$deleted = wp_delete_term( $source->term_id, 'product_cat' );
		return is_wp_error( $deleted ) ? $deleted : true;
	}

	private static function copy_term_media_if_missing( WP_Term $source, WP_Term $target ): void {
		foreach ( [ 'thumbnail_id', 'dtb_hero_image_id' ] as $meta_key ) {
			if ( get_term_meta( $target->term_id, $meta_key, true ) ) {
				continue;
			}
			$value = get_term_meta( $source->term_id, $meta_key, true );
			if ( '' !== $value && null !== $value ) {
				update_term_meta( $target->term_id, $meta_key, $value );
			}
		}
	}
}
