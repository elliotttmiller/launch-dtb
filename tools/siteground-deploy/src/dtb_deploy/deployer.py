from __future__ import annotations

import asyncio
import hashlib
import json
import ssl
import urllib.request
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from ftplib import FTP_TLS, error_perm
from pathlib import Path, PurePosixPath

from .config import AppConfig
from .runner import LogSink


@dataclass(slots=True)
class PlannedChange:
    local_path: str
    remote_path: str
    action: str
    sha256: str
    size: int


@dataclass(slots=True)
class DeploymentPlan:
    release_id: str
    source_path: str
    remote_destination: str
    changes: list[PlannedChange]
    dry_run_output: str


@dataclass(slots=True)
class AppliedChange:
    change: PlannedChange
    backup_path: str | None
    previous_remote_path: str | None


class FTPSession:
    def __init__(self, config: AppConfig):
        self.config = config
        self.client: FTP_TLS | None = None

    def __enter__(self) -> "FTPSession":
        if not self.config.ftp.require_tls:
            raise RuntimeError("Unencrypted FTP is prohibited")
        ftp = FTP_TLS(context=ssl.create_default_context(), timeout=self.config.ftp.timeout_seconds)
        ftp.connect(self.config.ftp.host, self.config.ftp.port)
        ftp.login(self.config.ftp.user, self.config.ftp.password())
        ftp.prot_p()
        ftp.set_pasv(self.config.ftp.passive)
        ftp.cwd(self.config.ftp.root())
        self.client = ftp
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if self.client is None:
            return
        try:
            self.client.quit()
        except Exception:
            self.client.close()

    @property
    def ftp(self) -> FTP_TLS:
        if self.client is None:
            raise RuntimeError("FTPES session is not connected")
        return self.client

    def exists(self, remote_path: str) -> bool:
        try:
            self.ftp.size(remote_path)
            return True
        except error_perm:
            return False

    def ensure_directory(self, remote_directory: str) -> None:
        current = ""
        for part in PurePosixPath(remote_directory).parts:
            if part in ("", ".", "/"):
                continue
            current = f"{current}/{part}" if current else part
            try:
                self.ftp.mkd(current)
            except error_perm as exc:
                if not str(exc).startswith("550"):
                    raise

    def hash_remote(self, remote_path: str) -> str:
        digest = hashlib.sha256()
        self.ftp.retrbinary(f"RETR {remote_path}", digest.update)
        return digest.hexdigest()

    def download(self, remote_path: str, local_path: Path) -> None:
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with local_path.open("wb") as handle:
            self.ftp.retrbinary(f"RETR {remote_path}", handle.write)

    def upload(self, local_path: Path, remote_path: str) -> None:
        self.ensure_directory(str(PurePosixPath(remote_path).parent))
        with local_path.open("rb") as handle:
            self.ftp.storbinary(f"STOR {remote_path}", handle, blocksize=1024 * 256)


