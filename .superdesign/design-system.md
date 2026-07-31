# Drywall Toolbox product-detail redesign system

The accepted sources of truth are the user-provided desktop and mobile
product-detail mockups. Reproduce each breakpoint faithfully; do not create an
alternate visual direction.

## Product context

Drywall Toolbox is a professional drywall-tool commerce storefront. React owns
browsing and purchase interaction; WooCommerce owns cart/session/order state;
provider-owned checkout and payment controls remain authoritative.

## Visual system

- Use Inter for titles, prices, navigation, controls, labels, and supporting
  text. Use variable weights from 400 through 800.
- True white cards on a very light cool-gray page.
- Deep navy two-row desktop header with a 30px utility strip and an 86px main row.
- Primary action blue `#2255ee`; deepest navy `#06142f`; text `#0f172a`.
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

## Accepted mobile product-detail anatomy

1. Deep navy mobile header with centered logo, menu at left, account and cart
   at right, and a full-width inset search field below.
2. Compact single-line breadcrumb below the header.
3. Independent white gallery card with a large centered image, floating zoom
   control, side navigation controls, and five evenly spaced thumbnail slots.
4. Independent white purchase card with generous internal padding and this
   order: title, reviews, stock/brand/SKU, price, shipping, variation controls,
   green availability bar, quantity plus Add to Cart, Checkout Now, conditional
   express checkout marks, and three trust assurances.
5. Full-width four-tab rail below the purchase card with a blue active
   underline.
6. At narrow widths, preserve the same hierarchy with fluid sizes and no
   clipping, overlap, body-level horizontal scroll, or text collisions.
