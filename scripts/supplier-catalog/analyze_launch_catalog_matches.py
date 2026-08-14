#!/usr/bin/env python3
"""Map normalized TSW supplier products to the canonical DTB launch catalog."""

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
DEFAULT_SUPPLIER = HERE / "results" / "tsw-costs.csv"
DEFAULT_CATALOG = HERE.parents[1] / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_OUTPUT = HERE / "results" / "tsw-launch-catalog-match-analysis.csv"
DEFAULT_REPORT = HERE / "results" / "tsw-launch-catalog-match-report.json"
DEFAULT_APPROVALS = HERE / "approved-launch-catalog-matches.json"
DEFAULT_CONFIRMED_OUTPUT = HERE / "results" / "temp-tsw-launch-confirmed-products.csv"
DEFAULT_UNMATCHED_OUTPUT = HERE / "results" / "temp-tsw-launch-no-match-products.csv"
DEFAULT_REVIEW_OUTPUT = HERE / "results" / "temp-tsw-launch-review-products.csv"

CONFIRMED_STATUSES = {"matched_identifier", "approved_manual_match"}
REVIEW_STATUSES = {
    "ambiguous_identifier",
    "exact_name_review",
    "likely_name_review",
    "possible_name_review",
}

IDENTIFIER_FIELDS = (
    "SKU",
    "Meta: schema_mpn",
    "Meta: _dtb_manufacturer_sku",
    "Meta: _dtb_mpn",
    "meta:model",
)
OUTPUT_FIELDS = (
    "match_status",
    "match_basis",
    "confidence",
    "supplier_brand",
    "supplier_sku",
    "supplier_name",
    "supplier_cost",
    "catalog_type",
    "catalog_sku",
    "catalog_name",
    "catalog_brand",
    "matched_identifier",
    "candidate_count",
    "name_score",
    "review_notes",
)
BRAND_ALIASES = {
    "columbiatools": "columbia",
    "columbiatapingtools": "columbia",
    "tapetech": "tapetech",
    "durastilts": "durastilts",
    "surpro": "surpro",
}
IDENTIFIER_RE = re.compile(r"[\s\-_./]+")
NAME_TOKEN_RE = re.compile(r"[a-z0-9]+")


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
    normalized_name: str
    identifiers: tuple[tuple[str, str, str], ...]


def clean(value: object) -> str:
    return " ".join(unicodedata.normalize("NFKC", str(value or "")).replace("\ufeff", "").split())


def identifier(value: object) -> str:
    return IDENTIFIER_RE.sub("", clean(value)).upper()


def brand_key(value: object) -> str:
    key = identifier(value).casefold()
    return BRAND_ALIASES.get(key, key)


def normalized_name(value: object) -> str:
    text = unicodedata.normalize("NFKD", clean(value)).encode("ascii", "ignore").decode("ascii").casefold()
    tokens = NAME_TOKEN_RE.findall(text)
    return " ".join(token for token in tokens if token not in {"columbia", "tools", "tapetech"})


def name_score(left_name: str, right_name: str) -> float:
    if not left_name or not right_name:
        return 0.0
    direct = SequenceMatcher(None, left_name, right_name).ratio()
    token_sorted = SequenceMatcher(None, " ".join(sorted(left_name.split())), " ".join(sorted(right_name.split()))).ratio()
    score = max(direct, token_sorted)
    left_numbers = tuple(token for token in left_name.split() if token.isdigit())
    right_numbers = tuple(token for token in right_name.split() if token.isdigit())
    if left_numbers and right_numbers and left_numbers != right_numbers:
        score *= 0.65
    return round(score, 4)


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                raise AnalysisError(f"{path}: missing CSV header")
            fields = [clean(field) for field in reader.fieldnames]
            rows = [{clean(key): clean(value) for key, value in row.items() if key is not None} for row in reader]
    except OSError as exc:
        raise AnalysisError(f"Cannot read {path}: {exc}") from exc
    return fields, rows


def load_catalog(path: Path) -> list[CatalogRecord]:
    fields, rows = read_csv(path)
    required = {"Type", "SKU", "Name", "Brands"}
    if missing := sorted(required - set(fields)):
        raise AnalysisError(f"{path}: missing catalog fields: {', '.join(missing)}")
    records = []
    for row_number, row in enumerate(rows, start=2):
        sku = clean(row.get("SKU"))
        if not sku:
            continue
        values = []
        seen = set()
        for field in IDENTIFIER_FIELDS:
            raw = clean(row.get(field))
            key = identifier(raw)
            if key and key not in seen:
                seen.add(key)
                values.append((field, raw, key))
        records.append(
            CatalogRecord(
                row_number=row_number,
                product_type=clean(row.get("Type")),
                sku=sku,
                name=clean(row.get("Name")),
                brand=clean(row.get("Brands") or row.get("Meta: _dtb_brand_label") or row.get("Meta: schema_brand")),
                brand_key=brand_key(row.get("Brands") or row.get("Meta: _dtb_brand_label") or row.get("Meta: schema_brand")),
                normalized_name=normalized_name(row.get("Name")),
                identifiers=tuple(values),
            )
        )
    return records


