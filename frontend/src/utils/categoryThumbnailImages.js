const CATEGORY_THUMBNAIL_ROOT = '/wp-content/uploads/2026/categories/thumbnails';

const CATEGORY_THUMBNAIL_SLUGS = new Set([
  'angle-heads',
  'automatic-tapers',
  'automatic-taping-tool-cases',
  'automatic-taping-tool-sets',
  'automatic-taping-tools',
  'angle-boxes',
  'box-fillers',
  'compound-applicators',
  'compound-tubes',
  'corner-boxes',
  'corner-flushers',
  'corner-rollers',
  'corner-tool-handles',
  'extendable-handles',
  'fixed-handles',
  'flat-box-handles',
  'flat-boxes',
  'goosenecks',
  'loading-pumps',
  'nail-spotters',
  'taping-tool-accessories',
  'tool-cases',
  'semi-automatic-accessories',
  'semi-automatic-tapers',
  'semi-automatic-taping-tool-sets',
  'semi-automatic-taping-tools',
  'semi-automatic-tools',
  'semi-automatic-tool-cases',
]);

const CATEGORY_THUMBNAIL_FILE_BY_SLUG = {
  'angle-boxes': 'corner-boxes',
  'angle-boxes-corner-applicators': 'corner-boxes',
  'angle-heads-corner-finishers': 'angle-heads',
  'corner-tool-handles': 'fixed-handles',
  'goosenecks-box-fillers': 'box-fillers',
  'handles-extensions': 'extendable-handles',
  'semi-automatic-taping-tool-accessories': 'semi-automatic-accessories',
  'semi-automatic-tools': 'semi-automatic-taping-tools',
  'taping-tool-accessories': 'semi-automatic-accessories',
  'tool-cases': 'automatic-taping-tool-cases',
  'tool-sets': 'semi-automatic-taping-tool-sets',
  'tool-sets-automatic-taping-tools': 'automatic-taping-tool-sets',
};

export function resolveCategoryThumbnail(category) {
  const slug = String(category?.slug || category?.key || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');

  const thumbnailSlug = CATEGORY_THUMBNAIL_FILE_BY_SLUG[slug] || slug;
  if (CATEGORY_THUMBNAIL_SLUGS.has(thumbnailSlug)) {
    return `${CATEGORY_THUMBNAIL_ROOT}/${thumbnailSlug}.webp`;
  }

  return category?.image || '';
}
