<?php
/**
 * DTB_BrandNormalizer
 *
 * Maps raw brand strings (from WC categories, attributes, meta, or CSV) into
 * the canonical DTB brand identity: { key, label, slug }.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_BrandNormalizer {

	/**
	 * Canonical brand label → slug key.
	 * Slug is used in URLs (e.g. /products?brand=tapetech).
	 *
	 * @var array<string, string>
	 */
	const BRAND_TO_SLUG = [
		'TapeTech'               => 'tapetech',
		'Columbia Tools'         => 'columbia-taping-tools',
		'Asgard'                 => 'asgard',
		'SurPro'                 => 'surpro',
		'Graco'                  => 'graco',
		'Platinum Drywall Tools' => 'platinum',
		'Dura-Stilts'            => 'dura-stilts',
		'Level 5'                => 'level5',
	];

	/**
	 * Alias → canonical label.
	 * Covers common CSV/import variants that are not themselves canonical.
	 *
	 * @var array<string, string>
	 */
	const BRAND_ALIASES = [
		'Columbia'                => 'Columbia Tools',
		'columbia'                => 'Columbia Tools',
		'COLUMBIA'                => 'Columbia Tools',
		'Columbia Taping Tools'   => 'Columbia Tools',
		'columbia taping tools'   => 'Columbia Tools',
		'COLUMBIA TAPING TOOLS'   => 'Columbia Tools',
		'columbia-taping-tools'   => 'Columbia Tools',
		'columbia-tools'          => 'Columbia Tools',
		'TAPETECH'                => 'TapeTech',
		'Tape Tech'               => 'TapeTech',
		'LEVEL 5'                 => 'Level 5',
		'level 5'                 => 'Level 5',
		'Level5'                  => 'Level 5',
		'GRACO'                   => 'Graco',
		'SURPRO'                  => 'SurPro',
		'Sur-Pro'                 => 'SurPro',
		'SUR PRO'                 => 'SurPro',
		'DURA-STILTS'             => 'Dura-Stilts',
		'Dura Stilts'             => 'Dura-Stilts',
		'ASGARD'                  => 'Asgard',
		'Platinum'                => 'Platinum Drywall Tools',
		'PLATINUM'                => 'Platinum Drywall Tools',
	];

	/**
	 * Non-canonical slug aliases mapped to canonical slugs.
	 *
	 * @var array<string, string>
	 */
	const SLUG_ALIASES = [
		'columbia-tools' => 'columbia-taping-tools',
	];

	/**
	 * Normalize a raw brand string to the canonical { key, label, slug } tuple.
	 *
	 * Resolution order:
	 *   1. Alias → canonical label.
	 *   2. Exact canonical label in BRAND_TO_SLUG.
	 *   3. Case-insensitive alias/canonical scan.
	 *   4. Unknown brand → derive slug from sanitize_title().
	 *
	 * @param  string $raw Raw brand string.
	 * @return array{ key: string, label: string, slug: string }
	 */
	public static function normalize( string $raw ): array {
		$raw = trim( $raw );
		if ( '' === $raw ) {
			return [ 'key' => '', 'label' => '', 'slug' => '' ];
		}

		if ( isset( self::BRAND_ALIASES[ $raw ] ) ) {
			$canonical = self::BRAND_ALIASES[ $raw ];
			$slug      = self::BRAND_TO_SLUG[ $canonical ] ?? sanitize_title( $canonical );
			return [ 'key' => $slug, 'label' => $canonical, 'slug' => $slug ];
		}

		if ( isset( self::BRAND_TO_SLUG[ $raw ] ) ) {
			$slug = self::BRAND_TO_SLUG[ $raw ];
			return [ 'key' => $slug, 'label' => $raw, 'slug' => $slug ];
		}

		$lower = strtolower( $raw );
		foreach ( self::BRAND_ALIASES as $alias => $canonical ) {
			if ( strtolower( $alias ) === $lower ) {
				$slug = self::BRAND_TO_SLUG[ $canonical ] ?? sanitize_title( $canonical );
				return [ 'key' => $slug, 'label' => $canonical, 'slug' => $slug ];
			}
		}
		foreach ( self::BRAND_TO_SLUG as $label => $slug ) {
			if ( strtolower( $label ) === $lower ) {
				return [ 'key' => $slug, 'label' => $label, 'slug' => $slug ];
			}
		}

		$slug = sanitize_title( $raw );
		return [ 'key' => $slug, 'label' => $raw, 'slug' => $slug ];
	}

	/**
	 * Normalize a URL brand slug to the canonical label.
	 *
	 * @param  string $slug
	 * @return string Canonical label, or empty string if not found.
	 */
	public static function label_from_slug( string $slug ): string {
		$slug = self::canonical_slug( $slug );
		foreach ( self::BRAND_TO_SLUG as $label => $canonical_slug ) {
			if ( $canonical_slug === $slug ) {
				return $label;
			}
		}
		return '';
	}

	/**
	 * Return every bounded metadata value accepted as the same canonical brand.
	 *
	 * This is a read-compatibility contract for catalog queries. Canonical writes
	 * still use the single canonical key/label; legacy aliases are only included
	 * so older imported records are not silently omitted from brand storefronts.
	 *
	 * @param string $slug URL/canonical brand slug.
	 * @return array{ keys: string[], labels: string[] }
	 */
	public static function query_identity_values( string $slug ): array {
		$canonical_slug  = self::canonical_slug( $slug );
		$canonical_label = self::label_from_slug( $canonical_slug );

		if ( '' === $canonical_label ) {
			return [
				'keys'   => '' !== $canonical_slug ? [ $canonical_slug ] : [],
				'labels' => [],
			];
		}

		$keys   = [ $canonical_slug ];
		$labels = [ $canonical_label ];

		foreach ( self::SLUG_ALIASES as $alias_slug => $target_slug ) {
			if ( $target_slug === $canonical_slug ) {
				$keys[] = $alias_slug;
			}
		}

		foreach ( self::BRAND_ALIASES as $alias => $target_label ) {
			if ( $target_label !== $canonical_label ) {
				continue;
			}
			$labels[] = $alias;
			$alias_slug = sanitize_title( $alias );
			if ( '' !== $alias_slug ) {
				$keys[] = $alias_slug;
			}
		}

		return [
			'keys'   => array_values( array_unique( array_filter( $keys ) ) ),
			'labels' => array_values( array_unique( array_filter( $labels ) ) ),
		];
	}

	/** Returns true when $slug is a known canonical brand slug. */
	public static function is_known_slug( string $slug ): bool {
		return in_array( self::canonical_slug( $slug ), array_values( self::BRAND_TO_SLUG ), true );
	}

	private static function canonical_slug( string $slug ): string {
		$slug = strtolower( trim( $slug ) );
		return self::SLUG_ALIASES[ $slug ] ?? $slug;
	}
}
