#!/usr/bin/env python3
"""Universal DTB catalog taxonomy policy.

This module defines brand-independent semantic mappings between the broad DTB
category key and the customer-facing display-category key. Brand identity is
never part of classification. Broad functional taxonomy, display grouping, and
product family are distinct concerns. The canonical catalog remains the data
source of truth; this module only defines deterministic validation/mutation
policy.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TaxonomyExpectation:
    category_key: str
    display_category_key: str
    reason: str


# Display categories that are functionally specific enough to determine one
# broad DTB category across manufacturers. Keep cross-cutting merchandising or
# family groupings out of this map.
DETERMINISTIC_DISPLAY_TO_CATEGORY_KEY: dict[str, str] = {
    "automatic_tapers": "taping",
    "semi_automatic_tapers": "taping",
    "nail_spotters": "taping",
    "finishing_boxes": "finishing",
    "smoothing_blades": "finishing",
    "handles": "handles",
    "pumps": "mudboxes",
    "corner_tools": "corner",
    "compound_tubes": "corner",
    "parts": "parts",
    "stilts": "stilts",
}

# These are valid display/family concepts but they span more than one functional
# broad category or can contain non-toolset accessories. They must never drive a
# broad-category mutation without a stronger semantic authority.
AMBIGUOUS_DISPLAY_KEYS = frozenset({
    "predator_family",
    "toolsets",
    "accessories",
})

# Product kinds with an unambiguous cross-brand taxonomy contract override any
# legacy broad/display values. Do not add brand or SKU entries here.
PRODUCT_KIND_POLICY: dict[str, tuple[str, str]] = {
    "part": ("parts", "parts"),
    "toolset": ("taping", "toolsets"),
}


def normalize_key(value: str | None) -> str:
    return (value or "").strip().lower().replace("-", "_").replace(" ", "_")


def expected_taxonomy(
    *,
    product_kind: str | None,
    display_category_key: str | None,
) -> TaxonomyExpectation | None:
    """Return a universal expectation only when taxonomy is deterministic."""

    kind = normalize_key(product_kind)
    if kind in PRODUCT_KIND_POLICY:
        broad, display = PRODUCT_KIND_POLICY[kind]
        return TaxonomyExpectation(broad, display, f"product_kind={kind}")

    display = normalize_key(display_category_key)
    broad = DETERMINISTIC_DISPLAY_TO_CATEGORY_KEY.get(display)
    if broad:
        return TaxonomyExpectation(broad, display, f"display_category_key={display}")

    return None


def taxonomy_state(
    *,
    product_kind: str | None,
    category_key: str | None,
    display_category_key: str | None,
) -> dict[str, str | bool | None]:
    """Return raw, normalized, expected, and review-disposition taxonomy state."""

    raw_category = (category_key or "").strip()
    raw_display = (display_category_key or "").strip()
    current_category = normalize_key(category_key)
    current_display = normalize_key(display_category_key)
    kind = normalize_key(product_kind)

    expected = expected_taxonomy(
        product_kind=product_kind,
        display_category_key=display_category_key,
    )

    if expected is not None:
        category_matches = current_category == expected.category_key
        display_matches = current_display == expected.display_category_key
        if category_matches and display_matches:
            disposition = "consistent"
        elif category_matches and not display_matches:
            disposition = "display_mismatch"
        else:
            disposition = "deterministic_mismatch"
        return {
            "known": True,
            "ambiguous": False,
            "consistent": disposition == "consistent",
            "disposition": disposition,
            "raw_category_key": raw_category,
            "raw_display_category_key": raw_display,
            "category_key": current_category,
            "display_category_key": current_display,
            "expected_category_key": expected.category_key,
            "expected_display_category_key": expected.display_category_key,
            "reason": expected.reason,
        }

    if current_display in AMBIGUOUS_DISPLAY_KEYS and kind not in PRODUCT_KIND_POLICY:
        return {
            "known": True,
            "ambiguous": True,
            "consistent": False,
            "disposition": "ambiguous_review",
            "raw_category_key": raw_category,
            "raw_display_category_key": raw_display,
            "category_key": current_category,
            "display_category_key": current_display,
            "expected_category_key": None,
            "expected_display_category_key": current_display,
            "reason": f"cross_cutting_display_category={current_display}",
        }

    return {
        "known": False,
        "ambiguous": False,
        "consistent": True,
        "disposition": "unknown",
        "raw_category_key": raw_category,
        "raw_display_category_key": raw_display,
        "category_key": current_category,
        "display_category_key": current_display,
        "expected_category_key": None,
        "expected_display_category_key": None,
        "reason": None,
    }
