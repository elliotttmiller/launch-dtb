/**
 * PageTransition
 *
 * A restrained route-level lift. Route content must remain opaque throughout
 * navigation: fading the entire page to zero exposes a white frame between
 * the persistent shell and the next route, which reads as a flash on slower
 * devices and during lazy-route resolution.
 */
import { useEffect, useState } from 'react';
import { m as Motion, useReducedMotion } from 'framer-motion';
import { routeVariants, reducedRouteVariants } from '../../motion/dtbMotion.js';

export default function PageTransition({ children, locationKey }) {
  const reduceMotion = useReducedMotion();
  const [desktopViewport, setDesktopViewport] = useState(() => (
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 1025px)').matches
      : false
  ));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(min-width: 1025px)');
    const sync = (event) => setDesktopViewport(event.matches);
    setDesktopViewport(query.matches);
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  // Desktop pages can span a very large raster area. Promoting and translating
  // that entire tree creates avoidable compositor churn around sticky/fixed
  // descendants and can present as a flash. Keep desktop route commits fully
  // static; mobile/tablet retain the existing restrained 4px settle.
  const variants = reduceMotion || desktopViewport ? reducedRouteVariants : routeVariants;

  return (
    <Motion.div
      key={locationKey}
      className="dtb-page-transition"
      variants={variants}
      initial="initial"
      animate="animate"
      style={{
        width: '100%',
        minHeight: '100%',
        position: 'relative',
      }}
    >
      {children}
    </Motion.div>
  );
}
