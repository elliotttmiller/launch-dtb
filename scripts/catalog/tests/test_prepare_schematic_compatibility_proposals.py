from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from prepare_schematic_compatibility_proposals import (
    build_tool_index,
    canonical_tool_sku,
    prepare_proposals,
)


def row(
    sku: str,
    *,
    name: str = "Product",
    type_: str = "simple",
    is_part: str = "0",
    parent: str = "",
    compatible: str = "",
    replacement: str = "",
) -> dict[str, str]:
    return {
        "SKU": sku,
        "Name": name,
        "Type": type_,
        "Meta: _dtb_is_parts": is_part,
        "Meta: _dtb_parent_product_sku": parent,
        "Meta: _dtb_compatible_tool_skus": compatible,
        "Meta: _dtb_replacement_part_for": replacement,
    }


def write_master(path: Path, rows: list[dict[str, str]]) -> None:
    fields = ["brand", "schematic_id", "product_sku", "source_file_from_brands"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def test_variation_tool_collapses_to_non_part_parent() -> None:
    catalog = {
        "TOOL-PARENT": row("TOOL-PARENT", type_="variable"),
        "TOOL-10": row("TOOL-10", type_="variation", parent="TOOL-PARENT"),
    }
    assert canonical_tool_sku("TOOL-10", catalog) == "TOOL-PARENT"


def test_part_sku_is_never_a_tool_target() -> None:
    catalog = {"PART-1": row("PART-1", is_part="1")}
    assert canonical_tool_sku("PART-1", catalog) is None


def test_tool_index_deduplicates_variations_to_parent() -> None:
    catalog = {
        "TOOL-PARENT": row("TOOL-PARENT", type_="variable"),
        "TOOL-10": row("TOOL-10", type_="variation", parent="TOOL-PARENT"),
        "TOOL-12": row("TOOL-12", type_="variation", parent="TOOL-PARENT"),
    }
    links = {
        "TOOL-10": {"schematicId": "schematic-a"},
        "TOOL-12": {"schematicId": "schematic-a"},
    }
    assert build_tool_index(links, catalog) == {"schematic-a": ["TOOL-PARENT"]}


def test_exact_shared_schematic_produces_single_tool_proposal(tmp_path: Path) -> None:
    master = tmp_path / "master.csv"
    write_master(
        master,
        [
            {
                "brand": "Columbia Taping Tools",
                "schematic_id": "columbia-hydra-handle",
                "product_sku": "HH19",
                "source_file_from_brands": "Columbia/Handles/Hydra.pdf",
            }
        ],
    )
    catalog = {
        "HH19": row("HH19", name="Cap", is_part="1"),
        "HYDRA": row("HYDRA", name="Hydra-Reach Handle"),
    }
    proposals = prepare_proposals(
        catalog=catalog,
        master_path=master,
        tool_index={"columbia-hydra-handle": ["HYDRA"]},
        brand_filter="Columbia",
    )
    assert len(proposals) == 1
    assert proposals[0]["status"] == "proposal_exact"
    assert json.loads(proposals[0]["target_tool_skus"]) == ["HYDRA"]
    assert proposals[0]["source_file"] == "Columbia/Handles/Hydra.pdf"


def test_multi_tool_schematic_is_review_only(tmp_path: Path) -> None:
    master = tmp_path / "master.csv"
    write_master(
        master,
        [
            {
                "brand": "Columbia Tools",
                "schematic_id": "shared-schematic",
                "product_sku": "PART-1",
                "source_file_from_brands": "Columbia/shared.pdf",
            }
        ],
    )
    catalog = {"PART-1": row("PART-1", is_part="1")}
    proposals = prepare_proposals(
        catalog=catalog,
        master_path=master,
        tool_index={"shared-schematic": ["TOOL-A", "TOOL-B"]},
        brand_filter="Columbia",
    )
    assert proposals[0]["status"] == "review_multi_tool"
    assert json.loads(proposals[0]["target_tool_skus"]) == ["TOOL-A", "TOOL-B"]


def test_existing_relationship_is_not_reproposed(tmp_path: Path) -> None:
    master = tmp_path / "master.csv"
    write_master(
        master,
        [
            {
                "brand": "Columbia Tools",
                "schematic_id": "schematic-a",
                "product_sku": "PART-1",
                "source_file_from_brands": "Columbia/a.pdf",
            }
        ],
    )
    catalog = {"PART-1": row("PART-1", is_part="1", compatible="TOOL-A")}
    proposals = prepare_proposals(
        catalog=catalog,
        master_path=master,
        tool_index={"schematic-a": ["TOOL-A"]},
        brand_filter="Columbia",
    )
    assert proposals[0]["status"] == "already_populated"


def test_unknown_part_sku_is_not_invented(tmp_path: Path) -> None:
    master = tmp_path / "master.csv"
    write_master(
        master,
        [
            {
                "brand": "Columbia Tools",
                "schematic_id": "schematic-a",
                "product_sku": "NOT-IN-CATALOG",
                "source_file_from_brands": "Columbia/a.pdf",
            }
        ],
    )
    proposals = prepare_proposals(
        catalog={},
        master_path=master,
        tool_index={"schematic-a": ["TOOL-A"]},
        brand_filter="Columbia",
    )
    assert proposals == []
