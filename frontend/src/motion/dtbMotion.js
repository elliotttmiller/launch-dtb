// Canonical JavaScript motion authority for the customer storefront.
// Keep these values numerically aligned with the CSS motion tokens in
// frontend/src/styles/storefront-tokens.css. Components should consume the
// semantic transitions/variants below instead of inventing local easings.

export const dtbEase = {
  standard: [0.22, 1, 0.36, 1],
  emphasized: [0.16, 1, 0.3, 1],
  soft: [0.2, 0.8, 0.2, 1],
  exit: [0.4, 0, 0.2, 1],
  fade: [0.4, 0, 0.2, 1],
};

export const dtbDuration = {
  instant: 0.1,
  fast: 0.18,
  normal: 0.32,
  elevated: 0.36,
  overlay: 0.4,
  slow: 0.44,
};

export const dtbDurationMs = {
  instant: 100,
  fast: 180,
  normal: 320,
  elevated: 360,
  overlay: 400,
  slow: 440,
};

export const dtbDistance = {
  micro: 4,
  small: 8,
  medium: 12,
  large: 16,
};

export const dtbTransition = {
  instant: { duration: dtbDuration.instant, ease: dtbEase.standard },
  fast: { duration: dtbDuration.fast, ease: dtbEase.standard },
  standard: { duration: dtbDuration.normal, ease: dtbEase.standard },
  emphasized: { duration: dtbDuration.elevated, ease: dtbEase.emphasized },
  overlay: { duration: dtbDuration.overlay, ease: dtbEase.emphasized },
  slow: { duration: dtbDuration.slow, ease: dtbEase.emphasized },
  exit: { duration: dtbDuration.fast, ease: dtbEase.exit },
};

export const routeVariants = {
  initial: {
    opacity: 0,
    y: dtbDistance.small,
    scale: 0.998,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: dtbTransition.standard,
  },
  exit: {
    opacity: 0,
    y: -dtbDistance.micro,
    scale: 0.999,
    transition: dtbTransition.exit,
  },
};

export const reducedRouteVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.01, ease: 'linear' } },
  exit: { opacity: 0, transition: { duration: 0.01, ease: 'linear' } },
};

// Generic component/content reveal. Use this for tab panels, empty states,
// async content and other in-page renderer changes so they share the same
// visual grammar as route navigation without replaying a full route motion.
export const contentVariants = {
  hidden: {
    opacity: 0,
    y: dtbDistance.small,
    scale: 0.998,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: dtbTransition.standard,
  },
  exit: {
    opacity: 0,
    y: -dtbDistance.micro,
    scale: 0.999,
    transition: dtbTransition.exit,
  },
};

export const reducedContentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dtbDuration.instant } },
  exit: { opacity: 0, transition: { duration: dtbDuration.instant } },
};

export const staggerContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.02,
    },
  },
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: dtbDistance.medium },
  visible: {
    opacity: 1,
    y: 0,
    transition: dtbTransition.emphasized,
  },
};

export const surfaceVariants = {
  hidden: { opacity: 0, y: dtbDistance.medium, scale: 0.992 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: dtbTransition.standard,
  },
  exit: {
    opacity: 0,
    y: dtbDistance.small,
    scale: 0.995,
    transition: dtbTransition.exit,
  },
};

export const reducedSurfaceVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dtbDuration.instant } },
  exit: { opacity: 0, transition: { duration: dtbDuration.instant } },
};

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const reducedBackdropVariants = backdropVariants;

export const backdropTransition = { duration: dtbDuration.fast, ease: dtbEase.exit };
export const panelTransition = dtbTransition.standard;
export const reducedTransition = { duration: dtbDuration.instant, ease: 'linear' };
export const collapseTransition = dtbTransition.standard;
export const indicatorTransition = dtbTransition.emphasized;
export const microInteractionTransition = dtbTransition.fast;

export const mobileSheetTransition = {
  type: 'tween',
  ...dtbTransition.standard,
};

export const mobileSheetVariants = {
  hidden: { opacity: 0, y: '12%', scale: 0.992 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: '8%', scale: 0.995 },
};

export const productModalTransition = {
  type: 'tween',
  ...dtbTransition.overlay,
};

export const productModalBackdropTransition = {
  duration: dtbDuration.normal,
  ease: dtbEase.exit,
};

export const productModalDesktopVariants = {
  hidden: { opacity: 0, y: dtbDistance.large, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: {
    opacity: 0,
    y: dtbDistance.medium,
    scale: 0.988,
    transition: dtbTransition.exit,
  },
};

export const productModalMobileVariants = {
  hidden: { opacity: 0, y: '14%', scale: 0.992 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: {
    opacity: 0,
    y: '10%',
    scale: 0.994,
    transition: dtbTransition.exit,
  },
};
