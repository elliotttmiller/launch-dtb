# Drywall Toolbox — Universal Toolset Builder
## Product, UX, Architecture, Media, Commerce, and Delivery Blueprint

**Document status:** Product and architecture blueprint  
**Repository:** `elliotttmiller/launch-dtb`  
**Intended repository destination:** `docs/architecture/toolset-builder/TOOLSET_BUILDER_BLUEPRINT.md`  
**Audience:** AI engineering agents, principal engineers, frontend/backend engineers, product designers, reviewers, and operators

---

# 0. Purpose of this blueprint

This document defines the intended **experience, domain model, architectural boundaries, behavioral requirements, visual references, constraints, risks, and success criteria** for the Drywall Toolbox Universal Toolset Builder.

It is intentionally **not a code specification**.

It does not prescribe:

- exact filenames to create;
- exact class or function names;
- exact REST route names;
- exact DTO/property names;
- exact React component decomposition;
- exact database structures;
- exact query implementations;
- exact state-management implementation;
- exact rendering libraries;
- exact migration mechanics;
- exact test-framework structure.

The implementation agent is expected to inspect the active repository, understand the existing execution paths and conventions, and choose the smallest complete production-grade implementation that satisfies this blueprint while preserving Drywall Toolbox architecture.

The governing rule is:

> **This blueprint defines what the Toolset Builder must accomplish and the boundaries it must preserve. Active implementation determines how it should be integrated.**

When this document and the active repository differ, the agent must determine whether the difference is:
1. an intentional current implementation constraint;
2. an architectural deficiency that should be changed;
3. a stale assumption in this blueprint.

The agent must not blindly force this document onto the repository.

---

# 1. Desired product outcome

Drywall Toolbox should provide one **Universal Toolset Builder** that lets a contractor assemble the exact professional tool setup they want from the live DTB product catalog.

The experience should not depend on operators manually creating every possible toolset bundle or every brand/workflow combination.

A customer should be able to:

- begin from scratch;
- begin from a useful job/workflow preset;
- optionally focus on a preferred brand;
- browse eligible products from the existing catalog;
- choose exact WooCommerce variations where applicable;
- add multiple tools in categories that naturally support multiple selections;
- mix brands when the selected products are actually compatible;
- understand required, optional, included, dependent, and incompatible items;
- see live product pricing and availability derived from authoritative commerce/catalog state;
- review the entire configuration before adding it to the cart;
- see a professional visual collage of the exact selected products;
- add the configuration into the existing WooCommerce cart and checkout lifecycle.

The builder should feel like a purpose-built professional configuration system, not a generic ecommerce filter page and not a traditional “bundle product.”

---

# 2. Product philosophy

The builder should be designed around three ideas.

## 2.1 The catalog should power the builder

If a new eligible product or variation is added to the catalog and classified correctly, it should become available in the appropriate builder context without someone manually editing a specific toolset.

## 2.2 A toolset is created by the customer

A toolset is not primarily a pre-created WooCommerce product.

It is the customer's validated selection of existing WooCommerce products and variations, associated together as one configuration.

## 2.3 Workflows describe jobs, not manufacturers

The product should think in terms of jobs such as:

- complete automatic taping;
- taping;
- finishing;
- flat-box finishing;
- corner finishing;
- custom setup.

Manufacturer is usually a filter, preference, or compatibility dimension—not a separate version of the workflow.

---

# 3. Architectural guardrails

These are hard system boundaries. The implementation agent may choose the internal design, but must not violate these ownership rules.

## React storefront

Owns:

- UI rendering;
- route-level presentation;
- local builder interaction state;
- responsive behavior;
- accessibility;
- filters and current active step;
- non-authoritative rendering of server-owned catalog/commerce state.

React must not become authority for:

- prices;
- tax;
- shipping;
- inventory allocation;
- authoritative discount calculation;
- order creation;
- payment state;
- refund state;
- fulfillment.

## WooCommerce

Remains authority for:

- runtime products and variations;
- purchasability;
- cart/session;
- authoritative commerce totals;
- checkout;
- tax/shipping;
- orders;
- refunds;
- commerce persistence.

## DTB catalog/domain backend

Owns the business meaning of:

- tool-family classification;
- builder eligibility;
- workflow requirements;
- compatibility;
- product relationships;
- required/dependent accessory rules;
- builder-oriented catalog projections;
- server validation of configurations.

