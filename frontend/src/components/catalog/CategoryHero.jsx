import { LayoutGrid } from 'lucide-react';
import Breadcrumb from '../shared/Breadcrumb.jsx';
import { resolveCategoryHeroImage } from '../../utils/categoryHeroImages.js';
import '../../styles/category-hero.css';

/**
 * Hero/landing block for the dedicated `/category/:slug` route. Renders
 * above the shared catalog engine (search/filter/grid) — it never owns
 * product data itself, only the category term metadata passed in.
 *
 * Layout matches the design blueprint: a single rounded panel containing
 * both the text content and the hero photo — image stacked above content on
 * narrow screens, side-by-side (content left, image right) from `md` up.
 * The photo has no border/background/shadow of its own; it sits directly on
 * the panel's fill so it blends into the panel rather than reading as a
 * separate card nested inside it.
 */
export default function CategoryHero({ category, breadcrumbs = [], productCount: productCountOverride }) {
  if (!category) return null;

  const { label, description, productCount: metaProductCount } = category;
  const productCount = Number.isFinite(productCountOverride) ? productCountOverride : metaProductCount;
  const { src: heroImageSrc, srcSet: heroImageSrcSet } = resolveCategoryHeroImage(category);

  return (
    <div className="dtb-category-hero mb-6 sm:mb-8">
      <Breadcrumb items={breadcrumbs} />

      <div className="dtb-category-hero-card">
        <div className="dtb-category-hero-card__content">
          <h1 className="dtb-category-hero-card__title">{label}</h1>
          {description && (
            <p className="dtb-category-hero-card__description">{description}</p>
          )}
          {typeof productCount === 'number' && (
            <span className="dtb-category-hero-card__count">
              <LayoutGrid size={14} aria-hidden="true" />
              {productCount.toLocaleString()} product{productCount === 1 ? '' : 's'}
            </span>
          )}
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
