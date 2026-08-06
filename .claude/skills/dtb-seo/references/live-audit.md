# DTB Live Site Forensic Audit

Load this when the task requires actually visiting the live storefront and verifying real rendered output — not source-code inference. Trigger: "audit the live site", "crawl the storefront for issues", "why does this page look broken/wrong in production", "check for content pollution/junk text", "does this look trustworthy/professional", "audit UX across the site". This is the one `dtb-seo` mode that requires `WebFetch` — the invoking agent must have it (currently `frontend-react`; verify before starting, don't attempt this from an agent without the tool).

**This is not a generic crawler-bot prompt.** DTB's route inventory is already known from source (`references/internal-linking.md` Step 1) — don't rediscover it by blind crawling. Use the known route/template list as the audit's URL inventory, then `WebFetch` a representative sample of each template plus any specific URL the user names.

## Evidence rules — stricter, not looser, than a source-code audit

Everything in `references/audit-output.md` Part 1 (evidence rules) applies here at full force, plus:

1. **Only report what you actually fetched and read this run.** A finding must quote the real fetched content — the actual visible text, the actual rendered `<title>`, the actual JSON-LD block as served — not a paraphrase and not an inference from the component source. If `WebFetch` returns something unexpected (blocked, redirected, JS-only shell with no content), say so plainly rather than filling the gap with a source-code guess.
2. **Distinguish what `WebFetch` can and can't tell you.** It retrieves rendered HTML/text at fetch time — real for meta tags, structured data, visible copy, and static markup. It does **not** execute interactive behavior, capture visual layout, or verify Core Web Vitals — those need the `run` skill, a real browser, or `npx lighthouse`. Never claim a visual/interaction finding ("the button overlaps on mobile") from a `WebFetch` text response; tag it `needs-manual-confirmation` per the existing contract instead.
3. **Every finding names the exact URL and the exact location within it** — the specific visible text block, the specific meta/schema field, the specific form/section. Quote the actual snippet.
4. **Never fabricate a catalog value while reporting a live finding either** — if a fetched page shows a price/SKU/rating, quote it exactly; never "helpfully" round or paraphrase a number.

## What to check on a live fetch, retargeted to DTB's actual site

### A. Content pollution
Check fetched pages for:
- Raw CSS/JS leaking into visible text (a missed `<style>`/`<script>` boundary, a build artifact rendered as content).
- SVG/icon markup or `alt`/`title` metadata visibly leaking into rendered text.
- Build-tool or generator junk strings (source-map comments, webpack chunk names, template-engine leftovers) visible outside `<script>`/comments.
- Encoding issues (mojibake, unescaped entities like `&amp;amp;` — check `stripHtml()` in `schema.js` is actually being hit, not bypassed).
- Placeholder/lorem-ipsum/dev-only text shipped to production.
- Mixed-language or garbled strings.
- Duplicate paragraphs (the same boilerplate block repeated verbatim across unrelated PDPs — a template bug, not a copy problem).
- Stale campaign/promo remnants (a banner or copy block referencing an expired promotion, season, or date).

### B. Trust, credibility, and data accuracy — DTB-specific signals
- **Rating/review sanity**: does `aggregateRating` (visible or in JSON-LD) ever exceed a 5-point scale, or show a `reviewCount` inconsistent with visible reviews on the page? Cross-check `buildProductSchema`'s real inputs (`references/audit-output.md` already forbids fabricating these — a live audit checks whether that discipline actually reached production).
- **Pricing consistency**: does the visible price match the price in JSON-LD (`offers.price`)? A mismatch is a `critical` finding — it's both an SEO structured-data violation and a direct trust/legal issue (advertised-price mismatch).
- **Stock/availability honesty**: does `availability` in schema match what the page visibly tells the customer (in stock / backorder / discontinued)?
- **Outdated seasonal/dated content**: a promo, "new for 202X," or seasonal messaging block still live past its relevance window.
- **Compatibility/fitment claims**: any visible "fits X" / "compatible with Y" claim on a PDP that isn't backed by real catalog compatibility data — this is `pdp-conversion-specialist`'s territory to have prevented, but a live audit is where an unverified claim that slipped through actually gets caught. Flag it, cite the exact page and quoted claim, hand off to `pdp-conversion-specialist`/`catalog-data` to verify or remove.
- **Contact/company legitimacy signals**: does the footer/contact/about content present consistent, real contact information? (DTB is a real registered business, not an anonymous storefront — this checks presentation accuracy, not existence.)

### C. UX / conversion friction — DTB's actual flows
- Search/filter: does an empty or "no results" state on `/products`, `/category/:slug`, or the catalog search autocomplete appear prematurely (before a query is meaningfully entered) or fail to suggest an alternative (adjust filters, browse category)?
- Cart/checkout entry points: confusing or missing CTA copy on Add to Cart / Checkout Now (per `AGENTS.md` §9's established `#2255ee`/black convention — check the live page actually matches, not just the source).
- Forms (contact, repair intake, account): unclear error messages, phone-field/country-handling inconsistencies, dead-end states with no next action.
- Any page that visibly fails to help a contractor move toward find-part → add-to-cart or start-a-repair — DTB's actual conversion goals.
- Missing trust reinforcement near conversion points (e.g. no shipping/return-policy visibility near Add to Cart, if that's the intended pattern — check against what other similar pages actually do before flagging an absence as a defect).

### D. Technical SEO / indexability — live verification of what `references/audit-output.md` already tags `needs-manual-confirmation`
This is where those tags get resolved instead of deferred:
- Actual rendered `<title>`/meta description at the fetched URL — do they match what `SEOHead` props should have produced, or is something stale/cached/wrong in production specifically?
- Duplicate titles/descriptions across multiple live PDPs or category pages (fetch a sample across templates and compare).
- Canonical tag as actually served.
- JSON-LD as actually served — valid, matches visible content, matches the schema type expected for that template.
- Whether a page returns unexpected content for its route (a 404 rendered as 200, a redirect loop, an error boundary shown instead of the real page).

### E. Template consistency — DTB's real templates
Fetch a representative sample per template (not just one page) and compare for recurring, not isolated, issues:
PDP, category page, brand page, parts/schematics pages, repairs cluster, static/support pages (FAQ, policies). A defect appearing identically across every PDP sampled is `template-wide`; one appearing on a single product is `page-specific` — this distinction (already required by `audit-output.md` Part 1, rule 6) is exactly what multi-page sampling is for.

### F. Brand/message consistency
- Does the homepage's stated value proposition match what category/PDP/repair pages actually deliver?
- Is tool/parts/repair-service messaging coherent across the pages that touch each, or does it read as patched-together modules?
- Any page whose quality (design, copy, content pollution) visibly drags down the premium/professional impression the rest of the site establishes?

## Deliverable format

Live-audit findings still go through the shared `TODO_dtb-seo.md` contract in `references/audit-output.md` — do not invent a separate file or format. Use these additions specific to a live audit:

- Add a **Live Coverage** table alongside the existing Coverage table: `| Template | URL(s) actually fetched | Fetched successfully? | Notes |` — this is the live-audit equivalent of the source-file coverage table, and both should appear when a task combines source and live verification.
- New category tags usable in findings (add to `audit-output.md` Part 3's list when using this mode): `content-pollution`, `trust-accuracy`, `ux-friction`, `template-consistency` (already exists), `brand-consistency`.
- For each finding, in addition to the standard severity/category/scope fields, add **Fetched evidence**: the exact quoted snippet from the actual `WebFetch` response, distinct from any source-code evidence cited for the same finding.
- Close with a **Site Health Scorecard** (0–10, one line each): Trust & Credibility, UX & Conversion Friction, Technical SEO/Indexability, Content Cleanliness, Template Consistency, Overall — each score justified by a one-sentence reference to the findings that drove it, never an unsupported number.

## Explicitly out of scope for this mode

- Anything requiring JS execution, visual rendering, or interaction (layout bugs, animation issues, click-through testing) — hand off to the `run` skill or manual browser verification; `WebFetch` cannot do this and a finding claiming otherwise is fabricated.
- Off-page/backlink/digital-PR review — DTB runs no content-marketing or backlink program; this mode audits DTB's own site, not external link profiles. If backlink/authority work is ever wanted, that's `market-intelligence-analyst`'s competitive-research territory, not a live-audit finding here.
- Rewriting or fixing anything directly — this mode produces the `TODO_dtb-seo.md` report; implementation goes to the owning agent named in each finding (`frontend-react`, `wp-backend`, `catalog-data`, `pdp-conversion-specialist`) exactly as the existing output contract already specifies.
