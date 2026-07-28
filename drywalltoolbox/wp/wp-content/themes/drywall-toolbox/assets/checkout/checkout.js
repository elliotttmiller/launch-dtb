/**
 * Drywall Toolbox — native checkout step-rail progress (presentation only).
 *
 * Watches which native WooCommerce Checkout Block step is in view and updates
 * the visual step-rail markers rendered in native-checkout.php. This script
 * never queries into, clones, moves, or reads values from Woo/Stripe form
 * fields — it only observes step section boundaries by DOM position and
 * toggles `data-state` on its own header markup. If the expected step
 * sections are not found (a Woo Blocks markup change, a different checkout
 * layout), it exits without altering anything.
 *
 * Handle: dtb-checkout (see functions.php dtb_enqueue_native_checkout_assets()).
 */
( function () {
	'use strict';

	if ( typeof window === 'undefined' || ! window.IntersectionObserver ) {
		return;
	}

	document.addEventListener( 'DOMContentLoaded', init );

	function init() {
		var rail = document.querySelector( '.dtb-checkout__steps' );
		if ( ! rail ) {
			return;
		}

		var markers = Array.prototype.slice.call( rail.querySelectorAll( '.dtb-checkout__step' ) );
		if ( ! markers.length ) {
			return;
		}

		var sectionSelectors = [
			'.wc-block-checkout__contact-fields',
			'.wc-block-checkout__shipping-fields',
			'.wc-block-checkout__shipping-method',
			'.wc-block-checkout__payment-method',
		];

		var sections = sectionSelectors
			.map( function ( selector ) {
				var el = document.querySelector( selector );
				return el ? el.closest( '.wc-block-components-checkout-step' ) || el : null;
			} )
			.filter( Boolean );

		if ( ! sections.length ) {
			return;
		}

		var setState = function ( index ) {
			markers.forEach( function ( marker, i ) {
				marker.dataset.state = i < index ? 'done' : i === index ? 'active' : 'upcoming';
			} );
		};

		setState( 0 );

		var observer = new IntersectionObserver(
			function ( entries ) {
				entries.forEach( function ( entry ) {
					if ( ! entry.isIntersecting ) {
						return;
					}
					var sectionIndex = sections.indexOf( entry.target );
					if ( sectionIndex === -1 ) {
						return;
					}
					var markerIndex = Math.min( sectionIndex, markers.length - 1 );
					setState( markerIndex );
				} );
			},
			{ rootMargin: '-40% 0px -50% 0px', threshold: 0 }
		);

		sections.forEach( function ( section ) {
			observer.observe( section );
		} );
	}
} )();
