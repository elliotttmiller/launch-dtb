# DTB Internal Linking Strategy

Load this when a task is about how DTB's pages link to each other for search and crawl purposes — "improve internal linking", "which products should link to each other", "build a hub/spoke structure for a category", "audit orphan pages", "our anchor text is bad".

**This is not a generic crawler workflow.** There is no arbitrary external domain to crawl and no blog post inventory to interlink. DTB's link graph is derivable from local repo state — routes, WooCommerce taxonomies, and the schematics mapping data. Derive it, do not invent it, and do not ask the user to upload a sitemap CSV when the URL set is already computable from the files below.

## Step 1 — Build the real URL inventory from source, not from a crawl

The complete set of indexable page templates is defined in two places. Read both before proposing any link.

**Route definitions** — `frontend/src/App.jsx` (React Router `<Routes>` block). The indexable customer-facing templates:

| Template | Route pattern | Component |
| --- | --- | --- |
| Home | `/` | `pages/Home` |
| Product grid | `/products` | `pages/Products.jsx` |
| Brand index | `/products/brands` | product selector |
| Brand page | `/products/brands/:brandSlug` | product selector |
| Brand + category | `/products/brands/:brandSlug/categories/:categorySlug` | product selector |
| PDP | `/products/:slug` | `pages/ProductDetailPage.jsx` |
| PDP variation | `/products/:slug/variations/:variationId` | `pages/ProductDetailPage.jsx` |
| Category page | `/category/:slug` | `pages/CategoryPage.jsx` |
| Parts finder | `/parts` | `pages/Parts` |
| Part detail | `/product/:partNumber` | `pages/Product` |
| Schematics | `/schematics` | `pages/Schematics.jsx` |
| Repairs cluster | `/repairs`, `/repairs/start`, `/repairs/packages` | repairs pages |
| Support/info | `/faq`, `/calculators`, `/contact`, `/shipping-policy`, `/returns`, `/return-policy`, `/policies` | static pages |

**Sitemap-eligible set** — `dtb-platform/Seo/SitemapUrlRepository.php::static_routes()` plus the generated sets in `SitemapService.php`:
- Products: `/products/{post_name}` (`product_urls()`), variations never emitted independently.
- Categories: `/category/{term_slug}` from the `product_cat` taxonomy (`taxonomy_urls('product_cat', $page, '/category')`).
- Brands: `/products/brands/{term_slug}` from the allowlisted brand taxonomy (`brand_taxonomy()` → `product_brand`/`pwb-brand`/`pa_brand`), route prefix `/products/brands`.

**Consequence — check this before any link recommendation:** a route can exist in `App.jsx` and be absent from `static_routes()`. `/repairs/track`, `/product/:partNumber`, and the brand+category combination route are reachable templates that are not independently emitted in the sitemap. Internal links are therefore the *only* discovery path for some of these. Never recommend a link to a route that isn't in `App.jsx`, and always state explicitly when a target is internal-link-discoverable-only.

