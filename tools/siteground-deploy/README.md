# Drywall Toolbox SiteGround Deployment TUI

Local-only Windows 11 production deployment control plane for synchronizing verified Drywall Toolbox repository artifacts to SiteGround using FTP over explicit TLS (FTPES).

## Architecture

- Python 3.11+ application.
- Textual and Rich terminal interface.
- Native Python `ftplib.FTP_TLS`; no rsync, WSL, Cygwin or external FTP executable.
- No Git commands or source-control mutations. Operators manage `git fetch` and `git reset --hard` manually before launching the tool.
- FTPES is mandatory. Plain unencrypted FTP is rejected.
- TLS hostname and certificate-chain validation remain enabled.
- SiteGround scan manifest remains the authorization contract for deployment destinations.
- SHA-256 comparison classifies files as `ADD`, `MODIFY` or `UNCHANGED`.
- Remote deletion is disabled.
- Existing production files are downloaded to local release backups before replacement.
- Files upload to temporary names, are checksum-verified, and are renamed into place.
- Failed transactions attempt immediate restoration of the prior remote files.
- Release ledgers and backups remain local under `tools/siteground-deploy/.state`.
- The log console is selectable and exposes a `Copy Log` button plus `Ctrl+Shift+C`.

The configured FTPES endpoint is `elliottm4.sg-host.com:21`, which matches the production `*.sg-host.com` certificate. Do not use `ftp.elliottm4.sg-host.com`, because that two-label hostname is not covered by the wildcard certificate.

## Requirements

- Windows 11
- Python 3.11+
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

Before starting the TUI, update the local checkout manually from the repository root using the exact branch or commit intended for production. The deployment application does not run or validate Git commands.

Run:

```powershell
dtb-deploy
```

## Operator workflow

1. Update the local checkout manually.
2. Start the TUI.
3. Run **Preflight** to validate npm, FTPES authentication, TLS, and the FTP-visible WordPress root.
4. Run **Build**.
5. Run **Dry Run** and inspect every `ADD` and `MODIFY` entry.
6. Use **Copy Log** or `Ctrl+Shift+C` to copy the complete console output.
7. Run **Deploy** only after reviewing the plan.
8. Run **Validate** after deployment when an independent health check is required.

Never commit `.env`, FTP passwords, certificates, generated backups, or release ledgers.
