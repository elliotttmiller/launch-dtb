/**
 * Async feature bundle for framer-motion's LazyMotion.
 *
 * Every animated surface in the app renders framer-motion's lightweight `m`
 * component instead of the full `motion` component. `m` alone ships almost
 * no animation engine — the actual variants/exit/gesture/layout-projection
 * code is loaded on demand via this function and shared through a single
 * <LazyMotion> provider mounted once in App.jsx.
 *
 * We load `domMax` (the full feature set: animate/variants/exit, hover/tap
 * gestures, drag, and layout projection) rather than the smaller
 * `domAnimation` bundle because a handful of consumers rely on layout
 * projection: PageTransition's `mode="popLayout"`, Cart.jsx's row `layout`
 * prop, ProductModal's `layout="position"`, and RepairPackages' `layout`
 * prop. LazyMotion requires one shared feature set for every `m` component
 * under the provider, so domMax keeps behavior identical to the previous
 * full `framer-motion` import for all ~30 consumers — the only change is
 * that this code now loads as its own async chunk instead of being forced
 * into the initial entrypoint.
 */
export default async function loadMotionFeatures() {
  const { domMax } = await import('framer-motion');
  return domMax;
}
