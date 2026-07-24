# Repair Shipping Quote Contract

Last verified against source: 2026-07-24.

## Authority

`dtb-repair-service` owns repair intake shipping quotes and submission-time shipping validation.

Repair shipping is independent from the WooCommerce storefront cart/session. The repair form must not use `POST /dtb/v1/veeqo/shipping-rates` for repair intake; that compatibility endpoint belongs to checkout/cart shipping policy and requires an authoritative WooCommerce cart.

Veeqo remains the fulfillment/shipment execution authority after the repair/order lifecycle reaches fulfillment. The repair quote endpoint does not perform live Veeqo carrier rating.

## Public quote route

```text
POST /wp-json/dtb/v1/repairs/shipping-quote
```

Request body:

```json
{
  "destination": {
    "address": "14725 31st Ave North",
    "city": "Plymouth",
    "state": "MN",
    "zip": "55447",
    "country": "US"
  }
}
```

The endpoint is public/read-safe by design. It performs bounded local calculation only, persists no state, exposes no credentials, makes no external calls, and returns `Cache-Control: no-store`.

The launch policy uses a server-owned 5 lb repair return-shipment profile. Browser-supplied item prices, weights, categories, or totals are non-authoritative and ignored for pricing.

Response rates use stable IDs such as:

```text
repair_standard
repair_express
repair_overnight
repair_intl_standard
repair_intl_express
repair_pickup
```

## Submission trust boundary

`POST /wp-json/dtb/v1/repairs/submit` recalculates the repair shipping quote before persistence.

The browser may submit a selected `shipping_rate_id`, but submitted `shipping_rate_name` and `shipping_rate_price` are never authoritative. The server:

1. validates the return address;
2. recomputes the current repair shipping policy;
3. verifies the selected rate ID exists in that quote;
4. overwrites the submitted name and price with the server-owned values;
5. persists only the validated selection.

Invalid or stale selections fail closed and must be refreshed before submission.

## Frontend wiring

New server access is owned by:

```text
frontend/src/api/repairShipping.js
```

The legacy `frontend/src/services/veeqo.js#getShippingRates()` method remains only as a compatibility delegate for the existing repair form and now calls the repair-owned API. It no longer calls the checkout/cart shipping endpoint.

## Validation

Targeted checks:

```powershell
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Services/RepairShippingQuoteService.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Rest/RepairShippingQuoteController.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/Rest/SubmitRepairController.php
php -l drywalltoolbox/wp/wp-content/mu-plugins/dtb-repair-service/bootstrap.php

.\scripts\smoke-dtb-mu-modules.ps1

cd frontend
npm ci --include=dev
npm run lint
npm run build
```

Runtime negative checks should confirm incomplete addresses return `422`, unknown shipping rate IDs are rejected on submission, and repair quotes work with an empty WooCommerce storefront cart.
