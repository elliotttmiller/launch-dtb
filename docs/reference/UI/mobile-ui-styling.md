Your current right column is structurally close, but the content is compressed into the upper half while the lower portion of the card is largely unused. The mockup works because the card is treated as a **full-height layout system**, not as a normal content container with arbitrary margins.

The correct approach is:

1. Stretch the right card to the same height as the gallery.
2. Divide its contents into logical regions.
3. Use controlled fluid gaps rather than scattered margins.
4. Keep the transaction controls grouped together.
5. Anchor the payment and trust region toward the bottom.
6. Allow titles, variants, and stock messages to grow without breaking alignment.

## 1. Use an equal-height two-column product shell

The gallery and product card must participate in the same CSS Grid row.

**Repository path: existing frontend product-detail layout stylesheet; confirm the exact file before editing.**

```css
.product-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(420px, 0.88fr);
  gap: clamp(24px, 2.2vw, 36px);
  align-items: stretch;
}

.product-gallery-card,
.product-purchase-card {
  height: 100%;
  min-width: 0;
}

@media (max-width: 1024px) {
  .product-detail-layout {
    grid-template-columns: 1fr;
  }
}
```

Do not set independent fixed heights on the two cards. Let the tallest column establish the row height and allow the other card to stretch.

Your current implementation appears to size the right card only around its content. That produces the empty lower area within the overall two-column section instead of distributing the card content across the available vertical space.

---

# 2. Build the purchase card as defined layout regions

Do not place every element directly inside one container with individual margins.

Use five explicit regions:

```text
Product identity
Pricing and product configuration
Availability and purchase controls
Payment methods
Trust footer
```

Recommended component structure:

**Repository path: existing frontend product-detail component; confirm the exact file before editing.**

```jsx
<aside className="product-purchase-card">
  <div className="product-purchase-card__inner">
    <section className="product-identity">
      {/* title, reviews, stock, brand, SKU */}
    </section>

    <section className="product-commerce">
      {/* price, shipping, variations/options */}
    </section>

    <section className="product-actions">
      {/* availability strip, quantity, add to cart, checkout */}
    </section>

    <section className="product-payments">
      {/* payment heading and logos */}
    </section>

    <footer className="product-trust">
      {/* secure checkout, shipping, returns */}
    </footer>
  </div>
</aside>
```

This gives each area ownership of its internal spacing and prevents one product’s title, variant count, or stock message from disrupting the rest of the card.

---

# 3. Make the inner card fill the available height

The inner card should use a vertical flex layout. The trust area is anchored at the bottom, while the primary content remains naturally sized.

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-purchase-card {
  overflow: hidden;
  border: 1px solid #e3e8ef;
  border-radius: 22px;
  background: #ffffff;
  box-shadow:
    0 2px 5px rgba(7, 21, 47, 0.025),
    0 14px 34px rgba(7, 21, 47, 0.065);
}

.product-purchase-card__inner {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  padding:
    clamp(26px, 2.2vw, 38px)
    clamp(26px, 2.4vw, 40px)
    clamp(22px, 2vw, 32px);
}
```

The key declaration is:

```css
min-height: 100%;
```

The parent card must already be stretched by the outer product grid.

---

# 4. Use a controlled vertical rhythm

Avoid manually assigning unrelated values such as `margin-bottom: 7px`, `18px`, `26px`, and `31px` across individual elements.

Create a small spacing system:

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-purchase-card {
  --purchase-gap-xs: 6px;
  --purchase-gap-sm: 10px;
  --purchase-gap-md: clamp(14px, 1.15vw, 18px);
  --purchase-gap-lg: clamp(20px, 1.6vw, 26px);
  --purchase-control-height: 54px;
  --purchase-radius: 10px;
}
```

Apply spacing at the section level:

```css
.product-identity,
.product-commerce,
.product-actions,
.product-payments {
  min-width: 0;
}

.product-commerce {
  margin-top: var(--purchase-gap-md);
}

.product-actions {
  margin-top: var(--purchase-gap-lg);
}

.product-payments {
  margin-top: var(--purchase-gap-md);
}

.product-trust {
  margin-top: auto;
  padding-top: clamp(18px, 1.5vw, 24px);
}
```

`margin-top: auto` on the trust footer is what makes the card consume its available height cleanly.

It places any flexible remaining space between the payment region and trust footer rather than leaving arbitrary blank space below all content.

---

# 5. Refine the title region

Your title is visually strong, but it needs a predictable width, line height, and maximum wrapping behavior.

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-title {
  max-width: 18ch;
  margin: 0;
  color: #07152f;
  font-family: "Inter", sans-serif;
  font-size: clamp(30px, 2.25vw, 40px);
  font-weight: 760;
  line-height: 1.04;
  letter-spacing: -0.042em;
  text-wrap: balance;
}

.product-review-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  color: #7c879a;
  font-size: 13px;
  line-height: 1.35;
}
```

`text-wrap: balance` improves two-line titles such as:

```text
LEVEL5 The Ultimate
Taping & Finishing Set
```

without requiring manual line breaks.

Do not give the title region a fixed height. Products with shorter titles should simply allow more flexible space lower in the card.

---

# 6. Keep metadata compact and aligned

Stock, brand, and SKU should read as one restrained metadata row.

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  margin-top: 16px;
  color: #718097;
  font-size: 13px;
  font-weight: 450;
}

.product-meta__item {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
}

.product-meta__item + .product-meta__item {
  margin-left: 10px;
  padding-left: 10px;
  border-left: 1px solid #dfe4eb;
}

.product-stock {
  color: #13843b;
  font-weight: 600;
}

.product-stock::before {
  content: "";
  width: 7px;
  height: 7px;
  margin-right: 7px;
  border-radius: 50%;
  background: currentColor;
}
```

This is cleaner than allowing each metadata element to define its own margin.

---

# 7. Treat price and shipping as one block

The price should not be visually detached from the shipping note.

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-price-block {
  margin-top: 14px;
}

.product-price-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
}

.product-price-current {
  color: #07152f;
  font-size: clamp(34px, 2.6vw, 42px);
  font-weight: 760;
  line-height: 1;
  letter-spacing: -0.045em;
}

.product-price-regular {
  color: #98a2b2;
  font-size: 16px;
  line-height: 1;
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}

.product-shipping-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: #657189;
  font-size: 13px;
  line-height: 1.35;
}

.product-shipping-note a {
  color: #075cff;
  font-weight: 550;
  text-underline-offset: 2px;
}
```

In your current card, the price region could use slightly more breathing room before the stock bar.

---

# 8. Create a dedicated variant area

Products without variations should omit this region entirely. Products with options should insert it between shipping and availability.

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-options {
  margin-top: clamp(18px, 1.4vw, 24px);
}

.product-options__label {
  display: block;
  margin-bottom: 10px;
  color: #07152f;
  font-size: 14px;
  font-weight: 650;
}

.product-options__list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.product-option {
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid #ccd5e1;
  border-radius: 9px;
  background: #ffffff;
  color: #07152f;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
}

.product-option[aria-pressed="true"] {
  border: 2px solid #1260ff;
  background: #f8faff;
  color: #075cff;
}
```

The purchase card should not reserve empty space when a simple product has no options.

---

# 9. Make the availability strip fluid

