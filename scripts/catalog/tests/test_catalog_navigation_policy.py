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
from official_catalog_schema import CatalogValidationError, validate_taxonomy_rows


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


def test_legacy_automatic_leaves_resolve_to_industry_standard_names():
    cases = {
        "Drywall Finishing Tools > Automatic Taping Tools > Corner Boxes": ("Angle Boxes", "corner", "corner_tools"),
        "Drywall Finishing Tools > Automatic Taping Tools > Automatic Taping Tool Cases": ("Tool Cases", "accessories", "accessories"),
        "Drywall Finishing Tools > Automatic Taping Tools > Fixed Handles": ("Corner Tool Handles", "handles", "handles"),
    }
    for path, (leaf, category, display) in cases.items():
        values = canonical_values(row(categories=path))
        assert values is not None
        assert values["Categories"].endswith(leaf)
        assert values["Meta: _dtb_category_key"] == category
        assert values["Meta: _dtb_display_category_key"] == display


def test_legacy_tool_cases_leaf_normalizes_to_automatic_tool_cases():
    taxon = taxon_for_path("Drywall Finishing Tools > Automatic Taping Tools > Tool Cases")
    assert taxon is not None
    assert taxon.path.endswith("Tool Cases")


def test_same_functional_leaf_can_exist_in_both_mechanism_groups():
    automatic = taxon_for_path("Drywall Finishing Tools > Automatic Taping Tools > Compound Tubes")
    semi = taxon_for_path("Drywall Finishing Tools > Semi-Automatic Tools > Compound Tubes")
    assert automatic is not None and automatic.group == "Automatic Taping Tools"
    assert semi is not None and semi.group == "Semi-Automatic Tools"
    assert taxon_for_path("Compound Tubes") is None


def test_semi_automatic_tool_set_path_wins_over_toolset_fallback():
    values = canonical_values(
        row(
            kind="toolset",
            categories="Drywall Finishing Tools > Semi-Automatic Tools > Semi-Automatic Taping Tool Sets",
        )
    )
    assert values is not None
    assert values["Categories"].endswith("Semi-Automatic Taping Tool Sets")


def test_complete_semi_automatic_reference_leaves_are_registered():
    leaves = (
        "Semi-Automatic Tapers",
        "Compound Applicators",
        "Compound Tubes",
        "Corner Flushers",
        "Semi-Automatic Taping Tool Sets",
        "Semi-Automatic Taping Tool Accessories",
    )
    for leaf in leaves:
        path = f"Drywall Finishing Tools > Semi-Automatic Tools > {leaf}"
        assert taxon_for_path(path) is not None


def test_legacy_semi_automatic_group_normalizes_without_flattening_leaf_name():
    values = canonical_values(
        row(categories="Drywall Finishing Tools > Semi-Automatic Taping Tools > Compound Tubes")
    )
    assert values is not None
    assert values["Categories"] == "Drywall Finishing Tools > Semi-Automatic Tools > Compound Tubes"


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
    parent = row(sku="PARENT", type_="variable", categories="Drywall Finishing Tools > Semi-Automatic Tools > Compound Tubes")
    child = row(sku="CHILD", type_="variation", kind="variation", categories="", category="corner-tools", display="", parent="PARENT")
    values = canonical_values(child, parent)
    assert values == {
        "Categories": "Drywall Finishing Tools > Semi-Automatic Tools > Compound Tubes",
        "Meta: _dtb_category_key": "corner",
        "Meta: _dtb_display_category_key": "compound_tubes",
    }


def test_unknown_leaf_never_guesses():
    assert navigation_for_row(row(categories="Drywall Finishing Tools > Automatic Taping Tools > Future Mystery Tool")) is None


def test_taxonomy_validator_enforces_exact_variation_inheritance():
    parent = row(sku="PARENT", type_="variable", categories="Drywall Finishing Tools > Automatic Taping Tools > Flat Boxes", category="finishing", display="finishing_boxes")
    child = row(sku="CHILD", type_="variation", kind="variation", categories="", category="finishing", display="finishing_boxes", parent="PARENT")
    child["Parent"] = "PARENT"
    try:
        validate_taxonomy_rows([parent, child])
    except CatalogValidationError as exc:
        assert "CHILD: Categories" in str(exc)
    else:
        raise AssertionError("variation taxonomy drift was not rejected")
