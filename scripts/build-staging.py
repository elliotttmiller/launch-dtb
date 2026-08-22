#!/usr/bin/env python3
"""Build the HostGator /staging/2972 frontend artifact.

This wrapper invokes the repository-owned npm staging contract instead of
duplicating webpack/environment flags in a second build authority.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
REPOSITORY_ROOT = SCRIPT_DIR.parent
FRONTEND_ROOT = REPOSITORY_ROOT / "frontend"
OUTPUT_ROOT = REPOSITORY_ROOT / "dist-staging"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build Drywall Toolbox for https://drywalltoolbox.com/staging/2972/.",
    )
    parser.add_argument(
        "--install",
        action="store_true",
        help="Run npm ci before building. Omit for the normal repeatable build.",
    )
    return parser.parse_args()


def npm_executable() -> str:
    executable = shutil.which("npm.cmd" if sys.platform == "win32" else "npm")
    if not executable:
        raise RuntimeError("npm was not found on PATH. Install the repository Node.js version first.")
    return executable


def run(command: list[str]) -> None:
    print(f"[staging-build] Running: {' '.join(command)}", flush=True)
    subprocess.run(command, cwd=FRONTEND_ROOT, check=True)


def assert_repository_shape() -> None:
    required = [
        FRONTEND_ROOT / "package.json",
        FRONTEND_ROOT / "package-lock.json",
        FRONTEND_ROOT / ".env.staging",
        REPOSITORY_ROOT / "drywalltoolbox" / "htaccess.hostgator-staging",
        REPOSITORY_ROOT / "drywalltoolbox" / "wp" / "htaccess.hostgator-staging",
        REPOSITORY_ROOT / "drywalltoolbox" / "wp" / "wp-config-staging-sample.php",
    ]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise RuntimeError("Required staging build files are missing:\n- " + "\n- ".join(missing))


def assert_output() -> None:
    expected = [
        OUTPUT_ROOT / "index.html",
        OUTPUT_ROOT / ".htaccess",
        OUTPUT_ROOT / "asset-manifest.json",
        OUTPUT_ROOT / "site.webmanifest",
    ]
    missing = [str(path) for path in expected if not path.is_file()]
    if missing:
        raise RuntimeError("Staging build completed without required artifacts:\n- " + "\n- ".join(missing))


def main() -> int:
    args = parse_args()
    assert_repository_shape()
    npm = npm_executable()

    if args.install:
        run([npm, "ci"])
    elif not (FRONTEND_ROOT / "node_modules").is_dir():
        raise RuntimeError("frontend/node_modules is missing. Run this script once with --install.")

    run([npm, "run", "build:staging"])
    assert_output()

    print("[staging-build] Complete.")
    print(f"[staging-build] Upload the CONTENTS of: {OUTPUT_ROOT}")
    print("[staging-build] HostGator destination: /public_html/drywalltoolbox/staging/2972/")
    print("[staging-build] WordPress core remains server-owned under: /public_html/drywalltoolbox/staging/2972/wp/")
    print("[staging-build] Keep its .htaccess synchronized from: drywalltoolbox/wp/htaccess.hostgator-staging")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"[staging-build] ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
