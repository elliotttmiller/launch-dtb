# Google Stitch upload package

This directory translates the active Drywall Toolbox storefront implementation into a portable, Stitch-ready design specification.

## Upload sequence

1. In Stitch, choose **Start with your design**.
2. Upload or paste `DESIGN.md` first. It is the primary design-DNA document.
3. Upload `TOKENS.css` as code context.
4. Upload both files in `assets/` as the official light- and dark-surface logos.
5. Optionally upload the selected reference images listed in `ASSET_MANIFEST.md` when designing the corresponding screen family.
6. Paste `STITCH_INSTRUCTIONS.md` into **Additional instructions**.

Google’s current Stitch workflow treats `DESIGN.md` as the portable description of color, typography, and layout rules. This package gives Stitch both that concise authority and traceable implementation detail.

## File roles

- `DESIGN.md`: complete visual, responsive, component, accessibility, and commerce-boundary specification.
- `TOKENS.css`: canonical token snapshot in a format generation tools can interpret directly.
- `COMPONENT_INVENTORY.md`: screen and component coverage checklist.
- `SOURCE_MAP.md`: evidence and ownership map back to active frontend files.
- `STITCH_INSTRUCTIONS.md`: a paste-ready generation prompt and constraints.
- `ASSET_MANIFEST.md`: approved logos and optional visual references.
- `assets/`: upload-safe copies of the official black and white logo variants.

## Authority and maintenance

This package is documentation, not a second runtime design-token authority. Active implementation under `frontend/src/` remains authoritative. Refresh this package when the palette, typography, responsive primitives, motion contract, core shell, or checkout presentation boundary changes.

Do not upload the full repository or production configuration to Stitch. Do not include credentials, environment files, customer data, order data, or provider secrets.