## DTB commerce backend

Owns DTB-specific integration with the authoritative WooCommerce cart and any safe grouping metadata required to carry toolset identity through commerce.

## Veeqo

Remains inventory/allocation/fulfillment/shipping/tracking authority.

## QuickBooks

Remains accounting projection authority.

## Action Scheduler

Remains the asynchronous execution mechanism for DTB WordPress backend work when asynchronous work is genuinely required.

---

# 4. Order and checkout boundary

The Toolset Builder must terminate into the existing WooCommerce commerce path.

The intended lifecycle is:

```text
Toolset Builder
  → authoritative WooCommerce cart/session
  → native WooCommerce checkout
  → provider-owned payment flow
  → WooCommerce order/payment state
  → existing DTB order-event and queue architecture
  → Veeqo / QuickBooks / notifications
```

The builder must not:

- create orders itself;
- create a parallel cart;
- create a parallel checkout;
- own payment fields or payment confirmation;
- bypass existing order-event or integration boundaries.

---

# 5. Current repository context to audit

The repository already contains significant toolset-builder backend foundations. The implementation agent must inspect their current active behavior rather than assuming they are correct or complete.

At the time this blueprint was prepared, relevant implementation existed around:

- product builder metadata;
- canonical tool families;
- toolset definitions/templates;
- toolset eligibility;
- toolset validation;
- toolset REST reads;
- toolset cart metadata;
- order-line persistence of toolset metadata.

The current frontend Toolset Builder route was not active in the inspected tree.

The agent should specifically evaluate whether existing builder-domain code should be:
- reused as-is;
- evolved;
- simplified;
- migrated;
- or partially replaced.

The presence of existing code is not by itself a reason to preserve a poor domain model.

---

# 6. Important current-state architectural concern

The existing backend currently contains both:

- canonical tool-family classification; and
- builder-specific slot/eligibility metadata.

This creates the possibility of duplicate truth.

The desired model is that normal product discovery should be driven primarily by **what the product actually is** in the canonical catalog, with builder-specific overrides used only where genuinely necessary.

The implementation agent should audit whether current builder-slot metadata is:
- needed as authoritative policy;
- merely historical;
- an optimization;
- or duplicate state that should be reduced.

The end state should avoid requiring operators to classify the same product multiple times in different systems just to make it visible in the builder.

---

# 7. Universal workflow model

The builder should expose a small number of generic workflows that map to actual drywall-finishing work.

Recommended product-level concepts include:

- Complete Automatic Taping
- Taping
- Finishing
- Flat Box
- Corner Finishing
- Custom / Build from Scratch

These are **business concepts**, not mandatory implementation identifiers.

The implementation agent should determine the best way to represent them within the existing catalog/domain architecture.

Each workflow should describe:

- what kinds of tools are relevant;
- which capabilities are required;
- which are optional;
- which can be selected multiple times;
- which become relevant only because of another selection;
- compatibility/dependency expectations;
- helpful user-facing copy.

Workflows should not contain duplicated copies of product identity, price, stock, or imagery.

---

# 8. Functional slot model

The builder should reason in functional slots/capabilities rather than positional duplicates.

Examples include:

- automatic taper;
- loading pump;
- flat boxes;
- flat-box handle;
- corner finisher / angle head;
- corner applicator / corner box;
- corner roller;
- corner handles;
- adapters and accessories.

Some capabilities naturally allow multiple selections.

For example:

> **Flat Boxes — choose 1–3**

The system should model that as one capability with cardinality, rather than requiring artificial concepts such as “Flat Box 1,” “Flat Box 2,” and “Flat Box 3” unless the existing architecture has a strong technical reason for doing so.

The implementation agent should choose the representation that best aligns domain semantics with the existing codebase.

---

# 9. Catalog synchronization expectations

The builder should stay synchronized with normal catalog lifecycle events.

A properly classified new product should be discoverable in the appropriate builder context.

A new variation should become selectable.

An unpublished or non-purchasable item should no longer be offered as a valid choice.

Price and availability changes should be reflected according to the storefront's existing freshness/caching policy.

The builder should not require operators to:

- manually append products to specific toolset lists;
- manually create bundle products for every configuration;
- manually copy prices into workflow definitions;
- manually create brand-specific duplicates of the same logical workflow.

---

# 10. Brand behavior

