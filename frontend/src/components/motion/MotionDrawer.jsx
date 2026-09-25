import { forwardRef } from 'react';
import { m as Motion } from 'framer-motion';
import {
  mobileSheetVariants,
  reducedSurfaceVariants,
  mobileSheetTransition,
  reducedTransition,
} from '../../motion/dtbMotion.js';

const MotionDrawer = forwardRef(function MotionDrawer({
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
      variants={reduceMotion ? reducedSurfaceVariants : (requestedVariants || mobileSheetVariants)}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={reduceMotion ? reducedTransition : mobileSheetTransition}
      onScroll={onScroll}
      {...rest}
    >
      {children}
    </Motion.div>
  );
});

export default MotionDrawer;
