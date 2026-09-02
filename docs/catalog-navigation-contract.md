# Catalog Navigation Contract

## Authority

`products/catalog/source/taxonomy.json` is the canonical machine-readable catalog taxonomy registry.

`products/launch/official/dtb_official_catalog.csv` is the canonical launch catalog CSV. It assigns products and variations to the registered WooCommerce hierarchy and preserves protected catalog identity. WooCommerce owns the resulting runtime products, variations, and `product_cat` terms after import.

`scripts/catalog/catalog_taxonomy_policy.py` derives deterministic validation and compatibility metadata from `taxonomy.json`; it must not maintain a second independent hierarchy.

`drywalltoolbox/wp/wp-content/mu-plugins/dtb-catalog-platform/Resources/catalog-taxonomy.json` is the deployment projection of that registry. It must remain byte-identical to the canonical source. `scripts/catalog/sync_catalog_runtime_taxonomy.py` checks or atomically refreshes the projection; contract tests reject drift.

The React storefront consumes backend navigation/facet contracts. It must not classify products from names, SKU patterns, brands, product families, or a parallel hardcoded category tree.

`Meta: _dtb_category_key` and `Meta: _dtb_display_category_key` are compatibility/filter facets. They are not alternate product-category authorities.

Brand and product family are orthogonal dimensions and must not become `product_cat` hierarchy nodes.

## Classification basis

DTB normalizes current cross-brand drywall-tool terminology by physical/function class rather than copying any one manufacturer or retailer navigation tree.

The governing rules are:

- classify by what the sellable product physically/functionally is;
- keep automation/system membership separate from the primary functional class when a tool class spans workflows;
- normalize manufacturer synonyms to one cross-brand class when they describe the same tool function;
- do not use brand, marketing series, material, or product family as category ancestry;
- use exact SKU evidence for genuinely ambiguous products rather than name heuristics;
- variable parents own classification and every variation inherits the exact parent tuple.

## Canonical hierarchy

```text
Taping & Finishing Tools
  Automatic Tapers
  Semi-Automatic Tapers & Banjos
  Flat Boxes
  Corner Finishers
  Corner Applicators & Angle Boxes
  Compound Tubes
  Powered Compound Applicators
  Applicator Heads
  Corner Flushers
  Corner Rollers
  Nail Spotters
  Loading & Compound Pumps
  Goosenecks, Box Fillers & Adapters
  Handles & Extensions
  Continuous Flow Tools
  Tool Sets & Kits
  Tool Storage & Cases

Replacement Parts

Stilts & Accessories
  Stilts
```

The current launch catalog has no sellable stilt-accessory leaves beyond complete Stilts. New leaves must be added only when actual catalog inventory and evidence justify them.

## Important normalization decisions

### Corner Finishers / Angle Heads

`Corner Finishers` is the canonical product class. `Angle Head` and `Anglehead` are manufacturer/search aliases, not separate taxonomy leaves.

### Corner Applicators / Angle Boxes / Corner Boxes

`Corner Applicators & Angle Boxes` is the canonical cross-brand class for reservoir-style corner applicator boxes. `Corner Box` remains an alias.

### Compound delivery versus applicator heads

Passive applicator/mud heads and complete compound-delivery tools are separate product classes:

- `Compound Tubes` — compound-holding/delivery tubes;
- `Powered Compound Applicators` — complete powered or gas-assisted compound-delivery/applicator tools;
- `Applicator Heads` — passive heads attached to a compatible tube/applicator/delivery tool.

The retired `Compound Applicators` leaf is ambiguous and must not be used as a new canonical assignment.

### Semi-automatic tapers

Semi-automatic tapers/banjos are a functional product class directly under `Taping & Finishing Tools`. They are not children of an automatic-tool hierarchy.

### Tool sets

`Tool Sets & Kits` is cross-functional. Sets may contain automatic, semi-automatic, flat-joint, corner-finishing, bead, or mixed equipment, so set classification must not imply one automation system.

### Handles

Fixed, extendable, box, corner-tool, and related compatible handles remain consolidated under `Handles & Extensions`. Handle type/compatibility belongs in facets/attributes rather than duplicate category leaves.

### Replacement parts

`Replacement Parts` remains a dedicated top-level catalog surface. Part discovery should primarily use compatibility relationships such as brand, compatible tool/model, schematic, assembly, and part type rather than creating hardware-type product-category branches.

## Canonical compatibility facets

The official CSV currently derives compatibility/filter keys from the functional category. Representative tuples are:

