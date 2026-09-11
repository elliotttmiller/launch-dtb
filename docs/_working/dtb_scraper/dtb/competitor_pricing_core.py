#!/usr/bin/env python3
"""Shared identity, matching, and observed-market-price primitives.

This module is deterministic and side-effect free. Product identity is always
manufacturer scoped:

    identity_key = canonical_brand + "::" + canonical_identifier

Market price is never averaged or median-derived. It is established only when
multiple independently verified competitor sites expose the same price for the
same verified manufacturer product. Conflicting prices remain explicit review
evidence and do not synthesize a market price.
"""
from __future__ import annotations

import html as html_lib
import re
import warnings
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from typing import Iterable, Mapping, Sequence

from bs4 import BeautifulSoup, MarkupResemblesLocatorWarning
from rapidfuzz import fuzz


SITE_KEYS = ("all_wall", "als_taping_tools", "wall_tools")
SITE_LABELS = {
    "all_wall": "All-Wall",
    "als_taping_tools": "Al's Taping Tools",
    "wall_tools": "Wall Tools",
}

CANONICAL_BRAND_LABELS = {
    "columbia": "Columbia Tools",
    "tapetech": "TapeTech",
    "level5": "LEVEL5",
    "surpro": "SurPro",
    "dura-stilts": "Dura-Stilts",
    "platinum": "Platinum Drywall Tools",
    "usg-sheetrock": "USG Sheetrock Tools",
}

BRAND_ALIASES = {
    "columbia": "columbia",
    "columbia tools": "columbia",
    "columbia taping tools": "columbia",
    "columbia drywall tools": "columbia",
    "columbia one": "columbia",
    "columbia parts": "columbia",
    "tapetech": "tapetech",
    "tape tech": "tapetech",
    "tapetech parts": "tapetech",
    "tape tech parts": "tapetech",
    "level5": "level5",
    "level 5": "level5",
    "level-5": "level5",
    "level5 parts": "level5",
    "level 5 parts": "level5",
    "surpro": "surpro",
    "sur pro": "surpro",
    "sur-pro": "surpro",
    "surpro parts": "surpro",
    "dura stilts": "dura-stilts",
    "dura-stilts": "dura-stilts",
    "dura stilt": "dura-stilts",
    "dura-stilt": "dura-stilts",
    "platinum": "platinum",
    "platinum drywall tools": "platinum",
    "platinum parts": "platinum",
    "usg": "usg-sheetrock",
    "usg sheetrock": "usg-sheetrock",
    "usg-sheetrock": "usg-sheetrock",
    "usg sheetrock tools": "usg-sheetrock",
    "sheetrock tools": "usg-sheetrock",
}

BRAND_TITLE_PATTERNS = [
    (re.compile(r"\bcolumbia(?:\s+(?:tools|taping|drywall\s+tools|one|parts))?\b", re.I), "columbia"),
    (re.compile(r"\btape\s*tech\b|\btapetech\b", re.I), "tapetech"),
    (re.compile(r"\blevel\s*-?\s*5\b|\blevel5\b", re.I), "level5"),
    (re.compile(r"\bsur\s*-?\s*pro\b|\bsurpro\b|\bsur\s*-?\s*stilt\b|\bquadlock\b", re.I), "surpro"),
    (re.compile(r"\bdura\s*-?\s*stilts?\b", re.I), "dura-stilts"),
    (re.compile(r"\bplatinum(?:\s+drywall\s+tools)?\b", re.I), "platinum"),
    (re.compile(r"\busg\s+sheetrock\b|\bsheetrock\s+tools\b", re.I), "usg-sheetrock"),
]

BRAND_WORDS = {
    "columbia", "tools", "tool", "taping", "tapetech", "tape", "tech", "level",
    "level5", "surpro", "sur", "pro", "dura", "stilts", "stilt", "platinum",
    "drywall", "usg", "sheetrock", "parts", "part",
}
STOPWORDS = {
    "and", "or", "the", "for", "with", "w", "a", "an", "in", "inch", "inches",
    "replacement", "new", "genuine",
}
GENERIC_HARDWARE_WORDS = {
    "washer", "screw", "nut", "bolt", "pin", "spring", "bearing", "bushing",
    "gasket", "seal", "clip", "ring", "flat", "lock", "hex", "socket",
}
PRODUCT_FAMILY_TERMS = (
    "automatic taper", "taper", "flat box", "finishing box", "corner finisher",
    "angle head", "corner roller", "nail spotter", "mud runner", "mudrunner",
    "compound tube", "loading pump", "pump", "handle", "blade", "axle", "wheel",
    "shoe", "washer", "screw", "bolt", "nut", "spring", "bearing", "bushing",
    "gasket", "seal", "clip", "bracket", "plate", "housing", "cable", "stilt",
    "knife", "trowel", "sander", "sprayer", "compressor", "hose", "controller",
)

