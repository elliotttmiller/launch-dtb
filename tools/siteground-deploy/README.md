# Drywall Toolbox SiteGround Deployment TUI

Local-only Windows 11 production deployment control plane for synchronizing verified Drywall Toolbox repository artifacts to SiteGround using FTP over explicit TLS (FTPES).

## Architecture

- Python 3.11+ application.
- Textual and Rich terminal interface.
- Native Python `ftplib.FTP_TLS`; no rsync, WSL, Cygwin or external FTP executable.
- FTPES is mandatory. Plain unencrypted FTP is rejected.
- SiteGround scan manifest remains the authorization contract for deployment destinations.
- SHA-256 comparison classifies files as `ADD`, `MODIFY` or `UNCHANGED`.
- Remote deletion is disabled.
- Existing production files are downloaded to local release backups before replacement.
- Files upload to temporary names, are checksum-verified, and are renamed into place.
- Failed transactions attempt immediate restoration of the prior remote files.
- Release ledgers and backups remain local under `tools/siteground-deploy/.state`.

SiteGround documents FTP over explicit TLS on port 21 for secure FTP connections. Do not configure or permit plain FTP.

## Requirements

- Windows 11
- Python 3.11+
- Git
- Node.js and npm
- A SiteGround FTP account scoped to the target website

## Installation

From PowerShell:

```powershell
cd tools\siteground-deploy
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
Copy-Item .env.example .env
```
