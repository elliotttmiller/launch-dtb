# DTB wp-admin UI Platform

## Ownership

BrikPanel owns global WordPress administrator chrome, navigation, top bar, global typography, appearance, and generic WordPress control presentation.

`dtb-platform/Admin` owns the shared Drywall Toolbox component and asset contract. Each bounded MU-plugin module owns only the component styles and behavior scoped to its registered DTB screen.

The required cascade is:

```text
WordPress admin foundation
→ BrikPanel global theme
→ DTB shared component layer
→ page-scoped module components
```

DTB code must not restyle `body`, `#adminmenu`, `#wpadminbar`, third-party plugin pages, or generic WordPress tables outside a DTB application root.

## Asset policy

`AdminAssets.php` performs normal registry-driven enqueueing. `AdminAssetPolicy.php` runs at the final enqueue priority and enforces the ownership contract.

The policy:

- disables the historical source-URL purge that removed all `/mu-plugins/dtb-*` styles;
- removes only exact obsolete global-theme handles from a bounded denylist;
- preserves `dtb-admin` and page-declared module styles;
- re-enqueues a registered required handle if another component dequeued it earlier;
- adds the scoped BrikPanel token bridge after shared and module component styles;
- records redacted per-screen diagnostics without exposing filesystem paths or server configuration.

Source URL matching, wildcard handle deletion, and global DTB stylesheet removal are prohibited.

## Page registration contract

Registered pages declare module assets through `AdminPageRegistry` metadata:

```php
[
    'slug'   => 'dtb-example',
    'assets' => [
        'css' => [
            [
                'id'   => 'dtb-example-admin',
                'dir'  => $asset_directory,
                'url'  => $asset_url,
                'file' => 'example-admin.css',
            ],
        ],
        'js' => [
            [
                'id'   => 'dtb-example-admin',
                'dir'  => $asset_directory,
                'url'  => $asset_url,
                'file' => 'example-admin.js',
            ],
        ],
    ],
]
```

Asset IDs must be stable and unique. Asset files must be canonical repository files. Versions are derived from `filemtime()` when present. Missing declared styles are reported by handle only.

## BrikPanel bridge

`dtb-brikpanel-bridge.css` maps available BrikPanel custom properties into DTB component tokens with bounded fallbacks. It is scoped to:

```text
body.dtb-admin-screen.dtb-brikpanel-components
```

and known DTB application roots. The bridge supplies consistent surfaces, borders, text, primary actions, focus treatment, table overflow, responsive behavior, and reduced-motion handling without taking ownership of global wp-admin chrome.

Module-specific integration colors remain secondary accents. For example, QuickBooks green represents QuickBooks connection and verification state while global primary actions remain aligned with DTB/BrikPanel styling.

## Diagnostics

On a DTB screen, the browser receives a redacted diagnostic object:

```text
window.dtbAdminAssetDiagnostics
```

It contains:

- current DTB page slug;
- declared required style handles;
- missing style handles;
- whether the BrikPanel component bridge was enqueued.

Missing declarations are also written through `DTB_Logger` using handle names only.

## Security and integrity

- Assets load only on registered or migrated `dtb-*` pages.
- No credentials, tokens, server paths, or configuration values are exposed.
- The platform does not alter capabilities, nonces, REST permissions, order ownership, queue behavior, or integration authority.
- CSS remains scoped and must not leak into WordPress core or third-party screens.
- Remote deployment and transport logic are prohibited from this layer.

## Validation

Before deployment:

1. Run PHP lint on `AdminAssetPolicy.php` and `bootstrap.php`.
2. Confirm every changed JavaScript file passes `node --check`.
3. Confirm DTB shared and module styles return HTTP 200 and remain enqueued.
4. Validate Veeqo, Command Center, QuickBooks, Orders, Repairs, Returns, Marketplace, and System Manager.
5. Validate one table-heavy and one form-heavy page at desktop, tablet, and mobile widths.
6. Confirm BrikPanel sidebar, top bar, typography, and global shell remain unchanged.
7. Confirm a third-party wp-admin page receives no DTB component bridge or module styles.
8. Inspect `window.dtbAdminAssetDiagnostics` and require an empty `missing` array.
9. Confirm reduced-motion behavior and keyboard focus visibility.

## Deployment and rollback

Deployment is operator-managed through FileZilla from reviewed merged canonical source. Transfer the complete dependency-consistent platform and module change set after independent file and database backups. Clear SiteGround caches and PHP OPcache, then run runtime acceptance checks.

Rollback restores the previous reviewed `dtb-platform/Admin` and changed module files as one set. Do not delete WooCommerce records, HPOS data, event-ledger records, Action Scheduler history, OAuth state, mapping options, or integration transactions.
