# Production Configuration: SiteGround Git Integration

This guide covers configuring the Release Management system for production deployment to SiteGround's official Git repository.

## Prerequisites

- PR #70 (Release Management system) merged and deployed to production
- WordPress admin access to https://elliottm4.sg-host.com/wp-admin/
- GitHub repository ownership or admin access to https://github.com/elliotttmiller/launch-dtb
- SiteGround account access with SSH Key Manager available
- Ability to edit production wp-config.php (via SiteGround file manager or SFTP)

## Phase 1: Generate Secrets

### Generate Webhook Secret

Generate a strong random HMAC-SHA256 secret for signing webhook payloads:

```bash
openssl rand -hex 32
```

**Save this value** — it's used twice:
- GitHub Actions secret: `DTB_DEPLOYMENT_WEBHOOK_SECRET`
- wp-config.php constant: `DTB_DEPLOYMENT_WEBHOOK_SECRET` (**must match exactly**)

For the ignored local runtime file only, `.\scripts\deployment\configure-local-webhook-secret.ps1 -Rotate` generates one value in memory and updates both the local constant and GitHub Actions secret without logging it. It does not update SiteGround's live `wp-config.php`.

Example output:
```
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

### Get SiteGround SSH Host Key

```bash
ssh-keyscan -p 18765 giowm1315.siteground.biz 2>/dev/null
```

Output:
```
[giowm1315.siteground.biz]:18765 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJf...
```

**Save the entire line** for GitHub Actions secret: `SITEGROUND_GIT_KNOWN_HOSTS`

### Generate and Register a Dedicated SiteGround Deployment Key

Generate a dedicated ED25519 key pair for the one-way GitHub Actions → SiteGround connection:

```bash
ssh-keygen -t ed25519 -a 100 -N '' -C 'dtb-siteground-github-actions' -f ~/.ssh/dtb-siteground-github-actions
```

- Keep the private file outside the repository. Store its complete contents only in `SITEGROUND_GIT_SSH_PRIVATE_KEY`.
- Register the `.pub` line in SiteGround Site Tools → Devs → SSH Keys Manager → Add new → Import.
- Do not add this key under GitHub repository **Deploy keys**. GitHub Actions reads this repository with its job-scoped `GITHUB_TOKEN`.
- The dedicated automation key must be unencrypted because the workflow cannot prompt for a passphrase.

## Phase 2: Create GitHub Deployment Token (PAT)

1. Visit https://github.com/settings/tokens?type=beta
2. Click **"Generate new token"**
3. Configure:
   - **Token name:** `DTB Release Deployment`
   - **Description:** `Automated release/rollback via GitHub Actions`
   - **Repository access:** Select `Only select repositories` → `elliotttmiller/launch-dtb`
   - **Repository permissions:**
     - Actions: Read and write
     - Contents: Read-only
     - Pull requests: Read-only
   - **Expiration:** 90 days (adjust per your org policy)
4. Click **"Generate token"**
5. **Copy immediately** (cannot be viewed again after leaving page)

Token format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

Use for: `DTB_GITHUB_DEPLOYMENT_TOKEN` in wp-config.php

## Phase 3: Create GitHub Actions Secrets

1. Go to https://github.com/elliotttmiller/launch-dtb/settings/secrets/actions
2. Click **"New repository secret"** for each of these:

| Secret Name | Value | Source |
|---|---|---|
| `SITEGROUND_GIT_REMOTE` | `ssh://u2350-gksz9clvygx0@giowm1315.siteground.biz:18765/home/customer/www/elliottm4.sg-host.com/public_html/wp` | Provided SiteGround URL |
| `SITEGROUND_GIT_BRANCH` | `master` | Verified from the production SiteGround Git remote HEAD on 2026-07-30 |
| `SITEGROUND_GIT_SSH_PRIVATE_KEY` | Full unencrypted OpenSSH private key | Dedicated key whose public half is registered in SiteGround SSH Key Manager |
| `SITEGROUND_GIT_KNOWN_HOSTS` | Output from ssh-keyscan (Phase 1) | Run command above |
| `DTB_DEPLOYMENT_WEBHOOK_SECRET` | Hex string from openssl (Phase 1) | Must match wp-config.php |

