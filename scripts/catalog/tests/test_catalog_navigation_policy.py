from __future__ import annotations

import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from catalog_taxonomy_policy import canonical_values, navigation_for_row, taxon_for_path, taxons_for_path
from official_catalog_schema import CatalogValidationError, validate_taxonomy_rows


def row(*, sku="SKU", type_="simple", kind="tool", categories="", category="", display="", parent=""):
    return {"SKU": sku, "Type": type_, "Meta: _dtb_product_kind": kind, "Categories": categories, "Meta: _dtb_category_key": category, "Meta: _dtb_display_category_key": display, "Meta: _dtb_parent_product_sku": parent}


def test_cross_brand_flat_boxes_share_universal_navigation_identity():
    expected = {"Categories": "Taping & Finishing Tools > Automatic Taping Tools > Flat Boxes", "Meta: _dtb_category_key": "automatic_taping_tools", "Meta: _dtb_display_category_key": "flat_boxes"}
    assert canonical_values(row(categories=expected["Categories"])) == expected
    assert canonical_values(row(categories="Drywall Finishing Tools > Automatic Taping Tools > Flat Boxes")) == expected


def test_legacy_labels_normalize_to_approved_customer_labels():
    cases = {"Drywall Finishing Tools > Automatic Taping Tools > Finishing Boxes": "Flat Boxes", "Drywall Finishing Tools > Automatic Taping Tools > Corner Boxes": "Angle Boxes & Corner Applicators", "Drywall Finishing Tools > Automatic Taping Tools > Fixed Handles": "Handles & Extensions", "Drywall Finishing Tools > Automatic Taping Tools > Tool Cases": "Tool Storage & Cases"}
    for legacy, leaf in cases.items():
        taxon = taxon_for_path(legacy)
        assert taxon is not None
        assert taxon.path.endswith(leaf)


def test_same_labels_have_distinct_parent_scoped_identities():
    automatic = taxon_for_path("Taping & Finishing Tools > Automatic Taping Tools > Handles & Extensions")
    semi = taxon_for_path("Taping & Finishing Tools > Semi-Automatic Taping Tools > Handles & Extensions")
    assert automatic and automatic.display_key == "automatic_handles_extensions"
    assert semi and semi.display_key == "semi_handles_extensions"
    assert taxon_for_path("Handles & Extensions") is None


def test_multiple_approved_paths_are_retained_as_an_ordered_set():
    raw = "Taping & Finishing Tools > Automatic Taping Tools > Handles & Extensions, Taping & Finishing Tools > Semi-Automatic Taping Tools > Handles & Extensions"
    assert [taxon.display_key for taxon in taxons_for_path(raw)] == ["automatic_handles_extensions", "semi_handles_extensions"]
    assert taxon_for_path(raw) is None


def test_semi_automatic_toolset_path_wins_over_kind_fallback():
    values = canonical_values(row(kind="toolset", categories="Taping & Finishing Tools > Semi-Automatic Taping Tools > Tool Sets"))
    assert values and values["Meta: _dtb_display_category_key"] == "semi_tool_sets"


def test_part_and_stilt_domains_are_separate():
    part = canonical_values(row(kind="part", categories="Taping & Finishing Tools > Automatic Taping Tools > Flat Boxes"))
    stilt = canonical_values(row(kind="stilt", categories="Stilts & Accessories > Stilts"))
    assert part and part["Categories"] == "Replacement Parts"
    assert stilt and stilt["Categories"] == "Stilts & Accessories > Stilts"


def test_variation_inherits_parent_taxonomy():
    parent = row(sku="PARENT", type_="variable", categories="Taping & Finishing Tools > Semi-Automatic Taping Tools > Compound Tubes")
    child = row(sku="CHILD", type_="variation", kind="variation", parent="PARENT")
    assert canonical_values(child, parent) == {"Categories": parent["Categories"], "Meta: _dtb_category_key": "semi_automatic_taping_tools", "Meta: _dtb_display_category_key": "semi_compound_tubes"}


def test_unknown_leaf_never_guesses():
    assert navigation_for_row(row(categories="Taping & Finishing Tools > Automatic Taping Tools > Future Mystery Tool")) is None


def test_taxonomy_validator_rejects_variation_drift():
    parent = row(sku="PARENT", type_="variable", categories="Taping & Finishing Tools > Automatic Taping Tools > Flat Boxes", category="automatic_taping_tools", display="flat_boxes")
    child = row(sku="CHILD", type_="variation", kind="variation", categories="", category="automatic_taping_tools", display="flat_boxes", parent="PARENT")
    child["Parent"] = "PARENT"
    try:
        validate_taxonomy_rows([parent, child])
    except CatalogValidationError as exc:
        assert "CHILD: Categories" in str(exc)
    else:
        raise AssertionError("variation taxonomy drift was not rejected")
