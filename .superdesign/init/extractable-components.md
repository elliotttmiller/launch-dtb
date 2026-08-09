# Extractable components

## StorefrontHeader
- Source: `frontend/src/components/storefront/StorefrontHeader.jsx`
- Category: layout
- Description: shared commerce header with brand, navigation, search, account, and cart.
- Extractable props: current route/active navigation state, cart count, authentication state.
- Hardcoded: logo, navigation labels, icon choices, styling.

## HeroSection
- Source: `frontend/src/components/ui/HeroSection.jsx`
- Category: layout
- Description: centered homepage hero with headline, supporting copy, navigation carousel, and trusted brands.
- Extractable props: title, titleLines, subtitle, ctaLinks, brands, showCarousel, className.
- Hardcoded: visual atmosphere, motion timing, heading treatment.

## NavigationCarousel
- Source: `frontend/src/components/ui/NavigationCarousel.jsx`
- Category: basic
- Description: interactive carousel for major storefront destinations.
- Extractable props: active destination.
- Hardcoded: destinations, card labels, icons, motion geometry.

## TrustedBrands
- Source: `frontend/src/components/ui/TrustedBrands.jsx`
- Category: basic
- Description: looping logo strip.
- Extractable props: brands, title, speed, dark, transparent.
- Hardcoded: fade treatment and animation structure.
