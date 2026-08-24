# Drywall Toolbox — Product Summary

Status: derived context. Active implementation and `AGENTS.md` outrank this file.

Drywall Toolbox is a contractor-focused ecommerce and service-operations platform for professional drywall tools and parts. It combines product/variation discovery, compatible-part lookup, schematics, repair intake/tracking, returns, customer accounts/orders, fulfillment visibility, accounting projection, integrations/marketplaces, SEO/media/catalog tooling and operator administration.

Customer priorities are accurate product/compatibility identity, trustworthy availability, efficient checkout, clear service workflows and post-purchase visibility.

Checkout is **not embedded in the React SPA**. The storefront hands the authoritative WooCommerce cart/session to a full-document native WooCommerce Checkout Block runtime, where the active payment provider owns payment UI and payment lifecycle. React `/checkout` is a handoff surface only.

For mutable routes, providers, modules and feature state, inspect active source rather than this summary.
