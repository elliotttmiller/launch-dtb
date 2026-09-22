/**
 * PageTransition
 *
 * A restrained route-level lift. Route content must remain opaque throughout
 * navigation: fading the entire page to zero exposes a white frame between
 * the persistent shell and the next route, which reads as a flash on slower
 * devices and during lazy-route resolution.
 */
import { m as Motion, useReducedMotion } from 'framer-motion';
import { routeVariants, reducedRouteVariants } from '../../motion/dtbMotion.js';

export default function PageTransition({ children, locationKey }) {
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? reducedRouteVariants : routeVariants;

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
        willChange: 'transform',
        position: 'relative',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </Motion.div>
  );
}
