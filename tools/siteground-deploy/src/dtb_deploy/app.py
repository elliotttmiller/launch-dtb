from __future__ import annotations

from pathlib import Path, PurePosixPath
from tkinter import Tk, filedialog

from textual import on, work
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.screen import ModalScreen
from textual.widgets import Button, DataTable, Footer, Header, Input, Label, Static, TextArea

from .config import AppConfig, load_config
from .deployer import DeploymentEngine, DeploymentPlan, RemoteEntry


class ConfirmDeploy(ModalScreen[bool]):
    CSS = """
    ConfirmDeploy { align: center middle; }
    #confirm-box { width: 76; height: 17; border: heavy $warning; background: $surface; padding: 1 2; }
    #confirm-actions { height: 3; align: center middle; }
    Button { margin: 0 1; }
    """

    def compose(self) -> ComposeResult:
        with Vertical(id="confirm-box"):
            yield Label("PRODUCTION TRANSFER GATE", classes="dialog-title")
            yield Static(
                "Only files in the current preview will be activated. Existing production files "
                "are backed up locally, uploads are transferred under temporary names, SHA-256 "
                "is verified before activation, protected paths are blocked, and failed transactions "
                "attempt rollback."
            )
            with Horizontal(id="confirm-actions"):
                yield Button("Cancel", id="cancel")
                yield Button("Deploy Preview", id="deploy", variant="error")

    @on(Button.Pressed, "#cancel")
    def cancel(self) -> None:
        self.dismiss(False)

    @on(Button.Pressed, "#deploy")
    def deploy(self) -> None:
        self.dismiss(True)


