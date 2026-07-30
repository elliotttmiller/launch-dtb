# Release Management Platform — Architecture

Last verified against active source: 2026-07-30.

## 1. Purpose and scope

This is the Deployment & Release Management subsystem for the production WordPress application tree (production `/wp`). It is an orchestration layer built **around** the official SiteGround Git repository — it does not replace it, duplicate it, or introduce a competing deployment mechanism (no FTP, rsync, or custom file sync).

System of record, unchanged:

```text
GitHub Repository → SiteGround Git Repository → Production WordPress (/wp)
```

GitHub remains the implementation source of truth. The SiteGround Git repository remains the sanctioned production deployment backend. This platform adds controlled promotion, immutable release manifests, automatic backup/rollback, and complete observability on top of that existing path.

**Deployment scope** — the Git-managed surface is the production `/wp` application tree only:

- `.htaccess`
- `index.php`
- `wp-content/mu-plugins/`
- `wp-content/themes/`

The frontend build and site-root files (`index.html`, root `.htaccess`, `.user.ini`, `logos/`) are **not** in scope and continue to deploy through the existing operator-managed FileZilla path (`launch/README.md`). This system never touches them.

WordPress core, `wp-config.php`, regular plugins, uploads, cache, and `sgs_encrypt_key.php` are protected paths — see §4.

## 2. Why this design

The prior state of this repository (see `AGENTS.md` history) briefly hosted, then deliberately removed, an SFTP-based automated deployment workflow, replacing it with a manual FileZilla runbook. That removal was correct for what existed then — the AGENTS.md contract at the time flatly prohibited any Git/SSH/remote-write deployment code. This platform is a deliberate, requested architectural change to that contract (`AGENTS.md` §16), built specifically around a mechanism that removal did not use: the SiteGround host's own Git integration, which SiteGround — not this repository — operates and secures. The workflow only ever pushes to that existing, host-managed Git remote; it never opens a raw SFTP/SSH file-write channel of its own.

## 3. Component map

| Component | Location | Responsibility |
|---|---|---|
| Release workflow | `.github/workflows/release-siteground.yml` | The release engine. Plans, validates, tags an immutable manifest, backs up, deploys, verifies, and reports every stage. Operator-dispatched only (`workflow_dispatch`), never on push/merge. |
| Boundary policy | `scripts/deployment/protected-paths.json` | Single declared source of truth for owned vs. protected paths. Mirrored (with a documented sync obligation) in `dtb-deployment/Services/ProtectedPathPolicy.php` for admin-UI display, since the JSON file itself is never part of the deployed payload. |
| Git release engine | `scripts/deployment/siteground-git-release.sh` | The only code that clones, commits to, and pushes the SiteGround Git remote. Enforces the protected-path boundary before any commit is created. `backup` and `deploy` actions only — rollback reuses `deploy` with a different payload source. |
| Webhook reporter | `scripts/deployment/report-release-event.sh` | HMAC-signs and POSTs each lifecycle event to the Git Control Center webhook. Best-effort — a reporting failure never blocks or falsely fails a release already in flight. |
| `dtb-deployment` mu-plugin | `drywalltoolbox/wp/wp-content/mu-plugins/dtb-deployment/` | WordPress-side bounded context: release event log, signed webhook receiver, GitHub API bridge, Git Control Center admin UI. Never holds SiteGround Git/SSH credentials. |

## 4. Release boundary and protected-path enforcement

`scripts/deployment/protected-paths.json` declares:

- **`owned_paths`** — the only paths this system may write: `.htaccess`, `index.php`, `wp-content/mu-plugins`, `wp-content/themes`.
- **`protected_paths`** — explicitly never touched: `wp-config.php`, `sgs_encrypt_key.php`, `php_errorlog`, `php.ini`, `wp-admin`, `wp-includes`, `wp-content/plugins`, `wp-content/uploads`, `wp-content/cache`, `wp-content/upgrade`, `wp-content/backup(s)`.

Enforcement happens in two independent layers, both required to pass:

