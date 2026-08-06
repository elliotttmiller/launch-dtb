# Typography

This file is a **methodology for evaluating and choosing modern, clean, sharp, sleek typography** — not a fixed spec locking DTB to one font pairing forever. Fonts and micro-trends date; the underlying principles for what reads as contemporary, premium, and legible don't. Use this to judge whether the *current* live system is serving the site well, to guide a deliberate typographic refresh, or to choose typography for something new — never as a reason to leave a stale choice unquestioned just because it was documented once.

**If you need genuinely current trend data** (what's shipping on premium e-commerce sites right now, which variable fonts are gaining adoption, what a specific competitor's typography looks like this quarter), that's live research, not something a static reference file can stay accurate about — use the `market-intelligence-analyst` agent for a real-time pulse scan rather than trusting this file's framing to still reflect "trending" by the time you read it.

## What "modern, clean, sharp, sleek" actually means — evaluation criteria

Use these as the test for any typographic choice, current or proposed:

- **Deliberate contrast, not decoration.** A confident pairing reads as sharp when the two faces are doing different, legible jobs (e.g. a grotesk/geometric display face for structure and scannability, a humanist/rounded face for warmth and long-read comfort) — never two similar faces stacked for no functional reason, and never a pairing chosen for novelty over legibility.
- **Restraint over ornamentation.** Sleek typography leans on weight, size, and spacing to create hierarchy — not italics, not drop shadows, not multiple accent faces. If a design needs a third typographic "voice" to feel finished, that's usually a sign the first two aren't being used with enough range (weight axis, size scale, color/opacity), not a real need for more fonts.
- **Variable fonts over static weight files.** Current best practice for a performance-conscious, premium-feeling site: one variable font file per family covering the full weight/style range needed, not five separate static files. This is both a performance win (fewer requests, smaller total payload with modern woff2 variable compression) and a design win (continuous weight control instead of being locked to 3-4 discrete cuts).
- **Optical sizing and kerning left "on."** `font-optical-sizing: auto` and explicit `font-kerning: normal` are table stakes for a variable font actually looking sharp at both display and body sizes — a face that isn't opticaly-sized reads as slightly off at large sizes even when the underlying font is excellent.
- **Confident negative tracking at display sizes, never on lowercase body text.** Tight, intentional negative letter-spacing on large headings is one of the clearest "this is a modern site" signals right now — the opposite (loose, default tracking on big display type) reads as dated. The inverse rule holds at body size: body copy tracking should be neutral-to-slightly-tight for optical correction only, never loosened, and positive tracking is reserved exclusively for small uppercase labels/eyebrows.
- **Tabular figures wherever numbers are compared.** Prices, SKUs, specs, totals, dates in a table — anywhere a user's eye needs numbers to align vertically, tabular (monospaced-width) figures are the sharp/clean choice; proportional figures there read as slightly unpolished no matter how good the typeface is.
- **`text-wrap: balance` on headings, `text-wrap: pretty` on body** — these two CSS properties (broadly supported now) are a low-cost, high-impact signal of typographic care: no more orphaned single words on their own line in a hero headline, no more obviously ragged final body-text lines. A site missing these on modern browsers reads as typographically unpolished relative to one that has them.
- **A real type scale, not ad-hoc sizes.** Sharp, systematic typography comes from a defined ratio-based scale (each step a consistent multiple of the last, ~1.2-1.5x is the durable range) applied consistently — not from picking whatever heading size looks right in each component. Inconsistent, arbitrary sizing is one of the fastest ways a UI reads as "not quite premium" even with excellent font choices.
- **Fluid or well-defined breakpoint scaling, not fixed sizes that break at odd widths.** Whether via `clamp()` or a disciplined set of per-breakpoint values, type that visibly resizes awkwardly between breakpoints undercuts an otherwise sharp system.
- **Generous, confident whitespace around type**, not text crammed edge-to-edge. Line-length control (a real measure, not full-bleed text columns) and adequate paragraph/heading spacing are part of what makes typography feel premium rather than cramped.
- **Self-hosted fonts with `font-display: swap` and a metrics-matched fallback**, not a render-blocking or layout-shifting web font load — a sharp visual system that causes visible FOIT/FOUT or CLS on load undermines the "premium" impression it's going for regardless of the typeface itself.

## Reading the current live system against this criteria

The live system (`frontend/src/styles/global-typography.css`, self-hosted `@fontsource-variable/geist` + `@fontsource-variable/nunito`) already scores well against most of the above — treat this as a current-state baseline to verify against source before changing anything, not as a locked mandate:

- Two-tier pairing (Geist display / Nunito body) — a real contrast pair by the criteria above, not two similar faces.
- Self-hosted variable fonts, `font-optical-sizing: auto` set globally.
- `text-wrap: balance` on headings / `pretty` on body already applied.
- `tabular-nums` already scoped to data-bearing elements (SKU/price/amount/total class-name heuristic, plus `code`/`pre`/`kbd`/`samp`).
- Negative tracking at display sizes (`-0.03em` desktop / `-0.02em` mobile on headings), neutral-to-tight tracking on body (`-0.005em`) — matches the "confident negative tracking at display, never positive on body" criterion above.
- Gaps worth checking against current source before assuming fixed: `font-kerning: normal` may not be globally set (verify — a one-line, zero-risk addition if missing); whether a documented ratio-based type scale actually exists or headings are sized ad-hoc per component (verify in the actual page/component CSS, don't assume); whether `oldstyle-nums` for prose is relevant at all (skip if the site still has no long-form prose surface — check `dtb-seo`'s findings on this before adding it).

If a redesign, rebrand, or trend-driven refresh is actually being considered, treat the above as the *current answer*, not the *only acceptable answer* — evaluate a proposed change against the criteria section, not against "does it match what's already there."

