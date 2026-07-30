"""Stage 2 — Website Crawl.

Visits every essential public page with a real browser and confirms it
returns success, renders actual content, and does not throw console errors.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import tui
from config import ESSENTIAL_PAGES
from reports.models import StageResult, Status

if TYPE_CHECKING:
    from browser import Browser
    from config import Config

STAGE_NAME = "Website Crawl"


def run(config: "Config", browser: "Browser") -> StageResult:
    stage = StageResult(name=STAGE_NAME)

    for path, label in ESSENTIAL_PAGES:
        url = f"{config.site_url}{path}"

        def check(url=url, label=label, path=path):
            result = browser.visit(url, label)
            if result.error:
                return Status.FAIL, f"{url} -> {result.error}"
            if result.http_status is None or result.http_status >= 500:
                return Status.FAIL, f"{url} -> HTTP {result.http_status}"
            if result.http_status >= 400:
                return Status.WARN, f"{url} -> HTTP {result.http_status}"
            if result.body_char_count < 200:
                if path in {"/cart", "/checkout"}:
                    return Status.SKIP, (
                        f"{url} -> HTTP {result.http_status}; expected empty guest-session "
                        "surface because the crawl has no cart items"
                    )
                return Status.FAIL, f"{url} -> HTTP {result.http_status} but page appears blank ({result.body_char_count} chars)"
            if result.console_errors:
                sample = "; ".join(result.console_errors[:3])
                return Status.WARN, f"{url} -> HTTP {result.http_status}, {len(result.console_errors)} console error(s): {sample}"
            return Status.PASS, f"{url} -> HTTP {result.http_status}, {result.body_char_count} chars rendered"

        tui.run_step(stage, label, check)

    return stage
