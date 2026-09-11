import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from competitor_offer import classify_offer_equivalence, extract_offer_signature


class CommercialOfferEquivalenceTests(unittest.TestCase):
    def test_pair_vs_single_is_quantity_mismatch(self):
        decision = classify_offer_equivalence(
            "Replacement Wheels - Pair",
            "Replacement Wheel - Each",
        )
        self.assertEqual(decision.classification, "PACK_QUANTITY_MISMATCH")
        self.assertTrue(any("quantity_mismatch" in value for value in decision.contradictions))

    def test_one_sided_pack_evidence_stays_unresolved(self):
        decision = classify_offer_equivalence(
            "Replacement Blades - 5 Pack",
            "Replacement Blades",
        )
        self.assertEqual(decision.classification, "OFFER_EQUIVALENCE_UNRESOLVED")
        self.assertEqual(decision.evidence_strength, "one_sided_offer_evidence")

    def test_structured_size_difference_is_variant_mismatch(self):
        decision = classify_offer_equivalence(
            'Columbia Flat Box Blade 7"',
            'Columbia Flat Box Blade 8"',
        )
        self.assertEqual(decision.classification, "VARIANT_MISMATCH")

    def test_same_verified_offer_without_structural_mismatch_is_price_disagreement(self):
        decision = classify_offer_equivalence(
            "TapeTech Swivel Axle 810028",
            "810028 - Swivel Axle",
        )
        self.assertEqual(decision.classification, "OFFER_EQUIVALENT_PRICE_DISAGREEMENT")
        self.assertEqual(decision.evidence_strength, "verified_identity_no_structural_mismatch_detected")

    def test_explicit_equal_pack_counts_strengthen_equivalence(self):
        left = extract_offer_signature("Replacement Clips 4-Pack")
        right = extract_offer_signature("Replacement Clips Pack of 4")
        self.assertEqual(left.explicit_quantity, 4)
        self.assertEqual(right.explicit_quantity, 4)
        decision = classify_offer_equivalence("Replacement Clips 4-Pack", "Replacement Clips Pack of 4")
        self.assertEqual(decision.classification, "OFFER_EQUIVALENT_PRICE_DISAGREEMENT")
        self.assertEqual(decision.evidence_strength, "matching_explicit_quantity")


if __name__ == "__main__":
    unittest.main()
