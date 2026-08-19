from __future__ import annotations

import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from clear_legacy_seo_canonicals import FIELD, plan


def row(**overrides: str) -> dict[str, str]:
    values = {
        "Type": "simple",
        "SKU": "SKU-1",
        "Published": "1",
        "Slug": "example-product",
        "Meta: _dtb_seo_noindex": "0",
        FIELD: "/product/example-product",
    }
    values.update(overrides)
    return values


def test_conflicting_override_is_planned_for_clear() -> None:
    changes = plan([row()])
    assert len(changes) == 1
    assert changes[0]["classification"] == "conflicting"
    assert changes[0]["expected_runtime_path"] == "/products/example-product"


def test_redundant_override_is_also_planned_for_clear() -> None:
    changes = plan([row(**{FIELD: "/products/example-product"})])
    assert len(changes) == 1
    assert changes[0]["classification"] == "redundant"


def test_variation_and_noindex_rows_are_not_mutation_targets() -> None:
    changes = plan(
        [
            row(Type="variation"),
            row(SKU="SKU-2", **{"Meta: _dtb_seo_noindex": "1"}),
        ]
    )
    assert changes == []
