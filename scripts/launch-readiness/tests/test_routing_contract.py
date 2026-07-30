"""Regression checks for the storefront/native-checkout route boundary."""

from __future__ import annotations

import re
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]


class RoutingContractTests(unittest.TestCase):
    def test_production_build_selects_the_canonical_root_htaccess(self) -> None:
        webpack_config = (
            REPOSITORY_ROOT / "frontend" / "webpack.config.cjs"
        ).read_text(encoding="utf-8")

        self.assertIn(
            "path.resolve(__dirname, '..', 'drywalltoolbox', '.htaccess')",
            webpack_config,
        )
        self.assertIn("from: htaccessSource", webpack_config)

    def test_frontend_build_keeps_cart_in_the_spa(self) -> None:
        htaccess = (REPOSITORY_ROOT / "frontend" / "public" / ".htaccess").read_text(
            encoding="utf-8"
        )

        self.assertNotRegex(
            htaccess,
            re.compile(r"^\s*RewriteRule\s+\^cart", re.MULTILINE),
        )
        self.assertNotRegex(
            htaccess,
            re.compile(
                r"^\s*RewriteCond\s+%\{REQUEST_URI\}\s+!\^/\([^)]*\bcart\b",
                re.MULTILINE,
            ),
        )

    def test_frontend_build_routes_native_checkout_to_wordpress(self) -> None:
        htaccess = (REPOSITORY_ROOT / "frontend" / "public" / ".htaccess").read_text(
            encoding="utf-8"
        )

        self.assertRegex(
            htaccess,
            re.compile(
                r"^\s*RewriteRule\s+\^checkout/\?\$\s+"
                r"wp/index\.php\?pagename=checkout\s+\[QSA,L\]$",
                re.MULTILINE,
            ),
        )
        self.assertRegex(
            htaccess,
            re.compile(
                r"^\s*RewriteRule\s+\^checkout/order-received/"
                r"\(\[0-9\]\+\)/\?\$\s+"
                r"wp/index\.php\?pagename=checkout&order-received=\$1\s+"
                r"\[QSA,L\]$",
                re.MULTILINE,
            ),
        )


if __name__ == "__main__":
    unittest.main()
