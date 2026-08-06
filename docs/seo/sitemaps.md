# DTB Sitemap Service

## Ownership

DTB MU Plugins own sitemap routing, URL selection, XML rendering, cache invalidation, and the sitemap contract exposed to search engines. The React storefront owns customer-facing route shapes. WordPress and WooCommerce remain the systems of record for published products and taxonomies.

The canonical public entry point is:

`/sitemap.xml`

The service disables the WordPress core sitemap provider to prevent duplicate sitemap authority.

## Sitemap topology

The index emits only child sitemaps that currently contain eligible URLs:

- `/sitemaps/static-1.xml`
- `/sitemaps/products-{page}.xml`
- `/sitemaps/product-categories-{page}.xml`
- `/sitemaps/brands-{page}.xml` when a supported brand taxonomy is registered

Each dynamic child is bounded to 1,000 records. Child pagination is deterministic by product ID or term ID.

## Canonical storefront routes

The service maps records to the active React route contract:

- Products: `/products/{product-slug}`
- Product categories: `/category/{term-slug}`
- Brands: `/products/brands/{term-slug}`
- Static routes: the explicit public allowlist in `DTB_SitemapUrlRepository::static_routes()`

Customer, checkout, cart, order, account, tracking, preview, and operator routes are intentionally excluded.

## Product eligibility

Only published WooCommerce products are included. Products assigned the WooCommerce `exclude-from-search` visibility term are excluded. Variations are not emitted as independent URLs; the canonical parent product route remains authoritative.

## Brand taxonomy detection

The repository detects the first registered taxonomy in this allowlist:

1. `product_brand`
2. `pwb-brand`
3. `pa_brand`

No arbitrary taxonomy name is accepted from a request.

## Routing and rewrite lifecycle

The service registers explicit rewrite rules for the index and paginated child files. A versioned option (`dtb_sitemap_rewrite_version`) causes one soft rewrite flush after a route-contract deployment. Rewrite rules are not flushed on every request.

Unknown sitemap types and out-of-range pages return HTTP 404 with an XML error body.

## Security and response policy

Sitemap endpoints are intentionally public read-only resources. They expose only published public URLs and accept no writable fields.

Generated URLs are:

- created from `home_url()` so staging and production domains remain environment-owned;
- restricted to HTTP or HTTPS;
- validated against the configured home host;
- XML escaped before output.

Responses include XML content type, ETag support, shared-cache directives, `Vary: Accept-Encoding`, and `X-Robots-Tag: noindex, follow` for the sitemap documents themselves.

## Cache and invalidation

Generated XML is cached in WordPress transients for one hour. Cache keys include:

- the configured site URL;
- sitemap type;
- page number;
- sitemap generation.

The generation option (`dtb_sitemap_generation`) is advanced once per request when a relevant product or taxonomy mutation occurs. Old generations expire naturally without unbounded delete scans.

The full Cache Tools workflow clears WordPress transient storage and therefore removes generated sitemap XML. Product and operations caches remain separate authorities.

## Robots integration

The WordPress virtual `robots.txt` filter removes duplicate `Sitemap:` declarations and appends the environment-derived `/sitemap.xml` URL.

The React build also contains `frontend/public/robots.txt` with the `__DTB_SITE_URL__` placeholder. The build/deployment process must replace that placeholder with the active environment URL. A physical `robots.txt` takes precedence over WordPress virtual robots output.

## Deployment validation

After deploying:

1. Visit `/sitemap.xml` and confirm HTTP 200 with a `<sitemapindex>` document.
2. Open every child listed by the index and confirm HTTP 200 with `<urlset>`.
3. Confirm private routes are absent.
4. Confirm product URLs use `/products/{slug}` and resolve through the storefront.
5. Confirm `/robots.txt` advertises exactly one environment-correct sitemap URL.
6. Run a product update and verify a subsequent sitemap request reflects the change.
7. Submit only `/sitemap.xml` to Google Search Console.

## Operational limits

The service does not generate image, video, news, multilingual, or alternate-language sitemap extensions. Those should be added only when their canonical data ownership and frontend rendering contracts are established.
