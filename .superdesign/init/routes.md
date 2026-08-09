# Routes

Router source: `frontend/src/App.jsx`

| Path | Component | Layout |
|---|---|---|
| `/` | `frontend/src/pages/Home.jsx` | shared storefront header/footer |
| `/products` and catalog families | catalog page components under `frontend/src/pages/` | shared storefront shell |
| `/parts` | parts page | shared storefront shell |
| `/schematics` | schematics page | shared storefront shell |
| `/repairs` | repair landing | shared storefront shell |
| `/calculators` | calculators page | shared storefront shell |
| `/cart` | React cart | shared storefront shell |
| `/checkout` | native WooCommerce handoff | route-level handoff |

The full route configuration is canonical in `frontend/src/App.jsx`; line 233 maps `/` to `Home`.
