---
name: dtb-ux-flow-engineering
description: Design and evaluate complete DTB user flows, state transitions and recovery paths rather than isolated screens.
---
# DTB UX Flow Engineering

For checkout, repairs, returns, authentication, account/order status, schematics/parts and other stateful experiences, model the relevant complete flow:

- entry/prerequisites;
- happy path;
- loading/pending;
- validation failure;
- authorization/authentication challenge;
- provider/network/server failure;
- cancellation/back navigation;
- retry/recovery;
- empty/unavailable state;
- terminal success and next action.

For every state identify the owning system, authoritative data, user action, transition trigger and recovery. Use state/sequence diagrams when they clarify behavior, but diagrams must reflect source contracts rather than invent them.
