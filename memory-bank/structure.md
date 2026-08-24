# Drywall Toolbox — Structure Summary

Status: derived context. Active implementation and `AGENTS.md` outrank this file.

Primary repository areas:

```text
frontend/                              React storefront source
drywalltoolbox/wp/wp-content/mu-plugins/  DTB backend modules
drywalltoolbox/wp/wp-content/themes/      tracked WordPress theme integration
products/                              canonical catalog/taxonomy/compatibility/media inputs
scripts/                               deterministic operational tooling
docs/                                  durable architecture/contracts
.agents/                               canonical model-neutral AI roles/skills/workflows/context
.claude/ .codex/ .github/copilot-instructions.md  assistant adapters only
```

The active MU-plugin composition root is `drywalltoolbox/wp/wp-content/mu-plugins/00-dtb-loader.php`; always read it for current module order. It currently includes `dtb-visual-designer` after `dtb-deployment`.

The React `/checkout` route performs full-document handoff to native WooCommerce checkout; it is not an iframe/embedded checkout bridge.

Exact route, module and file inventories are intentionally omitted here because active source is authoritative.
