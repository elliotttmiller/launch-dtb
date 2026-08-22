#!/usr/bin/env python3
"""Universal DTB catalog navigation/taxonomy policy.

WooCommerce product_cat paths (`Categories` in the official import CSV) are the
primary storefront navigation authority. DTB category/display metadata are
compatibility facets derived from that navigation identity. Brand and product
family are orthogonal and must never create navigation branches.
"""

from __future__ import annotations

from dataclasses import dataclass
import re

CATEGORY_FIELD = "Meta: _dtb_category_key"
DISPLAY_FIELD = "Meta: _dtb_display_category_key"
KIND_FIELD = "Meta: _dtb_product_kind"
PARENT_FIELD = "Meta: _dtb_parent_product_sku"


def normalize_key(value: object) -> str:
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", str(value or "").strip().lower())).strip("_")


def split_category_paths(raw: object) -> list[list[str]]:
    text = str(raw or "").strip()
    if not text:
        return []
    paths: list[list[str]] = []
    for candidate in text.split(","):
        parts = [part.strip() for part in candidate.split(">") if part.strip()]
        if parts:
            paths.append(parts)
    return paths


@dataclass(frozen=True)
class NavigationTaxon:
    root: str
    group: str
    leaf: str
    category_key: str
    display_key: str

    @property
    def path(self) -> str:
        return " > ".join(part for part in (self.root, self.group, self.leaf) if part)


@dataclass(frozen=True)
class TaxonomyExpectation:
    category_key: str
    display_category_key: str
    reason: str


DRYWALL_ROOT = "Drywall Finishing Tools"
STILT_ROOT = "Stilts & Accessories"
AUTOMATIC = "Automatic Taping Tools"
SEMI_AUTOMATIC = "Semi-Automatic Tools"


def _t(root: str, group: str, leaf: str, category: str, display: str) -> NavigationTaxon:
    return NavigationTaxon(root, group, leaf, category, display)


NAVIGATION_TAXA: tuple[NavigationTaxon, ...] = (
    _t(DRYWALL_ROOT, AUTOMATIC, "Automatic Tapers", "taping", "automatic_tapers"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Angle Heads", "corner", "corner_tools"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Angle Boxes", "corner", "corner_tools"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Box Fillers", "mudboxes", "pumps"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Compound Applicators", "corner", "corner_tools"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Compound Tubes", "corner", "compound_tubes"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Corner Flushers", "corner", "corner_tools"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Corner Rollers", "corner", "corner_tools"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Corner Tool Handles", "handles", "handles"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Extendable Handles", "handles", "handles"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Flat Boxes", "finishing", "finishing_boxes"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Goosenecks", "mudboxes", "pumps"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Flat Box Handles", "handles", "handles"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Nail Spotters", "taping", "nail_spotters"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Loading Pumps", "mudboxes", "pumps"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Tool Cases", "accessories", "accessories"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Automatic Taping Tool Sets", "taping", "toolsets"),
    _t(DRYWALL_ROOT, AUTOMATIC, "Taping Tool Accessories", "accessories", "accessories"),
    _t(DRYWALL_ROOT, SEMI_AUTOMATIC, "Compound Applicators", "corner", "corner_tools"),
    _t(DRYWALL_ROOT, SEMI_AUTOMATIC, "Compound Tubes", "corner", "compound_tubes"),
    _t(DRYWALL_ROOT, SEMI_AUTOMATIC, "Corner Flushers", "corner", "corner_tools"),
    _t(DRYWALL_ROOT, SEMI_AUTOMATIC, "Semi-Automatic Taping Tool Sets", "taping", "toolsets"),
    _t(DRYWALL_ROOT, SEMI_AUTOMATIC, "Semi-Automatic Tapers", "taping", "semi_automatic_tapers"),
    _t(DRYWALL_ROOT, SEMI_AUTOMATIC, "Semi-Automatic Taping Tool Accessories", "accessories", "accessories"),
    _t(DRYWALL_ROOT, "Parts", "", "parts", "parts"),
    _t(STILT_ROOT, "Stilts", "", "stilts", "stilts"),
    _t(STILT_ROOT, "Accessories", "", "accessories", "accessories"),
    _t(STILT_ROOT, "Parts", "", "parts", "parts"),
    _t(STILT_ROOT, "Accessories", "Extension Tubes & Clamps", "accessories", "accessories"),
    _t(STILT_ROOT, "Accessories", "Legs & Brackets", "accessories", "accessories"),
    _t(STILT_ROOT, "Accessories", "Hardware", "accessories", "accessories"),
    _t(STILT_ROOT, "Accessories", "Springs & Bearings", "accessories", "accessories"),
    _t(STILT_ROOT, "Accessories", "Straps & Buckles", "accessories", "accessories"),
    _t(STILT_ROOT, "Accessories", "Soles & Floor Plates", "accessories", "accessories"),
)

