import sys
import unittest
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from competitor_identity import canonical_identifier, identity_key, normalization_collisions
from competitor_pricing_core import (
    canonical_brand,
    classify_match,
    clean_description,
    effective_dtb_price,
    is_pricing_target,
    market_price_decision,
    resolve_site_evidence,
)


class IdentityContractTests(unittest.TestCase):
    def test_identity_key_scopes_identifier_by_brand(self):
        self.assertNotEqual(identity_key("tapetech", "10116"), identity_key("columbia", "10116"))

    def test_identifier_preserves_meaningful_separators(self):
        self.assertEqual(canonical_identifier(" AH3–2 "), "ah3-2")
        self.assertEqual(canonical_identifier("XHTT / NSA"), "xhtt/NSA".casefold().replace(" ", ""))
        self.assertNotEqual(identity_key("columbia", "AH3-2"), identity_key("columbia", "AH32"))
        self.assertNotEqual(identity_key("columbia", "CT-104"), identity_key("columbia", "CT104"))

    def test_legacy_compaction_collisions_are_detected_not_merged(self):
        rows = [
            {"brand": "columbia", "sku": "AH3-2"},
            {"brand": "columbia", "sku": "AH32"},
        ]
        collisions = normalization_collisions(rows, brand_field="brand", identifier_field="sku")
        self.assertIn(("columbia", "ah32"), collisions)
        self.assertEqual(collisions[("columbia", "ah32")], {"ah3-2", "ah32"})

    def test_cross_brand_identifier_is_review_not_auto_accept(self):
        decision = classify_match("Columbia Box Shoe", "columbia", ["10116"], "TapeTech Box Shoe", "tapetech", "10116")
        self.assertEqual(decision.status, "review")
        self.assertEqual(decision.method, "exact_identifier_brand_conflict")

    def test_unknown_brand_identifier_is_review_not_auto_accept(self):
        decision = classify_match("TapeTech Box Shoe", "tapetech", ["10116"], "10116 Box Shoe", "", "10116")
        self.assertEqual(decision.status, "review")
        self.assertEqual(decision.method, "exact_identifier_unknown_brand")

    def test_title_identifier_conflict_downgrades_exact_identifier(self):
        decision = classify_match("1/4 - 20 Hex Nut", "columbia", ["CT109"], "CT114 Columbia Taper Cable Retaining Nut #5972", "columbia", "CT109")
        self.assertEqual(decision.status, "review")
        self.assertEqual(decision.method, "exact_identifier_contradiction")
        self.assertTrue(any("title_identifier_conflict" in value for value in decision.contradictions))

    def test_dimension_contradiction_blocks_fuzzy_candidate(self):
        decision = classify_match('1/4-20 x 1/2" Hex Bolt', "columbia", ["FA296"], '1/4-20 x 1-1/2" Hex Bolt', "columbia", "FA299")
        self.assertEqual(decision.method, "")
        self.assertFalse(decision.variation_compatible)

    def test_near_identical_is_review_only(self):
        decision = classify_match('Platinum 3.5" Angle Head Corner Finisher', "platinum", ["PT-CF3.5"], 'Platinum Drywall Tools 3.5" Angle Head Corner Finisher', "platinum", "OTHER")
        self.assertEqual(decision.status, "review")
        self.assertEqual(decision.method, "near_identical_title")


