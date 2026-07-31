# DTB Visual UI Designer

## Purpose

The DTB Visual UI Designer is a wp-admin subsystem that lets authorized
operators configure the **presentation and approved layout** of the React
storefront — design tokens, bounded visual properties, responsive overrides,
and approved reordering — without editing React components, CSS, PHP
templates, or theme files. It never becomes an alternate checkout, cart,
order, pricing, or business-rule authority, and it never makes WordPress
themes the source of truth for React storefront design.

## Architectural ownership

| Owner | Responsibility |
| --- | --- |
| `frontend/` | Rendering, routing, components, accessibility, client state, applying resolved design configuration. Sole customer-facing rendering authority. |
| `mu-plugins/dtb-visual-designer/` | Registry, schemas, persistence, drafts, revisions, publish/rollback, preview authorization, audit, REST API, sanitization, server-side policy. |
| WooCommerce / `dtb-commerce` / `dtb-order-platform` | Products, cart, checkout sessions, orders, payments, totals, shipping. Never touched by this module. |

The module is a peer of the other MU-plugin modules (`dtb-platform`,
`dtb-commerce`, `dtb-repair-service`, …), loaded last in
`mu-plugins/00-dtb-loader.php` so it can reference surfaces owned by every
earlier module. It reuses the existing composition-root conventions: an
explicit, dependency-ordered `bootstrap.php`, the shared `AdminPageRegistry`
(`dtb_register_admin_page()`), the canonical capability registry
(`dtb-platform/Admin/AdminCapabilities.php`), the shared audit log
(`dtb_audit_log_write()`), and the `dtb/v1` REST namespace.

## Registered-surface model

Nothing is editable by DOM discovery or CSS-selector inference. A surface and
its components must be explicitly registered in PHP
(`Domain/SurfaceRegistry.php`, populated by
`Registrations/SurfaceDefinitions.php`) with a stable id, category, and a
component tree — each component carrying a `kind`
(`structural | content | commerce_critical | presentation`), an editable
property schema, default values, responsive/reorder/visibility capabilities,
and parent/child relationships. Unknown surface, component, or property ids
are always treated as not editable and resolve to repository defaults — this
is what keeps historical revisions readable after a component is renamed or
removed from the registry.

On the frontend, a component opts in to being editable with one explicit
call:

```jsx
const { rootProps, hidden, getValue, getColorVar } =
  useEditableComponent('global-header', 'header-root');
```

(`frontend/src/designer/useEditableComponent.js`). The id pair must match a
PHP registration exactly; there is no other path to "editable." v1 wires this
hook into the **Global Header**, **Global Footer**, and **Homepage Hero** as
the reference implementation
(`frontend/src/components/shell/Header.jsx`,
`frontend/src/components/shell/Footer.jsx`,
`frontend/src/components/ui/HeroSection.jsx`). Every other surface listed
below is real (matched to an actual route/page in `frontend/src/App.jsx`) and
fully editable at the token + registered-property level through the REST API
and editor UI; their deeper component subtrees are registered and ready, but
have not yet had `useEditableComponent` wired into their frontend components.
Extending live selection/preview to another component is additive: add the
hook call on the frontend, matching the id already registered in
`Registrations/SurfaceDefinitions.php`.

### Registered surfaces (v1)

`global-header`, `global-footer`, `home`, `catalog`, `product-detail`,
`cart`, `checkout` (commerce-critical; see below), `order-confirmation`,
`order-tracking`, `account`, `repair-landing`, `repair-intake`,
`calculator-hub` + one surface per calculator, `error-state`.

### Checkout is a special case

`frontend/src/pages/WooNativeCheckout.jsx` is a redirect shim to
WordPress/WooCommerce-hosted checkout, not a React form. The `checkout`
surface is registered `commerce_critical` at the surface level with a
deliberately narrow property schema (only the redirect-transition state) —
this subsystem does not claim authority over WooCommerce's own checkout DOM,
and never will, per the architecture boundary below.

## Design tokens

Token groups (`Registrations/TokenDefinitions.php`) map 1:1 onto CSS custom
properties already defined in `frontend/src/styles/storefront-tokens.css`
(`--dtb-primary`, `--dtb-bg`, `--dtb-radius-*`, `--dtb-header-height`, …). No
parallel token system was introduced. `DesignConfigContext` applies resolved
token values onto `document.documentElement.style` at runtime
(`applyTokensToDocument`), so an operator override only ever changes the
*value* the frontend already reads through that variable name. Component
color properties never store raw hex — they store a `color_ref` (a
registered token id); `useEditableComponent().getColorVar()` resolves that to
`var(--the-css-property)` using the token metadata already present in the
resolved payload.