**Important:** Paste values exactly. No extra whitespace.

### Protect the Production Environment

The workflow's deploy and rollback jobs target the GitHub environment `siteground-production`. Configure it before the first dispatch with:

- required reviewer: `elliotttmiller`;
- prevent self-review: disabled, because the repository currently has one production operator;
- wait timer: `0`;
- no branch policy, because the workflow accepts an explicitly reviewed branch, tag, or commit SHA.

This approval is separate from the workflow's typed `DEPLOY` or `ROLLBACK` confirmation and is required before the production job starts.

## Phase 4: Add wp-config.php Constants

On production (SiteGround), edit `/home/customer/www/elliottm4.sg-host.com/public_html/wp-config.php`

Add these constants **before the "That's all, stop editing!" line**:

```php
/**
 * Release Management Integration
 */
define( 'DTB_DEPLOYMENT_WEBHOOK_SECRET', 'YOUR_WEBHOOK_SECRET_HERE' );
define( 'DTB_GITHUB_DEPLOYMENT_TOKEN', 'ghp_YOUR_PAT_HERE' );
define( 'DTB_GITHUB_REPO_OWNER', 'elliotttmiller' );
define( 'DTB_GITHUB_REPO_NAME', 'launch-dtb' );
define( 'DTB_GITHUB_RELEASE_WORKFLOW_FILE', 'release-siteground.yml' );
```

Replace:
- `YOUR_WEBHOOK_SECRET_HERE` → Hex string from Phase 1
- `ghp_YOUR_PAT_HERE` → Personal Access Token from Phase 2

Example:
```php
define( 'DTB_DEPLOYMENT_WEBHOOK_SECRET', 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1' );
define( 'DTB_GITHUB_DEPLOYMENT_TOKEN', 'ghp_AbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhI' );
define( 'DTB_GITHUB_REPO_OWNER', 'elliotttmiller' );
define( 'DTB_GITHUB_REPO_NAME', 'launch-dtb' );
define( 'DTB_GITHUB_RELEASE_WORKFLOW_FILE', 'release-siteground.yml' );
```

**Critical:** `DTB_DEPLOYMENT_WEBHOOK_SECRET` must match the GitHub Actions secret **exactly** — no leading/trailing whitespace.

## Phase 5: Verify Configuration

### GitHub Actions Secrets
1. Go to https://github.com/elliotttmiller/launch-dtb/settings/secrets/actions
2. Verify all 5 secrets exist:
   - [ ] `SITEGROUND_GIT_REMOTE`
   - [ ] `SITEGROUND_GIT_BRANCH`
   - [ ] `SITEGROUND_GIT_SSH_PRIVATE_KEY`
   - [ ] `SITEGROUND_GIT_KNOWN_HOSTS`
   - [ ] `DTB_DEPLOYMENT_WEBHOOK_SECRET`

### wp-config.php Constants
SSH into SiteGround and verify:

```bash
php -r "
require '/path/to/wp-config.php';
echo 'DTB_DEPLOYMENT_WEBHOOK_SECRET: ' . (defined('DTB_DEPLOYMENT_WEBHOOK_SECRET') ? '✓' : '✗') . PHP_EOL;
echo 'DTB_GITHUB_DEPLOYMENT_TOKEN: ' . (defined('DTB_GITHUB_DEPLOYMENT_TOKEN') ? '✓' : '✗') . PHP_EOL;
"
```

## Phase 6: First Production Release Test

### Access System Manager
1. Visit WordPress admin: https://elliottm4.sg-host.com/wp-admin/
2. Navigate to **System Manager** (left menu under "Drywall Toolbox")
3. Verify the **Release Management** tab is visible

