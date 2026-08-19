from __future__ import annotations

import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from catalog_taxonomy_policy import expected_taxonomy, taxonomy_state
from normalize_official_taxonomy import build_changes, strip_brand_from_categories


def test_toolset_policy_is_identical_for_every_brand() -> None:
    expected = expected_taxonomy(
        product_kind="toolset",
        category_key="toolsets",
        display_category_key="toolsets",
    )
    assert expected is not None
    assert expected.category_key == "taping"
    assert expected.display_category_key == "toolsets"


def test_part_policy_is_identical_for_every_brand() -> None:
    expected = expected_taxonomy(
        product_kind="part",
        category_key="taping",
        display_category_key="parts",
    )
    assert expected is not None
    assert expected.category_key == "parts"
    assert expected.display_category_key == "parts"


def test_display_category_derives_one_broad_category() -> None:
    cases = {
        "automatic_tapers": "taping",
        "toolsets": "taping",
        "finishing_boxes": "finishing",
        "handles": "handles",
        "pumps": "mudboxes",
        "corner_tools": "corner",
        "compound_tubes": "corner",
        "parts": "parts",
        "stilts": "stilts",
    }
    for display, broad in cases.items():
        expected = expected_taxonomy(
            product_kind="drywall-finishing-tool",
            category_key="legacy",
            display_category_key=display,
        )
        assert expected is not None
        assert expected.category_key == broad
        assert expected.display_category_key == display


def test_unknown_display_category_does_not_invent_taxonomy() -> None:
    assert expected_taxonomy(
        product_kind="drywall-finishing-tool",
        category_key="custom",
        display_category_key="unknown_future_class",
    ) is None


def test_brand_segment_removal_uses_row_brand_not_brand_allowlist() -> None:
    assert strip_brand_from_categories(
        "Drywall Finishing Tools > New Future Brand > Automatic Taping Tools > Automatic Tapers",
        "New Future Brand",
    ) == "Drywall Finishing Tools > Automatic Taping Tools > Automatic Tapers"


def test_normalizer_applies_same_toolset_policy_across_brands() -> None:
    rows = [
        {
            "SKU": "A",
            "Brands": "Brand A",
            "Categories": "Drywall Finishing Tools > Automatic Taping Tools > Automatic Taping Tool Sets",
            "Meta: _dtb_product_kind": "toolset",
            "Meta: _dtb_category_key": "toolsets",
            "Meta: _dtb_display_category_key": "toolsets",
        },
        {
            "SKU": "B",
            "Brands": "Brand B",
            "Categories": "Drywall Finishing Tools > Automatic Taping Tools > Automatic Taping Tool Sets",
            "Meta: _dtb_product_kind": "toolset",
            "Meta: _dtb_category_key": "taping",
            "Meta: _dtb_display_category_key": "",
        },
    ]
    changes = build_changes(rows)
    by_sku = {}
    for change in changes:
        by_sku.setdefault(change["sku"], {})[change["field"]] = change["expected"]
    assert by_sku["A"]["Meta: _dtb_category_key"] == "taping"
    assert by_sku["B"]["Meta: _dtb_display_category_key"] == "toolsets"


def test_taxonomy_state_reports_expected_pair_not_brand() -> None:
    state = taxonomy_state(
        product_kind="toolset",
        category_key="toolsets",
        display_category_key="toolsets",
    )
    assert state["consistent"] is False
    assert state["expected_category_key"] == "taping"
    assert state["expected_display_category_key"] == "toolsets"
    assert "brand" not in state
