from __future__ import annotations

import sys
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import catalog_seo_pre_generation as pre  # noqa: E402


def row(**overrides):
    values = {
        "Type": "simple",
        "SKU": "FA232",
        "GTIN, UPC, EAN, or ISBN": "",
        "Name": "6-32 Hex Nut",
        "Published": "1",
        "Visibility in catalog": "visible",
        "Short description": "Columbia replacement 6-32 hex nut.",
        "Description": "A Columbia replacement 6-32 hex nut for compatible finishing equipment.",
        "Categories": "Parts",
        "Tags": "",
        "Brands": "Columbia Tools",
        "Meta: schema_brand": "Columbia Tools",
        "Meta: schema_mpn": "FA232",
        "Meta: _dtb_manufacturer_sku": "FA232",
        "Meta: _dtb_mpn": "FA232",
        "Meta: schema_condition": "NewCondition",
        "Meta: _dtb_brand_key": "columbia-tools",
        "Meta: _dtb_brand_label": "Columbia Tools",
        "Meta: _dtb_product_kind": "part",
        "Meta: _dtb_category_key": "parts",
        "Meta: _dtb_display_category_key": "parts",
        "Meta: _dtb_is_parts": "1",
        "Meta: _dtb_parent_product_sku": "",
        "Meta: _dtb_variation_axis": "",
        "Meta: _dtb_variation_value": "",
        "Meta: _dtb_default_variation_sku": "",
        "Meta: _dtb_compatible_tool_skus": "",
        "Meta: _dtb_replacement_part_for": "",
        "Meta: _dtb_brand": "Columbia Tools",
        "Meta: _dtb_specs_json": "[]",
        "Meta: _dtb_schematic_id": "",
        "Meta: _dtb_seo_title": "Columbia FA232 6-32 Hex Nut | Drywall Toolbox",
        "Meta: _dtb_seo_description": "Columbia FA232 replacement 6-32 hex nut for compatible drywall finishing equipment.",
        "Meta: _dtb_seo_focus_kw": "Columbia FA232 hex nut",
        "Meta: _dtb_seo_canonical": "/product/columbia-tools-6-32-hex-nut-fa232/",
        "Meta: _dtb_seo_noindex": "0",
        "Slug": "columbia-tools-6-32-hex-nut-fa232",
        "meta:product_family": "",
        "meta:series": "",
        "meta:model": "",
    }
    for slot in range(20):
        values[f"Meta: _includes_{slot}_name"] = ""
        values[f"Meta: _includes_{slot}_sku"] = ""
    values.update(overrides)
    return values


class ClassificationTests(unittest.TestCase):
    def test_hardware_is_classified_conservatively(self):
        self.assertEqual("commodity_hardware", pre.classify_product(row()))

    def test_includes_force_kit_classification(self):
        self.assertEqual("kit_set", pre.classify_product(row(**{"Meta: _includes_0_name": "Taper"})))


class CanonicalTests(unittest.TestCase):
    def test_singular_product_override_conflicts_with_storefront_route(self):
        result = pre.canonical_recommendation(row())
        self.assertEqual("review_conflicting_override", result["action"])
        self.assertEqual("/products/columbia-tools-6-32-hex-nut-fa232", result["expected"])

    def test_exact_override_is_redundant(self):
        result = pre.canonical_recommendation(row(**{"Meta: _dtb_seo_canonical": "/products/columbia-tools-6-32-hex-nut-fa232"}))
        self.assertEqual("clear_redundant_override", result["action"])

    def test_only_canonical_conflict_is_blocking(self):
        _, findings = pre.build_packet(row())
        canonical = next(f for f in findings if f.code == "canonical_conflict")
        self.assertEqual("blocking", pre.finding_workflow(canonical))


class EvidenceTests(unittest.TestCase):
    def test_marketing_claim_is_accuracy_review_not_blocking(self):
        packet, findings = pre.build_packet(row(Description="Precision-machined for peak performance and maximum durability."))
        by_code = {finding.code: finding for finding in findings}
        self.assertEqual("accuracy_review", pre.finding_workflow(by_code["claim_needs_evidence:precision_manufacturing"]))
        self.assertEqual("Precision-machined for peak performance and maximum durability.", packet["source_copy"]["description"])

    def test_identity_digest_changes_when_protected_identifier_changes(self):
        self.assertNotEqual(pre.protected_identity_digest(row()), pre.protected_identity_digest(row(SKU="FA233")))

    def test_evidence_grade_does_not_double_count_mpn_aliases(self):
        grade = pre.evidence_coverage_grade(row(), [], [])
        self.assertEqual("B", grade)


class GenerationScopeTests(unittest.TestCase):
    def test_variations_are_not_independent_generation_targets(self):
        variation = row(Type="variation", Parent="PARENT", **{"Meta: _dtb_parent_product_sku": "PARENT"})
        self.assertFalse(pre.generation_eligible(variation))

    def test_noindex_product_is_not_generation_target(self):
        self.assertFalse(pre.generation_eligible(row(**{"Meta: _dtb_seo_noindex": "1"})))


class SimilarityTests(unittest.TestCase):
    def test_jaccard_detects_near_duplicate_meta_copy(self):
        left = pre.content_tokens("Columbia automatic taper replacement cable for compatible professional finishing tools")
        right = pre.content_tokens("Columbia automatic taper replacement cable for compatible finishing tools")
        self.assertGreaterEqual(pre.jaccard(left, right), 0.88)


if __name__ == "__main__":
    unittest.main()
