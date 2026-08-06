# DTB Cache Tools

## Ownership

DTB MU Plugins own cache invalidation orchestration, authorization, audit logging, serialization, and provider adapter contracts. WordPress owns transients, rewrite rules, and the object-cache API. WooCommerce owns its cache helpers and transient-version invalidation. SiteGround owns Dynamic Cache, CDN, and hosting policy. PHP owns OPcache availability and restrictions. The React storefront owns browser-side cache consumers.

## Canonical control plane

`Drywall Toolbox > Cache Tools` is the only DTB cache execution surface. It owns the nonce contract, capability check, target selection, AJAX transport, result presentation, and full-system action.

The wp-admin toolbar is navigation only. It must not execute a purge, maintain a second nonce, create result transients, or hide provider-owned controls.

The retired `Tools > DTB Cache` slug is retained only as a permission-checked redirect for existing bookmarks. It registers no menu, form, mutation handler, or cache logic.

Stable procedural functions such as `dtb_invalidate_product_cache()` and `dtb_ops_cache_flush()` are compatibility adapters only. They delegate to `DTB_CacheInvalidationService`; they must not contain fallback SQL. REST cache-header compatibility functions delegate to `DTB_CacheHeaders`; they must not duplicate route policy.

## Canonical workflow

A purge run:

1. Verifies `dtb_manage_cache_tools` and the WordPress nonce at the transport boundary.
2. Acquires `DTB_CachePurgeLock` to prevent overlapping destructive runs.
3. Expands `all` into the allowlisted target registry.
4. Executes each target independently and records duration and status.
5. Reports unsupported provider-owned layers as `skipped`, never as success.
6. Writes a redacted audit event with run ID, actor ID, targets, and summary.
7. Releases the lock in a `finally` block.

## Full system clean and refresh targets

- DTB application transients and bounded DTB health/operations caches.
- WordPress site and network transients.
- WooCommerce supported cache helpers and cache-version invalidation.
- WordPress runtime or persistent object cache through `wp_cache_flush()`.
- WordPress rewrite rules without forcing an `.htaccess` write.
- PHP OPcache when exposed and permitted by the host.
- SiteGround Dynamic/File cache through an active supported integration.
- Frontend refresh epoch used by storefront cache consumers.
- SiteGround CDN through an explicit provider adapter, or a truthful skipped result.

## Retained non-duplicates

The following are intentionally separate and must not be folded into DTB purge orchestration:

- WooCommerce core cache invalidation and system-status tools, which are vendor-owned implementation.
- Web-server and `.htaccess` cache-control policy, which controls response freshness rather than executing a purge.
- Read-through cache helpers, which own cache population but delegate invalidation.
- Provider dashboards and SiteGround Site Tools, which remain authoritative for host policy and unsupported CDN actions.

## Frontend boundary

The backend must not remotely delete arbitrary browser local storage, authentication, carts, checkout sessions, or customer state. The frontend refresh epoch is the safe contract: storefront code may compare its last-seen epoch and delete only explicitly DTB-owned Cache Storage entries or query caches. Customer-owned state must remain intact.

## Provider adapter contract

CDN integrations register through the `dtb_cache_purge_cdn` filter and return strict `true` only after the provider confirms the purge request. Provider credentials must remain in host configuration or a dedicated secret manager and must never be logged or stored by Cache Tools.

## Operational interpretation

- `ok`: the owning API confirmed or completed the action.
- `skipped`: the layer is unavailable or host-owned and no supported adapter exists.
- `failed`: the owning API or storage operation reported failure or threw an exception.

A run with skipped targets is a partial success and requires the operator to follow the displayed host recovery path.
