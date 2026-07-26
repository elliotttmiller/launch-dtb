# Frontend Typography Contract

## Authority

Nunito is the only customer-facing UI typeface for Drywall Toolbox.

The React storefront owns typography through:

- `frontend/index.html` — non-blocking Google Fonts loading for static/webpack documents
- `drywalltoolbox/wp/wp-content/themes/drywall-toolbox/index.php` — Google Fonts loading for the WordPress-hosted SPA shell
- `frontend/src/styles/global-typography.css` — final cascade authority for all React-rendered text and controls
- `frontend/src/main.jsx` — imports the typography authority after all route/component styles

`global-typography.css` intentionally preserves legacy variable names such as `--font-main`, `--font-sans`, `--font-mono`, and `--dtb-global-font-sans`, but all aliases resolve to Nunito. New customer-facing code should use `--dtb-font-sans`, `--dtb-font-display`, or inherited typography rather than introducing another font stack.

## Native checkout

The WooCommerce Checkout Block is rendered outside the React document. Its template therefore loads Nunito independently in:

- `drywalltoolbox/wp/wp-content/themes/drywall-toolbox/templates/checkout/native-checkout.php`

The template attaches the final font rule to the last checkout stylesheet so WooCommerce controls inherit Nunito without changing checkout ownership or behavior.

Stripe-hosted payment fields are isolated from page CSS. Their supported Stripe Appearance configuration specifies Nunito in:

- `drywalltoolbox/wp/wp-content/mu-plugins/dtb-commerce/Payment/OfficialStripeNativeCheckout.php`

The Stripe appearance version must be incremented whenever provider-hosted typography changes so the cached appearance is refreshed safely.

## Standalone error documents

Generated static error pages load Nunito through `frontend/error-page.html`, while `frontend/public/errors/error.css` owns their typography and fallback stack.

## Styling rules

- Body text defaults to medium weight with readable line height.
- Headings use Nunito at strong weights, compact tracking, and balanced wrapping.
- Buttons and interactive controls use deliberate semibold/bold weights.
- Inputs, selects, and textareas inherit Nunito and retain the existing 16px mobile zoom-prevention contract.
- Prices, totals, SKUs, and code-like customer references use Nunito with tabular numerals rather than a separate monospace family.
- Do not use `Inter`, `Geist`, `Varela Round`, browser-default font declarations, or a customer-facing monospace family in new frontend code.

## Deployment and validation

Typography changes require both artifacts when applicable:

1. rebuild and deploy the React production bundle;
2. deploy changed source-controlled WordPress theme/MU-plugin files for native checkout or Stripe Appearance changes;
3. clear page/CDN caches;
4. verify home, catalog, product, cart, checkout, order confirmation, account, repair, return, calculator, and error states on desktop and mobile;
5. confirm the network loads the Nunito Google Fonts stylesheet and no obsolete Geist/Inter storefront stylesheet.
