# Theme

## Compact token summary

- Hero background: `#070d1c`
- Primary action blue: `#2255ee` via `--dtb-primary`
- Hero copy: white headings, `#dbe3ef` supporting text
- Hero atmosphere: blue radial light at top and cyan radial light at bottom
- Display type: Geist variable; body/UI type: Nunito/system sans
- Hero title: 800 weight, `clamp(1.85rem, 5.5vw, 4.25rem)`, 1.07 line height
- Shapes: pill CTAs, 18px carousel cards, circular controls
- Motion: Framer Motion entrance; CSS marquee; transform/opacity carousel motion
- Breakpoints: mobile hero overrides below 768px

## Raw source authorities

- `frontend/tailwind.config.js`
- `frontend/src/index.css`
- `frontend/src/styles/hero-section.css`
- `frontend/src/styles/machined-design.css`

Pass the files directly when exact raw values are needed; the hero-specific CSS is compact enough to pass in full.
