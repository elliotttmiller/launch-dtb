<?php
/**
 * DTB_ToolFamilyResolver
 *
 * Determines the canonical tool family key for a product.
 *
 * Priority:
 *   1. _dtb_tool_family meta (explicit) — always wins if set and valid.
 *   2. _dtb_builder_slots meta — infer family from the first slot's allowed families.
 *   3. Exact display-category classification when that category maps one-to-one.
 *   4. Narrow broad-category heuristic for categories that map one-to-one.
 *   5. Product-name keyword heuristic — last resort, transition only.
 *
 * Broad categories such as taping, finishing, corner, handles, and mudboxes are
 * intentionally NOT mapped directly because each contains multiple distinct
 * tool families. Ambiguous classifications remain unassigned instead of being
 * guessed.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_ToolFamilyResolver {

	/**
	 * Exact display category → tool family mappings.
	 *
	 * Only one-to-one mappings belong here. Ambiguous display categories such
	 * as handles, toolsets, semi-automatic tapers/banjos, and mixed
	 * gooseneck/filler-adapter buckets are intentionally omitted.
	 *
	 * @var array<string, string>
	 */
	const DISPLAY_CATEGORY_FAMILY_HINTS = [
		'automatic_tapers'          => DTB_ToolFamilies::AUTOMATIC_TAPER,
		'flat_boxes'                => DTB_ToolFamilies::FLAT_BOX,
		'corner_finishers'          => DTB_ToolFamilies::ANGLE_HEAD,
		'automatic_corner_rollers'  => DTB_ToolFamilies::CORNER_ROLLER,
		'automatic_loading_pumps'   => DTB_ToolFamilies::PUMP,
		'smoothing_blades'          => DTB_ToolFamilies::SKIMMING_BLADE,
		'parts'                     => DTB_ToolFamilies::REPLACEMENT_PART,
		'stilts'                    => DTB_ToolFamilies::STILT,
	];

	/**
	 * Broad DTB category → default family mappings.
	 *
	 * Keep this list limited to categories that represent one functional family.
	 * Multi-family categories must remain unresolved until stronger evidence
	 * (explicit meta, builder slot, exact display category, or name) exists.
	 *
	 * @var array<string, string>
	 */
	const CATEGORY_FAMILY_HINTS = [
		'sanding'  => DTB_ToolFamilies::ACCESSORY,
		'stilts'   => DTB_ToolFamilies::STILT,
		'texture'  => DTB_ToolFamilies::SPRAYER,
		'parts'    => DTB_ToolFamilies::REPLACEMENT_PART,
		'services' => DTB_ToolFamilies::SERVICE,
	];

	/**
	 * Keyword → tool family mapping used only as a fallback heuristic.
	 * Kept intentionally narrow so it does not over-classify.
	 *
	 * @var array<string, string>
	 */
	const NAME_KEYWORD_HINTS = [
		'automatic taper' => DTB_ToolFamilies::AUTOMATIC_TAPER,
		'flat box'        => DTB_ToolFamilies::FLAT_BOX,
		'finishing box'   => DTB_ToolFamilies::FLAT_BOX,
		'skimming box'    => DTB_ToolFamilies::FLAT_BOX,
		'fat boy'         => DTB_ToolFamilies::FLAT_BOX,
		'angle head'      => DTB_ToolFamilies::ANGLE_HEAD,
		'corner applicator' => DTB_ToolFamilies::CORNER_BOX,
		'corner box'      => DTB_ToolFamilies::CORNER_BOX,
		'box handle'      => DTB_ToolFamilies::FLAT_BOX_HANDLE,
		'angle head handle' => DTB_ToolFamilies::ANGLE_HEAD_HANDLE,
		'corner roller'   => DTB_ToolFamilies::CORNER_ROLLER,
		'inside corner roller' => DTB_ToolFamilies::CORNER_ROLLER,
		'loading pump'    => DTB_ToolFamilies::PUMP,
		'hot mud pump'    => DTB_ToolFamilies::PUMP,
		'gooseneck'       => DTB_ToolFamilies::GOOSENECK,
		'filler adapter'  => DTB_ToolFamilies::FILLER_ADAPTER,
		'box filler'      => DTB_ToolFamilies::FILLER_ADAPTER,
		'skimming blade'  => DTB_ToolFamilies::SKIMMING_BLADE,
	];

	/**
	 * Resolve the tool family for a product.
	 *
	 * @param  string   $meta_family          _dtb_tool_family meta value (may be empty).
	 * @param  string[] $builder_slots        _dtb_builder_slots meta (decoded array).
	 * @param  string   $category_key         Resolved broad DTB category key.
	 * @param  string   $display_category_key Canonical display category key.
	 * @param  string   $product_name         Raw product name.
	 * @param  bool     $is_parts             Whether this is a replacement part.
	 * @return string   Tool family key, or empty string if undetermined.
	 */
	public static function resolve(
		string $meta_family,
		array  $builder_slots,
		string $category_key,
		string $display_category_key,
		string $product_name,
		bool   $is_parts = false
	): string {
		// 1. Explicit meta — always authoritative.
		if ( '' !== $meta_family && DTB_ToolFamilies::is_valid( $meta_family ) ) {
			return $meta_family;
		}

		// Known parts are never tool-family candidates for customer tool slots.
		if ( $is_parts ) {
			return DTB_ToolFamilies::REPLACEMENT_PART;
		}

		// 2. Infer from builder slots meta.
		if ( ! empty( $builder_slots ) ) {
			$first_slot    = $builder_slots[0];
			$slot_families = DTB_ToolFamilies::families_for_slot( $first_slot );
			if ( ! empty( $slot_families ) ) {
				return $slot_families[0];
			}
		}

		// 3. Exact display-category classification.
		$display_category_key = DTB_CategoryNormalizer::canonical_display_slug( $display_category_key );
		if (
			'' !== $display_category_key
			&& isset( self::DISPLAY_CATEGORY_FAMILY_HINTS[ $display_category_key ] )
		) {
			return self::DISPLAY_CATEGORY_FAMILY_HINTS[ $display_category_key ];
		}

		// Explicitly ambiguous/non-automatic taper buckets must not fall through
		// to the "automatic taper" name heuristic.
		if ( in_array( $display_category_key, [ 'toolsets', 'semi_automatic_tapers_banjos' ], true ) ) {
			return '';
		}

		// 4. Narrow broad-category heuristic.
		if ( '' !== $category_key && isset( self::CATEGORY_FAMILY_HINTS[ $category_key ] ) ) {
			return self::CATEGORY_FAMILY_HINTS[ $category_key ];
		}

		// 5. Name keyword heuristic (transition only — avoid over-classifying).
		$lower = strtolower( $product_name );

		// "Semi Automatic Taper" contains the substring "automatic taper" but is
		// a different product class and must never enter the automatic-taper slot.
		if ( preg_match( '/\bsemi[-\s]?automatic\b.*\btaper\b/i', $lower ) ) {
			return '';
		}

		foreach ( self::NAME_KEYWORD_HINTS as $keyword => $family ) {
			if ( str_contains( $lower, $keyword ) ) {
				return $family;
			}
		}

		return '';
	}
}
