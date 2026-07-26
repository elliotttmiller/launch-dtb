# MU-plugin recovery and production wiring audit

Date: 2026-07-12

## Scope

Compared the canonical production source tree:

`drywalltoolbox/wp/wp-content/mu-plugins/`

against the previously working snapshot supplied as:

`drywalltoolbox/wp/wp-content/mu-plugins.bak.cp/`

The extra archive/extraction directory level was ignored. The comparison used
paths relative to the actual MU-plugin roots.

## Conclusion

The current `00-dtb-loader.php` is byte-identical to the working snapshot and
retains the required 11-module load order. The current module bootstraps are not
missing the older behavior; they extend it with the newer canonical checkout,
payment, shipping, inventory, media, security, and observability boundaries.

The principal recovery defect was deployment convergence. The previous remote
mirror process trusted modification times, allowing archive extraction timestamps
or manual server edits to preserve stale PHP files and produce a mixed runtime.
The process also did not remove obsolete top-level MU-plugins, which WordPress
auto-loads independently of the DTB loader.

The correct recovery is therefore to deploy the reviewed current tree as the
authoritative MU-plugin tree, not to restore the backup wholesale.

## Confirmed live security defect

On 2026-07-12, a read-only request to
`https://drywalltoolbox.com/wp-json/dtb/v1/config` returned HTTP 200 with the
fields `wc_auth_user` and `wc_auth_pass` and without the current
`wc_credentials_exposed: false` marker. Credential values were not displayed or
retained during this audit.

This proves that the live server is executing the older public proxy route
without the current `LegacyCommerceRouteHardening.php` override. Treat the
published WooCommerce/application-password credential as compromised. Deploy
the converged current MU-plugin tree first, verify that the public route is
credential-free, then revoke and rotate the exposed credential. Rotation before
the corrected server code is active would publish the replacement credential
through the same route.

## Cross-reference results

- Current tree after recovery controls: 616 total files, including 564 PHP files.
- Working snapshot: 598 total files.
- Byte-identical relative paths: 327.
- Changed relative paths: 269. Most are current production hardening,
  optimization, canonicalization, or line-level evolution rather than missing
  modules.
- Current-only files before recovery controls: 19. The thin security recovery
  entrypoint added by this audit increases the final current-only count to 20.
- Backup-only files: 2.
- Loader: byte-identical between trees.
- All 11 current bootstraps exist in the expected loader order.
- All 367 directly declared local bootstrap includes resolve.
- All 128 detected root-relative bootstrap includes resolve.
- All 564 final current PHP files pass PHP 8.4 syntax validation.

## Current production behavior retained

The following current-only behavior remains canonical and must not be replaced
with its older root-level implementations:

### Checkout and order write boundary

- `dtb-order-platform/Application/CheckoutService.php`
- `dtb-order-platform/Infrastructure/CheckoutSessionRepository.php`
- `dtb-order-platform/Infrastructure/OrderWriteBoundary.php`
- `dtb-order-platform/Payment/CheckoutDuplicateGuard.php`
- `dtb-order-platform/Payment/CheckoutHandoffGuard.php`
- `dtb-order-platform/Payment/CheckoutPaymentLifecycle.php`

These preserve session idempotency, duplicate containment, the authoritative
order creation boundary, and payment-driven lifecycle projection.

### Native order-pay and payment safety

- `dtb-commerce/Payment/CustomerAssociation.php`
- `dtb-commerce/Payment/OrderPayHardening.php`
- `dtb-commerce/Payment/PaymentBnplCartFinalization.php`
- `dtb-commerce/Payment/PaymentRuntime.php`
- `dtb-commerce/Payment/PaymentStatusGuard.php`
- `dtb-commerce/Payment/UnpaidOrderPayGuard.php`

The existing top-level payment files are deliberately thin compatibility
delegators using `require_once`; canonical behavior lives in `dtb-commerce`.

### Commerce, integration, media, and security boundaries

- `dtb-commerce/Shipping/DTBShippingMethod.php` owns DTB checkout shipping
  policy; it is not a live Veeqo carrier-rating adapter.
