# Drywall Toolbox Hero Video — Source-Faithful Edit

Source: `platinum-bg.mp4` (owner-supplied)

## Production intent

This pass preserves the original camera movement, timing, worker anatomy, drywall/tool mechanics, lighting, grading, perspective, and photographic texture. The only destructive image operation is localized reconstruction of the visible Platinum shirt print during the opening shot. The reconstruction mask is generated from the dark printed lettering against the light shirt and is constrained to the chest surface above the moving forearm; the worker, tool, wall, watch, arms, and surrounding image remain outside the edit mask.

No blur box, logo smear, global generative re-render, frame interpolation, or replacement of the worker/tool scene is used.

## Deliverables

- `dtb-hero-clean-master.mp4` — 1920x1080 source-faithful clean master, ~23.976 fps.
- `dtb-hero-desktop.mp4` — optimized H.264 desktop web asset.
- `dtb-hero-desktop.webm` — optimized VP9 desktop web asset.
- `dtb-hero-mobile.mp4` — 1080x1350 mobile art-directed H.264 crop.
- `dtb-hero-mobile.webm` — 1080x1350 mobile art-directed VP9 crop.
- `dtb-hero-poster.webp` — static poster/fallback.
- `dtb-hero-qa-contact.jpg` — representative QA frames.
- `opening_qa.jpg` — opening-shot chronological QA frames after brand removal.

## Branding decision

The shirt is intentionally reconstructed to a clean, unbranded garment in this pass. The exact DTB logo was not baked into the moving fabric because a static logo overlay would not correctly follow shirt folds, perspective, deformation, and occlusion. Drywall Toolbox branding should remain in the storefront UI or be added to the garment only with a dedicated tracked planar/mesh composite using the canonical DTB vector artwork.

## Storefront integration contract

Treat video as a decorative enhancement, not the sole LCP resource. Keep the existing responsive poster/picture available immediately, then layer the muted looping video above it when motion is allowed. Requirements:

- `muted`, `autoPlay`, `loop`, `playsInline`
- no audio track
- `aria-hidden="true"`
- respect `prefers-reduced-motion: reduce`
- preserve existing content/scrim z-index ordering
- desktop and mobile sources selected without duplicating hero content
- poster remains available for first paint, reduced motion, errors, and constrained connections

## Ownership

Frontend presentation owns this asset and its responsive playback behavior. It does not change WooCommerce, DTB MU plugins, APIs, queues, Veeqo, QuickBooks, checkout, payments, orders, inventory, or persistence.
