# Drywall Toolbox SiteGround Deployment TUI

Local-only Windows 11 production deployment control plane for synchronizing verified Drywall Toolbox repository artifacts to SiteGround using FTP over explicit TLS (FTPES).

## Architecture

- Python 3.12 application.
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
- Python 3.12+
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

Edit `.env` locally:

```dotenv
DTB_FTP_PASSWORD=<siteground-ftp-account-password>
DTB_FTP_ROOT=/
```

The configured account is:

```text
Host: ftp.elliottm4.sg-host.com
User: dtb@elliottm4.sg-host.com
Port: 21
Security: FTP over explicit TLS (FTPES)
Passive mode: enabled
```

`DTB_FTP_ROOT=/` is valid only when the FTP account opens directly at the production `public_html` directory and the root contains `wp/`. The preflight rejects a root that does not expose that directory. If the account opens above `public_html`, set the value to the FTP-visible path for the website root, for example `/public_html`.

Never commit `.env`, passwords, downloaded backups or release state.

## Run

```powershell
cd tools\siteground-deploy
.\.venv\Scripts\Activate.ps1
dtb-deploy
```

## Operator workflow

1. **Preflight** validates Git, npm, clean repository state, FTPES authentication, TLS-protected data mode and the FTP root.
2. **Build** runs the canonical frontend production build and requires `frontend/dist/index.html`.
3. **Dry Run** downloads and hashes mapped remote files, then reports `ADD`, `MODIFY` and `UNCHANGED` entries.
4. Review every proposed change.
5. **Deploy** opens an explicit production confirmation gate.
6. The engine acquires an FTP directory lease, downloads backups, uploads temporary files, verifies SHA-256 hashes, renames files into place and runs HTTP health checks.
7. A failed transaction attempts to restore every file already changed.
8. **Validate** independently checks FTPES connectivity, the configured FTP root and public health endpoints.

## Authorized mappings

- `frontend/dist/` to the public storefront root as a non-destructive overlay.
- `drywalltoolbox/.htaccess` to the verified root Apache file.
- DTB MU plugins to `wp/wp-content/mu-plugins/`.
- `drywall-toolbox` theme only.
- `headless-base` theme only.

`.user.ini` is excluded because the production scan did not verify it as a deployment target.

## Protected production state

The deployment engine refuses writes to:

- `wp/wp-config.php`
- WordPress core directories
- regular plugins
- uploads
- cache and upgrade directories
- `.well-known`
- production logs
- `.user.ini`

No stale remote file is deleted automatically.

## Local release state

```text
tools/siteground-deploy/.state/
├── backups/<release-id>/
├── leases/<release-id>.txt
└── releases/
    ├── <release-id>.json
    └── <release-id>.json.sha256
```

The ledger records the Git commit, deployment timestamp, transport, exact changed files, local hashes and backup path.

## FTP-specific limitations

FTPES encrypts credentials and file transfers, but it does not provide a remote command shell. Therefore this transport cannot execute remote PHP lint, WP-CLI validation, Action Scheduler inspection or server-side cache commands. Validation consists of:

- TLS-authenticated FTP connectivity;
- verified FTP root structure;
- per-file SHA-256 verification after upload;
- public storefront and REST health checks.

FTP also lacks rsync block-level deltas. Changed files are transferred in full. Unchanged files are not uploaded.

## Failure behavior

- Dirty Git state blocks deployment.
- Missing or invalid credentials block startup.
- A non-TLS FTP connection is prohibited.
- A mismatched FTP root blocks preflight.
- Protected-path mappings block the operation.
- Remote checksum mismatch aborts the transaction.
- HTTP health-check failure triggers transactional rollback attempts.
- Local backups are retained for manual recovery.
- The FTP deployment lease is removed in a `finally` block.

## First execution

Run only:

1. `Preflight`
2. `Build`
3. `Dry Run`

Do not deploy until the FTP root and every proposed remote path have been inspected and confirmed.
