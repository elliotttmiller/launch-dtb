# Key page dependency trees

## `/products/:slug` Product detail

Entry: `frontend/src/pages/ProductDetailPage.jsx`

- `frontend/src/components/shell/Header.jsx`
  - `frontend/src/components/storefront/StorefrontHeader.jsx`
    - `frontend/src/components/storefront/StorefrontDesktopNavigation.jsx`
    - `frontend/src/components/storefront/StorefrontCatalogAutocomplete.jsx`
    - `frontend/src/components/storefront/StorefrontMobileDrawer.jsx`
- `frontend/src/components/product/ProductDetail.jsx`
  - `frontend/src/components/product/ProductMediaGallery.jsx`
  - `frontend/src/components/product/ProductPurchasePanel.jsx`
    - `frontend/src/components/ui/AddToCartButton.jsx`
    - `frontend/src/components/product/ProductBuyNow.jsx`
  - `frontend/src/components/product/ProductDetailTabs.jsx`
  - `frontend/src/components/product/ProductVariationRail.jsx`
  - `frontend/src/components/product/ProductAvailabilityNotice.jsx`
- `frontend/src/styles/product-detail-modern.css`
- `frontend/src/styles/add-to-cart-button.css`
- `frontend/src/styles/storefront-header.css`
- `frontend/src/styles/global-typography.css`

## `/` Home

Entry: `frontend/src/pages/Home.jsx`

- `frontend/src/components/shell/Header.jsx`
- `frontend/src/components/storefront/StorefrontHero.jsx`
- `frontend/src/components/storefront/StorefrontProductRail.jsx`
- `frontend/src/components/storefront/StorefrontProductTile.jsx`

## `/products`

Entry: `frontend/src/pages/Products.jsx`

- `frontend/src/components/shell/Header.jsx`
- `frontend/src/components/storefront/StorefrontProductTile.jsx`
- `frontend/src/components/product/ProductDetail.jsx`