Your stock strip is close to the mockup. It should use two aligned content groups and wrap safely when necessary.

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-availability {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  min-height: 48px;
  padding: 10px 14px;
  border: 1px solid #bde8c9;
  border-radius: 9px;
  background: linear-gradient(90deg, #eaf8ee 0%, #f4fbf6 100%);
  color: #17472a;
  font-size: 13px;
  line-height: 1.3;
}

.product-availability__primary {
  display: flex;
  align-items: center;
  min-width: 0;
  font-weight: 600;
}

.product-availability__secondary {
  color: #193525;
  text-align: right;
  white-space: nowrap;
}

@media (max-width: 1180px) {
  .product-availability {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .product-availability__secondary {
    text-align: left;
    white-space: normal;
  }
}
```

Avoid hard-coding the text to “98 in stock” unless exact inventory exposure is intentional. The visual component should support either a generic readiness statement or a quantity.

---

# 10. Build the quantity and Add to Cart row as a stable grid

The quantity control should have a fixed usable range; the button should consume all remaining space.

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-add-row {
  display: grid;
  grid-template-columns: clamp(104px, 23%, 128px) minmax(0, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.quantity-stepper,
.add-to-cart-button {
  min-height: var(--purchase-control-height);
}

.quantity-stepper {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  overflow: hidden;
  border: 1px solid #d5dde8;
  border-radius: var(--purchase-radius);
  background: #ffffff;
}

.quantity-stepper button {
  width: 100%;
  height: 100%;
  min-width: 40px;
  border: 0;
  background: transparent;
  color: #0a1831;
  font-size: 18px;
  cursor: pointer;
}

.quantity-stepper output {
  min-width: 24px;
  color: #07152f;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
}

.add-to-cart-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 0;
  border: 0;
  border-radius: var(--purchase-radius);
  background: linear-gradient(135deg, #123d8c 0%, #1761ff 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 650;
  box-shadow:
    0 8px 18px rgba(18, 82, 218, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}
```

Your current Add to Cart row is proportionally correct. It needs consistent control height and a slightly wider quantity stepper.

---

# 11. Give Checkout Now equal visual discipline

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.checkout-now-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: var(--purchase-control-height);
  margin-top: 12px;
  border: 0;
  border-radius: var(--purchase-radius);
  background: linear-gradient(135deg, #020f27 0%, #09245a 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 650;
  box-shadow: 0 8px 20px rgba(4, 21, 51, 0.14);
}
```

The Add to Cart and Checkout Now buttons should have:

* identical height
* identical corner radius
* aligned horizontal edges
* consistent font sizing
* only color differentiating their role

---

# 12. Improve the payment-logo area

Your current payment row is too narrow and visually undersized relative to the card. The mockup gives this area more horizontal presence.

Use standalone logos without card containers.

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-payments {
  text-align: center;
}

.product-payments__label {
  margin-bottom: 12px;
  color: #7b879c;
  font-size: 12px;
  font-weight: 450;
}

.product-payments__logos {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  column-gap: clamp(14px, 1.3vw, 22px);
  row-gap: 10px;
}

.product-payments__logos img,
.product-payments__logos svg {
  display: block;
  width: auto;
  max-width: 54px;
  height: clamp(18px, 1.35vw, 24px);
  max-height: 24px;
  object-fit: contain;
}
```

Do not normalize every logo to the same width. Normalize by maximum height so the brand marks retain their intended proportions.

---

# 13. Anchor and distribute the trust footer

This is the most important difference between your current screenshot and the mockup.

The trust region should:

* sit at the bottom of the card
* have a top divider
* span the full card width
* distribute three benefits evenly
* use consistent icon and text alignment

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-trust {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 1.5vw, 24px);
  border-top: 1px solid #e5e9ef;
}

.product-trust__item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  min-width: 0;
}

.product-trust__icon {
  width: 25px;
  height: 25px;
  color: #62738f;
}

.product-trust__title {
  margin: 0;
  color: #07152f;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.25;
}

.product-trust__description {
  margin: 2px 0 0;
  color: #738097;
  font-size: 10px;
  line-height: 1.3;
}
```

Because `.product-trust` has `margin-top: auto`, it settles at the card bottom even when:

* the product title is short
* the product has no options
* the gallery is taller than the purchase content
* the desktop viewport changes height

---

# 14. Prevent the card from becoming excessively tall

Equal-height columns are appropriate, but the gallery itself should have a controlled height range.

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-gallery-card,
.product-purchase-card {
  min-height: clamp(560px, 62vw, 690px);
  max-height: min(720px, calc(100vh - 250px));
}

.product-gallery-card {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
}
```

