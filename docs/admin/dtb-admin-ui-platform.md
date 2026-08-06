# DTB wp-admin UI Platform

## Ownership

BrikPanel owns global WordPress administrator chrome, navigation, top bar, global typography, appearance, and generic WordPress control presentation.

`dtb-platform/Admin` owns the shared Drywall Toolbox component and asset contract. Each bounded MU-plugin module owns only the application behavior and selectors scoped to its registered DTB screen.

The required cascade is:

```text
WordPress admin foundation
→ BrikPanel global theme
→ DTB BrikPanel-native component layer
→ page-scoped module components
```

DTB code must not restyle `body`, `#adminmenu`, `#wpadminbar`, third-party plugin pages, or generic WordPress controls outside a DTB application root.

## BrikPanel source audit

The component layer is based on the public BrikPanel repository:

```text
niyht/Brikpanel-Dashboard-Theme-Custom-Admin-Panel-Reports-Analytics-for-WooCommerce
```

The audited source establishes the component grammar used by DTB:

- page background `#f1f1f1`;
- card background `#ffffff`;
- primary text `#303030`;
- secondary text `#616161`;
- muted text `#8a8a8a`;
- border `#e3e3e3`;
- neutral primary action `#303030` with `#1a1a1a` hover;
- success `#1a8917` and error `#d72c0d`;
- compact `0.8125rem` controls;
- `0.5rem` controls and `0.75rem` card radii;
- restrained inset button shadows;
- hover background `#f7f7f7`;
- WordPress mobile breakpoint at `782px`;
- explicit RTL mirroring for tables, selects, drawers, toasts, directional borders, and alignment.

Drywall Toolbox blue and amber are reserved as bounded brand accents. They do not replace BrikPanel's neutral global control grammar.

## Asset policy

`AdminAssets.php` performs normal registry-driven enqueueing. `AdminAssetPolicy.php` runs at the final enqueue priority and enforces the ownership contract.

The policy:

- disables the historical source-URL purge that removed all `/mu-plugins/dtb-*` styles;
- removes only exact obsolete global-theme handles from a bounded denylist;
- preserves `dtb-admin` and page-declared module styles;
- re-enqueues registered required handles when necessary;
- loads `dtb-brikpanel-components.css` after shared and module styles;
- loads `dtb-brikpanel-components-rtl.css` only when WordPress reports `is_rtl()`;
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

## Shared component contract

The BrikPanel-native layer recognizes established DTB roots and shared component aliases for:

- page frames and headers;
- cards, panels, and KPI grids;
- primary and secondary buttons;
- text, search, numeric, URL, password, select, and textarea controls;
- tabs;
- responsive table containers and `widefat` tables inside DTB roots;
- status badges and semantic states;
- notices;
- empty and loading states;
- drawers and toasts in RTL mode;
- keyboard focus and reduced motion.

Module styles may extend the shared primitives, but must not recreate an independent global theme.

## RTL

RTL is a first-class contract, not an afterthought. The platform loads a separate RTL adapter only when `is_rtl()` is true. It mirrors directional controls while leaving non-directional dimensions and semantic colors unchanged.

## Diagnostics

On a DTB screen, the browser receives:

```text
window.dtbAdminAssetDiagnostics
```

It contains:

- current DTB page slug;
- declared style handles;
- successfully enqueued style handles;
- missing style handles;
- whether the BrikPanel component layer loaded;
- whether RTL is active and whether its adapter loaded.

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
6. Validate an RTL locale or forced RTL staging session.
7. Confirm BrikPanel sidebar, top bar, typography, and global shell remain unchanged.
8. Confirm a third-party wp-admin page receives no DTB component or module styles.
9. Inspect `window.dtbAdminAssetDiagnostics` and require an empty `missing` array.
10. Confirm reduced-motion behavior and keyboard focus visibility.

## Deployment and rollback

Deployment is operator-managed through FileZilla from reviewed merged canonical source. Transfer the complete dependency-consistent platform change set after independent file and database backups. Clear SiteGround caches and PHP OPcache, then run runtime acceptance checks.

Rollback restores the previous reviewed `dtb-platform/Admin` files as one set. Do not delete WooCommerce records, HPOS data, event-ledger records, Action Scheduler history, OAuth state, mapping options, or integration transactions.
