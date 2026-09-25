# _working — in-progress docs staging

This folder is a scratch zone for documentation that is being drafted or updated *during* an active session/task, before it has been verified and placed into its permanent home under `docs/`.

## Why this exists

Writing a doc directly into its final category folder (e.g. `docs/checkout/`) mid-session creates two problems: it's unclear which docs are verified-current vs. still being drafted, and half-finished notes get mixed in with production-grade reference material. `_working/` keeps drafts visibly separate until they're done.

## Workflow

1. **During a session**: new or heavily-revised docs go here first, named however is convenient (`YYYY-MM-DD-topic.md` or just `topic.md` — no fixed convention, this is scratch space).
2. **At the end of the session/task**, once the content is accurate and verified against current code (see `docs/README.md` for the verification bar every permanent doc must meet):
   - **Merge**: if the content extends or corrects an existing doc, fold it into that doc in its permanent category folder and delete the file here.
   - **Promote**: if it's a genuinely new, standalone doc, move it into the correct category folder from the map in `docs/README.md` (create a new category only if none of the existing ones fit).
   - **Discard**: if the draft turned out to be exploratory notes with no lasting value, delete it — don't let it accumulate.
3. **Nothing in `_working/` should be treated as authoritative.** Code and cross-references should never point into `docs/_working/` — only into the permanent category folders.

This folder should be empty between sessions. If you find stale files here, that's a sign a prior session's cleanup step (2) didn't happen — resolve them before adding new drafts.
