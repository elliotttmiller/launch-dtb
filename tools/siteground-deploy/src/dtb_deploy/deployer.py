from __future__ import annotations

import asyncio
import fnmatch
import hashlib
import json
import shutil
import ssl
import urllib.request
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from ftplib import FTP_TLS, error_perm
from pathlib import Path, PurePosixPath

from .config import AppConfig, Mapping
from .runner import LogSink, run_command


@dataclass(slots=True)
class PlannedChange:
    mapping: str
    local_path: str
    remote_path: str
    action: str
    sha256: str
    size: int


@dataclass(slots=True)
class DeploymentPlan:
    release_id: str
    source_reference: str
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
        context = ssl.create_default_context()
        ftp = FTP_TLS(context=context, timeout=self.config.ftp.timeout_seconds)
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
        if shutil.which("npm") is None:
            raise RuntimeError("Required executable is not available: npm")
        await asyncio.to_thread(self._verify_ftpes)
        return "FTPES authenticated and production root verified"

    def _verify_ftpes(self) -> None:
        with FTPSession(self.config) as session:
            session.ftp.voidcmd("NOOP")
            try:
                session.ftp.cwd("wp")
                session.ftp.cwd("..")
            except error_perm as exc:
                raise RuntimeError(
                    "Configured FTP root does not expose the verified WordPress 'wp' directory"
                ) from exc

    async def build(self) -> None:
        build = self.config.build
        await run_command(build.command, cwd=self.config.root / build.working_directory, sink=self.sink)
        required = self.config.root / build.required_output
        if not required.is_file():
            raise RuntimeError(f"Build output is missing: {required}")

    @staticmethod
    def _sha256(path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()

    def _is_excluded(self, relative: str, mapping: Mapping) -> bool:
        normalized = relative.replace("\\", "/")
        candidates = [normalized, PurePosixPath(normalized).name]
        return any(
            fnmatch.fnmatch(candidate, pattern)
            for pattern in mapping.excludes
            for candidate in candidates
        )

    def _is_protected(self, remote_path: str) -> bool:
        target = remote_path.strip("/")
        for protected in self.config.protected_remote_paths:
            candidate = protected.strip("/")
            if target == candidate or target.startswith(candidate + "/"):
                return True
        return False

    def _mapping_files(self, mapping: Mapping) -> list[tuple[Path, str]]:
        source = self.config.root / mapping.source
        if not source.exists():
            raise RuntimeError(f"Mapping source does not exist: {source}")
        destination = mapping.destination.strip("/")
        if source.is_file():
            remote = destination or source.name
            return [(source, remote)]
        files: list[tuple[Path, str]] = []
        for local in sorted(path for path in source.rglob("*") if path.is_file()):
            relative = local.relative_to(source).as_posix()
            if self._is_excluded(relative, mapping):
                continue
            remote = str(PurePosixPath(destination) / relative) if destination else relative
            files.append((local, remote))
        return files

    def _build_plan_sync(self, release_id: str, source_reference: str) -> DeploymentPlan:
        changes: list[PlannedChange] = []
        lines: list[str] = []
        with FTPSession(self.config) as session:
            for mapping in self.config.mappings:
                lines.append(f"## {mapping.name}")
                for local, remote in self._mapping_files(mapping):
                    if self._is_protected(remote):
                        raise RuntimeError(f"Mapping attempts to write protected path: {remote}")
                    local_hash = self._sha256(local)
                    exists = session.exists(remote)
                    action = "ADD"
                    if exists:
                        remote_hash = session.hash_remote(remote)
                        action = "UNCHANGED" if remote_hash == local_hash else "MODIFY"
                    lines.append(f"{action:9} {remote}")
                    if action != "UNCHANGED":
                        changes.append(
                            PlannedChange(
                                mapping=mapping.name,
                                local_path=str(local),
                                remote_path=remote,
                                action=action,
                                sha256=local_hash,
                                size=local.stat().st_size,
                            )
                        )
        return DeploymentPlan(release_id, source_reference, changes, "\n".join(lines))

    async def dry_run(self) -> DeploymentPlan:
        await self.preflight()
        release_id = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        source_reference = "operator-managed-local-checkout"
        plan = await asyncio.to_thread(
            self._build_plan_sync,
            release_id,
            source_reference,
        )
        for line in plan.dry_run_output.splitlines():
            await self.sink("stdout", line)
        return plan

    def _acquire_lease(self, session: FTPSession, release_id: str) -> str:
        lease = ".dtb-deploy-lock"
        try:
            session.ftp.mkd(lease)
        except error_perm as exc:
            raise RuntimeError("Production deployment lease is already held") from exc
        marker = self.config.state_root / "leases" / f"{release_id}.txt"
        marker.parent.mkdir(parents=True, exist_ok=True)
        marker.write_text(release_id, encoding="utf-8")
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
            lease = self._acquire_lease(session, plan.release_id)
            try:
                for change in plan.changes:
                    local = Path(change.local_path)
                    remote = change.remote_path
                    remote_parent = str(PurePosixPath(remote).parent)
                    remote_name = PurePosixPath(remote).name
                    temp = str(
                        PurePosixPath(remote_parent)
                        / f".{remote_name}.dtb-upload-{plan.release_id}"
                    )
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
                        previous = str(
                            PurePosixPath(remote_parent)
                            / f".{remote_name}.dtb-prev-{plan.release_id}"
                        )
                        session.ftp.rename(remote, previous)
                    try:
                        session.ftp.rename(temp, remote)
                    except Exception:
                        if previous and session.exists(previous):
                            session.ftp.rename(previous, remote)
                        raise
                    applied.append(AppliedChange(change, backup_path, previous))
                self._validate_hashes(session, plan.changes)
                self._validate_health_sync()
                for item in applied:
                    if item.previous_remote_path and session.exists(item.previous_remote_path):
                        session.ftp.delete(item.previous_remote_path)
                ledger = {
                    "release_id": plan.release_id,
                    "source_reference": plan.source_reference,
                    "deployed_utc": datetime.now(timezone.utc).isoformat(),
                    "transport": "FTPES",
                    "changes": [asdict(change) for change in plan.changes],
                    "backup_root": str(backup_root),
                }
                payload = json.dumps(ledger, indent=2, sort_keys=True)
                ledger_path = ledger_root / f"{plan.release_id}.json"
                ledger_path.write_text(payload, encoding="utf-8")
                ledger_path.with_suffix(".json.sha256").write_text(
                    hashlib.sha256(payload.encode()).hexdigest(),
                    encoding="utf-8",
                )
            except Exception:
                self._rollback_transaction(session, applied)
                raise
            finally:
                self._release_lease(session, lease)

    def _rollback_transaction(self, session: FTPSession, applied: list[AppliedChange]) -> None:
        for item in reversed(applied):
            remote = item.change.remote_path
            try:
                if session.exists(remote):
                    session.ftp.delete(remote)
                if item.previous_remote_path and session.exists(item.previous_remote_path):
                    session.ftp.rename(item.previous_remote_path, remote)
                elif item.backup_path and Path(item.backup_path).is_file():
                    session.upload(Path(item.backup_path), remote)
            except Exception:
                continue

    def _validate_hashes(self, session: FTPSession, changes: list[PlannedChange]) -> None:
        for change in changes:
            if session.hash_remote(change.remote_path) != change.sha256:
                raise RuntimeError(f"Post-deployment checksum mismatch: {change.remote_path}")

    @staticmethod
    def _http_status(url: str) -> int:
        request = urllib.request.Request(url, headers={"User-Agent": "DTB-Deploy/2.0"})
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
        await self.validate_remote()

    async def validate_remote(self) -> None:
        await asyncio.to_thread(self._verify_ftpes)
        for url in self.config.health_checks:
            status = await asyncio.to_thread(self._http_status, url)
            await self.sink("stdout", f"HTTP {status} {url}")
            if not 200 <= status < 400:
                raise RuntimeError(f"Health check failed: HTTP {status} {url}")
