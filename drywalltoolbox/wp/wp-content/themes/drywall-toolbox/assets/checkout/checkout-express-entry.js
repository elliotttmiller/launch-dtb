( function () {
	'use strict';

	/**
	 * Product express-checkout handoff presentation.
	 *
	 * The React product surface adds the selected product to the authoritative
	 * WooCommerce Store API cart, then performs a full-document navigation here.
	 * This script only brings the official WooCommerce Stripe Express Checkout
	 * block into view. It never creates, mounts, replaces, or confirms payment
	 * elements and never reads provider iframe contents.
	 */

	const queryKey = 'dtb_express';
	const storageKey = 'dtb:checkout-express-entry:v1';
	const handoffTtlMs = 2 * 60 * 1000;
	const readinessTimeoutMs = 10000;
	const selectors = [
		'.wp-block-woocommerce-checkout-express-payment-block',
		'.wc-block-components-express-payment',
		'[data-block-name="woocommerce/checkout-express-payment-block"]',
	];
	const providerSelectors = [
		'iframe',
		'button',
		'[role="button"]',
		'.wc-block-components-express-payment__event-buttons',
		'.wc-block-components-express-payment__content',
	];
	const requestedByQuery = new URLSearchParams( window.location.search || '' ).get( queryKey ) === '1';
	let requestedByStorage = false;

	try {
		const requestedAt = Number( window.sessionStorage.getItem( storageKey ) || 0 );
		const age = Date.now() - requestedAt;
		requestedByStorage = Number.isFinite( requestedAt )
			&& requestedAt > 0
			&& age >= 0
			&& age <= handoffTtlMs;
		window.sessionStorage.removeItem( storageKey );
	} catch {
		requestedByStorage = false;
	}

	if ( ! requestedByQuery && ! requestedByStorage ) {
		return;
	}

	let observer = null;
	let settled = false;
	let timeoutId = 0;

	function cleanUrl() {
		try {
			const url = new URL( window.location.href );
			url.searchParams.delete( queryKey );
			window.history.replaceState( window.history.state, '', `${ url.pathname }${ url.search }${ url.hash }` );
		} catch {
			// Query cleanup is non-critical.
		}
	}

	function findSurface() {
		for ( const selector of selectors ) {
			const node = document.querySelector( selector );
			if ( node ) return node;
		}
		return null;
	}

	function providerSurfaceReady( surface ) {
		if ( ! surface || surface.getAttribute( 'aria-busy' ) === 'true' ) return false;
		return providerSelectors.some( ( selector ) => surface.querySelector( selector ) );
	}

	function finish( surface ) {
		if ( settled || ! surface || ! providerSurfaceReady( surface ) ) return;
		settled = true;
		observer?.disconnect();
		if ( timeoutId ) window.clearTimeout( timeoutId );

		document.body.classList.add( 'dtb-checkout-express-entry' );
		surface.dataset.dtbExpressEntry = '1';
		surface.setAttribute( 'tabindex', '-1' );
		cleanUrl();

		window.requestAnimationFrame( () => {
			const reducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
			surface.scrollIntoView( {
				behavior: reducedMotion ? 'auto' : 'smooth',
				block: 'center',
			} );
			try {
				surface.focus( { preventScroll: true } );
			} catch {
				surface.focus();
			}
			window.dispatchEvent( new CustomEvent( 'dtb:checkout-express-entry-ready' ) );
		} );
	}

	function reconcile() {
		finish( findSurface() );
	}

	function failOpen() {
		if ( settled ) return;
		settled = true;
		observer?.disconnect();
		cleanUrl();
		document.body.classList.add( 'dtb-checkout-express-entry-unavailable' );
		window.dispatchEvent( new CustomEvent( 'dtb:checkout-express-entry-unavailable' ) );
	}

	function initialize() {
		reconcile();
		if ( settled ) return;

		observer = new MutationObserver( reconcile );
		observer.observe( document.body, {
			attributes: true,
			attributeFilter: [ 'aria-busy', 'class' ],
			childList: true,
			subtree: true,
		} );
		timeoutId = window.setTimeout( failOpen, readinessTimeoutMs );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	} else {
		initialize();
	}
} )();
