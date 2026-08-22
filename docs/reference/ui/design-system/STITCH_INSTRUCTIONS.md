Create Drywall Toolbox screens as a coherent extension of the uploaded `DESIGN.md`, not as a rebrand.

Use the official logo, single-family Geist typography, white commerce surfaces, deep navy shell, brand blue `#2255EE`, compact professional density, fluid spacing, and the exact action hierarchy in the design document. Favor clear product identity, technical identifiers, compatibility, price, availability, shipping context, and direct actions over decorative marketing.

Generate responsive desktop and mobile variants from the same information architecture. Include realistic loading, empty, error, disabled, pending, and success states where relevant. Meet WCAG AA, use visible keyboard focus, 44px minimum targets, semantic patterns, safe-area-aware mobile sheets, and reduced-motion-compatible behavior.

For commerce screens, preserve the architecture: React presents; WooCommerce owns cart, checkout, totals, shipping, tax, orders, and refunds; payment providers own payment fields, wallets, authentication, and confirmation. Never invent provider controls, payment availability, stock claims, free-shipping claims, or a second checkout/order flow. Keep checkout to one native field set, one payment state, and one submission action.

Before finalizing a screen, check it against the component inventory and generation guardrails. Do not introduce a second palette, font, spacing scale, breakpoint system, global stepper, bottom navigation, or generic dashboard aesthetic.

