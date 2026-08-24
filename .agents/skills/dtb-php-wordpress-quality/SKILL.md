---
name: dtb-php-wordpress-quality
description: Line-level PHP/WordPress correctness, security and performance discipline applied by the owning backend writer.
---
# DTB PHP / WordPress Quality

Apply inside the owning MU-plugin/theme layer; this skill is not a competing writer.

Require explicit REST permissions, server-derived identity/ownership, nonce/origin/signature/replay controls where relevant, sanitization/schema validation, context-correct escaping, prepared SQL, bounded queries, WooCommerce CRUD/HPOS access and redacted diagnostics. Treat uploads/paths/URLs as untrusted boundaries. Avoid unserializing untrusted input, shell execution from request data, broad database writes, N+1 queries, unbounded scans and synchronous provider effects in interactive/payment acknowledgement paths.

Use strict comparisons and explicit failure handling. New executable module files use the repository's WordPress guard/conventions. Verify available lint/static-analysis tooling before claiming or requiring it.