### Deploy a Low-Risk Ref
1. Click **Release Management** tab
2. Click the **"Deploy"** button
3. **Ref to deploy:** Select `develop` branch
4. **Confirmation:** Type `DEPLOY` exactly
5. Click **"Confirm and Deploy"**

### Monitor in Real-Time
- **System Manager Overview tab** updates every 5 seconds
- Expected progression:
  - Planning → Validated → Backing up → Deploying → Verified → Completed
  - Each step should show a green checkmark
  
- **GitHub Actions run** (https://github.com/elliotttmiller/launch-dtb/actions)
  - Watch jobs: `guard` → `plan-and-validate` → `deploy`
  - All should complete successfully

### Post-Deployment Verification
- [ ] Site loads: https://elliottm4.sg-host.com/
- [ ] Health check passes:
  ```bash
  curl https://elliottm4.sg-host.com/wp-json/dtb/v1/health
  # Expected: {"status":"ok",...}
  ```
- [ ] System Manager shows "Deployed" status
- [ ] Release appears in **History** tab with timestamp
- [ ] Database queries complete without corruption
- [ ] Stripe integration functional
- [ ] Veeqo/QuickBooks webhook integration working
- [ ] WooCommerce checkout operational

### Monitor Release Event Log
In WordPress admin → **System Manager** → **History** tab

Should see events in order:
1. `release_planned`
2. `release_validated`
3. `release_backup_started`
4. `release_backed_up`
5. `release_deploy_started`
6. `release_deployed`
7. `release_verified`
8. `release_completed`

## Phase 7: Rollback Test (Recommended)

Once you have a successful deployment:

1. **Note the release ID** (e.g., `rel-123456-abc1234`)
2. Deploy another low-risk change to create a second release
3. Go to **Release Management** → **Rollback**
4. Select the **first release ID** from dropdown
5. Type `ROLLBACK` confirmation
6. Monitor in real-time (same progression as deployment)
7. Verify site is back to previous state

## Troubleshooting

### GitHub Actions Secret Not Recognized
- Verify secret name matches exactly (case-sensitive)
- Re-save the secret if modified
- Wait 1-2 minutes for GitHub to propagate

### Webhook Signature Invalid
- Verify `DTB_DEPLOYMENT_WEBHOOK_SECRET` in wp-config.php matches GitHub Actions secret exactly
- Check for leading/trailing whitespace
- Raw hex string — no special characters needed

### SiteGround SSH Authentication Failed
- Verify `SITEGROUND_GIT_SSH_PRIVATE_KEY` includes the full OpenSSH header/footer and has no surrounding whitespace
- Verify the key is unencrypted: `ssh-keygen -y -P "" -f /path/to/private-key`
- Verify the matching `.pub` key is active in SiteGround SSH Key Manager
- Verify `SITEGROUND_GIT_KNOWN_HOSTS` matches exactly (run ssh-keyscan again)
- Do not add the SiteGround public key to GitHub repository Deploy keys

### Deployment Hangs
- Check System Manager Overview for stuck status
- Check GitHub Actions run logs for timeout
- May need to increase `timeout-minutes` in `.github/workflows/release-siteground.yml` (currently 30)

### Protected Path Boundary Violations
- Check workflow run logs for "Forbidden runtime-owned or secret content entered the payload"
- Verify only `.htaccess`, `index.php`, `wp-content/mu-plugins/`, `wp-content/themes/` are changed
- Verify protected files like `wp-config.php` are not modified

## Reference

- **Workflow file:** `.github/workflows/release-siteground.yml`
- **Deployment script:** `scripts/deployment/siteground-git-release.sh`
- **Release manifest tags:** `dtb-release/<release-id>` on GitHub
- **Backup tags:** `dtb-backup/<backup-id>` on SiteGround Git
- **Release event log:** `wp_dtb_release_events` database table
- **Architecture documentation:** `docs/deployment/release-management-architecture.md`
- **System Manager:** WordPress admin → System Manager
