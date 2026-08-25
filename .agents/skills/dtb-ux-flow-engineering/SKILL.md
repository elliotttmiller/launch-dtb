---
name: dtb-ux-flow-engineering
description: Design and evaluate complete DTB user journeys, state transitions, ownership and recovery rather than isolated screens.
---
# DTB UX Flow Engineering

## Apply when
Use for checkout, repairs, returns, warranty, authentication, account/order status, schematics/parts, calculators, onboarding, and any feature where user progress crosses multiple states or systems.

## Model the journey
Start with user goal, entry prerequisites, terminal outcome, and system owners. Include only states relevant to the feature, but explicitly consider: happy path; loading/pending; empty/unavailable; validation failure; authentication/authorization challenge; stale/session-expired state; provider/network/server failure; duplicate submission; cancellation/back navigation; retry/recovery; partial completion; and terminal success/next action.

For every state define authoritative data/owner, visible information, allowed actions, transition trigger, side effect, and recovery path. Separate client presentation state from server/provider truth. A UI transition must not imply a commerce/payment/order transition that the authoritative backend/provider has not confirmed.

## Flow quality
Prevent dead ends, destructive surprise, lost progress, ambiguous primary actions, hidden prerequisites, and retries that can duplicate side effects. Preserve user context across recoverable errors when safe. Validation should appear close to the responsible input/action and explain recovery without exposing sensitive internals.

Use diagrams/tables only when they make behavior clearer; they must be derived from actual contracts. Do not invent APIs or backend states to satisfy a mockup.

## Output
For design/audit work return the state/transition model, ownership at boundaries, failure/recovery gaps, and observable acceptance criteria. For implementation work ensure the actual UI covers the required states and report intentionally unsupported states.