BY_PATH = {normalize_key(t.path): t for t in NAVIGATION_TAXA}
BY_LEAF: dict[str, tuple[NavigationTaxon, ...]] = {}
for _taxon in NAVIGATION_TAXA:
    _leaf_key = normalize_key(_taxon.leaf or _taxon.group)
    BY_LEAF[_leaf_key] = (*BY_LEAF.get(_leaf_key, ()), _taxon)

PATH_ALIASES = {
    normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Corner Boxes"): normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Angle Boxes"),
    normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Fixed Handles"): normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Corner Tool Handles"),
    normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Automatic Taping Tool Cases"): normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Tool Cases"),
    normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Tool Sets"): normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Automatic Taping Tool Sets"),
    normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Accessories & Adapters"): normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Taping Tool Accessories"),
}
GROUP_ALIASES = {"semi_automatic_taping_tools": normalize_key(SEMI_AUTOMATIC)}
LEAF_ALIASES = {
    "finishing_boxes": "flat_boxes",
    "flat_finishing_boxes": "flat_boxes",
    "box_handles": "flat_box_handles",
    "taping_tool_sets": "automatic_taping_tool_sets",
    "tool_sets": "automatic_taping_tool_sets",
    "tool_sets_kits": "automatic_taping_tool_sets",
    "corner_finishers": "angle_heads",
    "corner_tools": "angle_heads",
    "drywall_pumps": "loading_pumps",
    "pumps": "loading_pumps",
    "compound_pumps": "loading_pumps",
    "mud_pumps": "loading_pumps",
    "drywall_stilts": "stilts",
}
FAMILY_ONLY_KEYS = {"predator", "predator_family"}

