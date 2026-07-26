# Drywall Toolbox SiteGround Production Management Console

A Windows 11 operator console for browsing the live SiteGround filesystem, preparing file-level production changes, verifying transfer plans, activating releases, reviewing backups, validating production, and exporting operational logs.

## Console workspaces

- **Overview** — connection, source selection, destination, transfer plan, backups, and guardrail status.
- **File Manager** — Windows multi-file/directory selection beside a live SiteGround remote browser.
- **Transfer Queue** — exact `ADD` and `MODIFY` operations from the current preview.
- **Releases & Backups** — local checksummed release ledgers and file-level production backups.
- **Validation** — FTPES, TLS, FTP-root, and public HTTP health gates.
- **Operator Logs** — selectable diagnostic output with clipboard export.
- **Settings** — effective non-secret runtime configuration and protected paths.

## Architecture

- Python 3.11+ and Textual 1.x.
- Native Windows file and directory selectors.
- Live SiteGround remote directory browser.
- Native Python `ftplib.FTP_TLS`; no rsync, WSL, Cygwin, Git execution, npm, or Node.js build step.
- FTP over explicit TLS is mandatory; plain FTP is rejected.
- FTP network endpoint and TLS certificate hostname are separate, environment-overridable values.
- TLS certificate-chain and hostname verification remain mandatory.
- Operators select one or more local files/directories and choose the destination from the live remote tree.
- SHA-256 comparison classifies files before deployment.
- Any source or destination change invalidates the current preview.
- Remote deletion is disabled.
- Protected WordPress and runtime paths are blocked.
- Existing production files are downloaded to local backups before replacement.
- Uploads use temporary names, checksum verification, and remote rename activation.
- Failed transactions attempt immediate restoration of prior files.
- Release ledgers and backups remain local under `tools/siteground-deploy/.state`.

## Requirements

- Windows 11
- Python 3.11+
- SiteGround FTP account scoped to the target website

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

## Local environment

```dotenv
DTB_FTP_PASSWORD=<rotated-siteground-ftp-password>
DTB_FTP_ROOT=/

# Optional overrides. Leave blank to use config.production.json.
DTB_FTP_CONNECT_HOST=
DTB_FTP_TLS_HOSTNAME=
```

The endpoint and TLS hostname must be values documented or verified for the FTP service. Do not disable certificate verification to work around a mismatch.

## Operator workflow

1. Start the console.
2. Run **Connect / Preflight**.
3. Open **File Manager** and add one or more local files/directories.
4. Browse the live SiteGround tree.
5. Select the target directory and click **Use Folder**.
6. Generate the transfer preview.
7. Review the exact queue, byte total, and resolved remote paths.
8. Deploy only the current preview.
9. Review the resulting release ledger and local backup.
10. Run full production validation.

Selected directories retain their top-level directory name beneath the chosen destination. Selected files are placed directly inside the chosen destination. Duplicate remote-path resolution is rejected.

## Safety model

The console blocks writes to configured protected paths, never performs broad remote deletion, and never displays or persists the FTP password outside the local `.env` process environment. Backups, release ledgers, and logs must remain outside the web root.

Never commit `.env`, FTP passwords, certificates, generated backups, or release ledgers.
