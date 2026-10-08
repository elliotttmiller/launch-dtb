import { useCallback, useEffect, useState } from 'react';
import Breadcrumb from '../shared/Breadcrumb.jsx';
import CategoryMerchandising from './CategoryMerchandising.jsx';
import ToolSetsKitsExperience from './ToolSetsKitsExperience.jsx';
import { resolveCategoryHeroImage } from '../../utils/categoryHeroImages.js';
import { resolveCategoryHeroPresentation } from '../../constants/categoryHeroPresentation.js';
import '../../styles/category-hero.css';

const READY_CATEGORY_HERO_IMAGES = new Set();

function CategoryHeroSkeletonCard() {
  return (
    <div className="dtb-category-hero-card dtb-category-hero-card--skeleton" aria-hidden="true">
      <div className="dtb-category-hero-card__skeleton-content">
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--breadcrumb" />
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--eyebrow" />
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--title" />
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--copy" />
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--copy-short" />
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--rule" />
      </div>
      <div className="dtb-category-hero-card__skeleton-media">
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--media" />
      </div>
    </div>
  );
}

export function CategoryHeroSkeleton() {
  return (
    <div className="dtb-category-hero dtb-category-hero--loading mb-5 sm:mb-6" role="status" aria-label="Loading category">
      <CategoryHeroSkeletonCard />
    </div>
  );
}

/**
 * Hero/landing block for the dedicated `/category/:slug` route.
 *
 * The hero owns presentation only. WooCommerce/category metadata remains the
 * authority for taxonomy and product truth. Media composition is selected from
 * a bounded set of frontend presentation modes so differently shaped category
 * artwork can share one stable responsive hero contract.
 */
export default function CategoryHero({
  category,
  breadcrumbs = [],
  activeFilters = [],
  onRemoveFilter = null,
  products = [],
  brands = [],
  onAddToCart,
  onOpenProduct,
}) {
  const resolvedHero = resolveCategoryHeroImage(category || {});
  const mediaPresentation = resolveCategoryHeroPresentation(category?.slug);
  const heroCacheKey = resolvedHero.src || '';
  const [heroReady, setHeroReady] = useState(() => !heroCacheKey || READY_CATEGORY_HERO_IMAGES.has(heroCacheKey));

  useEffect(() => {
    setHeroReady(!heroCacheKey || READY_CATEGORY_HERO_IMAGES.has(heroCacheKey));
  }, [heroCacheKey]);

  const handleHeroReady = useCallback((readySrc) => {
    if (readySrc) {
      READY_CATEGORY_HERO_IMAGES.add(readySrc);
      if (heroCacheKey) READY_CATEGORY_HERO_IMAGES.add(heroCacheKey);
    }
    setHeroReady(true);
  }, [heroCacheKey]);

  if (!category) return <CategoryHeroSkeleton />;

  if (category.slug === 'tool-sets-kits') {
    return (
      <ToolSetsKitsExperience
        category={category}
        breadcrumbs={breadcrumbs}
        products={products}
        brands={brands}
        onAddToCart={onAddToCart}
        onOpenProduct={onOpenProduct}
      />
    );
  }

  const { label, description, parent } = category;
  const displayDescription = description
    || `Browse our full selection of ${label} for professional drywall work.`;
  const eyebrow = parent?.label || '';

  return (
    <>
      <div className={`dtb-category-hero mb-5 sm:mb-6${heroReady ? ' is-ready' : ' is-loading'}`}>
        <div className="dtb-category-hero-card">
          <div className="dtb-category-hero-card__loading-layer" aria-hidden="true">
            <CategoryHeroSkeletonCard />
          </div>

          <div className="dtb-category-hero-card__content">
            <div className="dtb-category-hero__breadcrumb-stage">
              <div className="dtb-category-hero__breadcrumb-content">
                <Breadcrumb
                  items={breadcrumbs}
                  activeFilters={activeFilters}
                  onRemoveFilter={onRemoveFilter}
                  tone="inverse"
                  className="dtb-breadcrumb-bar--compact"
                />
              </div>
              <div className="dtb-category-hero__breadcrumb-loading" aria-hidden="true">
                <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--breadcrumb" />
              </div>
            </div>

            <div className="dtb-category-hero-card__copy">
              {eyebrow && <span className="dtb-category-hero-card__eyebrow">{eyebrow}</span>}
              <h1 className="dtb-category-hero-card__title">{label}</h1>
              <p className="dtb-category-hero-card__description">{displayDescription}</p>
              <a className="dtb-category-hero-card__shop-link" href="#dtb-category-products">Shop Products <span aria-hidden="true">→</span></a>
              <span className="dtb-category-hero-card__rule" aria-hidden="true" />
            </div>
          </div>

          <CategoryHeroMedia
            key={`${resolvedHero.src}|${resolvedHero.srcSet}`}
            resolvedHero={resolvedHero}
            presentation={mediaPresentation}
            initiallyReady={heroReady}
            onReady={handleHeroReady}
          />
        </div>
      </div>

      <CategoryMerchandising category={category} />
    </>
  );
}

function CategoryHeroMedia({ resolvedHero, presentation, initiallyReady, onReady }) {
  const [activeHero, setActiveHero] = useState(() => ({
    src: resolvedHero.src,
    srcSet: resolvedHero.srcSet,
    failed: false,
  }));
  const [imageReady, setImageReady] = useState(() => Boolean(initiallyReady));

  useEffect(() => {
    setActiveHero({
      src: resolvedHero.src,
      srcSet: resolvedHero.srcSet,
      failed: false,
    });
    setImageReady(Boolean(initiallyReady));
  }, [initiallyReady, resolvedHero.src, resolvedHero.srcSet]);

  useEffect(() => {
    if (!activeHero.src || activeHero.failed) onReady('');
  }, [activeHero.failed, activeHero.src, onReady]);

  if (!activeHero.src || activeHero.failed) return null;

  const commitReady = (image) => {
    const finish = () => {
      setImageReady(true);
      onReady(activeHero.src);
    };

    if (typeof image?.decode === 'function') {
      image.decode().catch(() => {}).finally(() => {
        window.requestAnimationFrame(finish);
      });
      return;
    }

    window.requestAnimationFrame(finish);
  };

  const handleHeroError = () => {
    if (resolvedHero.fallbackSrc && activeHero.src !== resolvedHero.fallbackSrc) {
      setImageReady(false);
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
    <div className="dtb-category-hero-card__media" data-presentation={presentation}>
      <img
        src={activeHero.src}
        srcSet={activeHero.srcSet || undefined}
        sizes={activeHero.srcSet ? '(min-width: 1280px) 57vw, (min-width: 768px) 56vw, 100vw' : undefined}
        alt=""
        className={`dtb-category-hero-card__image${imageReady ? ' is-ready' : ''}`}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        draggable="false"
        onLoad={(event) => commitReady(event.currentTarget)}
        onError={handleHeroError}
      />
    </div>
  );
}
