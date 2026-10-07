/**
 * FramerEffects
 *
 * SKELETON — populate per-component as you discover animations in
 * the exported bundle. Mount this component once at the page root.
 *
 * Why this is needed:
 *   The bundled Framer components carry every animation spec they
 *   need on `__framer__*` props (loop, scroll transform, appear, etc.)
 *   but the upstream runtime's withFX HOC does not consume them.
 *   They land on the DOM as unknown props (you'll see
 *   "React does not recognize the __withFX prop") and the animations
 *   never run.
 *
 *   This file is where you reimplement those animations manually
 *   using the Web Animations API (WAAPI). Use WAAPI rather than
 *   framer-motion because framer-motion writes transform to inline
 *   style every frame and will clobber CSS keyframes/transitions on
 *   the same property.
 *
 * Discovery loop per Framer component:
 *
 *   1. Grep the bundle for `__framer__loop`, `__framer__transformTrigger`,
 *      `__framer__styleAppearEffectEnabled`, `__framer__presenceInitial`,
 *      `__framer__animate`, `__framer__enter`.
 *   2. For each match, find the target's class name (the motion node it's
 *      attached to) and the referenced transition/animation vars
 *      (`transition2`, `animation`, `__framer__spring`, etc.).
 *   3. Read those vars to extract the shape: physics spring
 *      (`stiffness/damping/mass`), duration spring (`duration/bounce`),
 *      or bezier tween (`duration/ease`).
 *   4. Add a RevealSpec or LoopSpec entry below pointing at the
 *      selector with the extracted spec.
 *
 * Execution rules:
 *
 *   - Use `element.animate(...)` (WAAPI). Never approximate springs
 *     with cubic-bezier — pre-sample to keyframes matching
 *     framer-motion's physics. Long springs visibly differ.
 *   - For in-view triggers, IntersectionObserver with threshold: 0
 *     and rootMargin: "0px" matches Framer's "Layer in View".
 *   - For appear-once, store a Set<Element> of fired targets so
 *     reveals don't re-run on scroll-out.
 *   - For opacity reveals, always treat as fire-once even if the
 *     bundle doesn't request it.
 *   - For loops with `__framer__loopPauseOffscreen: true`, gate
 *     play()/pause() on IntersectionObserver entries.
 *   - Initialize each target at the from-state immediately (paused
 *     WAAPI animation pinned at frame 0) before IO fires.
 */
"use client";
import { useEffect } from "react";

interface RevealSpec {
  selector: string;
  keyframes: Keyframe[];
  duration: number;
  easing?: string;
  // If true, reveal once and don't re-run on scroll-out.
  once?: boolean;
}

interface LoopSpec {
  selector: string;
  keyframes: Keyframe[];
  duration: number;
  easing?: string;
  pauseOffscreen?: boolean;
}

// ── Populate these arrays per component ───────────────────────────
const REVEAL_SPECS: RevealSpec[] = [
  // Example (Container outer wrapper scroll-transform from scale 0.8 → 1):
  // {
  //   selector: ".framer-container-outer",
  //   keyframes: [{ transform: "scale(0.8)" }, { transform: "scale(1)" }],
  //   duration: 400,
  //   easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  //   once: true,
  // },
];

const LOOP_SPECS: LoopSpec[] = [
  // Example (ring rotation from __framer__loop: { rotate: 360 }):
  // {
  //   selector: ".framer-ring-outer",
  //   keyframes: [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
  //   duration: 50_000,
  //   easing: "linear",
  //   pauseOffscreen: true,
  // },
];

// ── Execution ─────────────────────────────────────────────────────

export default function FramerEffects() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const fired = new Set<Element>();

    // Reveal targets — IntersectionObserver-driven once-only animations.
    for (const spec of REVEAL_SPECS) {
      const targets = document.querySelectorAll<HTMLElement>(spec.selector);
      if (targets.length === 0) continue;
      // Pin each target at the from-state before IO fires.
      targets.forEach((el) => {
        const initial = el.animate(spec.keyframes.slice(0, 1), { duration: 1, fill: "forwards" });
        initial.pause();
      });
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (spec.once && fired.has(e.target)) continue;
          (e.target as HTMLElement).animate(spec.keyframes, {
            duration: spec.duration,
            easing: spec.easing,
            fill: "forwards",
          });
          if (spec.once) fired.add(e.target);
        }
      }, { threshold: 0, rootMargin: "0px" });
      targets.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    // Loop targets — infinite animations, optionally pause off-screen.
    for (const spec of LOOP_SPECS) {
      const targets = document.querySelectorAll<HTMLElement>(spec.selector);
      const anims: Animation[] = [];
      targets.forEach((el) => {
        const anim = el.animate(spec.keyframes, {
          duration: spec.duration,
          easing: spec.easing,
          iterations: Infinity,
        });
        anims.push(anim);
      });
      if (spec.pauseOffscreen) {
        const io = new IntersectionObserver((entries) => {
          for (const e of entries) {
            const i = Array.from(targets).indexOf(e.target as HTMLElement);
            if (i < 0) continue;
            if (e.isIntersecting) anims[i]?.play();
            else anims[i]?.pause();
          }
        }, { threshold: 0 });
        targets.forEach((el) => io.observe(el));
        cleanups.push(() => io.disconnect());
      }
      cleanups.push(() => anims.forEach((a) => a.cancel()));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