PRODUCT_KIND_DEFAULTS = {
    "part": _t(DRYWALL_ROOT, "Parts", "", "parts", "parts"),
    "toolset": BY_PATH[normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Automatic Taping Tool Sets")],
    "kit": BY_PATH[normalize_key(f"{DRYWALL_ROOT} > {AUTOMATIC} > Automatic Taping Tool Sets")],
    "stilt": _t(STILT_ROOT, "Stilts", "", "stilts", "stilts"),
}

# Metadata-only mapping retained for the legacy audit/normalizer API. Generic
# merchandising values intentionally remain ambiguous here even though an
# explicit navigation path may resolve them in canonical_values().
DISPLAY_TO_CATEGORY_KEY = {
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
AMBIGUOUS_DISPLAY_KEYS = {"predator_family", "toolsets", "accessories"}


def taxon_for_path(raw_path: object) -> NavigationTaxon | None:
    candidates: list[NavigationTaxon] = []
    for parts in split_category_paths(raw_path):
        normalized_parts = [normalize_key(part) for part in parts]
        if any(part in FAMILY_ONLY_KEYS for part in normalized_parts):
            continue
        normalized_path_parts = [GROUP_ALIASES.get(part, part) for part in normalized_parts]
        path_key = normalize_key(" > ".join(normalized_path_parts))
        direct = BY_PATH.get(PATH_ALIASES.get(path_key, path_key))
        if direct:
            candidates.append(direct)
            continue
        leaf_key = LEAF_ALIASES.get(normalize_key(parts[-1]), normalize_key(parts[-1]))
        leaf_candidates = BY_LEAF.get(leaf_key, ())
        group_keys = {normalize_key(part) for part in parts[:-1]}
        grouped = [taxon for taxon in leaf_candidates if normalize_key(taxon.group) in group_keys]
        if len(grouped) == 1:
            candidates.append(grouped[0])
        elif len(leaf_candidates) == 1:
            candidates.append(leaf_candidates[0])
    unique = {item.path: item for item in candidates}
    return next(iter(unique.values())) if len(unique) == 1 else None


def navigation_for_row(row: dict[str, str], parent: dict[str, str] | None = None) -> NavigationTaxon | None:
    if normalize_key(row.get("Type")) == "variation":
        return navigation_for_row(parent, None) if parent else None

    kind = normalize_key(row.get(KIND_FIELD))
    if kind == "part":
        for parts in split_category_paths(row.get("Categories")):
            if parts and normalize_key(parts[0]) == normalize_key(STILT_ROOT):
                return _t(STILT_ROOT, "Parts", "", "parts", "parts")
        return PRODUCT_KIND_DEFAULTS["part"]
    if kind == "stilt":
        return PRODUCT_KIND_DEFAULTS["stilt"]
    explicit = taxon_for_path(row.get("Categories"))
    if explicit:
        return explicit
    if kind in {"toolset", "kit"}:
        return PRODUCT_KIND_DEFAULTS[kind]
    return None


def canonical_values(row: dict[str, str], parent: dict[str, str] | None = None) -> dict[str, str] | None:
    taxon = navigation_for_row(row, parent)
    if not taxon:
        return None
    return {"Categories": taxon.path, CATEGORY_FIELD: taxon.category_key, DISPLAY_FIELD: taxon.display_key}


def expected_taxonomy(product_kind: str, display_category_key: str) -> TaxonomyExpectation | None:
    kind = normalize_key(product_kind)
    if kind in PRODUCT_KIND_DEFAULTS:
        taxon = PRODUCT_KIND_DEFAULTS[kind]
        return TaxonomyExpectation(taxon.category_key, taxon.display_key, "product_kind")
    display = normalize_key(display_category_key)
    if display in AMBIGUOUS_DISPLAY_KEYS:
        return None
    category = DISPLAY_TO_CATEGORY_KEY.get(display)
    return TaxonomyExpectation(category, display, "display_category") if category else None


def taxonomy_state(*, product_kind: str, category_key: str, display_category_key: str) -> dict[str, object]:
    raw_category = str(category_key or "").strip()
    raw_display = str(display_category_key or "").strip()
    category = normalize_key(raw_category)
    display = normalize_key(raw_display)
    base = {
        "raw_category_key": raw_category,
        "raw_display_category_key": raw_display,
        "category_key": category,
        "display_category_key": display,
    }
    if display in AMBIGUOUS_DISPLAY_KEYS and normalize_key(product_kind) not in PRODUCT_KIND_DEFAULTS:
        return {**base, "disposition": "ambiguous_review", "consistent": True, "expected_category_key": None, "expected_display_category_key": None, "reason": "cross-cutting merchandising/family value cannot determine taxonomy"}
    expected = expected_taxonomy(product_kind, display)
    if not expected:
        return {**base, "disposition": "unknown", "consistent": True, "expected_category_key": None, "expected_display_category_key": None, "reason": "no deterministic metadata-only expectation"}
    if category != expected.category_key:
        disposition = "deterministic_mismatch"
    elif display != expected.display_category_key:
        disposition = "display_mismatch"
    else:
        disposition = "consistent"
    return {
        **base,
        "disposition": disposition,
        "consistent": disposition == "consistent",
        "expected_category_key": expected.category_key,
        "expected_display_category_key": expected.display_category_key,
        "reason": expected.reason,
    }
