import { useCallback, useEffect, useState } from 'react';
import Breadcrumb from '../shared/Breadcrumb.jsx';
import { resolveCategoryHeroImage } from '../../utils/categoryHeroImages.js';
import '../../styles/category-hero.css';

const READY_CATEGORY_HERO_IMAGES = new Set();

function CategoryHeroSkeletonCard() {
  return (
    <div className="dtb-category-hero-card dtb-category-hero-card--skeleton" aria-hidden="true">
      <div className="dtb-category-hero-card__skeleton-content">
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--eyebrow" />
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--title" />
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--copy" />
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--copy-short" />
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
      <div className="dtb-category-hero__breadcrumb-skeleton" aria-hidden="true">
        <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--breadcrumb" />
      </div>
      <CategoryHeroSkeletonCard />
    </div>
  );
}

/**
 * Hero/landing block for the dedicated `/category/:slug` route. Renders
 * above the shared catalog engine (search/filter/grid) — it never owns
 * product data itself, only the category term metadata passed in.
 *
 * Presentation is standardized across every category route: content occupies
 * the left side of one bounded hero surface and dedicated category artwork
 * fills the right-side media viewport without stretching.
 */
export default function CategoryHero({ category, breadcrumbs = [] }) {
  const resolvedHero = resolveCategoryHeroImage(category || {});
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

  const { label, description, parent } = category;
  const displayDescription = description
    || `Browse our full selection of ${label} for professional drywall work.`;
  const eyebrow = parent?.label || '';

  return (
    <div className={`dtb-category-hero mb-5 sm:mb-6${heroReady ? ' is-ready' : ' is-loading'}`}>
      <div className="dtb-category-hero__breadcrumb-stage">
        <div className="dtb-category-hero__breadcrumb-content">
          <Breadcrumb items={breadcrumbs} />
        </div>
        <div className="dtb-category-hero__breadcrumb-loading" aria-hidden="true">
          <span className="dtb-category-hero-shimmer dtb-category-hero-shimmer--breadcrumb" />
        </div>
      </div>

      <div className="dtb-category-hero-card">
        <div className="dtb-category-hero-card__loading-layer" aria-hidden="true">
          <CategoryHeroSkeletonCard />
        </div>

        <div className="dtb-category-hero-card__content">
          {eyebrow && <span className="dtb-category-hero-card__eyebrow">{eyebrow}</span>}
          <h1 className="dtb-category-hero-card__title">{label}</h1>
          <p className="dtb-category-hero-card__description">{displayDescription}</p>
        </div>

        <CategoryHeroMedia
          key={`${resolvedHero.src}|${resolvedHero.srcSet}`}
          resolvedHero={resolvedHero}
          initiallyReady={heroReady}
          onReady={handleHeroReady}
        />
      </div>
    </div>
  );
}

function CategoryHeroMedia({ resolvedHero, initiallyReady, onReady }) {
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
    <div className="dtb-category-hero-card__media">
      <img
        src={activeHero.src}
        srcSet={activeHero.srcSet || undefined}
        sizes={activeHero.srcSet ? '(min-width: 1280px) 52vw, (min-width: 768px) 50vw, 100vw' : undefined}
        alt=""
        className={`dtb-category-hero-card__image${imageReady ? ' is-ready' : ''}`}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onLoad={(event) => commitReady(event.currentTarget)}
        onError={handleHeroError}
      />
    </div>
  );
}
