from __future__ import annotations

from pathlib import Path
from tkinter import Tk, filedialog

from textual import on, work
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.screen import ModalScreen
from textual.widgets import Button, Footer, Header, Input, Label, Static, TextArea

from .config import AppConfig, load_config
from .deployer import DeploymentEngine, DeploymentPlan


class ConfirmDeploy(ModalScreen[bool]):
    CSS = """
    ConfirmDeploy { align: center middle; }
    #confirm-box { width: 72; height: 16; border: heavy $warning; background: $surface; padding: 1 2; }
    #confirm-actions { height: 3; align: center middle; }
    Button { margin: 0 1; }
    """

    def compose(self) -> ComposeResult:
        with Vertical(id="confirm-box"):
            yield Label("PRODUCTION TRANSFER GATE")
            yield Static(
                "Only the previewed ADD/MODIFY files will be transferred over FTPES. "
                "Existing files are backed up locally, uploads are checksum-verified, "
                "protected paths are blocked, remote deletion is disabled, and failed "
                "transactions attempt rollback."
            )
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
    TITLE = "Drywall Toolbox // SiteGround File Transfer"
    SUB_TITLE = "Windows FTPES Control Plane"
    CSS = """
    Screen { background: #07111f; color: #d8e7ff; }
    Header { background: #0b1b31; color: #70d7ff; }
    #shell { height: 1fr; }
    #sidebar { width: 30; border-right: solid #21486f; padding: 1; background: #091626; }
    #content { width: 1fr; padding: 1 2; }
    .brand { color: #70d7ff; text-style: bold; margin-bottom: 1; }
    .status { color: #8aa8c7; margin-bottom: 1; }
    Button { width: 26; margin: 0 0 1 0; }
    #selection { height: 11; border: round #21486f; padding: 1; margin-bottom: 1; }
    #selection-actions { height: 3; }
    #selection-actions Button { width: 18; margin-right: 1; }
    Input { margin-bottom: 1; }
    #log { border: round #21486f; height: 1fr; background: #040b13; }
    #summary { height: 7; border: round #21486f; padding: 1; margin-bottom: 1; }
    Footer { background: #0b1b31; }
    """
    BINDINGS = [
        ("q", "quit", "Quit"),
        ("r", "preview", "Preview"),
        ("p", "deploy", "Deploy"),
        ("ctrl+shift+c", "copy_log", "Copy Log"),
    ]

    def __init__(self, config_path: Path):
        super().__init__()
        self.config_path = config_path
        self.config: AppConfig | None = None
        self.engine: DeploymentEngine | None = None
        self.plan: DeploymentPlan | None = None
        self.log_lines: list[str] = []

    def compose(self) -> ComposeResult:
        yield Header()
        with Horizontal(id="shell"):
            with Vertical(id="sidebar"):
                yield Static("DRYWALL TOOLBOX", classes="brand")
                yield Static("SITEGROUND // PRODUCTION", classes="status")
                yield Button("1  Preflight", id="preflight", variant="primary")
                yield Button("2  Preview Transfer", id="preview", variant="warning")
                yield Button("3  Deploy", id="deploy", variant="error")
                yield Button("4  Validate", id="validate", variant="success")
                yield Button("Copy Log", id="copy-log")
                yield Button("Clear Log", id="clear")
            with Vertical(id="content"):
                yield Static("Configuration loading…", id="summary")
                with Vertical(id="selection"):
                    yield Label("Local source file or directory")
                    yield Input(placeholder=r"C:\path\to\file-or-directory", id="local-source")
                    with Horizontal(id="selection-actions"):
                        yield Button("Select File", id="select-file")
                        yield Button("Select Directory", id="select-directory")
                    yield Label("Remote destination relative to FTP root")
                    yield Input(placeholder="wp/wp-content/mu-plugins", id="remote-destination")
                yield TextArea("", id="log", read_only=True, show_line_numbers=False, soft_wrap=False)
        yield Footer()

    async def on_mount(self) -> None:
        try:
            self.config = load_config(self.config_path)
            self.engine = DeploymentEngine(self.config, self.write_log)
            self.query_one("#summary", Static).update(
                f"[b]Target[/b]  {self.config.ftp.user}@{self.config.ftp.host}:{self.config.ftp.port}\n"
                f"[b]Root[/b]    {self.config.ftp.root()}\n"
                f"[b]Mode[/b]    Operator-selected FTPES transfer · SHA-256 verification · rollback"
            )
            await self.write_log("success", "FTPES transfer configuration loaded")
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error", timeout=10)

    async def write_log(self, kind: str, message: str) -> None:
        for line in str(message).splitlines() or [""]:
            self.log_lines.append(f"{kind.upper():>7}  {line}")
        console = self.query_one("#log", TextArea)
        console.text = "\n".join(self.log_lines)
        console.move_cursor((max(len(self.log_lines) - 1, 0), 0))

    def require_engine(self) -> DeploymentEngine:
        if self.engine is None:
            raise RuntimeError("Deployment engine is unavailable")
        return self.engine

    def _choose_path(self, *, directory: bool) -> None:
        root = Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        try:
            selected = filedialog.askdirectory() if directory else filedialog.askopenfilename()
        finally:
            root.destroy()
        if selected:
            self.query_one("#local-source", Input).value = selected
            self.plan = None

    @on(Button.Pressed, "#select-file")
    def select_file(self) -> None:
        self._choose_path(directory=False)

    @on(Button.Pressed, "#select-directory")
    def select_directory(self) -> None:
        self._choose_path(directory=True)

    def action_copy_log(self) -> None:
        text = "\n".join(self.log_lines)
        if not text:
            self.notify("The log is empty", severity="warning")
            return
        self.copy_to_clipboard(text)
        self.notify("Complete log copied to clipboard")

    @on(Button.Pressed, "#copy-log")
    def copy_log_pressed(self) -> None:
        self.action_copy_log()

    @on(Button.Pressed, "#clear")
    def clear_log(self) -> None:
        self.log_lines.clear()
        self.query_one("#log", TextArea).text = ""

    @on(Button.Pressed, "#preflight")
    def preflight_pressed(self) -> None:
        self.run_preflight()

    @work(exclusive=True)
    async def run_preflight(self) -> None:
        try:
            result = await self.require_engine().preflight()
            await self.write_log("success", f"Preflight passed ({result})")
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error")

    @on(Button.Pressed, "#preview")
    def preview_pressed(self) -> None:
        self.action_preview()

    def action_preview(self) -> None:
        self.run_preview()

    @work(exclusive=True)
    async def run_preview(self) -> None:
        try:
            source_value = self.query_one("#local-source", Input).value.strip()
            destination = self.query_one("#remote-destination", Input).value.strip()
            if not source_value:
                raise ValueError("Select a local file or directory")
            self.plan = await self.require_engine().preview(Path(source_value), destination)
            await self.write_log("success", f"Preview complete: {len(self.plan.changes)} change(s)")
        except Exception as exc:
            self.plan = None
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error")

    @on(Button.Pressed, "#deploy")
    def deploy_pressed(self) -> None:
        self.action_deploy()

    def action_deploy(self) -> None:
        if self.plan is None:
            self.notify("Preview the transfer before deployment", severity="warning")
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
            await self.write_log("success", f"Transfer deployed: {self.plan.release_id}")
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
            await self.write_log("success", "FTPES connectivity and production health validation passed")
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error")
