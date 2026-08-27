import { useEffect, useState } from 'react';
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
 * the left side of one bounded hero surface and dedicated category artwork
 * fills the right-side media viewport without stretching.
 */
export default function CategoryHero({ category, breadcrumbs = [], productCount }) {
  const resolvedHero = resolveCategoryHeroImage(category || {});
  const [activeHero, setActiveHero] = useState(() => ({
    src: resolvedHero.src,
    srcSet: resolvedHero.srcSet,
    failed: false,
  }));

  useEffect(() => {
    setActiveHero({
      src: resolvedHero.src,
      srcSet: resolvedHero.srcSet,
      failed: false,
    });
  }, [resolvedHero.src, resolvedHero.srcSet]);

  if (!category) return null;

  const { label, description, parent } = category;
  const displayDescription = description
    || `Browse our full selection of ${label} for professional drywall work.`;
  const eyebrow = parent?.label || '';
  const count = Number(productCount);
  const hasCount = Number.isFinite(count) && count >= 0;

  const handleHeroError = () => {
    if (resolvedHero.fallbackSrc && activeHero.src !== resolvedHero.fallbackSrc) {
      setActiveHero({
        src: resolvedHero.fallbackSrc,
        srcSet: resolvedHero.fallbackSrcSet,
        failed: false,
      });
      return;
    }

    setActiveHero((current) => ({ ...current, src: '', srcSet: '', failed: true }));
  };

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

        {activeHero.src && !activeHero.failed && (
          <div className="dtb-category-hero-card__media">
            <img
              src={activeHero.src}
              srcSet={activeHero.srcSet || undefined}
              sizes={activeHero.srcSet ? '(min-width: 1280px) 52vw, (min-width: 768px) 50vw, 100vw' : undefined}
              alt=""
              className="dtb-category-hero-card__image"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={handleHeroError}
            />
          </div>
        )}
      </div>
    </div>
  );
}
