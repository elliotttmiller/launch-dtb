from copy import deepcopy
import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "apply_official_catalog_p0_corrections.py"
SPEC = importlib.util.spec_from_file_location("catalog_p0", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(MODULE)


def rows():
    return [
        {
            "SKU": "AH8-CLIP",
            "Type": "variable",
            "Attribute 1 value(s)": '3.5", Standard',
            "Attribute 1 default": '3.5",Columbia AH8',
            MODULE.SCHEMATIC_URL: "/schematics?a=1&amp;b=2",
            MODULE.INHERIT_IMAGE: "0",
        },
        {
            "SKU": "AH9-CLIP",
            "Type": "variable",
            "Attribute 1 value(s)": '3.5", Standard',
            "Attribute 1 default": '3.5",Columbia AH9',
            MODULE.SCHEMATIC_URL: "",
            MODULE.INHERIT_IMAGE: "0",
        },
        {"SKU": "TTSFS", "Type": "simple", "Attribute 1 default": "", MODULE.SCHEMATIC_URL: "", MODULE.INHERIT_IMAGE: "1"},
        {"SKU": "TTSFS-2", "Type": "simple", "Attribute 1 default": "", MODULE.SCHEMATIC_URL: "", MODULE.INHERIT_IMAGE: "1"},
    ]


def test_corrections_are_bounded_and_idempotent():
    catalog_rows = rows()
    changes = MODULE.corrections(catalog_rows)
    assert len(changes) == 5
    assert catalog_rows[0][MODULE.SCHEMATIC_URL] == "/schematics?a=1&b=2"
    assert catalog_rows[0]["Attribute 1 default"] == '3.5"'
    assert catalog_rows[1]["Attribute 1 default"] == '3.5"'
    assert catalog_rows[2][MODULE.INHERIT_IMAGE] == "0"
    assert catalog_rows[3][MODULE.INHERIT_IMAGE] == "0"
    assert MODULE.corrections(catalog_rows) == []


def test_unexpected_default_fails_closed():
    catalog_rows = rows()
    catalog_rows[0]["Attribute 1 default"] = "unexpected"
    try:
        MODULE.corrections(catalog_rows)
    except ValueError as error:
        assert "Unexpected AH8-CLIP default" in str(error)
    else:
        raise AssertionError("unexpected catalog state must not be rewritten")


def test_atomic_write_rejects_concurrent_catalog_change(tmp_path):
    catalog = tmp_path / "catalog.csv"
    catalog.write_bytes(b"\xef\xbb\xbfSKU\r\nOLD\r\n")
    stale_hash = MODULE.digest(catalog)
    catalog.write_bytes(b"\xef\xbb\xbfSKU\r\nNEW\r\n")
    try:
        MODULE.write_atomic(catalog, ["SKU"], [{"SKU": "REPLACEMENT"}], stale_hash)
    except RuntimeError as error:
        assert "refusing to overwrite concurrent work" in str(error)
    else:
        raise AssertionError("concurrent catalog change must be rejected")
    assert b"NEW" in catalog.read_bytes()
