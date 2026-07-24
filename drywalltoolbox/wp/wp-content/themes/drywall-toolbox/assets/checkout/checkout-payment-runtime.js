( function () {
	'use strict';

	/**
	 * Narrow payment-step runtime hardening.
	 *
	 * This script never reads or mutates provider iframe contents and never selects a
	 * payment method. It only classifies the same-origin Woo gateway shell, removes
	 * DTB navigation overlap on the Payment step, and keeps provider mounts reachable.
	 */

	const paymentRootSelector = '.wp-block-woocommerce-checkout-payment-block, .wc-block-checkout__payment-method';
	let observer = null;
	let reconcileQueued = false;

	function unique( values ) {
		return Array.from( new Set( values.filter( Boolean ) ) );
	}

	function directGatewayOptions( radioControl ) {
		const direct = Array.from( radioControl.children ).filter( ( node ) =>
			node.matches?.( '.wc-block-components-radio-control__option, .wc-block-components-radio-control-accordion-option' )
		);
		if ( direct.length > 0 ) {
			return direct;
		}

		return unique(
			Array.from( radioControl.querySelectorAll( 'input[type="radio"]' ) )
				.map( ( input ) => input.closest( '.wc-block-components-radio-control__option, .wc-block-components-radio-control-accordion-option' ) )
		).filter( ( node ) => node && node.closest( '.wc-block-components-radio-control' ) === radioControl );
	}

	function classifySingleGateway() {
		document.querySelectorAll( `${ paymentRootSelector } .wc-block-components-radio-control` ).forEach( ( radioControl ) => {
			const single = directGatewayOptions( radioControl ).length === 1;
			radioControl.classList.toggle( 'is-dtb-single-gateway', single );
			const methods = radioControl.closest( '.wc-block-components-payment-methods' );
			methods?.classList.toggle( 'is-dtb-single-gateway-set', single );
		} );
	}

	function hardenPaymentMounts() {
		document.querySelectorAll( paymentRootSelector ).forEach( ( paymentRoot ) => {
			paymentRoot.removeAttribute( 'inert' );
			if ( document.body.classList.contains( 'dtb-checkout-step-payment' ) ) {
				paymentRoot.removeAttribute( 'aria-hidden' );
			}
			paymentRoot.querySelectorAll( 'iframe' ).forEach( ( frame ) => {
				frame.style.pointerEvents = 'auto';
				frame.style.touchAction = 'auto';
			} );
		} );
	}

	function removePaymentStepOverlay() {
		if ( ! document.body.classList.contains( 'dtb-checkout-step-payment' ) ) {
			return;
		}
		const actionBar = document.querySelector( '.dtb-mobile-checkout-actions' );
		if ( actionBar ) {
			actionBar.hidden = true;
			actionBar.setAttribute( 'aria-hidden', 'true' );
		}
	}

	function reconcile() {
		reconcileQueued = false;
		classifySingleGateway();
		hardenPaymentMounts();
		removePaymentStepOverlay();
	}

	function queueReconcile() {
		if ( reconcileQueued ) {
			return;
		}
		reconcileQueued = true;
		window.requestAnimationFrame( reconcile );
	}

	function initialize() {
		observer = new MutationObserver( queueReconcile );
		observer.observe( document.body, {
			attributes: true,
			attributeFilter: [ 'class' ],
			childList: true,
			subtree: true,
		} );
		queueReconcile();
		window.setTimeout( queueReconcile, 250 );
		window.setTimeout( queueReconcile, 1000 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	} else {
		initialize();
	}
} )();
