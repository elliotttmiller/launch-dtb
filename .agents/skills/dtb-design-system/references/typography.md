# Typography Reference

Use typography to create hierarchy and readability, not decoration.

- Prefer no more than two primary font families with distinct functional roles.
- Use the active DTB font/token source rather than hardcoding family names in components.
- Body text must remain readable at mobile sizes with unitless line height and controlled measure.
- Use weight, size and spacing before ornamental treatments.
- Use tabular numerals where prices, SKUs, totals or aligned numeric comparison require it.
- Use `text-wrap: balance`/`pretty` where supported and appropriate.
- Preserve font loading performance and minimize layout shift; verify the actual build/font pipeline before prescribing preload/subsetting changes.
- Use bounded fluid type (`clamp`) only where continuous scaling solves a real problem; do not use unbounded viewport-only sizing.
- Validate at narrow phone, large desktop, 200% zoom and long-content states.

Current source is authoritative for active font families, token names and scale.
