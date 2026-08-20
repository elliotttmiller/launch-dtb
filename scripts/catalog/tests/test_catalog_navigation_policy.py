from __future__ import annotations

import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from catalog_taxonomy_policy import (
    canonical_values,
    navigation_for_row,
    taxon_for_path,
)


def row(*, sku="SKU", type_="simple", kind="tool", categories="", category="", display="", parent=""):
    return {
        "SKU": sku,
        "Type": type_,
        "Meta: _dtb_product_kind": kind,
        "Categories": categories,
        "Meta: _dtb_category_key": category,
        "Meta: _dtb_display_category_key": display,
        "Meta: _dtb_parent_product_sku": parent,
    }


def test_cross_brand_flat_boxes_share_one_navigation_identity():
    assert canonical_values(row(categories="Drywall Finishing Tools > Automatic Taping Tools > Flat Boxes")) == {
        "Categories": "Drywall Finishing Tools > Automatic Taping Tools > Flat Boxes",
        "Meta: _dtb_category_key": "finishing",
        "Meta: _dtb_display_category_key": "finishing_boxes",
    }


def test_legacy_finishing_boxes_leaf_normalizes_to_flat_boxes():
    taxon = taxon_for_path("Drywall Finishing Tools > Automatic Taping Tools > Finishing Boxes")
    assert taxon is not None
    assert taxon.path == "Drywall Finishing Tools > Automatic Taping Tools > Flat Boxes"


def test_predator_family_path_is_not_navigation_authority():
    assert taxon_for_path("Drywall Finishing Tools > Predator Family") is None
    values = canonical_values(row(categories="Drywall Finishing Tools > Automatic Taping Tools > Automatic Tapers, Drywall Finishing Tools > Predator Family"))
    assert values is not None
    assert values["Categories"] == "Drywall Finishing Tools > Automatic Taping Tools > Automatic Tapers"


def test_surpro_legacy_stilt_root_normalizes_to_stilts_accessories():
    values = canonical_values(row(kind="stilt", categories="Drywall Finishing Tools > Stilts"))
    assert values == {
        "Categories": "Stilts & Accessories > Stilts",
        "Meta: _dtb_category_key": "stilts",
        "Meta: _dtb_display_category_key": "stilts",
    }


def test_part_kind_owns_parts_branch():
    values = canonical_values(row(kind="part", categories="Drywall Finishing Tools > Automatic Taping Tools > Flat Boxes"))
    assert values["Categories"] == "Drywall Finishing Tools > Parts"
    assert values["Meta: _dtb_category_key"] == "parts"


def test_variation_inherits_parent_taxonomy_even_when_child_is_blank_or_wrong():
    parent = row(sku="PARENT", type_="variable", categories="Drywall Finishing Tools > Semi-Automatic Taping Tools > Compound Tubes")
    child = row(sku="CHILD", type_="variation", kind="variation", categories="", category="corner-tools", display="", parent="PARENT")
    values = canonical_values(child, parent)
    assert values == {
        "Categories": "Drywall Finishing Tools > Semi-Automatic Taping Tools > Compound Tubes",
        "Meta: _dtb_category_key": "corner",
        "Meta: _dtb_display_category_key": "compound_tubes",
    }


def test_unknown_leaf_never_guesses():
    assert navigation_for_row(row(categories="Drywall Finishing Tools > Automatic Taping Tools > Future Mystery Tool")) is None
