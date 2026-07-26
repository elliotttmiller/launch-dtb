from __future__ import annotations

from pathlib import Path

from textual import on, work
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.screen import ModalScreen
from textual.widgets import Button, Footer, Header, Label, Log, Static

from .config import AppConfig, load_config
from .deployer import DeploymentEngine, DeploymentPlan


class ConfirmDeploy(ModalScreen[bool]):
    CSS = """
    ConfirmDeploy { align: center middle; }
    #confirm-box { width: 66; height: 14; border: heavy $warning; background: $surface; padding: 1 2; }
    #confirm-actions { height: 3; align: center middle; }
    Button { margin: 0 1; }
    """

    def compose(self) -> ComposeResult:
        with Vertical(id="confirm-box"):
            yield Label("PRODUCTION DEPLOYMENT GATE", classes="title")
            yield Static("The inspected delta will be synchronized to SiteGround production. Protected paths remain excluded and remote deletion is disabled.")
            with Horizontal(id="confirm-actions"):
                yield Button("Cancel", id="cancel")
                yield Button("Deploy", id="deploy", variant="error")

    @on(Button.Pressed, "#cancel")
    def cancel(self) -> None:
        self.dismiss(False)

    @on(Button.Pressed, "#deploy")
    def deploy(self) -> None:
        self.dismiss(True)


class DeploymentApp(App[None]):
    TITLE = "Drywall Toolbox // SiteGround Deployment"
    SUB_TITLE = "Local Control Plane"
    CSS = """
    Screen { background: #07111f; color: #d8e7ff; }
    Header { background: #0b1b31; color: #70d7ff; }
    #shell { height: 1fr; }
    #sidebar { width: 30; border-right: solid #21486f; padding: 1; background: #091626; }
    #content { width: 1fr; padding: 1 2; }
    .brand { color: #70d7ff; text-style: bold; margin-bottom: 1; }
    .status { color: #8aa8c7; margin-bottom: 1; }
    Button { width: 26; margin: 0 0 1 0; }
    #log { border: round #21486f; height: 1fr; background: #040b13; }
    #summary { height: 7; border: round #21486f; padding: 1; margin-bottom: 1; }
    Footer { background: #0b1b31; }
    """
    BINDINGS = [("q", "quit", "Quit"), ("d", "dry_run", "Dry Run"), ("p", "deploy", "Deploy")]

    def __init__(self, config_path: Path):
        super().__init__()
        self.config_path = config_path
        self.config: AppConfig | None = None
        self.engine: DeploymentEngine | None = None
        self.plan: DeploymentPlan | None = None

    def compose(self) -> ComposeResult:
        yield Header()
        with Horizontal(id="shell"):
            with Vertical(id="sidebar"):
                yield Static("DRYWALL TOOLBOX", classes="brand")
                yield Static("SITEGROUND // PRODUCTION", classes="status")
                yield Button("1  Preflight", id="preflight", variant="primary")
                yield Button("2  Build", id="build")
                yield Button("3  Dry Run", id="dry-run", variant="warning")
                yield Button("4  Deploy", id="deploy", variant="error")
                yield Button("5  Validate", id="validate", variant="success")
                yield Button("Clear Log", id="clear")
            with Vertical(id="content"):
                yield Static("Configuration loading…", id="summary")
                yield Log(id="log", highlight=True, auto_scroll=True)
        yield Footer()

    async def on_mount(self) -> None:
        try:
            self.config = load_config(self.config_path)
            self.engine = DeploymentEngine(self.config, self.write_log)
            self.query_one("#summary", Static).update(
                f"[b]Target[/b]  {self.config.ssh.user}@{self.config.ssh.host}:{self.config.ssh.port}\n"
                f"[b]Root[/b]    {self.config.remote.site_root}\n"
                f"[b]Mode[/b]    key-only SSH · rsync checksum delta · no remote deletion"
            )
            await self.write_log("success", "Verified scan contract loaded")
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error", timeout=10)

    async def write_log(self, kind: str, message: str) -> None:
        palette = {
            "command": "cyan",
            "stdout": "white",
            "stderr": "yellow",
            "section": "bold bright_cyan",
            "success": "bold green",
            "error": "bold red",
        }
        style = palette.get(kind, "white")
        self.query_one("#log", Log).write_line(f"[{style}]{kind.upper():>7}[/]  {message}")

    def require_engine(self) -> DeploymentEngine:
        if self.engine is None:
            raise RuntimeError("Deployment engine is unavailable")
        return self.engine

    @on(Button.Pressed, "#clear")
    def clear_log(self) -> None:
        self.query_one("#log", Log).clear()

    @on(Button.Pressed, "#preflight")
    def preflight_pressed(self) -> None:
        self.run_preflight()

    @work(exclusive=True)
    async def run_preflight(self) -> None:
        try:
            commit = await self.require_engine().preflight()
            await self.write_log("success", f"Preflight passed at {commit[:12]}")
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error")

    @on(Button.Pressed, "#build")
    def build_pressed(self) -> None:
        self.run_build()

    @work(exclusive=True)
    async def run_build(self) -> None:
        try:
            await self.require_engine().build()
            await self.write_log("success", "Production storefront build passed")
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error")

    @on(Button.Pressed, "#dry-run")
    def dry_run_pressed(self) -> None:
        self.action_dry_run()

    def action_dry_run(self) -> None:
        self.run_dry_run()

    @work(exclusive=True)
    async def run_dry_run(self) -> None:
        try:
            self.plan = await self.require_engine().dry_run()
            await self.write_log("success", f"Dry run complete: {self.plan.release_id}")
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error")

    @on(Button.Pressed, "#deploy")
    def deploy_pressed(self) -> None:
        self.action_deploy()

    def action_deploy(self) -> None:
        if self.plan is None:
            self.notify("Run Dry Run before deployment", severity="warning")
            return
        self.push_screen(ConfirmDeploy(), self.confirmed_deploy)

    def confirmed_deploy(self, confirmed: bool | None) -> None:
        if confirmed:
            self.run_deploy()

    @work(exclusive=True)
    async def run_deploy(self) -> None:
        try:
            assert self.plan is not None
            await self.require_engine().deploy(self.plan)
            await self.write_log("success", f"Release deployed: {self.plan.release_id}")
            self.plan = None
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error", timeout=10)

    @on(Button.Pressed, "#validate")
    def validate_pressed(self) -> None:
        self.run_validate()

    @work(exclusive=True)
    async def run_validate(self) -> None:
        try:
            await self.require_engine().validate_remote()
            await self.write_log("success", "Production validation passed")
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error")