Be cautious with `max-height`. Long titles or numerous variations must never be clipped.

A safer production rule is:

```css
.product-purchase-card {
  min-height: 620px;
}

.product-gallery-card {
  min-height: 620px;
}
```

Then allow either card to grow naturally.

---

# 15. Recommended desktop proportions

For a viewport near the screenshots:

```css
.product-detail-container {
  width: min(100% - 40px, 1280px);
  margin-inline: auto;
}

.product-detail-layout {
  grid-template-columns: minmax(0, 58%) minmax(420px, 42%);
}
```

Suggested dimensions:

| Element               |      Target |
| --------------------- | ----------: |
| Overall content width | 1220–1320px |
| Column gap            |     28–36px |
| Gallery card          |      56–59% |
| Purchase card         |      41–44% |
| Card radius           |     20–22px |
| Purchase padding      |     28–40px |
| Control height        |     52–56px |
| Trust footer height   |     60–76px |
| Payment logo height   |     18–24px |

Your current right column appears slightly too narrow and internally padded too conservatively. Increasing the right card to approximately `42%` of the grid and using `32–38px` horizontal padding will make the content feel less compressed.

---

# 16. Do not use `justify-content: space-between` for every child

A tempting implementation is:

```css
.product-purchase-card__inner {
  justify-content: space-between;
}
```

Do not do that.

It causes inconsistent vertical gaps whenever:

* titles wrap differently
* variation selectors appear or disappear
* stock messages change length
* sale pricing is present
* payment methods vary by location

Instead:

```css
.product-purchase-card__inner {
  display: flex;
  flex-direction: column;
}

.product-trust {
  margin-top: auto;
}
```

This gives you one intentional flexible region rather than distributing unpredictable space between every section.

---

# 17. Final structural CSS

This is the core implementation pattern.

**Repository path: existing frontend product-detail stylesheet; confirm the exact file before editing.**

```css
.product-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(420px, 0.88fr);
  gap: clamp(24px, 2.2vw, 36px);
  align-items: stretch;
}

.product-purchase-card {
  height: 100%;
  overflow: hidden;
  border: 1px solid #e3e8ef;
  border-radius: 22px;
  background: #ffffff;
  box-shadow:
    0 2px 5px rgba(7, 21, 47, 0.025),
    0 14px 34px rgba(7, 21, 47, 0.065);
}

.product-purchase-card__inner {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding:
    clamp(26px, 2.2vw, 38px)
    clamp(26px, 2.4vw, 40px)
    clamp(22px, 2vw, 32px);
}

.product-commerce {
  margin-top: clamp(14px, 1.15vw, 18px);
}

.product-actions {
  margin-top: clamp(20px, 1.6vw, 26px);
}

.product-payments {
  margin-top: clamp(14px, 1.15vw, 18px);
}

.product-trust {
  margin-top: auto;
  padding-top: clamp(18px, 1.5vw, 24px);
}

@media (max-width: 1024px) {
  .product-detail-layout {
    grid-template-columns: 1fr;
  }

  .product-purchase-card {
    height: auto;
  }

  .product-purchase-card__inner {
    min-height: 0;
  }

  .product-trust {
    margin-top: 24px;
  }
}
```

## Primary corrections for your current card

Based on the comparison, revise these areas first:

1. **Stretch the purchase card to the gallery height.**
2. **Increase right-card horizontal padding slightly.**
3. **Separate identity, commerce, actions, payments, and trust into explicit regions.**
4. **Anchor the trust section to the card bottom with `margin-top: auto`.**
5. **Increase payment logo size and horizontal spacing.**
6. **Give the availability, quantity, and buttons identical widths and aligned edges.**
7. **Use fluid `clamp()` spacing rather than viewport-specific fixed margins.**
8. **Keep variable options conditional so simple products do not reserve unused space.**

This will make the right card use its available height intentionally while remaining stable across simple products, variable products, sale prices, long titles, different inventory messaging, and changing payment-method availability.
