#!/usr/bin/env bash
#
# Reports a release lifecycle event to the DTB Deployment Center webhook so
# wp-admin has complete, real-time release visibility without WordPress ever
# needing SiteGround Git/SSH credentials.
#
# The JSON body is HMAC-SHA256 signed with DTB_DEPLOYMENT_WEBHOOK_SECRET —
# the same shared-secret pattern DTB already uses for inbound provider
# webhooks (see dtb-integrations/QuickBooks/QuickBooksWebhookController.php),
# just with GitHub Actions as the signer and WordPress as the verifier.
#
# Usage:
#   report-release-event.sh <site_base_url> <event_type> <release_id> <json_payload_file>
#
# Required environment:
#   DTB_DEPLOYMENT_WEBHOOK_SECRET
#
# A failed report never fails the calling workflow step by itself — callers
# should invoke this as a best-effort observability call (e.g. with
# `|| echo "::warning::release event report failed"`) so a WP-side outage
# never blocks or falsely fails a production release already in flight.

set -euo pipefail

site_base_url="${1:?site base url required}"
event_type="${2:?event type required}"
release_id="${3:?release id required}"
payload_file="${4:?payload json file required}"

: "${DTB_DEPLOYMENT_WEBHOOK_SECRET:?DTB_DEPLOYMENT_WEBHOOK_SECRET is required}"

body="$(jq -c --arg event_type "$event_type" --arg release_id "$release_id" \
	'. + {event_type: $event_type, release_id: $release_id}' "$payload_file")"

signature="$(printf '%s' "$body" | openssl dgst -sha256 -hmac "$DTB_DEPLOYMENT_WEBHOOK_SECRET" | sed 's/^.* //')"

url="${site_base_url%/}/wp-json/dtb/v1/deployment/webhook"
response_file="$(mktemp)"

http_code="$(curl --silent --show-error --output "$response_file" --write-out '%{http_code}' \
	--retry 4 --retry-delay 5 --max-time 20 \
	-H 'Content-Type: application/json' \
	-H "X-DTB-Signature: sha256=${signature}" \
	-X POST --data "$body" "$url")"

if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
	echo "[report-release-event] Webhook POST failed for event ${event_type} (release ${release_id}), HTTP ${http_code}." >&2
	cat "$response_file" >&2 || true
	rm -f "$response_file"
	exit 1
fi

echo "[report-release-event] ${event_type} reported for ${release_id} (HTTP ${http_code})."
rm -f "$response_file"
