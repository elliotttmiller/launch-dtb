from __future__ import annotations

import json
import ssl
from pathlib import Path, PurePosixPath
from tkinter import Tk, filedialog

from textual import on, work
from textual.app import App, ComposeResult
from textual.containers import Grid, Horizontal, Vertical
from textual.screen import ModalScreen
from textual.widgets import (
    Button,
    DataTable,
    Footer,
    Header,
    Input,
    Label,
    Static,
    TabbedContent,
    TabPane,
    TextArea,
)

from .config import AppConfig, load_config
from .deployer import DeploymentEngine, DeploymentPlan, RemoteEntry


class ConfirmDeploy(ModalScreen[bool]):
    CSS = """
    ConfirmDeploy { align: center middle; }
    #confirm-box {
        width: 78;
        height: 18;
        border: heavy $warning;
        background: #0b1724;
        padding: 1 2;
    }
    #confirm-actions { height: 3; align: center middle; margin-top: 1; }
    #confirm-actions Button { width: 22; margin: 0 1; }
    .dialog-title { color: #8ee7ff; text-style: bold; margin-bottom: 1; }
    """

    def __init__(self, plan: DeploymentPlan) -> None:
        super().__init__()
        self.plan = plan

    def compose(self) -> ComposeResult:
        total_bytes = sum(change.size for change in self.plan.changes)
        with Vertical(id="confirm-box"):
            yield Label("PRODUCTION ACTIVATION GATE", classes="dialog-title")
            yield Static(
                f"Release: {self.plan.release_id}\n"
                f"Changes: {len(self.plan.changes):,} file(s) · {total_bytes:,} bytes\n"
                f"Destination: /{self.plan.remote_destination}\n\n"
                "Existing files will be backed up locally. Uploads use temporary names, "
                "SHA-256 verification, protected-path enforcement, and transactional rollback."
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


class ManagementConsole(App[None]):
    TITLE = "Drywall Toolbox // Production Management Console"
    SUB_TITLE = "SiteGround FTPES Control Plane"

    CSS = """
    Screen { background: #050d16; color: #d9e8f6; }
    Header { background: #081827; color: #86e5ff; }
    Footer { background: #081827; }

    #app-shell { height: 1fr; }
    #sidebar {
        width: 31;
        background: #071421;
        border-right: solid #1d415e;
        padding: 1;
    }
    #main { width: 1fr; padding: 1 2; }
    .brand { color: #86e5ff; text-style: bold; margin-bottom: 0; }
    .product { color: #8faabd; margin-bottom: 1; }
    #connection-badge {
        height: 5;
        border: round #284b62;
        padding: 0 1;
        margin-bottom: 1;
        background: #09131e;
    }
    #connection-badge.connected { border: round #2f7b5b; color: #95f0c0; }
    #connection-badge.failed { border: round #8d3f50; color: #ff9fb0; }
    #sidebar Button { width: 27; margin-bottom: 1; }
    .nav-title { color: #6e8da3; margin: 1 0 1 0; }

    TabbedContent { height: 1fr; }
    TabPane { padding: 1; }
    .page-title { color: #8ee7ff; text-style: bold; }
    .page-subtitle { color: #829db2; margin-bottom: 1; }
    .card {
        border: round #1e435f;
        background: #08131e;
        padding: 1 2;
    }
    .card-title { color: #8edfff; text-style: bold; margin-bottom: 1; }
    .muted { color: #7f9aaf; }

    #dashboard-grid { grid-size: 3 2; grid-gutter: 1 1; height: 20; }
    #dashboard-grid .card { height: 9; }
    #quick-actions { height: 5; margin-top: 1; }
    #quick-actions Button { width: 24; margin-right: 1; }

    #file-panes { height: 28; }
    #local-pane, #remote-pane { width: 1fr; }
    #local-pane { margin-right: 1; }
    #source-actions, #remote-actions { height: 3; }
    #source-actions Button { width: 17; margin-right: 1; }
    #remote-actions Button { width: 15; margin-right: 1; }
    #sources { height: 15; border: solid #173750; background: #03080d; }
    #remote-table { height: 17; border: solid #173750; background: #03080d; }
    #destination-row { height: 5; margin-top: 1; }
    #destination { width: 1fr; margin-right: 1; }
    #destination-row Button { width: 20; }

    #queue-summary { height: 5; margin-bottom: 1; }
    #queue-table { height: 1fr; border: round #1e435f; background: #03080d; }
    #queue-actions { height: 4; margin-top: 1; }
    #queue-actions Button { width: 24; margin-right: 1; }

    #release-table { height: 1fr; border: round #1e435f; background: #03080d; }
    #release-actions { height: 4; margin-top: 1; }
    #release-actions Button { width: 22; margin-right: 1; }

    #validation-grid { grid-size: 2 2; grid-gutter: 1 1; height: 20; }
    #validation-grid .card { height: 9; }

    #logs { height: 1fr; border: round #1e435f; background: #02070b; }
    #log-actions { height: 4; margin-top: 1; }
    #log-actions Button { width: 22; margin-right: 1; }

    #settings-grid { grid-size: 2 3; grid-gutter: 1 1; height: 27; }
    #settings-grid .card { height: 8; }
    DataTable { scrollbar-size: 1 1; }
    Input { border: tall #275473; }
    """

    BINDINGS = [
        ("q", "quit", "Quit"),
        ("f5", "refresh_remote", "Refresh Remote"),
        ("ctrl+p", "preview", "Preview"),
        ("ctrl+shift+d", "deploy", "Deploy"),
        ("ctrl+shift+c", "copy_log", "Copy Log"),
    ]

    def __init__(self, config_path: Path):
        super().__init__()
        self.config_path = config_path
        self.config: AppConfig | None = None
        self.engine: DeploymentEngine | None = None
        self.plan: DeploymentPlan | None = None
        self.selected_sources: list[Path] = []
        self.remote_path = ""
        self.remote_entries: list[RemoteEntry] = []
        self.log_lines: list[str] = []
        self.connected = False

    def compose(self) -> ComposeResult:
        yield Header()
        with Horizontal(id="app-shell"):
            with Vertical(id="sidebar"):
                yield Static("DRYWALL TOOLBOX", classes="brand")
                yield Static("PRODUCTION MANAGEMENT", classes="product")
                yield Static("OFFLINE\nConnection not tested", id="connection-badge")
                yield Button("Connect / Preflight", id="connect", variant="primary")
                yield Static("WORKSPACES", classes="nav-title")
                yield Button("Overview", id="nav-overview")
                yield Button("File Manager", id="nav-files")
                yield Button("Transfer Queue", id="nav-queue")
                yield Button("Releases & Backups", id="nav-releases")
                yield Button("Validation", id="nav-validation")
                yield Button("Operator Logs", id="nav-logs")
                yield Button("Settings", id="nav-settings")
            with Vertical(id="main"):
                with TabbedContent(initial="overview", id="workspace-tabs"):
                    with TabPane("Overview", id="overview"):
                        yield Static("Production overview", classes="page-title")
                        yield Static("Current connection, transfer readiness, and safety state.", classes="page-subtitle")
                        with Grid(id="dashboard-grid"):
                            yield Static("CONNECTION\n\nOffline\nRun Connect / Preflight", id="card-connection", classes="card")
                            yield Static("LOCAL SOURCES\n\n0 selected", id="card-sources", classes="card")
                            yield Static("DESTINATION\n\nNot selected", id="card-destination", classes="card")
                            yield Static("TRANSFER PLAN\n\nNo preview", id="card-plan", classes="card")
                            yield Static("BACKUPS\n\nLoading local history…", id="card-backups", classes="card")
                            yield Static("GUARDRAILS\n\nTLS · SHA-256 · rollback\nRemote delete disabled", classes="card")
                        with Horizontal(id="quick-actions"):
                            yield Button("Open File Manager", id="quick-files", variant="primary")
                            yield Button("Generate Preview", id="quick-preview", variant="warning")
                            yield Button("Validate Production", id="quick-validate", variant="success")

                    with TabPane("File Manager", id="files"):
                        yield Static("Live file manager", classes="page-title")
                        yield Static("Select local sources and browse the live SiteGround destination.", classes="page-subtitle")
                        with Horizontal(id="file-panes"):
                            with Vertical(id="local-pane", classes="card"):
                                yield Static("LOCAL SOURCES", classes="card-title")
                                with Horizontal(id="source-actions"):
                                    yield Button("Add Files", id="add-files")
                                    yield Button("Add Directory", id="add-directory")
                                    yield Button("Clear", id="clear-sources")
                                yield TextArea("No local sources selected.", id="sources", read_only=True, show_line_numbers=False)
                            with Vertical(id="remote-pane", classes="card"):
                                yield Static("LIVE SITEGROUND", classes="card-title")
                                yield Input(value="/", id="remote-path", disabled=True)
                                with Horizontal(id="remote-actions"):
                                    yield Button("Up", id="remote-up")
                                    yield Button("Open", id="remote-open")
                                    yield Button("Refresh", id="remote-refresh")
                                    yield Button("Use Folder", id="use-folder", variant="primary")
                                yield DataTable(id="remote-table", cursor_type="row", zebra_stripes=True)
                        with Horizontal(id="destination-row"):
                            yield Input(placeholder="Select a live remote folder", id="destination")
                            yield Button("Preview Transfer", id="preview", variant="warning")

                    with TabPane("Transfer Queue", id="queue"):
                        yield Static("Transfer queue", classes="page-title")
                        yield Static("Exact ADD and MODIFY operations approved by the current preview.", classes="page-subtitle")
                        yield Static("No preview generated.", id="queue-summary", classes="card")
                        yield DataTable(id="queue-table", cursor_type="row", zebra_stripes=True)
                        with Horizontal(id="queue-actions"):
                            yield Button("Regenerate Preview", id="queue-preview", variant="warning")
                            yield Button("Deploy Preview", id="deploy", variant="error")
                            yield Button("Clear Plan", id="clear-plan")

                    with TabPane("Releases & Backups", id="releases"):
                        yield Static("Release and backup history", classes="page-title")
                        yield Static("Checksummed local deployment ledgers and file-level production backups.", classes="page-subtitle")
                        yield DataTable(id="release-table", cursor_type="row", zebra_stripes=True)
                        with Horizontal(id="release-actions"):
                            yield Button("Refresh History", id="refresh-releases", variant="primary")
                            yield Button("Open Backup Folder", id="open-backups")

                    with TabPane("Validation", id="validation"):
                        yield Static("Production validation", classes="page-title")
                        yield Static("Connectivity, TLS, FTP root, and public HTTP health gates.", classes="page-subtitle")
                        with Grid(id="validation-grid"):
                            yield Static("FTPES\n\nNot tested", id="validation-ftpes", classes="card")
                            yield Static("TLS CERTIFICATE\n\nStrict verification enabled", id="validation-tls", classes="card")
                            yield Static("FTP ROOT\n\nNot tested", id="validation-root", classes="card")
                            yield Static("HTTP HEALTH\n\nNot tested", id="validation-http", classes="card")
                        yield Button("Run Full Validation", id="validate", variant="success")

                    with TabPane("Operator Logs", id="logs-pane"):
                        yield Static("Operator logs", classes="page-title")
                        yield Static("Selectable diagnostic output with one-click clipboard export.", classes="page-subtitle")
                        yield TextArea("", id="logs", read_only=True, show_line_numbers=False, soft_wrap=False)
                        with Horizontal(id="log-actions"):
                            yield Button("Copy Complete Log", id="copy-log", variant="primary")
                            yield Button("Clear Log", id="clear-log")

                    with TabPane("Settings", id="settings"):
                        yield Static("Runtime configuration", classes="page-title")
                        yield Static("Read-only effective production settings. Secrets are never displayed.", classes="page-subtitle")
                        with Grid(id="settings-grid"):
                            yield Static("FTP ENDPOINT\n\nLoading…", id="setting-endpoint", classes="card")
                            yield Static("TLS HOSTNAME\n\nLoading…", id="setting-tls", classes="card")
                            yield Static("FTP ROOT\n\nLoading…", id="setting-root", classes="card")
                            yield Static("AUTHENTICATION\n\nPassword loaded from environment", classes="card")
                            yield Static("PROTECTED PATHS\n\nLoading…", id="setting-protected", classes="card")
                            yield Static("LOCAL STATE\n\nLoading…", id="setting-state", classes="card")
        yield Footer()

    async def on_mount(self) -> None:
        remote_table = self.query_one("#remote-table", DataTable)
        remote_table.add_columns("Type", "Name", "Size")
        queue_table = self.query_one("#queue-table", DataTable)
        queue_table.add_columns("Action", "Local source", "Remote destination", "Size", "SHA-256")
        release_table = self.query_one("#release-table", DataTable)
        release_table.add_columns("Release", "Deployed UTC", "Files", "Destination", "Backup")
        try:
            self.config = load_config(self.config_path)
            self.engine = DeploymentEngine(self.config, self.write_log)
            self._render_settings()
            self._refresh_release_history()
            await self.write_log("success", "Production management console initialized")
        except Exception as exc:
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error", timeout=10)

    def require_engine(self) -> DeploymentEngine:
        if self.engine is None:
            raise RuntimeError("Management engine is unavailable")
        return self.engine

    async def write_log(self, kind: str, message: str) -> None:
        for line in str(message).splitlines() or [""]:
            self.log_lines.append(f"{kind.upper():>7}  {line}")
        console = self.query_one("#logs", TextArea)
        console.text = "\n".join(self.log_lines)
        console.move_cursor((max(len(self.log_lines) - 1, 0), 0))

    def _activate_tab(self, tab_id: str) -> None:
        self.query_one("#workspace-tabs", TabbedContent).active = tab_id

    @on(Button.Pressed, "#nav-overview")
    def nav_overview(self) -> None: self._activate_tab("overview")

    @on(Button.Pressed, "#nav-files")
    def nav_files(self) -> None: self._activate_tab("files")

    @on(Button.Pressed, "#nav-queue")
    def nav_queue(self) -> None: self._activate_tab("queue")

    @on(Button.Pressed, "#nav-releases")
    def nav_releases(self) -> None: self._activate_tab("releases")

    @on(Button.Pressed, "#nav-validation")
    def nav_validation(self) -> None: self._activate_tab("validation")

    @on(Button.Pressed, "#nav-logs")
    def nav_logs(self) -> None: self._activate_tab("logs-pane")

    @on(Button.Pressed, "#nav-settings")
    def nav_settings(self) -> None: self._activate_tab("settings")

    @on(Button.Pressed, "#quick-files")
    def quick_files(self) -> None: self._activate_tab("files")

    def _render_settings(self) -> None:
        assert self.config is not None
        ftp = self.config.ftp
        connect_host = ftp.effective_connect_host()
        tls_name = ftp.effective_tls_hostname()
        self.query_one("#setting-endpoint", Static).update(f"FTP ENDPOINT\n\n{connect_host}:{ftp.port}\nPassive: {ftp.passive}")
        self.query_one("#setting-tls", Static).update(f"TLS HOSTNAME\n\n{tls_name}\nVerification: strict")
        self.query_one("#setting-root", Static).update(f"FTP ROOT\n\n{ftp.root()}")
        protected = "\n".join(self.config.protected_remote_paths[:4])
        extra = max(len(self.config.protected_remote_paths) - 4, 0)
        self.query_one("#setting-protected", Static).update(f"PROTECTED PATHS\n\n{protected}" + (f"\n+{extra} more" if extra else ""))
        self.query_one("#setting-state", Static).update(f"LOCAL STATE\n\n{self.config.state_root}")

    def _set_connected(self, connected: bool, detail: str) -> None:
        self.connected = connected
        badge = self.query_one("#connection-badge", Static)
        badge.remove_class("connected", "failed")
        badge.add_class("connected" if connected else "failed")
        badge.update(("CONNECTED" if connected else "CONNECTION FAILED") + f"\n{detail}")
        self.query_one("#card-connection", Static).update(("CONNECTION\n\nConnected\n" if connected else "CONNECTION\n\nFailed\n") + detail)
        self.query_one("#validation-ftpes", Static).update(("FTPES\n\nPASS\n" if connected else "FTPES\n\nFAIL\n") + detail)

    @on(Button.Pressed, "#connect")
    def connect_pressed(self) -> None:
        self.run_connect()

    @work(exclusive=True)
    async def run_connect(self) -> None:
        try:
            result = await self.require_engine().preflight()
            self._set_connected(True, result)
            self.query_one("#validation-root", Static).update("FTP ROOT\n\nPASS\nWordPress root visible")
            self.query_one("#validation-tls", Static).update("TLS CERTIFICATE\n\nPASS\nHostname and chain verified")
            await self._load_remote("")
            await self.write_log("success", f"Preflight passed: {result}")
        except ssl.SSLCertVerificationError as exc:
            self._set_connected(False, "TLS certificate mismatch")
            self.query_one("#validation-tls", Static).update("TLS CERTIFICATE\n\nFAIL\nHostname mismatch")
            await self.write_log("error", f"TLS verification failed: {exc}")
            await self.write_log("section", "Set DTB_FTP_TLS_HOSTNAME only to the hostname documented for the FTP service; verification cannot be disabled.")
            self.notify("FTP TLS certificate hostname mismatch", severity="error", timeout=10)
        except Exception as exc:
            self._set_connected(False, str(exc))
            await self.write_log("error", str(exc))
            self.notify(str(exc), severity="error", timeout=10)

    def _choose_files(self) -> None:
        root = Tk(); root.withdraw(); root.attributes("-topmost", True)
        try:
            selected = filedialog.askopenfilenames(title="Select production files")
        finally:
            root.destroy()
        for value in selected:
            path = Path(value).resolve()
            if path not in self.selected_sources:
                self.selected_sources.append(path)
        if selected:
            self._render_sources()

    def _choose_directory(self) -> None:
        root = Tk(); root.withdraw(); root.attributes("-topmost", True)
        try:
            selected = filedialog.askdirectory(title="Select production directory")
        finally:
            root.destroy()
        if selected:
            path = Path(selected).resolve()
            if path not in self.selected_sources:
                self.selected_sources.append(path)
            self._render_sources()

    @on(Button.Pressed, "#add-files")
    def add_files(self) -> None: self._choose_files()

    @on(Button.Pressed, "#add-directory")
    def add_directory(self) -> None: self._choose_directory()

    @on(Button.Pressed, "#clear-sources")
    def clear_sources(self) -> None:
        self.selected_sources.clear(); self._render_sources()

    def _render_sources(self) -> None:
        view = self.query_one("#sources", TextArea)
        view.text = "\n".join(f"{index + 1}. {path}" for index, path in enumerate(self.selected_sources)) or "No local sources selected."
        self.query_one("#card-sources", Static).update(f"LOCAL SOURCES\n\n{len(self.selected_sources):,} selected")
        self._invalidate_plan("Local source selection changed")

    def _selected_remote_entry(self) -> RemoteEntry | None:
        table = self.query_one("#remote-table", DataTable)
        row = table.cursor_row
        if row is None or row < 0 or row >= len(self.remote_entries):
            return None
        return self.remote_entries[row]

    async def _load_remote(self, path: str) -> None:
        entries = await self.require_engine().list_remote(path)
        self.remote_entries = entries
        self.remote_path = path.strip("/")
        self.query_one("#remote-path", Input).value = f"/{self.remote_path}" if self.remote_path else "/"
        table = self.query_one("#remote-table", DataTable)
        table.clear(columns=False)
        for entry in entries:
            table.add_row("DIR" if entry.is_directory else "FILE", entry.name, "" if entry.size is None else f"{entry.size:,}")
        await self.write_log("success", f"Loaded remote directory /{self.remote_path}" if self.remote_path else "Loaded remote FTP root /")

    @work(exclusive=True)
    async def load_remote(self, path: str) -> None:
        try:
            await self._load_remote(path)
        except Exception as exc:
            await self.write_log("error", str(exc)); self.notify(str(exc), severity="error")

    @on(Button.Pressed, "#remote-refresh")
    def refresh_remote_pressed(self) -> None: self.action_refresh_remote()

    def action_refresh_remote(self) -> None: self.load_remote(self.remote_path)

    @on(Button.Pressed, "#remote-up")
    def remote_up(self) -> None:
        parent = str(PurePosixPath(self.remote_path).parent)
        self.load_remote("" if parent == "." else parent)

    @on(Button.Pressed, "#remote-open")
    def remote_open(self) -> None:
        entry = self._selected_remote_entry()
        if entry is None or not entry.is_directory:
            self.notify("Select a remote directory", severity="warning"); return
        self.load_remote(entry.path)

    @on(DataTable.RowSelected, "#remote-table")
    def remote_row_selected(self) -> None:
        entry = self._selected_remote_entry()
        if entry and entry.is_directory:
            self.query_one("#destination", Input).value = entry.path

    @on(Button.Pressed, "#use-folder")
    def use_folder(self) -> None:
        entry = self._selected_remote_entry()
        destination = entry.path if entry and entry.is_directory else self.remote_path
        self.query_one("#destination", Input).value = destination
        self.query_one("#card-destination", Static).update(f"DESTINATION\n\n/{destination}" if destination else "DESTINATION\n\n/")
        self._invalidate_plan("Remote destination changed")

    @on(Input.Changed, "#destination")
    def destination_changed(self) -> None:
        value = self.query_one("#destination", Input).value.strip("/")
        self.query_one("#card-destination", Static).update(f"DESTINATION\n\n/{value}" if value else "DESTINATION\n\nNot selected")
        self._invalidate_plan("Remote destination changed")

    def _invalidate_plan(self, reason: str) -> None:
        self.plan = None
        self.query_one("#queue-summary", Static).update(f"No active preview. {reason}.")
        self.query_one("#card-plan", Static).update("TRANSFER PLAN\n\nNo current preview")
        self.query_one("#queue-table", DataTable).clear(columns=False)

    @on(Button.Pressed, "#preview")
    @on(Button.Pressed, "#queue-preview")
    @on(Button.Pressed, "#quick-preview")
    def preview_pressed(self) -> None: self.action_preview()

    def action_preview(self) -> None: self.run_preview()

    @work(exclusive=True)
    async def run_preview(self) -> None:
        try:
            destination = self.query_one("#destination", Input).value.strip()
            if not self.selected_sources:
                raise ValueError("Select at least one local file or directory")
            if not destination:
                raise ValueError("Choose a remote destination from the live browser")
            self.plan = await self.require_engine().preview(self.selected_sources, destination)
            table = self.query_one("#queue-table", DataTable)
            table.clear(columns=False)
            for change in self.plan.changes:
                table.add_row(change.action, change.local_path, f"/{change.remote_path}", f"{change.size:,}", change.sha256[:16])
            total = sum(change.size for change in self.plan.changes)
            summary = f"READY · {len(self.plan.changes):,} change(s) · {total:,} bytes · Release {self.plan.release_id}"
            self.query_one("#queue-summary", Static).update(summary)
            self.query_one("#card-plan", Static).update(f"TRANSFER PLAN\n\nReady\n{len(self.plan.changes):,} changes · {total:,} bytes")
            self._activate_tab("queue")
            await self.write_log("success", f"Transfer preview generated: {summary}")
        except Exception as exc:
            self._invalidate_plan("Preview failed")
            await self.write_log("error", str(exc)); self.notify(str(exc), severity="error", timeout=10)

    @on(Button.Pressed, "#clear-plan")
    def clear_plan(self) -> None: self._invalidate_plan("Plan cleared by operator")

    @on(Button.Pressed, "#deploy")
    def deploy_pressed(self) -> None: self.action_deploy()

    def action_deploy(self) -> None:
        if self.plan is None:
            self.notify("Generate a transfer preview first", severity="warning"); return
        self.push_screen(ConfirmDeploy(self.plan), self.confirmed_deploy)

    def confirmed_deploy(self, confirmed: bool | None) -> None:
        if confirmed: self.run_deploy()

    @work(exclusive=True)
    async def run_deploy(self) -> None:
        try:
            assert self.plan is not None
            release_id = self.plan.release_id
            await self.require_engine().deploy(self.plan)
            await self.write_log("success", f"Production release deployed: {release_id}")
            self.notify(f"Release {release_id} deployed", severity="information")
            self.plan = None
            self._refresh_release_history()
            await self._load_remote(self.remote_path)
        except Exception as exc:
            await self.write_log("error", str(exc)); self.notify(str(exc), severity="error", timeout=10)

    @on(Button.Pressed, "#validate")
    @on(Button.Pressed, "#quick-validate")
    def validate_pressed(self) -> None: self.run_validate()

    @work(exclusive=True)
    async def run_validate(self) -> None:
        try:
            await self.require_engine().validate_remote()
            self.query_one("#validation-http", Static).update("HTTP HEALTH\n\nPASS\nAll configured endpoints healthy")
            await self.write_log("success", "Full production validation passed")
        except Exception as exc:
            self.query_one("#validation-http", Static).update(f"HTTP HEALTH\n\nFAIL\n{exc}")
            await self.write_log("error", str(exc)); self.notify(str(exc), severity="error")

    def _refresh_release_history(self) -> None:
        if self.config is None: return
        table = self.query_one("#release-table", DataTable)
        table.clear(columns=False)
        release_root = self.config.state_root / "releases"
        backup_root = self.config.state_root / "backups"
        records: list[dict[str, object]] = []
        if release_root.is_dir():
            for ledger in sorted(release_root.glob("*.json"), reverse=True):
                try:
                    records.append(json.loads(ledger.read_text(encoding="utf-8")))
                except (OSError, json.JSONDecodeError):
                    continue
        for record in records:
            release_id = str(record.get("release_id", "unknown"))
            changes = record.get("changes", [])
            count = len(changes) if isinstance(changes, list) else 0
            destination = str(record.get("remote_destination", "/"))
            backup = str(record.get("backup_root", backup_root / release_id))
            table.add_row(release_id, str(record.get("deployed_utc", "")), str(count), f"/{destination.strip('/')}", backup)
        self.query_one("#card-backups", Static).update(f"BACKUPS\n\n{len(records):,} release ledger(s)\n{backup_root}")

    @on(Button.Pressed, "#refresh-releases")
    def refresh_releases(self) -> None:
        self._refresh_release_history(); self.notify("Release history refreshed")

    @on(Button.Pressed, "#open-backups")
    def open_backups(self) -> None:
        if self.config is None: return
        path = self.config.state_root / "backups"
        path.mkdir(parents=True, exist_ok=True)
        import os
        os.startfile(path)  # type: ignore[attr-defined]

    def action_copy_log(self) -> None:
        text = "\n".join(self.log_lines)
        if not text:
            self.notify("The log is empty", severity="warning"); return
        self.copy_to_clipboard(text); self.notify("Complete log copied")

    @on(Button.Pressed, "#copy-log")
    def copy_log_pressed(self) -> None: self.action_copy_log()

    @on(Button.Pressed, "#clear-log")
    def clear_log(self) -> None:
        self.log_lines.clear(); self.query_one("#logs", TextArea).text = ""


DeploymentApp = ManagementConsole
