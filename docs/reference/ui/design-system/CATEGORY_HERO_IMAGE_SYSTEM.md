# DTB Category Hero Image Design System

## Purpose

This document is the canonical visual-production contract for Drywall Toolbox category hero artwork. It defines how category hero images are composed, generated, edited, exported, reviewed, and integrated so every category page renders as one coherent storefront system rather than a collection of unrelated images.

The frontend owns the hero card surface, gradient, border, radius, clipping, responsive geometry, and image viewport. Hero assets own only the product/tool artwork and its natural local shadowing.

## Core contract

- Desktop master canvas: **3000 x 1000 px**.
- Master aspect ratio: **3:1**.
- Background: **transparent alpha**.
- Preferred production delivery: **WebP with alpha**.
- Product geometry: never stretched, compressed, widened, shortened, or otherwise distorted.
- Frontend fit: **object-fit: contain**.
- Frontend position: centered by default; small optical adjustments are allowed only when required.
- Card background, gradient, border, radius, and elevation must never be baked into the image.
- Decorative copy, badges, labels, category names, UI elements, borders, and non-product graphics must never be baked into the image.

## Visual objective

Category heroes should read as a single professionally art-directed commercial product family. Images should be photorealistic, mechanically credible, visually balanced, restrained, and optimized for a contractor-focused commerce interface. Product identity and geometry take priority over dramatic styling.

The target is not generic lifestyle photography. The target is clean commercial product artwork that integrates naturally with the DTB white/silver hero surface.

## Canvas and safe area

Use a 3000 x 1000 transparent canvas for desktop masters.

Keep critical product geometry inside the following preferred region:

- horizontal critical region: approximately **300 px to 2700 px**;
- vertical critical region: approximately **120 px to 880 px**.

Treat the outer **8-10% horizontally** and approximately **10% vertically** as crop/safety space. Product heads, handle ends, wheels, cases, hoses, cables, logos, and other identity-bearing geometry must not touch the canvas boundary.

Transparent safety padding should normally remain approximately:

- horizontal: **5-8%** around the composed product group;
- vertical: **8-12%** around the composed product group.

Do not retain large amounts of unused transparent canvas. `object-fit: contain` preserves authored whitespace, so excessive source padding makes products render too small.

## Perceived scale system

Normalize perceived visual weight rather than forcing every physical tool into the same bounding-box percentage.

### Long / linear products

Examples: automatic tapers, handles, compound tubes, extensions.

- target group width: **78-86%** of canvas width;
- target height utilization: **65-80%** where perspective permits;
- orientation: predominantly horizontal or shallow diagonal;
- avoid extreme end-to-end placement against canvas edges.

### Medium horizontal products

Examples: flat boxes, pumps, tool cases, loading systems.

- target group width: **62-76%** of canvas width;
- target height utilization: **68-82%**;
- use modest three-quarter perspective to communicate volume without excessive foreshortening.

### Compact / square products

Examples: corner finishers, rollers, applicators, angle heads.

- target group width: **45-62%** of canvas width;
- target height utilization: **68-82%**;
- multi-product compositions are preferred when a single compact item would otherwise appear visually weak.

These ranges are starting points. Optical balance is authoritative. Dark product groups may require slightly greater scale than bright silver groups to achieve equal perceived prominence.

## Product count and composition

Use the minimum number of representative products needed to communicate the category.

- preferred: **2-3 products**;
- acceptable: 1 for a highly distinctive category;
- acceptable: 4 only when necessary to represent a materially diverse category;
- avoid inventory-collage compositions.

For multi-product artwork, use controlled staggered depth rather than a pile. Maintain silhouette readability and preserve recognizable endpoints.

A strong default is a shallow descending or ascending three-product arrangement with modest overlap and clear separation between primary mechanical forms.

## Perspective

Use a consistent commercial studio camera language across the category library.

Preferred perspective:

- approximately **10-25 degrees elevated three-quarter view**;
- predominantly horizontal presentation;
- modest depth;
- restrained foreshortening;
- product geometry remains immediately understandable.

Avoid mixing unrelated visual languages such as dramatic 45-degree foreshortening, flat top-down views, vertical standing products, extreme wide-angle distortion, and orthographic side profiles unless the category genuinely requires a different treatment.

## Product fidelity

When reference images are supplied, they are authoritative for product identity.

Preserve, where visible and relevant:

- mechanical geometry;
- proportions;
- handles and adapters;
- wheels and rollers;
- housings;
- chains, cables, springs, tubes, and fasteners;
- material finishes;
- brand colors;
- legitimate product markings and logos;
- orientation and connection logic.

Do not hallucinate functional hardware. Do not merge features from different products. Do not invent labels or pseudo-branding. Do not create mechanically impossible connections for visual convenience.

If reference coverage is insufficient to establish a detail, prefer a composition that does not expose that detail rather than fabricating it.

## Lighting and material rendering

Use neutral premium commercial studio lighting:

- soft upper/front key light;
- controlled fill;
- clean metallic highlights;
- realistic aluminum, stainless steel, polymer, rubber, anodized, painted, and carbon-fiber surfaces;
- readable dark materials without crushed blacks;
- controlled chrome without blown highlights;
- neutral white balance;
- no colored environmental cast;
- no cinematic fog, bloom, flare, or dramatic atmosphere.

Mechanical detail should remain crisp at storefront display sizes. Avoid over-sharpening halos and synthetic microtexture.

