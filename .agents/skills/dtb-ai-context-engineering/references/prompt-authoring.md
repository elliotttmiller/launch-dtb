# Prompt / Instruction Authoring

Use the smallest structure that makes behavior unambiguous:

1. objective and audience;
2. scope/ownership;
3. required evidence/context;
4. constraints and explicit non-goals;
5. output contract when format matters;
6. edge/error handling;
7. verification/evaluation criteria.

Prefer concrete examples when they define a difficult boundary better than prose. Separate untrusted input/reference material from instructions. Avoid contradictory requirements, redundant restatement and hardcoded mutable facts. Vendor/model/tool syntax belongs in adapters, not canonical DTB knowledge.
