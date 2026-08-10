# Drywall Toolbox — Product Overview

## Purpose & Value Proposition
Drywall Toolbox (DTB) is a headless ecommerce platform purpose-built for professional drywall contractors. It sells professional-grade drywall finishing tools and parts from brands like Columbia Taping Tools, TapeTech, Level5, Platinum, Dura-Stilts, Asgard, SurPro, and Graco.

The platform differentiates through contractor-focused features: tool repair services, parts schematics with interactive hotspots, toolset builder, and a professional account dashboard — not just a generic storefront.

## Key Features & Capabilities

### Storefront
- Product catalog with faceted search, brand/category filtering, and variation selection
- Product detail pages with technical specifications, schematic diagrams, and compatible parts
- Category landing pages with hero images
- Toolset builder for curating contractor tool kits

### Checkout & Payments
- WooCommerce-native checkout embedded in the React SPA via iframe/block bridge
- Stripe payment processing with express checkout (Apple Pay, Google Pay, Affirm, Afterpay, Klarna)
- Guest and authenticated checkout flows
- Failed payment recovery

### Customer Account
- JWT-authenticated account dashboard with tabs: orders, repairs, returns, rewards, addresses, settings
- Order tracking with real-time event stream (SSE)
- Return portal with status tracking
- Support ticket system with customer-facing status

### Repair Service
- Multi-step repair submission workflow (tool selection → package → shipping quote → submit)
- Repair status tracking with event timeline
- Admin repair queue with SLA tracking

### Schematics
- Interactive tool schematics with part hotspots
- Parts lookup and compatible parts resolution
- Brand-organized schematic library

### Visual Designer
- Admin-facing design token editor for storefront surfaces (colors, typography, spacing)
- Draft/publish/rollback revision system
- Email studio for transactional email design
- Live preview via preview session auth

### Integrations
- Veeqo: inventory sync, fulfillment projection, order status polling
- QuickBooks: accounting pipeline, invoice sync, OAuth
- Amazon SP-API: order notifications, messaging
- eBay: fulfillment, messaging, OAuth

### Operations & Admin
- Custom WP admin shell with unified navigation
- Deployment control center (GitHub release management via webhook)
- Cache management tools (SiteGround optimizer integration)
- System health dashboard with dependency checks
- Launch readiness test suite (Python, Selenium)

## Target Users
- **Customers**: Professional drywall contractors purchasing tools, parts, and repair services
- **Admins**: Store operators managing orders, repairs, returns, inventory, and integrations
- **Developers**: Full-stack team maintaining the headless React + WordPress/WooCommerce architecture
