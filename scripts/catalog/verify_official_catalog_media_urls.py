#!/usr/bin/env python3
"""Verify every unique official-catalog image URL and production-host candidate."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import ssl
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_OUTPUT = ROOT / "products" / "dev" / "catalog-enrichment" / "production-readiness"
PRODUCTION_HOST = "drywalltoolbox.com"


def clean(value: object) -> str:
    return str(value or "").strip()


def candidate_url(source: str) -> str:
    parsed = urlsplit(source)
    path = parsed.path
    if path.startswith("/wp/wp-content/"):
        path = path[len("/wp"):]
    return urlunsplit(("https", PRODUCTION_HOST, path, parsed.query, ""))


def request_head(url: str, timeout: float) -> dict[str, object]:
    request = Request(url, method="HEAD", headers={"User-Agent": "DTB-Catalog-Audit/1.0"})
    try:
        with urlopen(request, timeout=timeout, context=ssl.create_default_context()) as response:
            return {
                "status": int(response.status),
                "content_type": clean(response.headers.get("Content-Type")).split(";", 1)[0].lower(),
                "content_length": clean(response.headers.get("Content-Length")),
                "final_url": response.geturl(),
                "error": "",
            }
    except HTTPError as exc:
        return {"status": exc.code, "content_type": "", "content_length": "", "final_url": url, "error": str(exc)}
    except (URLError, TimeoutError, OSError) as exc:
        return {"status": 0, "content_type": "", "content_length": "", "final_url": url, "error": str(exc)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--workers", type=int, default=12)
    parser.add_argument("--timeout", type=float, default=20.0)
    args = parser.parse_args()
    if args.workers < 1 or args.workers > 24:
        parser.error("--workers must be between 1 and 24")

    catalog_path = args.catalog.resolve()
    before = hashlib.sha256(catalog_path.read_bytes()).hexdigest()
    with catalog_path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    owners: defaultdict[str, set[str]] = defaultdict(set)
    for row in rows:
        for url in [part.strip() for part in clean(row.get("Images")).split(",") if part.strip()]:
            owners[url].add(clean(row.get("SKU")))

    results: dict[str, dict[str, object]] = {}
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        pending = {executor.submit(request_head, candidate_url(source), args.timeout): source for source in owners}
        for future in as_completed(pending):
            source = pending[future]
            results[source] = future.result()

    output_rows: list[dict[str, object]] = []
    for source in sorted(owners):
        result = results[source]
        status = int(result["status"])
        content_type = clean(result["content_type"])
        output_rows.append({
            "source_url": source,
            "production_candidate_url": candidate_url(source),
            "affected_sku_count": len(owners[source]),
            "affected_skus": "|".join(sorted(owners[source])),
            "status": status,
            "content_type": content_type,
            "content_length": result["content_length"],
            "final_url": result["final_url"],
            "production_candidate_valid": "true" if 200 <= status < 400 and content_type.startswith("image/") else "false",
            "error": result["error"],
        })

    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = output_dir / "media-url-validation.csv"
    with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(output_rows[0].keys()), lineterminator="\n")
        writer.writeheader()
        writer.writerows(output_rows)
    summary = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "catalog": str(catalog_path.relative_to(ROOT)).replace("\\", "/"),
        "catalog_sha256_worktree": before,
        "unique_source_urls": len(output_rows),
        "valid_production_candidates": sum(row["production_candidate_valid"] == "true" for row in output_rows),
        "invalid_production_candidates": sum(row["production_candidate_valid"] != "true" for row in output_rows),
        "status_counts": dict(sorted(Counter(str(row["status"]) for row in output_rows).items())),
        "content_type_counts": dict(sorted(Counter(clean(row["content_type"]) or "(blank)" for row in output_rows).items())),
        "source_mutated": False,
        "output": str(csv_path.relative_to(ROOT)).replace("\\", "/"),
    }
    (output_dir / "media-url-validation-summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    after = hashlib.sha256(catalog_path.read_bytes()).hexdigest()
    if after != before:
        raise RuntimeError("Media verification mutated the canonical catalog")
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if summary["invalid_production_candidates"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
