## Mobile Product Detail Page Design Specification

This mockup uses a **premium, restrained ecommerce UI system** built around dark navy, bright electric blue, white surfaces, subtle gray borders, and compact typography. The layout is optimized for a narrow mobile viewport while retaining clear hierarchy, large touch targets, and a focused purchase flow.

An exact pixel-identical implementation requires the original source design file and assets. The following specification is the closest reproducible design system based on the rendered mockup.

# 1. Overall page structure

The mobile page is a single-column layout with this order:

1. Mobile site header
2. Search field
3. Breadcrumbs
4. Product gallery card
5. Product information and purchase card
6. Product-content tabs

The page background is nearly white with a faint cool-gray tone.

```css
:root {
  --dtb-navy-950: #03122f;
  --dtb-navy-900: #061a3d;
  --dtb-blue-600: #1258ff;
  --dtb-blue-500: #1764ff;
  --dtb-blue-100: #eaf1ff;

  --dtb-green-700: #14833b;
  --dtb-green-100: #eaf8ed;

  --dtb-text-primary: #07152f;
  --dtb-text-secondary: #647089;
  --dtb-text-muted: #929bae;

  --dtb-surface: #ffffff;
  --dtb-page: #f8f9fb;
  --dtb-border: #e2e6ec;
  --dtb-border-soft: #edf0f4;

  --dtb-radius-sm: 10px;
  --dtb-radius-md: 16px;
  --dtb-radius-lg: 22px;

  --dtb-shadow-card:
    0 2px 6px rgba(9, 24, 50, 0.04),
    0 10px 28px rgba(9, 24, 50, 0.07);
}
```

The mobile content width should be fluid:

```css
.product-page {
  width: 100%;
  min-height: 100vh;
  background: var(--dtb-page);
}

.product-page__content {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 0 18px 24px;
}
```

At narrow widths, use approximately `16px` side padding. At tablet widths, increase it to `24px`.

# 2. Typography

Use **Inter Variable** throughout.

```css
font-family:
  "Inter",
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Recommended typography hierarchy:

```css
.product-title {
  font-size: clamp(1.75rem, 7vw, 2.1rem);
  font-weight: 750;
  line-height: 1.08;
  letter-spacing: -0.04em;
  color: var(--dtb-text-primary);
}

.product-price {
  font-size: 2.2rem;
  font-weight: 750;
  line-height: 1;
  letter-spacing: -0.035em;
}

.section-label,
.option-label {
  font-size: 0.94rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.body-text {
  font-size: 0.9rem;
  font-weight: 450;
  line-height: 1.45;
}

.meta-text {
  font-size: 0.88rem;
  font-weight: 450;
  color: var(--dtb-text-secondary);
}

.button-label {
  font-size: 1.05rem;
  font-weight: 650;
  letter-spacing: -0.015em;
}
```

The visual match depends heavily on:

* strong but not overly heavy headings
* tight negative tracking
* restrained line heights
* muted gray metadata
* consistent `600–750` weights for controls and headings

# 3. Mobile header

The header is a tall dark navy container with rounded upper page corners in the mockup presentation. On a real site, it can span full width without device-frame rounding.

## Header layout

Top row:

* hamburger menu on left
* centered DryWall Toolbox logo
* account and cart controls on right
* cart badge overlapping the cart icon

Second row:

* full-width search input

```css
.mobile-header {
  background:
    radial-gradient(circle at 70% 0%, rgba(29, 91, 218, 0.16), transparent 35%),
    linear-gradient(135deg, #031129 0%, #061b3e 100%);
  padding: 22px 24px 20px;
  color: #fff;
}

.mobile-header__top {
  position: relative;
  min-height: 82px;
  display: grid;
  grid-template-columns: 72px 1fr 92px;
  align-items: center;
}

.mobile-header__logo {
  justify-self: center;
  width: clamp(210px, 45vw, 270px);
  height: auto;
}

.mobile-header__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}
```

Important details:

* logo is visually centered independent of left and right controls
* header is slightly taller than a conventional ecommerce header
* logo has strong horizontal presence
* icons are white, thin-stroke, approximately `25–28px`
* cart badge uses bright blue and white text

```css
.cart-badge {
  position: absolute;
  top: -9px;
  right: -10px;
  min-width: 26px;
  height: 26px;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--dtb-blue-600);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  display: grid;
  place-items: center;
}
```

# 4. Search field

The search input sits inside the navy header.

```css
.mobile-search {
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.055);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.mobile-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #fff;
  font-size: 1rem;
}