Additional groups (typography scale, shadows, density, z-index, transitions)
are natural extensions once the frontend exposes matching CSS variables —
register them with `dtb_vd_register_token_group()` rather than inventing a
second mechanism.

## Deterministic resolution

`Application/ConfigResolver.php` (`dtb_vd_resolve_config()`) is the single
place precedence is applied:

```
Repository defaults
→ Published global tokens
→ Published surface overrides
→ Published component overrides
→ Published responsive overrides
→ (preview only) unpublished draft overrides
```

The frontend never re-implements or guesses precedence — it renders exactly
what this function returns, for either the public published endpoint or the
token-scoped preview endpoint.

## Drafts, revisions, publish, rollback

v1 uses one shared editing scope (`draft_key = 'default'`) covering the whole
configuration document (global tokens + every surface/component/responsive
override) — a deliberately simple, fully deterministic model rather than
fragmenting precedence across many per-surface drafts. Concurrent editors are
protected by **optimistic concurrency**: every draft row carries a
`revision_seq` that the client must echo back; a mismatch returns HTTP 409
with the server's current state instead of silently overwriting another
operator's changes (`Application/DraftService.php`,
`Rest/DraftController.php`).

Publishing (`Application/PublishService.php`) creates a new **immutable**
row in `wp_dtb_design_revisions` and atomically repoints
`wp_dtb_design_published` at it; the previous revision is left untouched.
Rollback (`Application/RollbackService.php`) creates a *new* revision copied
from a prior one and repoints publish at it — history is never rewritten or
deleted. Reset-to-default (`dtb_vd_reset_scope()`) supports property,
component, surface, token-group, and full-configuration granularity, all
within the draft.

## Persistence model

Four bounded, versioned tables (`Infrastructure/DesignSchemaInstaller.php`),
installed via the same `dbDelta` + `get_option` version-gate convention used
by `RepairSchemaInstaller.php` and friends — no unbounded serialized option:

- `wp_dtb_design_drafts` — one row per draft scope; `revision_seq` is the
  optimistic-concurrency token.
- `wp_dtb_design_revisions` — immutable; `payload_hash`, `parent_revision_id`,
  `rollback_origin_id`, `affected_surfaces_json` for audit/history.
- `wp_dtb_design_published` — one pointer row per draft scope.
- `wp_dtb_design_preview_sessions` — token **hash** only (the raw token is
  never persisted), scoped to one draft + operator, short-lived, revocable.

Payloads are capped at 256 KB (`DTB_VD_MAX_PAYLOAD_BYTES`) with bounded
string length, array size, and nesting depth
(`dtb_vd_structurally_bounded()`), enforced before any semantic validation.

## Preview authorization

`Application/PreviewAuthService.php` issues a short-lived (1 hour), opaque,
cryptographically random token bound to one draft scope and one operator.
Only its SHA-256 hash is stored. `GET /dtb/v1/design/preview/config`
validates, never caches (`Cache-Control: no-store, private`), and fails
closed — an invalid/expired/revoked token returns 403, never a fallback to
published or default data mislabeled as preview.

The editor embeds the storefront in an iframe with `dtb_preview=1` and the
token in the query string; `DesignConfigProvider` detects that combination
and switches to the preview endpoint instead of the public one. The editor
and the previewed storefront communicate over a small, explicit `postMessage`
contract (`frontend/src/designer/PreviewBridge.js`):

| Direction | Type | Purpose |
| --- | --- | --- |
| Editor → Storefront | `dtb-vd:select-component` | Scroll to + highlight a component |
| Editor → Storefront | `dtb-vd:config-updated` | Re-fetch the draft config |
| Storefront → Editor | `dtb-preview:component-selected` | Operator clicked a component in the live preview |
| Storefront → Editor | `dtb-preview:ready` | First preview render complete |

Every inbound message is type-checked against this allowlist; nothing else is
accepted. Selection overlays, `data-dtb-surface`/`data-dtb-component`
attributes, and this bridge are only active when
`window.top !== window.self` (i.e., actually running inside the editor's
iframe) — normal customer sessions render none of it.

## REST contracts (`dtb/v1`)

