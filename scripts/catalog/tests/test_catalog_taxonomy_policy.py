from __future__ import annotations

import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from catalog_taxonomy_policy import expected_taxonomy, taxonomy_state
from normalize_official_taxonomy import build_changes, review_counts, strip_brand_from_categories


def test_toolset_product_kind_is_deterministic_across_brands() -> None:
    expected = expected_taxonomy(product_kind="toolset", display_category_key="toolsets")
    assert expected is not None
    assert expected.category_key == "taping"
    assert expected.display_category_key == "toolsets"


def test_part_policy_is_identical_for_every_brand() -> None:
    expected = expected_taxonomy(product_kind="part", display_category_key="parts")
    assert expected is not None
    assert expected.category_key == "parts"
    assert expected.display_category_key == "parts"


def test_only_functional_display_categories_derive_broad_category() -> None:
    cases = {
        "automatic_tapers": "taping",
        "finishing_boxes": "finishing",
        "handles": "handles",
        "pumps": "mudboxes",
        "corner_tools": "corner",
        "compound_tubes": "corner",
        "parts": "parts",
        "stilts": "stilts",
    }
    for display, broad in cases.items():
        expected = expected_taxonomy(product_kind="drywall-finishing-tool", display_category_key=display)
        assert expected is not None
        assert expected.category_key == broad
        assert expected.display_category_key == display


def test_cross_cutting_display_categories_do_not_invent_broad_taxonomy() -> None:
    for display in ("predator_family", "toolsets", "accessories"):
        assert expected_taxonomy(
            product_kind="drywall-finishing-tool",
            display_category_key=display,
        ) is None
        state = taxonomy_state(
            product_kind="drywall-finishing-tool",
            category_key="handles",
            display_category_key=display,
        )
        assert state["disposition"] == "ambiguous_review"
        assert state["expected_category_key"] is None


def test_unknown_display_category_does_not_invent_taxonomy() -> None:
    state = taxonomy_state(
        product_kind="drywall-finishing-tool",
        category_key="custom",
        display_category_key="unknown_future_class",
    )
    assert state["disposition"] == "unknown"
    assert state["consistent"] is True


def test_brand_segment_removal_uses_row_brand_not_brand_allowlist() -> None:
    assert strip_brand_from_categories(
        "Drywall Finishing Tools > New Future Brand > Automatic Taping Tools > Automatic Tapers",
        "New Future Brand",
    ) == "Drywall Finishing Tools > Automatic Taping Tools > Automatic Tapers"


def test_brand_segment_removal_only_applies_to_legacy_root_position() -> None:
    raw = "Drywall Finishing Tools > Automatic Taping Tools > Acme > Specialty Tools"
    assert strip_brand_from_categories(raw, "Acme") == raw


def test_brand_named_root_is_not_removed() -> None:
    raw = "Acme > Specialty Tools"
    assert strip_brand_from_categories(raw, "Acme") == raw


def test_normalizer_writes_only_deterministic_taxonomy_mismatches() -> None:
    rows = [
        {
            "SKU": "BROAD",
            "Brands": "Brand A",
            "Categories": "Drywall Finishing Tools > Automatic Taping Tools > Automatic Taping Tool Sets",
            "Meta: _dtb_product_kind": "toolset",
            "Meta: _dtb_category_key": "toolsets",
            "Meta: _dtb_display_category_key": "toolsets",
        },
        {
            "SKU": "DISPLAY-ONLY",
            "Brands": "Brand B",
            "Categories": "Drywall Finishing Tools > Automatic Taping Tools > Automatic Taping Tool Sets",
            "Meta: _dtb_product_kind": "toolset",
            "Meta: _dtb_category_key": "taping",
            "Meta: _dtb_display_category_key": "",
        },
        {
            "SKU": "AMBIGUOUS",
            "Brands": "Brand C",
            "Categories": "Tools",
            "Meta: _dtb_product_kind": "drywall-finishing-tool",
            "Meta: _dtb_category_key": "handles",
            "Meta: _dtb_display_category_key": "predator_family",
        },
    ]
    changes = build_changes(rows)
    taxonomy_changes = [change for change in changes if change["field"].startswith("Meta:")]
    assert [(change["sku"], change["field"], change["expected"]) for change in taxonomy_changes] == [
        ("BROAD", "Meta: _dtb_category_key", "taping")
    ]
    assert review_counts(rows) == {
        "taxonomy_ambiguous_review": 1,
        "display_taxonomy_mismatch": 1,
    }


def test_taxonomy_state_reports_raw_and_normalized_values() -> None:
    state = taxonomy_state(
        product_kind="Toolset",
        category_key=" Tool-Sets ",
        display_category_key="Tool Sets",
    )
    assert state["disposition"] == "deterministic_mismatch"
    assert state["raw_category_key"] == "Tool-Sets"
    assert state["raw_display_category_key"] == "Tool Sets"
    assert state["category_key"] == "tool_sets"
    assert state["display_category_key"] == "tool_sets"
    assert state["expected_category_key"] == "taping"
    assert state["expected_display_category_key"] == "toolsets"
    assert "brand" not in state
