#!/usr/bin/env python3
"""Canonical manufacturer identity helpers for competitor pricing research.

This module is the authority for manufacturer identifiers used by both DTB-to-
competitor matching and competitor-to-competitor price comparison. Strict
normalization preserves punctuation that can be meaningful inside an MPN/SKU.
Only explicitly approved, brand-scoped aliases may collapse two strict forms to
one protected manufacturer identifier.
"""
from __future__ import annotations

import csv
import re
import unicodedata
from collections import defaultdict
from functools import lru_cache
from pathlib import Path
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
_ALIAS_REGISTRY = Path(__file__).resolve().with_name("competitor_identifier_aliases.csv")


def canonical_identifier(value: str) -> str:
    """Return a strict, separator-preserving manufacturer identifier."""
    raw = unicodedata.normalize("NFKC", str(value or "")).strip().casefold()
    raw = raw.translate(_DASH_TRANSLATION)
    raw = re.sub(r"\s+", "", raw)
    return _ALLOWED.sub("", raw).strip("._/+-")


@lru_cache(maxsize=1)
def approved_alias_map() -> dict[tuple[str, str], str]:
    """Load approved brand-scoped aliases from the auditable CSV registry.

    Unknown, pending, or rejected rows never affect identity. Ambiguous aliases
    fail closed rather than selecting an arbitrary canonical identifier.
    """
    aliases: dict[tuple[str, str], str] = {}
    if not _ALIAS_REGISTRY.exists():
        return aliases
    with _ALIAS_REGISTRY.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            if (row.get("status") or "").strip().casefold() != "approved":
                continue
            brand = (row.get("brand_key") or "").strip().casefold()
            canonical = canonical_identifier(row.get("canonical_identifier", ""))
            alias = canonical_identifier(row.get("alias_identifier", ""))
            if not brand or not canonical or not alias or canonical == alias:
                continue
            key = (brand, alias)
            existing = aliases.get(key)
            if existing and existing != canonical:
                raise ValueError(
                    f"ambiguous approved identifier alias for {brand}:{alias}: "
                    f"{existing} vs {canonical}"
                )
            aliases[key] = canonical
    return aliases


def resolved_identifier(brand_key: str, identifier: str) -> str:
    """Resolve strict identifier through approved brand-scoped aliases only."""
    strict = canonical_identifier(identifier)
    brand = (brand_key or "").strip().casefold()
    if not strict or not brand:
        return strict
    return approved_alias_map().get((brand, strict), strict)


def identity_key(brand_key: str, identifier: str) -> str:
    ident = resolved_identifier(brand_key, identifier)
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


def identifier_title_contradictions(identifier: str, title: str, brand_key: str = "") -> list[str]:
    expected = resolved_identifier(brand_key, identifier)
    title_identifiers = explicit_identifiers_from_title(title)
    resolved_title_ids = {
        resolved_identifier(brand_key, value)
        for value in title_identifiers
        if value
    }
    if expected and resolved_title_ids and expected not in resolved_title_ids:
        return [f"title_identifier_conflict:{sorted(resolved_title_ids)}!={expected}"]
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
