import importlib.util
from pathlib import Path


PATH = Path(__file__).parents[1] / "normalize_columbia_tool_cases.py"
SPEC = importlib.util.spec_from_file_location("tool_cases", PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(MODULE)


def row(sku, product_type, parent=""):
    value = {field: "x" for field in MODULE.VARIATION_FIELDS}
    value.update({"SKU": sku, "Type": product_type, "Parent": parent, "Name": sku,
                  "Meta: _dtb_product_kind": "drywall-finishing-tool", "Meta: _dtb_commerce_mode": "standard-catalog",
                  "Slug": sku.lower(), "Meta: _dtb_seo_canonical": "/old/", "Short description": "old",
                  "Meta: _dtb_seo_title": "old", "Meta: _dtb_seo_description": "old", "Meta: _dtb_seo_focus_kw": "old"})
    return value


def test_parent_removed_and_sellable_children_become_simple():
    rows = [row("COL-TOOL-CASE", "variable"), row("TCS", "variation", "COL-TOOL-CASE"), row("RC", "variation", "COL-TOOL-CASE")]
    result, changes = MODULE.normalize(rows)
    assert [item["SKU"] for item in result] == ["TCS", "RC"]
    assert all(item["Type"] == "simple" for item in result)
    assert all(item["Parent"] == "" for item in result)
    assert all(item["Meta: _dtb_product_kind"] == "accessory" for item in result)
    assert all(item["Meta: _dtb_commerce_mode"] == "purchasable" for item in result)
    assert any(change["sku"] == "COL-TOOL-CASE" and change["field"] == "row" for change in changes)


def test_idempotent_when_family_is_already_absent():
    rows = [row("OTHER", "simple")]
    result, changes = MODULE.normalize(rows)
    assert result == rows
    assert changes == []
