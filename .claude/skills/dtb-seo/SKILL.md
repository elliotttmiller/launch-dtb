---
name: dtb-seo
description: Use whenever a task touches search-engine visibility for the Drywall Toolbox storefront — meta tags/titles/descriptions, Open Graph/Twitter cards, JSON-LD structured data (Product/Breadcrumb/Organization/WebSite schema), canonical URLs, robots/noindex, sitemap behavior, internal linking / anchor text / hub-and-spoke structure across category-brand-product-schematic pages, or Core Web Vitals (LCP/INP/CLS) for the React SPA. Trigger on requests like "improve SEO for this page", "why isn't this product ranking", "add structured data", "fix the sitemap", "which pages should link to each other", "find orphan pages", or "audit Core Web Vitals". Grounded in this repo's actual SEO pipeline (SEOHead.jsx, schema.js, dtb-platform Seo sitemap service, dtb-marketing ProductSeoController) — not a generic content-marketing/blog SEO checklist, since DTB has no blog, no author bios, and no multilingual routes.
---

# DTB SEO

Drywall Toolbox is a client-rendered React SPA (Webpack, no Next.js/SSR) storefronting WooCommerce products — a commerce catalog, not a content-marketing site. Generic SEO advice built for blogs (E-E-A-T author credentials, Article schema, hreflang, AI-content-detection guidelines) mostly doesn't apply here and should be set aside; what matters is technical correctness of the existing pipeline and Core Web Vitals for a CSR app.

## References — load on demand

- **`references/internal-linking.md`** — the DTB link graph (routes, taxonomies, schematics mappings), 0–100 relatedness scoring, anchor-text rules, hub/spoke structure, orphan checks. Load for any "which pages should link to where" task.
- **`references/audit-output.md`** — evidence/anti-hallucination rules, severity + category + scope tagging, and the `TODO_dtb-seo.md` task-ID output contract. **Load this whenever the deliverable is an audit or a plan rather than a single inline answer.**

## Two working modes

1. **Inline advisory** — a scoped question during implementation ("what should this PDP's canonical be?"). Answer directly using the checklist below; no TODO file.
2. **Audit / plan** — a page, template, or sitewide review, or an internal-linking plan. Follow `references/audit-output.md` in full: task IDs, quoted evidence, severity/scope tags, everything written to `TODO_dtb-seo.md` and nothing else.

## The actual SEO pipeline in this repo — read before touching anything

1. **Backend meta source**: `dtb-marketing/Seo/ProductSeoController.php` registers five per-product meta fields on the WooCommerce product editor, exposed via REST so the frontend can read them from `product.meta_data[]` without an extra call:
   - `_dtb_seo_title` (≤60 chars) — custom page title override
   - `_dtb_seo_description` (≤160 chars) — custom meta description override
   - `_dtb_seo_focus_kw` — focus keyword (informational only, not rendered in output)
   - `_dtb_seo_canonical` — canonical URL override
   - `_dtb_seo_noindex` — noindex flag
   It also outputs head tags server-side via `wp_head` for non-SPA-rendered contexts (`dtb_seo_output_head_tags`).
2. **Frontend head management**: `frontend/src/components/shared/SEOHead.jsx` (react-helmet-async) is the single component controlling `<title>`, meta description, robots, canonical, Open Graph, Twitter Card, extra `<link>` hints, and JSON-LD injection for every route. It auto-truncates descriptions to 160 chars, auto-suffixes titles with `| Drywall Toolbox` (unless `noSuffix`), and gates indexing via `REACT_APP_SEARCH_INDEXING`/`REACT_APP_ENV`. **Any SEO change to a page happens by passing the right props to this component — never by hand-writing `<meta>`/`<title>` elsewhere.**
3. **Structured data builders**: `frontend/src/utils/schema.js` — pure functions, no side effects: `buildProductSchema(product, reviews)`, `buildBreadcrumbSchema(crumbs)`, `buildOrganizationSchema()`, `buildSiteLinksSearchBoxSchema()`. Extend these functions for new schema types rather than hand-building JSON-LD inline in a page component.
4. **Sitemap**: `dtb-platform/Seo/SitemapService.php` + `SitemapUrlRepository.php` + `SitemapXmlRenderer.php` (see `docs/seo/sitemaps.md`). DTB MU-plugins own sitemap routing/rendering/cache invalidation; WordPress core's sitemap provider is disabled to avoid dual authority. Canonical entry point: `/sitemap.xml`, children bounded to 1,000 records each, deterministic pagination by ID. Only published, non-`exclude-from-search` WooCommerce products are emitted; variations are never independent URLs. Customer/checkout/cart/order/account/tracking/preview/operator routes are intentionally excluded — never add one of these to the sitemap.

## Checklist — apply to the actual pipeline above, not generic tags

