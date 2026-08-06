# Platform Self-Healing / Idempotent-Repair Audit

Last verified against active source: 2026-07-31.

## Why this exists

A production incident (checkout showing only a flat "Free shipping" rate, no Standard/Express/Overnight) traced back to `dtb_bootstrap_shipping_zones()` (`mu-plugins/dtb-commerce/Shipping/DTBShippingMethod.php`) — a self-healing function that had already been patched four separate times (see `docs/checkout/checkout-ui-architecture.md` Redesign v6–v9) chasing edge cases in when it should or shouldn't repair shipping-zone state. The actual root cause that night wasn't something self-healing could ever have caught: an operator-disabled shipping method instance, a state the self-heal correctly and intentionally never overrides. Investigating that incident prompted a wider audit of the same "run a check-and-repair function on every request, forever" pattern across the mu-plugin backend, on the theory that a pattern which had already needed four hardening passes in one place was worth checking for elsewhere.

## What was found

A repo-wide search for functions hooked to always-fire hooks (`init`, `admin_init`, `woocommerce_init`, `plugins_loaded`) that check-and-repair persisted WordPress/WooCommerce state found:

**Six independent implementations of the same "check role capability, `add_cap()` if missing, on every `init`" pattern**, each covering a different (and overlapping) slice of DTB's own capability set:

1. `dtb_admin_assign_capabilities()` — `dtb-platform/Admin/AdminCapabilities.php` — the intended canonical, map-driven implementation covering every DTB role and capability.
2. `dtb_admin_register_custom_roles()` — same file — creates the DTB custom roles if missing.
3. `dtb_admin_grant_custom_caps_to_site_admins()` — same file, a `user_has_cap` filter (not an `init` action) — a deliberate, distinct safety net granting DTB caps at runtime to any `manage_options` user even if persisted role rows are stale after a deployment or DB restore.
4. `dtb_repair_admin_add_capability()` — `dtb-repair-service/Admin/RepairAdminMenu.php` — re-granted `dtb_manage_repairs` to `administrator` only, a capability already covered by #1.
5. `dtb_oo_bootstrap_capability()` — `dtb-platform/Observability/OrderOperationsKpiService.php` — re-granted `dtb_manage_order_operations` to `administrator` only. This capability was **not** in the canonical registry at all — a real gap, not just a duplicate.
6. `dtb_support_grant_admin_capability()` — `dtb-support/Infrastructure/SupportSchemaInstaller.php` — re-granted a 10-capability subset to `administrator` only, including `dtb_manage_support_automation`, which was also **not** in the canonical registry.

**Well-gated patterns that are not a problem** and were left as-is: `dtb_support_maybe_install_schema()` and `DTB_InventoryIntelligenceSchema::maybe_install()`, both dbDelta schema installers gated by a real version-option check that returns immediately once the version matches — the pattern this audit's fix brings the shipping-zone bootstrap in line with.

**No file documented this as a deliberate architecture.** `AGENTS.md` and `memory-bank/` mention "idempotent" only as a general principle for scripts, queues, and webhook handlers — not as a name for "re-run a repair check on every request forever." The only place the shipping-zone version of this pattern was discussed at all was the ad hoc bug-fix narrative in `docs/checkout/checkout-ui-architecture.md`, which reads as organic firefighting accumulation rather than an intended design.

## What changed

