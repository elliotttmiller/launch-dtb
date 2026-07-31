# Route map

Router: React Router in `frontend/src/App.jsx`.

| URL | Component | Shell |
| --- | --- | --- |
| `/` | `pages/Home.jsx` | global Header/Footer |
| `/products` | `pages/Products.jsx` | global Header/Footer |
| `/products/:slug` | `pages/ProductDetailPage.jsx` | global Header/Footer |
| `/products/:slug/variations/:variationId` | `pages/ProductDetailPage.jsx` | global Header/Footer |
| `/parts` | `pages/Parts.jsx` | global Header/Footer |
| `/category/:slug` | `pages/CategoryPage.jsx` | global Header/Footer |
| `/schematics` | `pages/Schematics.jsx` | global Header/Footer |
| `/repairs` | `pages/Repairs.jsx` | global Header/Footer |
| `/repairs/packages` | `pages/RepairPackages.jsx` | global Header/Footer |
| `/calculators` | `pages/Calculators.jsx` | global Header/Footer |
| `/cart` | `pages/Cart.jsx` | global Header/Footer |
| `/checkout` | native-checkout handoff | WooCommerce authority |

Product detail is the target route for this redesign. It loads the catalog product, resolves variations, and delegates the rendered purchase surface to `components/product/ProductDetail.jsx`.
