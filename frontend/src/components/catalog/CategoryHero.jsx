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
 * The hero shell is intentionally transparent so it visually belongs to the
 * page canvas. At desktop widths, category photography renders inside the
 * standardized 3:1 right-side media viewport defined by category-hero.css;
 * narrower layouts use a taller art-directed viewport.
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
    <div className="dtb-category-hero mb-6 sm:mb-8">
      <Breadcrumb items={breadcrumbs} />

      <div className="dtb-category-hero-card">
        <div className="dtb-category-hero-card__content">
          {eyebrow && <span className="dtb-category-hero-card__eyebrow">{eyebrow}</span>}
          <h1 className="dtb-category-hero-card__title">{label}</h1>
          <p className="dtb-category-hero-card__description">{displayDescription}</p>
          {hasCount && (
            <span className="dtb-category-hero-card__count-pill">
              <LayoutGrid size={13} strokeWidth={2.4} aria-hidden="true" />
              {count.toLocaleString()} product{count === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {heroImageSrc && (
          <div className="dtb-category-hero-card__media">
            <img
              src={heroImageSrc}
              srcSet={heroImageSrcSet || undefined}
              sizes={heroImageSrcSet ? '(min-width: 1280px) 42vw, (min-width: 768px) 42vw, 100vw' : undefined}
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