Brand should normally operate as a customer preference/filter.

Examples:

- Complete setup — All Brands
- Complete setup — TapeTech
- Complete setup — Columbia
- Finishing — All Brands
- Flat Box — USG Sheetrock Tools

The builder should allow cross-brand selections when they are actually compatible.

It should not assume:

> same brand = compatible

or:

> different brand = incompatible.

If product management later requires intentionally brand-locked configurations, that should be an explicit product rule rather than an accidental consequence of the builder architecture.

---

# 11. Compatibility principles

Compatibility must be treated as a real domain concern.

Tool-family membership only answers:

> What kind of tool is this?

It does not necessarily answer:

> Does this exact handle, adapter, head, pump, or box work with this exact selected product?

The builder should use authoritative product relationships/compatibility data wherever available.

The implementation agent should inspect the existing compatibility model and determine whether it is sufficient for:

- direct compatibility;
- required companion products;
- required adapters;
- substitutions;
- included accessories;
- cross-brand relationships.

The UI must never silently remove or replace an incompatible user selection.

When a conflict exists, the experience should explain:

- what is incompatible;
- why it matters when that explanation is known;
- what compatible alternatives exist;
- whether an adapter or dependency resolves the issue.

---

# 12. Product and variation experience

Variable products should be presented as one coherent product family wherever that improves decision-making.

Example experience:

```text
TapeTech EasyClean Finishing Box

Size
[ 7" ] [ 8" ] [ 10" ] [ 12" ]

Current variation price
Availability

Add to Set
```

The builder should avoid rendering every variation as an unrelated duplicate card unless there is a strong catalog/UX reason.

The exact identity of the selected parent/variation must remain preserved for commerce.

---

# 13. Customer-facing information architecture

The builder should behave as one coherent workflow with several important views/states rather than a collection of unrelated standalone pages.

The key user experiences are:

1. Builder Landing
2. Workflow Selection
3. Guided Builder Workspace
4. Product / Variation Selection
5. Compatibility Resolution
6. Review Set
7. Expert Mode
8. Mobile Builder
9. Mobile Set Summary

The agent should determine the most appropriate route and state model after inspecting the active frontend conventions.

---

# 14. Builder Landing UX

## Purpose

Introduce the capability clearly and let the customer choose how they want to start.

The page should communicate:

- Build Your Drywall Tool Set;
- use the live catalog;
- choose by workflow, brand preference, or from scratch;
- mix compatible tools where supported;
- current pricing/availability are tied to the real catalog;
- the builder is for professional drywall tool configurations.

Primary paths:

- Start Building
- Explore Workflows
- Start with a Brand / filter by brand

Popular workflows should be visible without requiring a long explanation.

### Official mockup

![Builder Landing](assets/mockups/01-builder-landing.png)

This image communicates design intent. It is not a pixel-perfect implementation mandate.

---

# 15. Workflow Selection UX

## Purpose

Help the customer choose the closest starting configuration for the work they perform.

Each workflow card should explain:

- the job it supports;
- the main tool categories involved;
- whether it is a complete or focused setup.

The page should not present workflow cards as prebuilt WooCommerce bundles unless the underlying commerce implementation genuinely supports that concept.

### Official mockup

![Workflow Selection](assets/mockups/02-workflow-selection.png)

---

# 16. Guided Builder Workspace UX

This is the primary working surface.

The desired desktop information hierarchy is:

```text
left: configuration progress / tool categories
center: current product-selection workspace
right: current toolset summary
```

The exact column widths and implementation should be decided responsively by the frontend agent.

### Current primary builder-workspace reference

![Latest Builder Workspace](assets/mockups/10-builder-workspace-latest.png)

### Supporting guided-workspace reference

![Guided Builder](assets/mockups/03-guided-builder.png)

The latest workspace reference should generally carry more visual weight when older builder concepts differ, but active DTB design-system rules always outrank generated mockups.

---

# 17. Builder progress / step navigation

The builder should communicate configuration status without forcing an artificial linear wizard.

A user should be able to move among relevant categories.

Useful semantic states include:

- Selected
- In Progress
- Required
- Optional
- Included
- Needs Attention
- Compatibility Issue
- Not Applicable

A multi-select category should communicate current cardinality, such as:

> 2 of 3 selected

Progress should help the customer understand completion; it should not become a brittle “Step 4 of 9” contract if the actual workflow is conditional.

