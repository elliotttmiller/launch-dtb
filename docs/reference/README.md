# docs/reference — lookup data, print assets, and UI mockups

Reference material that isn't narrative documentation: CSV lookup tables/import templates, print-ready assets, and static UI mockups. None of this is verified against application code (it's data/design source material, not architecture docs) — treat dates and provenance notes below as the accuracy bar instead.

## Layout

### `business-cards/`
- **`print-package/`** — the final, production-ready VistaPrint upload package (front/back masters, Embedded Gloss mask, color/finish spec, print PDFs, contact vCard). `print-package/docs/README_PRINT_PACKAGE.txt` is the authoritative upload/print procedure; start there before reprinting or reordering cards.
- **`vendor-template-source/`** — the raw VistaPrint "Embossed Gloss" template downloaded before DTB's artwork was placed (generic bleed/safe-area SVGs and VistaPrint's own generic artwork-guidelines PDF, not brand-specific). Kept for provenance only; `print-package/` supersedes it for actual production use.
- **`early-draft-preview-*.png`** — earlier draft renders (front/back/combined) that predate the final `print-package/previews/`. Superseded; kept only as design-history reference, not for reprinting.

### `email-mockups/`
Static HTML/PNG mockups of transactional-email layouts (`dtb-responsive-transactional-email.html`, `email-targeted-ui-*`). `targeted-ui-*-earlier-draft.png` are earlier iterations of the same layouts, superseded by the `email-targeted-ui-*` files but kept for design-history reference. These are design mockups, not the shipped email templates — the shipped templates live in `drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Email/templates/`, documented in `docs/visual-designer/dtb-email-design-system.md`.

### `data/`
CSV lookup tables and import templates: WooCommerce tax-rate tables (`standard_tax_rates.csv`, `tax_rates_reduced.csv`, `tax_rates_zero.csv`), brand/SKU mapping (`tsw_all_brands*.csv`), product weight/dimension lookup (`tapetech-upc-codes-weights-dimensions.csv` — referenced directly from `VeeqoCatalogWeightSyncService.php`), and Level5/pricing/Veeqo import source data. Contents are not modified as part of doc audits — only file placement/naming.

### `market-research/`
`deep-research-report.md` — external market/business analysis for Level5 catalog launch planning. Not an engineering doc and not code-verifiable; treat its external-site claims as of their own research date, not current.

## Conventions
- Filenames are kebab-case except inside `print-package/`, where original vendor/production asset names (`DryWallToolbox_*`) are preserved unchanged since they matter for matching against the live VistaPrint order history.
- Superseded/draft assets are kept (not deleted) but explicitly labeled `earlier-draft`/`early-draft-preview` in their filename so they're never mistaken for current.