- `dtb-integrations/Veeqo/VeeqoInventoryBoundary.php` preserves Veeqo inventory
  authority.
- `dtb-integrations/OperationalPipeline/VeeqoWebhookPipelineController.php`
  replaces the older Veeqo webhook facade with signature validation, replay
  control, quarantine, asynchronous `dtb-orders` processing, monotonic status
  projection, and event-ledger idempotency.
- `dtb-media/Services/VariationGalleryResolver.php` preserves the current
  canonical variation gallery lookup.
- `dtb-platform/Security/LegacyCommerceRouteHardening.php` prevents the legacy
  public config route from returning WooCommerce credentials, retires raw
  browser order creation, and binds legacy customer reads to authenticated
  ownership.
- `dtb-platform/Observability/FriendlyLogWriter.php` preserves current
  operational logging behavior.

## Backup-only files

### `dtb-integrations/Veeqo/VeeqoWebhookController.php`

This was only a compatibility facade forwarding to
`dtb_veeqo_route_webhook_order()`. The current operational-pipeline webhook
controller is directly loaded by `dtb-integrations/bootstrap.php`; no current
code references the removed facade symbols. Restoring it would not restore
missing functionality and would reintroduce a stale integration surface.

### `zz-dtb-woocommerce-payments-method-surface.php`

This file explicitly performed no runtime mutation. It documented that payment
method availability belongs to official WooPayments settings. Its absence does
not remove a hook, route, filter, gateway, or payment method.

## Implemented recovery controls

1. Added `scripts/smoke-dtb-mu-modules.ps1` to validate:
   - exact loader order;
   - all module bootstraps;
   - critical checkout/payment/integration/security wiring;
   - literal bootstrap dependencies;
   - Veeqo signature and queue contracts;
   - the credential-free config-route override;
   - syntax of every MU-plugin PHP file.
2. Added the thin root recovery entrypoint
   `dtb-legacy-commerce-route-hardening.php`, which delegates to the canonical
   platform security implementation. This allows WordPress's normal top-level
   MU-plugin loading to restore the boundary even if a server temporarily has a
   mismatched platform bootstrap; it does not duplicate business logic.
3. CI validates composition before building a payload.
4. Payload shape checks require the loader and critical canonical files.
5. Production recovery no longer relies on server modification times.
6. The reviewed complete MU-plugin subtree is transferred as one dependency-consistent
   unit so stale top-level auto-loaded files can be identified and removed explicitly.
7. Selective replacement of isolated bootstrap or admin asset files is prohibited
   when module composition has changed.
8. Production smoke validation requires the hardened public config response and
   rejects WooCommerce credential fields.
9. Browser credential secrets were removed from the frontend build step.
10. Rewards remains launch-gated and is built disabled.

## Required operational sequence

1. Review and merge the recovery changes through normal pull-request controls.
2. Build and validate the complete bounded production overlay. A selective upload
   of individual PHP files is not sufficient to repair an unknown mixed MU-plugin tree.
3. Create independent SiteGround file and database backups.
4. Transfer the complete reviewed MU-plugin change set through FileZilla.
5. Remove only the explicitly identified stale top-level MU-plugin files after
   verifying they are absent from canonical source and present in the backup.
6. Confirm `/wp-json/dtb/v1/config` contains no `wc_auth_user` or `wc_auth_pass`
   fields, then revoke and rotate the exposed WooCommerce/application-password
   credential and update only its server-side configuration.
7. In an authenticated WordPress session, verify Command Center/System Manager,
   checkout session-confirm-finalize, keyed order-pay, Action Scheduler group
   `dtb-orders`, Veeqo integration state, customer order ownership, repairs,
   returns, and support workbenches.
8. Review PHP and DTB operational logs for missing-file notices, fatal errors,
   duplicate order side effects, webhook signature failures, and retry
   amplification.
9. If production validation fails, restore the independently verified file backup
   before continuing. Database and external integration compensation remain
   separate operator actions.

No deployment was performed as part of this audit.
