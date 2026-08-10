# Category hero composition reference library

This directory is a curated composition-input library for Drywall Toolbox category heroes. It does not contain finished hero artwork. Each category package contains a flat set of authentic product references selected from `products/launch/media/media`.

## Structure

```text
hero/
  library-manifest.csv
  <category-slug>/
    README.md
    manifest.csv
    <source product image>.webp
```

The manifest rows define the intended composition inventory, slot assignment, and ordering. Files retain their canonical source filenames so catalog provenance remains auditable. A copied file is a design reference, not a new catalog-media authority.

## Selection rules

- Use genuine catalog-backed product photography, not generated substitutes.
- Prefer complete-product cutouts with clean silhouettes and useful overlap geometry.
- Use alternate views only when they improve recognition, orientation, or open/closed state.
- Preserve real size and mechanism differences rather than scaling one product repeatedly.
- Treat `library-manifest.csv` as the authority for SKU, product, brand, source relationship, and selection rationale.
- Categories without a dedicated active catalog row are explicitly marked `cross-taxonomy` or `kit-evidence`; those references must not be presented as proof of a standalone category product.

## Known taxonomy constraints

- `semi-automatic-taping-tool-sets` is supported by genuine complete kit imagery, although those kits currently live under Automatic Taping Tool Sets.
- `semi-automatic-tool-cases` uses authentic case configurations evidenced by the Columbia case family and the case-backed Commando kit; there is no dedicated active semi-auto case row.
