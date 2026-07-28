/**
 * Drywall Toolbox — order summary line item SKU.
 *
 * Appends the item's SKU to its name in the checkout order summary via the
 * officially documented Cart and Checkout Blocks `itemName` filter
 * (`window.wc.blocksCheckout.registerCheckoutFilters`). This does not touch
 * the DOM directly and does not duplicate or replace WooCommerce's own
 * rendering — it supplies the string WooCommerce itself renders for the
 * item name, for the checkout ("summary") context only.
 *
 * Reference: https://developer.woocommerce.com/docs/block-development/extensible-blocks/cart-and-checkout-blocks/filters-in-cart-and-checkout/cart-line-items/
 *
 * Handle: dtb-checkout-order-summary (see functions.php
 * dtb_enqueue_native_checkout_assets()). No-ops if the filter registry
 * or a given item's SKU isn't available.
 */
( function () {
	'use strict';

	var api = window.wc && window.wc.blocksCheckout;
	if ( ! api || typeof api.registerCheckoutFilters !== 'function' ) {
		return;
	}

	try {
		api.registerCheckoutFilters( 'dtb-order-summary-sku', {
			itemName: function ( defaultValue, extensions, args ) {
				var isCheckoutSummary = ! args || args.context !== 'cart';
				var sku = args && args.cartItem && args.cartItem.sku;
				if ( ! isCheckoutSummary || ! sku ) {
					return defaultValue;
				}
				return defaultValue + ' · SKU: ' + sku;
			},
		} );
	} catch ( e ) {
		// Filter registry shape changed or isn't ready; leave native rendering untouched.
	}
} )();