GENERIC_DESCRIPTION_FINGERPRINTS = (
    "walltools a leading supplier of professional tools for drywall hanging and drywall finishing",
    "major brands including automatic taping tools by columbia taping tools",
    "al's taping tools is the leading supplier of drywall tools worldwide",
    "get the job done with our drywall taping tools and drywall finishing tools",
)

NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")
EXPLICIT_ID_RE = re.compile(
    r"\b(?:sku|mpn|manufacturer\s+part\s+(?:number|no\.?|#)|mfr\s+part\s+(?:number|no\.?|#))"
    r"\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9._/+\-]*)",
    re.I,
)
LEADING_CODE_RE = re.compile(r"^\s*([A-Za-z]{1,8}[A-Za-z0-9._/+\-]*\d[A-Za-z0-9._/+\-]*|[A-Za-z]{1,8}\d*[A-Za-z][A-Za-z0-9._/+\-]*)\b")
DECIMAL_INCH_RE = re.compile(r"(?<![A-Za-z0-9/])(\d+(?:\.\d+)?)\s*(?:\"|in\.?|inch(?:es)?)", re.I)
RANGE_RE = re.compile(r"(?<!\d)(\d+(?:\.\d+)?)\s*(?:\"|in\.?|inch(?:es)?)?\s*[-–—]\s*(\d+(?:\.\d+)?)\s*(?:\"|in\.?|inch(?:es)?)", re.I)
PACK_RE = re.compile(r"\b(?:pack\s+of\s+|)(\d+)\s*(?:[- ]?pack|pk)\b|\b(\d+)\s+count\b", re.I)
MODEL_TOKEN_RE = re.compile(r"\b(?=[A-Za-z0-9._/+\-]{3,}\b)(?=[A-Za-z0-9._/+\-]*[A-Za-z])(?=[A-Za-z0-9._/+\-]*\d)[A-Za-z0-9][A-Za-z0-9._/+\-]*\b")


@dataclass(frozen=True)
class VariationSignature:
    measurements: frozenset[str] = frozenset()
    ranges: frozenset[str] = frozenset()
    handedness: str = ""
    pack_count: int | None = None
    length_class: str = ""
    generation: str = ""
    families: frozenset[str] = frozenset()
    model_tokens: frozenset[str] = frozenset()


@dataclass(frozen=True)
class MatchDecision:
    method: str
    status: str
    score: int
    wratio: int
    token_set: int
    simple: int
    identity_key: str
    variation_compatible: bool
    contradictions: tuple[str, ...] = ()
    evidence_quality: str = ""


@dataclass
class SiteEvidence:
    source_key: str
    source_label: str
    observations: list[dict[str, str]] = field(default_factory=list)
    verified: bool = False
    price: Decimal | None = None
    duplicate_count: int = 0
    quality: str = ""
    product_name: str = ""
    identifier: str = ""
    identity_key: str = ""
    observed_prices: tuple[Decimal, ...] = ()


@dataclass(frozen=True)
class MarketPriceDecision:
    status: str
    verified_source_count: int
    distinct_price_count: int
    market_price: Decimal | None
    observed_prices: tuple[Decimal, ...]
    price_spread: Decimal | None


def normalize_words(value: str) -> str:
    value = html_lib.unescape(value or "").replace("&", " and ").casefold()
    value = NON_ALNUM_RE.sub(" ", value)
    return " ".join(value.split())


def words(value: str) -> list[str]:
    return normalize_words(value).split()


def compact_identifier(value: str) -> str:
    return NON_ALNUM_RE.sub("", (value or "").casefold())


