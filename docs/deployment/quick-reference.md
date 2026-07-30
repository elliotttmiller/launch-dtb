# SiteGround Release Inputs

Use these values for the operator-controlled `/wp` release workflow. Never paste secret values into this file, issues, logs, or chat.

## Phase 1 — Generate and register secrets

- `DTB_DEPLOYMENT_WEBHOOK_SECRET`: generated and configured in the runtime `wp-config.php`; copy that exact 64-character hexadecimal value into the GitHub Actions secret of the same name.
- For the ignored local runtime mirror only, `.\scripts\deployment\configure-local-webhook-secret.ps1 -Rotate` safely updates both the local constant and GitHub Actions secret. It does not update production.
- `SITEGROUND_GIT_KNOWN_HOSTS`: run `ssh-keyscan -p 18765 giowm1315.siteground.biz` from a trusted network and save the complete verified host-key line as the GitHub Actions secret.
- Register the dedicated unencrypted ED25519 key's `.pub` line in SiteGround Site Tools → Devs → SSH Keys Manager → Add new → Import. Store only its private half in `SITEGROUND_GIT_SSH_PRIVATE_KEY`.
- Do not create a GitHub repository Deploy Key for this flow.

## Phase 2 — GitHub deployment token

- Token name: `DTB Release Deployment`
- Repository: `elliotttmiller/launch-dtb` only
- Permissions: Actions read/write, Contents read, Pull requests read
- Expiration: 90 days
- Destination: runtime `DTB_GITHUB_DEPLOYMENT_TOKEN` in `wp-config.php`

## Phase 3 — GitHub Actions secrets

Repository settings: `https://github.com/elliotttmiller/launch-dtb/settings/secrets/actions`

| Secret | Input |
|---|---|
| `SITEGROUND_GIT_REMOTE` | `ssh://u2350-gksz9clvygx0@giowm1315.siteground.biz:18765/home/customer/www/elliottm4.sg-host.com/public_html/wp` |
| `SITEGROUND_GIT_BRANCH` | `master` — verified from the production SiteGround Git remote HEAD on 2026-07-30 |
| `SITEGROUND_GIT_SSH_PRIVATE_KEY` | Full unencrypted dedicated private key; matching public key registered in SiteGround |
| `SITEGROUND_GIT_KNOWN_HOSTS` | Verified Phase 1 host-key line |
| `DTB_DEPLOYMENT_WEBHOOK_SECRET` | Exact Phase 1 secret; must match `wp-config.php` |

## Phase 4 — Runtime constants

Runtime file: `/home/customer/www/elliottm4.sg-host.com/public_html/wp-config.php`

- `DTB_DEPLOYMENT_WEBHOOK_SECRET`: configured; copy its value to GitHub Actions.
- `DTB_GITHUB_DEPLOYMENT_TOKEN`: configured.
- `DTB_GITHUB_REPO_OWNER`: `elliotttmiller`
- `DTB_GITHUB_REPO_NAME`: `launch-dtb`
- `DTB_GITHUB_RELEASE_WORKFLOW_FILE`: `release-siteground.yml`

## Phase 5 — Preflight

- Confirm all five GitHub Actions secrets exist.
- Confirm the webhook values match exactly with no whitespace.
- Confirm independent file and database backups and rollback readiness.
- Confirm the `siteground-production` GitHub environment requires approval from `elliotttmiller`; self-review remains allowed while there is only one production operator.
- Confirm the release scope is the dependency-consistent production `/wp` payload only.

## Phase 6 — Deploy

- Workflow: `DTB Release Management — SiteGround`
- `action`: `deploy`
- `ref`: reviewed branch, tag, or commit SHA; default `main`
- `confirm`: `DEPLOY`
- Expected lifecycle: planned → validated → backup → deploy → verified → completed
- Validate the site, `/wp-json/dtb/v1/health`, Deployment Center status/history, checkout, and critical integrations.
- Clear required SiteGround caches after promotion.

## Phase 7 — Rollback

- Select a known-good release ID from Deployment Center history.
- `action`: `rollback`
- `ref`: leave unused
- `confirm`: `ROLLBACK`
- `rollback_release_id`: exact `rel-...` identifier
- Validate the restored site, health endpoint, release history, checkout, and critical integrations; clear required SiteGround caches.