def load_approvals(path: Path) -> dict[tuple[str, str], dict[str, str]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise AnalysisError(f"Cannot read approved matches {path}: {exc}") from exc
    if not isinstance(payload, dict) or payload.get("schema_version") != 1 or not isinstance(payload.get("matches"), list):
        raise AnalysisError(f"{path}: expected schema_version 1 and a matches array")
    approvals = {}
    for entry in payload["matches"]:
        if not isinstance(entry, dict):
            raise AnalysisError(f"{path}: every approved match must be an object")
        supplier_brand = clean(entry.get("supplier_brand"))
        supplier_sku = clean(entry.get("supplier_sku"))
        catalog_sku = clean(entry.get("catalog_sku"))
        reason = clean(entry.get("reason"))
        if not all((supplier_brand, supplier_sku, catalog_sku, reason)):
            raise AnalysisError(f"{path}: approved matches require supplier_brand, supplier_sku, catalog_sku, and reason")
        key = (brand_key(supplier_brand), identifier(supplier_sku))
        if key in approvals:
            raise AnalysisError(f"{path}: duplicate approval for {supplier_brand} / {supplier_sku}")
        approvals[key] = {"catalog_sku": catalog_sku, "reason": reason}
    return approvals


def result_row(supplier: dict[str, str], record: CatalogRecord | None, **values: object) -> dict[str, object]:
    return {
        "match_status": values.get("match_status", "unmatched"),
        "match_basis": values.get("match_basis", ""),
        "confidence": values.get("confidence", ""),
        "supplier_brand": supplier["brand"],
        "supplier_sku": supplier["sku"],
        "supplier_name": supplier["product_name"],
        "supplier_cost": supplier["supplier_cost"],
        "catalog_type": record.product_type if record else "",
        "catalog_sku": record.sku if record else "",
        "catalog_name": record.name if record else "",
        "catalog_brand": record.brand if record else "",
        "matched_identifier": values.get("matched_identifier", ""),
        "candidate_count": values.get("candidate_count", 0),
        "name_score": values.get("name_score", ""),
        "review_notes": values.get("review_notes", ""),
    }


def analyze(
    supplier_rows: list[dict[str, str]],
    catalog: list[CatalogRecord],
    approvals: dict[tuple[str, str], dict[str, str]],
) -> list[dict[str, object]]:
    index: dict[tuple[str, str], list[tuple[CatalogRecord, str, str]]] = defaultdict(list)
    name_token_index: dict[tuple[str, str], dict[int, CatalogRecord]] = defaultdict(dict)
    catalog_by_sku: dict[str, list[CatalogRecord]] = defaultdict(list)
    for record in catalog:
        catalog_by_sku[identifier(record.sku)].append(record)
        for token in set(record.normalized_name.split()):
            name_token_index[(record.brand_key, token)][record.row_number] = record
        for field, raw, key in record.identifiers:
            index[(record.brand_key, key)].append((record, field, raw))

    output = []
    used_approvals = set()
    for supplier in supplier_rows:
        supplier_brand_key = brand_key(supplier["brand"])
        supplier_identifier = identifier(supplier["sku"])
        supplier_name_key = normalized_name(supplier["product_name"])
        approval = approvals.get((supplier_brand_key, supplier_identifier))
        if approval is not None:
            used_approvals.add((supplier_brand_key, supplier_identifier))
            approved_records = [
                record
                for record in catalog_by_sku.get(identifier(approval["catalog_sku"]), [])
                if record.brand_key == supplier_brand_key
            ]
            if len(approved_records) != 1:
                raise AnalysisError(
                    f"Approved match {supplier['brand']} / {supplier['sku']} -> {approval['catalog_sku']} "
                    f"resolved to {len(approved_records)} brand-compatible catalog rows"
                )
            record = approved_records[0]
            output.append(result_row(
                supplier,
                record,
                match_status="approved_manual_match",
                match_basis="explicit reviewed mapping",
                confidence="confirmed",
                matched_identifier=approval["catalog_sku"],
                candidate_count=1,
                name_score=f"{name_score(supplier_name_key, record.normalized_name):.4f}",
                review_notes=approval["reason"],
            ))
            continue
        hits = index.get((supplier_brand_key, supplier_identifier), [])
        unique_records = {hit[0].row_number: hit[0] for hit in hits}
        if len(unique_records) == 1:
            record = next(iter(unique_records.values()))
            bases = sorted({field for hit_record, field, _ in hits if hit_record.row_number == record.row_number})
            output.append(result_row(
                supplier,
                record,
                match_status="matched_identifier",
                match_basis=" + ".join(bases),
                confidence="confirmed",
                matched_identifier=supplier["sku"],
                candidate_count=1,
                name_score=f"{name_score(supplier_name_key, record.normalized_name):.4f}",
            ))
            continue
        if len(unique_records) > 1:
            output.append(result_row(
                supplier,
                None,
                match_status="ambiguous_identifier",
                match_basis="protected identifier",
                confidence="blocked",
                matched_identifier=supplier["sku"],
                candidate_count=len(unique_records),
                review_notes="Identifier resolves to multiple brand-compatible catalog rows",
            ))
            continue

        name_candidates: dict[int, CatalogRecord] = {}
        for token in set(supplier_name_key.split()):
            name_candidates.update(name_token_index.get((supplier_brand_key, token), {}))
        scored = sorted(
            ((name_score(supplier_name_key, record.normalized_name), record) for record in name_candidates.values()),
            key=lambda item: (-item[0], item[1].sku.casefold()),
        )
        best_score, best = scored[0] if scored else (0.0, None)
        second_score = scored[1][0] if len(scored) > 1 else 0.0
        gap = best_score - second_score
        if best and best_score == 1.0:
            status, confidence, note = "exact_name_review", "review", "Exact name only; verify protected identifier"
        elif best and best_score >= 0.86 and gap >= 0.05:
            status, confidence, note = "likely_name_review", "review", "High name similarity only; verify protected identifier"
        elif best and best_score >= 0.70:
            status, confidence, note = "possible_name_review", "review", "Possible name candidate; manual review required"
        else:
            status, confidence, note, best = "unmatched", "none", "No credible brand-compatible identifier or name candidate", None
        output.append(result_row(
            supplier,
            best,
            match_status=status,
            match_basis="product name" if best else "",
            confidence=confidence,
            candidate_count=len(scored),
            name_score=f"{best_score:.4f}" if best else "",
            review_notes=note,
        ))
    if unused := sorted(set(approvals) - used_approvals):
        labels = ", ".join(f"{brand} / {sku}" for brand, sku in unused)
        raise AnalysisError(f"Approved mappings do not resolve to supplier rows: {labels}")
    return sorted(output, key=lambda row: (str(row["match_status"]), str(row["supplier_brand"]).casefold(), str(row["supplier_sku"]).casefold()))


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8-sig", newline="", delete=False, dir=path.parent) as handle:
        temp = Path(handle.name)
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS, lineterminator="\r\n")
        writer.writeheader()
        writer.writerows(rows)
    temp.replace(path)


