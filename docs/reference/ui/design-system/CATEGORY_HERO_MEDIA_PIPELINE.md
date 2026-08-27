# DTB Category Hero Media Pipeline

## Purpose

This document defines the repository and frontend integration contract for Drywall Toolbox category hero artwork. It complements `CATEGORY_HERO_IMAGE_SYSTEM.md`, which owns the visual composition and image-production standard.

The goal is a simple, durable runtime contract: category hero images are uploaded once to the live WordPress uploads directory and the frontend resolves them automatically by WooCommerce category slug. Frontend builds do not bundle or duplicate these large binaries.

## Ownership

### Authoring / reference workspace

Local source/reference artwork may be retained under:

`products/launch/media/categories/heroes/`

This path is a local repository workspace. It is not a live-server delivery path and the frontend must never assume that a file exists publicly merely because it exists there.

### Runtime delivery

Customer-facing category hero media is served from:

`/wp-content/uploads/2026/categories/heroes/`

On the SiteGround filesystem this corresponds to the WordPress uploads tree under `public_html/wp/wp-content/uploads/2026/categories/heroes/` for the current installation layout.

The browser-facing URL remains rooted at:

`https://drywalltoolbox.com/wp-content/uploads/2026/categories/heroes/`

The frontend uses root-relative URLs so the same code works on production and `/staging` routes hosted on the same domain.

## Naming contract

Every new hero file must use the exact WooCommerce category slug:

`<category-slug>.webp`

Examples:

- `automatic-tapers.webp`
- `flat-boxes.webp`
- `corner-finishers.webp`
- `compound-applicators.webp`
- `loading-pumps.webp`

The filename is the mapping key. When this convention is followed, adding or replacing a hero requires no React import, no resolver map entry, and no frontend rebuild merely to change the binary.

The current `compound-applicator.webp` filename is a legacy singular filename. `frontend/src/utils/categoryHeroImages.js` contains one narrow compatibility alias from the category slug `compound-applicators` to `compound-applicator`. New hero files must not expand this alias pattern; use the exact category slug.

## Frontend resolution

`frontend/src/utils/categoryHeroImages.js` derives the live hero URL directly from the supplied category slug.

Resolution behavior is:

1. derive `/wp-content/uploads/2026/categories/heroes/<category-slug>.webp`;
2. apply a documented legacy filename alias only when required;
3. if the derived live image fails to load and backend `category.heroImage` metadata exists, fall back to that confirmed WordPress media URL and its `srcset`;
4. if neither image exists, render the category hero without a media panel rather than displaying a broken image.

`frontend/src/components/catalog/CategoryHero.jsx` owns the runtime image-error fallback behavior. It does not perform network probing before render and does not mutate catalog state.

## Why the frontend does not bundle category heroes

Category hero assets are large presentation media and are expected to be changed independently of application code. Bundling them into Webpack would:

- duplicate binaries between source/media and frontend build trees;
- require a frontend rebuild for a simple image replacement;
- increase deployment payload size;
- create content-hashed URLs that are unnecessary for this managed media directory;
- make SiteGround media operations dependent on the application bundle.

Serving the hero directly from WordPress uploads keeps media replacement operationally simple while retaining one predictable URL contract.

## Adding a new hero

1. Confirm the exact WooCommerce category slug.
2. Create the artwork according to `CATEGORY_HERO_IMAGE_SYSTEM.md`.
3. Export the approved transparent WebP as `<category-slug>.webp`.
4. Upload the file to the live server directory:
   `wp-content/uploads/2026/categories/heroes/`.
5. Optionally retain the approved source/reference copy under `products/launch/media/categories/heroes/`.
6. Open the real category route and verify fitment, alpha quality, perceived scale, and responsive behavior.

No JavaScript mapping change should be required.

## Updating an existing hero

To replace an existing hero, upload the revised WebP over the existing live filename. Because the public path remains stable, no frontend component or resolver change is required.

If aggressive browser/CDN caching is enabled for this directory, purge that specific asset or apply the site's normal cache invalidation procedure after replacement. Do not change category slugs merely to force cache invalidation.

## WordPress category hero metadata

The existing backend `category.heroImage` / `category.heroImageSrcset` contract remains supported as a fallback. It is useful for categories managed through WP-Admin and provides WordPress-generated responsive image candidates.

The static category-hero directory and the WP-Admin hero-image field must not become competing business-data authorities. They are presentation-media delivery mechanisms only; WooCommerce category metadata remains authoritative for category identity and membership.

## Data and authority boundaries

Category hero artwork does not own:

- category identity;
- product membership;
- product counts;
- pricing;
- inventory;
- commerce state;
- WooCommerce persistence.

The frontend resolves presentation media from the category slug supplied by the catalog API.

## Operational rules

- Do not hard-code one image import per category.
- Do not commit duplicate hero binaries into `frontend/src/assets/`.
- Do not create a separate JavaScript map for every new correctly named category image.
- Do not encode category titles, UI chrome, gradients, borders, or card styling into hero images.
- Do not use mutable category labels as lookup keys; use the WooCommerce category slug.
- Prefer replacing a live file in place over changing frontend code.
- Keep the local `products/launch/media/categories/heroes/` directory as an authoring/reference source only unless a separate deployment workflow explicitly copies it to SiteGround.

## Governing rule

**One predictable live URL per category slug; WordPress uploads deliver the binary; the frontend derives the URL and degrades safely; local product-media files are authoring/reference assets, not runtime delivery.**
