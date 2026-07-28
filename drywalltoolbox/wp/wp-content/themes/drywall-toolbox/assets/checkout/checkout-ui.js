( function () {
	'use strict';

	/**
	 * Theme-owned checkout presentation controller.
	 *
	 * WooCommerce Checkout Block remains the only owner of customer/address data,
	 * shipping, tax, totals, validation, payment selection, order creation, and
	 * submission. This controller performs read-only classification, accessibility
	 * focus management, login-route handoff, and busy-state presentation only.
	 */

	const checkoutSelector = '.wc-block-checkout';
	const paymentRootSelector = '.wp-block-woocommerce-checkout-payment-block, .wc-block-checkout__payment-method';
	const loginSelector = [
		'a[href*="/my-account/"]',
		'a[href*="my-account?"]',
		'.wc-block-components-checkout-step__login-prompt a',
	].join( ', ' );
	const errorSelector = [
		'.wc-block-components-notice-banner.is-error',
		'.wc-block-components-validation-error',
		'.wc-block-store-notice.is-error',
		'.woocommerce-error[role="alert"]',
	].join( ', ' );
	const providerControlSelector = [
		'iframe[name^="__privateStripeFrame"]',
		'.wc-stripe-upe-element iframe',
		'.wcstripe-payment-element iframe',
		'.StripeElement iframe',
		'.wc-block-components-express-payment button:not([disabled])',
		'.wc-block-components-express-payment iframe',
	].join( ', ' );

	const storefrontBasePath = ( () => {
		const params = new URLSearchParams( window.location.search || '' );
		const candidate = String( params.get( 'dtb_storefront_base_path' ) || '' ).replace( /\/+$/, '' );
		return /^\/staging\/[A-Za-z0-9_-]+$/.test( candidate ) ? candidate : '';
	} )();
	const storefrontLoginUrl = `${ storefrontBasePath }/login?returnTo=%2Fcheckout`;

	let rootObserver = null;
	let mountObserver = null;
	let bodyObserver = null;
	let commerceUnsubscribe = null;
	let observedRoot = null;
	let reconcileQueued = false;
	let lastCommerceSignature = '';
	let lastErrorSignature = '';

	function checkoutRoot() {
		return document.querySelector( checkoutSelector );
	}

	function callSelector( store, method, fallback ) {
		try {
			return store && typeof store[ method ] === 'function' ? store[ method ]() : fallback;
		} catch {
			return fallback;
		}
	}

	function commerceSnapshot() {
		try {
			const data = window.wp?.data;
			const blocks = window.wc?.wcBlocksData;
			if ( ! data?.select || ! blocks?.cartStore ) {
				return { available: false, busy: false };
			}

			const cart = data.select( blocks.cartStore );
			const checkout = blocks.checkoutStore ? data.select( blocks.checkoutStore ) : null;
			const cartMeta = callSelector( cart, 'getCartMeta', {} ) || {};
			const busy = Boolean(
				callSelector( checkout, 'isCalculating', false )
				|| callSelector( checkout, 'isProcessing', false )
				|| callSelector( checkout, 'isBeforeProcessing', false )
				|| callSelector( checkout, 'isAfterProcessing', false )
				|| cartMeta.updatingCustomerData
				|| cartMeta.updatingSelectedRate
				|| cartMeta.updatingCart
			);

			return {
				available: true,
				busy,
				totals: callSelector( cart, 'getCartTotals', {} ) || {},
				customer: callSelector( cart, 'getCustomerData', {} ) || {},
				needsShipping: Boolean( callSelector( cart, 'getNeedsShipping', true ) ),
				hasCalculatedShipping: Boolean( callSelector( cart, 'getHasCalculatedShipping', false ) ),
			};
		} catch {
			return { available: false, busy: false };
		}
	}

	function directGatewayOptions( radioControl ) {
		const direct = Array.from( radioControl.children ).filter( ( node ) =>
			node.matches?.( '.wc-block-components-radio-control__option, .wc-block-components-radio-control-accordion-option' )
		);
		if ( direct.length > 0 ) {
			return direct;
		}

		return Array.from( radioControl.querySelectorAll( 'input[type="radio"]' ) )
			.map( ( input ) => input.closest( '.wc-block-components-radio-control__option, .wc-block-components-radio-control-accordion-option' ) )
			.filter( ( node, index, nodes ) =>
				node
				&& nodes.indexOf( node ) === index
				&& node.closest( '.wc-block-components-radio-control' ) === radioControl
			);
	}

	function classifyPaymentSurface( root ) {
		root.querySelectorAll( `${ paymentRootSelector } .wc-block-components-radio-control` ).forEach( ( radioControl ) => {
			const singleGateway = directGatewayOptions( radioControl ).length === 1;
			radioControl.classList.toggle( 'is-dtb-single-gateway', singleGateway );
			radioControl.closest( '.wc-block-components-payment-methods' )
				?.classList.toggle( 'is-dtb-single-gateway-set', singleGateway );
		} );

		const providerReady = Boolean( root.querySelector( providerControlSelector ) );
		document.body.classList.toggle( 'dtb-checkout-provider-ready', providerReady );
	}

	function bindLoginLink( link ) {
		if ( ! ( link instanceof HTMLAnchorElement ) ) {
			return;
		}

		link.href = storefrontLoginUrl;
		link.dataset.dtbStorefrontLogin = '1';
		if ( link.dataset.dtbStorefrontLoginBound === '1' ) {
			return;
		}

		link.dataset.dtbStorefrontLoginBound = '1';
		link.addEventListener( 'click', ( event ) => {
			if ( event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ) {
				return;
			}
			event.preventDefault();
			window.location.assign( storefrontLoginUrl );
		} );
	}

	function rewriteLoginLinks( root ) {
		root.querySelectorAll( loginSelector ).forEach( bindLoginLink );
	}

	function isVisible( element ) {
		return element instanceof HTMLElement
			&& ! element.hidden
			&& element.getClientRects().length > 0
			&& window.getComputedStyle( element ).visibility !== 'hidden';
	}

	function focusNewestError( root ) {
		const errors = Array.from( root.querySelectorAll( errorSelector ) ).filter( isVisible );
		if ( errors.length === 0 ) {
			document.body.classList.remove( 'dtb-checkout-has-error' );
			lastErrorSignature = '';
			return;
		}

		document.body.classList.add( 'dtb-checkout-has-error' );
		const error = errors[ errors.length - 1 ];
		const signature = String( error.textContent || '' ).replace( /\s+/g, ' ' ).trim().slice( 0, 500 );
		if ( ! signature || signature === lastErrorSignature ) {
			return;
		}

		lastErrorSignature = signature;
		if ( ! error.hasAttribute( 'tabindex' ) ) {
			error.setAttribute( 'tabindex', '-1' );
		}

		window.requestAnimationFrame( () => {
			const reducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
			error.scrollIntoView( { behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' } );
			error.focus( { preventScroll: true } );
		} );
	}

	function updateBusyState( root, snapshot = commerceSnapshot() ) {
		const busy = Boolean( snapshot.busy );
		const busyValue = busy ? 'true' : 'false';
		const runtimeValue = snapshot.available ? 'ready' : 'waiting';
		document.body.classList.toggle( 'dtb-checkout-is-busy', busy );
		if ( root.getAttribute( 'aria-busy' ) !== busyValue ) {
			root.setAttribute( 'aria-busy', busyValue );
		}
		if ( root.dataset.dtbCheckoutRuntime !== runtimeValue ) {
			root.dataset.dtbCheckoutRuntime = runtimeValue;
		}
	}

	function reconcile() {
		reconcileQueued = false;
		const root = checkoutRoot();
		if ( ! root ) {
			return;
		}

		if ( root !== observedRoot ) {
			bindRootObserver( root );
		}

		document.body.classList.add( 'dtb-checkout-enhanced' );
		rewriteLoginLinks( root );
		classifyPaymentSurface( root );
		updateBusyState( root );
		focusNewestError( root );
	}

	function queueReconcile() {
		if ( reconcileQueued ) {
			return;
		}
		reconcileQueued = true;
		window.requestAnimationFrame( reconcile );
	}

	function bindRootObserver( root ) {
		rootObserver?.disconnect();
		mountObserver?.disconnect();
		bodyObserver?.disconnect();
		bodyObserver = null;
		observedRoot = root;

		rootObserver = new MutationObserver( queueReconcile );
		rootObserver.observe( root, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: [ 'class', 'aria-invalid', 'role' ],
		} );

		if ( root.parentElement ) {
			mountObserver = new MutationObserver( queueReconcile );
			mountObserver.observe( root.parentElement, { childList: true } );
		}
	}

	function bindCommerceStore() {
		if ( commerceUnsubscribe || ! window.wp?.data?.subscribe || ! window.wc?.wcBlocksData?.cartStore ) {
			return;
		}

		commerceUnsubscribe = window.wp.data.subscribe( () => {
			const snapshot = commerceSnapshot();
			const totals = snapshot.totals || {};
			const shipping = snapshot.customer?.shippingAddress || snapshot.customer?.shipping_address || {};
			const signature = JSON.stringify( [
				snapshot.available,
				snapshot.busy,
				snapshot.needsShipping,
				snapshot.hasCalculatedShipping,
				totals.total_shipping,
				totals.total_tax,
				totals.total_price,
				shipping.country,
				shipping.state,
				shipping.postcode,
			] );
			if ( signature === lastCommerceSignature ) {
				return;
			}
			lastCommerceSignature = signature;
			queueReconcile();
		} );
	}

	function initialize() {
		bindCommerceStore();
		bodyObserver = new MutationObserver( () => {
			if ( checkoutRoot() ) {
				queueReconcile();
			}
		} );
		bodyObserver.observe( document.body, { childList: true, subtree: true } );
		queueReconcile();
		window.setTimeout( queueReconcile, 250 );
		window.setTimeout( queueReconcile, 1000 );
	}

	function cleanup() {
		rootObserver?.disconnect();
		mountObserver?.disconnect();
		bodyObserver?.disconnect();
		if ( typeof commerceUnsubscribe === 'function' ) {
			commerceUnsubscribe();
		}
	}

	window.addEventListener( 'pagehide', cleanup, { once: true } );
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	} else {
		initialize();
	}
} )();