class DeploymentEngine:
    def __init__(self, config: AppConfig, sink: LogSink):
        self.config = config
        self.sink = sink

    async def preflight(self) -> str:
        await asyncio.to_thread(self._verify_ftpes)
        return "FTPES authenticated and production root verified"

    def _verify_ftpes(self) -> None:
        with FTPSession(self.config) as session:
            session.ftp.voidcmd("NOOP")
            try:
                session.ftp.cwd("wp")
                session.ftp.cwd("..")
            except error_perm as exc:
                raise RuntimeError("Configured FTP root does not expose the verified WordPress 'wp' directory") from exc

    @staticmethod
    def _sha256(path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()

    def _normalize_remote(self, remote: str) -> str:
        candidate = remote.replace("\\", "/").strip()
        candidate = candidate.strip("/")
        path = PurePosixPath(candidate or ".")
        if path.is_absolute() or ".." in path.parts:
            raise ValueError("Remote destination must be relative to the configured FTP root")
        return "" if str(path) == "." else str(path)

    def _is_protected(self, remote_path: str) -> bool:
        target = remote_path.strip("/")
        for protected in self.config.protected_remote_paths:
            candidate = protected.strip("/")
            if target == candidate or target.startswith(candidate + "/"):
                return True
        return False

    def _selected_files(self, source: Path, destination: str) -> list[tuple[Path, str]]:
        if not source.exists():
            raise FileNotFoundError(f"Local source does not exist: {source}")
        destination = self._normalize_remote(destination)
        if source.is_file():
            remote = str(PurePosixPath(destination) / source.name) if destination else source.name
            return [(source, remote)]
        files: list[tuple[Path, str]] = []
        base = PurePosixPath(destination) / source.name if destination else PurePosixPath(source.name)
        for local in sorted(path for path in source.rglob("*") if path.is_file()):
            remote = str(base / local.relative_to(source).as_posix())
            files.append((local, remote))
        if not files:
            raise RuntimeError("Selected directory contains no files")
        return files

    def _build_plan_sync(self, source: Path, destination: str) -> DeploymentPlan:
        release_id = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        changes: list[PlannedChange] = []
        lines = [f"SOURCE      {source}", f"DESTINATION /{self._normalize_remote(destination)}"]
        with FTPSession(self.config) as session:
            for local, remote in self._selected_files(source, destination):
                if self._is_protected(remote):
                    raise RuntimeError(f"Transfer attempts to write protected path: {remote}")
                local_hash = self._sha256(local)
                action = "ADD"
                if session.exists(remote):
                    action = "UNCHANGED" if session.hash_remote(remote) == local_hash else "MODIFY"
                lines.append(f"{action:9} {remote}")
                if action != "UNCHANGED":
                    changes.append(PlannedChange(str(local), remote, action, local_hash, local.stat().st_size))
        return DeploymentPlan(release_id, str(source), destination, changes, "\n".join(lines))

    async def preview(self, source: Path, destination: str) -> DeploymentPlan:
        await self.preflight()
        plan = await asyncio.to_thread(self._build_plan_sync, source.expanduser().resolve(), destination)
        for line in plan.dry_run_output.splitlines():
            await self.sink("stdout", line)
        return plan

    def _acquire_lease(self, session: FTPSession) -> str:
        lease = ".dtb-deploy-lock"
        try:
            session.ftp.mkd(lease)
        except error_perm as exc:
            raise RuntimeError("Production deployment lease is already held") from exc
        return lease

    def _release_lease(self, session: FTPSession, lease: str) -> None:
        try:
            session.ftp.rmd(lease)
        except Exception:
            pass

    def _deploy_sync(self, plan: DeploymentPlan) -> None:
        backup_root = self.config.state_root / "backups" / plan.release_id
        ledger_root = self.config.state_root / "releases"
        ledger_root.mkdir(parents=True, exist_ok=True)
        applied: list[AppliedChange] = []
        with FTPSession(self.config) as session:
            lease = self._acquire_lease(session)
            try:
                for change in plan.changes:
                    local = Path(change.local_path)
                    remote = change.remote_path
                    parent = str(PurePosixPath(remote).parent)
                    name = PurePosixPath(remote).name
                    temp = str(PurePosixPath(parent) / f".{name}.dtb-upload-{plan.release_id}")
                    previous = None
                    backup_path = None
                    if session.exists(remote):
                        backup_path = str(backup_root / remote)
                        session.download(remote, Path(backup_path))
                    session.upload(local, temp)
                    if session.hash_remote(temp) != change.sha256:
                        session.ftp.delete(temp)
                        raise RuntimeError(f"Remote checksum mismatch: {remote}")
                    if session.exists(remote):
                        previous = str(PurePosixPath(parent) / f".{name}.dtb-prev-{plan.release_id}")
                        session.ftp.rename(remote, previous)
                    try:
                        session.ftp.rename(temp, remote)
                    except Exception:
                        if previous and session.exists(previous):
                            session.ftp.rename(previous, remote)
                        raise
                    applied.append(AppliedChange(change, backup_path, previous))
                for change in plan.changes:
                    if session.hash_remote(change.remote_path) != change.sha256:
                        raise RuntimeError(f"Post-deployment checksum mismatch: {change.remote_path}")
                self._validate_health_sync()
                for item in applied:
                    if item.previous_remote_path and session.exists(item.previous_remote_path):
                        session.ftp.delete(item.previous_remote_path)
                payload = json.dumps({
                    "release_id": plan.release_id,
                    "source_path": plan.source_path,
                    "remote_destination": plan.remote_destination,
                    "deployed_utc": datetime.now(timezone.utc).isoformat(),
                    "transport": "FTPES",
                    "changes": [asdict(change) for change in plan.changes],
                    "backup_root": str(backup_root),
                }, indent=2, sort_keys=True)
                ledger = ledger_root / f"{plan.release_id}.json"
                ledger.write_text(payload, encoding="utf-8")
                ledger.with_suffix(".json.sha256").write_text(hashlib.sha256(payload.encode()).hexdigest(), encoding="utf-8")
            except Exception:
                for item in reversed(applied):
                    try:
                        if session.exists(item.change.remote_path):
                            session.ftp.delete(item.change.remote_path)
                        if item.previous_remote_path and session.exists(item.previous_remote_path):
                            session.ftp.rename(item.previous_remote_path, item.change.remote_path)
                        elif item.backup_path and Path(item.backup_path).is_file():
                            session.upload(Path(item.backup_path), item.change.remote_path)
                    except Exception:
                        continue
                raise
            finally:
                self._release_lease(session, lease)

    @staticmethod
    def _http_status(url: str) -> int:
        request = urllib.request.Request(url, headers={"User-Agent": "DTB-Deploy/3.0"})
        with urllib.request.urlopen(request, timeout=20) as response:
            return int(response.status)

    def _validate_health_sync(self) -> None:
        for url in self.config.health_checks:
            status = self._http_status(url)
            if not 200 <= status < 400:
                raise RuntimeError(f"Health check failed: HTTP {status} {url}")

    async def deploy(self, plan: DeploymentPlan) -> None:
        if not plan.changes:
            await self.sink("success", "No production changes detected")
            return
        await asyncio.to_thread(self._deploy_sync, plan)

    async def validate_remote(self) -> None:
        await asyncio.to_thread(self._verify_ftpes)
        for url in self.config.health_checks:
            status = await asyncio.to_thread(self._http_status, url)
            await self.sink("stdout", f"HTTP {status} {url}")
            if not 200 <= status < 400:
                raise RuntimeError(f"Health check failed: HTTP {status} {url}")
