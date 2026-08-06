# DTB SEO Audit Discipline and Output Contract

Load this for any SEO work that produces findings or a plan rather than a single inline answer — a page/template audit, a sitewide technical-SEO pass, an internal-linking plan, a Core Web Vitals review. It defines *how findings are evidenced and reported*, not what to look for (that's `SKILL.md` and `references/internal-linking.md`).

## Part 1 — Evidence rules (anti-hallucination)

These are non-negotiable. An SEO audit that guesses is worse than no audit, because it generates work items that don't correspond to anything real.

1. **Only report what you verified this run.** Every finding must trace to a file you actually read, a command you actually ran, or output the user actually pasted in. Never report an issue because it's common on ecommerce sites.
2. **Cite the exact location.** Every finding names the absolute file path and, where applicable, the line number or the component/function, plus the route pattern it affects (e.g. `frontend/src/pages/CategoryPage.jsx` → route `/category/:slug`).
3. **Quote the evidence.** Include the actual snippet — the real `SEOHead` props block, the real `buildProductSchema` call, the real `static_routes()` entry — not a paraphrase. If a finding is an *absence* (no `canonical` prop passed, route missing from `static_routes()`), quote the surrounding code that shows the absence and say which file you grepped to confirm it.
4. **Separate code-verifiable from runtime-verifiable.** Rendered `<head>` output, indexation status, actual LCP/INP/CLS numbers, and Google's interpretation of schema are **not** determinable from source alone. Tag those findings `needs-manual-confirmation` and name the exact verification step (Google Search Console URL Inspection, Rich Results Test, `npx lighthouse <url>`, view-source on a built page). Never state a rendered-output or ranking fact you inferred from code.
5. **Never fabricate catalog values.** No invented SKUs, prices, stock states, ratings, review counts, category slugs, brand slugs, part numbers, or product names — anywhere, including in example anchor text or example schema. If a real value is needed and unavailable, write `<value from catalog>` and say what to look it up in.
6. **Scope every finding.** Classify as `template-wide` (affects every page rendered by that component/route pattern), `page-specific` (one route or one product), or `sitewide` (a shared component, `SEOHead` itself, `schema.js`, the sitemap service, a build config). Getting this wrong misprices the fix — say how you determined scope (e.g. "the prop is passed in `ProductDetailPage.jsx`, which renders all `/products/:slug`, so template-wide").
7. **No tool output you didn't produce.** Don't present estimated Core Web Vitals numbers, keyword volumes, or crawl statistics as measurements. If a number would help, state which command/tool the user should run to get a real one.
8. **Correct scope drift.** If an audit surfaces a stale claim elsewhere in this skill (a route that no longer exists, a renamed file, a page that now exists after being listed as absent), say so explicitly in the report so the skill gets updated — don't silently work around it.

## Part 2 — Severity

| Severity | Meaning | Examples in DTB terms |
| --- | --- | --- |
| `critical` | Blocks indexing, exposes a non-indexable surface, or emits false structured data | Session-owned route reachable in the sitemap; `noindex` missing on cart/checkout/account/auth; product schema emitting a price or availability the data doesn't support; canonical pointing at a wrong or nonexistent URL |
| `high` | Materially degrades ranking or discovery of a real commercial page | Indexable template with no `title`/`description`; PDP with no `buildProductSchema`; new customer-facing static route absent from `static_routes()`; LCP-critical image not preloaded on the PDP |
| `medium` | Real quality gap, not a blocker | Truncation-reliant descriptions; missing breadcrumb schema on a page with a visible breadcrumb; weak/duplicated anchor text; thin internal linking into the parts/schematics cluster |
| `low` | Polish/consistency | Title-length inconsistency within limits; OG image falling back to the logo on a page that could pass a real image |
| `info` | Observation, not a defect | Noting a deliberate exclusion; noting an intentional environment gate |

Severity is assigned per finding and never inflated to increase urgency. A `medium` reported as `critical` destroys the ordering value of the whole report.

## Part 3 — Category tags

Use exactly these, one primary per finding: `indexability`, `metadata`, `structured-data`, `canonicalization`, `sitemap`, `internal-linking`, `core-web-vitals`, `content-accuracy` (schema/copy contradicting real catalog data), `template-consistency` (same defect recurring across a page type). Live-audit findings (`references/live-audit.md`) additionally use: `content-pollution` (junk/leaked markup in visible text), `trust-accuracy` (rating/price/stock/compatibility mismatches, stale dated content), `ux-friction` (search/filter/cart/form UX problems), `brand-consistency` (messaging/quality incoherence across pages).

Explicitly out of scope for this skill's audits, hand off instead: conversion-rate/merchandising copy → `pdp-conversion-specialist`; visual/design-token issues → `dtb-design-system`; general code quality → `refactoring-expert`; competitor/market claims → `market-intelligence-analyst`.

## Part 4 — Output contract

Mirrors the `refactoring-expert` precedent in this repo (`TODO_refactoring-expert.md`), so SEO output is picked up the same way.

- Every requirement is a trackable task with a stable ID: `SEO-PLAN-x.y` for strategy/plan items, `SEO-ITEM-x.y` for individual optimization items, `SEO-LINK-x.y` for internal-linking recommendations.
- Every deliverable is a Markdown checkbox item, phrased so a different agent or a human can execute it independently without re-deriving context.
- **Write all audit/plan output to `TODO_dtb-seo.md` only.** Do not create or edit any other file as part of the report; code changes are expressed as patch-style diffs or clearly labeled fenced blocks *inside* that file for the owning agent (`frontend-react` or `wp-backend`) to apply.
- This contract governs *reporting*. It does not restrict an agent that has been asked directly to implement a change — in that case the owning agent edits its own files normally and the TODO file is optional.
- Preserve the requested scope exactly: don't silently drop findings or expand into unrequested areas; put out-of-scope observations under Follow-Up.

### `TODO_dtb-seo.md` structure

```markdown
# SEO Audit / Plan: <target>

## Context
- Scope audited (routes, components, backend files) and how it was determined.
- Files actually read this run, absolute paths.
- What could NOT be verified from source, and the exact step needed to verify it.

## Coverage
| Template | Route pattern | Component/file | Audited? |

## SEO Strategy Plan
- [ ] SEO-PLAN-1.1 — <objective, and how it will be measured>

## SEO Optimization Items
- [ ] SEO-ITEM-1.1 — <short title>
  - **Severity / Category / Scope**: high / metadata / template-wide
  - **Element**: <file:line, route pattern>
  - **Evidence**: <quoted snippet actually read>
  - **Current state**: <what is true today>
  - **Recommended change**: <specific and executable>
  - **Why it matters**: <mechanism, not a generic "helps SEO">
  - **Owner**: frontend-react | wp-backend | catalog-data | needs-manual-confirmation

## Internal Linking Recommendations
- [ ] SEO-LINK-1.1 — <source route> → <target route> — Relatedness <score>/100
  - **Component breakdown**: catalog proximity / functional compatibility / intent / term overlap
  - **Rationale**: <1–2 sentences citing the specific shared taxonomy term, schematic ID, or relationship>
  - **Anchor variations**: 1) exact  2) descriptive  3) contextual
  - **Placement**: <where it lives, and whether it belongs in WooCommerce upsell data rather than React markup>

## Template-Level Patterns
Findings that recur across a page type, stated once with the affected route patterns.

## Quick Wins
Highest impact-to-effort items, referenced by task ID only.

## Prioritized Action Plan
- **Immediate** / **This week** / **This month** / **Monitor** — task IDs only, no restated detail.

## Proposed Code Changes
Patch-style diffs or labeled fenced file blocks.

## Verification Commands
Only commands that exist in this repo (e.g. `npm run lint` from `frontend/`, `npx lighthouse <url>`), plus manual checks (GSC URL Inspection, Rich Results Test) named explicitly. State plainly where no automated check exists.

## Quality Assurance Checklist
- [ ] Every finding cites a real file path and a quoted snippet read this run.
- [ ] No fabricated SKU, price, slug, part number, or product name anywhere in the report.
- [ ] Every finding has severity, category, and scope tags.
- [ ] Runtime-only claims tagged `needs-manual-confirmation` with a named verification step.
- [ ] No recommendation hand-writes `<meta>`/`<title>` outside `SEOHead`, or inline JSON-LD outside `schema.js`.
- [ ] No session-owned route proposed for the sitemap or for an editorial inbound link.
- [ ] Schema recommendations correspond to content actually visible on the page.
- [ ] Each item names an owning agent.

## Follow-Up / Deferred
Out-of-scope items with reasoning, and any stale claim in the `dtb-seo` skill found during this audit.
```

## Part 5 — Red flags to check for and never to produce

- Keyword stuffing in titles, descriptions, or product copy.
- Structured data that doesn't match visible page content (the fastest route to a manual action).
- Fabricated price/availability/rating in `buildProductSchema` input.
- Duplicate or near-duplicate titles/descriptions across products or categories (cannibalization within a small catalog is self-inflicted).
- Generic filler copy written to hit a word count.
- Over-optimized, repetitive exact-match anchor text.
- Neglected internal linking into the parts/schematics cluster.
- Recommending infrastructure (CDN, compression, image formats) without first checking `frontend/webpack.config.cjs` and the hosting layer for what already exists.
- Recommending a paid tool the agent can't operate, in place of a check it could actually perform.
- Proposing measurement with no named metric, tool, or baseline.
