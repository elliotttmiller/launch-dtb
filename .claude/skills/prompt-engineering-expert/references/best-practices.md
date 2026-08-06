# Best Practices

## Core principles

**Clarity and directness**
- State exactly what the model should do — no room for misinterpretation.
- Use concrete examples instead of abstract descriptions ("show, don't just tell").
- Structure information hierarchically: most important constraint first, details after.

**Conciseness**
- Keep prompts focused; cut anything not load-bearing for behavior.
- Prefer progressive disclosure (short entry point + linked detail) over one giant prompt, especially for skills/agents.
- Every extra paragraph has a token cost and a dilution cost — it competes with the instructions that actually matter.

**Appropriate degrees of freedom**
- Define constraints explicitly (what the model must/must not do).
- Specify output format explicitly if format matters — do not assume the model will infer it.
- Set scope boundaries — what's in-domain vs. out-of-domain for this prompt/agent.
- Leave room for judgment only where judgment is actually wanted; over-constraining a task that needs reasoning produces brittle, narrow behavior.

## System prompt / custom instruction design

- **Define the role** precisely — not "a helpful assistant" but the specific expertise/persona the task needs.
- **Set tone** appropriate to the task and audience (terse and technical vs. explanatory, etc.).
- **Establish constraints** as explicit rules, not implied by tone.
- **Clarify scope**: state both what the agent should do and what it should explicitly defer or refuse.
- **Behavioral guidelines**: separate "do" and "don't" lists are more reliable than a single paragraph mixing both.
- **Edge cases**: name the ones that matter for this domain and state the expected behavior — don't leave them to be inferred.
- **Escalation**: state when the agent should ask for clarification vs. proceed on a reasonable assumption.

## Skill / agent authoring conventions

**Naming**
- Gerund or clear-noun form, lowercase-with-hyphens (`analyzing-financial-statements`, `prompt-engineering-expert`).
- Descriptive, not generic — the name should indicate the specific capability, not a category ("helper", "assistant").

**Description field (critical for discovery)**
- First line must be a clear, concrete summary — this is what triggers autonomous invocation.
- Name specific trigger phrases/situations, not vague capability claims ("helps with X") — vague descriptions get skipped by routing logic.
- State explicitly what it is *not* for, when there's a likely confusion with another skill/agent.
- Respect length limits (commonly ~1024 chars) — front-load the trigger information.

**Progressive disclosure patterns**
1. *High-level guide + references* — entry point gives overview and decision criteria for which detail file to load; details live in linked files, loaded only when needed.
2. *Domain-specific organization* — group detail files by use case/domain rather than by technique, when the skill spans multiple distinct workflows.
3. *Conditional detail* — surface different depth depending on what the task actually requires; don't force every invocation through the same fixed-length instructions.

**File structure** (example)
```
skill-name/
├── SKILL.md              # required entry point + frontmatter
├── references/
│   ├── topic-a.md
│   └── topic-b.md
└── examples.md
```

**YAML frontmatter**
```yaml
---
name: skill-name
description: Concrete, trigger-focused description.
---
```
Only `name` and `description` are required; keep both accurate as the skill evolves — a stale description silently stops the skill from being invoked when it should be.

**Token budget intuition**
- Entry point (`SKILL.md`): small enough to always be worth loading — keep it a map, not the territory.
- Each reference file: sized for a single focused load, not a full manual.
- Total content can be large *only if* progressive disclosure actually keeps typical invocations small — a skill that always loads everything has gained nothing from splitting files.

## Evaluation and testing

**Success criteria**
- Must be measurable and specific — "produces a valid JSON object matching schema X" beats "gives a good answer."
- Testable objectively where possible; where subjective, define the rubric explicitly.

**Test case coverage**
- Happy path (typical, expected input).
- Edge cases (boundary values, unusual-but-valid input).
- Error cases (invalid/malformed input) — verify graceful handling, not just correct-input behavior.
- Stress cases (adversarial or maximally complex input).

**Failure analysis**
- Identify root cause, not just symptom — a "wrong format" failure might actually be a missing-example failure.
- Look for systematic patterns across failures before proposing a fix; a one-off fix for a systematic issue will resurface elsewhere.
- Regression-check: confirm a fix doesn't break previously-passing cases.

## Anti-patterns to avoid

- **Vagueness** — "help with this" gives the model nothing to anchor behavior on.
- **Contradictions** — conflicting requirements (e.g. "be concise" + "cover every edge case in detail") force the model to guess which one you meant.
- **Over-specification** — excessive constraints eliminate the flexibility the task actually needs, producing brittle output on any input slightly outside the examples.
- **Hallucination risk** — prompts that ask for specifics the model can't actually know (real-time data, unverifiable facts) invite confident fabrication; ask for sourced/flagged uncertainty instead.
- **Context leakage** — instructions or examples that unintentionally expose information (internal reasoning, other users' data, credentials) that shouldn't appear in output.
- **Injection/jailbreak vulnerability** — prompts that concatenate untrusted user input directly into instructions without a clear boundary are exploitable; use explicit delimiters/tags and never let user input redefine the system role.
- **Too many options presented to the model** — more than ~3-5 alternatives in an instruction increases inconsistency; use progressive disclosure or default-plus-override instead.

## Content guidelines

- Avoid hardcoding dates/versions in a prompt that will be reused — use relative framing or note explicitly when a fact was current.
- Use one term per concept consistently — synonyms for the same idea increase ambiguity for the model as much as for a human reader.

## Checklist before shipping a prompt or skill/agent definition

- [ ] Name and description are specific and trigger-accurate (skills/agents only)
- [ ] Output format is explicit if format matters
- [ ] Constraints and scope (in-domain / out-of-domain) are explicit
- [ ] Examples included where the task benefits from them
- [ ] No contradictory requirements
- [ ] No unnecessary content — every section earns its tokens
- [ ] Edge cases named with expected behavior
- [ ] Success criteria are measurable
- [ ] Tested against at least happy-path, one edge case, and one error case
- [ ] No hardcoded time-sensitive facts without a "current as of" note
