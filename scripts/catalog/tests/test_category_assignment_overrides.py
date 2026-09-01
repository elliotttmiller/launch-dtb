from __future__ import annotations

import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from build_catalog_category_assignments import build, load_overrides, load_taxa

ROOT = Path(__file__).resolve().parents[3]
TAXONOMY = ROOT / "products/catalog/source/taxonomy.json"
OVERRIDES = ROOT / "products/catalog/source/product_category_overrides.csv"


def owner(sku: str, categories: str) -> dict[str, str]:
    return {
        "SKU": sku,
        "Type": "simple",
        "Categories": categories,
        "Brands": "Test",
    }


def selected_overrides(*skus: str) -> dict[str, dict[str, str]]:
    overrides = load_overrides(OVERRIDES, load_taxa(TAXONOMY))
    return {sku: overrides[sku] for sku in skus}


def test_manufacturer_reviewed_override_wins_over_historical_category_path():
    taxa = load_taxa(TAXONOMY)
    overrides = selected_overrides("TT-CORNER-APPLICATOR")
    rows = [
        owner(
            "TT-CORNER-APPLICATOR",
            "Taping & Finishing Tools > Semi-Automatic Taping Tools > Compound Applicators",
        )
    ]
    assignments = build(rows, taxa, overrides)
    assert assignments[0]["taxon_key"] == "automatic_angle_boxes_corner_applicators"
    assert "TapeTech manufacturer" in assignments[0]["evidence"]


def test_compound_tube_override_does_not_follow_legacy_applicator_assignment():
    taxa = load_taxa(TAXONOMY)
    overrides = selected_overrides("4-772")
    rows = [
        owner(
            "4-772",
            "Taping & Finishing Tools > Semi-Automatic Taping Tools > Compound Applicators",
        )
    ]
    assignments = build(rows, taxa, overrides)
    assert assignments[0]["taxon_key"] == "automatic_compound_tubes"


def test_unreviewed_product_still_uses_exact_path_migration():
    taxa = load_taxa(TAXONOMY)
    overrides = {}
    rows = [
        owner(
            "UNREVIEWED-SKU",
            "Taping & Finishing Tools > Automatic Taping Tools > Flat Boxes",
        )
    ]
    assignments = build(rows, taxa, overrides)
    assert assignments[0]["taxon_key"] == "flat_boxes"
    assert assignments[0]["evidence"].startswith("approved migration from exact path:")
