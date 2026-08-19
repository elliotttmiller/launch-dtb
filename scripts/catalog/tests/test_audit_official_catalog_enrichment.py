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


def remediation_findings(report: dict[str, object]) -> set[str]:
    return {item["finding"] for item in report["remediation"]["items"]}


def test_audit_reports_b2c_content_coverage_without_scoring() -> None:
    report = audit_rows([make_row()])
    assert report["rows"] == 1
    assert report["coverage"]["name"]["percent"] == 100.0
    assert report["coverage"]["images"]["percent"] == 0.0
    assert "score" not in report


def test_audit_reports_structured_spec_shape_problems() -> None:
    report = audit_rows([
        make_row(**{"Meta: _dtb_specs_json": '[{"label":"Width","value":"10 in"},{"label":"Width","value":"12 in"},{"label":"","value":"bad"}]'})
    ])
    assert report["findings"]["duplicate_spec_labels"]["count"] == 1
    assert report["findings"]["malformed_spec_entries"]["count"] == 1


def test_audit_reports_unresolved_compatibility_references() -> None:
    part = make_row(SKU="PART-1", **{"Meta: _dtb_is_parts": "1", "Meta: _dtb_compatible_tool_skus": "TOOL-1,MISSING-TOOL"})
    tool = make_row(SKU="TOOL-1")
    report = audit_rows([part, tool])
    assert report["parts"] == 1
    assert report["relationships"]["compatible_tool_reference_count"] == 2
    assert report["findings"]["unresolved_compatible_tool_references"]["count"] == 1
    assert report["findings"]["unresolved_compatible_tool_references"]["sample_skus"] == ["PART-1"]


def test_variation_inheritance_is_not_a_classification_remediation_defect() -> None:
    variation = make_row(Type="variation", Categories="", **{"Meta: _dtb_display_category_key": ""})
    findings = remediation_findings(audit_rows([variation]))
    assert "missing_category" not in findings
    assert "missing_display_category_key" not in findings
    assert "taxonomy_mapping_inconsistent" not in findings


def test_variable_parent_missing_mpn_is_not_research_work() -> None:
    parent = make_row(Type="variable", **{"Meta: schema_mpn": "", "Meta: _dtb_manufacturer_sku": "", "Meta: _dtb_mpn": ""})
    findings = remediation_findings(audit_rows([parent]))
    assert "missing_mpn" not in findings


def test_missing_gtin_is_coverage_only_not_default_remediation() -> None:
    row = make_row(**{"GTIN, UPC, EAN, or ISBN": ""})
    report = audit_rows([row])
    assert report["coverage"]["gtin"]["percent"] == 0.0
    assert "missing_gtin" not in remediation_findings(report)


def test_compatibility_research_is_family_level_not_variation_level() -> None:
    parent = make_row(
        Type="variable",
        SKU="PART-FAMILY",
        **{
            "Meta: _dtb_is_parts": "1",
            "Meta: _dtb_product_kind": "part",
            "Meta: _dtb_category_key": "parts",
            "Meta: _dtb_display_category_key": "parts",
        },
    )
    variation = make_row(Type="variation", SKU="PART-CHILD", **{"Meta: _dtb_is_parts": "1", "Meta: _dtb_product_kind": "part"})
    report = audit_rows([parent, variation])
    compatibility_items = [item for item in report["remediation"]["items"] if item["workflow"] == "compatibility_research"]
    assert [item["sku"] for item in compatibility_items] == ["PART-FAMILY"]
    assert report["relationships"]["primary_part_research_rows"] == 1


def test_toolset_policy_is_universal_and_brand_independent() -> None:
    rows = [
        make_row(
            SKU="SET-A",
            Brands="Brand A",
            **{
                "Meta: _dtb_product_kind": "toolset",
                "Meta: _dtb_category_key": "taping",
                "Meta: _dtb_display_category_key": "toolsets",
            },
        ),
        make_row(
            SKU="SET-B",
            Brands="Brand B",
            **{
                "Meta: _dtb_product_kind": "toolset",
                "Meta: _dtb_category_key": "taping",
                "Meta: _dtb_display_category_key": "toolsets",
            },
        ),
    ]
    report = audit_rows(rows)
    assert "taxonomy_mapping_inconsistent" not in remediation_findings(report)


def test_legacy_toolset_broad_key_and_missing_display_are_both_actionable() -> None:
    rows = [
        make_row(
            SKU="SET-LEGACY",
            **{
                "Meta: _dtb_product_kind": "toolset",
                "Meta: _dtb_category_key": "toolsets",
                "Meta: _dtb_display_category_key": "toolsets",
            },
        ),
        make_row(
            SKU="SET-MISSING-DISPLAY",
            **{
                "Meta: _dtb_product_kind": "toolset",
                "Meta: _dtb_category_key": "taping",
                "Meta: _dtb_display_category_key": "",
            },
        ),
    ]
    report = audit_rows(rows)
    items = [item for item in report["remediation"]["items"] if item["finding"] == "taxonomy_mapping_inconsistent"]
    assert [item["sku"] for item in items] == ["SET-LEGACY", "SET-MISSING-DISPLAY"]
    assert all(item["workflow"] == "classification_review" for item in items)


def test_part_policy_is_universal_and_brand_independent() -> None:
    rows = [
        make_row(
            SKU="PART-A",
            Brands="Brand A",
            **{
                "Meta: _dtb_is_parts": "1",
                "Meta: _dtb_product_kind": "part",
                "Meta: _dtb_category_key": "parts",
                "Meta: _dtb_display_category_key": "parts",
            },
        ),
        make_row(
            SKU="PART-B",
            Brands="Brand B",
            **{
                "Meta: _dtb_is_parts": "1",
                "Meta: _dtb_product_kind": "part",
                "Meta: _dtb_category_key": "parts",
                "Meta: _dtb_display_category_key": "parts",
            },
        ),
    ]
    report = audit_rows(rows)
    assert "taxonomy_mapping_inconsistent" not in remediation_findings(report)


def test_missing_identity_media_and_relationships_are_actionable_for_simple_part() -> None:
    part = make_row(
        SKU="PART-1",
        Images="",
        Categories="Parts",
        **{
            "Meta: _dtb_is_parts": "1",
            "Meta: _dtb_product_kind": "part",
            "Meta: _dtb_category_key": "parts",
            "Meta: _dtb_display_category_key": "parts",
            "Meta: schema_mpn": "",
            "Meta: _dtb_manufacturer_sku": "",
            "Meta: _dtb_mpn": "",
        },
    )
    report = audit_rows([part])
    by_finding = {item["finding"]: item for item in report["remediation"]["items"]}
    assert by_finding["missing_mpn"]["sku"] == "PART-1"
    assert by_finding["missing_image"]["workflow"] == "media_research"
    assert by_finding["part_family_without_compatibility_or_replacement"]["workflow"] == "compatibility_research"
    assert report["segmented_coverage"]["type"]["simple"]["rows"] == 1