.mobile-search input::placeholder {
  color: rgba(255, 255, 255, 0.68);
}
```

The field should not resemble a bright white input. It remains integrated into the dark header.

# 5. Breadcrumbs

Breadcrumbs appear immediately below the header on a white/light page background.

```css
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 18px 0 14px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.82rem;
  color: #77839a;
}

.breadcrumbs__current {
  color: var(--dtb-text-primary);
  font-weight: 550;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

On very narrow devices, truncate the current product name rather than allowing wrapping.

# 6. Card system

The product gallery and product information use separate white cards.

```css
.product-card {
  background: var(--dtb-surface);
  border: 1px solid var(--dtb-border-soft);
  border-radius: var(--dtb-radius-lg);
  box-shadow: var(--dtb-shadow-card);
}
```

The border is intentionally subtle. The visual definition comes primarily from the soft shadow and white-on-gray contrast.

Recommended spacing between cards:

```css
.product-card + .product-card {
  margin-top: 16px;
}
```

# 7. Product gallery

The gallery is a large white card with:

* main image centered
* circular previous/next controls
* zoom control in top-right
* thumbnails along the bottom
* generous whitespace around the product

```css
.product-gallery {
  position: relative;
  padding: 22px 18px 26px;
}

.product-gallery__stage {
  position: relative;
  min-height: clamp(390px, 62vh, 520px);
  display: grid;
  place-items: center;
}

.product-gallery__image {
  width: min(76%, 450px);
  max-height: 440px;
  object-fit: contain;
}
```

The image should not touch the card boundaries. Preserve a large white studio area.

## Gallery controls

```css
.gallery-control {
  width: 48px;
  height: 48px;
  border: 1px solid var(--dtb-border);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 5px 14px rgba(10, 27, 54, 0.08);
  display: grid;
  place-items: center;
}

.gallery-control--previous {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
}

.gallery-control--next {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

.gallery-control--zoom {
  position: absolute;
  top: 0;
  right: 0;
}
```

Touch targets should remain at least `44 × 44px`.

# 8. Thumbnail strip

The thumbnails are centered in a single horizontal row.

```css
.gallery-thumbnails {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 4px 0;
  scrollbar-width: none;
}

.gallery-thumbnail {
  flex: 0 0 74px;
  width: 74px;
  height: 74px;
  border: 1px solid var(--dtb-border);
  border-radius: 12px;
  background: #fff;
  display: grid;
  place-items: center;
}

.gallery-thumbnail[aria-current="true"] {
  border: 2px solid var(--dtb-blue-600);
  box-shadow: 0 0 0 1px rgba(18, 88, 255, 0.08);
}
```

The selected thumbnail uses a crisp blue border. Avoid colored backgrounds.

# 9. Product information card

The purchase card uses approximately `28–34px` internal padding.

```css
.product-summary {
  padding: 30px 28px 26px;
}
```

On screens below `420px`, reduce horizontal padding to `20px`.

The internal order is:

1. title
2. rating
3. availability, brand and SKU
4. price
5. shipping note
6. option selector
7. readiness strip
8. quantity and add-to-cart row
9. checkout button
10. payment logos
11. trust benefits

# 10. Rating and metadata

The rating is intentionally muted because there are no reviews.

```css
.product-rating {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  color: #cbd1dc;
  font-size: 0.84rem;
}

.product-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
  color: var(--dtb-text-secondary);
}

.product-meta > * + * {
  padding-left: 10px;
  border-left: 1px solid var(--dtb-border);
}
```

The in-stock status uses a small green dot rather than a large badge.

# 11. Price styling

```css
.price-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 18px;
}

.price-current {
  font-size: 2.25rem;
  font-weight: 760;
  letter-spacing: -0.04em;
  color: var(--dtb-text-primary);
}

.price-previous {
  color: #8993a6;
  font-size: 1rem;
  text-decoration: line-through;
}
```

The shipping note sits directly beneath the price and uses blue emphasis on the leading word.

# 12. Product option selector

The style selector uses compact outlined pills.

```css
.option-group {
  margin-top: 28px;
}

.option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.option-button {
  min-height: 48px;
  padding: 0 22px;
  border: 1px solid #ccd4e0;
  border-radius: 10px;
  background: #fff;
  color: var(--dtb-text-primary);
  font-size: 0.9rem;
  font-weight: 600;
}

.option-button[aria-pressed="true"] {
  border: 2px solid var(--dtb-blue-600);
  color: var(--dtb-blue-600);
  background: #f8faff;
}
```

Avoid filled blue option pills. The mockup uses a clean white selected state with blue outline and text.

# 13. Availability strip

The stock strip is pale green, full width, and horizontally balanced.

```css
.availability-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  min-height: 50px;
  margin-top: 22px;
  padding: 12px 16px;
  border-radius: 10px;
  background: linear-gradient(90deg, #e9f8ec 0%, #f1faf3 100%);
  color: #133e24;
  font-size: 0.84rem;
  font-weight: 520;
}
```

On screens below `420px`, stack or wrap the two messages.

# 14. Quantity and Add to Cart row

Desktop-like horizontal composition is retained on mobile:

* quantity stepper occupies approximately 23–25%
* Add to Cart occupies remaining width

```css
.purchase-row {
  display: grid;
  grid-template-columns: minmax(130px, 0.28fr) 1fr;
  gap: 14px;
  margin-top: 22px;
}

.quantity-stepper {
  min-height: 62px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  border: 1px solid #d8dee8;
  border-radius: 11px;
  background: #fff;
}

.quantity-stepper button {
  min-width: 44px;
  min-height: 44px;
  border: 0;
  background: transparent;
  font-size: 1.3rem;
}

.quantity-stepper output {
  font-size: 1.1rem;
  font-weight: 650;
}
```

## Add to Cart button

```css
.add-to-cart {
  min-height: 62px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #1456f5 0%, #095eff 100%);
  color: #fff;
  box-shadow:
    0 7px 16px rgba(19, 89, 255, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  font-size: 1.08rem;
  font-weight: 650;
}
```

The blue is vivid but not neon. The shadow should be controlled.

Below approximately `360px`, stack quantity and Add to Cart vertically.

# 15. Checkout Now button

The checkout button is full width and dark navy.

```css
.checkout-now {
  width: 100%;
  min-height: 62px;
  margin-top: 14px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #04142f 0%, #071c40 100%);
  color: #fff;
  font-size: 1.08rem;
  font-weight: 650;
  box-shadow: 0 7px 16px rgba(5, 20, 47, 0.13);
}
```

The visual hierarchy is:

1. blue Add to Cart
2. navy Checkout Now
3. payment logos

Both primary actions have the same height and border radius.

# 16. Payment method logos

The payment logos are standalone. They do **not** use individual card containers, borders, tiles, or backgrounds.

```css
.payment-methods {
  margin-top: 18px;
  text-align: center;
}

.payment-methods__label {
  margin-bottom: 14px;
  color: #8390a5;
  font-size: 0.86rem;
  font-weight: 450;
}

.payment-methods__logos {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  overflow-x: auto;
  padding: 0 8px;
  scrollbar-width: none;
}

.payment-methods__logos img {
  flex: 0 0 auto;
  max-width: 54px;
  max-height: 25px;
  object-fit: contain;
}
```

Required logos shown in the mockup:

* Visa
* Mastercard
* American Express
* Apple Pay
* Google Pay
* Affirm
* Klarna
* Shop Pay

Use official approved brand assets. Do not recreate payment logos in text or CSS.

The row may horizontally scroll on small devices, but it should initially show as many logos as practical.

# 17. Trust benefit row

The bottom trust row contains three evenly distributed items:

* Secure Checkout
* Fast Shipping
* Easy Returns

```css
.purchase-benefits {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--dtb-border-soft);
}

.purchase-benefit {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 10px;
  align-items: start;
}

.purchase-benefit__title {
  color: var(--dtb-text-primary);
  font-size: 0.82rem;
  font-weight: 650;
}

.purchase-benefit__description {
  margin-top: 2px;
  color: var(--dtb-text-secondary);
  font-size: 0.72rem;
  line-height: 1.3;
}
```

Icons are thin outline icons in a muted blue-gray. Keep them visually secondary.

On screens below approximately `390px`, this row should become one or two columns rather than shrinking text excessively.

# 18. Product tabs

The tabs sit below the purchase card and span the full mobile content width.

```css
.product-tabs {
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  margin-top: 22px;
  border-bottom: 1px solid var(--dtb-border);
  scrollbar-width: none;
}

.product-tab {
  position: relative;
  flex: 1 0 auto;
  min-height: 58px;
  padding: 0 18px;
  border: 0;
  background: transparent;
  color: #657189;
  font-size: 0.88rem;
  font-weight: 550;
}

.product-tab[aria-selected="true"] {
  color: var(--dtb-blue-600);
  font-weight: 650;
}

.product-tab[aria-selected="true"]::after {
  content: "";
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 0;
  height: 3px;
  border-radius: 999px 999px 0 0;
  background: var(--dtb-blue-600);
}
```

Tabs shown:

* Description
* Specifications
* Compatibility
* Reviews

# 19. Spacing system

Use a consistent spacing scale:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  --space-8: 32px;
}
```

Key spacing relationships:

* card-to-card gap: `16px`
* card internal padding: `20–30px`
* label-to-control gap: `8–10px`
* major section gap: `22–28px`
* button gap: `12–14px`
* price-to-shipping gap: `6–8px`

# 20. Responsive behavior

## Up to 359px

* use `14–16px` page padding
* stack quantity and Add to Cart
* allow payment logos to scroll
* stack trust benefits
* reduce title to approximately `28px`

## 360px–479px

* preserve the illustrated single-column layout
* quantity and Add to Cart may remain side by side
* use `20px` card padding
* allow thumbnails and payment logos to scroll

## 480px–767px

* increase page padding to `22–24px`
* increase gallery height
* use `28px` purchase-card padding
* retain a maximum content width around `720–760px`

# 21. Interaction and accessibility requirements

To reproduce the UI responsibly:

* all icon-only buttons require accessible labels
* all touch controls must be at least `44 × 44px`
* selected variants must use `aria-pressed`
* tabs must use proper tab semantics
* gallery controls must support keyboard interaction
* payment logos require meaningful `alt` text
* stock state must not rely on green alone
* price changes must be announced to assistive technology
* disabled purchase controls must remain visually distinguishable
* Add to Cart must prevent duplicate submissions while pending
* variant selection must remain synchronized with WooCommerce Store API cart state

# 22. Visual characteristics to avoid

Do not introduce:

* heavy gradients outside the header and main buttons
* large drop shadows
* excessive pill-shaped controls
* outlined containers around payment logos
* thick gray borders
* oversized trust badges
* dense metadata
* multiple competing blue tones
* decorative illustrations in the purchase block
* tiny controls to force everything onto one row

# 23. Final visual identity

The page should read as:

* **Header:** technical, dark, premium
* **Gallery:** spacious, product-focused, neutral
* **Product card:** structured and conversion-oriented
* **Controls:** sharp and touch-friendly
* **Primary accent:** one consistent electric blue
* **Typography:** compact, bold, modern
* **Trust content:** present but subordinate
* **Payment methods:** recognizable, standalone, uncluttered
* **Mobile behavior:** fluid rather than merely scaled down

The most important fidelity points are the centered oversized logo, separate rounded white gallery and purchase cards, tight Inter typography, restrained shadows, blue outlined option state, green availability strip, paired quantity/Add to Cart row, full-width navy Checkout Now button, unboxed payment logos, and evenly distributed trust benefits.
