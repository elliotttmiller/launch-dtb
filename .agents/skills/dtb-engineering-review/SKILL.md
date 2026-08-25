---
name: dtb-engineering-review
description: Evidence-driven, risk-proportional review method for DTB code, security, integrations and independent verification.
---
# DTB Engineering Review

## Core method
Review final source/diff and surrounding contracts, not conversation memory. First establish intended behavior, owner/system of record and blast radius. Then test the change mentally against normal operation plus retries, duplicates, partial failure, invalid input, stale state, concurrency, cancellation and unavailable dependencies where relevant.

A finding is valid only when source supports a concrete failure mechanism. Report path/symbol, trigger/precondition, consequence, severity, and smallest safe correction boundary. Search surrounding code before reporting so existing guards are not missed. Do not inflate style preferences into bugs; an empty findings list is acceptable.

## Severity
Blocking classes include exploitable trust-boundary failures; duplicate system authority; payment/order/refund contract breakage; protected-identifier/data corruption; unauthorized/destructive mutation; non-idempotent external effects; broken migrations; or deterministic runtime failure on supported paths. High severity requires material production impact, not simply complexity.

Advisory findings cover maintainability, performance, design consistency, or resilience improvements that do not currently violate a production invariant.

## Review composition
Use code review for cross-cutting correctness. Add security review for trust boundaries/auth/payment/webhook/files/sensitive data, integration review for queues/providers/events/external effects, and UI critique for customer presentation. Verification independently reports what was actually executed/observed.

Reconcile conflicting reviewer opinions against active source and `AGENTS.md`; do not aggregate duplicates as additional confidence.