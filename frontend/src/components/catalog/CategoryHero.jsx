import { useEffect, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import Breadcrumb from '../shared/Breadcrumb.jsx';
import { resolveCategoryHeroImage } from '../../utils/categoryHeroImages.js';
import { sampleImageEdgeColor } from '../../utils/imageAverageColor.js';
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
 *
 * The panel's background color is sampled from the photo's own edge pixels
 * (see utils/imageAverageColor.js) via a hidden offscreen probe image — not
 * the visible <img> below — so a CORS-tainted canvas read (cross-origin in
 * local dev, etc.) only loses the color match and silently falls back to
 * `--dtb-surface-subtle`; it can never break the actual displayed photo.
 */
export default function CategoryHero({ category, breadcrumbs = [], productCount = 0 }) {
  const { src: heroImageSrc, srcSet: heroImageSrcSet } = resolveCategoryHeroImage(category || {});
  const [heroBg, setHeroBg] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) setHeroBg('');
    });

    if (!heroImageSrc) return () => { cancelled = true; };

    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.onload = () => {
      if (cancelled) return;
      const color = sampleImageEdgeColor(probe);
      if (color) setHeroBg(color);
    };
    probe.src = heroImageSrc;

    return () => {
      cancelled = true;
    };
  }, [heroImageSrc]);

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
  const productCountLabel = Number(productCount) > 0
    ? `${Number(productCount).toLocaleString()} product${Number(productCount) === 1 ? '' : 's'}`
    : '';

  return (
    <div className="dtb-category-hero mb-6 sm:mb-8">
      <Breadcrumb items={breadcrumbs} />

      <div
        className="dtb-category-hero-card"
        style={heroBg ? { '--dtb-category-hero-bg': heroBg } : undefined}
      >
        <div className="dtb-category-hero-card__content">
          {eyebrow && <span className="dtb-category-hero-card__eyebrow">{eyebrow}</span>}
          <h1 className="dtb-category-hero-card__title">{label}</h1>
          <p className="dtb-category-hero-card__description">{displayDescription}</p>
          {productCountLabel && (
            <span className="dtb-category-hero-card__count-pill">
              <span className="dtb-category-hero-card__count-icon" aria-hidden="true">
                <LayoutGrid size={12} strokeWidth={2.5} />
              </span>
              {productCountLabel.toUpperCase()}
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
