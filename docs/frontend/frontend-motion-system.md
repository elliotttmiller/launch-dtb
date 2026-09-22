# Frontend Motion and Render Continuity System

## Ownership

`frontend/` owns storefront presentation motion, route rendering continuity, client-side code preloading, local loading presentation, accessibility, and responsive behavior. These concerns must never become authorities for commerce state, payment state, inventory, orders, checkout persistence, routing data, or provider behavior.

The motion system has two canonical timing authorities:

- `frontend/src/motion/dtbMotion.js` — Framer Motion transitions, variants, restrained spring physics, distances, durations, and reduced-motion variants.
- `frontend/src/styles/storefront-tokens.css` — numerically matching CSS duration/easing/distance tokens.

`frontend/src/styles/storefront-motion.css` is the shared CSS timing layer. Feature styles continue to own geometry, appearance, layout, and component-specific states.

`frontend/src/components/motion/GlobalMotionProvider.jsx` applies the application-wide Framer Motion default and `reducedMotion="user"`.

## Render-continuity contract

Route loading is not page animation. Data loading is not route loading. Image loading is not page loading.

The customer-facing contract is:

1. Persistent content stays persistent.
2. Destination geometry appears immediately when a lazy route is unresolved.
3. Only unresolved regions display loading treatment after the route module is available.
4. Page roots never animate from `opacity: 0`.
5. Likely route code is requested from navigation intent before the click completes.
6. Motion confirms a state transition; it must not conceal application latency.
7. Loading indicators must preserve the geometry of the state they replace instead of introducing an unrelated full-page surface.

The persistent header, footer, cart shell, navigation surfaces, and other application chrome remain mounted during normal route navigation.

## Route-module loading

`frontend/src/routing/routeModules.js` is the route-module loading authority. It owns:

- the mapping from application route groups to dynamic page imports;
- promise de-duplication so preload and render consume the same module request;
- route-path resolution for preload intent;
- the existing one-time chunk-load recovery behavior.

Do not define a second independent dynamic import for a route that already exists in this registry. A preload that downloads different code than the corresponding `React.lazy` boundary defeats the continuity contract.

`frontend/src/components/routing/RouteIntentPreloader.jsx` observes same-origin internal links and preloads recognized route modules on pointer intent, keyboard focus, and touch intent. Imperative navigation surfaces that are not anchors should call `preloadRoute()` before navigation when practical. Product cards do this explicitly for PDP navigation.

Preloading is an optimization only. Routing correctness must never depend on a successful preload.

## Lazy-route pending surfaces

The application-level `Suspense` boundary uses `RouteLoadingSurface`, not a centered route spinner.

The pending surface is intentionally static and geometry-oriented:

- catalog routes reserve heading and product-grid geometry;
- product routes reserve gallery and purchase-panel geometry;
- account/content routes reserve stable content-panel geometry.

These surfaces do not attempt to reproduce business data and do not own loading state after the route module has rendered. Route components remain responsible for their own data skeletons and unresolved regions.

Protected routes use the same pending-surface language while authentication is validating. Authentication and redirect behavior remain unchanged.

## Application-shell boundary

`GlobalMotionProvider` is mounted in `frontend/src/main.jsx` above `App`, routing, header, footer, cart/sidebar surfaces, route content, dialogs, drawers, and other application UI.

`PageTransition` animates only the changing route surface. Its route variant must remain fully opaque from the first frame. The current route motion is a 4 px settle using the fast 180 ms semantic tween. Do not change it to an entire-page fade.

Checkout is excluded from the normal route wrapper because payment-provider rendering and checkout integrity take precedence over decorative page motion. Provider-owned payment controls must never be wrapped in transforms or transitions that could interfere with focus, authentication, or payment behavior.

## Motion language

DTB uses one restrained motion language across desktop, tablet, and mobile:

1. **Route settle** — opaque 4 px micro-lift, 180 ms.
2. **Async replacement** — structural skeleton/content crossfade, 220 ms.
3. **Standard content reveal** — 320 ms, only for genuinely new in-page content where a reveal communicates state.
4. **Elevated reveal** — 360–400 ms for deliberate overlays or major presentation changes.
5. **Direct manipulation** — low-bounce spring for drawers, indicators, toggles, and controls whose geometry follows user interaction.
6. **Exit/dismissal** — 180 ms.

