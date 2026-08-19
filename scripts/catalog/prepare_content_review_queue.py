#!/usr/bin/env python3
"""Prepare actionable content review queues from SEO pre-generation artifacts.

This script does not detect claims, generate copy, research the web, or mutate
the catalog. `catalog_seo_pre_generation.py` remains the finding authority. This
stage joins those findings to the existing evidence packets so accuracy and
editorial review can be processed in controlled batches.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = ROOT / "products" / "dev" / "catalog-enrichment" / "seo-pre-generation"
DEFAULT_OUTPUT = ROOT / "products" / "dev" / "catalog-enrichment" / "content-review"
SUPPORTED_WORKFLOWS = ("accuracy_review", "editorial_review")


def load_packets(path: Path) -> dict[str, dict[str, object]]:
    packets: dict[str, dict[str, object]] = {}
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            packet = json.loads(line)
            sku = str(packet.get("sku") or "").strip()
            if sku:
                packets[sku] = packet
    return packets


def clean_code(code: str) -> str:
    return code.split(":", 1)[1] if ":" in code else code


def bool_text(value: object) -> str:
    return "true" if bool(value) else "false"


def build_queue(
    findings_path: Path,
    packets_path: Path,
    *,
    workflow: str,
) -> list[dict[str, str]]:
    packets = load_packets(packets_path)
    rows: list[dict[str, str]] = []
    with findings_path.open("r", encoding="utf-8", newline="") as handle:
        for finding in csv.DictReader(handle):
            if (finding.get("workflow") or "").strip() != workflow:
                continue
            sku = (finding.get("sku") or "").strip()
            packet = packets.get(sku, {})
            facts = packet.get("authoritative_facts") if isinstance(packet, dict) else {}
            facts = facts if isinstance(facts, dict) else {}
            identity = packet.get("protected_identity") if isinstance(packet, dict) else {}
            identity = identity if isinstance(identity, dict) else {}
            source_copy = packet.get("source_copy") if isinstance(packet, dict) else {}
            source_copy = source_copy if isinstance(source_copy, dict) else {}
            source_seo = packet.get("source_seo") if isinstance(packet, dict) else {}
            source_seo = source_seo if isinstance(source_seo, dict) else {}

            rows.append(
                {
                    "sku": sku,
                    "brand": str(facts.get("brand") or identity.get("Brands") or ""),
                    "name": str(facts.get("name") or identity.get("Name") or ""),
                    "product_class": str(packet.get("product_class") or "") if isinstance(packet, dict) else "",
                    "product_type": str(facts.get("product_type") or ""),
                    "parent_sku": str(facts.get("parent_sku") or ""),
                    "generation_eligible": bool_text(packet.get("generation_eligible")) if isinstance(packet, dict) else "false",
                    "workflow": workflow,
                    "severity": (finding.get("severity") or "").strip(),
                    "finding_code": (finding.get("code") or "").strip(),
                    "review_topic": clean_code((finding.get("code") or "").strip()),
                    "field": (finding.get("field") or "").strip(),
                    "message": (finding.get("message") or "").strip(),
                    "mpn": str(facts.get("mpn") or facts.get("manufacturer_sku") or ""),
                    "gtin": str(facts.get("gtin") or ""),
                    "schematic_id": str(identity.get("Meta: _dtb_schematic_id") or ""),
                    "compatible_tool_skus": json.dumps(facts.get("compatible_tool_skus") or [], separators=(",", ":")),
                    "specification_count": str(len(facts.get("specifications") or [])),
                    "source_description": str(source_copy.get("description") or ""),
                    "source_short_description": str(source_copy.get("short_description") or ""),
                    "source_seo_description": str(source_seo.get("_dtb_seo_description") or ""),
                    "protected_identity_sha256": str(packet.get("protected_identity_sha256") or "") if isinstance(packet, dict) else "",
                }
            )
    return sorted(rows, key=lambda row: (row["brand"], row["review_topic"], row["sku"], row["field"]))


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = (
        "sku", "brand", "name", "product_class", "product_type", "parent_sku",
        "generation_eligible", "workflow", "severity", "finding_code", "review_topic",
        "field", "message", "mpn", "gtin", "schematic_id", "compatible_tool_skus",
        "specification_count", "source_description", "source_short_description",
        "source_seo_description", "protected_identity_sha256",
    )
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--workflow", choices=SUPPORTED_WORKFLOWS, default="accuracy_review")
    args = parser.parse_args()

    input_dir = args.input_dir.resolve()
    output_dir = args.output_dir.resolve()
    queue = build_queue(
        input_dir / "pre-generation-findings.csv",
        input_dir / "generation-packets.jsonl",
        workflow=args.workflow,
    )

    stem = args.workflow.replace("_", "-")
    queue_path = output_dir / f"{stem}-queue.csv"
    summary_path = output_dir / f"{stem}-summary.json"
    write_csv(queue_path, queue)

    eligible_rows = [row for row in queue if row["generation_eligible"] == "true"]
    noneligible_rows = [row for row in queue if row["generation_eligible"] != "true"]
    summary = {
        "schema_version": 2,
        "workflow": args.workflow,
        "mutates_catalog": False,
        "rows": len(queue),
        "unique_skus": len({row["sku"] for row in queue}),
        "generation_eligible": {
            "rows": len(eligible_rows),
            "unique_skus": len({row["sku"] for row in eligible_rows}),
        },
        "non_generation_eligible": {
            "rows": len(noneligible_rows),
            "unique_skus": len({row["sku"] for row in noneligible_rows}),
        },
        "by_product_type": dict(sorted(Counter(row["product_type"] or "(blank)" for row in queue).items())),
        "by_brand": dict(sorted(Counter(row["brand"] or "(blank)" for row in queue).items())),
        "by_topic": dict(Counter(row["review_topic"] for row in queue).most_common()),
        "output": queue_path.relative_to(ROOT).as_posix() if queue_path.is_relative_to(ROOT) else str(queue_path),
    }
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, csv.Error, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
