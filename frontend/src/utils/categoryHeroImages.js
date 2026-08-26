/**
 * Hero photo for a `/category/:slug` page. The primary source is
 * `category.heroImage` (+ `category.heroImageSrcset`) from
 * GET /wp-json/dtb/v1/catalog/category — a dedicated field, set in WP-Admin
 * under Products → Categories → edit the category → "Hero header image" →
 * Upload/Add image. That field (`dtb_hero_image_id` term meta, see
 * mu-plugins/dtb-catalog-platform/Admin/CategoryHeroImageField.php) is
 * intentionally separate from the category's "Thumbnail" field
 * (`category.image` / `thumbnail_id`), which feeds the small "Shop by Tool
 * Type" subcategory tiles instead of the hero banner. The backend serves it
 * via a dedicated `dtb_category_hero` image size (soft-resized, capped at
 * 1920px — see Application/RegisterCategoryHeroImageSize.php) with a
 * srcset, so the browser can pick a smaller generated file on narrow
 * viewports instead of always downloading the full-width image.
 *
 * `CATEGORY_HERO_IMAGE_OVERRIDES` is only a fallback for categories that
 * don't have a hero image set in WP-Admin yet — once one is uploaded there
 * it takes priority automatically. Mirrors the override-map pattern already
 * used for brand+category tiles in `ProductsCategorySelector.jsx`. Override
 * entries have no srcset (they're a single static asset), which is fine —
 * the browser just uses `src` directly.
 */
import automaticTapersHero from '@assets/media/catalog/category-heroes/automatic-tapers.webp';

const CATEGORY_HERO_IMAGE_OVERRIDES = {
  'automatic-tapers': automaticTapersHero,
};

export function resolveCategoryHeroImage(category) {
  const slug = category?.slug || '';

  if (category?.heroImage) {
    return { src: category.heroImage, srcSet: category.heroImageSrcset || '' };
  }

  const override = CATEGORY_HERO_IMAGE_OVERRIDES[slug];
  if (override) {
    return { src: override, srcSet: '' };
  }

  return { src: '', srcSet: '' };
}
