/**
 * Hero photo for a `/category/:slug` page. The primary source is the
 * category's own WP term thumbnail (`category.image` from
 * GET /wp-json/dtb/v1/catalog/category) — set it in WP-Admin under
 * Products → Categories → edit the category → "Thumbnail" → Upload/Add
 * image. That's the native WooCommerce category-thumbnail field
 * (`class-wc-admin-taxonomies.php`); no code change is needed to add or
 * change a category's hero photo.
 *
 * `CATEGORY_HERO_IMAGE_OVERRIDES` is only a fallback for categories that
 * don't have a WP thumbnail set yet — once one is uploaded in WP-Admin it
 * takes priority automatically. Mirrors the override-map pattern already
 * used for brand+category tiles in `ProductsCategorySelector.jsx`.
 */
const CATEGORY_HERO_IMAGE_OVERRIDES = {
  'automatic-tapers': '/hero/automatic-tapers.webp',
};

export function resolveCategoryHeroImage(category) {
  const slug = category?.slug || '';
  return category?.image || CATEGORY_HERO_IMAGE_OVERRIDES[slug] || '';
}
