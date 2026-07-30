#!/usr/bin/env bash
#
# SiteGround Git release engine.
#
# Applies an assembled release payload to the official SiteGround Git
# repository — the sanctioned production deployment backend for the
# WordPress application tree (production /wp). This script never talks to
# any other transport (no FTP/SFTP/rsync-to-arbitrary-host); it only ever
# clones, commits to, and pushes the SiteGround Git remote.
#
# Every write is scoped to the "owned paths" declared in protected-paths.json
# (mu-plugins, themes, .htaccess, index.php). Any change detected outside
# that boundary aborts the release before a commit is created, so WordPress
# core, wp-config.php, regular plugins, uploads, and cache can never be
# touched by this system even if they happen to live in the same repository.
#
# Rollback reuses the same "deploy" code path: the workflow extracts a prior
# release's payload from its immutable dtb-release/<id> tag (see
# .github/workflows/release-siteground.yml) into a payload directory and
# calls `deploy` again, so forward releases and rollbacks are deterministic
# and go through identical validation.
#
# Usage:
#   siteground-git-release.sh backup <workdir> <release_id>
#   siteground-git-release.sh deploy <payload_dir> <workdir> <release_id> <ref_label>
#
# Required environment:
#   SITEGROUND_GIT_REMOTE   SSH URL of the SiteGround Git repository.
#   SITEGROUND_GIT_BRANCH   Branch SiteGround watches for deployment.
#
# Optional environment:
#   SITEGROUND_RELEASE_OUTPUT   Path to append key=value result lines to
#                                (BACKUP_REF=<sha>, DEPLOY_COMMIT=<sha>).
#
# The protected-path assertion parses `git status --porcelain=v1 --no-renames`
# by fixed offset (status code + space, then path) rather than field
# splitting, so paths containing spaces are handled correctly; it does not
# attempt to unescape git's octal quoting of exotic characters (newlines,
# control characters), which do not occur in this repository's WordPress
# mu-plugin/theme source.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROTECTED_PATHS_JSON="${SCRIPT_DIR}/protected-paths.json"

action="${1:?Usage: siteground-git-release.sh <backup|deploy> ...}"

: "${SITEGROUND_GIT_REMOTE:?SITEGROUND_GIT_REMOTE is required}"
: "${SITEGROUND_GIT_BRANCH:?SITEGROUND_GIT_BRANCH is required}"

emit_output() {
	local key="$1" value="$2"
	if [[ -n "${SITEGROUND_RELEASE_OUTPUT:-}" ]]; then
		printf '%s=%s\n' "$key" "$value" >>"$SITEGROUND_RELEASE_OUTPUT"
	fi
	printf '[siteground-git-release] %s=%s\n' "$key" "$value"
}

mapfile -t OWNED_PATHS < <(jq -r '.owned_paths[]' "$PROTECTED_PATHS_JSON")

clone_remote() {
	local workdir="$1"
	rm -rf "$workdir/siteground"
	git clone --branch "$SITEGROUND_GIT_BRANCH" --single-branch "$SITEGROUND_GIT_REMOTE" "$workdir/siteground"
	git -C "$workdir/siteground" config user.name "DTB Release Engine"
	git -C "$workdir/siteground" config user.email "release-engine@drywalltoolbox.com"
}

path_is_owned() {
	local candidate="$1" owned
	for owned in "${OWNED_PATHS[@]}"; do
		if [[ "$candidate" == "$owned" || "$candidate" == "$owned"/* ]]; then
			return 0
		fi
	done
	return 1
}

case "$action" in
backup)
	workdir="${2:?workdir required}"
	release_id="${3:?release_id required}"

	clone_remote "$workdir"
	backup_ref="$(git -C "$workdir/siteground" rev-parse HEAD)"
	git -C "$workdir/siteground" tag "dtb-backup/${release_id}" "$backup_ref"
	git -C "$workdir/siteground" push origin "refs/tags/dtb-backup/${release_id}"
	emit_output "BACKUP_REF" "$backup_ref"
	;;

deploy)
	payload_dir="${2:?payload_dir required}"
	workdir="${3:?workdir required}"
	release_id="${4:?release_id required}"
	ref_label="${5:-unknown}"

	[[ -d "$payload_dir" ]] || {
		echo "Payload directory not found: $payload_dir" >&2
		exit 1
	}

	clone_remote "$workdir"
	clone="$workdir/siteground"

	for owned in "${OWNED_PATHS[@]}"; do
		src="$payload_dir/$owned"
		dest="$clone/$owned"
		if [[ -d "$src" ]]; then
			mkdir -p "$dest"
			rsync -a --delete "$src/" "$dest/"
		elif [[ -f "$src" ]]; then
			mkdir -p "$(dirname "$dest")"
			cp "$src" "$dest"
		else
			echo "[siteground-git-release] Owned path missing from payload, skipping: $owned" >&2
		fi
	done

	# Protected-path enforcement: every changed path must fall under an
	# owned path, or the release is refused before anything is committed.
	# --no-renames forces every change to a separate delete/add porcelain
	# line with one path each; without it, a rename shows as a single
	# "R  old -> new" line, and naive field-based parsing would check only
	# the old path and silently miss the actual (new) destination.
	changed="$(git -C "$clone" status --porcelain=v1 --no-renames)"
	while IFS= read -r status_line; do
		[[ -z "$status_line" ]] && continue
		# Porcelain v1 lines are a 2-character status code, one space, then
		# the path — slicing by offset (rather than field-splitting) keeps
		# paths with embedded spaces intact.
		changed_path="${status_line:3}"
		if ! path_is_owned "$changed_path"; then
			echo "[siteground-git-release] Refusing release: change outside the owned-path boundary: $changed_path" >&2
			exit 1
		fi
	done <<<"$changed"

	if [[ -z "$changed" ]]; then
		echo "[siteground-git-release] No changes to deploy; release is a no-op." >&2
		emit_output "DEPLOY_COMMIT" "$(git -C "$clone" rev-parse HEAD)"
		exit 0
	fi

	git -C "$clone" add -A -- "${OWNED_PATHS[@]}"
	git -C "$clone" commit -m "DTB release ${release_id}: ${ref_label}"
	git -C "$clone" push origin "HEAD:${SITEGROUND_GIT_BRANCH}"

	emit_output "DEPLOY_COMMIT" "$(git -C "$clone" rev-parse HEAD)"
	;;

*)
	echo "Unknown action: $action (expected backup|deploy)" >&2
	exit 1
	;;
esac
