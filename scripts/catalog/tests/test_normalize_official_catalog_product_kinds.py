from __future__ import annotations

import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from normalize_official_catalog_product_kinds import transform


def test_aliases_and_variation_inheritance_are_normalized():
    rows = [
        {"SKU": "P", "Type": "variable", "Parent": "", "Categories": "Taping & Finishing Tools > Automatic Taping Tools > Tool Sets", "Meta: _dtb_product_kind": "kit"},
        {"SKU": "V", "Type": "variation", "Parent": "P", "Categories": "", "Meta: _dtb_product_kind": "variation"},
        {"SKU": "T", "Type": "simple", "Parent": "", "Categories": "Taping & Finishing Tools > Automatic Taping Tools > Flat Boxes", "Meta: _dtb_product_kind": "drywall-finishing-tool"},
    ]
    rows, changes = transform(rows)
    assert [row["Meta: _dtb_product_kind"] for row in rows] == ["toolset", "toolset", "tool"]
    assert changes == 3


def test_second_run_is_idempotent():
    rows = [{"SKU": "P", "Type": "simple", "Parent": "", "Categories": "Replacement Parts", "Meta: _dtb_product_kind": "part"}]
    _, changes = transform(rows)
    assert changes == 0
