from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from prepare_content_review_queue import build_queue


def write_inputs(root: Path) -> tuple[Path, Path]:
    findings = root / "findings.csv"
    packets = root / "packets.jsonl"
    with findings.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["sku", "workflow", "severity", "category", "code", "field", "message"])
        writer.writeheader()
        writer.writerow({
            "sku": "SKU-1",
            "workflow": "accuracy_review",
            "severity": "medium",
            "category": "content-accuracy",
            "code": "claim_needs_evidence:industrial_grade",
            "field": "Description/SEO",
            "message": "Needs evidence",
        })
        writer.writerow({
            "sku": "SKU-1",
            "workflow": "editorial_review",
            "severity": "low",
            "category": "content",
            "code": "repetitive_language:job_site",
            "field": "Description",
            "message": "Edit repetition",
        })
    packet = {
        "sku": "SKU-1",
        "generation_eligible": True,
        "product_class": "primary_finishing_tool",
        "protected_identity": {"Brands": "Columbia Tools", "Meta: _dtb_schematic_id": "columbia-tool"},
        "protected_identity_sha256": "abc123",
        "authoritative_facts": {
            "product_type": "simple",
            "parent_sku": "",
            "brand": "Columbia Tools",
            "name": "Test Tool",
            "mpn": "MPN-1",
            "gtin": "",
            "compatible_tool_skus": [],
            "specifications": [{"label": "Width", "value": "10 in"}],
        },
        "source_copy": {"description": "Industrial-grade tool.", "short_description": "Test"},
        "source_seo": {"_dtb_seo_description": "SEO text"},
    }
    packets.write_text(json.dumps(packet) + "\n", encoding="utf-8")
    return findings, packets


def test_accuracy_queue_reuses_existing_finding_authority(tmp_path: Path) -> None:
    findings, packets = write_inputs(tmp_path)
    rows = build_queue(findings, packets, workflow="accuracy_review")
    assert len(rows) == 1
    assert rows[0]["review_topic"] == "industrial_grade"
    assert rows[0]["brand"] == "Columbia Tools"
    assert rows[0]["mpn"] == "MPN-1"
    assert rows[0]["specification_count"] == "1"
    assert rows[0]["protected_identity_sha256"] == "abc123"
    assert rows[0]["generation_eligible"] == "true"
    assert rows[0]["product_type"] == "simple"
    assert rows[0]["parent_sku"] == ""


def test_editorial_queue_is_separate_from_accuracy_queue(tmp_path: Path) -> None:
    findings, packets = write_inputs(tmp_path)
    rows = build_queue(findings, packets, workflow="editorial_review")
    assert len(rows) == 1
    assert rows[0]["review_topic"] == "job_site"
    assert rows[0]["workflow"] == "editorial_review"
