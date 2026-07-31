# Theme

## Compact token summary

- Display/title font: Geist, system sans fallback.
- Body/detail font: Nunito, system sans fallback.
- Header navy: `#06142f` to `#0b2454`.
- Primary blue: `#2563eb`; active blue: `#155eef`; deep blue: `#17365d`.
- Text: `#0f172a`; secondary: `#64748b`; light border: `#e2e8f0`.
- Page background: `#f8fafc` / very light cool gray.
- Success: `#16a34a`; warning/stock accent: `#ea8a00`.
- Radius scale: 6px, 10px, 14px, 18px.
- Shadows: restrained cool-gray card shadows and blue action shadows.
- Motion: `cubic-bezier(0.16, 1, 0.3, 1)`; reduced-motion supported.
- Desktop content target: 1440px maximum; product-detail mockup target uses approximately 1240px.
- Mobile breakpoint: 768px; desktop navigation breakpoint: approximately 1024px.

## Raw source token definitions

From `frontend/src/styles/global-typography.css`:

```css
:root {
  --dtb-font-body: "Nunito", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --dtb-font-display: "Geist", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --dtb-font-ui: var(--dtb-font-body);
  --dtb-font-sans: var(--dtb-font-body);
  --font-display: var(--dtb-font-display);
  --font-heading: var(--dtb-font-display);
}
```

From `frontend/src/styles/machined-design.css`:

```css
:root {
  --alloy-base: #eaedf4;
  --alloy-mid: var(--color-primary-100, #e2e8f0);
  --alloy-deep: var(--color-primary-600, #2563eb);
  --dtb-radius-sm: 6px;
  --dtb-radius: 10px;
  --dtb-radius-lg: 14px;
}
```
