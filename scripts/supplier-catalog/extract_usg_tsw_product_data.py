"""Inspect USG Sheetrock Tools records in the TSW product-data workbook."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
from xml.etree import ElementTree
from zipfile import ZipFile


NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
OUTPUT_FIELDS = ["brand", "name", "sku", "weight", "length", "width", "height", "supplier_sku", "category"]
BRAND = "USG Sheetrock Tools"


def column_index(cell_ref: str) -> int:
    letters = "".join(character for character in cell_ref if character.isalpha())
    result = 0
    for character in letters:
        result = result * 26 + ord(character.upper()) - ord("A") + 1
    return result - 1


def workbook_rows(path: Path):
    with ZipFile(path) as archive:
        shared_root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
        shared = ["".join(node.itertext()) for node in shared_root.findall(f"{NS}si")]
        sheet_root = ElementTree.fromstring(archive.read("xl/worksheets/sheet1.xml"))
    for row in sheet_root.findall(f".//{NS}sheetData/{NS}row"):
        values = {}
        for cell in row.findall(f"{NS}c"):
            value_node = cell.find(f"{NS}v")
            if value_node is None:
                value = ""
            elif cell.get("t") == "s":
                value = shared[int(value_node.text or "0")]
            else:
                value = value_node.text or ""
            values[column_index(cell.get("r", "A1"))] = value
        yield values


def clean_number(value: object) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    try:
        return format(float(text), ".12g")
    except ValueError:
        return text


def extract_usg_records(workbook: Path) -> list[dict[str, str]]:
    rows = workbook_rows(workbook)
    header_cells = next(rows)
    headers = [str(header_cells.get(index, "")).strip() for index in range(max(header_cells) + 1)]
    records = []
    for row in rows:
        source = {header: row.get(index, "") for index, header in enumerate(headers)}
        supplier_sku = str(source.get("prod") or "").strip()
        name = str(source.get("Prod Description") or "").strip()
        if not supplier_sku.upper().startswith("USG") and "SHEETROCK" not in name.upper():
            continue
        sku = supplier_sku[3:] if supplier_sku.upper().startswith("USG") else supplier_sku
        records.append({
            "brand": BRAND,
            "name": name,
            "sku": sku,
            "weight": clean_number(source.get("weight")),
            "length": clean_number(source.get("Length")),
            "width": clean_number(source.get("Width")),
            "height": clean_number(source.get("Height")),
            "supplier_sku": supplier_sku,
            "category": str(source.get("Categaory") or "").strip(),
        })
    return sorted(records, key=lambda record: record["sku"])


def write_records(target: Path, records: list[dict[str, str]]) -> None:
    raw = target.read_bytes()
    newline = "\r\n" if b"\r\n" in raw else "\n"
    with target.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != OUTPUT_FIELDS:
            raise ValueError("Unexpected target CSV header.")
        existing = list(reader)
    retained = [row for row in existing if row.get("brand") != BRAND]
    merged = retained + records
    backup = target.with_suffix(target.suffix + ".bak")
    backup.write_bytes(raw)
    if hashlib.sha256(backup.read_bytes()).digest() != hashlib.sha256(raw).digest():
        raise RuntimeError("Target CSV backup hash verification failed.")
    with target.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS, extrasaction="raise", lineterminator=newline, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(merged)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--target", type=Path)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--inspect", action="store_true")
    args = parser.parse_args()

    usg = extract_usg_records(args.workbook)
    if args.inspect:
        print(json.dumps({"count": len(usg), "records": usg}, indent=2, default=str))
    if args.write:
        if args.target is None:
            raise ValueError("--target is required with --write.")
        if len({record["sku"] for record in usg}) != len(usg) or any(not record["sku"] for record in usg):
            raise ValueError("USG extraction has blank or duplicate SKUs.")
        write_records(args.target, usg)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
