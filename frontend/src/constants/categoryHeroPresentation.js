/**
 * Category hero media presentation modes.
 *
 * This is presentation metadata only. It must never encode taxonomy, product,
 * pricing, inventory, compatibility, or other commerce truth. Slugs map to a
 * small bounded set of composition modes based on the geometry of the current
 * transparent hero artwork.
 */
export const CATEGORY_HERO_PRESENTATIONS = Object.freeze({
  STANDARD: 'standard',
  WIDE: 'wide',
  TALL: 'tall',
  COMPACT: 'compact',
  OVERSIZED: 'oversized',
});

const CATEGORY_HERO_PRESENTATION_BY_SLUG = Object.freeze({
  'automatic-tapers': CATEGORY_HERO_PRESENTATIONS.WIDE,
  'compound-tubes': CATEGORY_HERO_PRESENTATIONS.WIDE,
  'handles-extensions': CATEGORY_HERO_PRESENTATIONS.WIDE,

  stilts: CATEGORY_HERO_PRESENTATIONS.TALL,
  'loading-compound-pumps': CATEGORY_HERO_PRESENTATIONS.TALL,
  'loading-pumps': CATEGORY_HERO_PRESENTATIONS.TALL,

  'applicator-heads': CATEGORY_HERO_PRESENTATIONS.COMPACT,
  'corner-finishers': CATEGORY_HERO_PRESENTATIONS.COMPACT,
  'corner-flushers': CATEGORY_HERO_PRESENTATIONS.COMPACT,
  'corner-rollers': CATEGORY_HERO_PRESENTATIONS.COMPACT,
  'nail-spotters': CATEGORY_HERO_PRESENTATIONS.COMPACT,

  'flat-boxes': CATEGORY_HERO_PRESENTATIONS.OVERSIZED,
});

export function resolveCategoryHeroPresentation(slug) {
  return CATEGORY_HERO_PRESENTATION_BY_SLUG[slug] || CATEGORY_HERO_PRESENTATIONS.STANDARD;
}
