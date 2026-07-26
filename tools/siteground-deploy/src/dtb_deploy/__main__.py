from __future__ import annotations

import argparse
from pathlib import Path

from .app import DeploymentApp


def main() -> None:
    parser = argparse.ArgumentParser(description="Drywall Toolbox SiteGround deployment TUI")
    parser.add_argument(
        "--config",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "config.production.json",
        help="Path to deployment configuration JSON",
    )
    args = parser.parse_args()
    DeploymentApp(args.config).run()


if __name__ == "__main__":
    main()