class PricingAndQualityTests(unittest.TestCase):
    def test_effective_price_prefers_sale(self):
        price, basis, warnings = effective_dtb_price({"Regular price": "200", "Sale price": "175"})
        self.assertEqual(price, Decimal("175")); self.assertEqual(basis, "sale_price"); self.assertEqual(warnings, ())

    def test_only_simple_and_variation_are_pricing_targets(self):
        self.assertFalse(is_pricing_target({"Type": "variable"})); self.assertTrue(is_pricing_target({"Type": "variation"})); self.assertTrue(is_pricing_target({"Type": "simple"})); self.assertFalse(is_pricing_target({"Type": ""}))

    def test_three_identical_site_prices_establish_market_price(self):
        decision = market_price_decision([Decimal("1649.29"), Decimal("1649.29"), Decimal("1649.29")])
        self.assertEqual(decision.status, "MARKET_PRICE_VERIFIED_3_OF_3"); self.assertEqual(decision.verified_source_count, 3); self.assertEqual(decision.distinct_price_count, 1); self.assertEqual(decision.market_price, Decimal("1649.29")); self.assertEqual(decision.price_spread, Decimal("0.00"))

    def test_two_identical_site_prices_establish_two_source_market_price(self):
        decision = market_price_decision([Decimal("1649.29"), Decimal("1649.29")]); self.assertEqual(decision.status, "MARKET_PRICE_VERIFIED_2_OF_3"); self.assertEqual(decision.market_price, Decimal("1649.29"))

    def test_single_site_price_is_not_promoted_to_market_price(self):
        decision = market_price_decision([Decimal("1649.29")]); self.assertEqual(decision.status, "MARKET_PRICE_SINGLE_SOURCE"); self.assertIsNone(decision.market_price)

    def test_different_verified_prices_are_conflict_not_synthesized_market_price(self):
        decision = market_price_decision([Decimal("1649.29"), Decimal("1649.29"), Decimal("1549.29")]); self.assertEqual(decision.status, "MARKET_PRICE_CONFLICT"); self.assertEqual(decision.distinct_price_count, 2); self.assertIsNone(decision.market_price); self.assertEqual(decision.price_spread, Decimal("100.00"))

    def test_retailer_level_conflict_blocks_two_source_market_price(self):
        decision = market_price_decision([Decimal("1649.29"), Decimal("1649.29")], has_conflict=True); self.assertEqual(decision.status, "MARKET_PRICE_CONFLICT"); self.assertIsNone(decision.market_price)

    def test_no_prices_has_no_market_evidence(self):
        decision = market_price_decision([]); self.assertEqual(decision.status, "NO_MARKET_EVIDENCE"); self.assertIsNone(decision.market_price)

    def test_boilerplate_description_is_quarantined(self):
        text, quality = clean_description("WallTools a leading supplier of professional tools for drywall hanging and drywall finishing, wallpaper, wallcovering, and ceiling grid."); self.assertEqual(text, ""); self.assertEqual(quality, "quarantined_storefront_boilerplate")

    def test_same_site_duplicate_same_price_is_verified_without_aggregation_math(self):
        rows = [
            {"Match Status": "auto_accept", "Evidence Quality": "verified_exact_identity", "Identity Key": "columbia::fa280", "Competitor Price": "1.00", "Competitor Product Name": "Columbia #10 Belleville Washer", "Competitor SKU": "FA280", "Match Score": "100", "Simple Ratio": "100"},
            {"Match Status": "auto_accept", "Evidence Quality": "verified_exact_identity", "Identity Key": "columbia::fa280", "Competitor Price": "1.00", "Competitor Product Name": "Columbia #10 Belleville Washer", "Competitor SKU": "FA280", "Match Score": "100", "Simple Ratio": "100"},
        ]
        evidence = resolve_site_evidence("all_wall", rows); self.assertTrue(evidence.verified); self.assertEqual(evidence.duplicate_count, 1); self.assertEqual(evidence.price, Decimal("1.00")); self.assertEqual(evidence.quality, "verified_duplicate_same_price")

    def test_same_site_duplicate_price_conflict_is_not_verified(self):
        rows = [
            {"Match Status": "auto_accept", "Evidence Quality": "verified_exact_identity", "Identity Key": "columbia::fa280", "Competitor Price": "1.00", "Competitor Product Name": "Columbia #10 Belleville Washer", "Competitor SKU": "FA280", "Match Score": "100", "Simple Ratio": "100"},
            {"Match Status": "auto_accept", "Evidence Quality": "verified_exact_identity", "Identity Key": "columbia::fa280", "Competitor Price": "1.20", "Competitor Product Name": "Columbia #10 Belleville Washer", "Competitor SKU": "FA280", "Match Score": "100", "Simple Ratio": "100"},
        ]
        evidence = resolve_site_evidence("all_wall", rows); self.assertFalse(evidence.verified); self.assertIsNone(evidence.price); self.assertEqual(evidence.quality, "conflicting_price_duplicates")

    def test_brand_aliases_are_canonical(self):
        self.assertEqual(canonical_brand("Columbia Parts", ""), "columbia"); self.assertEqual(canonical_brand("", "TapeTech EasyClean Automatic Taper"), "tapetech")


if __name__ == "__main__":
    unittest.main()
