from __future__ import annotations

import json
import os
from pathlib import Path, PurePosixPath
from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field, model_validator


class FTPConfig(BaseModel):
    host: str
    user: str
    port: int = Field(default=21, ge=1, le=65535)
    password_env: str = "DTB_FTP_PASSWORD"
    root_env: str = "DTB_FTP_ROOT"
    timeout_seconds: int = Field(default=30, ge=5, le=300)
    passive: bool = True
    require_tls: bool = True

    def password(self) -> str:
        value = os.environ.get(self.password_env, "")
        if not value:
            raise ValueError(f"Environment variable {self.password_env} is required")
        return value

    def root(self) -> str:
        value = os.environ.get(self.root_env, "").strip()
        if not value:
            raise ValueError(f"Environment variable {self.root_env} is required")
        normalized = "/" + value.strip("/") if value != "/" else "/"
        if ".." in PurePosixPath(normalized).parts:
            raise ValueError("FTP root may not contain parent traversal")
        return normalized


class RemoteConfig(BaseModel):
    verified_site_root: str
    verified_wordpress_root: str
    local_state_directory: str = ".state"


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
            raise ValueError(f"Remote deletion is disabled: {self.name}")
        destination = PurePosixPath(self.destination)
        if destination.is_absolute() or ".." in destination.parts:
            raise ValueError(f"Unsafe FTP destination: {self.destination}")
        return self


class AppConfig(BaseModel):
    schema_version: int
    environment: Literal["production"]
    repository_root: str
    scan_manifest: str
    ftp: FTPConfig
    remote: RemoteConfig
    build: BuildConfig
    mappings: list[Mapping]
    protected_remote_paths: list[str]
    health_checks: list[str]

    @property
    def root(self) -> Path:
        return Path(self.repository_root).resolve()

    @property
    def state_root(self) -> Path:
        return (self.root / "tools/siteground-deploy" / self.remote.local_state_directory).resolve()

    def validate_scan_contract(self) -> None:
        scan_path = self.root / self.scan_manifest
        if not scan_path.is_file():
            raise ValueError(f"Verified SiteGround scan manifest is missing: {scan_path}")
        scan = json.loads(scan_path.read_text(encoding="utf-8"))
        server = scan.get("server", {})
        if server.get("siteRoot") != self.remote.verified_site_root:
            raise ValueError("Configured site root differs from verified scan")
        if server.get("wordpressRoot") != self.remote.verified_wordpress_root:
            raise ValueError("Configured WordPress root differs from verified scan")
        verified = {
            item["remote"]
            for item in scan.get("candidateMappings", [])
            if item.get("verifiedRemoteTarget") is True
        }
        for mapping in self.mappings:
            destination = mapping.destination.rstrip("/") or "."
            candidate = "wp/wp-content/themes" if destination.startswith("wp/wp-content/themes/") else destination
            if candidate not in verified:
                raise ValueError(f"Mapping is not authorized by scan manifest: {mapping.name} -> {destination}")


def load_config(path: Path) -> AppConfig:
    resolved = path.expanduser().resolve()
    load_dotenv(resolved.parent / ".env", override=False)
    data = json.loads(resolved.read_text(encoding="utf-8"))
    data["repository_root"] = str((resolved.parent / data["repository_root"]).resolve())
    config = AppConfig.model_validate(data)
    config.validate_scan_contract()
    config.ftp.password()
    config.ftp.root()
    return config