**Per-page (via `SEOHead` props)**
- [ ] `title` set and meaningful (or explicit route default in `STATIC_ROUTE_TITLES` for static pages)
- [ ] `description` present, under 160 chars (component truncates, but write it to fit cleanly rather than relying on truncation)
- [ ] `canonical` correct for pages with query-string variants (search, filters) — point to the canonical unfiltered URL unless the filtered view should itself be indexed
- [ ] `noindex` set on true non-indexable pages (cart, checkout, account, auth, error states) — confirm these aren't accidentally indexable
- [ ] `og`/Twitter image present and real (falls back to `logo-black.svg` if omitted — fine for non-product pages, but product pages should pass a real product image)
- [ ] `schema` passed when the page has a natural type: `buildProductSchema` on PDPs, `buildBreadcrumbSchema` on any page with a breadcrumb trail, `buildOrganizationSchema`/`buildSiteLinksSearchBoxSchema` at the site root only (don't duplicate site-wide schema per page)

**Per-product (via backend meta)**
- [ ] If a product needs an SEO override, it goes through `_dtb_seo_title`/`_dtb_seo_description`/`_dtb_seo_canonical`/`_dtb_seo_noindex` — a manual per-page override in a React component is the wrong layer.
- [ ] `buildProductSchema` receives real WooCommerce fields (`sku`, `brand`, `price`/`sale_price`, `stock_status`, `images`) — never fabricate a price, availability, or rating that the data doesn't support. `aggregateRating`/`review` only render when real review data is passed in.

**Sitemap**
- [ ] Any new customer-facing route added to the React router needs a corresponding entry in `DTB_SitemapUrlRepository::static_routes()` if it should be indexed as a static page — it is not automatic.
- [ ] Never add an authenticated/session-owned route to the sitemap.
- [ ] Brand-taxonomy sitemap detection is allowlist-based (`product_brand`, `pwb-brand`, `pa_brand`) — don't introduce a new taxonomy name without updating that allowlist.

**Internal linking** (details in `references/internal-linking.md`)
- [ ] PDP↔PDP linking goes through WooCommerce upsell/related data (`dtb-catalog-platform/Rest/ProductDetailController.php::get_related_products()`, surfaced by `ProductDetailPage.jsx`) — never a new hard-coded link component.
- [ ] Product↔schematic↔parts links are built with `frontend/src/data/schematicMappings.js` helpers (`getSchematicLinkForProduct`, `buildSchematicsUrl`, `buildPartsUrl`) — never hand-written URL strings.
- [ ] Visible breadcrumb links and `buildBreadcrumbSchema` output describe the same trail.
- [ ] No editorial in-content link to a session-owned route (cart/checkout/account/auth/status/preview).

**Core Web Vitals — CSR-specific, not generic**
Because this is client-rendered (no SSR/hydration), the levers are different from a Next.js/SSR checklist:
- **LCP** (<2.5s): the largest content element only paints after JS parses/executes and data fetches resolve — this is a bundle-size and critical-request-path problem more than a markup problem. Check code-splitting/lazy-loading on route boundaries, whether the LCP image is preloaded (`links` prop on `SEOHead` supports `preload`), and whether the first meaningful data fetch is blocking render unnecessarily.
- **INP** (<200ms): audit for long tasks on the main thread during interaction — expensive re-renders, unmemoized handlers passed to large lists, synchronous work in click handlers. This is a `frontend-react` concern (`useMemo`/`useCallback` discipline) more than an SEO-specific one, but it's a ranking factor.
- **CLS** (<0.1): reserve space for images/async content (explicit dimensions or aspect-ratio containers) so late-loading product images/schematics don't shift layout — check this especially on `ProductDetailPage.jsx` and category grid image loading.
- Don't propose generic fixes (WebP conversion, GZIP/Brotli, CDN) without first confirming they aren't already handled by the existing build (`webpack.config.cjs`) or hosting layer — verify via Glob/Bash before recommending infrastructure that may already exist.

**Robots/indexing**
- [ ] `REACT_APP_SEARCH_INDEXING`/`REACT_APP_ENV` gate indexing globally — confirm you're not fighting this gate with a per-page override that contradicts environment intent.
- [ ] No separate hand-maintained `robots.txt` rule should duplicate what `SitemapService` already governs — check for conflicts before adding one.

## Explicitly not applicable here — don't import generic SEO advice for these

- **Article/BlogPosting schema, author bio, "last updated" bylines, E-E-A-T content-authority signals** — there's no blog/content-marketing surface in this repo (verify via Glob before assuming one now exists). If one is added later, revisit.
- **Hreflang / multilingual** — single-locale storefront; don't add hreflang tags speculatively.
- **AI-content-detection guidelines** — not relevant to structured commerce data.
- **FAQPage schema** — a real FAQ surface *does* exist (`frontend/src/pages/FAQ.jsx`, route `/faq`, already in `static_routes()` and already using `SEOHead`), so FAQPage schema is legitimately available here — but only for the Q&A actually rendered on that page, added via a new builder in `frontend/src/utils/schema.js` (there is none today; the file exports `stripHtml`, `buildProductSchema`, `buildBreadcrumbSchema`, `buildOrganizationSchema`, `buildSiteLinksSearchBoxSchema`). Never emit FAQ schema for Q&A that isn't visible on the page — that's a spam signal, not an SEO win.
- **Generic paid tool recommendations** (Semrush/Ahrefs/Surfer) — not actionable by an agent with no account access. Prefer **Google Search Console** (indexing/query performance — requires the user to check, can't be queried directly), **PageSpeed Insights**/**Lighthouse** (can be run via `npx lighthouse` against a local/staging build if the user wants a real Core Web Vitals number, rather than guessed).

## Who does what

- **Frontend changes** (`SEOHead` usage, `schema.js` extensions, Core Web Vitals fixes in components/bundling): `frontend-react` agent, using this skill's checklist.
- **Backend changes** (`ProductSeoController.php` fields, `SitemapService`/`SitemapUrlRepository`/`SitemapXmlRenderer`): `wp-backend` agent, using this skill's checklist.
- **Catalog relationship data** (WooCommerce upsell/related/cross-sell assignments, category and brand term assignments that drive both the PDP rail and the internal-link graph): `catalog-data` agent — an internal-linking recommendation that resolves to "these two products should be related" is a catalog data change, not a React change.
- **Product copy that affects search relevance in DTB's own client-side catalog search** (name/brand/SKU/description fields ranked by `match-sorter`) is a distinct concern from Google/technical SEO — see `pdp-conversion-specialist`, which owns that and cross-references this skill for the technical-SEO half of a product page.
