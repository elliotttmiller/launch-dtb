import { LayoutGrid } from 'lucide-react';
import Breadcrumb from '../shared/Breadcrumb.jsx';
import { resolveCategoryHeroImage } from '../../utils/categoryHeroImages.js';
import '../../styles/category-hero.css';

/**
 * Hero/landing block for the dedicated `/category/:slug` route. Renders
 * above the shared catalog engine (search/filter/grid) — it never owns
 * product data itself, only the category term metadata (+ live product
 * count) passed in.
 *
 * Presentation is standardized across every category route: content occupies
 * the left side of one bounded hero surface and dedicated category photography
 * fills the right-side media viewport without stretching.
 */
export default function CategoryHero({ category, breadcrumbs = [], productCount }) {
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
  const count = Number(productCount);
  const hasCount = Number.isFinite(count) && count >= 0;

  return (
    <div className="dtb-category-hero mb-5 sm:mb-6">
      <Breadcrumb items={breadcrumbs} />

      <div className="dtb-category-hero-card">
        <div className="dtb-category-hero-card__content">
          {eyebrow && <span className="dtb-category-hero-card__eyebrow">{eyebrow}</span>}
          <h1 className="dtb-category-hero-card__title">{label}</h1>
          <p className="dtb-category-hero-card__description">{displayDescription}</p>
          {hasCount && (
            <span className="dtb-category-hero-card__count" aria-label={`${count.toLocaleString()} products`}>
              <span className="dtb-category-hero-card__count-icon" aria-hidden="true">
                <LayoutGrid size={13} strokeWidth={2.35} />
              </span>
              <span className="dtb-category-hero-card__count-label">
                {count.toLocaleString()} product{count === 1 ? '' : 's'}
              </span>
            </span>
          )}
        </div>

        {heroImageSrc && (
          <div className="dtb-category-hero-card__media">
            <img
              src={heroImageSrc}
              srcSet={heroImageSrcSet || undefined}
              sizes={heroImageSrcSet ? '(min-width: 1280px) 52vw, (min-width: 768px) 50vw, 100vw' : undefined}
              alt=""
              className="dtb-category-hero-card__image"
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
