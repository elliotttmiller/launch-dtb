---
name: dtb-ai-workspace-governance
description: Govern DTB roles, skills, adapters, context, task state and assistant capability mappings without creating vendor-specific architecture authority.
---
# DTB AI Workspace Governance

Before adding a role or skill, check existing coverage. A role exists when there is a durable responsibility/ownership or independent review boundary. A skill exists when knowledge/method can be reused by multiple owners. Do not create near-duplicate personas.

Canonical DTB knowledge lives under `.agents/`; assistant directories are adapters. Vendor/model/tool names belong only in adapters. No permanent router bureaucracy is required: the top-level session may orchestrate specialists when decomposition or independent review materially improves the task.

Use one writer for overlapping boundaries. Keep reviewers read-only. Persist task state only when justified and scope it under `docs/work/<task-id>/`. Run the context validator after governance changes.
