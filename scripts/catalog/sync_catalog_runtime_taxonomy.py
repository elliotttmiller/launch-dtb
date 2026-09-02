#!/usr/bin/env python3
"""Check or refresh the deployed MU-plugin taxonomy projection."""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT / "products/catalog/source/taxonomy.json"
DEFAULT_RUNTIME = ROOT / "drywalltoolbox/wp/wp-content/mu-plugins/dtb-catalog-platform/Resources/catalog-taxonomy.json"


def validate(payload: bytes) -> None:
    data = json.loads(payload.decode("utf-8"))
    taxa = data.get("taxa")
    if not isinstance(taxa, list) or not taxa:
        raise ValueError("taxonomy projection must contain a non-empty taxa list")
    keys = [str(item.get("key", "")) for item in taxa]
    slugs = [str(item.get("slug", "")) for item in taxa]
    if "" in keys or len(keys) != len(set(keys)) or "" in slugs or len(slugs) != len(set(slugs)):
        raise ValueError("taxonomy projection contains missing or duplicate keys/slugs")


def write_atomic(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(payload)
        os.replace(name, path)
    finally:
        Path(name).unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--runtime", type=Path, default=DEFAULT_RUNTIME)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    source = args.source.resolve()
    runtime = args.runtime.resolve()
    payload = source.read_bytes()
    validate(payload)
    synchronized = runtime.exists() and runtime.read_bytes() == payload

    if args.apply and not synchronized:
        write_atomic(runtime, payload)
        synchronized = runtime.read_bytes() == payload

    print(json.dumps({"source": str(source), "runtime": str(runtime), "synchronized": synchronized, "applied": bool(args.apply)}, sort_keys=True))
    return 0 if synchronized else 1


if __name__ == "__main__":
    raise SystemExit(main())
