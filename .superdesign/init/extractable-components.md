# Extractable components

## StorefrontHeader
- Source: `frontend/src/components/storefront/StorefrontHeader.jsx`
- Category: layout
- Description: Responsive logo, navigation, catalog search, account, and cart header.
- Extractable props: `hasTopTicker`
- Hardcoded: logo asset, navigation labels, search and account/cart icons.

## StorefrontDesktopNavigation
- Source: `frontend/src/components/storefront/StorefrontDesktopNavigation.jsx`
- Category: layout
- Description: Desktop navigation with animated underlines and mega-menu triggers.
- Extractable props: active route and open menu state.
- Hardcoded: navigation labels and icon set.

## AddToCartButton
- Source: `frontend/src/components/ui/AddToCartButton.jsx`
- Category: basic
- Description: Branded responsive cart action with optimistic checkmark feedback.
- Extractable props: `label`, `state`, `size`, `disabled`, `cartAction`.
- Hardcoded: cart icon, checkmark path, brand gradient, motion.

## ProductMediaGallery
- Source: `frontend/src/components/product/ProductMediaGallery.jsx`
- Category: basic
- Description: Main product image, carousel arrows, zoom, and thumbnails.
- Extractable props: images and selected index.
- Hardcoded: icon metaphors and gallery geometry.

## ProductPurchasePanel
- Source: `frontend/src/components/product/ProductPurchasePanel.jsx`
- Category: basic
- Description: Quantity, add-to-cart, and provider-aware Checkout Now controls.
- Extractable props: quantity, availability, variation state, pending states.
- Hardcoded: button order and purchase hierarchy.
