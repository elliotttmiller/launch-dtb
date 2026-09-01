# Catalog Category Classification Contract

## Authority

WooCommerce `product_cat` is the runtime storefront navigation authority. The canonical catalog sources under `products/` own the approved product-to-category classification that is projected into WooCommerce.

Historical category paths are migration inputs only. They are not proof that a product was functionally classified correctly.

When an exact SKU has manufacturer evidence that conflicts with its historical category path, the reviewed SKU-level classification wins. Reviewed exceptions are stored in:

```text
products/catalog/source/product_category_overrides.csv
```

The override registry is intentionally small and allowlisted. It must not become a fuzzy classifier or a second general taxonomy.

## Functional classification rule

Classify by the physical sellable tool and its operating role, not by a generic word in the product name.

In particular, `applicator` is ambiguous and must never be treated as one universal product family.

```text
Automatic Taping Tools
  Angle Boxes & Corner Applicators
    compound-holding corner/angle boxes that are filled from a loading system
    and drive a corner finisher or applicator head

  Compound Tubes
    tube-style compound delivery bodies, including powered/gas-assisted tubes

  Compound Applicators
    applicator heads/mud heads and other applicating tools that
    receive compound from a compatible tube/body or apply a defined bead/profile
```

A Corner Applicator Box is not a Compound Applicator Head. A product must not cross those families because both happen to apply joint compound.

## Evidence order

For a disputed or ambiguous SKU, use this evidence order:

1. current manufacturer product page or current manufacturer catalog;
2. manufacturer operation/maintenance guide or schematic;
3. manufacturer-defined compatible system and required upstream/downstream tools;
4. specialist retailer evidence only as secondary confirmation.

Product title keywords alone are insufficient where terminology overlaps.

## Current reviewed corrections

The following corrections are manufacturer-evidenced and supersede historical path migration:

- `4-772` — LEVEL5 MiniShot: Compound Tube, not Compound Applicator.
- `COL-THROTTLE-CORNER-FLUSHER-BOX` — Columbia ThrottleBox: Angle Boxes & Corner Applicators.
- `LV5-CORNER-APPLICATOR` — LEVEL5 Corner Applicator Box: Angle Boxes & Corner Applicators.
- `MRX01TT` — TapeTech MudRunner Pro Extension: Handles & Extensions.
- `PT-CA8` — Platinum 8-inch Corner Applicator: Angle Boxes & Corner Applicators.
- `TT-CORNER-APPLICATOR` — TapeTech Corner Applicator: Angle Boxes & Corner Applicators.
- `TT-MUDRUNNER` — TapeTech MudRunner: Angle Boxes & Corner Applicators.

`Automatic Taping Tools` is the industry system umbrella. `Semi-Automatic`
remains a distinct tool/set classification where applicable, but it does not
own duplicate Compound Tubes, Compound Applicators, Corner Flushers, Handles,
or Tool Sets branches.

The remaining products in `Compound Applicators` are not automatically reclassified by name. Applicator heads, flat applicators, inside/outside applicator heads, mud heads, and powered applicating bodies require their exact manufacturer-supported functional classification.

## Pipeline contract

`scripts/catalog/build_catalog_category_assignments.py` performs deterministic category assignment in this order:

1. load and validate taxonomy;
2. load reviewed SKU overrides;
3. for each owner SKU, apply an approved exact SKU override when present;
4. otherwise migrate from an exact approved historical/current category path;
5. reject unknown SKUs, duplicate overrides, unapproved overrides, missing evidence, and unknown taxa;
6. write the explicit assignment registry and brand/category coverage report.

The subsequent official-catalog rebuild projects those explicit assignments into the canonical WooCommerce import fields. Runtime code and the React storefront must not infer or repair category ownership from product names.

## Non-goals

This contract does not change SKU, MPN, GTIN, product/variation identity, pricing, inventory, fulfillment, orders, payments, refunds, Veeqo, QuickBooks, or compatibility identity.
