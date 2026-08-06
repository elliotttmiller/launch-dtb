---
name: dtb-design-system
description: Use whenever a task touches responsive layout, design tokens (color/spacing/typography/elevation/motion), UX patterns (loading/error/empty states, navigation, forms, motion, accessibility), or Core Web Vitals-adjacent performance for the Drywall Toolbox storefront. Trigger on requests like "make this responsive", "this looks inconsistent with the rest of the site", "improve the loading/empty state", "audit our design system", or "why does this feel over-engineered/inconsistent". Grounds every recommendation in the actual existing token system (storefront-tokens.css, global-typography.css, tailwind.config.js) — never proposes a new design-token architecture, font pairing, or breakpoint system from scratch, since DTB already has one. Load references/typography.md for deep typography rules.
---

# DTB Design System

Drywall Toolbox already has a design token system, a two-tier typography system, and an established responsive/UX pattern language. This skill's job is to **audit against and reinforce that existing system**, not to design a new one — DTB is not greenfield. Never propose "define a color palette strategy" or "choose a breakpoint strategy" as if none exists; find the existing one first (`frontend/src/styles/storefront-tokens.css`, `global-typography.css`, `responsive-foundation.css`, `unified-responsive.css`, `tailwind.config.js`) and work from it.

## Where the actual system lives

- **Color tokens**: `--color-primary-*`/`--color-accent-*` CSS custom properties (in `frontend/src/index.css` / `css/styles.css`), consumed through Tailwind's `primary`/`accent` scale in `tailwind.config.js`. Primary brand action color is `#2255ee` (Add to Cart); Checkout Now is black — this contrast is a deliberate, documented convention (`AGENTS.md` §9), not an inconsistency to "fix."
- **Typography tokens**: two-tier Geist (display)/Nunito (body) system in `global-typography.css` — see `references/typography.md` for the full rule set and how it maps to Butterick/Bringhurst typographic principles.
- **Responsive foundation**: `responsive-foundation.css`, `unified-responsive.css` — the existing breakpoint/fluid-scaling authority. Read these before introducing a new breakpoint or media query pattern; match the existing scale rather than picking arbitrary values.
- **Motion**: Framer Motion + Tailwind `animation`/`keyframes` extensions (`fade-in`/`slide-up`/`slide-down`, 0.3-0.5s ease timing already established in `tailwind.config.js`) plus dedicated motion CSS files (`account-hub-motion.css`, `loading-transitions.css`). Match existing duration/easing tokens rather than inventing new ones per component.
- **Component-specific tokens/patterns**: many features have their own CSS file (`storefront-product-card.css`, `filter-panel.css`, `machined-design.css`, etc.) — check for an existing file governing the component in question before writing new rules; this codebase's convention is one feature CSS file per domain, not one global stylesheet.

## Responsive & cross-device (audit checklist, not a from-scratch plan)

**Confirmed direction: mobile-first, mostly fluid.** `responsive-foundation.css`/`unified-responsive.css` are majority `min-width` media queries (progressive enhancement from a mobile base, not `max-width` overrides of a desktop base), and `clamp()`-based fluid sizing is already in wide use across feature CSS files. Any new layout work should extend this direction, not introduce a competing desktop-first or fixed-breakpoint-only pattern.

- [ ] Layout adapts correctly at the breakpoints `responsive-foundation.css`/`unified-responsive.css` already define — verify actual values in source rather than assuming standard 320/768/1024/1440 breakpoints apply here.
- [ ] Touch targets, focus visibility, reduced motion, forced-colors mode, safe-area handling — already required by `frontend-react`'s engineering standards; this skill doesn't duplicate that, just flags it as part of the same audit pass.
- [ ] Dynamic viewport units (`dvh`/`svh`/`lvh`) used instead of bare `vh` for any full-height mobile layout (checkout, drawers, modals) where the address-bar-collapse behavior on mobile Safari/Chrome would otherwise cause a layout jump.
- [ ] Images: check whether `srcset`/responsive art direction is already handled by the existing media pipeline (`dtb-media` backend module) before proposing a new one — don't build a parallel image-optimization system.
- [ ] Fluid typography: only introduce `clamp()` sizing where a genuine cross-breakpoint scaling need exists and it doesn't fight the existing fixed type scale in `global-typography.css` — check `references/typography.md` before adding one.

## UX patterns (audit checklist)

- [ ] **Loading/error/empty states**: every async surface handles all three explicitly (this duplicates a rule already in `frontend-react`'s "Data, loading, and error states" section — this skill exists to catch it at the design-review layer too, e.g. when auditing an existing page rather than writing new code).
- [ ] **Navigation**: match the existing responsive nav patterns already built (`storefront-desktop-navigation.css`, `mobile-hamburger.css`, `storefront-drawer.css`, mega-menu in `storefront-shop-mega-menu.css`) — don't introduce a new navigation paradigm (e.g. a bottom tab bar) without an explicit reason tied to a real UX problem, since it would be inconsistent with the rest of the site.
- [ ] **Forms**: no form library is installed in this repo (verified — no `react-hook-form`/`formik`/`yup`/`zod` in `package.json`) — match the existing controlled-component + manual-validation pattern (`auth-form-templates.css` and its paired components) rather than introducing a new form library as part of a UX fix.
- [ ] **Motion**: purposeful only — check `prefers-reduced-motion` is respected (already required); match existing duration/easing tokens; flag any animation that exists for decoration rather than feedback/affordance.
- [ ] **Accessibility**: WCAG 2.1 AA baseline — contrast ratios against the actual token colors (compute, don't assume), ARIA roles only where semantic HTML can't express the pattern, focus management on any modal/drawer/overlay open-close cycle.

## Diagnosing "why does this feel over-engineered"

When asked to explain why a UI area (e.g. checkout) feels overly complex, the actual causes in a codebase like this are usually one or more of:
1. **Layering mismatch** — presentation code (theme CSS/JS) trying to control state that a third-party system (WooCommerce Checkout Block, Stripe Elements) already owns, requiring workarounds instead of direct control. This is an architecture question, not a styling one — hand off to `commerce-checkout` for anything checkout-specific, since it owns the actual provider-boundary contract.
2. **Token drift** — multiple CSS files independently redefining spacing/color/font values instead of consuming the shared tokens, producing inconsistency that looks like complexity. Check for hardcoded hex/px values that should reference `storefront-tokens.css`/`global-typography.css` custom properties.
3. **Redundant/legacy CSS files** — a feature CSS file superseded by a later one but never removed (e.g. multiple files touching the same component over time). Grep for the actual class names in use before assuming an old file is dead.
4. **Fighting the provider's own styling surface** — trying to restyle a cross-origin iframe or a third-party component library's internals instead of using its supported theming API (Stripe Appearance API, WooCommerce Checkout Block's own style hooks). This is explicitly forbidden for Stripe per `commerce-checkout`'s hard boundaries — the "seamless checkout" goal is achieved through the Appearance API and the theme's presentation layer around the block, not by fighting the block's DOM.

Report findings as: which of these four (or a combination) is the actual cause, with file-level evidence — not a generic "the code is too complex" observation.

## Performance

Core Web Vitals targets and CSR-specific technique guidance live in the `dtb-seo` skill (LCP/INP/CLS are also ranking factors, so that's the canonical home) — load it for performance work rather than duplicating targets here.
