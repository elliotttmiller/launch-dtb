( function () {
	'use strict';

	/**
	 * Native checkout -> storefront login handoff.
	 *
	 * WooCommerce may render a My Account login URL inside the Checkout Block. The
	 * storefront owns customer authentication, so checkout login must never enter the
	 * unstyled/native My Account document. This adapter rewrites and directly binds the
	 * rendered login control to the storefront login route, preserving a full-document
	 * return to /checkout after authentication.
	 */

	const params = new URLSearchParams( window.location.search || '' );
	const candidate = String( params.get( 'dtb_storefront_base_path' ) || '' ).replace( /\/+$/, '' );
	const storefrontBasePath = /^\/staging\/[A-Za-z0-9_-]+$/.test( candidate ) ? candidate : '';
	const loginUrl = `${ storefrontBasePath }/login?returnTo=%2Fcheckout`;
	const selector = [
		'a[href*="/my-account/"]',
		'a[href*="my-account?"]',
		'.wc-block-components-checkout-step__login-prompt a',
	].join( ', ' );

	let observer = null;
	let queued = false;

	function bindLoginLink( link ) {
		if ( ! ( link instanceof HTMLAnchorElement ) ) {
			return;
		}

		link.href = loginUrl;
		link.dataset.dtbStorefrontLogin = '1';
		if ( link.dataset.dtbStorefrontLoginBound === '1' ) {
			return;
		}

		link.dataset.dtbStorefrontLoginBound = '1';
		link.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			event.stopPropagation();
			window.location.assign( loginUrl );
		}, true );
	}

	function reconcile() {
		queued = false;
		document.querySelectorAll( selector ).forEach( bindLoginLink );
	}

	function queueReconcile() {
		if ( queued ) {
			return;
		}
		queued = true;
		window.requestAnimationFrame( reconcile );
	}

	function initialize() {
		observer = new MutationObserver( queueReconcile );
		observer.observe( document.body, { childList: true, subtree: true } );
		queueReconcile();
		window.setTimeout( queueReconcile, 250 );
		window.setTimeout( queueReconcile, 750 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	} else {
		initialize();
	}
} )();