def canonical_brand(value: str, title: str = "") -> str:
    key = normalize_words(value)
    if key.endswith(" parts"):
        key = key[:-6].strip()
    if key in BRAND_ALIASES:
        return BRAND_ALIASES[key]
    for pattern, brand in BRAND_TITLE_PATTERNS:
        if pattern.search(value or ""):
            return brand
    for pattern, brand in BRAND_TITLE_PATTERNS:
        if pattern.search(title or ""):
            return brand
    return ""


def canonical_brand_label(brand_key: str) -> str:
    return CANONICAL_BRAND_LABELS.get(brand_key, "")


def identity_key(brand_key: str, identifier: str) -> str:
    ident = compact_identifier(identifier)
    return f"{brand_key}::{ident}" if brand_key and ident else ""


def canonical_text(value: str, *, remove_brand: bool = False) -> str:
    cleaned: list[str] = []
    for token in words(value):
        if remove_brand and token in BRAND_WORDS:
            continue
        if token in STOPWORDS:
            continue
        cleaned.append(token)
    return " ".join(cleaned)


def token_key(value: str) -> set[str]:
    return {token for token in canonical_text(value, remove_brand=True).split() if len(token) >= 2}


def decimal_price(value: str | Decimal | None) -> Decimal | None:
    if isinstance(value, Decimal):
        return value
    raw = str(value or "").strip().replace("$", "").replace(",", "")
    if not raw:
        return None
    try:
        parsed = Decimal(raw)
    except InvalidOperation:
        return None
    if not parsed.is_finite() or parsed < 0:
        return None
    return parsed


def money(value: Decimal | None) -> str:
    return "" if value is None else f"{value:.2f}"


def percent(value: Decimal | None) -> str:
    return "" if value is None else f"{value:.2f}"


def effective_dtb_price(row: Mapping[str, str]) -> tuple[Decimal | None, str, tuple[str, ...]]:
    regular = decimal_price(row.get("Regular price", ""))
    sale = decimal_price(row.get("Sale price", ""))
    warnings_out: list[str] = []
    if sale is not None and sale > 0:
        if regular is not None and regular > 0 and sale > regular:
            warnings_out.append("sale_price_above_regular_price")
        return sale, "sale_price", tuple(warnings_out)
    if regular is not None:
        return regular, "regular_price", tuple(warnings_out)
    return None, "missing_price", tuple(warnings_out)


def is_pricing_target(row: Mapping[str, str]) -> bool:
    """Return whether a canonical DTB row may participate in SKU-level pricing.

    WooCommerce variable parents are family containers and are always excluded.
    Simple products and purchasable variation rows remain eligible.
    """
    product_type = str(row.get("Type", "") or "").strip().casefold()
    return product_type in {"simple", "variation"}


def clean_description(value: str) -> tuple[str, str]:
    """Return (cleaned_text, quality); quarantine known storefront boilerplate."""
    if not value:
        return "", "missing"
    raw = str(value)
    if "<" in raw and ">" in raw:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", MarkupResemblesLocatorWarning)
            raw = BeautifulSoup(raw, "html.parser").get_text(" ", strip=True)
    text = " ".join(html_lib.unescape(raw).split())
    normalized = text.casefold()
    if any(fingerprint in normalized for fingerprint in GENERIC_DESCRIPTION_FINGERPRINTS):
        return "", "quarantined_storefront_boilerplate"
    if len(text) < 8:
        return text, "low_information"
    return text, "product_specific"


def _fraction_value(whole: str | None, numerator: str | None, denominator: str | None) -> str | None:
    try:
        w = Decimal(whole or "0")
        if numerator and denominator:
            d = Decimal(denominator)
            if d == 0:
                return None
            value = w + (Decimal(numerator) / d)
        elif whole:
            value = w
        elif numerator:
            value = Decimal(numerator)
        else:
            return None
        return f"{value.normalize()}"
    except (InvalidOperation, ZeroDivisionError):
        return None


