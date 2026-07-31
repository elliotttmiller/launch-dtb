# Drywall Toolbox product-detail redesign system

The accepted source of truth is the user-provided desktop product-detail mockup.
Reproduce it faithfully; do not create an alternate visual direction.

## Product context

Drywall Toolbox is a professional drywall-tool commerce storefront. React owns
browsing and purchase interaction; WooCommerce owns cart/session/order state;
provider-owned checkout and payment controls remain authoritative.

## Visual system

- Use Geist for headers, navigation, labels, prices, buttons, and titles.
- Use Nunito for descriptive/supporting text.
- True white cards on a very light cool-gray page.
- Deep navy two-row desktop header with a 30px utility strip and an 86px main row.
- Primary action blue `#155eef`; deepest navy `#06142f`; text `#0f172a`.
- Fine `#e2e8f0` borders, restrained cool-gray shadows, 12-16px radii.
- Desktop product page maximum width approximately 1240px.
- Main product grid is 55% gallery / 45% purchase card with a 32px gap.
- Gallery and purchase panel are independent equal-height cards.
- No decorative gradients beyond the branded primary action.
- Motion is subtle and responsive; preserve reduced-motion behavior.

## Accepted product-detail anatomy

1. Utility strip: professional tools statement and built-for-pro statement on
   the left; shipping, returns, and support on the right.
2. Main header: logo, outlined All Products control, navigation, wide search,
   account icon, cart icon and count.
3. Breadcrumb line.
4. Left gallery card: large centered product image, zoom at top-right, arrows at
   mid-sides, bottom thumbnail rail inside the card.
5. Right purchase card: title, review row, stock/brand/SKU row, price, shipping,
   variation controls, green availability bar, quantity/add row, full-width
   Checkout Now, conditional payment marks, and three trust assurances.
6. Tabs below the cards: Description, Specifications, Compatibility, Reviews.

Do not invent payment methods. Render marks only from the existing
capability-driven implementation.
