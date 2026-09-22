import { AnimatePresence } from 'framer-motion';

// Concurrent presence is the safe default for interactive surfaces. Sequential
// exit-then-enter choreography is reserved for cases where two rendered
// surfaces genuinely cannot coexist; otherwise it creates a visible dead gap.
export default function MotionPresence({ children, mode = 'sync', initial = false }) {
  return (
    <AnimatePresence mode={mode} initial={initial}>
      {children}
    </AnimatePresence>
  );
}
