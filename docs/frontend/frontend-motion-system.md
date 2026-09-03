# Frontend Motion System

## Ownership

`frontend/` owns storefront presentation motion. Motion must never become an authority for commerce state, payment state, inventory, orders, checkout persistence, routing data, or provider behavior.

The motion system has two canonical authorities:

- `frontend/src/motion/dtbMotion.js` — Framer Motion transitions, variants, low-bounce spring physics, distances, durations, and reduced-motion variants.
- `frontend/src/styles/storefront-tokens.css` — matching CSS duration/easing/distance tokens.

`frontend/src/styles/storefront-motion.css` is the shared CSS timing layer. Feature styles still own geometry, appearance, layout, and component-specific states.

`frontend/src/components/motion/GlobalMotionProvider.jsx` applies the application-wide Framer Motion default and `reducedMotion="user"` for the complete React tree.

## Motion language

DTB uses one motion language across desktop, tablet, and mobile. It does not use one literal animation for every interaction. The semantic classes are deliberately limited:

1. **Route/content reveal** — deterministic fade + micro-lift. Uses the standard 320 ms tween and the standard settle curve.
2. **Elevated reveal** — hero media and deliberate presentation changes. Uses the emphasized 360–400 ms curve.
3. **Direct manipulation** — tab indicators, toggles, drawers, and controls whose geometry visibly follows user interaction. Uses the restrained low-bounce spring.
4. **Exit/dismissal** — short 180 ms dismissal so interfaces do not develop a sluggish tail.
5. **Loading replacement** — 440 ms structural skeleton/content crossfade. Skeletons reserve final geometry before real content is exposed.

## Canonical motion values

### Timed easing

- Standard: `cubic-bezier(0.22, 1, 0.36, 1)`
- Emphasized: `cubic-bezier(0.16, 1, 0.3, 1)`
- Soft: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Exit: `cubic-bezier(0.4, 0, 0.2, 1)`

### Durations

- Instant: 100 ms
- Fast: 180 ms
- Normal: 320 ms
- Elevated: 360 ms
- Overlay: 400 ms
- Slow/loading replacement: 440 ms

### Physical response

The default interactive spring is intentionally restrained rather than playful:

- stiffness: 360
- damping: 34
- mass: 0.82

The gentler sheet/drawer spring uses:

- stiffness: 300
- damping: 32
- mass: 0.9

Springs do not receive a CSS easing function. Spring physics and timed easing are separate transition models; components choose the appropriate semantic model rather than combining incompatible parameters.

## Responsive contract

Motion behavior is not duplicated for mobile and desktop. The same semantic tokens and variants apply at every breakpoint. Mobile differences are limited to geometry where the interaction itself differs—for example, a sheet can travel by a percentage while a desktop modal uses a small pixel offset.

Mobile navigation and drawers must use the shared low-bounce spring and the CSS motion tokens. Horizontally scrollable tab rails may use native smooth scrolling when motion is allowed and `auto` scrolling when reduced motion is requested.

## Accessibility

`GlobalMotionProvider` uses `reducedMotion="user"`, and the CSS timing authority includes a `prefers-reduced-motion: reduce` contract. Reduced motion removes nonessential transforms, smooth scrolling, shimmer animation, and long CSS transitions while preserving state changes, visibility, focus, and layout.

Do not build separate reduced-motion component trees unless the interaction semantics themselves require it.

## Performance rules

- Prefer opacity and transform for visual movement.
- Do not animate page width, expensive layout properties, or large blur values for routine navigation.
- Do not apply universal `transition` declarations to every element.
- Do not use `transition: all` in new code.
- Avoid long-running animation except structural loading shimmer where progress is genuinely unresolved.
- Route transitions must not delay data fetching or hide component-level loading states.
- Loading skeletons must reserve final component geometry to prevent layout jumps.

## Implementation rules

New Framer Motion code should import semantic transitions/variants from `dtbMotion.js`. New CSS should use `--dtb-motion-*` tokens. Do not introduce local cubic-bezier arrays, arbitrary spring constants, or one-off durations when an existing semantic token applies.

When modifying an existing component with bespoke motion, migrate it to the nearest semantic transition rather than adding another timing value. Feature-specific motion is acceptable only when the interaction cannot be accurately represented by the existing route, content, surface, overlay, direct-manipulation, or exit semantics.