---

# 18. Product-selection workspace

The active product area should prioritize the information needed to make a professional purchasing decision.

Likely elements include:

- active category;
- selection requirement/cardinality;
- search;
- brand filtering;
- sort;
- product image;
- brand;
- product name;
- identifier/variation cue where useful;
- price;
- availability;
- variation control;
- Add to Set / In Your Set state;
- compatibility context.

Avoid generic product cards overloaded with unrelated storefront actions.

The builder's product card should be optimized for comparison and configuration.

---

# 19. Variable product selection reference

### Official mockup

![Variable Product Selection](assets/mockups/04-variable-product-selection.png)

This reference establishes the expected clarity of:

- selected product identity;
- variation choice;
- price;
- stock state;
- quantity;
- key features/compatibility;
- primary action.

The implementation agent should adapt this to existing product-detail/card primitives rather than unnecessarily duplicating the whole product UI system.

---

# 20. Compatibility resolution UX

Compatibility problems should be recoverable and specific.

The customer should be able to understand:

- which two or more selections conflict;
- which selection needs attention;
- compatible replacement choices;
- whether an adapter/dependency can resolve the issue.

### Official mockup

![Compatibility Resolution](assets/mockups/05-compatibility-resolution.png)

The exact alert/card treatment should follow the active DTB design system.

---

# 21. Toolset summary UX

The builder should maintain a clear summary of the current configuration.

It should show, as appropriate:

- product thumbnails;
- brand;
- product name;
- variation;
- quantity;
- current price projection;
- edit/remove controls;
- required items still missing;
- authoritative savings only when server-supported;
- authoritative estimated/current total.

On desktop this may remain visible while browsing products.

On mobile it should become a dedicated sheet/drawer rather than occupying permanent horizontal space.

---

# 22. Review Set UX

The review experience is the last configuration checkpoint before committing the toolset to the cart.

It should let the customer:

- verify every selection;
- identify missing required capabilities;
- resolve incompatibilities;
- jump back to edit a category;
- inspect the complete live product collage;
- review the latest authoritative price/availability projection;
- proceed only when server validation allows it.

### Official mockup

![Review Set](assets/mockups/06-review-set.png)

---

# 23. Expert Mode UX

Experienced finishers should have a faster, denser way to configure the entire set.

Expert Mode should:

- expose more of the configuration at once;
- allow rapid switching between selections;
- preserve the exact same underlying configuration as Guided Mode;
- never introduce a second business workflow.

Switching Guided ↔ Expert must preserve selections.

### Official mockup

![Expert Mode](assets/mockups/07-expert-mode.png)

---

# 24. Mobile Builder UX

Mobile should adapt the same underlying workflow.

It should not become a separate product with separate business logic.

Desired characteristics:

- compact DTB storefront shell;
- clear workflow title;
- visible progress;
- one active product category at a time;
- usable filters/variation controls;
- large touch targets;
- persistent access to current set summary;
- no horizontal overflow;
- no desktop columns simply stacked into an excessively long page.

### Official mockup

![Mobile Builder](assets/mockups/08-mobile-builder-step.png)

---

# 25. Mobile summary UX

The selected set should be available through a mobile sheet/drawer.

It should support:

- selected product review;
- edit/remove;
- current total;
- validation messages;
- final cart action.

The overlay must follow existing DTB accessibility conventions for focus containment, dismissal, safe-area behavior, and focus restoration.

### Official mockup

![Mobile Summary](assets/mockups/09-mobile-summary.png)

---

# 26. Existing DTB storefront shell is authoritative

The builder must feel native to the existing Drywall Toolbox frontend.

It should reuse the production shell, navigation, search, account/cart behavior, responsive patterns, and design system.

### Storefront shell reference

![DTB Storefront Shell](assets/references/storefront-shell-reference.png)

The implementation agent should inspect the current production shell and use existing primitives rather than reproducing the header inside builder-specific code.

---

# 27. Design language

The builder should follow the active Drywall Toolbox design system.

Core qualities:

- white commerce surfaces;
- deep navy application shell;
- DTB blue for active/selected/primary commerce actions;
- Geist Variable typography;
- compact professional information density;
- strong hierarchy;
- restrained radius and elevation;
- real product imagery;
- practical technical copy;
- accessible focus and state communication.

Avoid:

