#!/usr/bin/env python3
"""Cross-reference extracted MAP source rows with the canonical launch catalog.

Unlike the TSW supplier-cost analyzer, MAP source SKUs are genuine
manufacturer/distributor part numbers (no distributor namespace prefix to
strip) so a match is confirmed whenever a source SKU resolves to exactly one
catalog row via a protected identifier field, brand-independent. A source SKU
that resolves to more than one catalog row is left for manual review rather
than guessed at.
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
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DEFAULT_SOURCES = HERE / "results" / "map" / "map-price-sources.csv"
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_OUTPUT = HERE / "results" / "map" / "map-catalog-match-analysis.csv"
DEFAULT_REPORT = HERE / "results" / "map" / "map-catalog-match-report.json"
DEFAULT_CONFIRMED = HERE / "results" / "map" / "temp-map-confirmed-products.csv"
DEFAULT_REVIEW = HERE / "results" / "map" / "temp-map-review-products.csv"
DEFAULT_UNMATCHED = HERE / "results" / "map" / "temp-map-unmatched-products.csv"

CATALOG_IDENTIFIER_FIELDS = ("SKU", "Meta: schema_mpn", "Meta: _dtb_manufacturer_sku", "Meta: _dtb_mpn", "meta:model")
CONFIRMED = {"matched_identifier"}
OUTPUT_FIELDS = (
    "match_status", "match_basis", "confidence", "source_file", "source_sku", "description", "map_price",
    "catalog_sku", "catalog_name", "catalog_brand", "matched_identifier", "candidate_count", "review_notes",
)


class AnalysisError(RuntimeError):
    pass


@dataclass(frozen=True)
class CatalogRecord:
    row_number: int
    sku: str
    name: str
    brand: str
    identifiers: tuple[tuple[str, str, str], ...]


def clean(value: object) -> str:
    return " ".join(unicodedata.normalize("NFKC", str(value or "")).replace("﻿", "").split())


IDENTIFIER_RE = re.compile(r"[\s\-_./]+")


def ident(value: object) -> str:
    return IDENTIFIER_RE.sub("", clean(value)).upper()


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
    required = {"SKU", "Name", "Brands"}
    if missing := sorted(required - set(fields)):
        raise AnalysisError(f"{path}: missing catalog fields: {', '.join(missing)}")
    result = []
    for row_number, row in enumerate(rows, start=2):
        sku = clean(row.get("SKU"))
        if not sku:
            continue
        ids, seen = [], set()
        for field in CATALOG_IDENTIFIER_FIELDS:
            raw, key = clean(row.get(field)), ident(row.get(field))
            if key and key not in seen:
                seen.add(key)
                ids.append((field, raw, key))
        result.append(CatalogRecord(row_number, sku, clean(row.get("Name")), clean(row.get("Brands")), tuple(ids)))
    if not result:
        raise AnalysisError(f"{path}: no catalog rows with SKU values")
    return result


def result_row(s: dict[str, str], r: CatalogRecord | None, **v: object) -> dict[str, object]:
    row = {
        "match_status": v.get("match_status", "unmatched"),
        "match_basis": v.get("match_basis", ""),
        "confidence": v.get("confidence", ""),
        "source_file": s["source_file"],
        "source_sku": s["source_sku"],
        "description": s["description"],
        "map_price": s["map_price"],
        "catalog_sku": r.sku if r else "",
        "catalog_name": r.name if r else "",
        "catalog_brand": r.brand if r else "",
        "matched_identifier": v.get("matched_identifier", ""),
        "candidate_count": v.get("candidate_count", 0),
        "review_notes": v.get("review_notes", ""),
    }
    if tuple(row) != OUTPUT_FIELDS:
        raise AnalysisError("Result-row fields have drifted from the output CSV schema")
    return row


def analyze(sources: list[dict[str, str]], catalog: list[CatalogRecord]) -> list[dict[str, object]]:
    id_index: dict[str, list[tuple[CatalogRecord, str, str]]] = defaultdict(list)
    for r in catalog:
        for field, raw, key in r.identifiers:
            id_index[key].append((r, field, raw))

    output = []
    for s in sources:
        key = ident(s["source_sku"])
        hits = id_index.get(key, [])
        unique = {h[0].row_number: h[0] for h in hits}
        if len(unique) == 1:
            r = next(iter(unique.values()))
            bases = sorted({f"{f}" for hr, f, _ in hits if hr.row_number == r.row_number})
            values = sorted({raw for hr, _, raw in hits if hr.row_number == r.row_number})
            output.append(
                result_row(
                    s, r, match_status="matched_identifier", match_basis=" + ".join(bases), confidence="confirmed",
                    matched_identifier=" | ".join(values), candidate_count=1,
                )
            )
        elif len(unique) > 1:
            output.append(
                result_row(
                    s, None, match_status="ambiguous_identifier", match_basis="protected identifier", confidence="blocked",
                    matched_identifier=key, candidate_count=len(unique),
                    review_notes="Source SKU resolves to multiple catalog rows",
                )
            )
        else:
            output.append(
                result_row(
                    s, None, match_status="unmatched", confidence="none",
                    review_notes="No catalog row carries this identifier",
                )
            )
    return sorted(output, key=lambda r: (str(r["match_status"]), str(r["source_file"]), str(r["source_sku"]).casefold()))


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8-sig", newline="", delete=False, dir=path.parent) as h:
        tmp = Path(h.name)
        w = csv.DictWriter(h, fieldnames=OUTPUT_FIELDS, lineterminator="\r\n", extrasaction="raise")
        w.writeheader()
        w.writerows(rows)
    tmp.replace(path)


def write_report(path: Path, rows: list[dict[str, object]], sources: Path, catalog: Path) -> None:
    statuses = Counter(str(r["match_status"]) for r in rows)
    confirmed = sum(statuses.get(s, 0) for s in CONFIRMED)
    payload = {
        "schema_version": 1,
        "map_sources": str(sources.resolve()),
        "launch_catalog": str(catalog.resolve()),
        "source_rows": len(rows),
        "confirmed_matches": confirmed,
        "ambiguous": statuses.get("ambiguous_identifier", 0),
        "unmatched": statuses.get("unmatched", 0),
        "confirmed_match_rate": round(confirmed / len(rows), 4) if rows else 0,
        "match_status": dict(sorted(statuses.items())),
        "contract": {
            "confirmed_identity": ["unique catalog identifier match, brand-independent"],
            "catalog_identifiers": list(CATALOG_IDENTIFIER_FIELDS),
        },
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="\n", delete=False, dir=path.parent) as h:
        tmp = Path(h.name)
        json.dump(payload, h, indent=2, sort_keys=True)
        h.write("\n")
    tmp.replace(path)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--sources", type=Path, default=DEFAULT_SOURCES)
    p.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    p.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    p.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    p.add_argument("--confirmed-output", type=Path, default=DEFAULT_CONFIRMED)
    p.add_argument("--review-output", type=Path, default=DEFAULT_REVIEW)
    p.add_argument("--unmatched-output", type=Path, default=DEFAULT_UNMATCHED)
    args = p.parse_args()

    fields, sources = read_csv(args.sources)
    required = {"source_file", "source_sku", "description", "map_price"}
    if missing := sorted(required - set(fields)):
        raise AnalysisError(f"{args.sources}: missing source fields: {', '.join(missing)}")

    rows = analyze(sources, load_catalog(args.catalog))
    write_csv(args.output, rows)
    write_csv(args.confirmed_output, [r for r in rows if r["match_status"] in CONFIRMED])
    write_csv(args.review_output, [r for r in rows if r["match_status"] == "ambiguous_identifier"])
    write_csv(args.unmatched_output, [r for r in rows if r["match_status"] == "unmatched"])
    write_report(args.report, rows, args.sources, args.catalog)

    statuses = Counter(str(r["match_status"]) for r in rows)
    print(f"Analyzed {len(rows)} MAP source rows: " + ", ".join(f"{k}={v}" for k, v in sorted(statuses.items())))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AnalysisError as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
