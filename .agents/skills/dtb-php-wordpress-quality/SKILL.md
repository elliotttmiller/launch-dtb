---
name: dtb-php-wordpress-quality
description: Production PHP/WordPress/WooCommerce correctness, security, data-access, performance and failure-handling discipline for DTB backend writers.
---
# DTB PHP / WordPress Quality

## Apply when
Use inside the owning MU-plugin/theme layer for PHP, REST, hooks, persistence, WooCommerce entities, scheduled actions, webhooks, uploads, admin/operator mutations, and provider-facing backend work. This skill is not a competing writer.

## Request and authorization boundary
Every mutation/read endpoint must have intentional access behavior. Validate request schema and allowlisted writable fields; derive user/resource ownership server-side; apply capability/role/ownership checks; use nonce/origin/signature/replay/rate-limit controls appropriate to the boundary. Sanitization does not replace validation or authorization.

Escape on output in the correct context. Use prepared SQL and bounded/paginated queries. Treat URLs, paths, filenames, uploads, serialized data, headers, and provider payloads as untrusted. Avoid unsafe deserialization, request-driven shell execution, open redirects/SSRF, path traversal, and sensitive logging.

## Data and WooCommerce
Use WooCommerce CRUD/HPOS-compatible access for Woo entities and preserve existing entity lifecycle hooks. Avoid direct writes to internals, broad meta/options mutations, N+1 queries, unbounded scans, mutable identifiers as references, and duplicate persistence of authoritative state.

## Async/provider behavior
Interactive/payment acknowledgement paths should not synchronously depend on slow external services. Use Action Scheduler where asynchronous work is the established contract. Consumers must tolerate retries, preserve stable identity/deduplication, classify retryable versus terminal failures, and expose enough redacted diagnostics/correlation for recovery.

## Code quality
Use strict comparisons where type ambiguity matters, explicit return/error paths, existing namespaces/hooks/conventions, and guards required by the repository. Prefer small domain functions/services with transport and provider concerns separated. Avoid hidden globals and side effects during file load unless WordPress registration requires them.

## Verification
Use only tooling actually available. Inspect authorization, persistence, duplicate/retry behavior, query bounds, hook registration, and compatibility even when unit tests are absent. Never claim lint/static analysis/runtime success unless executed.