- generic SaaS dashboards;
- oversized rounded cards;
- unnecessary gradients;
- decorative icons everywhere;
- fake trust indicators;
- hover-only interactions;
- excessive animation;
- giant whitespace that reduces comparison efficiency.

The implementation should reuse existing frontend tokens/components where that produces consistent behavior.

---

# 28. Live toolset collage objective

The builder should visually show the exact set the customer is creating.

The required style is intentionally simple:

- white or near-white background;
- real product photography/cutouts;
- no artificial jobsite scene;
- no generative recreation of products;
- no need for cinematic shadows;
- products arranged as a clean ecommerce collage;
- long tools usually arranged horizontally;
- boxes/larger tools arranged along lower regions;
- pumps and tall tools grouped vertically;
- small accessories used to fill the composition cleanly.

### Visual references

![Collage Reference 1](assets/references/toolset-collage-reference-01.webp)

![Collage Reference 2](assets/references/toolset-collage-reference-02.webp)

![Collage Reference 3](assets/references/toolset-collage-reference-03.webp)

![Collage Reference 4](assets/references/toolset-collage-reference-04.webp)

![Collage Reference 5](assets/references/toolset-collage-reference-05.webp)

These references define the **style of composition**, not which products belong in a set.

---

# 29. Collage system principles

The collage feature should be driven by the actual selected catalog products.

The implementation agent should design an approach that:

- uses the real catalog product/variation image assets;
- preserves product geometry;
- updates immediately enough to feel live while the customer edits the set;
- arranges tools deterministically rather than randomly;
- adapts to small and large configurations;
- remains stable across repeated renders of the same configuration;
- supports responsive presentation;
- does not require pre-generating every possible bundle image.

The preferred conceptual split is:

**Live preview**
- generated/composed in the browser from existing product assets;
- updates as selections change.

**Durable image**
- generated only when there is a reason to persist/share the configuration;
- cached/reused where practical;
- non-critical to checkout/order completion.

The implementation agent should select the rendering technology after confirming what is already available and appropriate in the production environment.

---

# 30. Product-media preparation

Automatic collage quality depends more on source-image consistency than on sophisticated rendering.

Builder-eligible products should ideally have a clean asset with:

- transparent or clean white background;
- tight product bounds;
- adequate resolution;
- no unrelated badge/text overlay;
- correct orientation;
- accurate manufacturer/product appearance.

The implementation agent should evaluate existing product media and determine:

- how many products are already suitable;
- whether normalized builder-specific derivatives are needed;
- whether background removal can be deterministic for clean white product images;
- which products need manual media correction;
- where builder-media metadata belongs without creating a second catalog authority.

The goal is **one normalized product asset per eligible product/variation**, not one image per possible toolset.

---

# 31. Collage layout semantics

The layout can use visual classes derived primarily from tool family.

Examples of visual behavior:

- long horizontal tools;
- tall vertical tools;
- wide low tools;
- medium blocks;
- small tools;
- small accessories.

This is a conceptual model, not a required data schema.

Most products should inherit sensible visual behavior from their family.

Only unusually shaped products should need a media-layout override.

The agent should prefer a deterministic family-driven system over manual positioning of every SKU.

---

# 32. Pricing and savings

Any toolset discount or promotional savings shown in the UI must be backed by authoritative commerce behavior.

The current mockups contain example savings states. They are visual references only.

The agent must verify whether DTB currently has a toolset promotion rule.

If it does not:

- do not hard-code a discount into React;
- do not display unsupported savings;
- either implement a properly owned commerce rule as part of an approved product requirement or omit the savings treatment.

Builder preview and WooCommerce cart must not disagree about totals.

---

# 33. Final add-to-cart behavior

The customer should experience one clear action such as:

> Add Complete Set to Cart

The internal implementation should safely result in the actual selected WooCommerce products/variations appearing in the authoritative cart.

The implementation agent must determine the safest integration with the current Store API/cart infrastructure.

The resulting behavior must:

- revalidate stale selections;
- preserve real product/variation identity;
- preserve cart/session security;
- tolerate retries/double submission;
- avoid accidental duplicate sets;
- avoid partially committing an invalid configuration where practical;
- carry enough bounded metadata to associate related line items as one configuration.

The builder must not invent a new commerce persistence model merely for convenience.

---

# 34. Toolset identity through commerce

Selected products should remain normal WooCommerce order lines.

