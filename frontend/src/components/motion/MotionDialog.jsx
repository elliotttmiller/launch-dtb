import { forwardRef } from 'react';
import { m as Motion } from 'framer-motion';
import {
  surfaceVariants,
  reducedSurfaceVariants,
  panelTransition,
  reducedTransition,
} from '../../motion/dtbMotion.js';

const MotionDialog = forwardRef(function MotionDialog({
  reduceMotion = false,
  className,
  style,
  children,
  onScroll,
  variants: requestedVariants,
  ...rest
}, ref) {
  return (
    <Motion.div
      ref={ref}
      className={className}
      style={style}
      // Callers such as ProductModal own their panel geometry. Ignoring their
      // supplied variants made the desktop Quick View use the generic surface
      // transition instead of its opacity-only lifecycle, forcing a large
      // rasterized dialog through unintended geometry changes on open/close.
      variants={reduceMotion ? reducedSurfaceVariants : (requestedVariants || surfaceVariants)}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={reduceMotion ? reducedTransition : panelTransition}
      onScroll={onScroll}
      {...rest}
    >
      {children}
    </Motion.div>
  );
});

export default MotionDialog;
