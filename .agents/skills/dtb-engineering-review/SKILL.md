---
name: dtb-engineering-review
description: Risk-proportional DTB diff/PR review and verification workflow.
---
# DTB Engineering Review

Use `.agents/workflows/engineering-review.md`. Review actual evidence, classify findings by concrete failure impact, and select independent reviewers based on the authority touched rather than model confidence. Blocking classes include security boundary violations, duplicate system authority, payment/order/refund contract breaks, data corruption/identifier instability, non-idempotent external side effects and unauthorized destructive behavior.
