import Breadcrumb from '../shared/Breadcrumb.jsx';
import { resolveCategoryHeroImage } from '../../utils/categoryHeroImages.js';
import '../../styles/category-hero.css';

/**
 * Hero/landing block for the dedicated `/category/:slug` route. Renders
 * above the shared catalog engine (search/filter/grid) — it never owns
 * product data itself, only the category term metadata passed in.
 *
 * Flush/seamless layout (no card, sheet, or container chrome): text
 * content and the hero photo render directly in the page's own layout —
 * image stacked above content on narrow screens, side-by-side (content
 * left, image right) from `md` up.
 */
export default function CategoryHero({ category, breadcrumbs = [] }) {
  const { src: heroImageSrc, srcSet: heroImageSrcSet } = resolveCategoryHeroImage(category || {});

  if (!category) return null;

  const { label, description, parent } = category;
  // WP-Admin's native Description field (Products → Categories → edit
  // category) is the real source — this is only a placeholder for
  // categories nobody's filled that in for yet, so the hero never renders
  // with just a bare title. Replace it category-by-category by filling in
  // the real field; this line stops showing the moment that field is set.
  // Kept neutral — no manufacturer-support/replacement-parts claims we
  // can't actually back for every category.
  const displayDescription = description
    || `Browse our full selection of ${label} for professional drywall work.`;
  const eyebrow = parent?.label || '';

  return (
    <div className="dtb-category-hero mb-6 sm:mb-8">
      <Breadcrumb items={breadcrumbs} />

      <div className="dtb-category-hero-card">
        <div className="dtb-category-hero-card__content">
          {eyebrow && <span className="dtb-category-hero-card__eyebrow">{eyebrow}</span>}
          <h1 className="dtb-category-hero-card__title">{label}</h1>
          <p className="dtb-category-hero-card__description">{displayDescription}</p>
        </div>

        {heroImageSrc && (
          <div className="dtb-category-hero-card__media">
            <img
              src={heroImageSrc}
              srcSet={heroImageSrcSet || undefined}
              sizes={heroImageSrcSet ? '(min-width: 768px) 45vw, 100vw' : undefined}
              alt=""
              className="dtb-category-hero-card__image"
              width={1920}
              height={800}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        )}
      </div>
    </div>
  );
}