Toolset identity is supplemental grouping/context.

The existing repository already contains toolset-related cart/order-line metadata handling. The agent should determine whether the existing contract is sufficient or needs to evolve.

Whatever mechanism is used should preserve:

- the configuration/workflow identity;
- one stable instance identity for the customer's set;
- enough slot/context data to reconstruct useful grouping;
- backward readability of historical orders.

Do not rewrite historical commerce identities merely to make the new builder model cleaner.

---

# 35. Security expectations

The implementation must preserve existing DTB security boundaries.

Key expectations:

- public reads are intentionally public, not accidentally unprotected;
- authenticated/saved configurations enforce identity and ownership;
- cart mutation uses authoritative current WooCommerce session mechanisms;
- caller-provided product IDs are always re-resolved and validated server-side;
- variation ownership is validated;
- prices and image URLs from the client are never treated as authoritative;
- payload sizes and quantities are bounded;
- media generation cannot fetch arbitrary URLs or arbitrary filesystem paths;
- logs do not expose secrets or sensitive commerce data.

The agent should use existing DTB security primitives rather than create parallel mechanisms.

---

# 36. Reliability and concurrency expectations

The product must remain correct when the catalog changes while someone is building.

Examples:

## Product becomes unavailable

Preserve the visible selection long enough to explain the issue, then require a valid replacement before finalization.

## Price changes

Refresh the authoritative price/total before final cart commitment.

## Variation disappears

Return a specific validation issue and guide the user to another variation.

## Duplicate submission

A retry or double-click must not unintentionally duplicate the entire set.

## Collage rendering failure

Commerce must continue. The visual can fall back to normal selected-product thumbnails or a placeholder state.

The implementation agent should decide the appropriate concurrency/idempotency design based on the active cart architecture.

---

# 37. Performance expectations

The builder should feel immediate even with a large catalog.

The implementation should avoid:

- fetching the entire catalog unnecessarily;
- request-per-card patterns;
- unbounded backend scans;
- repeated variation queries;
- re-rendering unrelated builder sections;
- blocking the UI on non-critical collage file generation.

The agent should use the repository's existing caching, product-projection, and request patterns where appropriate.

Only the active/needed catalog options should be loaded unless measurement demonstrates a better approach.

---

# 38. Accessibility requirements

WCAG 2.1 AA is the minimum.

The builder must support:

- keyboard use;
- visible focus;
- semantic headings;
- accessible grouped options;
- clear selected state beyond color;
- large enough touch targets;
- screen-reader understandable progress/status;
- accessible compatibility errors;
- accessible drawers/sheets;
- reduced-motion preferences;
- responsive zoom/reflow;
- no drag-only configuration interaction.

The collage must not become the only representation of the current toolset. The selected-product summary remains the accessible textual authority.

---

# 39. Responsive behavior

The same business workflow must work from narrow phones through wide desktop screens.

Expected adaptation:

**Wide desktop**
- progress/navigation rail;
- central product workspace;
- persistent set summary.

**Compact desktop/tablet**
- reduce or collapse one supporting column before product cards become unusably narrow.

**Mobile**
- one primary workspace;
- summary accessed through sheet/drawer;
- persistent current-set access;
- no duplicated mobile business logic.

The implementation should validate the active DTB breakpoint system and use intrinsic responsive behavior rather than introducing a separate builder breakpoint framework.

---

# 40. Loading, empty, error, and validation states

Every major builder surface must have intentional states.

Examples:

- workflows loading;
- no eligible products for a slot;
- product-options request failure;
- stale selection;
- compatibility conflict;
- missing required selection;
- invalid variation;
- cart commit failure;
- collage loading/failure.

Errors should preserve the customer's work wherever possible.

No failure should dump the customer back to an empty builder unless the configuration is truly unrecoverable.

---

# 41. Observability

The builder should be diagnosable without logging sensitive information.

Useful correlation concepts include:

- workflow/configuration identity;
- toolset instance identity;
- slot/category;
- product ID;
- variation ID;
- normalized error code;
- cart mutation outcome.

Frontend analytics may measure:

- builder viewed;
- workflow chosen;
- category viewed;
- product added/removed;
- mode switched;
- validation failure;
- add-to-cart success/failure.

Analytics remain observational, not business authority.

---

# 42. Testing outcomes

The implementation agent should determine the right test placement and frameworks based on the repository.

