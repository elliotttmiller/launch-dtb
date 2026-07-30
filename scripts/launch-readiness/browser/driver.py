"""Thin Playwright wrapper used by every workflow.

Deliberately small: one browser, one context per run, real navigation and
real clicks. No page-object framework, no plugin system — just the handful
of helpers every workflow needs (navigate + capture console/HTTP errors,
screenshot on failure).
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import Page, sync_playwright

if TYPE_CHECKING:
    from config import Config

# Allows pinning a specific Chromium binary (e.g. a pre-provisioned sandbox
# browser whose revision doesn't match the installed `playwright` package's
# expected default). Falls back to Playwright's normal resolution everywhere
# else.
_CHROMIUM_OVERRIDE = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE") or (
    "/opt/pw-browsers/chromium" if Path("/opt/pw-browsers/chromium").exists() else None
)

# Standard proxy environment variables. Chromium does not read these itself
# (unlike `requests`/curl), so an outbound HTTP(S) proxy required by the host
# network has to be handed to Playwright explicitly.
_PROXY_URL = (
    os.environ.get("HTTPS_PROXY")
    or os.environ.get("https_proxy")
    or os.environ.get("HTTP_PROXY")
    or os.environ.get("http_proxy")
)


@dataclass(slots=True)
class PageVisitResult:
    url: str
    label: str
    http_status: int | None
    ok: bool
    console_errors: list[str] = field(default_factory=list)
    error: str | None = None
    body_char_count: int = 0


class Browser:
    """A single headless-Chromium session shared across all workflows in a run."""

    def __init__(self, config: "Config", screenshots_dir: Path) -> None:
        self._config = config
        self._screenshots_dir = screenshots_dir
        self._playwright = None
        self._browser = None
        self._context = None
        self.page: Page | None = None
        self._console_errors: list[str] = []

    def __enter__(self) -> "Browser":
        self._playwright = sync_playwright().start()
        launch_kwargs: dict = {
            "headless": self._config.headless,
            "slow_mo": self._config.slow_mo_ms or None,
        }
        if _CHROMIUM_OVERRIDE:
            launch_kwargs["executable_path"] = _CHROMIUM_OVERRIDE
        if _PROXY_URL:
            launch_kwargs["proxy"] = {"server": _PROXY_URL}
        self._browser = self._playwright.chromium.launch(**launch_kwargs)
        self._new_context()
        return self

    def _new_context(self) -> None:
        assert self._browser is not None
        self._context = self._browser.new_context(
            viewport={"width": 1440, "height": 900},
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) LaunchReadinessSuite/1.0 Chrome/124 Safari/537.36"
            ),
            ignore_https_errors=self._config.browser_ignore_https_errors,
        )
        self._context.set_default_timeout(self._config.browser_timeout_ms)
        self.page = self._context.new_page()
        self.page.on("console", self._on_console)
        self.page.on("pageerror", self._on_page_error)

    def __exit__(self, exc_type, exc, tb) -> None:
        if self._context is not None:
            self._context.close()
        if self._browser is not None:
            self._browser.close()
        if self._playwright is not None:
            self._playwright.stop()

    def _on_console(self, message) -> None:
        if message.type == "error":
            self._console_errors.append(message.text)

    def _on_page_error(self, exc) -> None:
        self._console_errors.append(str(exc))

    def reset_session(self) -> Page:
        """Start an isolated browser context with no cookies or local state."""

        if self._context is not None:
            self._context.close()
        self._console_errors = []
        self._new_context()
        assert self.page is not None
        return self.page

    def visit(self, url: str, label: str, min_body_chars: int = 200) -> PageVisitResult:
        """Navigate to `url` and capture status, console errors, and blank-page risk."""

        assert self.page is not None
        self._console_errors = []
        try:
            response = self.page.goto(url, wait_until="networkidle")
        except PlaywrightError as exc:
            return PageVisitResult(url=url, label=label, http_status=None, ok=False, error=str(exc))

        status = response.status if response else None
        body_text = self.page.inner_text("body") if self.page else ""
        body_chars = len(body_text.strip())
        ok = bool(status and status < 400 and body_chars >= min_body_chars)

        return PageVisitResult(
            url=url,
            label=label,
            http_status=status,
            ok=ok,
            console_errors=list(self._console_errors),
            body_char_count=body_chars,
        )

    def screenshot(self, name: str) -> Path | None:
        assert self.page is not None
        self._screenshots_dir.mkdir(parents=True, exist_ok=True)
        path = self._screenshots_dir / f"{name}.png"
        try:
            self.page.screenshot(path=str(path), full_page=True)
        except PlaywrightError:
            return None
        return path
