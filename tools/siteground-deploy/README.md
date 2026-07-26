# Drywall Toolbox SiteGround Deployment TUI

Local-only production deployment control plane for synchronizing verified Drywall Toolbox repository artifacts to SiteGround over key-authenticated SSH.

## Architecture

- Python 3.12 application.
- Textual and Rich terminal interface.
- Native `rsync` checksum/delta synchronization over OpenSSH.
- SiteGround scan manifest used as an authorization contract for remote destinations.
- Remote deletion disabled.
- Production backups and immutable release ledgers stored outside `public_html` under `$HOME/.dtb-deploy`.
- Atomic remote deployment lease prevents overlapping deployments.
- Local clean-Git, build-output, SSH, remote-tool, PHP-lint, WP-CLI and HTTP health gates.

This tool does not use GitHub Actions and does not modify production unless the operator first completes a dry run and confirms the deployment modal.

## Requirements

- Python 3.12+
- Git
- Node.js and npm
- OpenSSH client
- `rsync` available locally

On Windows, run the application in WSL or another environment that provides native `rsync`. OpenSSH must be configured for key-only authentication.

## Installation

From the repository root:

```powershell
cd tools/siteground-deploy
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
```

WSL/Linux activation:

```bash
cd tools/siteground-deploy
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
```

## SSH security configuration

The application never stores a private key path or password in the repository. Set the following process-level environment variables:

PowerShell:

```powershell
$env:DTB_SSH_IDENTITY_FILE="$HOME\.ssh\dtb_siteground_ed25519"
$env:DTB_KNOWN_HOSTS_FILE="$HOME\.ssh\known_hosts"
```

WSL/Linux:

```bash
export DTB_SSH_IDENTITY_FILE="$HOME/.ssh/dtb_siteground_ed25519"
export DTB_KNOWN_HOSTS_FILE="$HOME/.ssh/known_hosts"
```

Populate `known_hosts` out of band after independently verifying the SiteGround host fingerprint. The application enforces:

- `BatchMode=yes`
- `IdentitiesOnly=yes`
- `StrictHostKeyChecking=yes`
- explicit identity file
- explicit known-hosts file
- configured custom SSH port

Do not commit private keys, passwords, API tokens or generated known-host data.

## Run

```powershell
cd tools/siteground-deploy
.\.venv\Scripts\Activate.ps1
dtb-deploy
```

Or:

```bash
cd tools/siteground-deploy
source .venv/bin/activate
dtb-deploy
```

## Operator workflow

1. **Preflight** validates executables, clean Git state, current commit, SSH authentication and remote command availability.
2. **Build** runs the canonical production frontend build and requires `dist/index.html`.
3. **Dry Run** executes checksummed, itemized `rsync --dry-run` for every authorized mapping.
4. Review the structured terminal output.
5. **Deploy** opens an explicit production confirmation gate.
6. The engine obtains a remote deployment lease, creates a release backup root, synchronizes bounded overlays, validates PHP/WP/HTTP runtime health and writes a checksummed ledger.
7. **Validate** may be run independently after deployment.

## Authorized mappings

The configuration maps only repository-owned artifacts:

- `dist/` to the public storefront root as a non-destructive overlay.
- `drywalltoolbox/.htaccess` to the verified root Apache file.
- DTB MU plugins to `wp/wp-content/mu-plugins/` as a non-destructive overlay.
- `drywall-toolbox` theme only.
- `headless-base` theme only.

`.user.ini` is intentionally excluded because the production scan did not verify that target.

## Protected production state

The following paths are excluded from synchronization:

- WordPress configuration
- WordPress core
- regular plugins
- uploads
- cache and upgrade directories
- `.well-known`
- production logs
- `.user.ini`
- runtime secrets

Remote deletion is rejected by configuration validation. Stale files are observable in dry-run output but are never removed automatically.

## Release state

Remote operational state:

```text
$HOME/.dtb-deploy/
├── backups/<release-id>/
├── releases/<release-id>.json
├── releases/<release-id>.json.sha256
└── deploy.lock.d/
```

The release ledger includes the Git commit, deployment timestamp, backup root and exact mappings.

## Failure behavior

- A dirty Git worktree blocks deployment.
- A missing scan manifest or mismatched production root blocks startup.
- Missing SSH credentials or known-host file blocks startup.
- Missing local or remote executables block preflight.
- Failed rsync, PHP lint, WP-CLI bootstrap or HTTP health checks fail the deployment.
- The remote deployment lease is released in a `finally` block.
- Existing remote files changed by rsync are copied into the release backup root.

## Current operational limitation

The first release provides backup creation and release ledgers, but does not expose automated rollback in the TUI. Restoration must not be attempted until a release-specific rollback command is added and validated against the backup layout. This is deliberate: an unverified generic rollback is less safe than an explicit restore procedure.
