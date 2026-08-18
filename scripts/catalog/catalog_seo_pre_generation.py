#!/usr/bin/env python3
"""Prepare evidence-bounded SEO/content packets from the canonical DTB catalog.

This stage is intentionally non-generative and non-mutating. It validates the
canonical catalog, normalizes generation inputs, protects product identity,
classifies products, extracts authoritative facts, and emits QA findings for a
later editorial/generation pass.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.parse import urlsplit

from official_catalog_schema import CatalogValidationError, validate_catalog

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_GAPS = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.include-gaps.json"
DEFAULT_OUTPUT_DIR = ROOT / "products" / "dev" / "seo-pre-generation"

PROTECTED_FIELDS = (
    "SKU", "GTIN, UPC, EAN, or ISBN", "Brands", "Meta: schema_brand",
    "Meta: schema_mpn", "Meta: _dtb_manufacturer_sku", "Meta: _dtb_mpn",
    "Meta: _dtb_brand_key", "Meta: _dtb_brand_label", "Meta: _dtb_product_kind",
    "Meta: _dtb_category_key", "Meta: _dtb_display_category_key",
    "Meta: _dtb_parent_product_sku", "Meta: _dtb_variation_axis",
    "Meta: _dtb_variation_value", "Meta: _dtb_default_variation_sku",
    "Meta: _dtb_schematic_id", "Slug",
)
SEO_FIELDS = (
    "Meta: _dtb_seo_title", "Meta: _dtb_seo_description",
    "Meta: _dtb_seo_focus_kw", "Meta: _dtb_seo_canonical",
    "Meta: _dtb_seo_noindex",
)

EVIDENCE_REQUIRED_PATTERNS = {
    "precision_manufacturing": re.compile(r"\b(?:precision[- ]machined|precision[- ]engineered|precision[- ]made)\b", re.I),
    "industrial_grade": re.compile(r"\b(?:industrial[- ]grade|industrial durability|professional[- ]grade|premium[- ]grade)\b", re.I),
    "performance_superlative": re.compile(r"\b(?:peak performance|maximum durability|maximum performance|superior performance|optimal performance)\b", re.I),
    "guarantee": re.compile(r"\b(?:guaranteed to|guarantees? a|perfect(?:ly)? fit|exact fit)\b", re.I),
    "material_quality": re.compile(r"\b(?:high[- ]quality materials?|high[- ]strength|corrosion[- ]resistant|wear[- ]resistant)\b", re.I),
    "productivity_claim": re.compile(r"\b(?:reduce[sd]? downtime|minimi[sz]e[sd]? downtime|improve[sd]? productivity|boosts? productivity|work faster)\b", re.I),
}
FILLER_PATTERNS = {
    "downtime": re.compile(r"\bdowntime\b", re.I),
    "job_site": re.compile(r"\bjob[ -]?site\b", re.I),
    "professional_drywall": re.compile(r"\bprofessional drywall\b", re.I),
    "vital": re.compile(r"\bvital\b", re.I),
    "peak_performance": re.compile(r"\bpeak performance\b", re.I),
    "demanding_environment": re.compile(r"\bdemanding (?:environments?|conditions?|job[ -]?sites?)\b", re.I),
}

PATTERNS = {
    "kit_set": re.compile(r"\b(?:kit|set|bundle|combo)\b", re.I),
    "automatic_equipment": re.compile(r"\b(?:automatic taper|cordless|powerfill|pump|mudrunner|power assist)\b", re.I),
    "stilts": re.compile(r"\bstilts?\b", re.I),
    "primary_finishing_tool": re.compile(r"\b(?:flat box|finishing box|corner finisher|corner flusher|applicator|compound tube|angle head|taper)\b", re.I),
    "tool_accessory": re.compile(r"\b(?:handle|adapter|gooseneck|extension|filler|shoe|case|carrier|stand)\b", re.I),
    "replacement_assembly": re.compile(r"\b(?:assembly|housing|plate assembly|head assembly|wheel assembly|brake assembly)\b", re.I),
    "commodity_hardware": re.compile(r"\b(?:nut|screw|washer|o[- ]?ring|bolt|pin|clip|retainer|spacer|bushing|bearing|spring)\b", re.I),
    "replacement_component": re.compile(r"\b(?:blade|cable|wheel|seal|gasket|shaft|bracket|cover|cap|valve|gear|axle|hinge|roller)\b", re.I),
}
WORD_TARGETS = {
    "commodity_hardware": (25, 60), "replacement_component": (40, 90),
    "replacement_assembly": (60, 120), "tool_accessory": (60, 120),
    "primary_finishing_tool": (100, 180), "automatic_equipment": (130, 250),
    "stilts": (90, 180), "kit_set": (80, 180), "general_product": (60, 140),
}
SECTION_POLICY = {
    "commodity_hardware": ("overview", "key_details"),
    "replacement_component": ("overview", "key_details", "compatibility_if_verified"),
    "replacement_assembly": ("overview", "key_features_if_supported", "compatibility_if_verified"),
    "tool_accessory": ("overview", "application_if_useful", "compatibility_if_verified", "key_features_if_supported"),
    "primary_finishing_tool": ("overview", "key_features_if_supported", "compatibility_if_verified", "technical_highlights_if_supported"),
    "automatic_equipment": ("overview", "key_features_if_supported", "application_if_useful", "compatibility_if_verified", "whats_included_if_applicable"),
    "stilts": ("overview", "key_features_if_supported", "specifications"),
    "kit_set": ("overview", "key_features_if_supported", "whats_included", "compatibility_if_verified"),
    "general_product": ("overview", "key_features_if_supported", "compatibility_if_verified"),
}

TOKEN_RE = re.compile(r"[a-z0-9]+(?:[-'][a-z0-9]+)?", re.I)
TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")
STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "it",
    "of", "on", "or", "the", "this", "to", "with", "your", "tool", "tools", "drywall",
    "part", "parts", "replacement", "professional",
}


@dataclass(frozen=True)
class Finding:
    sku: str
    severity: str
    category: str
    code: str
    field: str
    message: str


def clean_cell(value: object) -> str:
    return SPACE_RE.sub(" ", str(value or "").replace("\u00a0", " ")).strip()


def plain_text(value: object) -> str:
    return clean_cell(TAG_RE.sub(" ", html.unescape(str(value or ""))))


def word_count(value: object) -> int:
    return len(TOKEN_RE.findall(plain_text(value)))


def normalized_key(value: object) -> str:
    return " ".join(TOKEN_RE.findall(plain_text(value).lower()))


def content_tokens(value: object) -> set[str]:
    return {t for t in TOKEN_RE.findall(plain_text(value).lower()) if t not in STOPWORDS and len(t) > 2}


def jaccard(left: set[str], right: set[str]) -> float:
    return len(left & right) / len(left | right) if left and right else 0.0


def truthy(value: object) -> bool:
    return clean_cell(value).lower() in {"1", "true", "yes", "y", "on"}


def split_values(value: object) -> list[str]:
    raw = clean_cell(value)
    return [p for p in (clean_cell(v) for v in re.split(r"\s*(?:\||;|,)\s*", raw)) if p] if raw else []


def parse_specs(row: dict[str, str]) -> list[dict[str, object]]:
    raw = clean_cell(row.get("Meta: _dtb_specs_json"))
    if not raw:
        return []
    parsed = json.loads(raw)
    return parsed if isinstance(parsed, list) else []


def extract_includes(row: dict[str, str]) -> list[dict[str, object]]:
    result = []
    for slot in range(20):
        name = clean_cell(row.get(f"Meta: _includes_{slot}_name"))
        sku = clean_cell(row.get(f"Meta: _includes_{slot}_sku"))
        if name or sku:
            result.append({"slot": slot, "name": name, "sku": sku})
    return result


def classify_product(row: dict[str, str]) -> str:
    name = clean_cell(row.get("Name"))
    kind = clean_cell(row.get("Meta: _dtb_product_kind")).lower()
    is_part = truthy(row.get("Meta: _dtb_is_parts")) or kind == "part"
    if extract_includes(row) or kind in {"toolset", "kit"}:
        return "kit_set"
    if kind == "stilt" or PATTERNS["stilts"].search(name):
        return "stilts"
    if is_part:
        for product_class in ("replacement_assembly", "commodity_hardware", "tool_accessory", "replacement_component"):
            if PATTERNS[product_class].search(name):
                return product_class
        return "replacement_component"
    searchable = " ".join(clean_cell(row.get(f)) for f in ("Name", "Categories", "Tags", "Meta: _dtb_product_kind", "Meta: _dtb_display_category_key"))
    for product_class in ("automatic_equipment", "primary_finishing_tool", "tool_accessory"):
        if PATTERNS[product_class].search(searchable):
            return product_class
    return "general_product"


def generation_eligible(row: dict[str, str]) -> bool:
    return (
        clean_cell(row.get("Type")) != "variation"
        and clean_cell(row.get("Published")).lower() in {"1", "true"}
        and not truthy(row.get("Meta: _dtb_seo_noindex"))
    )


def expected_canonical_path(row: dict[str, str]) -> str:
    slug = clean_cell(row.get("Slug"))
    return f"/products/{slug}" if slug else ""


def canonical_path(value: str) -> str:
    value = clean_cell(value)
    if not value:
        return ""
    parsed = urlsplit(value if "://" in value else f"https://placeholder.invalid{value if value.startswith('/') else '/' + value}")
    return parsed.path.rstrip("/") or "/"


def canonical_recommendation(row: dict[str, str]) -> dict[str, str]:
    current = clean_cell(row.get("Meta: _dtb_seo_canonical"))
    expected = expected_canonical_path(row)
    if not current:
        return {"action": "use_runtime_default", "current": "", "expected": expected}
    if canonical_path(current) == expected.rstrip("/"):
        return {"action": "clear_redundant_override", "current": current, "expected": expected}
    return {"action": "review_conflicting_override", "current": current, "expected": expected}


def protected_identity(row: dict[str, str]) -> dict[str, str]:
    return {field: clean_cell(row.get(field)) for field in PROTECTED_FIELDS}


def protected_identity_digest(row: dict[str, str]) -> str:
    payload = json.dumps(protected_identity(row), sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(payload.encode()).hexdigest()


def confidence_grade(row: dict[str, str], specs: list[dict[str, object]], compatibility: list[str]) -> str:
    if not all(clean_cell(row.get(f)) for f in ("SKU", "Name", "Brands")):
        return "R"
    dimensions = sum(bool(clean_cell(row.get(f))) for f in ("Meta: schema_mpn", "Meta: _dtb_manufacturer_sku", "GTIN, UPC, EAN, or ISBN"))
    dimensions += bool(specs) + bool(compatibility)
    return "A" if dimensions >= 3 else "B" if dimensions >= 1 else "C"


def authoritative_facts(row: dict[str, str], specs: list[dict[str, object]]) -> dict[str, object]:
    return {
        "product_type": clean_cell(row.get("Type")), "name": clean_cell(row.get("Name")),
        "brand": clean_cell(row.get("Brands")), "sku": clean_cell(row.get("SKU")),
        "mpn": clean_cell(row.get("Meta: _dtb_mpn")) or clean_cell(row.get("Meta: schema_mpn")),
        "manufacturer_sku": clean_cell(row.get("Meta: _dtb_manufacturer_sku")),
        "gtin": clean_cell(row.get("GTIN, UPC, EAN, or ISBN")),
        "product_kind": clean_cell(row.get("Meta: _dtb_product_kind")),
        "categories": split_values(row.get("Categories")), "brand_key": clean_cell(row.get("Meta: _dtb_brand_key")),
        "family": clean_cell(row.get("meta:product_family")), "series": clean_cell(row.get("meta:series")),
        "model": clean_cell(row.get("meta:model")),
        "replacement_part_for": split_values(row.get("Meta: _dtb_replacement_part_for")),
        "compatible_tool_skus": split_values(row.get("Meta: _dtb_compatible_tool_skus")),
        "specifications": specs, "includes": extract_includes(row),
        "variation_axis": clean_cell(row.get("Meta: _dtb_variation_axis")),
        "variation_value": clean_cell(row.get("Meta: _dtb_variation_value")),
        "parent_sku": clean_cell(row.get("Meta: _dtb_parent_product_sku")),
    }


def row_findings(row: dict[str, str], product_class: str, specs: list[dict[str, object]]) -> list[Finding]:
    sku = clean_cell(row.get("SKU"))
    findings: list[Finding] = []
    description = plain_text(row.get("Description"))
    short = plain_text(row.get("Short description"))
    seo_title = clean_cell(row.get("Meta: _dtb_seo_title"))
    seo_desc = clean_cell(row.get("Meta: _dtb_seo_description"))
    focus = clean_cell(row.get("Meta: _dtb_seo_focus_kw"))
    eligible = generation_eligible(row)

    if eligible:
        for field, value in (("Description", description), ("Short description", short)):
            if not value:
                findings.append(Finding(sku, "high", "content", "missing_content", field, f"{field} is empty for an indexable product."))
    low, high = WORD_TARGETS[product_class]
    count = word_count(description)
    if count > high:
        findings.append(Finding(sku, "medium", "content", "description_overwritten", "Description", f"{count} words exceeds {product_class} guidance of {high}; shorten only after product-specific review."))
    elif eligible and count and count < max(12, low // 2):
        findings.append(Finding(sku, "low", "content", "description_thin", "Description", f"{count} words is sparse for {product_class}; do not expand without evidence."))

    for label, pattern in FILLER_PATTERNS.items():
        if pattern.search(description):
            findings.append(Finding(sku, "low", "content", f"repetitive_language:{label}", "Description", f"Recurring catalog phrase '{label.replace('_', ' ')}' should receive editorial review."))
    combined = " ".join((description, short, seo_desc))
    for label, pattern in EVIDENCE_REQUIRED_PATTERNS.items():
        if pattern.search(combined):
            findings.append(Finding(sku, "medium", "content-accuracy", f"claim_needs_evidence:{label}", "Description/SEO", f"Claim class '{label}' requires authoritative evidence before reuse."))

    if eligible and not seo_title:
        findings.append(Finding(sku, "high", "metadata", "missing_seo_title", "Meta: _dtb_seo_title", "SEO title is missing."))
    if len(seo_title) > 60:
        findings.append(Finding(sku, "medium", "metadata", "seo_title_long", "Meta: _dtb_seo_title", f"SEO title is {len(seo_title)} characters; editorial review recommended."))
    if eligible and not seo_desc:
        findings.append(Finding(sku, "high", "metadata", "missing_seo_description", "Meta: _dtb_seo_description", "SEO description is missing."))
    if len(seo_desc) > 160:
        findings.append(Finding(sku, "medium", "metadata", "seo_description_long", "Meta: _dtb_seo_description", f"SEO description is {len(seo_desc)} characters and will be truncated by SEOHead."))
    if eligible and not focus:
        findings.append(Finding(sku, "low", "metadata", "missing_focus_keyword", "Meta: _dtb_seo_focus_kw", "Focus keyword is missing; it remains informational only."))

    canonical = canonical_recommendation(row)
    if eligible and canonical["action"] == "review_conflicting_override":
        findings.append(Finding(sku, "high", "canonicalization", "canonical_conflict", "Meta: _dtb_seo_canonical", f"Override path {canonical_path(canonical['current'])!r} conflicts with storefront authority {canonical['expected']!r}."))
    elif eligible and canonical["action"] == "clear_redundant_override":
        findings.append(Finding(sku, "low", "canonicalization", "canonical_redundant", "Meta: _dtb_seo_canonical", "Override duplicates the deterministic storefront route and can be cleared."))
    if not specs:
        findings.append(Finding(sku, "low", "evidence", "no_structured_specs", "Meta: _dtb_specs_json", "No structured specifications are available; generation must remain conservative."))
    return findings


def add_duplicate_findings(rows: list[dict[str, str]], findings: list[Finding]) -> None:
    targets = [row for row in rows if generation_eligible(row)]
    for field, code in (("Meta: _dtb_seo_title", "duplicate_seo_title"), ("Meta: _dtb_seo_description", "duplicate_seo_description")):
        groups: dict[str, list[str]] = defaultdict(list)
        for row in targets:
            key = normalized_key(row.get(field))
            if key:
                groups[key].append(clean_cell(row.get("SKU")))
        for skus in groups.values():
            if len(skus) > 1:
                for sku in skus:
                    findings.append(Finding(sku, "medium", "metadata", code, field, f"Normalized value is shared by {len(skus)} products: {', '.join(skus)}."))

    metas = [(clean_cell(row.get("SKU")), content_tokens(row.get("Meta: _dtb_seo_description"))) for row in targets]
    for index, (left_sku, left_tokens) in enumerate(metas):
        if len(left_tokens) < 8:
            continue
        for right_sku, right_tokens in metas[index + 1:]:
            if len(right_tokens) < 8:
                continue
            score = jaccard(left_tokens, right_tokens)
            if score >= 0.88:
                findings.append(Finding(left_sku, "low", "metadata", "near_duplicate_seo_description", "Meta: _dtb_seo_description", f"Very similar to {right_sku} (token Jaccard {score:.2f})."))
                findings.append(Finding(right_sku, "low", "metadata", "near_duplicate_seo_description", "Meta: _dtb_seo_description", f"Very similar to {left_sku} (token Jaccard {score:.2f})."))


def build_packet(row: dict[str, str]) -> tuple[dict[str, object], list[Finding]]:
    specs = parse_specs(row)
    product_class = classify_product(row)
    findings = row_findings(row, product_class, specs)
    packet = {
        "schema_version": 1,
        "sku": clean_cell(row.get("SKU")),
        "generation_eligible": generation_eligible(row),
        "product_class": product_class,
        "confidence": confidence_grade(row, specs, split_values(row.get("Meta: _dtb_compatible_tool_skus"))),
        "editorial_word_guidance": {"min": WORD_TARGETS[product_class][0], "max": WORD_TARGETS[product_class][1], "hard_limit": False},
        "recommended_sections": list(SECTION_POLICY[product_class]),
        "protected_identity": protected_identity(row),
        "protected_identity_sha256": protected_identity_digest(row),
        "authoritative_facts": authoritative_facts(row, specs),
        "source_copy": {"short_description": plain_text(row.get("Short description")), "description": plain_text(row.get("Description"))},
        "source_seo": {field.removeprefix("Meta: "): clean_cell(row.get(field)) for field in SEO_FIELDS},
        "canonical": canonical_recommendation(row),
        "generation_guardrails": {
            "never_mutate_protected_identity": True,
            "no_minimum_word_count": True,
            "do_not_invent_features": True,
            "do_not_convert_specs_into_marketing_benefits": True,
            "omit_sections_without_useful_supported_content": True,
            "research_instead_of_guessing_when_evidence_is_insufficient": True,
            "variation_copy_must_not_create_parallel_indexable_authority": True,
        },
        "pre_generation_findings": [asdict(f) for f in findings],
    }
    return packet, findings


def source_digest(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_catalog(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def prepare(catalog_path: Path, gap_path: Path, output_dir: Path) -> dict[str, object]:
    validate_catalog(catalog_path, gap_path)
    rows = read_catalog(catalog_path)
    packets: list[dict[str, object]] = []
    findings: list[Finding] = []
    for row in rows:
        packet, row_findings_list = build_packet(row)
        packets.append(packet)
        findings.extend(row_findings_list)
    add_duplicate_findings(rows, findings)

    by_sku: dict[str, list[dict[str, object]]] = defaultdict(list)
    for finding in findings:
        by_sku[finding.sku].append(asdict(finding))
    for packet in packets:
        packet["pre_generation_findings"] = sorted(by_sku.get(str(packet["sku"]), []), key=lambda item: (str(item["severity"]), str(item["code"]), str(item["field"])))

    output_dir.mkdir(parents=True, exist_ok=True)
    packets_path = output_dir / "generation-packets.jsonl"
    findings_path = output_dir / "pre-generation-findings.csv"
    summary_path = output_dir / "pre-generation-summary.json"
    with packets_path.open("w", encoding="utf-8", newline="\n") as handle:
        for packet in packets:
            handle.write(json.dumps(packet, sort_keys=True, ensure_ascii=False) + "\n")
    with findings_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["sku", "severity", "category", "code", "field", "message"])
        writer.writeheader()
        for finding in sorted(findings, key=lambda item: (item.sku, item.severity, item.code, item.field)):
            writer.writerow(asdict(finding))

    summary = {
        "schema_version": 1,
        "source_catalog": str(catalog_path),
        "source_sha256": source_digest(catalog_path),
        "rows": len(rows),
        "generation_eligible": sum(bool(packet["generation_eligible"]) for packet in packets),
        "product_classes": dict(sorted(Counter(str(packet["product_class"]) for packet in packets).items())),
        "confidence": dict(sorted(Counter(str(packet["confidence"]) for packet in packets).items())),
        "findings_by_severity": dict(sorted(Counter(f.severity for f in findings).items())),
        "top_finding_codes": dict(Counter(f.code for f in findings).most_common(20)),
        "blocking_findings": sum(f.severity in {"critical", "high"} for f in findings),
        "source_mutated": False,
        "outputs": {"generation_packets": str(packets_path), "findings": str(findings_path), "summary": str(summary_path)},
    }
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return summary


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--include-gap-audit", type=Path, default=DEFAULT_GAPS)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--fail-on-blocking", action="store_true", help="Return exit 2 when high/critical pre-generation findings exist after artifacts are written.")
    args = parser.parse_args(argv)
    summary = prepare(args.catalog.resolve(), args.include_gap_audit.resolve(), args.output_dir.resolve())
    print(json.dumps(summary, sort_keys=True))
    return 2 if args.fail_on_blocking and int(summary["blocking_findings"]) > 0 else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (CatalogValidationError, OSError, csv.Error, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
