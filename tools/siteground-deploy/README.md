# Drywall Toolbox SiteGround File Manager TUI

Local-only Windows 11 control plane for browsing SiteGround and safely transferring operator-selected files and directories over FTP over explicit TLS (FTPES).

## Architecture

- Python 3.11+ and Textual.
- Native Windows multi-file and directory selectors.
- Live SiteGround remote directory browser.
- Native Python `ftplib.FTP_TLS`; no rsync, WSL, Cygwin or external FTP executable.
- No npm, Node.js build, Git commands or source-control mutations.
- FTPES is mandatory. Plain unencrypted FTP is rejected.
- The FTP network endpoint and TLS certificate hostname are configured separately.
- TLS hostname and certificate-chain validation remain enabled.
- Operators select one or more local files/directories and choose the destination from the live remote tree.
- SHA-256 comparison classifies files as `ADD`, `MODIFY` or `UNCHANGED` before deployment.
- Preview becomes invalid whenever sources or destination change.
- Remote deletion is disabled.
- Protected WordPress and runtime paths are blocked.
- Existing production files are downloaded to local release backups before replacement.
- Files upload to temporary names, are checksum-verified, and are renamed into place.
- Failed transactions attempt immediate restoration of prior remote files.
- Release ledgers and backups remain local under `tools/siteground-deploy/.state`.
- The log console is selectable and exposes a `Copy Log` button plus `Ctrl+Shift+C`.

## FTPES endpoint

The connection uses:

- Network endpoint: `ftp.elliottm4.sg-host.com:21`
- TLS certificate hostname: `elliottm4.sg-host.com`

This preserves certificate validation while using the SiteGround FTP listener.

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
2. Run **Connect / Preflight**. This authenticates through FTPES and loads the live remote root.
3. Use **Add Files** and/or **Add Directory**. Multiple sources may be combined in one transfer plan.
4. Navigate the live SiteGround browser with **Open Folder**, **Up** and **Refresh**.
5. Select the intended directory and click **Use Folder**.
6. Run **Preview Transfer** and inspect every resolved `ADD`, `MODIFY` and `UNCHANGED` path.
7. Use **Copy Log** or `Ctrl+Shift+C` when logs need to be shared.
8. Run **Deploy Preview** only after reviewing the current plan.
9. Run **Validate Production** for an independent FTPES and HTTP health check.

Selected directories retain their top-level directory name beneath the chosen destination. Selected files are placed directly inside the chosen destination. Duplicate remote path resolution is rejected.

Never commit `.env`, FTP passwords, certificates, generated backups or release ledgers.