def extract_variation_signature(value: str) -> VariationSignature:
    text = html_lib.unescape(value or "")
    lower = text.casefold()
    measurements: set[str] = set()
    ranges: set[str] = set()

    for match in RANGE_RE.finditer(text):
        try:
            a = Decimal(match.group(1)).normalize()
            b = Decimal(match.group(2)).normalize()
            ranges.add(f"{a}-{b}")
        except InvalidOperation:
            pass

    mixed_re = re.compile(r"(?<!\d)(?:(\d+)\s*[- ]\s*)?(\d+)\s*/\s*(\d+)\s*(?:\"|in\.?|inch(?:es)?)", re.I)
    for match in mixed_re.finditer(text):
        normalized = _fraction_value(match.group(1), match.group(2), match.group(3))
        if normalized:
            measurements.add(normalized)
    for match in DECIMAL_INCH_RE.finditer(text):
        try:
            measurements.add(f"{Decimal(match.group(1)).normalize()}")
        except InvalidOperation:
            pass

    handedness = "left" if re.search(r"\bleft(?:[- ]hand(?:ed)?)?\b", lower) else "right" if re.search(r"\bright(?:[- ]hand(?:ed)?)?\b", lower) else ""
    pack_count = None
    pack_match = PACK_RE.search(text)
    if pack_match:
        try:
            pack_count = int(pack_match.group(1) or pack_match.group(2))
        except (TypeError, ValueError):
            pack_count = None

    length_class = ""
    for token in ("short", "standard", "long", "xl", "mini"):
        if re.search(rf"\b{re.escape(token)}\b", lower):
            length_class = token
            break

    generation = ""
    generation_match = re.search(r"\b(?:gen(?:eration)?\s*)?(iii|ii|iv|v|vi|[2-9])\b", lower)
    if generation_match and ("gen" in lower or "generation" in lower or "stilt" in lower):
        generation = generation_match.group(1)

    families = {term for term in PRODUCT_FAMILY_TERMS if re.search(rf"\b{re.escape(term)}\b", lower)}
    if "automatic taper" in families:
        families.discard("taper")

    model_tokens = {
        token.casefold()
        for token in MODEL_TOKEN_RE.findall(text)
        if compact_identifier(token) not in {compact_identifier(m) for m in measurements}
    }
    return VariationSignature(
        measurements=frozenset(measurements),
        ranges=frozenset(ranges),
        handedness=handedness,
        pack_count=pack_count,
        length_class=length_class,
        generation=generation,
        families=frozenset(families),
        model_tokens=frozenset(model_tokens),
    )


def variation_contradictions(a: VariationSignature, b: VariationSignature) -> list[str]:
    contradictions: list[str] = []
    if a.measurements and b.measurements and a.measurements.isdisjoint(b.measurements):
        contradictions.append(f"measurement_mismatch:{sorted(a.measurements)}!={sorted(b.measurements)}")
    if a.ranges and b.ranges and a.ranges.isdisjoint(b.ranges):
        contradictions.append(f"range_mismatch:{sorted(a.ranges)}!={sorted(b.ranges)}")
    if a.handedness and b.handedness and a.handedness != b.handedness:
        contradictions.append(f"handedness_mismatch:{a.handedness}!={b.handedness}")
    if a.pack_count is not None and b.pack_count is not None and a.pack_count != b.pack_count:
        contradictions.append(f"pack_count_mismatch:{a.pack_count}!={b.pack_count}")
    if a.length_class and b.length_class and a.length_class != b.length_class:
        contradictions.append(f"length_class_mismatch:{a.length_class}!={b.length_class}")
    if a.generation and b.generation and a.generation != b.generation:
        contradictions.append(f"generation_mismatch:{a.generation}!={b.generation}")
    if a.families and b.families and a.families.isdisjoint(b.families):
        contradictions.append(f"product_family_mismatch:{sorted(a.families)}!={sorted(b.families)}")
    return contradictions


def explicit_identifiers_from_title(title: str) -> set[str]:
    ids = {compact_identifier(match.group(1)) for match in EXPLICIT_ID_RE.finditer(title or "")}
    leading = LEADING_CODE_RE.search(title or "")
    if leading:
        candidate = compact_identifier(leading.group(1))
        if any(ch.isdigit() for ch in candidate):
            ids.add(candidate)
    return {value for value in ids if value}


def identifier_title_contradictions(identifier: str, title: str) -> list[str]:
    expected = compact_identifier(identifier)
    title_ids = explicit_identifiers_from_title(title)
    if expected and title_ids and expected not in title_ids:
        return [f"title_identifier_conflict:{sorted(title_ids)}!={expected}"]
    return []


