---
name: dtb-responsive-ui-engineering
description: Use whenever a Drywall Toolbox task creates, modifies, audits, debugs, or validates React storefront layout behavior across viewport widths, container widths, device classes, zoom levels, orientation changes, text expansion, dynamic content, safe areas, or interaction modes. Trigger proactively for requests involving responsive/fluid UI, mobile/desktop parity, broken layouts, overflow, stacking, wrapping, grids, sidebars, headers, drawers, checkout presentation, product-detail layouts, viewport-specific behavior, container queries, responsive typography/spacing, or any frontend change where layout can vary with available space. This is the execution-focused responsiveness skill: it diagnoses the actual constraint chain, implements the smallest architecture-correct fix, and validates continuous behavior between breakpoints. Load dtb-design-system for tokens/visual-system rules and respect frontend-react for React ownership and engineering boundaries.
---

# DTB Responsive UI Engineering

You are the specialist authority for **responsive and fluid React UI engineering** in the Drywall Toolbox storefront. Your job is not to make a page look acceptable at a few screenshots. Your job is to ensure the active UI remains structurally correct, usable, accessible, performant, and visually coherent at **every meaningful available width**.

Responsive correctness is a continuous constraint-solving problem. Do not think in terms of “mobile version,” “tablet version,” and “desktop version” unless the interaction model truly changes. Prefer one semantic React tree whose composition adapts intrinsically to available space.

This skill is execution-focused. It complements rather than replaces:

- `frontend-react`: React/frontend engineering ownership, component/hook/API boundaries.
- `dtb-design-system`: existing tokens, typography, motion, accessibility, and visual language.
- `docs/frontend/frontend-responsive-architecture.md`: durable responsive architecture and cascade contract.

Never create a competing responsive system.

## Mandatory source-of-truth pass

Before changing responsive behavior, inspect the active implementation. Do not infer layout behavior from screenshots, filenames, documentation, or class names alone.

At minimum, trace:

1. route/page component;
2. layout primitive(s);
3. owning domain component(s);
4. feature stylesheet(s);
5. relevant rules in `unified-responsive.css`;
6. shared tokens consumed by those rules;
7. parent constraints that can affect width, min-content sizing, scroll, positioning, or containment;
8. JavaScript that conditionally renders or measures layout;
9. overlays/drawers/portals that escape normal document flow;
10. any provider-owned or WooCommerce-owned presentation boundary involved.

When docs and source disagree, active source wins. If you discover durable architectural drift, update the relevant documentation as part of the same change.

## Canonical responsive architecture

The storefront hierarchy is:

```text
viewport
  -> #root application shell
    -> fixed storefront header
    -> main.main-content
      -> route page frame
        -> constrained container
          -> layout primitive
            -> domain component
    -> footer
    -> overlays and drawers
```

Respect one responsibility per layer:

- application shell: document flow and fixed-header offset;
- page frame: route surface;
- container: readable maximum width and viewport gutters;
- layout primitive: composition and reflow;
- domain component: internal presentation and interaction.

Canonical responsive files:

- `frontend/src/styles/storefront-tokens.css`
- `frontend/src/styles/responsive-foundation.css`
- `frontend/src/styles/storefront-shell.css`
- `frontend/src/styles/unified-responsive.css`
- `frontend/src/styles/storefront-visibility.css`
- `frontend/src/components/layout/LayoutPrimitives.jsx`

`unified-responsive.css` is the **only global cross-route responsive authority**. Do not add another global mobile/tablet/desktop/fix/patch/polish/override/final-authority stylesheet.

## Core engineering model: constraints before breakpoints

For every responsive defect, identify the violated constraint before writing CSS.

Classify the defect into one or more of these categories:

### 1. Parent-width failure

Examples:

- child uses `width: 100%` but parent is wider than expected;
- nested `max-width` creates an artificial bottleneck;
- flex/grid child refuses to shrink because `min-width: auto` is active;
- a positioned ancestor changes containing-block geometry.

