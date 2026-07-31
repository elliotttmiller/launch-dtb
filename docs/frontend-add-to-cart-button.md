# Frontend add-to-cart button

`frontend/src/components/ui/AddToCartButton.jsx` is the authoritative React
button for storefront cart additions. Product cards, catalog autocomplete,
product detail and quick-view purchase panels, schematic part cards, and
toolset builders must use this component instead of defining another
add-to-cart button.

## Ownership

- `AddToCartButton` owns visual structure, size variants, accessible pending
  state, and the cart-to-check transition.
- `CartContext` remains the cart authority and dispatches
  `dtb:cart-add-success` or `dtb:cart-add-failure`.
- `CartInteractionFeedback` synchronizes uncontrolled buttons with the
  optimistic cart mutation. It announces success only after the Store API
  mutation succeeds and clears the optimistic visual state on failure.
- Product and page components continue to own product selection, variation
  requirements, quantity, and error presentation.

## Variants and states

- `compact`: autocomplete and similarly constrained rows.
- `card`: product cards and schematic part cards.
- `default`: standard inline actions.
- `wide`: product purchase panels and full-width workflow actions.
- `idle`, `adding`, and `added` are the supported controlled states.

The visual success treatment is a standalone checkmark. Do not add a spinner,
progress ring, circular check container, or alternate cart animation.
`prefers-reduced-motion` must retain the final readable state without animated
transitions.

Variable products that require option selection are not cart mutations. Set
`cartAction={false}` for an Options control so it does not enter optimistic
cart feedback.
