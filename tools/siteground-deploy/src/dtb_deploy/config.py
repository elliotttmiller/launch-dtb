from __future__ import annotations

import json
import os
from pathlib import Path, PurePosixPath
from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field


class FTPConfig(BaseModel):
    connect_host: str
    tls_hostname: str
    user: str
    port: int = Field(default=21, ge=1, le=65535)
    connect_host_env: str = "DTB_FTP_CONNECT_HOST"
    tls_hostname_env: str = "DTB_FTP_TLS_HOSTNAME"
    password_env: str = "DTB_FTP_PASSWORD"
    root_env: str = "DTB_FTP_ROOT"
    timeout_seconds: int = Field(default=30, ge=5, le=300)
    passive: bool = True
    require_tls: bool = True

    def effective_connect_host(self) -> str:
        return os.environ.get(self.connect_host_env, "").strip() or self.connect_host

    def effective_tls_hostname(self) -> str:
        return os.environ.get(self.tls_hostname_env, "").strip() or self.tls_hostname

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


class AppConfig(BaseModel):
    schema_version: int
    environment: Literal["production"]
    repository_root: str
    scan_manifest: str
    ftp: FTPConfig
    remote: RemoteConfig
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


def load_config(path: Path) -> AppConfig:
    resolved = path.expanduser().resolve()
    load_dotenv(resolved.parent / ".env", override=False)
    data = json.loads(resolved.read_text(encoding="utf-8"))
    data["repository_root"] = str((resolved.parent / data["repository_root"]).resolve())
    config = AppConfig.model_validate(data)
    config.validate_scan_contract()

    # Resolve optional local overrides once so every engine consumer uses the
    # same immutable endpoint and TLS verification name for this process.
    config.ftp.connect_host = config.ftp.effective_connect_host()
    config.ftp.tls_hostname = config.ftp.effective_tls_hostname()

    config.ftp.password()
    config.ftp.root()
    return config
