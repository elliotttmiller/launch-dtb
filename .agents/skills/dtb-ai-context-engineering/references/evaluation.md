# Canonical Behavior Verification

Use verification to determine whether DTB's canonical engineering instructions and routing preserve required behavior. This is not a model-comparison or benchmark framework.

Where a reusable instruction/routing change is material, verify representative classes as relevant:

- expected/happy path;
- boundary/edge case;
- malformed or missing-evidence case;
- adversarial/instruction-injection case;
- regression for a previously established DTB invariant.

Success criteria should be observable: correct owner/routing, valid schema/format, grounded evidence, preserved security/data/commerce boundaries, correct capability use, explicit uncertainty when evidence/capability is unavailable, and no fabricated runtime facts.

Do not build Claude-vs-Codex/model scorecards, wording-match tests, per-model prompt optimization, or benchmark infrastructure. If work exposes incomplete DTB doctrine, strengthen the canonical rule/skill/workflow that was deficient.
