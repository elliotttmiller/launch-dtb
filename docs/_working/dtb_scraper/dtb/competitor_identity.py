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
_EXPLICIT_ID_RE = re.compile(
    r"\b(?:sku|mpn|manufacturer\s+part\s+(?:number|no\.?|#)|mfr\s+part\s+(?:number|no\.?|#))"
    r"\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9._/+\-]*)",
    re.I,
)
_LEADING_CODE_RE = re.compile(
    r"^\s*([A-Za-z]{1,8}[A-Za-z0-9._/+\-]*\d[A-Za-z0-9._/+\-]*|"
    r"[A-Za-z]{1,8}\d*[A-Za-z][A-Za-z0-9._/+\-]*)\b"
)
_DASH_TRANSLATION = str.maketrans({
    "–": "-", "—": "-", "−": "-", "‐": "-", "‑": "-",
    "⁄": "/", "／": "/", "＋": "+", "．": ".",
})


def canonical_identifier(value: str) -> str:
    """Return a separator-preserving canonical manufacturer identifier."""
    raw = unicodedata.normalize("NFKC", str(value or "")).strip().casefold()
    raw = raw.translate(_DASH_TRANSLATION)
    raw = re.sub(r"\s+", "", raw)
    return _ALLOWED.sub("", raw).strip("._/+-")


def identity_key(brand_key: str, identifier: str) -> str:
    ident = canonical_identifier(identifier)
    return f"{brand_key}::{ident}" if brand_key and ident else ""


def explicit_identifiers_from_title(title: str) -> set[str]:
    """Extract explicit/leading identifier evidence without destructive compaction."""
    identifiers = {
        canonical_identifier(match.group(1))
        for match in _EXPLICIT_ID_RE.finditer(title or "")
    }
    leading = _LEADING_CODE_RE.search(title or "")
    if leading:
        candidate = canonical_identifier(leading.group(1))
        if any(character.isdigit() for character in candidate):
            identifiers.add(candidate)
    return {value for value in identifiers if value}


def identifier_title_contradictions(identifier: str, title: str) -> list[str]:
    expected = canonical_identifier(identifier)
    title_identifiers = explicit_identifiers_from_title(title)
    if expected and title_identifiers and expected not in title_identifiers:
        return [f"title_identifier_conflict:{sorted(title_identifiers)}!={expected}"]
    return []


def legacy_compact_identifier(value: str) -> str:
    """Legacy destructive form, retained only for collision diagnostics."""
    return re.sub(r"[^a-z0-9]+", "", str(value or "").casefold())


def normalization_collisions(
    rows: Iterable[Mapping[str, str]],
    *,
    brand_field: str,
    identifier_field: str,
) -> dict[tuple[str, str], set[str]]:
    """Return destructive-normalization collisions without treating them as identity."""
    grouped: dict[tuple[str, str], set[str]] = defaultdict(set)
    for row in rows:
        brand = str(row.get(brand_field, "") or "").strip()
        raw = str(row.get(identifier_field, "") or "").strip()
        canonical = canonical_identifier(raw)
        legacy = legacy_compact_identifier(raw)
        if brand and canonical and legacy:
            grouped[(brand, legacy)].add(canonical)
    return {key: values for key, values in grouped.items() if len(values) > 1}
