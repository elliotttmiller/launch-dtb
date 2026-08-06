# Typography

DTB's typography already implements most of what a Butterick/Bringhurst-informed system asks for. This reference documents what's already correct (don't "fix" it), and the few genuinely missing refinements.

## Already correct — verify, don't reinvent

- **Font pairing by contrast, not similarity**: Geist (display/headings — grotesk-leaning geometric sans) paired against Nunito (body/UI — rounded humanist sans). This is a real contrast pair, not two similar geometric sans-serifs stacked — don't "fix" this by unifying to one family.
- **Self-hosted variable fonts**: `@fontsource-variable/geist` and `@fontsource-variable/nunito`, imported in `main.jsx` (`wght.css` + `wght-italic.css` per family). Variable-font axes cover the weight range already used (400/450/500/600/650/700 across the system) — no need for separate static weight files.
- **`font-optical-sizing: auto`** already set globally (`global-typography.css`).
- **`text-wrap: balance`** on headings, **`text-wrap: pretty`** on body/prose elements (`p`, `li`, `dd`, `td`, `th`, `figcaption`, `blockquote`) — already exactly per the rule "balance headings, pretty body."
- **`font-variant-numeric: tabular-nums`** already applied to `code`/`pre`/`kbd`/`samp` and any element matching `[class*="sku" i]`, `[class*="price" i]`, `[class*="amount" i]`, `[class*="total" i]` — the exact "tabular for data columns" rule, already scoped by class-name heuristic rather than needing manual per-component application.
- **Letter-spacing discipline**: body uses `-0.005em` (subtle *tightening*, a legitimate optical adjustment for the weight/size in use — not the "adding positive tracking to lowercase body text" anti-pattern the rule warns against), headings use `-0.03em` desktop / `-0.02em` mobile (tightening, appropriate at display sizes), buttons `-0.01em`. Nothing in the current system adds *positive* letter-spacing to lowercase text — the anti-pattern doesn't apply here. If you ever add an uppercase treatment (eyebrow labels, badges), that's the one case `+0.05-0.12em` positive tracking belongs — check for an existing `.dtb-title-eyebrow`-style pattern first.
- **Line-height**: body `1.65` desktop / `1.5` mobile, headings `1.15` — unitless values throughout, consistent with the "always unitless" rule.
- **`hyphens: auto`** already used selectively (`mobile-schematic.css`, `order-pages.css`) where line-length is genuinely tight; `html lang="en"` is set, so hyphenation dictionaries resolve correctly where it's used.
- **`font-weight: 650`** on headings, `700` on `h1` specifically — subtle graduated steps, not arbitrary jumps, and bold-not-italic for emphasis at heading level.

## Genuinely missing — worth adding

- **`font-kerning: normal`** is not set globally in `global-typography.css`. It's a one-line, zero-risk addition (`html, body { font-kerning: normal; }` alongside the existing `font-optical-sizing`/`text-rendering` block) — most browsers default to `normal` already for variable fonts, but making it explicit removes any engine-dependent variance.
- **No documented type scale.** Heading sizes are presumably set via Tailwind utility classes per-component rather than a defined ratio-based scale — if auditing a page and sizes look arbitrary/inconsistent, that's the actual defect, not the font choice. When establishing or correcting a scale, use a 1.2-1.5x ratio from the real body base size (check the actual computed body font-size via the Tailwind config / component in question — don't assume 16px) rather than picking new arbitrary values. Don't introduce `clamp()`-based fluid scaling for headings unless a specific page has a demonstrated cross-breakpoint sizing problem — most of this system uses fixed per-breakpoint sizing via the existing `responsive-foundation.css`/Tailwind responsive utilities, and mixing paradigms would add inconsistency, not reduce it.
- **`font-variant-numeric: oldstyle-nums` for prose** is not applied anywhere (only `tabular-nums` for data). This is a genuinely optional refinement, not a defect — oldstyle figures suit long-form prose better than commerce/UI copy, and DTB has essentially no long-form prose surface (no blog, per the `dtb-seo` skill's findings). Skip this unless a specific long-form content page is added later.
- **Font loading resilience check**: `@fontsource-variable` packages include `font-display: swap` by default in their generated CSS — verify this hasn't been overridden anywhere, but don't add a redundant manual `@font-face` block on top of the package import. If LCP audits (via `dtb-seo`) show font-loading as a bottleneck, the fix is a `<link rel="preload">` for the specific Nunito variable-font file actually used above the fold (body text is almost always the LCP element on a text-heavy commerce page) — check `dtb-seo`'s Core Web Vitals section before adding preload hints speculatively.

## Rules to apply when writing new typography-adjacent code

- Never introduce a third font family — the two-tier system is deliberate and complete for this site's needs.
- Never add positive `letter-spacing` to lowercase body/paragraph text.
- Never center-align body paragraph text — left-align only (this system doesn't do it; keep it that way).
- Always use unitless `line-height`.
- Match `--dtb-font-display`/`--dtb-font-body` custom properties rather than hardcoding a font-family string — this file is imported last specifically so nothing downstream should need to touch font-family directly.
