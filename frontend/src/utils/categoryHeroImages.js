/**
 * Category hero artwork resolver for `/category/:slug` pages.
 *
 * Canonical repository-owned hero media lives in:
 *   products/launch/media/categories/heroes/
 *
 * `frontend/scripts/sync-category-heroes.cjs` mirrors those assets into the
 * frontend source tree before dev/build/preview. Webpack's `require.context`
 * then discovers every mirrored WebP automatically, so adding or replacing a
 * correctly named category hero does not require another import or map edit.
 *
 * Naming contract: use the exact WooCommerce category slug as the filename:
 *   <category-slug>.webp
 *
 * A small alias table exists only for legacy filenames that predate that
 * contract. Do not add new aliases when creating new category hero artwork.
 *
 * Repository-packaged artwork is preferred when present because it is the
 * version-controlled DTB presentation asset. The backend `category.heroImage`
 * remains the fallback for categories that do not yet have a packaged hero;
 * its `srcset` is preserved in that case.
 */

const CATEGORY_HERO_FILENAME_ALIASES = {
  // Legacy source filename. New hero files must use the exact category slug.
  'compound-applicators': 'compound-applicator',
};

function discoverPackagedHeroImages() {
  // This directory is materialized by sync-category-heroes.cjs before webpack
  // starts. require.context is intentionally used here because this frontend is
  // webpack-based, not Vite-based.
  const context = require.context(
    '../assets/media/catalog/category-heroes',
    false,
    /\.webp$/i,
  );

  return context.keys().reduce((images, key) => {
    const filename = key.replace(/^\.\//, '');
    const slug = filename.replace(/\.webp$/i, '');
    const resolved = context(key);
    images[slug] = resolved?.default || resolved;
    return images;
  }, {});
}

const PACKAGED_CATEGORY_HERO_IMAGES = discoverPackagedHeroImages();

function resolvePackagedHero(slug) {
  if (!slug) return '';
  if (PACKAGED_CATEGORY_HERO_IMAGES[slug]) {
    return PACKAGED_CATEGORY_HERO_IMAGES[slug];
  }

  const aliasedFilename = CATEGORY_HERO_FILENAME_ALIASES[slug];
  return aliasedFilename ? (PACKAGED_CATEGORY_HERO_IMAGES[aliasedFilename] || '') : '';
}

export function resolveCategoryHeroImage(category) {
  const slug = category?.slug || '';
  const packagedHero = resolvePackagedHero(slug);

  if (packagedHero) {
    return { src: packagedHero, srcSet: '' };
  }

  if (category?.heroImage) {
    return { src: category.heroImage, srcSet: category.heroImageSrcset || '' };
  }

  return { src: '', srcSet: '' };
}
