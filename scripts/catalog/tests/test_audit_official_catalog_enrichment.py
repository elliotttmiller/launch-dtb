from __future__ import annotations

import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from audit_official_catalog_enrichment import audit_rows
from official_catalog_schema import EXPECTED_COLUMNS


def make_row(**overrides: str) -> dict[str, str]:
    row = {column: "" for column in EXPECTED_COLUMNS}
    row.update(
        {
            "Type": "simple",
            "SKU": "SKU-1",
            "Name": "Test Product",
            "Published": "1",
            "Categories": "Tools",
            "Brands": "Test Brand",
            "Meta: schema_brand": "Test Brand",
            "Meta: _dtb_brand": "Test Brand",
            "Meta: _dtb_brand_label": "Test Brand",
            "Meta: schema_condition": "NewCondition",
            "Meta: _dtb_category_key": "tools",
            "Meta: _dtb_display_category_key": "tools",
            "Meta: _dtb_specs_json": '[{"label":"Width","value":"10 in"}]',
        }
    )
    row.update(overrides)
    return row


def test_audit_reports_b2c_content_coverage_without_scoring() -> None:
    report = audit_rows([make_row()])

    assert report["rows"] == 1
    assert report["coverage"]["name"]["percent"] == 100.0
    assert report["coverage"]["images"]["percent"] == 0.0
    assert "score" not in report


def test_audit_reports_structured_spec_shape_problems() -> None:
    report = audit_rows(
        [
            make_row(
                **{
                    "Meta: _dtb_specs_json": (
                        '[{"label":"Width","value":"10 in"},'
                        '{"label":"Width","value":"12 in"},'
                        '{"label":"","value":"bad"}]'
                    )
                }
            )
        ]
    )

    assert report["findings"]["duplicate_spec_labels"]["count"] == 1
    assert report["findings"]["malformed_spec_entries"]["count"] == 1


def test_audit_reports_unresolved_compatibility_references() -> None:
    part = make_row(
        **{
            "SKU": "PART-1",
            "Meta: _dtb_is_parts": "1",
            "Meta: _dtb_compatible_tool_skus": "TOOL-1,MISSING-TOOL",
        }
    )
    tool = make_row(**{"SKU": "TOOL-1"})

    report = audit_rows([part, tool])

    assert report["parts"] == 1
    assert report["relationships"]["compatible_tool_reference_count"] == 2
    assert report["findings"]["unresolved_compatible_tool_references"]["count"] == 1
    assert report["findings"]["unresolved_compatible_tool_references"]["sample_skus"] == ["PART-1"]
