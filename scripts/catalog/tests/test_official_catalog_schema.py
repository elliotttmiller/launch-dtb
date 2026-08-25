from __future__ import annotations

import csv
import sys
from pathlib import Path

import pytest

CATALOG_DIR = Path(__file__).resolve().parents[1]
if str(CATALOG_DIR) not in sys.path:
    sys.path.insert(0, str(CATALOG_DIR))

from official_catalog_schema import (  # noqa: E402
    CatalogValidationError,
    _load_gap_audit,
    create_catalog_backup,
    write_catalog_atomic,
)


def test_missing_gap_audit_means_no_approved_exceptions(tmp_path: Path) -> None:
    assert _load_gap_audit(tmp_path / "missing.json") == {}


def test_existing_invalid_gap_audit_is_blocking(tmp_path: Path) -> None:
    path = tmp_path / "gaps.json"
    path.write_text("{}", encoding="utf-8")
    with pytest.raises(CatalogValidationError):
        _load_gap_audit(path)


def test_run_scoped_backup_preserves_exact_catalog_bytes(tmp_path: Path) -> None:
    catalog = tmp_path / "catalog.csv"
    catalog.write_bytes(b"\xef\xbb\xbfA,B\r\n1,2\r\n")
    backup = tmp_path / "run" / "before.csv"

    result = create_catalog_backup(catalog, backup)

    assert result == backup
    assert backup.read_bytes() == catalog.read_bytes()


def test_atomic_writer_uses_canonical_utf8_bom_and_crlf(tmp_path: Path) -> None:
    catalog = tmp_path / "catalog.csv"
    write_catalog_atomic(catalog, ["A", "B"], [{"A": "1", "B": "two,three"}])

    payload = catalog.read_bytes()
    assert payload.startswith(b"\xef\xbb\xbf")
    assert payload.count(b"\r\n") == 2
    with catalog.open("r", encoding="utf-8-sig", newline="") as handle:
        assert list(csv.DictReader(handle)) == [{"A": "1", "B": "two,three"}]
