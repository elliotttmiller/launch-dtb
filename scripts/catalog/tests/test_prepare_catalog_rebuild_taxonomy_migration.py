import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "prepare_catalog_rebuild_taxonomy_migration.py"
SPEC = importlib.util.spec_from_file_location("taxonomy_migration", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(MODULE)


def test_direct_combined_label_mapping_and_parent_inheritance():
    rows = [
        {"Type": "variable", "SKU": "P", "Name": "Family", "Parent": "", "Categories": "Drywall Finishing Tools > Automatic Taping Tools > Angle Heads"},
        {"Type": "variation", "SKU": "V", "Name": "Child", "Parent": "P", "Categories": "Drywall Finishing Tools > Automatic Taping Tools > Angle Heads"},
    ]
    result = MODULE.build_manifest(rows)
    assert result[0]["proposed_categories"].endswith("Angle Heads & Corner Finishers")
    assert result[0]["disposition"] == "deterministic_mapping"
    assert result[1]["proposed_categories"] == result[0]["proposed_categories"]
    assert result[1]["disposition"] == "inherited_from_parent"


def test_cases_fail_to_review_instead_of_forced_mapping():
    rows = [{"Type": "simple", "SKU": "CASE", "Name": "Case", "Parent": "", "Categories": "Drywall Finishing Tools > Automatic Taping Tools > Tool Cases"}]
    result = MODULE.build_manifest(rows)
    assert result[0]["proposed_categories"] == ""
    assert result[0]["requires_review"] == "1"
    assert result[0]["disposition"] == "outside_target_review"


def test_parts_remain_outside_tool_shopping_tree():
    rows = [{"Type": "simple", "SKU": "PART", "Name": "Part", "Parent": "", "Categories": "Drywall Finishing Tools > Parts"}]
    result = MODULE.build_manifest(rows)
    assert result[0]["proposed_categories"] == "Replacement Parts"
    assert result[0]["disposition"] == "preserved_separate_domain"