A component must not replay a second root entrance animation immediately after `PageTransition`. Local animations are appropriate for dialogs, accordions, transient messages, cart-line insertion/removal, image-gallery changes, and similar stateful regions.

## Canonical motion values

### Timed easing

- Standard: `cubic-bezier(0.22, 1, 0.36, 1)`
- Emphasized: `cubic-bezier(0.16, 1, 0.3, 1)`
- Soft: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Exit: `cubic-bezier(0.4, 0, 0.2, 1)`

### Durations

- Instant: 100 ms
- Fast/route settle: 180 ms
- Async replacement: 220 ms
- Normal: 320 ms
- Elevated: 360 ms
- Overlay: 400 ms
- Slow: 440 ms

The 440 ms token remains available for rare intentionally slow presentation work. It is not the loading-replacement duration.

### Physical response

Default interactive spring:

- stiffness: 360
- damping: 34
- mass: 0.82

Gentler sheet/drawer spring:

- stiffness: 300
- damping: 32
- mass: 0.9

Springs do not receive CSS easing functions.

## Loading hierarchy

Use the narrowest valid loading boundary:

- **Route module unresolved:** `RouteLoadingSurface`.
- **Authentication unresolved:** the protected-route pending surface.
- **Page data unresolved:** a skeleton local to that page region.
- **Image unresolved:** image placeholder/skeleton inside its existing media geometry.
- **Mutation pending:** preserve existing content and disable/annotate the affected control; do not replace the complete page.
- **Document navigation/checkout handoff:** keep the current document visible until the browser commits the destination unless the dedicated checkout flow owns a different safe handoff.

Avoid sequential replacement chains such as route spinner → page spinner → skeleton → content.

## Responsive contract

Motion semantics are shared across breakpoints. Mobile differences are limited to interaction geometry where the interaction itself differs.

Mobile navigation and drawers use the shared low-bounce spring. The outer mobile-drawer shell is structural only; the Motion backdrop and drawer own entrance/exit animation so CSS does not double-animate the same surface.

Pending route geometry collapses responsively while retaining the destination's general visual structure.

## Accessibility

`GlobalMotionProvider` uses `reducedMotion="user"`, and the CSS motion authority includes a `prefers-reduced-motion: reduce` safety net.

Reduced motion removes nonessential transforms, smooth scrolling, shimmer animation, and long CSS transitions while preserving state changes, visibility, focus, layout, and loading semantics. Static route pending geometry remains visible because it communicates application state without requiring animation.

## Performance rules

- Prefer opacity and transform for motion.
- Page roots must remain opaque.
- Do not animate page width, expensive layout properties, or large blur values for routine navigation.
- Do not apply universal transitions or `transition: all`.
- Do not stack CSS and Framer Motion transforms on the same interaction surface.
- Route transitions must not delay data fetching.
- Loading skeletons reserve final component geometry.
- Do not disable route code splitting to hide lazy-loading defects; preload likely chunks instead.
- Internal route preloading must remain same-origin and de-duplicated.
- Geometry measurement must batch reads before writes where possible to avoid forced synchronous layout.
- Persistent shell components stay mounted during route transitions.

## Regression contract

`frontend/tests/renderContinuityContract.test.mjs` statically protects the critical continuity rules: centralized route loading, no legacy route spinner, opaque route motion, the 220 ms async replacement token, and absence of root fades on the specifically remediated cart/repair/order-tracking surfaces.

This test supplements browser profiling; it does not prove runtime frame pacing. Lighthouse/Chrome Performance traces remain required when changing startup providers, global CSS, large navigation surfaces, or animation-heavy components.

## Implementation rules

New Framer Motion code should consume semantic transitions/variants from `dtbMotion.js`. New CSS should use `--dtb-motion-*` tokens.

When modifying bespoke motion, migrate it to the nearest semantic transition instead of adding one-off timings. Feature-specific motion is acceptable only where the interaction cannot be represented by route, async, content, surface, overlay, direct-manipulation, or exit semantics.