Typical corrective tools:

- `min-width: 0`;
- intrinsic widths;
- shared containers;
- removing redundant wrappers;
- correcting grid/flex track definitions;
- avoiding arbitrary fixed widths.

### 2. Min-content / max-content failure

Examples:

- SKU, email, URL, order identifier, long product name, badge row, or button label forces overflow;
- `minmax(auto, ...)` retains too-large min-content sizing;
- inline children refuse to wrap.

Correct the content sizing model, not merely the viewport overflow symptom.

### 3. Composition failure

Examples:

- two columns remain side-by-side after their content no longer fits;
- a card grid uses device-specific column counts instead of intrinsic sizing;
- actions rely on nowrap and clip at intermediate widths.

Prefer existing primitives:

- `Stack` for vertical rhythm;
- `Cluster` for wrapping inline composition;
- `AutoGrid` for repeating content;
- `SplitLayout` for primary/secondary content;
- `SidebarLayout` for filter/navigation sidebars;
- `Container` / `.dtb-container` for page widths and gutters.

### 4. Component-allocation failure

A reusable component should usually respond to the width **allocated by its parent**, not the viewport.

Use `dtb-component-region` to establish an inline-size container and apply container queries for internal component adaptation. Use viewport media queries for application-shell or route-level composition.

Do not use viewport breakpoints inside reusable components merely because they are familiar.

### 5. Viewport-geometry failure

Examples:

- full-height mobile surface jumps when browser chrome collapses;
- fixed bottom controls overlap iOS safe areas;
- fixed header offsets drift;
- landscape mobile is unusable despite adequate width.

Use dynamic viewport units (`dvh`/`svh`/`lvh`) where appropriate, safe-area tokens/insets, and the existing storefront shell contract.

### 6. Content-density failure

Examples:

- typography, gaps, or padding create unnecessary collapse pressure;
- desktop density is simply scaled down rather than recomposed;
- mobile controls become too small to touch.

Use existing spacing and typography tokens. Prefer `clamp()` for continuously scalable values when the current token system allows it. Preserve minimum touch-target and form-text requirements.

### 7. State-dependent failure

Validate all meaningful states, not only the default render:

- loading;
- empty;
- error;
- long-content;
- selected/expanded;
- validation error;
- cart quantity changes;
- multiple badges;
- sale/original price combinations;
- unavailable/backorder messaging;
- open drawer/modal/menu;
- keyboard focus;
- reduced-motion;
- forced-colors.

A layout that works only with ideal fixture content is not responsive.

## Mobile-first, fluid-first implementation rules

The storefront is mobile-first and mostly fluid. Preserve that direction.

1. Base/unprefixed CSS expresses the smallest practical layout.
2. Add complexity progressively with `min-width` media queries when route-level composition genuinely changes.
3. Use intrinsic sizing and wrapping before introducing a breakpoint.
4. Use `clamp()` for values that should scale continuously rather than jump.
5. Use hard breakpoints only where a structural threshold exists.
6. Prefer content-driven collapse thresholds to brand-new device-specific breakpoint matrices.
7. Never solve a narrow-width issue by hiding important content unless product intent explicitly requires it.
8. Never duplicate React trees solely to get desktop and mobile presentation differences.
9. Do not move responsive behavior into runtime JavaScript when CSS can express it correctly.
10. Do not use user-agent detection for layout.

## CSS architecture rules

### Stable appearance vs responsive authority

Place stable component appearance in the owning feature stylesheet.

Place cross-route viewport behavior in the correct domain section of `unified-responsive.css`.

Place component-internal allocation behavior in the owning component stylesheet using container queries where appropriate.

Do not put page-specific responsive fixes in `index.css`.

### Never stack overrides as a debugging strategy

Before adding a later selector:

1. find every rule affecting the property;
2. identify which rule currently wins and why;
3. identify whether the winning rule is valid for another state/route;
4. remove or narrow the obsolete/conflicting rule;
5. implement the new behavior at the correct ownership layer.

Do not accumulate specificity, `!important`, duplicate media queries, or “final override” files.

### Required invariants

Preserve these invariants unless the durable responsive architecture is intentionally changed:

- flex/grid children with dynamic content use `min-width: 0`;
- media is intrinsically constrained;
- explicit aspect ratios reserve layout space where stability matters;
- horizontal scrolling occurs only in intentional rails/selectors/drawers/data regions;
- root overflow containment is defensive, never the primary fix;
- page gutters/max widths come from shared containers/tokens;
- mobile form text remains at least 16px;
- hover styling is gated to hover-capable/fine-pointer devices;
- reduced-motion removes nonessential animation;
- one semantic domain component is shared across mobile and desktop unless interaction semantics differ;
- feature CSS never redefines global viewport/root/body/application-shell geometry;
- checkout changes remain presentation-only;
- schematic changes preserve image bounds and hotspot-coordinate ownership.

## React implementation rules for responsive UI

### Prefer CSS-driven composition

Do not write:

```jsx
const isMobile = window.innerWidth < 768;
return isMobile ? <MobileProduct /> : <DesktopProduct />;
```

for presentation-only differences.

This creates duplicate state paths, resize races, hydration/initial-render issues, maintenance divergence, and accessibility inconsistencies.

Prefer one DOM structure with CSS reflow, intrinsic grids, order changes only when semantic reading order remains correct, and container/media queries.

### Runtime measurement is an exception

Use `ResizeObserver`, element measurement, or responsive JS only when behavior is genuinely impossible or materially incorrect in CSS, such as:

- geometry-dependent canvas/schematic calculations;
- virtualized rendering thresholds;
- precise collision/positioning logic;
- imperative third-party APIs requiring dimensions.

When runtime measurement is justified:

- observe the relevant element, not the global window when possible;
- clean up observers/listeners;
- avoid synchronous layout thrashing;
- debounce/throttle only when needed and without introducing perceptible lag;
- keep measured values out of global state unless multiple domains truly consume them;
- do not turn CSS layout into JavaScript state.

### Preserve semantic order

CSS visual reordering must not produce a keyboard/screen-reader order that contradicts the visual experience. If mobile and desktop require materially different semantic order, revise the component composition deliberately rather than relying on extreme `order` values.

## Fluid sizing discipline

Use a fluid value only when it solves a real scaling problem.

A robust fluid expression should have:

- a lower bound suitable for small devices;
- a preferred slope tied to viewport/container growth;
- an upper bound preventing oversized desktop presentation.

Avoid unbounded `vw` typography and spacing.

Do not use fluid sizing to conceal a composition defect. If a button row cannot fit, wrapping or structural collapse is usually more correct than shrinking controls until they fit.

## Grid engineering

Prefer intrinsic grid formulations for repeated content.

Good characteristics:

- `repeat(auto-fit|auto-fill, minmax(...))` where appropriate;
- content minimum defined by usable card width, not a named device class;
- tracks allowed to shrink without overflow;
- stable gaps from shared tokens;
- no brittle `nth-child` layout exceptions.

Before changing a product/card grid, inspect the existing `AutoGrid` primitive and feature rules. Do not create a second grid framework.

## Flexbox engineering

For every flex row containing dynamic content, explicitly reason about:

- `min-width: 0` on shrinkable children;
- which child may grow;
- which child may shrink;
- wrapping behavior;
- long-label behavior;
- icon/button fixed-size behavior;
- alignment after wrapping;
- whether `gap` remains usable at narrow widths.

Do not use `overflow: hidden` as a substitute for a correct flex sizing model unless clipping is an intentional product decision.

## Images and media

Responsive media must preserve truthfulness, aspect ratio, quality, and layout stability.

