<?php
/**
 * DTB_CategoryNormalizer
 *
 * Compatibility normalization for DTB category/display metadata.
 *
 * WooCommerce product_cat is the storefront navigation authority. This class
 * must not recreate that hierarchy or infer category ownership from brand or
 * product-family names. Explicit canonical meta wins; the WC-name map exists
 * only as a conservative legacy fallback for older records.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CategoryNormalizer {

	const CATEGORY_LABELS = [
		'taping'      => 'Taping Tools',
		'finishing'   => 'Finishing Tools',
		'corner'      => 'Corner Tools',
		'handles'     => 'Handles & Extensions',
		'mudboxes'    => 'Pumps & Loading',
		'accessories' => 'Accessories',
		'sanding'     => 'Sanding Tools',
		'stilts'      => 'Stilts',
		'texture'     => 'Texture Tools',
		'parts'       => 'Replacement Parts',
		'services'    => 'Repair Services',
	];

	/** Functional leaf names only. Generic/family labels intentionally omitted. */
	const LEGACY_CATEGORY_MAP = [
		'automatic tapers'              => 'taping',
		'semi-automatic tapers'         => 'taping',
		'nail spotters'                 => 'taping',
		'flat boxes'                    => 'finishing',
		'finishing boxes'               => 'finishing',
		'smoothing blades'              => 'finishing',
		'angle heads'                   => 'corner',
		'corner finishers'              => 'corner',
		'corner rollers'                => 'corner',
		'corner flushers'               => 'corner',
		'compound applicators'          => 'corner',
		'compound tubes'                => 'corner',
		'flat box handles'              => 'handles',
		'extendable handles'            => 'handles',
		'fixed handles'                 => 'handles',
		'loading pumps'                 => 'mudboxes',
		'box fillers'                   => 'mudboxes',
		'goosenecks'                    => 'mudboxes',
		'automatic taping tool sets'    => 'taping',
		'tool cases'                    => 'accessories',
		'accessories & adapters'        => 'accessories',
		'accessories and adapters'      => 'accessories',
		'stilts'                        => 'stilts',
		'parts'                         => 'parts',
		'replacement parts'             => 'parts',
	];

	const CATEGORY_KEY_ALIASES = [
		'corner_tools'     => 'corner',
		'corner-tools'     => 'corner',
		'finishing_boxes'  => 'finishing',
		'finishing-boxes'  => 'finishing',
		'nail_spotters'    => 'taping',
		'nail-spotters'    => 'taping',
		'pumps'            => 'mudboxes',
		'compound_tubes'   => 'corner',
		'compound-tubes'   => 'corner',
		'automatic_tapers' => 'taping',
	];

	const DISPLAY_CATEGORY_LABELS = [
		'automatic_tapers'      => 'Automatic Tapers',
		'semi_automatic_tapers' => 'Semi-Automatic Tapers',
		'nail_spotters'         => 'Nail Spotters',
		'finishing_boxes'       => 'Finishing Boxes',
		'handles'               => 'Handles & Extensions',
		'pumps'                 => 'Pumps & Loading',
		'corner_tools'          => 'Corner Tools',
		'compound_tubes'        => 'Compound Tubes',
		'accessories'           => 'Accessories',
		'smoothing_blades'      => 'Smoothing Blades',
		'toolsets'              => 'Tool Sets & Kits',
		'parts'                 => 'Parts',
		'stilts'                => 'Stilts',
	];

	const DISPLAY_CATEGORY_ALIASES = [
		'automatic_tapers'       => 'automatic_tapers',
		'automatic_taper'        => 'automatic_tapers',
		'auto_taper'             => 'automatic_tapers',
		'semi_automatic_tapers'  => 'semi_automatic_tapers',
		'semi_automatic_taper'   => 'semi_automatic_tapers',
		'nail_spotters'          => 'nail_spotters',
		'nail_spotter'           => 'nail_spotters',
		'nailspotters'           => 'nail_spotters',
		'nailspotter'            => 'nail_spotters',
		'finishing_boxes'        => 'finishing_boxes',
		'finishing_box'          => 'finishing_boxes',
		'flat_boxes'             => 'finishing_boxes',
		'flat_box'               => 'finishing_boxes',
		'handles'                => 'handles',
		'handle'                 => 'handles',
		'handles_extensions'     => 'handles',
		'handles_and_extensions' => 'handles',
		'pumps'                  => 'pumps',
		'pump'                   => 'pumps',
		'loading_pumps'          => 'pumps',
		'loading_pump'           => 'pumps',
		'compound_pump'          => 'pumps',
		'mud_pump'               => 'pumps',
		'corner_tools'           => 'corner_tools',
		'corner_tool'            => 'corner_tools',
		'corner_finisher'        => 'corner_tools',
		'corner_flusher'         => 'corner_tools',
		'corner_roller'          => 'corner_tools',
		'corner_applicator'      => 'corner_tools',
		'angle_head'             => 'corner_tools',
		'compound_tubes'         => 'compound_tubes',
		'compound_tube'          => 'compound_tubes',
		'accessories'            => 'accessories',
		'accessory'              => 'accessories',
		'smoothing_blades'       => 'smoothing_blades',
		'smoothing_blade'        => 'smoothing_blades',
		'skimming_blade'         => 'smoothing_blades',
		'toolsets'               => 'toolsets',
		'toolset'                => 'toolsets',
		'tool_sets_kits'         => 'toolsets',
		'parts'                  => 'parts',
		'part'                   => 'parts',
		'stilts'                 => 'stilts',
		'stilt'                  => 'stilts',
	];

	public static function resolve( array $wc_categories, string $meta_key = '' ): array {
		$key = self::canonical_category_key( $meta_key );
		if ( '' !== $key ) {
			return self::from_key( $key );
		}

		foreach ( $wc_categories as $cat ) {
			$name = strtolower( trim( (string) ( $cat['name'] ?? '' ) ) );
			if ( isset( self::LEGACY_CATEGORY_MAP[ $name ] ) ) {
				return self::from_key( self::LEGACY_CATEGORY_MAP[ $name ] );
			}
		}

		return [ 'key' => '', 'label' => '', 'slug' => '' ];
	}

	public static function canonical_category_key( string $raw ): string {
		$key = strtolower( trim( $raw ) );
		if ( '' === $key ) {
			return '';
		}
		$key = str_replace( '-', '_', sanitize_title_with_dashes( $key ) );
		$key = self::CATEGORY_KEY_ALIASES[ $key ] ?? $key;
		return isset( self::CATEGORY_LABELS[ $key ] ) ? $key : '';
	}

	public static function from_key( string $key ): array {
		$canonical = self::canonical_category_key( $key );
		if ( '' === $canonical ) {
			return [ 'key' => '', 'label' => '', 'slug' => '' ];
		}
		return [
			'key'   => $canonical,
			'label' => self::CATEGORY_LABELS[ $canonical ],
			'slug'  => $canonical,
		];
	}

	public static function is_valid_key( string $key ): bool {
		return '' !== self::canonical_category_key( $key );
	}

	public static function canonical_display_slug( string $raw ): string {
		if ( '' === trim( $raw ) ) {
			return '';
		}
		$lookup = strtolower( trim( preg_replace( '/[^a-z0-9]+/i', '_', $raw ) ?? $raw, '_' ) );
		return self::DISPLAY_CATEGORY_ALIASES[ $lookup ] ?? '';
	}

	public static function display_category_raw_forms( string $canonical_slug ): array {
		$canonical = self::canonical_display_slug( $canonical_slug );
		if ( '' === $canonical ) {
			return [];
		}
		$forms = [ $canonical, str_replace( '_', ' ', $canonical ), ucwords( str_replace( '_', ' ', $canonical ) ) ];
		foreach ( self::DISPLAY_CATEGORY_ALIASES as $raw => $target ) {
			if ( $target === $canonical ) {
				$forms[] = $raw;
				$forms[] = str_replace( '_', ' ', $raw );
			}
		}
		return array_values( array_unique( array_filter( $forms ) ) );
	}
}
