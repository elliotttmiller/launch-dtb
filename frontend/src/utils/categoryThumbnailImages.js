const CATEGORY_THUMBNAIL_ROOT = '/wp-content/uploads/2026/categories/thumbnails';

const CATEGORY_THUMBNAIL_URL_BY_SLUG = {
  'corner-finishers': 'https://drywalltoolbox.com/wp/wp-content/uploads/2026/categories/thumbnails/corner-finishers.webp',
  'powered-compound-applicators': 'https://drywalltoolbox.com/wp/wp-content/uploads/2026/media/tapetech_14tt_01.webp',
};

// Keep decoded category thumbnails resident for the lifetime of the storefront
// session. The mega-menu keeps visited renderers mounted, but the same thumbnail
// resolver is also used by other storefront surfaces and can still create fresh
// <img> elements. Warming each resolved URL once avoids repeated fetch/decode
// work and gives subsequent renderers an already-resident browser image without
// introducing a second catalog or media authority.
const CATEGORY_THUMBNAIL_PRELOADS = new Map();

function warmCategoryThumbnail(url) {
  if (!url || typeof window === 'undefined' || typeof Image === 'undefined') return url;
  if (CATEGORY_THUMBNAIL_PRELOADS.has(url)) return url;

  const preload = { image: null, status: 'scheduled' };
  CATEGORY_THUMBNAIL_PRELOADS.set(url, preload);

  const start = () => {
    const image = new Image();
    preload.image = image;
    preload.status = 'loading';
    image.decoding = 'async';
    image.onload = () => {
      preload.status = 'ready';
      image.decode?.().catch(() => {});
    };
    image.onerror = () => {
      // A transient media failure must remain retryable later in the session.
      CATEGORY_THUMBNAIL_PRELOADS.delete(url);
    };
    image.src = url;
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(start, { timeout: 1200 });
  } else {
    window.setTimeout(start, 0);
  }

  return url;
}

// Existing media filenames are retained as assets. Canonical taxonomy slugs
// resolve to the closest current image without making media filenames a
// classification authority.
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
  'corner-finishers',
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
  'stilts',
]);

const CATEGORY_THUMBNAIL_FILE_BY_SLUG = {
  'corner-applicators-angle-boxes': 'corner-boxes',
  'compound-tubes': 'compound-tubes',
  'applicator-heads': 'compound-applicators',
  'corner-flushers': 'corner-flushers',
  'corner-rollers': 'corner-rollers',
  'loading-compound-pumps': 'loading-pumps',
  'goosenecks-box-fillers-adapters': 'box-fillers',
  'handles-extensions': 'extendable-handles',
  'tool-sets-kits': 'automatic-taping-tool-sets',
  'tool-storage-cases': 'automatic-taping-tool-cases',
  'semi-automatic-tapers-banjos': 'semi-automatic-tapers',

  // Historical URL/term compatibility.
  'angle-boxes': 'corner-boxes',
  'angle-boxes-corner-applicators': 'corner-boxes',
  'angle-heads-corner-finishers': 'angle-heads',
  'automatic-tool-sets': 'automatic-taping-tool-sets',
  'corner-tool-handles': 'fixed-handles',
  'goosenecks-box-fillers': 'box-fillers',
  'semi-automatic-taping-tool-accessories': 'semi-automatic-accessories',
  'semi-automatic-tool-sets': 'semi-automatic-taping-tool-sets',
  'semi-automatic-tools': 'semi-automatic-tapers',
  'semi-automatic-taping-tools': 'semi-automatic-tapers',
  'taping-tool-accessories': 'semi-automatic-accessories',
  'tool-cases': 'automatic-taping-tool-cases',
  'tool-sets': 'automatic-taping-tool-sets',
  'tool-sets-automatic-taping-tools': 'automatic-taping-tool-sets',
};

export function resolveCategoryThumbnail(category) {
  const slug = String(category?.slug || category?.key || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');

  if (CATEGORY_THUMBNAIL_URL_BY_SLUG[slug]) {
    return warmCategoryThumbnail(CATEGORY_THUMBNAIL_URL_BY_SLUG[slug]);
  }

  const thumbnailSlug = CATEGORY_THUMBNAIL_FILE_BY_SLUG[slug] || slug;
  if (CATEGORY_THUMBNAIL_SLUGS.has(thumbnailSlug)) {
    return warmCategoryThumbnail(`${CATEGORY_THUMBNAIL_ROOT}/${thumbnailSlug}.webp`);
  }

  return warmCategoryThumbnail(category?.image || '');
}
