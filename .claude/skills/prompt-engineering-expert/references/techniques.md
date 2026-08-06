# Advanced Techniques

Pick the technique that matches the failure mode or task shape — don't stack all of them by default.

## 1. Chain-of-thought (CoT)

**Use when**: multi-step reasoning, math/logic, tasks where a wrong intermediate step silently produces a wrong final answer, or consistency across runs matters.
**Skip when**: the task is a simple lookup/classification — CoT adds tokens and latency without improving a task the model already does correctly in one step.

```
Let's think through this step by step:
Step 1: [identify the relevant facts/variables]
Step 2: [apply the relevant rule/operation]
Step 3: [derive the result]
Therefore: [conclusion]
```

Stronger variant for review/audit tasks: ask the model to show its reasoning in a separate section from the final answer, so the reasoning can be checked without parsing it out of the answer itself (e.g. `<reasoning>...</reasoning><answer>...</answer>`).

## 2. Few-shot prompting

**Use when**: the desired output has a specific format, tone, or edge-case handling that's easier to demonstrate than describe.

- **1-shot** — simple, low-ambiguity tasks; one example establishes the pattern.
- **2-shot** — moderate complexity; contrast two examples to show the range.
- **Multi-shot** — complex or edge-case-heavy tasks; include examples that cover the boundary conditions, not just the median case.

Rules that matter more than the shot count:
- Examples must be genuinely representative of the input distribution, not cherry-picked easy cases.
- Order examples from simple to complex (or keep them grouped by category) — order affects the model's inferred pattern.
- If the task has a known failure mode, include an example specifically demonstrating the *correct* handling of that case.

## 3. XML-tag structuring

**Use when**: the prompt has multiple distinct components (instructions, context, examples, input data) that need unambiguous boundaries, or output needs to be reliably parsed downstream.

```xml
<task>
  <objective>What to accomplish</objective>
  <constraints>Limitations and rules</constraints>
  <format>Expected output format</format>
</task>
```

- Tags create a hard boundary the model reliably respects — critical when untrusted user input is embedded in the prompt (wrap it in its own tag, e.g. `<user_input>`, and instruct the model to treat content inside as data, never as instructions).
- Use consistent tag names across a prompt family so downstream parsing code doesn't need per-prompt logic.

## 4. Role-based prompting

**Use when**: a specific expertise lens changes what "correct" looks like (e.g. security reviewer vs. feature-focused reviewer), or a persona's tone/voice needs to be consistent across a conversation.

```
You are a [specific role] with expertise in [specific domain].
Your responsibilities: [...]
When responding: [...]
Your task: [...]
```

Weak version: "You are a helpful assistant" — adds nothing, changes no behavior. Strong version: specific enough that two different roles applied to the same input would produce visibly different output.

## 5. Prefilling

**Use when**: format compliance is critical and the model tends to add preamble ("Sure, here's...") before the actual content, or you need to force a specific starting structure.

Start the assistant turn with the beginning of the desired output (e.g. `{` for forced JSON, or a heading for forced structure) so the model continues from there rather than choosing its own opening.

## 6. Prompt chaining

**Use when**: a task has genuinely sequential stages where each stage's output is a cleaner input to the next than the raw original input would be — e.g. extract → analyze → synthesize.

```
Prompt 1 (extract) → structured intermediate output
Prompt 2 (analyze) → processed intermediate output
Prompt 3 (synthesize) → final output
```

Trade-off: each link adds latency and a chance for information loss between stages — only chain when a single well-structured prompt genuinely can't hold the task's full complexity, not as a default architecture.

## 7. Context management

- Put the highest-priority instruction first and last (models weight prompt edges more heavily) if the prompt is long.
- Separate stable instructions from per-request variable content so the stable part can be cached/reused.
- Strip content that doesn't change the model's behavior — a fact included "just in case" is a cost with no benefit if it never affects output.

## 8. Multimodal and tool-use prompting

**Vision**: state explicitly what to look for/analyze in the image and the expected output format — an unconstrained "describe this image" produces unconstrained output.
**File-based**: specify accepted structure/format and how to handle malformed input, not just the happy path.
**Tool use**: describe each tool's purpose and *when to use it* as precisely as its parameters — ambiguous tool descriptions cause wrong-tool selection more often than malformed calls.
**Extended thinking**: reserve for genuinely novel/complex reasoning; forcing it on simple tasks adds latency without accuracy gain.

## Combining techniques

Techniques compose, but each addition has a cost (tokens, latency, prompt complexity). A well-formed combination for a complex classification-with-justification task might be: role-based framing + XML-structured input/output + few-shot examples + CoT reasoning tag before the final answer tag. Don't add a technique because it's available — add it because it addresses a specific, named gap in the current prompt's behavior.