```text
Taping & Finishing Tools > Automatic Tapers
  -> _dtb_category_key = taping
  -> _dtb_display_category_key = automatic_tapers

Taping & Finishing Tools > Flat Boxes
  -> finishing
  -> flat_boxes

Taping & Finishing Tools > Corner Finishers
  -> corner
  -> corner_finishers

Taping & Finishing Tools > Compound Tubes
  -> corner
  -> compound_tubes

Taping & Finishing Tools > Powered Compound Applicators
  -> corner
  -> powered_compound_applicators

Taping & Finishing Tools > Applicator Heads
  -> corner
  -> applicator_heads

Taping & Finishing Tools > Handles & Extensions
  -> handles
  -> handles

Taping & Finishing Tools > Tool Sets & Kits
  -> taping
  -> toolsets

Taping & Finishing Tools > Semi-Automatic Tapers & Banjos
  -> taping
  -> semi_automatic_tapers_banjos

Replacement Parts
  -> parts
  -> parts

Stilts & Accessories > Stilts
  -> stilts
  -> stilts
```

Compatibility metadata uses lowercase snake_case. Historical values remain aliases only where a deterministic one-to-one migration exists. The old `automatic_compound_applicators` value is intentionally retained as a legacy read value because that historical class split into two canonical product classes and therefore cannot be safely rewritten without SKU-level evidence.

## Parent / variation contract

A variable parent owns navigation classification. Every variation inherits the parent's exact:

- `Categories`
- `Meta: _dtb_category_key`
- `Meta: _dtb_display_category_key`

Variation-specific category drift is invalid. If choices require materially different functional product classes, they must not be modeled as variations of one product family.

## Assignment and rebuild workflow

`products/catalog/source/product_category_overrides.csv` stores reviewed exact-SKU exceptions/evidence.

`products/catalog/source/product_categories.csv` is the generated/approved owner-SKU assignment projection. Historical taxon keys in that file are migration inputs only and are normalized by the supported rebuild path.

`scripts/catalog/build_catalog_category_assignments.py` generates assignments from exact canonical/historical paths plus approved overrides.

`scripts/catalog/rebuild_official_catalog_taxonomy.py` projects those assignments into the official CSV, derives compatibility keys, forces exact parent/variation inheritance, and creates a hash-verified sibling `.bak` before an applied mutation.

## Facets API and frontend

`GET /wp-json/dtb/v1/catalog/facets` derives `navigationGroups` from active WooCommerce `product_cat` ancestry.

The response contract is version `2.0`. Primary `navigationGroups` are read through `DTB_CatalogNavigationService` using one bounded query restricted to registered taxonomy slugs. WooCommerce owns term existence, ancestry, counts, descriptions, and media; the deployed registry projection supplies the canonical allowlist and `sort` order. Scoped brand/display facets may still scan the bounded paginated product projection, but primary navigation must never be rebuilt by scanning every product.

Supported customer navigation roots are ordered:

1. `Taping & Finishing Tools`
2. `Stilts & Accessories` (displayed as `Stilts` while the launch catalog contains only complete stilt products)

Replacement Parts remain a dedicated storefront navigation surface.

The frontend renders the same backend-owned groups and children for desktop and mobile navigation, preserves backend order, and defensively deduplicates canonical slugs. Historical URL aliases may redirect old category slugs to deterministic new equivalents, but frontend compatibility code must not become a taxonomy authority. Facet and category caches are namespaced to the response contract version; responses with a different contract version are not persisted.

WooCommerce treats unescaped commas in `Categories` as separators between separate terms. Canonical category labels containing a comma must therefore escape it as `\,` in the official CSV. The canonical Goosenecks path is serialized as `Taping & Finishing Tools > Goosenecks\, Box Fillers & Adapters` while its human-facing term name remains `Goosenecks, Box Fillers & Adapters`.

Runtime taxonomy migration version `1` idempotently renames the historical `goosenecks` child, merges product relationships and media from any pre-existing canonical/legacy terms, removes the accidental top-level `box-fillers-adapters` split term, and invalidates catalog caches. The migration version is recorded only after every required mutation succeeds.

## Runtime compatibility

`DTB_CategoryNormalizer` resolves explicit compatibility metadata first and uses Woo category names only as a conservative legacy fallback. It recognizes the revised precise display keys and deterministic historical aliases.

Historical `Angle Heads` normalize to `Corner Finishers`. Historical automatic/semi handle and tool-set display values normalize to `handles` and `toolsets`. Ambiguous historical `Compound Applicators` remain a compatibility value until SKU-level catalog migration supplies either `applicator_heads` or `powered_compound_applicators`.

## Security and ownership

This contract changes catalog classification and navigation only. It does not modify order creation, payment, pricing, tax, inventory, fulfillment, accounting, authentication, REST authorization, queue ownership, or provider security boundaries.
