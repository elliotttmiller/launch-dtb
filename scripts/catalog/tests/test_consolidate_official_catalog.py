from __future__ import annotations

import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from consolidate_official_catalog import build_plan


def product(sku: str, *, name="Tool", type_="simple", brand="Columbia Tools", categories="Drywall Finishing Tools > Automatic Taping Tools > Flat Boxes", category="finishing", display="finishing_boxes", parent="", description="old", seo_title="old title"):
    return {
        "SKU": sku,
        "Name": name,
        "Type": type_,
        "Brands": brand,
        "Meta: _dtb_mpn": sku,
        "Meta: _dtb_manufacturer_sku": sku,
        "Meta: _dtb_parent_product_sku": parent,
        "Meta: _dtb_product_kind": "tool" if type_ != "variation" else "variation",
        "Categories": categories,
        "Meta: _dtb_category_key": category,
        "Meta: _dtb_display_category_key": display,
        "Description": description,
        "Short description": "old short",
        "Meta: _dtb_seo_title": seo_title,
        "Meta: _dtb_seo_description": "old seo",
        "Meta: _dtb_seo_focus_kw": "old keyword",
        "Meta: _dtb_seo_canonical": "",
    }


def test_seo_source_can_only_supply_allowlisted_copy():
    main = product("SKU-1")
    seo = product("SKU-1", description="new verified copy", seo_title="new seo title")
    seo["Categories"] = "BROKEN > TAXONOMY"
    seo["Meta: _dtb_seo_canonical"] = "/wrong-route/"
    plan = build_plan([main], [seo])
    changed = {(item["field"], item["expected"]) for item in plan["content_changes"]}
    assert ("Description", "new verified copy") in changed
    assert ("Meta: _dtb_seo_title", "new seo title") in changed
    assert all(item["field"] != "Categories" for item in plan["content_changes"])
    assert all(item["field"] != "Meta: _dtb_seo_canonical" for item in plan["content_changes"])


def test_identity_conflict_rejects_secondary_copy_for_entire_sku():
    main = product("SKU-1")
    seo = product("SKU-1", brand="Wrong Brand", description="must not import")
    plan = build_plan([main], [seo])
    assert plan["content_changes"] == []
    assert plan["rejected_content"][0]["field"] == "Brands"


def test_seo_only_sku_never_creates_canonical_product():
    plan = build_plan([product("MAIN")], [product("SEO-ONLY")])
    assert plan["seo_only_skus"] == ["SEO-ONLY"]
    assert plan["content_changes"] == []


def test_variation_taxonomy_is_rebuilt_from_parent():
    parent = product("PARENT", type_="variable", categories="Drywall Finishing Tools > Semi-Automatic Taping Tools > Compound Tubes", category="corner", display="compound_tubes")
    child = product("CHILD", type_="variation", parent="PARENT", categories="", category="corner-tools", display="")
    plan = build_plan([parent, child], [])
    child_changes = {item["field"]: item["expected"] for item in plan["taxonomy_changes"] if item["sku"] == "CHILD"}
    assert child_changes["Categories"] == "Drywall Finishing Tools > Semi-Automatic Taping Tools > Compound Tubes"
    assert child_changes["Meta: _dtb_category_key"] == "corner"
    assert child_changes["Meta: _dtb_display_category_key"] == "compound_tubes"


def test_unknown_navigation_is_reported_not_guessed():
    main = product("UNKNOWN", categories="Drywall Finishing Tools > Automatic Taping Tools > Future Mystery Tool")
    plan = build_plan([main], [])
    assert len(plan["unresolved_taxonomy"]) == 1
    assert plan["unresolved_taxonomy"][0]["sku"] == "UNKNOWN"
