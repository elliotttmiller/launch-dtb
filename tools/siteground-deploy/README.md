# Drywall Toolbox SiteGround File Transfer TUI

Local-only Windows 11 control plane for transferring operator-selected files and directories to SiteGround over FTP over explicit TLS (FTPES).

## Architecture

- Python 3.11+ application.
- Textual terminal interface with native Windows file and directory selectors.
- Native Python `ftplib.FTP_TLS`; no rsync, WSL, Cygwin or external FTP executable.
- No npm, Node.js build, Git commands or source-control mutations.
- FTPES is mandatory. Plain unencrypted FTP is rejected.
- TLS hostname and certificate-chain validation remain enabled.
- SiteGround scan data validates the configured production roots.
- Operators explicitly select one local file or directory and enter a remote destination relative to the FTP root.
- SHA-256 comparison classifies files as `ADD`, `MODIFY` or `UNCHANGED` before deployment.
- Remote deletion is disabled.
- Protected WordPress and runtime paths are blocked.
- Existing production files are downloaded to local release backups before replacement.
- Files upload to temporary names, are checksum-verified, and are renamed into place.
- Failed transactions attempt immediate restoration of prior remote files.
- Release ledgers and backups remain local under `tools/siteground-deploy/.state`.
- The log console is selectable and exposes a `Copy Log` button plus `Ctrl+Shift+C`.

The configured FTPES endpoint is `elliottm4.sg-host.com:21`, which matches the production `*.sg-host.com` certificate.

## Requirements

- Windows 11
- Python 3.11+
- A SiteGround FTP account scoped to the target website

## Installation

```powershell
cd tools\siteground-deploy
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
Copy-Item .env.example .env
```

Run:

```powershell
dtb-deploy
```

## Operator workflow

1. Start the TUI.
2. Run **Preflight** to validate FTPES authentication, TLS and the configured FTP-visible WordPress root.
3. Use **Select File** or **Select Directory**, or paste an absolute Windows path into **Local source**.
4. Enter the remote destination relative to the configured FTP root, for example `wp/wp-content/mu-plugins`.
5. Run **Preview Transfer** and inspect every `ADD`, `MODIFY` and `UNCHANGED` entry.
6. Use **Copy Log** or `Ctrl+Shift+C` to copy the complete console output.
7. Run **Deploy** only after reviewing the preview.
8. Run **Validate** for an independent FTPES and HTTP health check.

Selecting a directory preserves that directory as the top-level folder under the entered remote destination. Selecting a file transfers that file into the entered destination directory.

Never commit `.env`, FTP passwords, certificates, generated backups or release ledgers.
