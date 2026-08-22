#!/usr/bin/env python3
"""Validate the local environment and required inputs for catalog workflows."""

from __future__ import annotations

import argparse
import importlib.util
import json
import platform
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CATALOG = ROOT / "products" / "launch" / "official" / "dtb_official_catalog.csv"
DEFAULT_OUTPUT = ROOT / "products" / "dev" / "catalog-enrichment"
REQUIRED_INPUTS = {
    "core": (),
    "compatibility": (
        ROOT / "products" / "launch" / "universal_parts" / "references" / "all_brands_schematic_parts_master.csv",
        ROOT / "frontend" / "src" / "data" / "productSchematicLinks.generated.js",
        ROOT / "scripts" / "catalog" / "data" / "schematic_verbose_id_map.json",
    ),
    "media": (ROOT / "products" / "launch" / "media" / "media",),
    "competitor": (),
    "test": (),
}
DEPENDENCIES = {
    "core": (),
    "compatibility": (),
    "media": (("PIL", "Pillow"),),
    "competitor": (
        ("bs4", "beautifulsoup4"),
        ("cloudscraper", "cloudscraper"),
        ("rapidfuzz", "rapidfuzz"),
    ),
    "test": (("pytest", "pytest"),),
}


def contained(path: Path, root: Path) -> bool:
    try:
        path.resolve().relative_to(root.resolve())
    except ValueError:
        return False
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--profile",
        choices=("core", "compatibility", "media", "competitor", "test", "all"),
        default="core",
    )
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    profiles = tuple(REQUIRED_INPUTS) if args.profile == "all" else (args.profile,)
    catalog = args.catalog.resolve()
    output = args.output_dir.resolve()
    errors: list[str] = []

    if sys.version_info < (3, 11):
        errors.append(f"Python 3.11 or newer is required; found {platform.python_version()}")
    if not catalog.is_file():
        errors.append(f"catalog is missing: {catalog}")
    if not contained(output, ROOT / "products" / "dev"):
        errors.append(f"output directory must remain under products/dev: {output}")

    checked_inputs: list[str] = []
    checked_dependencies: list[str] = []
    for profile in profiles:
        for path in REQUIRED_INPUTS[profile]:
            checked_inputs.append(path.relative_to(ROOT).as_posix())
            if not path.exists():
                errors.append(f"required {profile} input is missing: {path}")
        for module, package in DEPENDENCIES[profile]:
            checked_dependencies.append(package)
            if importlib.util.find_spec(module) is None:
                errors.append(f"required {profile} package is unavailable: {package}")

    summary = {
        "schema_version": 1,
        "status": "failed" if errors else "passed",
        "python": platform.python_version(),
        "profile": args.profile,
        "catalog": catalog.relative_to(ROOT).as_posix() if contained(catalog, ROOT) else str(catalog),
        "output_dir": output.relative_to(ROOT).as_posix() if contained(output, ROOT) else str(output),
        "checked_inputs": sorted(set(checked_inputs)),
        "checked_dependencies": sorted(set(checked_dependencies)),
        "errors": errors,
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
