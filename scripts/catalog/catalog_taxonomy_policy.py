#!/usr/bin/env python3
"""Universal DTB catalog taxonomy policy.

This module defines brand-independent semantic mappings between the broad DTB
category key and the customer-facing display-category key. Brand identity is
never part of classification. The canonical catalog remains the data source of
truth; this module only defines deterministic normalization/validation policy.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TaxonomyExpectation:
    category_key: str
    display_category_key: str
    reason: str


# Customer-facing display categories map to one broad DTB category regardless
# of manufacturer. These broad keys mirror DTB_CategoryNormalizer::CATEGORY_MAP.
DISPLAY_TO_CATEGORY_KEY: dict[str, str] = {
    "automatic_tapers": "taping",
    "semi_automatic_tapers": "taping",
    "predator_family": "taping",
    "nail_spotters": "taping",
    "toolsets": "taping",
    "finishing_boxes": "finishing",
    "smoothing_blades": "finishing",
    "accessories": "finishing",
    "handles": "handles",
    "pumps": "mudboxes",
    "corner_tools": "corner",
    "compound_tubes": "corner",
    "parts": "parts",
    "stilts": "stilts",
}

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
    category_key: str | None,
    display_category_key: str | None,
) -> TaxonomyExpectation | None:
    """Return the universal taxonomy expectation when policy is deterministic.

    Product-kind policy takes precedence because part/toolset identity is more
    specific than a legacy display-category value. For all other products, a
    recognized display category determines its broad category while preserving
    the display category itself.
    """

    kind = normalize_key(product_kind)
    if kind in PRODUCT_KIND_POLICY:
        broad, display = PRODUCT_KIND_POLICY[kind]
        return TaxonomyExpectation(broad, display, f"product_kind={kind}")

    display = normalize_key(display_category_key)
    broad = DISPLAY_TO_CATEGORY_KEY.get(display)
    if broad:
        return TaxonomyExpectation(broad, display, f"display_category_key={display}")

    return None


def taxonomy_state(
    *,
    product_kind: str | None,
    category_key: str | None,
    display_category_key: str | None,
) -> dict[str, str | bool | None]:
    expected = expected_taxonomy(
        product_kind=product_kind,
        category_key=category_key,
        display_category_key=display_category_key,
    )
    current_category = normalize_key(category_key)
    current_display = normalize_key(display_category_key)
    if expected is None:
        return {
            "known": False,
            "consistent": True,
            "category_key": current_category,
            "display_category_key": current_display,
            "expected_category_key": None,
            "expected_display_category_key": None,
            "reason": None,
        }
    return {
        "known": True,
        "consistent": (
            current_category == expected.category_key
            and current_display == expected.display_category_key
        ),
        "category_key": current_category,
        "display_category_key": current_display,
        "expected_category_key": expected.category_key,
        "expected_display_category_key": expected.display_category_key,
        "reason": expected.reason,
    }