def write_report(path: Path, rows: list[dict[str, object]], supplier_path: Path, catalog_path: Path) -> None:
    statuses = Counter(str(row["match_status"]) for row in rows)
    identifier_matches = statuses.get("matched_identifier", 0)
    approved_matches = statuses.get("approved_manual_match", 0)
    confirmed = identifier_matches + approved_matches
    payload = {
        "schema_version": 1,
        "supplier_catalog": str(supplier_path.resolve()),
        "launch_catalog": str(catalog_path.resolve()),
        "supplier_rows": len(rows),
        "confirmed_matches": confirmed,
        "confirmed_identifier_matches": identifier_matches,
        "approved_manual_matches": approved_matches,
        "confirmed_match_rate": round(confirmed / len(rows), 4) if rows else 0,
        "match_status": dict(sorted(statuses.items())),
        "fuzzy_matching": {
            "brand_scoped": True,
            "candidate_blocking": "at least one shared normalized name token",
            "score": "maximum of ordered-name and token-sorted SequenceMatcher ratios",
            "numeric_mismatch_penalty": 0.65,
            "exact_name_threshold": 1.0,
            "likely_name_threshold": 0.86,
            "likely_minimum_gap": 0.05,
            "possible_name_threshold": 0.70,
        },
        "interpretation": "matched_identifier and approved_manual_match rows are confirmed. Other name-based rows require manual identifier verification.",
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="\n", delete=False, dir=path.parent) as handle:
        temp = Path(handle.name)
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
    temp.replace(path)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--supplier", type=Path, default=DEFAULT_SUPPLIER)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--approvals", type=Path, default=DEFAULT_APPROVALS)
    parser.add_argument("--confirmed-output", type=Path, default=DEFAULT_CONFIRMED_OUTPUT)
    parser.add_argument("--unmatched-output", type=Path, default=DEFAULT_UNMATCHED_OUTPUT)
    parser.add_argument("--review-output", type=Path, default=DEFAULT_REVIEW_OUTPUT)
    args = parser.parse_args()
    supplier_fields, supplier_rows = read_csv(args.supplier)
    required = {"brand", "sku", "product_name", "supplier_cost"}
    if missing := sorted(required - set(supplier_fields)):
        raise AnalysisError(f"{args.supplier}: missing supplier fields: {', '.join(missing)}")
    rows = analyze(supplier_rows, load_catalog(args.catalog), load_approvals(args.approvals))
    write_csv(args.output, rows)
    write_csv(args.confirmed_output, [row for row in rows if row["match_status"] in CONFIRMED_STATUSES])
    write_csv(args.unmatched_output, [row for row in rows if row["match_status"] == "unmatched"])
    write_csv(args.review_output, [row for row in rows if row["match_status"] in REVIEW_STATUSES])
    write_report(args.report, rows, args.supplier, args.catalog)
    statuses = Counter(str(row["match_status"]) for row in rows)
    print(f"Analyzed {len(rows)} supplier products: " + ", ".join(f"{key}={value}" for key, value in sorted(statuses.items())))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
