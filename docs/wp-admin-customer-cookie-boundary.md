# WP-admin customer cookie boundary

## Problem

The same-origin storefront authentication flow establishes a native WordPress customer cookie for WooCommerce checkout continuity. When that customer later visits `wp-admin`, WordPress can treat the browser as already authenticated as the customer and prevent the administrator login form from being reached cleanly.

## Ownership

- DTB JWT: storefront customer identity.
- Native WordPress cookies: wp-admin identity and WooCommerce-native session continuity.
- WooCommerce: customer, cart, checkout, and order system of record.

## Resolution

`AdminLoginIdentityBoundary.php` runs at `login_init` before WordPress processes an administrator login request. When the current native WordPress cookie belongs to a non-privileged user, it expires only the native WordPress authentication cookies, clears the current request's native cookie state, and leaves the HttpOnly `dtb_auth` cookie untouched.

This permits the browser to present the administrator login form and replace the native WordPress identity with an authorized administrator account. Existing privileged-session conflict handling remains fail-closed for storefront operations.

## Security properties

- Does not expose or log JWT material.
- Does not weaken wp-admin capability checks.
- Does not permit a customer account to enter wp-admin.
- Does not clear an existing privileged WordPress session.
- Does not alter WooCommerce orders, carts, payments, refunds, or integration queues.

## Acceptance checks

1. Log into the React storefront as a customer.
2. Confirm the storefront account and cart remain available.
3. Visit `/wp-admin` and confirm WordPress presents the administrator login form rather than treating the customer as the wp-admin identity.
4. Log in with an administrator account and confirm wp-admin loads normally.
5. Confirm the customer JWT remains HttpOnly and no token material appears in responses or logs.
6. Confirm storefront auth continues to fail closed when a privileged native WordPress session conflicts with customer checkout identity.

## Rollback

Restore the previous `dtb-platform/bootstrap.php`, remove `Auth/AdminLoginIdentityBoundary.php`, clear SiteGround caches and PHP OPcache, and repeat the acceptance checks.