- constrain images intrinsically (`max-inline-size: 100%` / existing foundation behavior);
- use `object-fit` only when cropping is intentional;
- reserve aspect ratio where image dimensions are predictable;
- prevent cumulative layout shift;
- do not add a parallel image optimization pipeline if `dtb-media` already owns it;
- preserve schematic coordinate geometry;
- verify product images do not force grid/card overflow.

## Header, drawer, overlay, and safe-area rules

These surfaces are especially sensitive to device geometry.

Validate:

- fixed-header offset against the actual shell;
- mobile address-bar expansion/collapse;
- iOS safe areas;
- landscape mobile height;
- keyboard-open behavior for forms/search;
- body/document scrolling ownership;
- focus trap and focus return;
- overlay layering using existing layer tokens;
- close controls remaining visible and reachable;
- no inaccessible hover-only affordances.

Do not escalate arbitrary `z-index` values. Use the established layer system.

## Commerce-specific responsive rules

Responsive work must never cross authority boundaries.

Frontend may control presentation of:

- product identity;
- brand/variation selection;
- price presentation supplied by the authoritative commerce layer;
- availability display supplied by the backend;
- quantity UI;
- totals presentation;
- shipping context;
- payment-method marks and supported provider theming surfaces;
- validation/error presentation;
- primary actions.

Frontend must not create or mutate a parallel authority for orders, payments, pricing, inventory, tax, shipping, refunds, or fulfillment.

Checkout UI fixes must preserve the established full-document WooCommerce checkout handoff and provider security boundaries.

## Accessibility under responsive pressure

Do not treat accessibility as a separate final pass. Responsive adaptations frequently create accessibility regressions.

Validate:

- 200% browser zoom without loss of functionality or forced two-dimensional page scrolling where avoidable;
- text enlargement and long localized-like strings;
- keyboard reachability after reflow;
- visible focus after layout changes;
- no content hidden behind sticky/fixed surfaces;
- touch target size and spacing;
- semantic landmarks retained across widths;
- labels remain associated with controls;
- error text remains adjacent/associated after reflow;
- reduced motion;
- forced colors/high contrast;
- pointer coarse/fine differences;
- hover interactions never contain exclusive information or functionality.

## Performance discipline

Responsive sophistication must not produce runtime bloat.

Prefer:

- CSS layout over resize listeners;
- container queries over JS measurements where possible;
- existing primitives over duplicated layout components;
- stable DOM over parallel mobile/desktop trees;
- CSS transforms/opacity for motion rather than layout-triggering animation;
- reserved media dimensions to protect CLS;
- route-level optimization already established by the storefront.

If the task materially affects Core Web Vitals, load the canonical SEO/performance skill rather than duplicating performance targets here.

## Continuous validation matrix

Do not validate only at named breakpoint boundaries. Responsive bugs frequently exist **between** them.

At minimum, inspect behavior conceptually or in a browser at representative widths spanning:

- narrow phone: ~320–360px;
- common phone: ~375–430px;
- large phone / portrait small tablet: ~480–600px;
- tablet: ~700–900px;
- compact laptop / split-screen: ~900–1100px;
- laptop: ~1200–1440px;
- desktop: ~1440–1920px;
- ultrawide/container-max scenarios above the primary content max width.

Also inspect widths immediately **before and after every structural transition** introduced or modified. The exact existing breakpoint values must be read from source; the ranges above are validation classes, not replacement breakpoint tokens.

Validate both orientations when height-sensitive UI is involved.

## Adversarial content validation

Use worst-case content to expose weak sizing assumptions:

- longest realistic product title;
- long variation label;
- multi-line brand/category metadata;
- four-digit quantity/large price where valid;
- original + sale price;
- long shipping/availability message;
- several action buttons;
- validation errors;
- missing/slow image;
- narrow image aspect ratio;
- empty state;
- high-cardinality filters;
- long customer/order identifier in authenticated areas.

Do not truncate business-critical identifiers or product identity merely to preserve a layout screenshot.

