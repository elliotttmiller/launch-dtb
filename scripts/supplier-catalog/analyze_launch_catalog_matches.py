#!/usr/bin/env python3
"""Cross-reference TSW DTB-brand product data with the canonical launch catalog.

Protected identifiers establish confirmed identity. Brand-scoped fuzzy name,
category, and dimension evidence surfaces mappable review candidates only; fuzzy
similarity never silently changes canonical SKU/MPN ownership.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import tempfile
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DEFAULT_SUPPLIER = ROOT / "docs" / "reference" / "data" / "TSW" / "TSW Product Data - DTB Brands.csv"
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_OUTPUT = HERE / "results" / "tsw-launch-catalog-match-analysis.csv"
DEFAULT_REPORT = HERE / "results" / "tsw-launch-catalog-match-report.json"
DEFAULT_APPROVALS = HERE / "approved-launch-catalog-matches.json"
DEFAULT_CONFIRMED = HERE / "results" / "temp-tsw-launch-confirmed-products.csv"
DEFAULT_REVIEW = HERE / "results" / "temp-tsw-launch-review-products.csv"
DEFAULT_UNMATCHED = HERE / "results" / "temp-tsw-launch-no-match-products.csv"

CONFIRMED = {"matched_identifier", "approved_manual_match"}
REVIEW = {"ambiguous_identifier", "exact_name_review", "high_confidence_name_review", "likely_name_review", "possible_name_review"}
CATALOG_IDENTIFIER_FIELDS = (
    "SKU", "Meta: _wc_gla_mpn", "Meta: _dtb_former_sku", "Meta: _dtb_source_ref",
    "Meta: _dtb_variation_base_sku",
)
BRAND_ALIASES = {
    "columbia": "columbia", "columbiatools": "columbia", "columbiatapingtools": "columbia",
    "tapetech": "tapetech", "tapetechtoolcompanyinc": "tapetech",
    "durastilts": "durastilts", "surpro": "surpro",
}
GENERIC_NAME = {"columbia", "tools", "tool", "tapetech", "dura", "stilts", "stilt", "surpro", "drywall", "replacement"}
CATEGORY_STOP = {"and", "the", "tools", "tool", "parts", "part", "accessories", "accessory"}
IDENTIFIER_RE = re.compile(r"[\s\-_./]+")
TOKEN_RE = re.compile(r"[a-z0-9]+(?:\.[0-9]+)?")
OUTPUT_FIELDS = (
    "match_status", "match_basis", "confidence", "supplier_brand", "supplier_sku", "supplier_source_sku",
    "supplier_name", "supplier_category", "supplier_weight", "supplier_length", "supplier_width", "supplier_height",
    "catalog_type", "catalog_sku", "catalog_name", "catalog_brand", "catalog_categories", "catalog_parent",
    "catalog_weight", "catalog_length", "catalog_width", "catalog_height", "matched_identifier", "candidate_count",
    "name_score", "name_score_gap", "numeric_tokens_match", "category_compatible", "dimension_score", "review_notes",
)

class AnalysisError(RuntimeError):
    pass

@dataclass(frozen=True)
class CatalogRecord:
    row_number: int
    product_type: str
    sku: str
    name: str
    brand: str
    brand_key: str
    categories: str
    parent: str
    weight: str
    length: str
    width: str
    height: str
    normalized_name: str
    identifiers: tuple[tuple[str, str, str], ...]

def clean(value: object) -> str:
    return " ".join(unicodedata.normalize("NFKC", str(value or "")).replace("\ufeff", "").split())

def ident(value: object) -> str:
    return IDENTIFIER_RE.sub("", clean(value)).upper()

def brand_key(value: object) -> str:
    raw = ident(value).casefold()
    return BRAND_ALIASES.get(raw, raw)

def norm_name(value: object) -> str:
    text = unicodedata.normalize("NFKD", clean(value)).encode("ascii", "ignore").decode("ascii").casefold()
    text = text.replace('"', " in ")
    return " ".join(t for t in TOKEN_RE.findall(text) if t not in GENERIC_NAME)

def numeric_tokens(value: object) -> tuple[str, ...]:
    return tuple(t for t in norm_name(value).split() if any(ch.isdigit() for ch in t))

def name_score(left: str, right: str) -> float:
    if not left or not right:
        return 0.0
    direct = SequenceMatcher(None, left, right).ratio()
    sorted_ratio = SequenceMatcher(None, " ".join(sorted(left.split())), " ".join(sorted(right.split()))).ratio()
    a, b = set(left.split()), set(right.split())
    jaccard = len(a & b) / len(a | b) if a | b else 0.0
    score = max(direct, sorted_ratio, jaccard)
    ln, rn = numeric_tokens(left), numeric_tokens(right)
    if ln and rn and ln != rn:
        score *= 0.55
    return round(score, 4)

def category_tokens(value: object) -> set[str]:
    text = unicodedata.normalize("NFKD", clean(value)).encode("ascii", "ignore").decode("ascii").casefold()
    return {t for t in TOKEN_RE.findall(text) if t not in CATEGORY_STOP and not t.isdigit()}

def category_compatible(left: object, right: object) -> bool:
    a, b = category_tokens(left), category_tokens(right)
    return True if not a or not b else bool(a & b)

def number(value: object) -> float | None:
    text = clean(value)
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None

def dimension_score(supplier: dict[str, str], record: CatalogRecord) -> float | None:
    pairs = ((supplier.get("weight"), record.weight), (supplier.get("length"), record.length), (supplier.get("width"), record.width), (supplier.get("height"), record.height))
    scores = []
    for left, right in pairs:
        a, b = number(left), number(right)
        if a is None or b is None:
            continue
        tolerance = max(0.15, abs(b) * 0.08)
        scores.append(1.0 if abs(a - b) <= tolerance else max(0.0, 1.0 - abs(a - b) / max(abs(a), abs(b), 1.0)))
    return round(sum(scores) / len(scores), 4) if scores else None

def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                raise AnalysisError(f"{path}: missing CSV header")
            fields = [clean(f) for f in reader.fieldnames]
            rows = [{clean(k): clean(v) for k, v in row.items() if k is not None} for row in reader]
    except OSError as exc:
        raise AnalysisError(f"Cannot read {path}: {exc}") from exc
    return fields, rows

def load_catalog(path: Path) -> list[CatalogRecord]:
    fields, rows = read_csv(path)
    required = {"Type", "SKU", "Name", "Brands", "Categories"}
    if missing := sorted(required - set(fields)):
        raise AnalysisError(f"{path}: missing catalog fields: {', '.join(missing)}")
    result = []
    for row_number, row in enumerate(rows, start=2):
        sku = clean(row.get("SKU"))
        if not sku:
            continue
        raw_brand = clean(row.get("Brands") or row.get("Meta: _dtb_brand"))
        ids, seen = [], set()
        for field in CATALOG_IDENTIFIER_FIELDS:
            raw, key = clean(row.get(field)), ident(row.get(field))
            if key and key not in seen:
                seen.add(key); ids.append((field, raw, key))
        result.append(CatalogRecord(
            row_number, clean(row.get("Type")), sku, clean(row.get("Name")), raw_brand, brand_key(raw_brand),
            clean(row.get("Categories")), clean(row.get("Parent") or row.get("Meta: _dtb_parent_sku")),
            clean(row.get("Weight (lbs)")), clean(row.get("Length (in)")), clean(row.get("Width (in)")), clean(row.get("Height (in)")),
            norm_name(row.get("Name")), tuple(ids),
        ))
    if not result:
        raise AnalysisError(f"{path}: no catalog rows with SKU values")
    return result

def load_approvals(path: Path) -> dict[tuple[str, str], dict[str, str]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise AnalysisError(f"Cannot read approved matches {path}: {exc}") from exc
    if not isinstance(payload, dict) or payload.get("schema_version") != 1 or not isinstance(payload.get("matches"), list):
        raise AnalysisError(f"{path}: expected schema_version 1 and matches array")
    out = {}
    for entry in payload["matches"]:
        b, s, c, reason = (clean(entry.get(k)) for k in ("supplier_brand", "supplier_sku", "catalog_sku", "reason"))
        if not all((b, s, c, reason)):
            raise AnalysisError(f"{path}: approved mapping is incomplete")
        key = (brand_key(b), ident(s))
        if key in out:
            raise AnalysisError(f"{path}: duplicate approval for {b} / {s}")
        out[key] = {"catalog_sku": c, "reason": reason}
    return out

def supplier_ids(row: dict[str, str]) -> tuple[tuple[str, str], ...]:
    out, seen = [], set()
    for field in ("sku", "supplier_sku"):
        raw, key = clean(row.get(field)), ident(row.get(field))
        if key and key not in seen:
            seen.add(key); out.append((field, key))
    return tuple(out)

def result_row(s: dict[str, str], r: CatalogRecord | None, **v: object) -> dict[str, object]:
    row = {
        "match_status": v.get("match_status", "unmatched"), "match_basis": v.get("match_basis", ""), "confidence": v.get("confidence", ""),
        "supplier_brand": s["brand"], "supplier_sku": s["sku"], "supplier_source_sku": s["supplier_sku"], "supplier_name": s["name"],
        "supplier_category": s["category"], "supplier_weight": s.get("weight", ""), "supplier_length": s.get("length", ""), "supplier_width": s.get("width", ""), "supplier_height": s.get("height", ""),
        "catalog_type": r.product_type if r else "", "catalog_sku": r.sku if r else "", "catalog_name": r.name if r else "", "catalog_brand": r.brand if r else "",
        "catalog_categories": r.categories if r else "", "catalog_parent": r.parent if r else "", "catalog_weight": r.weight if r else "", "catalog_length": r.length if r else "", "catalog_width": r.width if r else "", "catalog_height": r.height if r else "",
        "matched_identifier": v.get("matched_identifier", ""), "candidate_count": v.get("candidate_count", 0), "name_score": v.get("name_score", ""), "name_score_gap": v.get("name_score_gap", ""),
        "numeric_tokens_match": v.get("numeric_tokens_match", ""), "category_compatible": v.get("category_compatible", ""), "dimension_score": v.get("dimension_score", ""), "review_notes": v.get("review_notes", ""),
    }
    if tuple(row) != OUTPUT_FIELDS:
        raise AnalysisError("Result-row fields have drifted from the output CSV schema")
    return row

def analyze(suppliers: list[dict[str, str]], catalog: list[CatalogRecord], approvals: dict[tuple[str, str], dict[str, str]]) -> list[dict[str, object]]:
    id_index: dict[tuple[str, str], list[tuple[CatalogRecord, str, str]]] = defaultdict(list)
    token_index: dict[tuple[str, str], dict[int, CatalogRecord]] = defaultdict(dict)
    by_sku: dict[str, list[CatalogRecord]] = defaultdict(list)
    for r in catalog:
        by_sku[ident(r.sku)].append(r)
        for token in set(r.normalized_name.split()): token_index[(r.brand_key, token)][r.row_number] = r
        for field, raw, key in r.identifiers: id_index[(r.brand_key, key)].append((r, field, raw))
    output, used = [], set()
    for s in suppliers:
        bk, name_key = brand_key(s["brand"]), norm_name(s["name"])
        approval_keys = tuple((bk, key) for _, key in supplier_ids(s))
        matching_approvals = [(key, approvals[key]) for key in approval_keys if key in approvals]
        if len(matching_approvals) > 1:
            raise AnalysisError(
                f"Multiple approved mappings for {s['brand']} / {s['sku']} / {s['supplier_sku']}"
            )
        approval_key, approval = matching_approvals[0] if matching_approvals else (None, None)
        if approval:
            used.add(approval_key)
            records = [r for r in by_sku.get(ident(approval["catalog_sku"]), []) if r.brand_key == bk]
            if len(records) != 1:
                raise AnalysisError(f"Approved match {s['brand']} / {s['sku']} -> {approval['catalog_sku']} resolved to {len(records)} compatible rows")
            r = records[0]; ds = dimension_score(s, r)
            output.append(result_row(s, r, match_status="approved_manual_match", match_basis="explicit reviewed mapping", confidence="confirmed", matched_identifier=approval["catalog_sku"], candidate_count=1, name_score=f"{name_score(name_key, r.normalized_name):.4f}", numeric_tokens_match=str(numeric_tokens(name_key) == numeric_tokens(r.normalized_name)).lower(), category_compatible=str(category_compatible(s["category"], r.categories)).lower(), dimension_score="" if ds is None else f"{ds:.4f}", review_notes=approval["reason"]))
            continue
        hits = []
        for sf, key in supplier_ids(s):
            for r, cf, raw in id_index.get((bk, key), []): hits.append((r, sf, cf, raw))
        unique = {h[0].row_number: h[0] for h in hits}
        if len(unique) == 1:
            r = next(iter(unique.values())); ds = dimension_score(s, r)
            bases = sorted({f"{sf}->{cf}" for hr, sf, cf, _ in hits if hr.row_number == r.row_number})
            values = sorted({raw for hr, _, _, raw in hits if hr.row_number == r.row_number})
            output.append(result_row(s, r, match_status="matched_identifier", match_basis=" + ".join(bases), confidence="confirmed", matched_identifier=" | ".join(values), candidate_count=1, name_score=f"{name_score(name_key, r.normalized_name):.4f}", numeric_tokens_match=str(numeric_tokens(name_key) == numeric_tokens(r.normalized_name)).lower(), category_compatible=str(category_compatible(s["category"], r.categories)).lower(), dimension_score="" if ds is None else f"{ds:.4f}"))
            continue
        if len(unique) > 1:
            output.append(result_row(s, None, match_status="ambiguous_identifier", match_basis="protected identifier", confidence="blocked", matched_identifier=" | ".join(k for _, k in supplier_ids(s)), candidate_count=len(unique), review_notes="Identifier resolves to multiple brand-compatible catalog rows")); continue
        candidates = {}
        for token in set(name_key.split()): candidates.update(token_index.get((bk, token), {}))
        scored = []
        sn = numeric_tokens(name_key)
        for r in candidates.values():
            score = name_score(name_key, r.normalized_name); rn = numeric_tokens(r.normalized_name)
            nums = not sn or not rn or sn == rn; cat = category_compatible(s["category"], r.categories); ds = dimension_score(s, r)
            scored.append((score, r, nums, cat, ds))
        scored.sort(key=lambda x: (-x[0], x[1].sku.casefold()))
        best_score, best, nums, cat, ds = scored[0] if scored else (0.0, None, False, False, None)
        second = scored[1][0] if len(scored) > 1 else 0.0; gap = round(best_score - second, 4)
        dim_ok = ds is None or ds >= 0.72
        if best and best_score == 1.0 and nums:
            status, conf, note = "exact_name_review", "review", "Exact normalized name and brand, but no protected identifier matched"
        elif best and best_score >= 0.93 and gap >= 0.08 and nums and cat and dim_ok:
            status, conf, note = "high_confidence_name_review", "high-review", "Unique fuzzy candidate corroborated by brand, numeric/model tokens, category, and available dimensions; verify identifier before mapping"
        elif best and best_score >= 0.86 and gap >= 0.05 and nums:
            status, conf, note = "likely_name_review", "review", "Strong brand-compatible name candidate; protected identifier verification required"
        elif best and best_score >= 0.70:
            status, conf, note = "possible_name_review", "review", "Possible brand-compatible product candidate; manual verification required"
        else:
            status, conf, note, best = "unmatched", "none", "No credible brand-compatible identifier or name candidate", None
        output.append(result_row(s, best, match_status=status, match_basis="product name + brand + corroboration" if best else "", confidence=conf, candidate_count=len(scored), name_score=f"{best_score:.4f}" if best else "", name_score_gap=f"{gap:.4f}" if best else "", numeric_tokens_match=str(nums).lower() if best else "", category_compatible=str(cat).lower() if best else "", dimension_score="" if best is None or ds is None else f"{ds:.4f}", review_notes=note))
    applicable_unused = sorted(k for k in set(approvals) - used if k[0] in {brand_key(s["brand"]) for s in suppliers})
    if applicable_unused:
        raise AnalysisError("Approved mappings do not resolve to current supplier rows: " + ", ".join(f"{b}/{s}" for b, s in applicable_unused))
    return sorted(output, key=lambda r: (str(r["match_status"]), str(r["supplier_brand"]).casefold(), str(r["supplier_sku"]).casefold()))

def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8-sig", newline="", delete=False, dir=path.parent) as h:
        tmp = Path(h.name); w = csv.DictWriter(h, fieldnames=OUTPUT_FIELDS, lineterminator="\r\n", extrasaction="raise"); w.writeheader(); w.writerows(rows)
    tmp.replace(path)

def write_report(path: Path, rows: list[dict[str, object]], supplier: Path, catalog: Path) -> None:
    statuses = Counter(str(r["match_status"]) for r in rows); confirmed = sum(statuses.get(s, 0) for s in CONFIRMED)
    payload = {"schema_version": 2, "supplier_catalog": str(supplier.resolve()), "launch_catalog": str(catalog.resolve()), "supplier_rows": len(rows), "confirmed_matches": confirmed, "review_candidates": sum(statuses.get(s, 0) for s in REVIEW), "unmatched": statuses.get("unmatched", 0), "confirmed_match_rate": round(confirmed / len(rows), 4) if rows else 0, "match_status": dict(sorted(statuses.items())), "contract": {"confirmed_identity": ["unique brand-compatible protected identifier", "explicit reviewed mapping"], "supplier_identifiers": ["sku", "supplier_sku"], "catalog_identifiers": list(CATALOG_IDENTIFIER_FIELDS), "fuzzy_matching_confirms_identity": False, "high_confidence_name_threshold": 0.93, "high_confidence_minimum_gap": 0.08, "dimension_tolerance_percent": 8}, "interpretation": "Only matched_identifier and approved_manual_match are confirmed. Name-based statuses are mappable review candidates and must not rewrite protected identifiers without review."}
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="\n", delete=False, dir=path.parent) as h:
        tmp = Path(h.name); json.dump(payload, h, indent=2, sort_keys=True); h.write("\n")
    tmp.replace(path)

def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--supplier", type=Path, default=DEFAULT_SUPPLIER); p.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    p.add_argument("--output", type=Path, default=DEFAULT_OUTPUT); p.add_argument("--report", type=Path, default=DEFAULT_REPORT); p.add_argument("--approvals", type=Path, default=DEFAULT_APPROVALS)
    p.add_argument("--confirmed-output", type=Path, default=DEFAULT_CONFIRMED); p.add_argument("--review-output", type=Path, default=DEFAULT_REVIEW); p.add_argument("--unmatched-output", type=Path, default=DEFAULT_UNMATCHED)
    args = p.parse_args()
    fields, suppliers = read_csv(args.supplier)
    required = {"brand", "name", "sku", "supplier_sku", "category"}
    if missing := sorted(required - set(fields)): raise AnalysisError(f"{args.supplier}: missing supplier fields: {', '.join(missing)}")
    rows = analyze(suppliers, load_catalog(args.catalog), load_approvals(args.approvals))
    write_csv(args.output, rows); write_csv(args.confirmed_output, [r for r in rows if r["match_status"] in CONFIRMED]); write_csv(args.review_output, [r for r in rows if r["match_status"] in REVIEW]); write_csv(args.unmatched_output, [r for r in rows if r["match_status"] == "unmatched"]); write_report(args.report, rows, args.supplier, args.catalog)
    statuses = Counter(str(r["match_status"]) for r in rows); print(f"Analyzed {len(rows)} TSW products: " + ", ".join(f"{k}={v}" for k, v in sorted(statuses.items())))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