The completed system should demonstrate, at minimum:

## Catalog synchronization
- correctly classified new products become discoverable;
- new valid variations become selectable;
- unpublished/non-purchasable products are excluded.

## Workflow behavior
- required/optional/multi-select behavior is correct;
- Guided and Expert modes share configuration state.

## Compatibility
- invalid combinations are rejected server-side;
- valid combinations remain selectable;
- compatibility recovery UX works.

## Commerce
- selected items enter the real WooCommerce cart;
- variation identity is preserved;
- toolset grouping metadata survives into order lines as intended;
- duplicate submission is controlled;
- checkout remains the existing native flow.

## Media
- collage always represents actual selected products;
- same configuration produces stable visual arrangement;
- media failure does not block commerce.

## Accessibility
- keyboard flow;
- focus management;
- screen-reader status;
- mobile sheet behavior;
- no horizontal overflow.

---

# 43. Migration principles

The current backend contains manufacturer-specific toolset definitions and builder-slot metadata.

The agent should not delete or rewrite these immediately.

A professional migration should first determine:

- whether existing carts/orders reference old template IDs;
- whether operator tools depend on them;
- whether builder slots are populated across the catalog;
- whether tool-family metadata is complete enough to become primary;
- whether current compatibility relationships are sufficient;
- whether any externally consumed API expects the current structures.

A transitional dual-read or compatibility layer may be appropriate, but it should exist only as long as it serves a concrete migration need.

The long-term target remains:

> catalog classification + workflow semantics + compatibility relationships

rather than manually curated brand-specific set definitions.

---

# 44. Agent decision framework

When the implementation agent encounters multiple plausible designs, prefer the design that best satisfies these criteria:

1. preserves existing system ownership;
2. introduces the least duplicate truth;
3. integrates with existing catalog and cart infrastructure;
4. keeps product identity canonical;
5. remains idempotent and retry-safe;
6. is observable and testable;
7. avoids new dependencies unless they materially improve the solution;
8. keeps mobile and desktop business logic unified;
9. minimizes migration risk;
10. is understandable to future maintainers.

The agent should explain major architectural choices in durable documentation when they materially affect ownership, APIs, persistence, queues, or integration contracts.

---

# 45. Questions the implementing agent must answer through repository audit

Before implementation, the agent should be able to answer:

- Where is canonical tool-family metadata populated today?
- How complete is tool-family coverage for builder-eligible products?
- How are variable products and variation media represented?
- What is the authoritative compatibility relationship model?
- Which builder-specific meta fields are actively populated and consumed?
- Do historical carts/orders depend on current toolset IDs?
- How is Store API nonce/session behavior centralized in the frontend?
- What existing cart-mutation primitives can safely support adding multiple selected lines?
- Is there an existing pricing/promotion mechanism suitable for toolset discounts?
- Which media pipeline owns normalized product imagery?
- Is Imagick or another server-side compositor available in production if persistent collage files are needed?
- What existing feature-flag or staged-rollout mechanism should be used?
- Which documentation currently describes catalog/toolset behavior and must be updated?

This blueprint should guide those investigations; it should not substitute for them.

---

# 46. Definition of product success

The Toolset Builder is successful when:

- DTB operators maintain product/catalog truth once;
- correctly classified products automatically participate in relevant builder workflows;
- adding a brand does not require cloning every workflow;
- customers can build mixed-brand sets where technically valid;
- variable products feel coherent and easy to choose;
- compatibility errors are explicit and recoverable;
- the set summary always reflects the real selected products;
- totals shown to customers remain aligned with WooCommerce;
- finalized selections enter the existing cart safely;
- checkout/order architecture remains unchanged;
- toolset grouping survives far enough to support useful cart/order presentation;
- a professional product collage appears without manually designing every bundle;
- desktop/mobile experiences feel like the same DTB product;
- accessibility and responsiveness meet DTB standards;
- the codebase contains less duplicate builder truth than before, not more.

---

# 47. Explicit non-goals / anti-patterns

The agent should avoid designs that lead to:

