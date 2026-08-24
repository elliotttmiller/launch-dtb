---
name: dtb-frontend-architecture-decisions
description: Evidence-based decision framework for where frontend work belongs: browser, server, build time or existing platform boundaries.
---
# DTB Frontend Architecture Decisions

Architecture is placement of work and authority, not a list of fashionable patterns.

Before proposing BFF, SSR/SSG/ISR, RSC, islands, edge execution or micro-frontends, state the concrete DTB constraint, current bottleneck, data locality, ownership implications, operational cost and rejected simpler alternative. The default remains the existing modular React storefront + WordPress/WooCommerce/MU-plugin architecture unless evidence proves a change is warranted.

Prefer a modular frontend monolith while one repository/team/deployment boundary remains appropriate. Keep compute near authoritative data when latency/consistency trade-offs make that more important than user proximity.