## Shadows

Transparent hero artwork may retain restrained local shadows that make the product feel grounded.

Allowed:

- subtle contact shadow;
- soft ambient occlusion immediately around the product;
- physically plausible product-local reflection/shadow detail.

Not allowed:

- a visible studio floor;
- horizon lines;
- large rectangular gray shadow fields;
- background gradients;
- baked card shadows;
- shadows extending so far that they become the composition.

Shadow alpha must transition cleanly into transparency.

## Background and alpha requirements

The exported hero asset must contain a genuine alpha channel.

There must be no baked:

- white matte;
- silver matte;
- gray studio sweep;
- gradient;
- checkerboard;
- page background;
- border;
- rounded rectangle.

Inspect metallic and light-colored edges for white halos after background removal. Preserve thin cables, rods, springs, and reflective edges. Alpha isolation must not erase pale product surfaces.

## Frontend integration contract

The frontend hero component owns presentation.

Expected behavior:

```css
.dtb-category-hero-card__media {
  overflow: hidden;
  background: transparent;
}

.dtb-category-hero-card__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}
```

The exact implementation remains owned by active frontend code. This snippet documents intent, not an alternate implementation authority.

Do not use `cover` for isolated hero artwork unless the asset has explicitly been authored as photographic background media. Do not use `width: 100%; height: 100%` without an appropriate object-fit contract. Never stretch an image to force it into the viewport.

## Optical adjustment

The default artwork scale is 1.0. If frontend support exists for optical adjustment, keep normal corrections approximately within **0.90-1.08**.

If a category requires substantially more correction, fix the source composition rather than accumulating category-specific CSS exceptions.

Similarly, small `object-position` adjustments are acceptable for optical centering, but the asset should normally be authored so `center center` is correct.

## Mobile art direction

Desktop artwork is 3:1 and should not be assumed to be optimal for every narrow viewport.

When mobile-specific artwork is justified, prefer a separately composed transparent master around **3:2 to 8:5**. Recompose the same representative products for the narrower canvas rather than merely cropping the desktop artwork.

Mobile art direction must preserve the same product identity, lighting, perspective, material rendering, and overall visual family.

## Export quality

Preferred master/export characteristics:

- 3000 x 1000 desktop working canvas;
- transparent WebP for production where supported by the pipeline;
- preserve alpha edge quality;
- retain enough detail for approximately 2x high-density rendering;
- do not upscale low-resolution source imagery merely to satisfy the nominal canvas size;
- avoid destructive compression around logos, chains, rollers, chrome edges, and fine hardware.

Export quality should be determined by visual inspection rather than a fixed compression number alone.

## Generation workflow

1. Identify the exact category and representative products.
2. Gather authoritative product references.
3. Determine the appropriate geometry family: long/linear, medium horizontal, or compact/square.
4. Choose 1-3 representative products and define primary/secondary visual hierarchy.
5. Generate or composite on a transparent 3000 x 1000 canvas.
6. Preserve exact product identity and mechanically credible geometry.
7. Normalize perceived scale against previously approved DTB hero artwork.
8. Verify safe-area compliance and transparent padding.
9. Inspect alpha edges, shadows, logos, reflective surfaces, thin hardware, and endpoints at 100% and at expected storefront size.
10. Preview inside the real category hero component.
11. Adjust the asset before introducing frontend exceptions.
12. Export the approved WebP and retain the source/master according to the media workflow.

## QA acceptance checklist

An image is approved only when all applicable checks pass:

- [ ] Correct category and representative products.
- [ ] 3000 x 1000 desktop master or explicitly approved alternate.
- [ ] Genuine transparent background.
- [ ] No baked card/UI styling.
- [ ] Complete product geometry visible.
- [ ] No stretched or distorted products.
- [ ] No hallucinated functional hardware.
- [ ] Product markings are accurate or omitted rather than invented.
- [ ] Product group has appropriate perceived scale.
- [ ] Critical geometry remains inside the safe area.
- [ ] Transparent padding is neither excessive nor cramped.
- [ ] Perspective matches the DTB category-art family.
- [ ] Lighting and material rendering are neutral and commercial.
- [ ] Chrome/light edges have no matte halo.
- [ ] Thin cables/rods/springs are preserved.
- [ ] Shadows are subtle, local, and alpha-safe.
- [ ] Composition remains legible at actual frontend display size.
- [ ] `object-fit: contain` produces a balanced result without CSS compensation.
- [ ] No unnecessary category-specific frontend overrides are required.

## Rejection criteria

Reject and regenerate/re-edit artwork when any of the following occurs:

- product clipping;
- incorrect or invented hardware;
- distorted proportions;
- obvious AI artifacts;
- incorrect brand/product markings;
- excessive transparent whitespace;
- tiny product utilization;
- cramped edge placement;
- inconsistent perspective compared with the approved hero family;
- harsh cutout edges or white halos;
- lost thin mechanical features;
- baked white/gray background;
- excessive shadow/floor remnants;
- dramatic styling that competes with category content;
- composition requiring large CSS scale or position hacks.

## Governing rule

**Author the product artwork for the component; do not make the component compensate for poorly authored artwork.**

The category hero library should behave as one coherent visual system: consistent canvas contract, consistent commercial lighting, consistent perspective, consistent perceived visual weight, accurate product identity, transparent presentation-independent artwork, and frontend-owned card styling.