- one WooCommerce bundle product per customer configuration;
- one manually maintained workflow per brand;
- hard-coded product IDs in frontend workflows;
- duplicated product prices or stock values;
- mutable product-name matching as primary identity;
- frontend-only compatibility enforcement;
- frontend-only toolset discounts;
- a second cart;
- a second checkout;
- a second order path;
- desktop/mobile implementations with separate business logic;
- AI-generated reinterpretations of product appearance;
- image rendering in the payment/order critical path;
- manual pre-generation of every possible toolset collage;
- large unbounded catalog scans;
- fragile migration that breaks historical orders.

---

# 48. End-state architecture overview

The intended conceptual architecture is:

```text
Canonical product/catalog data
        │
        ▼
WooCommerce runtime products + variations
        │
        ├────────────── commerce state
        │
        ▼
DTB catalog/domain intelligence
  - tool families
  - workflow requirements
  - eligibility
  - compatibility
  - product relationships
        │
        ▼
Universal Toolset Builder experience
  - guided configuration
  - expert configuration
  - live catalog options
  - compatibility feedback
  - live toolset collage
  - review
        │
        ▼
Existing authoritative WooCommerce cart/session
        │
        ▼
Existing native checkout/payment/order lifecycle
        │
        ▼
Existing DTB order events / queues
        │
        ├──────── Veeqo
        └──────── QuickBooks / other projections
```

The architecture should make the catalog smarter, not create a separate toolset catalog.

---

# Appendix A — Official UI mockup library

| Reference | File | Purpose |
|---|---|---|
| Builder Landing | `assets/mockups/01-builder-landing.png` | Entry experience |
| Workflow Selection | `assets/mockups/02-workflow-selection.png` | Workflow discovery |
| Guided Builder | `assets/mockups/03-guided-builder.png` | Supporting desktop builder concept |
| Variable Product | `assets/mockups/04-variable-product-selection.png` | Variation/product detail interaction |
| Compatibility | `assets/mockups/05-compatibility-resolution.png` | Conflict and recovery |
| Review Set | `assets/mockups/06-review-set.png` | Pre-cart review |
| Expert Mode | `assets/mockups/07-expert-mode.png` | Dense expert configuration |
| Mobile Builder | `assets/mockups/08-mobile-builder-step.png` | Mobile active slot |
| Mobile Summary | `assets/mockups/09-mobile-summary.png` | Mobile set drawer |
| Current Builder Workspace | `assets/mockups/10-builder-workspace-latest.png` | Primary current workspace direction |

---

# Appendix B — Visual-reference hierarchy

When visual references disagree, use this order:

1. active frontend implementation and active design tokens;
2. `docs/reference/ui/design-system/DESIGN.md`;
3. storefront shell reference;
4. current/latest builder workspace mockup;
5. individual page mockups;
6. collage-style references.

Mockups are not sources of business truth.

They must not be used to invent:

- price;
- stock;
- savings;
- free shipping;
- ratings/reviews;
- payment methods;
- compatibility;
- product identity.

---

# Appendix C — Toolset collage references

The reference images are included in:

```text
assets/references/
```

They demonstrate the desired clean ecommerce composition style.

The implementation should aim for:
- clarity;
- exact selected products;
- neutral background;
- consistent merchandising scale;
- deterministic placement;
- efficient automated generation.

It does not need:
- jobsite photography;
- photorealistic environmental rendering;
- generative AI;
- manually prebuilt combinations.

---

# Appendix D — Current repository areas worth inspecting

These paths are listed as **audit starting points**, not implementation instructions:

```text
frontend/src/App.jsx
frontend/src/routing/
frontend/src/context/
frontend/src/api/
frontend/src/components/shell/

drywalltoolbox/wp/wp-content/mu-plugins/dtb-catalog-platform/
drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/

docs/reference/ui/design-system/DESIGN.md
AGENTS.md
```

The agent should follow imports, registration, hooks, REST wiring, session handling, persistence, and integration boundaries from active code.

Do not assume a file remains authoritative merely because it is named here.

---

# Final guidance to the implementation agent

Treat this blueprint as a **product and architecture brief**.

Your responsibility is to:

- inspect the current system;
- identify what can be reused;
- identify what should be corrected;
- select the simplest complete architecture;
- preserve all system authorities;
- preserve historical compatibility where necessary;
- implement the UX faithfully without blindly reproducing mockup artifacts;
- verify behavior with real catalog/cart data;
- document material architectural decisions.

Do not optimize for matching this document line-for-line.

Optimize for delivering the intended Drywall Toolbox Toolset Builder correctly, safely, maintainably, and coherently within the active repository.
