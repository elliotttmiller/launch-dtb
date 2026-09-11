#!/usr/bin/env python3
"""Canonical manufacturer identity helpers for competitor pricing research.

This module is the authority for manufacturer identifiers used by both DTB-to-
competitor matching and competitor-to-competitor price comparison. Identity
normalization is deliberately conservative: punctuation that can be meaningful
inside an MPN/SKU is preserved rather than erased.
"""
from __future__ import annotations

import re
import unicodedata
from collections import defaultdict
from typing import Iterable, Mapping

_ALLOWED = re.compile(r"[^a-z0-9._/+\-]+")
_DASH_TRANSLATION = str.maketrans({
    "–": "-",
    "—": "-",
    "−": "-",
    "‐": "-",
    "‑": "-",
    "⁄": "/",
    "／": "/",
    "＋": "+",
    "．": ".",
})


def canonical_identifier(value: str) -> str:
    """Return a separator-preserving canonical manufacturer identifier.

    Safe normalization only: Unicode compatibility normalization, case folding,
    Unicode punctuation equivalence, whitespace removal, and removal of
    characters outside the supported identifier alphabet. Hyphen, slash, dot,
    plus, and underscore remain significant.
    """
    raw = unicodedata.normalize("NFKC", str(value or "")).strip().casefold()
    raw = raw.translate(_DASH_TRANSLATION)
    raw = re.sub(r"\s+", "", raw)
    return _ALLOWED.sub("", raw).strip("._/+-")


def identity_key(brand_key: str, identifier: str) -> str:
    ident = canonical_identifier(identifier)
    return f"{brand_key}::{ident}" if brand_key and ident else ""


def legacy_compact_identifier(value: str) -> str:
    """Legacy destructive form, retained only for collision diagnostics."""
    return re.sub(r"[^a-z0-9]+", "", str(value or "").casefold())


def normalization_collisions(rows: Iterable[Mapping[str, str]], *, brand_field: str, identifier_field: str) -> dict[tuple[str, str], set[str]]:
    """Return destructive-normalization collisions without treating them as identity.

    A collision exists when two or more distinct separator-preserving identifiers
    for the same brand would have collapsed to one legacy compact token.
    """
    grouped: dict[tuple[str, str], set[str]] = defaultdict(set)
    for row in rows:
        brand = str(row.get(brand_field, "") or "").strip()
        raw = str(row.get(identifier_field, "") or "").strip()
        canonical = canonical_identifier(raw)
        legacy = legacy_compact_identifier(raw)
        if brand and canonical and legacy:
            grouped[(brand, legacy)].add(canonical)
    return {key: values for key, values in grouped.items() if len(values) > 1}
