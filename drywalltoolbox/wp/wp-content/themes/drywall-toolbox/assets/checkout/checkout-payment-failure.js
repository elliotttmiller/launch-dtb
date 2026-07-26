( function () {
	'use strict';

	const noticeSelector = [
		'.wc-block-components-notice-banner.is-error',
		'.wc-block-components-notice-banner[role="alert"]',
		'.woocommerce-error[role="alert"]',
		'.wc-block-store-notice.is-error',
	].join( ', ' );

	const paymentRootSelector = '.wp-block-woocommerce-checkout-payment-block, .wc-block-checkout__payment-method';
	const recoveryId = 'dtb-checkout-payment-recovery';
	let observer = null;
	let reconcileQueued = false;
	let lastFailureSignature = '';

	function normalizeText( value ) {
		return String( value || '' ).replace( /\s+/g, ' ' ).trim();
	}

	function isPaymentFailure( message ) {
		const value = normalizeText( message ).toLowerCase();
		if ( ! value ) {
			return false;
		}

		const paymentTerms = [ 'payment', 'card', 'stripe', 'declin', 'insufficient', 'cvc', 'cvv', 'expired', 'authentication' ];
		const failureTerms = [ 'failed', 'declin', 'not approved', 'could not', 'unable', 'incorrect', 'invalid', 'insufficient', 'expired', 'cancelled', 'canceled' ];

		return paymentTerms.some( ( term ) => value.includes( term ) )
			&& failureTerms.some( ( term ) => value.includes( term ) );
	}

	function currentPaymentFailure() {
		return Array.from( document.querySelectorAll( noticeSelector ) )
			.map( ( notice ) => ( {
				notice,
				message: normalizeText( notice.textContent ),
			} ) )
			.find( ( item ) => isPaymentFailure( item.message ) ) || null;
	}

	function recoveryNotice() {
		let notice = document.getElementById( recoveryId );
		if ( notice ) {
			return notice;
		}

		notice = document.createElement( 'section' );
		notice.id = recoveryId;
		notice.className = 'dtb-checkout-payment-recovery';
		notice.setAttribute( 'role', 'alert' );
		notice.setAttribute( 'aria-live', 'assertive' );
		notice.setAttribute( 'aria-atomic', 'true' );
		notice.tabIndex = -1;
		notice.innerHTML = [
			'<div class="dtb-checkout-payment-recovery__icon" aria-hidden="true">!</div>',
			'<div class="dtb-checkout-payment-recovery__content">',
			'<h2>Payment wasn\'t approved</h2>',
			'<p>No order was placed. Your checkout details are still here. Review your payment method and try again.</p>',
			'</div>',
		].join( '' );

		return notice;
	}

	function insertRecoveryNotice( paymentRoot ) {
		const notice = recoveryNotice();
		if ( notice.isConnected ) {
			return notice;
		}

		paymentRoot.parentNode?.insertBefore( notice, paymentRoot );
		return notice;
	}

	function showFailure( failure ) {
		const paymentRoot = document.querySelector( paymentRootSelector );
		if ( ! paymentRoot ) {
			return;
		}

		const signature = normalizeText( failure.message );
		const notice = insertRecoveryNotice( paymentRoot );
		document.body.classList.add( 'dtb-checkout-payment-failed' );
		paymentRoot.removeAttribute( 'inert' );
		paymentRoot.removeAttribute( 'aria-hidden' );

		if ( signature !== lastFailureSignature ) {
			lastFailureSignature = signature;
			window.requestAnimationFrame( () => {
				notice.focus( { preventScroll: true } );
				notice.scrollIntoView( { behavior: 'smooth', block: 'center' } );
			} );
		}
	}

	function clearFailureWhenResolved() {
		if ( currentPaymentFailure() ) {
			return;
		}

		const notice = document.getElementById( recoveryId );
		if ( notice ) {
			notice.remove();
		}
		document.body.classList.remove( 'dtb-checkout-payment-failed' );
		lastFailureSignature = '';
	}

	function reconcile() {
		reconcileQueued = false;
		const failure = currentPaymentFailure();
		if ( failure ) {
			showFailure( failure );
			return;
		}
		clearFailureWhenResolved();
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
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: [ 'class', 'role' ],
		} );

		queueReconcile();
		window.setTimeout( queueReconcile, 500 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	} else {
		initialize();
	}
} )();