def title_scores(a: str, b: str) -> tuple[int, int, int, int]:
    left = canonical_text(a, remove_brand=True)
    right = canonical_text(b, remove_brand=True)
    wratio = int(fuzz.WRatio(left, right))
    token_set = int(fuzz.token_set_ratio(left, right))
    token_sort = int(fuzz.token_sort_ratio(left, right))
    simple = int(fuzz.ratio(left, right))
    return max(wratio, token_set, token_sort, simple), wratio, token_set, simple


def token_overlap(a: str, b: str) -> tuple[float, int, int]:
    left = token_key(a)
    right = token_key(b)
    if not left or not right:
        return 0.0, 0, 0
    shared = left & right
    distinctive = {token for token in shared if token not in GENERIC_HARDWARE_WORDS}
    return len(shared) / max(1, min(len(left), len(right))), len(distinctive), len(shared)


def classify_match(
    official_name: str,
    official_brand_key: str,
    official_identifiers: Sequence[str],
    competitor_name: str,
    competitor_brand_key: str,
    competitor_identifier: str,
) -> MatchDecision:
    score, wratio, token_set, simple = title_scores(official_name, competitor_name)
    official_id_keys = {compact_identifier(value) for value in official_identifiers if compact_identifier(value)}
    competitor_id_key = compact_identifier(competitor_identifier)
    id_match = bool(competitor_id_key and competitor_id_key in official_id_keys)
    key = identity_key(competitor_brand_key, competitor_identifier)

    official_sig = extract_variation_signature(official_name)
    competitor_sig = extract_variation_signature(competitor_name)
    contradictions = variation_contradictions(official_sig, competitor_sig)
    contradictions.extend(identifier_title_contradictions(competitor_identifier, competitor_name))

    compatible_brand = bool(official_brand_key and competitor_brand_key and official_brand_key == competitor_brand_key)
    unknown_brand = not competitor_brand_key
    if official_brand_key and competitor_brand_key and official_brand_key != competitor_brand_key:
        contradictions.append(f"brand_mismatch:{official_brand_key}!={competitor_brand_key}")

    if id_match:
        if unknown_brand:
            return MatchDecision("exact_identifier_unknown_brand", "review", 90, wratio, token_set, simple, "", not contradictions, tuple(contradictions + ["competitor_brand_unknown"]), "review_unknown_brand")
        if not compatible_brand:
            return MatchDecision("exact_identifier_brand_conflict", "review", 90, wratio, token_set, simple, key, not contradictions, tuple(contradictions), "review_brand_conflict")
        if contradictions:
            return MatchDecision("exact_identifier_contradiction", "review", 94, wratio, token_set, simple, key, False, tuple(contradictions), "review_contradiction")
        return MatchDecision("exact_identity_key", "auto_accept", 100, wratio, token_set, simple, key, True, (), "verified_exact_identity")

    if not compatible_brand:
        return MatchDecision("", "", score, wratio, token_set, simple, "", not contradictions, tuple(contradictions), "")
    if contradictions:
        return MatchDecision("", "", score, wratio, token_set, simple, "", False, tuple(contradictions), "")

    overlap, distinctive, shared = token_overlap(official_name, competitor_name)
    if score >= 97 and simple >= 94 and overlap >= 0.75:
        return MatchDecision("near_identical_title", "review", score, wratio, token_set, simple, "", True, (), "review_near_identical")
    if wratio >= 92 and simple >= 88 and overlap >= 0.65 and (distinctive >= 1 or shared >= 3):
        return MatchDecision("high_confidence_fuzzy_title", "review", score, wratio, token_set, simple, "", True, (), "review_fuzzy")
    if wratio >= 88 and simple >= 84 and overlap >= 0.75 and (distinctive >= 1 or shared >= 4):
        return MatchDecision("medium_confidence_fuzzy_title", "review", score, wratio, token_set, simple, "", True, (), "review_fuzzy")
    return MatchDecision("", "", score, wratio, token_set, simple, "", True, (), "")