| Method | Route | Scope |
| --- | --- | --- |
| GET | `/design/registry` | Operator — full surface/component/token schema |
| GET | `/design/defaults` | Operator — repository-default resolved config |
| GET | `/design/config` | **Public** — resolved published config (ETag, `max-age=60`) |
| GET | `/design/draft` | Operator — current draft + `revisionSeq` |
| PATCH | `/design/draft` | Operator — apply bounded ops/token batch (409 on conflict) |
| POST | `/design/draft/discard` | Operator — reset draft to published |
| POST | `/design/draft/reset` | Operator — reset one property/component/surface/token-group/all |
| POST | `/design/preview/session` | Operator — issue a scoped preview token |
| GET | `/design/preview/config` | Token-scoped — resolved draft config for preview |
| GET | `/design/revisions` | Operator — paginated history |
| GET | `/design/revisions/{id}` | Operator — one immutable revision |
| POST | `/design/publish` | Operator — atomic publish (409 on stale draft) |
| POST | `/design/rollback` | Operator — restore a prior revision as a new publish |
| GET | `/design/export` | Operator — sanitized, portable published config |
| POST | `/design/import` | Operator — validated import into the draft (never published state) |

Every operator route requires the `dtb_manage_visual_designer` capability
(granted to `administrator` and `dtb_technical_admin` in
`dtb-platform/Admin/AdminCapabilities.php`, that file's canonical capability
registry) and an authenticated wp-admin session (cookie + `X-WP-Nonce`, the
same pattern every other DTB admin screen uses via the shared
`window.dtbAdminConfig`). The public config route requires nothing — it
mirrors how other public storefront reads behave.

## Security boundaries

- No arbitrary CSS/HTML/JS/PHP/SQL/shortcodes/selectors/expressions are ever
  accepted — every value is validated against a bounded `type` from
  `Domain/PropertyTypes.php` (`dtb_vd_sanitize_value()`): enum, bounded
  number/spacing, boolean, strict `#hex` color, token reference, WordPress
  media attachment id, text-align/aspect-ratio enums, bounded order index.
- Media fields accept only a validated WordPress attachment id — never a raw
  remote URL.
- Import is always sanitized field-by-field against the live registry and
  always lands in the draft, never published state.
- Preview tokens are hashed at rest, scoped, short-lived, and revocable.
- REST errors never leak stack traces, DB structure, or file paths.

## Schema versioning

`DTB_VD_SCHEMA_VERSION` gates the *shape* of persisted payloads. Registry
changes (new surfaces/components/properties) do not require a bump — the
resolver ignores any stored id absent from the current registry and falls
back to that property's repository default, which is what keeps old
revisions readable after a component is renamed or removed.

## Editor UI

`Admin/DesignerPage.php` registers a `tools`-library wp-admin page
(`dtb-visual-designer`) following the same server-rendered-PHP-shell +
vanilla-JS-progressive-enhancement pattern as every other DTB admin screen
(see `dtb-integrations/Veeqo/Admin/VeeqoAdminPage.php`) — no build step, no
framework, `dtbAdminConfig`/`dtbVisualDesignerConfig` localized the same way.
`Admin/assets/dtb-visual-designer.js` renders a three-pane workspace (surface
navigator + component tree, live preview stage with a device toolbar,
tabbed inspector for properties/tokens/history) styled by
`Admin/assets/dtb-visual-designer.css`, built entirely on the shared
`.dtb-admin` design-token system — no parallel palette.

## Extensibility

Future modules register additional surfaces/components/tokens with the same
functions used here — `dtb_vd_register_surface()`,
`dtb_vd_register_token_group()` — rather than a generic/unbounded hook
mechanism. Frontend components adopt live editing the same way Header/
Footer/Hero did: call `useEditableComponent(surfaceId, componentId)` with an
id pair that matches an existing PHP registration.

## Operator workflow

1. **Tools → Visual Designer** in wp-admin (requires `dtb_manage_visual_designer`).
2. Pick a surface from the navigator; the live preview iframe loads that
   route inside an authorized preview session.
3. Select a component from the tree or directly in the preview; edit its
   properties, or switch to the **Tokens** tab for global values.
4. Switch the device toolbar to author desktop/tablet/mobile overrides.
5. **Publish** to promote the draft to a new immutable revision (visible to
   customers); **Discard** to revert to the last published state; use the
   **History** tab to review or **Restore** any prior revision.