**Capability grants consolidated to one place.** `dtb_manage_order_operations` and `dtb_manage_support_automation` were added to `dtb_admin_all_capabilities()` in `AdminCapabilities.php` (granting them to `administrator`, matching what the removed functions actually did — this is a mechanical consolidation, not a permissions change; no role gained or lost access). The three redundant functions (#4, #5, #6 above) were deleted along with their `init` hooks. `AdminCapabilities.php` gained a header comment directing future capability additions to the canonical map instead of another one-off grant function. The `user_has_cap` filter safety net (#3) was reviewed and deliberately kept — it's a different mechanism (runtime override vs. persisted role rows) solving a different problem (deployment/DB-restore staleness) than the other five, not a duplicate of them.

**Shipping-zone bootstrap rate-limited instead of removed.** The self-healing behavior itself is still needed (zones and methods are live WordPress/WooCommerce state, not something git deploys touch, but still something an operator or a WooCommerce update could disturb) — the problem was running its DB reads (zone list, zone locations, zone methods) on literally every storefront and wp-admin request forever, for a condition that only changes when someone edits shipping settings or this code ships a new bootstrap version. `dtb_bootstrap_shipping_zones()` now:
- runs from a single `init` hook instead of two (`woocommerce_init` + `admin_init`, which did the same job twice);
- gates its actual DB work behind a transient capped at once per hour site-wide, except a version bump (a real code change) always forces an immediate full check, since a transient can't know about a change that happened only in code.

**The one gap self-healing structurally cannot close was made visible instead of papered over.** A disabled DTB method on the US zone is, by design, never auto-re-enabled (respecting an operator's explicit choice is the whole reason `dtb_commerce_zone_has_shipping_method()` counts a disabled instance as "present"). Auto-repair cannot both respect an intentional disable and safely guess whether a given disable was intentional — so instead of adding a fifth patch attempting to thread that needle, `dtb_commerce_render_shipping_method_disabled_notice()` surfaces the state as a wp-admin notice (via the existing, previously-unused `DTB_AdminNoticeService`) whenever it's true, reading a flag the rate-limited bootstrap pass already computed rather than querying the zone again on every admin page load.

## Review fixes (same PR)

Automated review (CodeRabbit) caught two real correctness gaps in the rate-limiting change before merge, both fixed in place rather than accepted as known issues:

- **Notice registration race.** `dtb_commerce_render_shipping_method_disabled_notice()` was registered on `admin_notices` at the default priority, but it calls `DTB_AdminNoticeService::add_error()`, which itself registers *another* default-priority `admin_notices` callback. Registering a new callback for a priority WordPress is already iterating on the same hook firing can be silently skipped for that page load — the notice could intermittently just not appear. Fixed by registering at priority 1, so its `add_error()` call always lands before priority 10 is reached.
- **Non-atomic rate-limit gate.** The original `get_transient()`/`set_transient()` check is not atomic: two requests arriving after the transient expired (or on first-ever load) could both pass the check and both run the repair concurrently. WooCommerce's `WC_Shipping_Zone::add_shipping_method()` has no built-in duplicate guard — a race here could leave a zone with two DTB method instances. Fixed with `add_option()` as a lock: it's atomic (a single INSERT against the unique key on `option_name`, unlike `update_option()`/transients) and is WordPress's standard idiom for a lightweight mutex — not a bespoke locking mechanism. The lock self-reclaims after 60 seconds so a request that crashed mid-repair can't wedge every future attempt. The transient stays in place as a cheap, non-critical fast-path skip for the common case; the lock is what actually prevents a duplicate repair.

## What was deliberately not done

No behavior changed for how self-healing decides *whether* to repair a zone — only how often it checks, and that a disabled-but-present method is now visible instead of silent. No new self-healing was added anywhere. No attempt was made to build a generic "self-healing framework" — six near-duplicate single-purpose functions collapsed into the one that was already designed to be the canonical source, and the shipping-zone function kept its existing shape, only gaining a rate limit and a notice. This matches the actual ask: reduce accumulated complexity, don't design something new the codebase has never needed before.

## Validation

Before sign-off: confirm every DTB custom role and `administrator` still has exactly the capabilities they had before this change (`dtb_manage_repairs`, `dtb_manage_order_operations`, `dtb_manage_support_automation` in particular — the three capabilities the removed functions granted); confirm Order Operations and Repairs admin screens are still reachable by an administrator; confirm a fresh WordPress environment (no `dtb_shipping_zones_bootstrapped` option set) still gets the United States zone and DTB method created on first load; confirm disabling the DTB method on the United States zone produces the wp-admin notice within an hour (or immediately after clearing the `dtb_shipping_zone_bootstrap_checked` transient) and that re-enabling it clears the notice on the next check.