1. **CI payload assembly** (`release-siteground.yml`, "Enforce protected-path boundary" step) — asserts the assembled payload contains only the owned files/directories and none of the explicitly forbidden ones (mirrors the equivalent guard from the repository's earlier, since-removed SFTP workflow).
2. **Git release engine** (`siteground-git-release.sh`) — after applying the payload with a *scoped* `rsync --delete`/`cp` restricted to `owned_paths` inside a fresh clone of the SiteGround remote, it inspects `git status --porcelain` and **refuses to commit** if any changed path falls outside `owned_paths`. This is the authoritative, mechanically-enforced guarantee: even if the SiteGround repository's working tree contains WordPress core, plugins, or other runtime state, this system can only ever change the four owned paths.

## 5. Release lifecycle (event-sourced)

A release is not a mutable row — it is the ordered set of events recorded for one `release_id` in `wp_dtb_release_events` (`dtb-deployment/Infrastructure/ReleaseSchemaInstaller.php`). Status is *derived* from which event types are present (`Domain/ReleaseStatus.php`), the same event-sourcing shape already used by `dtb-repair-service` and `dtb-order-platform`.

Event types, in the normal deploy sequence:

```text
release_planned → release_validated → release_backup_started → release_backed_up
  → release_deploy_started → release_deployed → release_verified → release_completed
```

Failure path (any step failing after backup triggers an automatic in-workflow restore):

```text
... → release_failed → release_rolled_back_automatically
```

Rollback sequence (separate `release_id`, prefixed `rollback-`):

```text
release_rollback_started → release_rolled_back | release_rollback_failed
```

The `(release_id, event_type)` pair is a unique key, so retried webhook deliveries (the reporter script retries on network failure) are idempotent — a duplicate delivery is silently ignored, never double-recorded.

## 6. Immutable release manifests

During "plan and validate", the workflow does not just build a payload — it **tags an immutable manifest** on this GitHub repository:

1. It builds a Git tree object from exactly the assembled payload (`git write-tree` against a scratch index over the payload directory).
2. It creates a commit object from that tree, parented to the actual source commit (`git commit-tree`), and tags it `dtb-release/<release_id>`.
3. It pushes that tag to `origin` (this repository).

This tag is the release manifest: a reproducible, content-addressed snapshot of precisely what was (or, for a future rollback, will be) pushed to SiteGround for that release — independent of any later changes to the source branch. Rollback fetches this tag and extracts it as the payload for a fresh `deploy` call, so **forward releases and rollbacks share one code path** and one validation contract; nothing is rebuilt from a potentially-different current source state.

## 7. Backup and rollback strategy

Every deploy first tags the SiteGround remote's **current** HEAD as `dtb-backup/<release_id>` and pushes that tag to the SiteGround remote itself — a durable, host-side backup independent of GitHub.

Three recovery paths exist:

- **Automatic, in-workflow**: if backup, deploy, or verification fails during a deploy run, a bash `trap` immediately extracts the just-created backup tag and re-applies it via the same scoped `deploy` logic, restoring production before the job ends. This reports `release_rolled_back_automatically`.
- **Operator-initiated rollback**: from the Git Control Center (or `workflow_dispatch` directly) with `action: rollback` and a target `release_id`. The workflow fetches that release's `dtb-release/<id>` manifest tag from GitHub, backs up current state again, applies the manifest via `deploy`, and verifies.
- **Manual, host-side**: because every backup is a real tag on the SiteGround remote itself, an operator retains the option of restoring via SiteGround's own Git tooling as a last resort, independent of this platform.

Rollback never uses ad hoc file replacement — it always replays a specific, previously validated release state through the same protected-path-enforced code path as a forward deploy.

## 8. Observability: Git Control Center

`Admin/GitControlCenterPage.php` (wp-admin → Drywall Toolbox → Git Control Center, capability `dtb_manage_deployments`) is the single console for both GitHub repository visibility and SiteGround release control, across eight tabs:

- **Overview** — currently deployed commit/ref, when it deployed, live progress timeline for an in-progress release, GitHub/production drift (commits ahead of production, via the GitHub compare API), and a Deploy action.
- **Repository** — repository summary (default branch, visibility, open issues, last push), recent branches, and recent commits — read live from the GitHub API (`Services/GitHubRepositoryClient.php`).
- **Pull Requests** — open pull requests: title, head/base branch, author, draft/open status, last updated.
- **Workflow Runs** — recent GitHub Actions runs across every workflow in the repository (not just the release workflow), with status/conclusion and a link to each run.
- **Releases & Tags** — published GitHub Releases, plus the platform's own `dtb-release/*` manifest tags and `dtb-backup/*` SiteGround backup tags, so every immutable manifest and backup point is directly visible.
- **History** — every recorded release from `wp_dtb_release_events`, its kind (deploy/rollback), ref/commit, derived status, actor, and timestamps.
- **Rollback** — a picker limited to releases that reached at least a validated manifest, with a typed `ROLLBACK` confirmation before dispatch.
- **Settings** — integration status (GitHub dispatch, webhook), the exact required `wp-config.php` constants / GitHub Actions secrets, the required `DTB_GITHUB_DEPLOYMENT_TOKEN` PAT scopes, and the live owned/protected path policy.

The page uses the existing DTB admin shell, UI component library, and live-region auto-refresh, with a small dedicated stylesheet (`Admin/assets/dtb-git-control-center.css`) for commit/branch/tag chips and sticky table headers — styled as part of the same operator console as System Manager, Command Center, and the other DTB admin surfaces, not a bolted-on tool. Repository-browsing endpoints (`Rest/GitControlCenterController.php`) are strictly read-only and cache every GitHub list call for two minutes (`Services/GitHubRepositoryClient.php`) so the live region's auto-refresh cannot amplify into excessive GitHub API traffic.

## 9. Security model

- **SiteGround Git/SSH credentials exist only as GitHub Actions repository secrets** (`SITEGROUND_GIT_REMOTE`, `SITEGROUND_GIT_BRANCH`, `SITEGROUND_GIT_SSH_PRIVATE_KEY`, `SITEGROUND_GIT_KNOWN_HOSTS`). WordPress never receives, stores, or displays them.
- **WordPress → GitHub** trust is a fine-grained PAT (`DTB_GITHUB_DEPLOYMENT_TOKEN`, wp-config constant only, never a WP option) scoped to `Actions: write` + `Contents: read` on this repository only. It is used solely to call `workflow_dispatch` and read repository/run state — it cannot write repository content.
- **GitHub Actions → WordPress** trust is a shared HMAC-SHA256 secret (`DTB_DEPLOYMENT_WEBHOOK_SECRET`), the same pattern already used for the QuickBooks webhook (`dtb-integrations/QuickBooks/QuickBooksWebhookController.php`), just with GitHub Actions as signer and WordPress as verifier.
- **Every release requires a typed confirmation** (`DEPLOY` / `ROLLBACK`) at both the admin-UI layer and the workflow's own `guard` job — a release can never be triggered by an accidental click or a malformed request.
- **No automatic deployment on push or merge.** `release-siteground.yml` has `workflow_dispatch` as its only trigger.
- **Concurrency-limited**: the workflow's `concurrency: group: siteground-production-release` guarantees only one release/rollback runs at a time; the Git Control Center additionally blocks new dispatches while a release is in progress and applies a short dispatch lock to prevent accidental double-submission.
- Standard DTB security invariants apply throughout: capability-gated REST routes (`dtb_manage_deployments`), sanitized input, prepared SQL, timing-safe signature comparison, and redacted audit logging (`dtb_ops_audit_log`).

## 10. Operational considerations and residual risks

- **Required one-time operator setup** before this platform can run a real release:
  - GitHub Actions repository secrets: `SITEGROUND_GIT_REMOTE`, `SITEGROUND_GIT_BRANCH`, `SITEGROUND_GIT_SSH_PRIVATE_KEY`, `SITEGROUND_GIT_KNOWN_HOSTS`, `DTB_DEPLOYMENT_WEBHOOK_SECRET`.
  - `wp-config.php` constants: `DTB_DEPLOYMENT_WEBHOOK_SECRET` (must match the secret above) and `DTB_GITHUB_DEPLOYMENT_TOKEN` (to enable dispatch/drift from the Git Control Center — read-only history/webhook recording works without it).
  - Confirm the exact tracked scope of the existing SiteGround Git repository matches `scripts/deployment/protected-paths.json`'s `owned_paths`/`protected_paths` assumptions before the first real release; the protected-path guard will refuse any release whose diff falls outside `owned_paths`, so a mismatch fails safe rather than writing unexpected files.
- **First release is unverified against live infrastructure.** This implementation could not be exercised against the real SiteGround Git remote or a live GitHub Actions run from this session — validate with a low-risk ref on a quiet window, and watch the Git Control Center + workflow logs closely for the first dispatch.
- **Path duplication**: the owned/protected path lists are declared once in `scripts/deployment/protected-paths.json` (CI's source of truth) and mirrored in `dtb-deployment/Services/ProtectedPathPolicy.php` (display-only, since the JSON file is never part of the deployed `/wp` payload). Both carry a comment cross-referencing the other; keep them in sync when the boundary changes.
- **Webhook delivery is best-effort.** If `DTB_DEPLOYMENT_WEBHOOK_SECRET` is misconfigured or production is briefly unreachable during a release, the release itself still completes or rolls back correctly — only Git Control Center visibility for that run is degraded. GitHub Actions' own step summary and run log remain the fallback source of truth for that run.
- **Drift detection depends on `DTB_GITHUB_DEPLOYMENT_TOKEN`.** Without it, the Overview tab still shows recorded release history but cannot compute "commits ahead on GitHub."

## 11. Extensibility

The event-sourced release log, immutable manifest tags, and capability-gated REST layer are intentionally generic enough to support, without redesign:

- Staged/environment promotion (add a `target` dimension to release events).
- Release approvals (an additional `release_approved` event type gating dispatch).
- Scheduled releases (a Routine/cron dispatching `workflow_dispatch` on a schedule, subject to the same guard/confirmation contract).
- Deployment analytics and notifications (consumers of `wp_dtb_release_events`, or the webhook, without touching the release engine itself).

None of these require a new deployment authority — they all extend the same release event log and the same SiteGround Git-backed engine.