**Excluded from the link graph entirely** (never recommend an indexable inbound link, never treat as a linking opportunity): `/cart`, `/checkout/*`, `/order/*`, `/order-tracking/*`, `/dashboard*`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/settings/*`, `/preview/*`, `/returns/status/*`, `/support/status/*`, `/error/*`. These are session-owned or noindex; a nav link from the header is fine, an editorial in-content link is not.

## Step 2 — Understand what linking already exists before proposing more

Do not propose a "related products" mechanism. There is one, and it is backend-owned:

- `dtb-catalog-platform/Rest/ProductDetailController.php::get_related_products()` builds the PDP rail from `get_upsell_ids()` merged with `wc_get_related_products()`, filtered to visible products and capped by `RELATED_PRODUCT_LIMIT`.
- It surfaces through `useProductDetail.js` → `useCatalogProductDetail.js` → `ProductDetailPage.jsx` (`.product-related` section, plus a "Browse all products" link to `/products`).

So the correct lever for "this PDP should link to that PDP" is **WooCommerce upsell/related product data (a `catalog-data` concern)**, not a new hard-coded link component in React. Say so, and hand off.

Schematic ↔ product linking is likewise already modeled in `frontend/src/data/schematicMappings.js`:
`SCHEMATIC_DEFINITIONS`, `PRODUCT_SEARCH_MAPPINGS`, `getSchematicToProductMap()`, `getSchematicIdForProduct()`, `getSchematicLinkForProduct()`, `buildPartsUrl()`, `buildSchematicsUrl()`. A product↔schematic↔parts link recommendation must go through these helpers — hand-writing a `/schematics?...` or `/parts?...` URL string bypasses the canonical builders and will drift.

## Step 3 — Relatedness scoring (0–100), DTB-specific

Score a candidate link target against a source page. Every component must be computed from data actually read from the repo/catalog — if a component can't be evidenced, say "insufficient data" for that component rather than guessing a number. A total score is only reportable when at least three of four components are evidenced.

| Component | Weight | What counts as evidence in DTB |
| --- | --- | --- |
| **Catalog proximity** | 40 | Shared `product_cat` term; shared brand term; parent/child category relationship; existing upsell/related relationship in WooCommerce |
| **Functional compatibility** | 30 | Genuine fit/compatibility — same schematic (`getSchematicIdForProduct` agreement), part appearing in the tool's schematic, consumable used by the tool, replacement part for that model |
| **Intent alignment** | 20 | Both pages serve the same funnel stage (research → compare → buy → repair/maintain), or the link deliberately advances a stage (PDP → parts for that model is buy→maintain and is high value) |
| **Term/keyword overlap** | 10 | Overlapping product name tokens, SKU family, brand name, category label — measured against actual title/description fields, not assumed |

Score bands: **80–100** implement now; **60–79** good candidate, needs a human merchandising sanity check; **40–59** only if the section has thin linking; **<40** do not link (dilutes relevance, and DTB's catalog is small enough that noise links are visible).

Report the top 10 opportunities max, each with score, component breakdown, and a 1–2 sentence rationale naming the specific evidence (e.g. "shares `product_cat: automatic-taper`, and `SCHEMATIC_DEFINITIONS` maps both to the same schematic ID"). No rationale that merely restates the score.

## Step 4 — Anchor text rules

Provide **three variations per recommended link**, all of which must be usable as visible on-page text in DTB's actual voice (a trade tool storefront speaking to working drywall contractors — see `pdp-conversion-specialist` for voice, and note it owns catalog search-relevance copy, so coordinate rather than overwriting its territory).

Required mix per link:
1. **Exact/near-exact target** — the product, part, brand, or category name as a customer would say it.
2. **Descriptive/partial** — describes what the target is or does, containing only part of the target's name.
3. **Contextual/natural-language** — reads as a normal sentence fragment, may contain none of the target's exact terms.

Hard rules:
- Never `click here`, `read more`, `this page`, `learn more`, a bare URL, or a bare SKU with no human-readable context.
- Never repeat the same exact-match anchor to the same target more than once on a page, and avoid the identical exact-match anchor sitewide — vary it.
- Anchor text must match what the destination actually is. Anchoring "flat box replacement blades" to a page that sells complete flat boxes is a relevance mismatch and a trust problem, not a clever keyword play.
- Never invent a product/part/model name for anchor text. Every named entity in a proposed anchor must have been read from the catalog, `schematicMappings.js`, or the live product data.
- Anchors describing fit ("fits the …", "compatible with …") require verified compatibility evidence per Step 3's functional component. An unverified compatibility claim in anchor text is a returns-and-trust liability, not an SEO issue — flag it as such.

Where an editorial sentence is needed to host the link, write one short paragraph (≤2 sentences) that is genuinely useful with the link removed. If the sentence exists only to carry the link, it's filler — do not propose it.

## Step 5 — Hub-and-spoke structure for DTB

DTB's natural hubs are already routes; do not invent a new hub page type without a strong argument.

- **Category hub** `/category/:slug` → spokes: PDPs in that category. Hub should link down to its top products; each PDP should link back up to its category (breadcrumb counts, and `buildBreadcrumbSchema` in `frontend/src/utils/schema.js` should reflect the same trail — visible link and schema must agree).
- **Brand hub** `/products/brands/:brandSlug` → spokes: that brand's PDPs, plus `/products/brands/:brandSlug/categories/:categorySlug` as intermediate hubs.
- **Schematics/parts hub** `/schematics` and `/parts` → spokes: `/product/:partNumber` part pages, reached via `buildSchematicsUrl`/`buildPartsUrl`. This is DTB's most under-linked cluster in structural terms because part pages are not in the sitemap — inbound internal links from the relevant PDP and schematic are the discovery mechanism.
- **Lateral (spoke→spoke)**: PDP↔PDP only via the WooCommerce upsell/related mechanism above; part↔part only where the same schematic contains both.
- **Support cluster** `/faq`, `/calculators`, `/repairs*`, `/policies` — link into these from PDPs only where genuinely relevant (a repair-service link from a PDP for a repairable tool is real; a blanket footer-style link injected into product copy is not).

Anti-patterns specific to this graph: linking every PDP to every other PDP in a brand; injecting category links into product descriptions where the breadcrumb already provides the link; creating a link to a filtered/query-string URL whose canonical points elsewhere (check `SEOHead`'s `canonical` prop first).

## Step 6 — Orphan and depth check

An orphan check must be evidence-based: `Grep` for the route/slug across `frontend/src` (`Link to=`, `navigate(`, URL builders in `schematicMappings.js`, nav components) and report the actual referencing files. Report a page as orphaned only when the grep returns no in-app reference; otherwise report "linked from N locations" with the file list. Never assert an orphan from intuition.

Flag any indexable template more than three clicks from `/` along verified links, and say which specific link would reduce the depth.

## Output

Internal-linking work uses the shared output contract in `references/audit-output.md` — task IDs, evidence citations, severity/scope tagging, and the single-TODO-file rule. Do not invent a separate format.
