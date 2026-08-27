# DTB Category Hero Media Pipeline

## Purpose

This document defines the repository and frontend integration contract for Drywall Toolbox category hero artwork. It complements `CATEGORY_HERO_IMAGE_SYSTEM.md`, which owns visual composition and image-production standards.

The goal is one canonical media source, automatic frontend discovery, deterministic builds, and minimal maintenance when category hero artwork is added or replaced.

## Ownership

Canonical category hero media is owned by:

`products/launch/media/categories/heroes/`

The frontend must not maintain a second committed copy of those binaries.

The generated frontend mirror is:

`frontend/src/assets/media/catalog/category-heroes/`

That mirror is build/runtime preparation output only. It is populated by `frontend/scripts/sync-category-heroes.cjs` and is ignored by Git.

## Naming contract

New hero files must use the exact WooCommerce category slug:

`<category-slug>.webp`

Examples:

- `automatic-tapers.webp`
- `flat-boxes.webp`
- `corner-finishers.webp`
- `compound-applicators.webp`
- `loading-pumps.webp`

The filename is the mapping key. No new JavaScript import or lookup-table entry should be required when the naming contract is followed.

The current `compound-applicator.webp` source predates this convention. `frontend/src/utils/categoryHeroImages.js` contains a narrow compatibility alias from category slug `compound-applicators` to that legacy filename. New files must not extend this alias pattern; use the exact slug instead.

## Build and development synchronization

`frontend/scripts/sync-category-heroes.cjs` performs a deterministic mirror from the canonical products directory into the frontend asset directory.

The sync:

- accepts WebP category hero assets only;
- validates lowercase kebab-case filenames;
- removes stale mirrored WebPs that no longer exist canonically;
- compares file content before copying to avoid unnecessary writes;
- fails when the canonical source directory is missing or contains no WebP hero assets;
- never mutates the canonical products media directory.

Frontend commands run the sync before webpack starts:

- `npm run dev`
- `npm run build`
- `npm run build:staging`
- `npm run preview`

The sync can also be run explicitly with:

`npm run hero:sync`

## Frontend discovery

`frontend/src/utils/categoryHeroImages.js` uses webpack `require.context` to discover every mirrored `.webp` file automatically.

Resolution order is:

1. repository-packaged hero matching the category slug;
2. narrow legacy filename alias where explicitly documented;
3. backend `category.heroImage` and `category.heroImageSrcset` fallback;
4. no hero media when neither source exists.

This keeps curated, version-controlled DTB category artwork deterministic while retaining WordPress category hero media as a fallback for categories that have not yet received a packaged asset.

## Updating an existing hero

To change a hero image:

1. replace the existing canonical WebP in `products/launch/media/categories/heroes/` without changing its category-slug filename;
2. run the normal frontend dev/build command, or run `npm run hero:sync` explicitly;
3. verify the category route in the actual hero component;
4. commit only the canonical product-media binary and any intentional documentation changes.

No resolver edit, component edit, or duplicate frontend binary commit should be necessary.

## Adding a new hero

To add a category hero:

1. confirm the exact WooCommerce category slug;
2. create artwork according to `CATEGORY_HERO_IMAGE_SYSTEM.md`;
3. export the approved transparent WebP as `<category-slug>.webp`;
4. add it to `products/launch/media/categories/heroes/`;
5. run the frontend normally;
6. verify fitment, alpha quality, perceived scale, and responsive behavior.

If a new hero requires a JavaScript mapping entry, the filename or taxonomy slug is probably incorrect and should be fixed instead of expanding a manual map.

## Data and authority boundaries

Category hero artwork is presentation media. It does not own category identity, product membership, counts, pricing, inventory, commerce state, or WooCommerce persistence.

WooCommerce/category APIs continue to own category metadata. The frontend only selects the appropriate presentation asset for the supplied category slug.

## Operational rules

- Do not commit binaries under `frontend/src/assets/media/catalog/category-heroes/`.
- Do not create separate desktop hero maps in React components.
- Do not hard-code one import per category.
- Do not encode category titles or UI chrome into hero images.
- Do not use mutable product names as lookup keys; use the stable category slug.
- Do not introduce remote image services or another media database for this requirement.
- Prefer replacing a canonical file in place over changing URLs or component code.

## Governing rule

**One canonical hero file per category slug in `products/`; deterministic frontend synchronization; automatic webpack discovery; no duplicated media authority.**