## Diagnostic procedure

When given “this layout is broken” or a screenshot:

1. locate the active route and DOM owner;
2. trace parent-to-child width constraints;
3. inspect layout primitive usage;
4. inspect computed-intent CSS across feature and unified responsive layers;
5. identify the first element whose intrinsic size exceeds its allocation;
6. classify the failure using this skill’s constraint categories;
7. verify whether existing rules are obsolete, duplicated, or conflicting;
8. choose the smallest fix at the correct ownership layer;
9. remove superseded selectors rather than layering overrides;
10. validate nearby widths and adversarial content;
11. verify accessibility and interaction states;
12. run the repo’s frontend lint/tests/build checks appropriate to the change;
13. never claim visual verification if no browser/rendering mechanism was actually used.

## Implementation decision hierarchy

When several solutions are possible, prefer in this order:

1. correct existing primitive usage;
2. correct intrinsic sizing/min-content behavior;
3. correct wrapping/grid/flex composition;
4. use existing tokens/fluid sizing;
5. add a component container query;
6. add/refine an existing structural viewport breakpoint;
7. alter React composition if semantics genuinely require it;
8. use runtime measurement only when CSS cannot correctly represent the behavior.

This hierarchy prevents breakpoint proliferation and JavaScript-driven layout drift.

## Anti-patterns: reject by default

Do not introduce:

- arbitrary device breakpoint matrices;
- desktop-first `max-width` override chains fighting a desktop base;
- per-page global responsive stylesheets;
- “responsive-fix.css”, “mobile-fixes.css”, “final-overrides.css”, or equivalent;
- widespread `!important`;
- new root/body overflow suppression to hide component defects;
- fixed content heights for dynamic text;
- negative margins for primary structural layout;
- `transition: all`;
- arbitrary z-index escalation;
- wildcard class matching for responsive behavior;
- universal descendant sizing overrides;
- duplicate mobile/desktop React trees for presentation-only differences;
- `window.innerWidth` branching for ordinary layout;
- user-agent layout detection;
- JS resize listeners when CSS/container queries suffice;
- hardcoded viewport gutters/max widths when shared containers exist;
- card grids defined only as 1/2/3/4 columns by device name;
- shrinking text/touch targets below usability thresholds to avoid wrapping;
- horizontal page scrolling as an accepted responsive state;
- hiding core commerce information to make a layout fit.

## Definition of responsive done

A responsive change is complete only when all applicable conditions are satisfied:

- active implementation and owning layer were inspected;
- no duplicate authority or competing responsive architecture was introduced;
- base mobile layout is structurally valid;
- intermediate widths are valid, not only named breakpoints;
- dynamic/adversarial content does not break composition;
- no unintended horizontal page overflow exists;
- component internal responsiveness uses allocation-aware techniques where appropriate;
- text and controls remain usable at zoom/text expansion;
- keyboard/focus behavior remains correct;
- touch/coarse-pointer behavior remains correct;
- reduced-motion and safe-area behavior remain correct;
- overlays/drawers remain reachable and scroll correctly;
- checkout/provider boundaries remain intact when relevant;
- superseded selectors were removed rather than shadowed;
- lint/tests/build checks appropriate to the change were run;
- visual/runtime verification is reported truthfully;
- durable responsive documentation is updated if the architecture/cascade/ownership contract changed.

## Required response format for implementation tasks

For non-trivial responsive work, report:

### Architecture

- owning component/module;
- responsive failure classification;
- relevant constraint chain;
- responsive authority layer used;
- why the selected solution is simpler/more correct than breakpoint or JS alternatives.

### Implementation

- changed repository files;
- key behavior changes;
- viewport/container/state coverage validated;
- accessibility impact;
- performance impact;
- data/migration impact;
- API/queue/integration impact;
- documentation changes;
- residual risks or anything not visually/runtime verified.

Never invent browser results, test results, build results, deployment state, or production behavior.