def market_price_decision(values: Iterable[Decimal], *, has_conflict: bool = False) -> MarketPriceDecision:
    """Establish market price only from exact cross-retailer agreement.

    No mean, median, midpoint, majority price, or other synthesized price is ever
    produced. Any known retailer-level conflict blocks market-price establishment.
    """
    prices = tuple(value for value in values if value is not None)
    distinct = tuple(sorted(set(prices)))
    spread = max(prices) - min(prices) if len(prices) >= 2 else Decimal("0") if prices else None

    if has_conflict:
        return MarketPriceDecision("MARKET_PRICE_CONFLICT", len(prices), len(distinct), None, prices, spread)
    if not prices:
        return MarketPriceDecision("NO_MARKET_EVIDENCE", 0, 0, None, (), None)
    if len(prices) == 1:
        return MarketPriceDecision("MARKET_PRICE_SINGLE_SOURCE", 1, 1, None, prices, spread)
    if len(distinct) > 1:
        return MarketPriceDecision("MARKET_PRICE_CONFLICT", len(prices), len(distinct), None, prices, spread)
    if len(prices) == len(SITE_KEYS):
        return MarketPriceDecision("MARKET_PRICE_VERIFIED_3_OF_3", len(prices), 1, distinct[0], prices, spread)
    return MarketPriceDecision("MARKET_PRICE_VERIFIED_2_OF_3", len(prices), 1, distinct[0], prices, spread)


def resolve_site_evidence(source_key: str, observations: Sequence[dict[str, str]]) -> SiteEvidence:
    """Resolve one competitor site's evidence without averaging duplicate prices."""
    evidence = SiteEvidence(source_key=source_key, source_label=SITE_LABELS[source_key], observations=list(observations))
    if not observations:
        return evidence

    verified = [
        row for row in observations
        if row.get("Match Status") == "auto_accept" and row.get("Evidence Quality") == "verified_exact_identity"
    ]
    review = [row for row in observations if row.get("Match Status") == "review"]
    evidence.duplicate_count = max(0, len(observations) - 1)

    if not verified:
        evidence.quality = "review_only" if review else "unusable"
        best = max(observations, key=lambda r: int(r.get("Match Score") or 0))
        evidence.product_name = best.get("Competitor Product Name", "")
        evidence.identifier = best.get("Competitor SKU", "")
        evidence.identity_key = best.get("Identity Key", "")
        return evidence

    keys = {row.get("Identity Key", "") for row in verified if row.get("Identity Key", "")}
    if len(keys) != 1:
        evidence.quality = "conflicting_identity_duplicates"
        return evidence

    names = [row.get("Competitor Product Name", "") for row in verified if row.get("Competitor Product Name", "")]
    if len(names) > 1:
        anchor = names[0]
        if any(fuzz.WRatio(canonical_text(anchor, remove_brand=True), canonical_text(name, remove_brand=True)) < 90 for name in names[1:]):
            evidence.quality = "conflicting_title_duplicates"
            return evidence

    prices = tuple(
        price for price in (decimal_price(row.get("Competitor Price", "")) for row in verified)
        if price is not None
    )
    evidence.observed_prices = prices
    if not prices:
        evidence.quality = "verified_identity_missing_price"
        return evidence

    distinct_prices = set(prices)
    if len(distinct_prices) > 1:
        evidence.quality = "conflicting_price_duplicates"
        return evidence

    evidence.verified = True
    evidence.price = prices[0]
    evidence.quality = "verified_exact_identity" if len(verified) == 1 else "verified_duplicate_same_price"
    best = max(
        verified,
        key=lambda r: (
            int(r.get("Match Score") or 0),
            int(r.get("Simple Ratio") or 0),
            r.get("Competitor Product Name", ""),
        ),
    )
    evidence.product_name = best.get("Competitor Product Name", "")
    evidence.identifier = best.get("Competitor SKU", "")
    evidence.identity_key = best.get("Identity Key", "")
    return evidence


def market_status(site_evidence: Sequence[SiteEvidence], review_count: int, market_price_status: str) -> str:
    """Return a business-facing state aligned with the explicit market-price contract."""
    if market_price_status == "MARKET_PRICE_CONFLICT":
        return "Price Conflict - Review Required"

    suffix = " + Review Candidates" if review_count else ""
    if market_price_status == "MARKET_PRICE_VERIFIED_3_OF_3":
        return "Verified Market Price - 3/3" + suffix
    if market_price_status == "MARKET_PRICE_VERIFIED_2_OF_3":
        return "Verified Market Price - 2/3" + suffix
    if market_price_status == "MARKET_PRICE_SINGLE_SOURCE":
        return "Single-Source Evidence" + suffix
    if review_count:
        return "Identity Review Required"
    return "No Market Evidence"
