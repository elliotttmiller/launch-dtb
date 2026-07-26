from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class SSHConfig(BaseModel):
    host: str
    user: str
    port_env: str
    identity_file_env: str
    known_hosts_file_env: str
    connect_timeout_seconds: int = Field(default=15, ge=1, le=120)

    def port(self) -> int:
        value = os.environ.get(self.port_env, "").strip()
        if not value:
            raise ValueError(f"Environment variable {self.port_env} is required")
        try:
            port = int(value)
        except ValueError as exc:
            raise ValueError(f"{self.port_env} must be an integer") from exc
        if not 1 <= port <= 65535:
            raise ValueError(f"{self.port_env} must be between 1 and 65535")
        return port

    def identity_file(self) -> Path:
        value = os.environ.get(self.identity_file_env, "").strip()
        if not value:
            raise ValueError(f"Environment variable {self.identity_file_env} is required")
        path = Path(value).expanduser().resolve()
        if not path.is_file():
            raise ValueError(f"SSH identity file does not exist: {path}")
        return path

    def known_hosts_file(self) -> Path:
        value = os.environ.get(self.known_hosts_file_env, "").strip()
        if not value:
            raise ValueError(f"Environment variable {self.known_hosts_file_env} is required")
        path = Path(value).expanduser().resolve()
        if not path.is_file():
            raise ValueError(f"Known-hosts file does not exist: {path}")
        return path


class RemoteConfig(BaseModel):
    site_root: str
    wordpress_root: str
    state_root: str


class BuildConfig(BaseModel):
    working_directory: str
    command: list[str]
    required_output: str


class Mapping(BaseModel):
    name: str
    source: str
    destination: str
    owner: Literal["frontend", "deployment", "dtb-backend", "wordpress-theme"]
    delete: bool = False
    excludes: list[str] = []

    @model_validator(mode="after")
    def deny_destructive_sync(self) -> "Mapping":
        if self.delete:
            raise ValueError(f"Destructive rsync deletion is disabled: {self.name}")
        return self


class AppConfig(BaseModel):
    schema_version: int
    environment: Literal["production"]
    repository_root: str
    scan_manifest: str
    ssh: SSHConfig
    remote: RemoteConfig
    build: BuildConfig
    mappings: list[Mapping]
    protected_remote_paths: list[str]
    health_checks: list[str]

    @property
    def root(self) -> Path:
        return Path(self.repository_root).resolve()

    def validate_scan_contract(self) -> None:
        scan_path = self.root / self.scan_manifest
        if not scan_path.is_file():
            raise ValueError(f"Verified SiteGround scan manifest is missing: {scan_path}")
        scan = json.loads(scan_path.read_text(encoding="utf-8"))
        server = scan.get("server", {})
        if server.get("siteRoot") != self.remote.site_root:
            raise ValueError("Configured site root differs from verified scan")
        if server.get("wordpressRoot") != self.remote.wordpress_root:
            raise ValueError("Configured WordPress root differs from verified scan")
        verified = {item["remote"] for item in scan.get("candidateMappings", []) if item.get("verifiedRemoteTarget") is True}
        for mapping in self.mappings:
            destination = mapping.destination.rstrip("/") or "."
            candidate = "wp/wp-content/themes" if destination.startswith("wp/wp-content/themes/") else destination
            if candidate not in verified:
                raise ValueError(f"Mapping is not authorized by scan manifest: {mapping.name} -> {destination}")


def load_config(path: Path) -> AppConfig:
    path = path.expanduser().resolve()
    data = json.loads(path.read_text(encoding="utf-8"))
    data["repository_root"] = str((path.parent / data["repository_root"]).resolve())
    config = AppConfig.model_validate(data)
    config.validate_scan_contract()
    return config
