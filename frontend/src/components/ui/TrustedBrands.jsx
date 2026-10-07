import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBrandLogo } from '../../utils/brandAssets.js';

const MIN_LOOPS = 2;

function normalizeBrands(brands) {
  return brands
    .map((brand) => {
      const name = String(brand?.name || '').trim();
      const src = String(brand?.src || brand?.logo || getBrandLogo(name) || '').trim();
      const to = String(brand?.to || brand?.href || '').trim();
      return { name, src, to };
    })
    .filter(({ name }) => name);
}

function BrandItem({ brand, clone = false, depthDelay = 0 }) {
  const content = (
    <>
      {brand.src ? <img src={brand.src} alt={clone ? '' : brand.name} width="160" height="48" loading="lazy" decoding="async" /> : <span>{brand.name}</span>}
    </>
  );
  const itemProps = {
    className: 'dtb-trusted-brand-link',
    style: { '--dtb-brand-depth-delay': `${depthDelay}s` },
    'aria-hidden': clone || undefined,
    tabIndex: clone ? -1 : undefined,
  };

  return brand.to ? (
    <Link {...itemProps} to={brand.to} aria-label={clone ? undefined : `Shop ${brand.name}`}>
      {content}
    </Link>
  ) : (
    <span {...itemProps} aria-label={clone ? undefined : brand.name}>
      {content}
    </span>
  );
}

export default function TrustedBrands({
  brands = [],
  title = 'Trusted Brands',
  speed = 32,
  dark = false,
  transparent = false,
  className = '',
}) {
  const normalizedBrands = useMemo(() => normalizeBrands(Array.isArray(brands) ? brands : []), [brands]);
  const sectionId = useId();
  const viewportRef = useRef(null);
  const laneRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [loopCount, setLoopCount] = useState(() => reducedMotion ? 1 : MIN_LOOPS);
  const [depthDelays, setDepthDelays] = useState([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const lane = laneRef.current;
    if (!viewport || !lane || normalizedBrands.length < 2) return undefined;

    const measure = () => {
      const firstItem = lane.firstElementChild;
      if (!firstItem) return;

      const itemWidth = firstItem.offsetWidth;
      const gap = Number.parseFloat(window.getComputedStyle(lane).columnGap) || 0;
      const pitch = itemWidth + gap;
      const viewportWidth = viewport.clientWidth;
      if (!pitch || !viewportWidth) return;

      const loopCountNext = reducedMotion
        ? 1
        : Math.max(1, Math.ceil((viewportWidth + pitch) / (normalizedBrands.length * pitch)));
      setLoopCount((current) => current === loopCountNext ? current : loopCountNext);

      const itemCount = normalizedBrands.length * loopCountNext;
      const laneWidth = Math.max(1, (itemCount * pitch) - gap);
      const duration = Math.max(18, Number(speed) || 32);
      setDepthDelays(Array.from({ length: itemCount }, (_, index) => {
        const center = (index * pitch) + (itemWidth / 2);
        const crossingFraction = (center - (viewportWidth / 2)) / laneWidth;
        return (0.5 - crossingFraction) * duration;
      }));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    if (lane.firstElementChild) observer.observe(lane.firstElementChild);
    return () => observer.disconnect();
  }, [normalizedBrands.length, reducedMotion, speed]);

  if (!normalizedBrands.length) return null;

  const loops = Array.from({ length: normalizedBrands.length < 2 || reducedMotion ? 1 : loopCount }, (_, loopIndex) =>
    normalizedBrands.map((brand, brandIndex) => ({
      ...brand,
      key: `${brand.to || brand.name}-${loopIndex}-${brandIndex}`,
      depthDelay: depthDelays[(loopIndex * normalizedBrands.length) + brandIndex] || 0,
    }))
  ).flat();
  const duration = `${Math.max(18, Number(speed) || 32)}s`;
  const classes = [
    'dtb-ui-trusted-brands',
    normalizedBrands.length < 2 ? 'is-static' : '',
    dark ? 'dtb-ui-trusted-brands--dark' : '',
    transparent ? 'dtb-ui-trusted-brands--transparent' : '',
    paused ? 'is-paused' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <section
      className={classes}
      aria-labelledby={title ? `${sectionId}-title` : undefined}
      aria-label={title ? undefined : 'Trusted brands'}
      style={{ '--dtb-brand-loop-duration': duration }}
    >
      {(title || normalizedBrands.length > 1) && (
        <div className="dtb-ui-trusted-brands__heading">
          {title && <h2 id={`${sectionId}-title`} className="dtb-ui-trusted-brands__title">{title}</h2>}
          {normalizedBrands.length > 1 && (
            <button
              type="button"
              className="dtb-ui-trusted-brands__motion-control"
              aria-controls={`${sectionId}-viewport`}
              aria-label={paused ? 'Resume trusted brands carousel' : 'Pause trusted brands carousel'}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? 'Resume motion' : 'Pause motion'}
            </button>
          )}
        </div>
      )}

      <div className="dtb-ui-trusted-brands__viewport" id={`${sectionId}-viewport`} ref={viewportRef}>
        <div className="dtb-ui-trusted-brands__track">
          <div className="dtb-ui-trusted-brands__lane" ref={laneRef}>
            {loops.map((brand) => <BrandItem key={brand.key} brand={brand} depthDelay={brand.depthDelay} />)}
          </div>
          <div className="dtb-ui-trusted-brands__lane dtb-ui-trusted-brands__lane--clone" aria-hidden="true">
            {loops.map((brand) => <BrandItem key={`${brand.key}-clone`} brand={brand} clone depthDelay={brand.depthDelay} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
