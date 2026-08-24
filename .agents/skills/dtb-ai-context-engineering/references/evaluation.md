# AI Workflow Evaluation

Evaluate model-assisted workflows with observable outputs rather than hidden reasoning.

Minimum test classes where relevant:

- happy path;
- boundary/edge case;
- malformed or missing-data case;
- adversarial/instruction-injection case;
- regression case for previously correct behavior.

Define measurable success criteria: valid schema/format, grounded citations/evidence, preserved ownership, no fabricated facts, correct tool selection, or explicit uncertainty when capability/data is unavailable.

Change one major prompt/context variable at a time when diagnosing reliability so cause/effect remains observable.
