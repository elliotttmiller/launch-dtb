#!/usr/bin/env python3
"""Commercial-offer equivalence primitives for competitor pricing research.

These helpers are deliberately conservative. They do not decide which retailer
price is correct and they do not mutate market-price state. They only classify
whether stored competitor evidence exposes an obvious structural offer mismatch
for the same already-verified manufacturer identity.
"""
from __future__ import annotations

import html as html_lib
import re
from dataclasses import dataclass

from competitor_pricing_core import extract_variation_signature, variation_contradictions

_PACK_OF_RE = re.compile(
    r"\b(?:pack|package|pkg)\s*(?:of|x)?\s*(\d+)\b|"
    r"\b(\d+)\s*[- ]?(?:pack|pk|count|ct|piece|pc|pcs)\b",
    re.I,
)
_PAIR_RE = re.compile(r"\bpair\b", re.I)
_SINGLE_RE = re.compile(r"\b(?:each|ea\.?|single|individual(?:ly)?)\b", re.I)
_KIT_RE = re.compile(r"\bkit\b", re.I)
_SET_RE = re.compile(r"\bset\b", re.I)
_ASSEMBLY_RE = re.compile(r"\b(?:assembly|assy)\b", re.I)
_COMPONENT_ONLY_RE = re.compile(r"\b(?:component|part)\s+only\b|\bonly\s+(?:component|part)\b", re.I)


@dataclass(frozen=True)
class OfferSignature:
    explicit_quantity: int | None
    quantity_basis: str
    commercial_scope: str
    scope_basis: str
    evidence_text: str


@dataclass(frozen=True)
class OfferEquivalenceDecision:
    classification: str
    evidence_strength: str
    contradictions: tuple[str, ...]


def _compact_text(*values: str) -> str:
    """Normalize multiple evidence strings into one whitespace-compacted string."""
    parts = [
        " ".join(html_lib.unescape(str(value or "")).split())
        for value in values
        if value
    ]
    return " ".join(part for part in parts if part).strip()


def extract_offer_signature(title: str, description: str = "", category: str = "") -> OfferSignature:
    """Extract conservative quantity/scope evidence from stored storefront text."""
    text = _compact_text(title, description, category)
    quantity: int | None = None
    quantity_basis = ""

    pack = _PACK_OF_RE.search(text)
    if pack:
        try:
            quantity = int(pack.group(1) or pack.group(2))
            quantity_basis = "explicit_pack_count"
        except (TypeError, ValueError):
            quantity = None
            quantity_basis = ""
    elif _PAIR_RE.search(text):
        quantity = 2
        quantity_basis = "pair"
    elif _SINGLE_RE.search(text):
        quantity = 1
        quantity_basis = "single_or_each"

    if _KIT_RE.search(text):
        scope, scope_basis = "bundle", "kit"
    elif _SET_RE.search(text):
        scope, scope_basis = "bundle", "set"
    elif _PAIR_RE.search(text):
        scope, scope_basis = "bundle", "pair"
    elif quantity is not None and quantity > 1:
        scope, scope_basis = "bundle", quantity_basis
    elif _COMPONENT_ONLY_RE.search(text):
        scope, scope_basis = "component_only", "component_only"
    elif _SINGLE_RE.search(text):
        scope, scope_basis = "single", "single_or_each"
    elif _ASSEMBLY_RE.search(text):
        # "Assembly" alone is descriptive and is not automatically incompatible
        # with another retailer omitting the word. Preserve it as evidence only.
        scope, scope_basis = "assembly", "assembly"
    else:
        scope, scope_basis = "", ""

    return OfferSignature(
        explicit_quantity=quantity,
        quantity_basis=quantity_basis,
        commercial_scope=scope,
        scope_basis=scope_basis,
        evidence_text=text,
    )


def classify_offer_equivalence(
    left_title: str,
    right_title: str,
    *,
    left_description: str = "",
    right_description: str = "",
    left_category: str = "",
    right_category: str = "",
) -> OfferEquivalenceDecision:
    """Classify stored evidence for two observations of one verified identity.

    The classification is intentionally fail-closed around one-sided bundle or
    quantity evidence. Absence of a mismatch does not authorize price synthesis;
    it only establishes that stored evidence does not expose a structural offer
    difference.
    """
    left_text = _compact_text(left_title, left_description, left_category)
    right_text = _compact_text(right_title, right_description, right_category)
    variation = variation_contradictions(
        extract_variation_signature(left_text),
        extract_variation_signature(right_text),
    )
    if variation:
        return OfferEquivalenceDecision(
            "VARIANT_MISMATCH",
            "explicit_structured_contradiction",
            tuple(variation),
        )

    left = extract_offer_signature(left_title, left_description, left_category)
    right = extract_offer_signature(right_title, right_description, right_category)
    contradictions: list[str] = []

    if (
        left.explicit_quantity is not None
        and right.explicit_quantity is not None
        and left.explicit_quantity != right.explicit_quantity
    ):
        contradictions.append(
            f"quantity_mismatch:{left.explicit_quantity}!={right.explicit_quantity}"
        )
        return OfferEquivalenceDecision(
            "PACK_QUANTITY_MISMATCH",
            "explicit_quantity_contradiction",
            tuple(contradictions),
        )

    strong_scope_mismatch = {
        left.commercial_scope,
        right.commercial_scope,
    } in ({"bundle", "single"}, {"bundle", "component_only"})
    if strong_scope_mismatch:
        contradictions.append(
            f"commercial_scope_mismatch:{left.commercial_scope}!={right.commercial_scope}"
        )
        return OfferEquivalenceDecision(
            "OFFER_SCOPE_MISMATCH",
            "explicit_scope_contradiction",
            tuple(contradictions),
        )

    one_sided_quantity = (left.explicit_quantity is None) != (right.explicit_quantity is None)
    one_sided_material_scope = (
        bool(left.commercial_scope in {"bundle", "single", "component_only"})
        != bool(right.commercial_scope in {"bundle", "single", "component_only"})
    )
    if one_sided_quantity or one_sided_material_scope:
        details: list[str] = []
        if one_sided_quantity:
            details.append(
                f"one_sided_quantity:{left.explicit_quantity}|{right.explicit_quantity}"
            )
        if one_sided_material_scope:
            details.append(
                f"one_sided_scope:{left.commercial_scope or 'none'}|{right.commercial_scope or 'none'}"
            )
        return OfferEquivalenceDecision(
            "OFFER_EQUIVALENCE_UNRESOLVED",
            "one_sided_offer_evidence",
            tuple(details),
        )

    if left.explicit_quantity is not None and right.explicit_quantity == left.explicit_quantity:
        strength = "matching_explicit_quantity"
    elif (
        left.commercial_scope
        and right.commercial_scope
        and left.commercial_scope == right.commercial_scope
    ):
        strength = "matching_explicit_scope"
    else:
        strength = "verified_identity_no_structural_mismatch_detected"

    return OfferEquivalenceDecision(
        "OFFER_EQUIVALENT_PRICE_DISAGREEMENT",
        strength,
        (),
    )
