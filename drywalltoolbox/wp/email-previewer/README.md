# DTB Email Previewer

Standalone local design workspace for Drywall Toolbox transactional emails.

This tool intentionally does **not** require WordPress, WooCommerce, PHP, a database, SMTP, or test orders. It provides a fast BrowserSync preview loop for designing the visual structure of DTB emails with representative static fixtures.

## Purpose

Use this workspace for rapid iteration on:

- layout and spacing;
- typography and hierarchy;
- header and footer treatment;
- cards, buttons, progress indicators, product rows, totals, addresses, and responsive behavior;
- desktop and mobile composition.

It is a visual design fixture, not the production rendering authority. Approved markup and styles must still be transferred into the canonical WooCommerce templates under `wp-content/mu-plugins/dtb-commerce/Email/` and reusable primitives under `wp-content/mu-plugins/dtb-platform/Support/Email.php`.

## Install

```powershell
cd drywalltoolbox\wp\email-previewer
npm install
```

## Run

```powershell
npm run dev
```

BrowserSync opens the preview automatically, normally at:

```text
http://localhost:3000
```

Saving any file below reloads the preview immediately:

```text
index.html
assets/**/*.css
fixtures/**/*.html
```

## Workflow

```text
Edit fixture HTML/CSS
  -> save
  -> BrowserSync reloads
  -> review desktop/mobile layout
  -> apply approved design to canonical DTB WooCommerce PHP templates
  -> perform one actual WooCommerce test send for final client rendering
```

## Files

```text
email-previewer/
├── index.html
├── assets/
│   └── app.css
├── fixtures/
│   └── processing-order.html
├── browser-sync.config.cjs
├── package.json
└── README.md
```

## Boundaries

- No WordPress bootstrap.
- No WooCommerce runtime.
- No order, customer, payment, shipment, or database access.
- No SMTP or outbound email.
- No production credentials or configuration.
- No duplicate production template authority.
- Fixture values are fictional and must remain non-sensitive.

## Final verification boundary

Browser rendering is suitable for fast visual iteration, but Gmail, Outlook, Apple Mail, and other email clients use different rendering engines. After transferring an approved design into the canonical DTB templates, send a real WooCommerce test email for final compatibility review.
