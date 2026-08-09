# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: nav-restyle.qa.spec.js >> desktop product navigation 1920px
- Location: nav-restyle.qa.spec.js:7:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('region', { name: 'All Products navigation' }).getByText('Automatic Taping Tools', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('region', { name: 'All Products navigation' }).getByText('Automatic Taping Tools', { exact: true })

```

```yaml
- banner:
  - link "Drywall Toolbox home":
    - /url: /
    - img "Drywall Toolbox Logo"
  - navigation "Primary navigation":
    - button "All Products" [expanded]
    - region "All Products navigation":
      - paragraph: All Products
      - text: Browse professional finishing tools by system and function.
      - status:
        - strong: All Products temporarily unavailable
        - text: Catalog navigation is still loading or the catalog service is temporarily unavailable.
      - link "View all products":
        - /url: /products
    - button "Brands"
    - button "Parts"
    - link "New Arrivals":
      - /url: /products?sort=newest
    - button "Repair Services"
    - button "Schematics"
    - link "Calculators":
      - /url: /calculators
  - group:
    - combobox "Search products"
  - button "Open account hub"
  - button "Toggle cart"
- main:
  - heading "The New Standard in Drywall." [level=1]
  - paragraph: Premium tools for every drywall job — unbeatable prices, lightning-fast shipping, expert support.
  - button "Previous"
  - button "Navigate to Products": Products Full catalog
  - button "Next"
  - paragraph: Just In
  - heading "New Arrivals" [level=2]
  - link "View all":
    - /url: /products?sort=newest
  - paragraph: Brands
  - heading "Shop by Brand" [level=2]
  - link "All brands":
    - /url: /products/brands
  - button "Scroll Brands left" [disabled]
  - region "Brands"
  - button "Scroll Brands right" [disabled]
- contentinfo:
  - region "Drywall Toolbox":
    - link "Drywall Toolbox home":
      - /url: /
      - img "Drywall Toolbox"
  - region "Shop":
    - heading "Shop" [level=2]
    - list:
      - listitem:
        - link "All Products":
          - /url: /products
      - listitem:
        - link "Brands":
          - /url: /products/brands
      - listitem:
        - link "Parts":
          - /url: /parts
      - listitem:
        - link "New Arrivals":
          - /url: /products?sort=newest
  - region "Tools & Services":
    - heading "Tools & Services" [level=2]
    - list:
      - listitem:
        - link "Repair Services":
          - /url: /repairs
      - listitem:
        - link "Repair Packages":
          - /url: /repairs/packages
      - listitem:
        - link "Schematics":
          - /url: /schematics
      - listitem:
        - link "Calculators":
          - /url: /calculators
  - region "Support":
    - heading "Support" [level=2]
    - list:
      - listitem:
        - link "Contact Us":
          - /url: /contact
      - listitem:
        - link "Frequently Asked Questions":
          - /url: /faq
      - listitem:
        - link "Shipping":
          - /url: /shipping-policy
      - listitem:
        - link "Returns":
          - /url: /returns
  - region "Account":
    - heading "Account" [level=2]
    - list:
      - listitem:
        - link "Sign In":
          - /url: /login
      - listitem:
        - link "Create Account":
          - /url: /register
      - listitem:
        - link "My Account":
          - /url: /dashboard
      - listitem:
        - link "Store Policies":
          - /url: /policies
  - paragraph: © 2026 Drywall Toolbox. All rights reserved.
  - navigation "Legal":
    - link "Privacy":
      - /url: /policies
    - link "Terms":
      - /url: /policies
  - link "Instagram":
    - /url: https://www.instagram.com/drywalltoolbox
  - link "Facebook":
    - /url: https://facebook.com
  - link "Twitter / X":
    - /url: https://twitter.com
- status
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | for (const viewport of [
  4  |   { width: 1920, height: 1080 },
  5  |   { width: 1280, height: 800 },
  6  | ]) {
  7  |   test(`desktop product navigation ${viewport.width}px`, async ({ browser }) => {
  8  |     const context = await browser.newContext({ viewport });
  9  |     const page = await context.newPage();
  10 |     await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  11 |     const trigger = page.getByRole('button', { name: 'All Products' });
  12 |     await trigger.hover();
  13 |     const dropdown = page.getByRole('region', { name: 'All Products navigation' });
  14 |     await expect(dropdown).toBeVisible();
  15 |     const bounds = await dropdown.boundingBox();
  16 |     expect(bounds).not.toBeNull();
  17 |     expect(bounds.x).toBeGreaterThanOrEqual(0);
  18 |     expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
> 19 |     await expect(dropdown.getByText('Automatic Taping Tools', { exact: true })).toBeVisible();
     |                                                                                 ^ Error: expect(locator).toBeVisible() failed
  20 |     await expect(dropdown.getByText('Semi-Automatic Taping Tools', { exact: true })).toBeVisible();
  21 |     await page.screenshot({ path: `nav-restyle-${viewport.width}.png`, fullPage: false });
  22 |     await context.close();
  23 |   });
  24 | }
  25 | 
```