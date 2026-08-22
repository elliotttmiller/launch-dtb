from __future__ import annotations

import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from normalize_official_catalog_commerce import transform


def row(type_="simple", mode="quote_only", price="10", published="1", visibility="visible"):
    return {"Type": type_, "Meta: _dtb_commerce_mode": mode, "Regular price": price, "Sale price": "", "Published": published, "Visibility in catalog": visibility}


def test_priced_quote_only_and_legacy_modes_become_purchasable():
    rows, counts = transform([row(), row(mode="standard-catalog"), row(type_="variable", mode="parent_container", price="")])
    assert [item["Meta: _dtb_commerce_mode"] for item in rows] == ["purchasable"] * 3
    assert counts["commerce_mode"] == 3


def test_deprecated_record_is_unpublished_and_hidden():
    rows, counts = transform([row(type_="variation", mode="deprecated")])
    assert rows[0]["Meta: _dtb_commerce_mode"] == "hidden_reference"
    assert rows[0]["Published"] == "0"
    assert rows[0]["Visibility in catalog"] == "hidden"
    assert counts == {"commerce_mode": 1, "published": 1, "visibility": 1}


def test_unpriced_quote_only_simple_product_is_preserved():
    rows, counts = transform([row(mode="quote_only", price="")])
    assert rows[0]["Meta: _dtb_commerce_mode"] == "quote_only"
    assert sum(counts.values()) == 0
