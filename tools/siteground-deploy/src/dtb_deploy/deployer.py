from __future__ import annotations

import asyncio
import hashlib
import json
import shlex
import shutil
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from .config import AppConfig, Mapping
from .runner import LogSink, run_command


@dataclass(slots=True)
class DeploymentPlan:
    release_id: str
    commit: str
    dry_run_output: str


class DeploymentEngine:
    def __init__(self, config: AppConfig, sink: LogSink):
        self.config = config
        self.sink = sink

    def _ssh_base(self) -> list[str]:
        identity = self.config.ssh.identity_file()
        known_hosts = self.config.ssh.known_hosts_file()
        return [
            "ssh",
            "-p", str(self.config.ssh.port),
            "-i", str(identity),
            "-o", "BatchMode=yes",
            "-o", "IdentitiesOnly=yes",
            "-o", "StrictHostKeyChecking=yes",
            "-o", f"UserKnownHostsFile={known_hosts}",
            "-o", f"ConnectTimeout={self.config.ssh.connect_timeout_seconds}",
            f"{self.config.ssh.user}@{self.config.ssh.host}",
        ]

    def _rsync_ssh(self) -> str:
        identity = self.config.ssh.identity_file()
        known_hosts = self.config.ssh.known_hosts_file()
        return shlex.join([
            "ssh", "-p", str(self.config.ssh.port),
            "-i", str(identity),
            "-o", "BatchMode=yes",
            "-o", "IdentitiesOnly=yes",
            "-o", "StrictHostKeyChecking=yes",
            "-o", f"UserKnownHostsFile={known_hosts}",
        ])

    async def preflight(self) -> str:
        for executable in ("git", "rsync", "ssh", "npm"):
            if shutil.which(executable) is None:
                raise RuntimeError(f"Required executable is not available: {executable}")
        root = self.config.root
        result = await run_command(["git", "status", "--porcelain"], cwd=root, sink=self.sink)
        if result.stdout.strip():
            raise RuntimeError("Deployment requires a clean Git working tree")
        commit = (await run_command(["git", "rev-parse", "HEAD"], cwd=root, sink=self.sink)).stdout.strip()
        await run_command(
            self._ssh_base() + ["command -v rsync && command -v php && command -v wp && command -v mkdir"],
            sink=self.sink,
        )
        return commit

    async def build(self) -> None:
        build = self.config.build
        await run_command(build.command, cwd=self.config.root / build.working_directory, sink=self.sink)
        required = self.config.root / build.required_output
        if not required.is_file():
            raise RuntimeError(f"Build output is missing: {required}")

    def _remote_path(self, mapping: Mapping) -> str:
        if mapping.destination in (".", "./"):
            return self.config.remote.site_root.rstrip("/") + "/"
        return self.config.remote.site_root.rstrip("/") + "/" + mapping.destination.lstrip("/")

    def _rsync_args(self, mapping: Mapping, *, dry_run: bool, backup_dir: str | None = None) -> list[str]:
        source = self.config.root / mapping.source
        if not source.exists():
            raise RuntimeError(f"Mapping source does not exist: {source}")
        args = [
            "rsync", "-azc", "--itemize-changes", "--human-readable",
            "--no-owner", "--no-group", "--safe-links", "--protect-args",
            "--partial", "--delay-updates", "-e", self._rsync_ssh(),
        ]
        if dry_run:
            args.extend(["--dry-run", "--stats"])
        if backup_dir:
            args.extend(["--backup", f"--backup-dir={backup_dir}"])
        for pattern in mapping.excludes:
            args.extend(["--exclude", pattern])
        for protected in self.config.protected_remote_paths:
            if not protected.startswith("../"):
                args.extend(["--exclude", protected])
        args.extend([
            str(source),
            f"{self.config.ssh.user}@{self.config.ssh.host}:{self._remote_path(mapping)}",
        ])
        return args

    async def dry_run(self) -> DeploymentPlan:
        commit = await self.preflight()
        release_id = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S") + "-" + commit[:12]
        output: list[str] = []
        for mapping in self.config.mappings:
            await self.sink("section", f"Dry run: {mapping.name}")
            result = await run_command(self._rsync_args(mapping, dry_run=True), cwd=self.config.root, sink=self.sink)
            output.append(f"## {mapping.name}\n{result.stdout}")
        return DeploymentPlan(release_id, commit, "\n".join(output))

    async def _acquire_lease(self, release_id: str) -> str:
        state = self.config.remote.state_root.rstrip("/")
        lease = f"{state}/deploy.lock.d"
        command = (
            f"umask 077; mkdir -p {shlex.quote(state)}; "
            f"mkdir {shlex.quote(lease)} || {{ echo 'deployment lease already held' >&2; exit 73; }}; "
            f"printf '%s\\n' {shlex.quote(release_id)} > {shlex.quote(lease + '/release-id')}"
        )
        await run_command(self._ssh_base() + [command], sink=self.sink)
        return lease

    async def _release_lease(self, lease: str) -> None:
        await run_command(self._ssh_base() + [f"rm -rf -- {shlex.quote(lease)}"], sink=self.sink, check=False)

    async def deploy(self, plan: DeploymentPlan) -> None:
        state = self.config.remote.state_root.rstrip("/")
        backup = f"{state}/backups/{plan.release_id}"
        ledger = f"{state}/releases/{plan.release_id}.json"
        lease = await self._acquire_lease(plan.release_id)
        try:
            await run_command(
                self._ssh_base() + [f"mkdir -p {shlex.quote(backup)} {shlex.quote(state + '/releases')}"],
                sink=self.sink,
            )
            for mapping in self.config.mappings:
                await self.sink("section", f"Deploy: {mapping.name}")
                await run_command(
                    self._rsync_args(mapping, dry_run=False, backup_dir=backup),
                    cwd=self.config.root,
                    sink=self.sink,
                )
            await self.validate_remote()
            ledger_data = json.dumps({
                "release_id": plan.release_id,
                "commit": plan.commit,
                "deployed_utc": datetime.now(timezone.utc).isoformat(),
                "backup_root": backup,
                "mappings": [m.model_dump() for m in self.config.mappings],
            }, separators=(",", ":"))
            checksum = hashlib.sha256(ledger_data.encode()).hexdigest()
            remote_write = (
                f"umask 077; cat > {shlex.quote(ledger)} <<'DTB_LEDGER'\n"
                f"{ledger_data}\nDTB_LEDGER\n"
                f"printf '%s  %s\\n' {shlex.quote(checksum)} {shlex.quote(ledger)} > {shlex.quote(ledger + '.sha256')}"
            )
            await run_command(self._ssh_base() + [remote_write], sink=self.sink)
        finally:
            await self._release_lease(lease)

    @staticmethod
    def _http_status(url: str) -> int:
        request = urllib.request.Request(url, headers={"User-Agent": "DTB-Deploy/1.0"})
        with urllib.request.urlopen(request, timeout=20) as response:
            return int(response.status)

    async def validate_remote(self) -> None:
        wp_root = shlex.quote(self.config.remote.wordpress_root)
        command = (
            f"find {wp_root}/wp-content/mu-plugins {wp_root}/wp-content/themes -type f -name '*.php' -print0 "
            "| xargs -0 -n1 php -l >/dev/null && "
            f"wp --path={wp_root} core version >/dev/null"
        )
        await run_command(self._ssh_base() + [command], sink=self.sink)
        for url in self.config.health_checks:
            status = await asyncio.to_thread(self._http_status, url)
            await self.sink("stdout", f"HTTP {status} {url}")
            if not 200 <= status < 400:
                raise RuntimeError(f"Health check failed: HTTP {status} {url}")