## Rules that stay true regardless of which fonts are chosen

These are durable, not tied to Geist/Nunito specifically — apply them to whatever typographic system is live at the time. This is the concrete, numeric layer beneath the evaluation criteria above — treat both together, not the criteria as a replacement for these specifics:

**Base sizing and scale**
- Body text first: everything else derives from it. Body size 16-20px for web, `line-height` 1.3-1.45 as a unitless value, measure (line length) capped around 65ch or 45-90 characters per line — never a body text container wider than ~90 characters.
- Build the type scale from that base with consistent 1.2-1.5x ratio steps, not arbitrary per-component sizes — e.g. an 18px base at 1.25 gives body 18px / H3 22px / H2 28px / H1 36px. Whatever the actual base and ratio are, they should be traceable, not guessed per component.
- Max 3 heading levels in practice; if a design seems to need H4+, that's usually a sign the content should be restructured, not a case for a 4th type-scale step.

**Font selection**
- Never default to Arial, Helvetica, Times New Roman, or bare `system-ui` without an explicit, stated reason — an unintentional system-stack default is the single fastest way typography reads as an afterthought rather than a deliberate choice.
- Pair by contrast (see evaluation criteria above), max 2-3 families total.
- Prefer faces with a generous x-height, open counters, and clearly distinct `Il1`/`O0` letterforms — these read as sharp/legible at both small UI sizes and large display sizes; a face that's ambiguous at those characters will always feel slightly less polished regardless of style. When evaluating candidate fonts (via `market-intelligence-analyst` for current options, or a direct pick), check this before checking how trendy it looks.
- Quality free/open options worth knowing as a baseline reference point (not a mandate — verify current availability/licensing before use): Source Serif, IBM Plex (family), Literata, Charter, Inter (as a headings-only option). Treat this list as a floor for "acceptable quality," not a ceiling on what's allowed.

**Font loading**
- `font-display: swap` on every custom font declaration, no exceptions.
- Preload the body font specifically (`<link rel="preload" as="font" type="font/woff2" crossorigin>`) since it's almost always the LCP-relevant text on a content-heavy page.
- WOFF2 only for web delivery; subset to the actually-used character range where the tooling supports it.
- Variable fonts whenever 2+ weights/styles are needed from the same family, rather than separate static files per weight.
- A metrics-matched system-font fallback in the stack to minimize layout shift (CLS) during the swap window.

**Responsive behavior**
- Fluid sizing via `clamp()` (e.g. `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)` for body) is the sharp, modern default where continuous scaling is wanted — but never use a bare `vw` unit alone for font-size: it breaks user browser-zoom and is an accessibility violation, not just a style preference.
- Line length should drive where breakpoints fall for typographic containers, not the reverse.
- Verify any new typographic component at both a true small-mobile width (~320-390px) and a large-desktop width (~1440px) before considering it done — a scale that only looks right at the viewport it was designed in isn't finished.

**CSS properties to apply (font-agnostic, always correct regardless of typeface choice)**
- `font-kerning: normal` — always on.
- `font-variant-numeric: tabular-nums` on data/number columns; `oldstyle-nums` for long-form prose specifically (skip if there's no long-form prose surface to apply it to — check before adding speculatively).
- `text-wrap: balance` on headings, `text-wrap: pretty` on body text.
- `font-optical-sizing: auto` for variable fonts.
- `hyphens: auto` paired with a correct `lang` attribute on `<html>` wherever justified or tightly-measured text needs it — the `lang` attribute is what makes the hyphenation dictionary resolve correctly, so the two travel together.
- `letter-spacing` in the `0.05-0.12em` positive range only on `text-transform: uppercase` elements (small labels/eyebrows/badges) — never on lowercase body text, and never omitted entirely on an uppercase treatment (untracked uppercase text reads as a mistake, not a style).

**Spacing mechanics**
- Paragraph spacing via `margin-bottom` equal to one line-height; no first-line indent on the web.
- Headings: space-above at least 2x space-below, so a heading visually associates with the content it introduces rather than floating ambiguously between two blocks.
- Bold, not italic, for heading emphasis; subtle size increases (the 1.2-1.5x scale steps above), never a jarring 2x jump between adjacent heading levels.

**Structural rules**
- Pair faces by genuine contrast (structural role or formal character), never stack two similar faces.
- Keep the total family count small (two is usually enough; a third face needs a real, distinct job, not just variety).
- Never add positive `letter-spacing` to lowercase body/paragraph text.
- Never center-align body paragraph text — left-align for readability.
- Always use unitless `line-height`.
- Route font-family through CSS custom properties (whatever they're currently named — check `global-typography.css` for the live names) rather than hardcoding a font-family string inline, so a future typography change is a single-file edit, not a site-wide find/replace.
- Always include a metrics-matched system-font fallback stack, not just the primary custom font, regardless of which font is chosen.

## When actually generating typography CSS/Tailwind code

Whatever the chosen font(s), a complete typography implementation delivers:
1. Font loading strategy (self-hosted `@font-face`/package import, or a `display=swap` web-font link) matching the Font Loading rules above.
2. Base typography custom properties (font-body/font-heading equivalents, base size, base line-height, measure/max-width) — named to match whatever is already live in `global-typography.css` rather than introducing a parallel naming scheme.
3. The type scale (H1-H3 + body + small/caption), derived from the ratio, not picked ad hoc.
4. Responsive `clamp()` values where fluid sizing is the right call, per the Responsive Behavior rules above.
5. Utility classes or direct styles for the special cases: uppercase/tracked labels, tabular numbers, balanced headings — matching the CSS Properties rules above.