class DeploymentApp(App[None]):
    TITLE = "Drywall Toolbox // SiteGround File Manager"
    SUB_TITLE = "Secure Windows FTPES Deployment Console"
    CSS = """
    Screen { background: #06111e; color: #dcecff; }
    Header { background: #0a1a2d; color: #74d9ff; }
    Footer { background: #0a1a2d; }
    #shell { height: 1fr; }
    #sidebar { width: 29; border-right: solid #20486f; padding: 1; background: #081725; }
    #workspace { width: 1fr; padding: 1 2; }
    .brand { color: #74d9ff; text-style: bold; margin-bottom: 1; }
    .environment { color: #9ab4cf; margin-bottom: 1; }
    .section-title { color: #8edfff; text-style: bold; margin-bottom: 1; }
    .muted { color: #829db9; }
    Button { margin-bottom: 1; }
    #sidebar Button { width: 25; }
    #connection { height: 6; border: round #20486f; padding: 1 2; margin-bottom: 1; background: #08131f; }
    #panes { height: 23; margin-bottom: 1; }
    #local-pane, #remote-pane { width: 1fr; border: round #20486f; padding: 1; background: #07131f; }
    #local-pane { margin-right: 1; }
    #source-actions, #remote-actions { height: 3; }
    #source-actions Button { width: 16; margin-right: 1; }
    #remote-actions Button { width: 15; margin-right: 1; }
    #sources { height: 10; border: solid #173956; background: #030a11; margin-bottom: 1; }
    #remote-table { height: 12; border: solid #173956; background: #030a11; margin-bottom: 1; }
    Input { margin-bottom: 1; }
    #destination { border: tall #2e678f; }
    #plan-status { height: 3; border: round #20486f; padding: 0 1; margin-bottom: 1; }
    #log { height: 1fr; border: round #20486f; background: #030a11; }
    """
    BINDINGS = [
        ("q", "quit", "Quit"),
        ("r", "preview", "Preview"),
        ("p", "deploy", "Deploy"),
        ("f5", "refresh_remote", "Refresh Remote"),
        ("ctrl+shift+c", "copy_log", "Copy Log"),
    ]

    def __init__(self, config_path: Path):
        super().__init__()
        self.config_path = config_path
        self.config: AppConfig | None = None
        self.engine: DeploymentEngine | None = None
        self.plan: DeploymentPlan | None = None
        self.log_lines: list[str] = []
        self.selected_sources: list[Path] = []
        self.remote_path = ""
        self.remote_entries: list[RemoteEntry] = []

    def compose(self) -> ComposeResult:
        yield Header()
        with Horizontal(id="shell"):
            with Vertical(id="sidebar"):
                yield Static("DRYWALL TOOLBOX", classes="brand")
                yield Static("SITEGROUND // PRODUCTION", classes="environment")
                yield Button("Connect / Preflight", id="preflight", variant="primary")
                yield Button("Preview Transfer", id="preview", variant="warning")
                yield Button("Deploy Preview", id="deploy", variant="error")
                yield Button("Validate Production", id="validate", variant="success")
                yield Button("Copy Log", id="copy-log")
                yield Button("Clear Log", id="clear-log")
            with Vertical(id="workspace"):
                yield Static("Configuration loading…", id="connection")
                with Horizontal(id="panes"):
                    with Vertical(id="local-pane"):
                        yield Static("LOCAL SOURCES", classes="section-title")
                        yield Static("Select multiple files and/or directories.", classes="muted")
                        with Horizontal(id="source-actions"):
                            yield Button("Add Files", id="add-files")
                            yield Button("Add Directory", id="add-directory")
                            yield Button("Clear", id="clear-sources")
                        yield TextArea(
                            "No local sources selected.",
                            id="sources",
                            read_only=True,
                            show_line_numbers=False,
                            soft_wrap=True,
                        )
                    with Vertical(id="remote-pane"):
                        yield Static("LIVE SITEGROUND DESTINATION", classes="section-title")
                        yield Input(value="/", id="remote-path", disabled=True)
                        with Horizontal(id="remote-actions"):
                            yield Button("Up", id="remote-up")
                            yield Button("Open Folder", id="remote-open")
                            yield Button("Refresh", id="remote-refresh")
                            yield Button("Use Folder", id="use-folder", variant="primary")
                        yield DataTable(id="remote-table", cursor_type="row", zebra_stripes=True)
                yield Label("Resolved remote destination")
                yield Input(value="", placeholder="Choose a folder from the live remote browser", id="destination")
                yield Static("No transfer preview has been generated.", id="plan-status")
                yield TextArea("", id="log", read_only=True, show_line_numbers=False, soft_wrap=False)
        yield Footer()

    async def on_mount(self) -> None:
        table = self.query_one("#remote-table", DataTable)
        table.add_columns("Type", "Name", "Size")
        try:
            self.config = load_config(self.config_path)
            self.engine = DeploymentEngine(self.config, self.write_log)
            self.query_one("#connection", Static).update(
                f"[b]Endpoint[/b]  {self.config.ftp.connect_host}:{self.config.ftp.port}\n"
                f"[b]TLS name[/b]  {self.config.ftp.tls_hostname}\n"
                f"[b]FTP root[/b]  {self.config.ftp.root()}\n"
                f"[b]Mode[/b]      FTPES · preview gate · SHA-256 · backup · rollback"
            )
            await self.write_log("success", "FTPES file manager configuration loaded")
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

    def _invalidate_plan(self) -> None:
        self.plan = None
        self.query_one("#plan-status", Static).update("Selection changed. Generate a new preview before deployment.")

    def _render_sources(self) -> None:
        view = self.query_one("#sources", TextArea)
        if not self.selected_sources:
            view.text = "No local sources selected."
        else:
            view.text = "\n".join(f"{index + 1}. {path}" for index, path in enumerate(self.selected_sources))
        self._invalidate_plan()

    def _choose_files(self) -> None:
        root = Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        try:
            selected = filedialog.askopenfilenames(title="Select files to transfer")
        finally:
            root.destroy()
        for value in selected:
            path = Path(value).resolve()
            if path not in self.selected_sources:
                self.selected_sources.append(path)
        if selected:
            self._render_sources()

    def _choose_directory(self) -> None:
        root = Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        try:
            selected = filedialog.askdirectory(title="Select directory to transfer")
        finally:
            root.destroy()
        if selected:
            path = Path(selected).resolve()
            if path not in self.selected_sources:
                self.selected_sources.append(path)
            self._render_sources()

    @on(Button.Pressed, "#add-files")
    def add_files(self) -> None:
        self._choose_files()

    @on(Button.Pressed, "#add-directory")
    def add_directory(self) -> None:
        self._choose_directory()

    @on(Button.Pressed, "#clear-sources")
    def clear_sources(self) -> None:
        self.selected_sources.clear()
        self._render_sources()

    def _selected_remote_entry(self) -> RemoteEntry | None:
        table = self.query_one("#remote-table", DataTable)
        row = table.cursor_row
        if row is None or row < 0 or row >= len(self.remote_entries):
            return None
        return self.remote_entries[row]

    def _set_remote_path(self, path: str) -> None:
        normalized = path.strip("/")
        self.remote_path = normalized
        self.query_one("#remote-path", Input).value = f"/{normalized}" if normalized else "/"

    async def _load_remote(self, path: str) -> None:
        entries = await self.require_engine().list_remote(path)
        self.remote_entries = entries
        self._set_remote_path(path)
        table = self.query_one("#remote-table", DataTable)
        table.clear(columns=False)
        for entry in entries:
            table.add_row(
                "DIR" if entry.is_directory else "FILE",
                entry.name,
                "" if entry.size is None else f"{entry.size:,}",
            )
        await self.write_log("success", f"Loaded remote folder /{self.remote_path}" if self.remote_path else "Loaded remote FTP root /")

    @work(exclusive=True)
    async def load_remote(self, path: str) -> None:
        try:
            await self._load_remote(path)
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error")

    @on(Button.Pressed, "#remote-refresh")
    def remote_refresh(self) -> None:
        self.action_refresh_remote()

    def action_refresh_remote(self) -> None:
        self.load_remote(self.remote_path)

    @on(Button.Pressed, "#remote-up")
    def remote_up(self) -> None:
        parent = str(PurePosixPath(self.remote_path).parent)
        self.load_remote("" if parent == "." else parent)

    @on(Button.Pressed, "#remote-open")
    def remote_open(self) -> None:
        entry = self._selected_remote_entry()
        if entry is None:
            self.notify("Select a remote directory", severity="warning")
        elif not entry.is_directory:
            self.notify("The selected remote item is a file", severity="warning")
        else:
            self.load_remote(entry.path)

    @on(DataTable.RowSelected, "#remote-table")
    def remote_row_selected(self) -> None:
        entry = self._selected_remote_entry()
        if entry and entry.is_directory:
            self.query_one("#plan-status", Static).update(f"Selected remote folder: /{entry.path}")

    @on(Button.Pressed, "#use-folder")
    def use_folder(self) -> None:
        entry = self._selected_remote_entry()
        destination = entry.path if entry and entry.is_directory else self.remote_path
        self.query_one("#destination", Input).value = destination
        self._invalidate_plan()
        self.notify(f"Destination set to /{destination}" if destination else "Destination set to FTP root /")

    @on(Input.Changed, "#destination")
    def destination_changed(self) -> None:
        self._invalidate_plan()

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

    @on(Button.Pressed, "#clear-log")
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
            await self._load_remote("")
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error", timeout=10)

    @on(Button.Pressed, "#preview")
    def preview_pressed(self) -> None:
        self.action_preview()

    def action_preview(self) -> None:
        self.run_preview()

    @work(exclusive=True)
    async def run_preview(self) -> None:
        try:
            if not self.selected_sources:
                raise ValueError("Select at least one local file or directory")
            destination = self.query_one("#destination", Input).value.strip()
            self.plan = await self.require_engine().preview(self.selected_sources.copy(), destination)
            total_bytes = sum(change.size for change in self.plan.changes)
            self.query_one("#plan-status", Static).update(
                f"Preview ready: {len(self.plan.changes)} change(s), {total_bytes:,} bytes → /{self.plan.remote_destination}"
            )
            await self.write_log("success", f"Preview complete: {len(self.plan.changes)} change(s)")
        except Exception as exc:
            self.plan = None
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error", timeout=10)

    @on(Button.Pressed, "#deploy")
    def deploy_pressed(self) -> None:
        self.action_deploy()

    def action_deploy(self) -> None:
        if self.plan is None:
            self.notify("Generate and review a transfer preview first", severity="warning")
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
            self.query_one("#plan-status", Static).update(f"Deployment complete: {self.plan.release_id}")
            self.plan = None
            await self._load_remote(self.remote_path)
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
            self.notify(str(exc), severity="error", timeout=10)
