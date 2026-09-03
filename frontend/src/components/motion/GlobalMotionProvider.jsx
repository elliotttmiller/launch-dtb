import { MotionConfig } from 'framer-motion';
import { motionConfigTransition } from '../../motion/dtbMotion.js';

/**
 * Application-wide Motion configuration.
 *
 * Every Framer Motion consumer inherits the same restrained, low-bounce
 * physical response unless it opts into one of the semantic timed transitions
 * in dtbMotion.js. `reducedMotion="user"` makes the behavior device- and
 * accessibility-consistent across desktop, tablet, and mobile without
 * duplicating responsive motion trees.
 */
export default function GlobalMotionProvider({ children }) {
  return (
    <MotionConfig transition={motionConfigTransition} reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
