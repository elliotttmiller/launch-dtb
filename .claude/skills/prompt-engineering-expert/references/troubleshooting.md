# Troubleshooting

Symptom → likely cause → fix. Diagnose the specific cause before rewriting — the same symptom (e.g. "inconsistent output") can have opposite fixes depending on cause.

## 1. Inconsistent outputs across runs
**Likely cause**: format not explicitly specified; task has multiple valid interpretations; no examples anchoring the expected pattern.
**Fix**: add explicit output-format specification; add 1-2 examples covering the range of valid inputs; if the task is inherently multi-interpretation, make the prompt ask a clarifying question instead of guessing.

## 2. Hallucinated facts/details
**Likely cause**: prompt asks for specifics the model can't reliably know (real-time data, unverifiable specifics, or overly narrow factual claims); no instruction for how to handle uncertainty.
**Fix**: explicitly permit "I don't know" / flagged uncertainty as a valid answer; separate "verified fact" requests from "reasonable inference" requests in the instructions; if grounding data is available, require citation to it rather than open recall.

## 3. Vague, hedge-y responses
**Likely cause**: the prompt itself is vague, or asks for a definitive answer on a genuinely ambiguous input without permission to be specific/take a position.
**Fix**: tighten the prompt's own specificity first (vague in → vague out is the default failure); explicitly instruct "give a specific answer, state assumptions rather than hedging."

## 4. Wrong length (too long / too short)
**Likely cause**: no length constraint given, or length constraint given in a unit the model doesn't reliably hit (exact word counts are unreliable; ranges and structural constraints work better).
**Fix**: specify length via structure ("3 bullet points," "one paragraph") rather than exact counts; state the length constraint near the instruction it modifies, not buried elsewhere.

## 5. Wrong format
**Likely cause**: format described in prose instead of shown; multiple format-relevant instructions conflict; no schema/example given for structured output.
**Fix**: show the exact target format as a literal example or schema; use XML tags or prefilling to force structural compliance; remove any contradicting format instruction elsewhere in the prompt.

## 6. Refuses to respond / over-triggers safety behavior
**Likely cause**: phrasing pattern-matches a sensitive-topic trigger even though the actual request is benign; missing context that would establish legitimacy (e.g. professional/educational framing).
**Fix**: add the legitimate context explicitly rather than relying on it being inferred; rephrase away from language that pattern-matches harmful-request phrasing while keeping the actual ask unchanged; if the request is genuinely dual-use, state the authorized/defensive context up front.

## 7. Prompt too long / expensive
**Likely cause**: content included "just in case" rather than because it changes behavior; redundant restatement of the same instruction in multiple places; full examples where a shorter one would anchor the pattern equally well.
**Fix**: remove content and check whether output quality actually drops (if not, it wasn't load-bearing); move rarely-needed detail into a referenced file loaded only when relevant (progressive disclosure); trim examples to the minimum that still covers the needed pattern range.

## 8. Doesn't generalize past the examples given
**Likely cause**: few-shot examples are too narrow/homogeneous, so the model over-fits to their surface pattern instead of the underlying rule; no explicit statement of the general rule alongside the examples.
**Fix**: state the general rule in words in addition to showing examples; diversify examples to cover the actual input range, including at least one edge case; check whether the task genuinely needs a rule-based instruction instead of example-based induction.

## Debugging workflow

1. Reproduce the failure with the actual prompt and actual failing input — don't debug from a description of the failure.
2. Isolate which part of the prompt is responsible: strip sections one at a time (or add them one at a time to a minimal prompt) until the failure appears/disappears.
3. Check the matching table above for the closest symptom.
4. Make one change at a time and re-test — simultaneous changes make it impossible to know which one fixed (or caused) the new behavior.
5. Re-run the happy-path case after any fix, to confirm the fix didn't regress previously-correct behavior.

## Quick reference

| Symptom | First thing to check |
|---|---|
| Inconsistent output | Is format explicit? Are there examples? |
| Hallucination | Is uncertainty handling specified? |
| Vague response | Is the prompt itself specific? |
| Wrong length | Is length specified structurally, not as an exact count? |
| Wrong format | Is there a literal example/schema? |
| Refusal | Is legitimate context stated explicitly? |
| Too long/expensive | Does removing content actually drop quality? |
| Doesn't generalize | Do examples cover the real input range + is the rule stated in words? |
