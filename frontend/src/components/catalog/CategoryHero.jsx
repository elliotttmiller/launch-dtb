import { useEffect, useState } from 'react';
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
export default function CategoryHero({ category, breadcrumbs = [] }) {
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

  const { label, description } = category;
  // WP-Admin's native Description field (Products → Categories → edit
  // category) is the real source — this is only a placeholder for
  // categories nobody's filled that in for yet, so the hero never renders
  // with just a bare title. Replace it category-by-category by filling in
  // the real field; this line stops showing the moment that field is set.
  const displayDescription = description || `Professional ${label} and accessories from top brands.`;

  return (
    <div className="dtb-category-hero mb-6 sm:mb-8">
      <Breadcrumb items={breadcrumbs} />

      <div
        className="dtb-category-hero-card"
        style={heroBg ? { '--dtb-category-hero-bg': heroBg } : undefined}
      >
        <div className="dtb-category-hero-card__content">
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
