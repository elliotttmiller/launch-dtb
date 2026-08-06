/**
 * Drywall Toolbox — mobile checkout accordion (progressive enhancement only).
 *
 * The native WooCommerce Checkout Block remains the only checkout form and
 * order-creation surface. This script adds mobile-only accordion chrome around
 * the existing Contact, Shipping, and Payment block groups. It never clones,
 * moves, replaces, or unmounts a native field, payment control, wallet, iframe,
 * or submit button.
 *
 * Section membership is intentionally owned by classifyStepGroups() and the
 * real WordPress block identity classes emitted for WooCommerce Checkout
 * inner blocks. A missing Contact or Payment classification fails safe to the
 * unmodified single-scroll checkout.
 *
 * Handle: dtb-checkout (see functions.php dtb_enqueue_native_checkout_assets()).
 */
( function () {
	'use strict';

	var MOBILE_QUERY = '(max-width: 767px)';
	var PANEL_CLASS = 'dtb-checkout__accordion-panel';
	var COLLAPSED_ATTR = 'data-dtb-accordion-collapsed';
	var COMPLETE_ATTR = 'data-dtb-accordion-complete';
	var AUTO_ADVANCE_DELAY = 450;

	var STEPS = [
		{ id: 'contact', label: 'Contact', description: 'Email and contact details' },
		{ id: 'shipping', label: 'Shipping', description: 'Address and delivery method' },
		{ id: 'payment', label: 'Payment', description: 'Payment method and order review' },
	];

	var STEP_WRAPPER_SELECTOR = '.wc-block-components-checkout-step';

	// Keep this selector map as the sole grouping authority. These are the
	// real block identity classes emitted by WordPress for Woo Checkout blocks.
	var GROUP_SELECTORS = [
		[ '.wp-block-woocommerce-checkout-contact-information-block' ],
		[
			'.wp-block-woocommerce-checkout-shipping-address-block',
			'.wp-block-woocommerce-checkout-shipping-methods-block',
			'.wp-block-woocommerce-checkout-shipping-method-block',
			'.wp-block-woocommerce-checkout-pickup-options-block',
			'.wp-block-woocommerce-checkout-billing-address-block',
		],
		[
			'.wp-block-woocommerce-checkout-payment-block',
			'.wp-block-woocommerce-checkout-express-payment-block',
			'.wp-block-woocommerce-checkout-order-note-block',
			'.wp-block-woocommerce-checkout-terms-block',
			'.wp-block-woocommerce-checkout-actions-block',
		],
	];

	var mobileMedia = null;
	var accordion = null;
	var activeStep = 0;
	var completedSteps = [ false, false, false ];
	var observer = null;
	var reconcileScheduled = false;
	var storeUnsubscribe = null;
	var autoAdvanceTimer = null;
	var submitListenerAttached = false;

	function checkoutRoot() {
		return document.querySelector( '.wc-block-checkout__form' ) || document.querySelector( '.wc-block-checkout' );
	}

	/**
	 * Classify the checkout's existing section wrappers into conceptual steps.
	 * Do not add fallback-by-position logic here: a selector resolves or the
	 * progressive enhancement fails safe to WooCommerce's normal layout.
	 */
	function classifyStepGroups() {
		var root = checkoutRoot();
		var groups = [ [], [], [] ];
		if ( ! root ) {
			return groups;
		}

		GROUP_SELECTORS.forEach( function ( selectors, index ) {
			selectors.forEach( function ( selector ) {
				root.querySelectorAll( selector ).forEach( function ( inner ) {
					var node = inner.closest( STEP_WRAPPER_SELECTOR ) || inner;
					if ( groups[ index ].indexOf( node ) === -1 ) {
						groups[ index ].push( node );
					}
				} );
			} );
		} );

		return groups;
	}

	function allTrackedGroups() {
		var all = [];
		classifyStepGroups().forEach( function ( nodes ) {
			nodes.forEach( function ( node ) {
				if ( all.indexOf( node ) === -1 ) {
					all.push( node );
				}
			} );
		} );
		return all;
	}

	function stepGroups( index ) {
		return classifyStepGroups()[ index ] || [];
	}

	function isMobile() {
		return Boolean( mobileMedia && mobileMedia.matches );
	}

	function selectStore( key ) {
		try {
			return window.wp && window.wp.data && typeof window.wp.data.select === 'function'
				? window.wp.data.select( key )
				: null;
		} catch ( error ) {
			return null;
		}
	}

	function callSelector( store, names, fallback ) {
		if ( ! store ) {
			return fallback;
		}
		for ( var i = 0; i < names.length; i++ ) {
			if ( typeof store[ names[ i ] ] === 'function' ) {
				try {
					return store[ names[ i ] ]();
				} catch ( error ) {
					return fallback;
				}
			}
		}
		return fallback;
	}

	function cartBusy() {
		var cart = selectStore( 'wc/store/cart' );
		var checkout = selectStore( 'wc/store/checkout' );
		return Boolean(
			callSelector( checkout, [ 'isCalculating' ], false ) ||
			callSelector( cart, [ 'isCustomerDataUpdating' ], false ) ||
			callSelector( cart, [ 'isLoadingRates' ], false ) ||
			callSelector( cart, [ 'isAddressFieldsForShippingRatesUpdating' ], false )
		);
	}

	function shippingReady() {
		var cart = selectStore( 'wc/store/cart' );
		var needsShipping = callSelector( cart, [ 'getNeedsShipping' ], true );
		return ! needsShipping || callSelector( cart, [ 'getHasCalculatedShipping', 'hasCalculatedShipping' ], false );
	}

	function controlsForGroups( groups ) {
		var controls = [];
		groups.forEach( function ( group ) {
			group.querySelectorAll( 'input, select, textarea' ).forEach( function ( control ) {
				if ( controls.indexOf( control ) === -1 ) {
					controls.push( control );
				}
			} );
		} );
		return controls;
	}

	function firstInvalidControl( groups ) {
		return controlsForGroups( groups ).find( function ( control ) {
			return ! control.disabled && control.type !== 'hidden' && control.willValidate !== false && ! control.checkValidity();
		} );
	}

	function sectionIsValid( index ) {
		if ( firstInvalidControl( stepGroups( index ) ) ) {
			return false;
		}
		if ( STEPS[ index ].id === 'shipping' ) {
			return ! cartBusy() && shippingReady();
		}
		return true;
	}

	function indexForNode( node ) {
		var groups = classifyStepGroups();
		for ( var index = 0; index < groups.length; index++ ) {
			for ( var item = 0; item < groups[ index ].length; item++ ) {
				if ( groups[ index ][ item ] === node || groups[ index ][ item ].contains( node ) ) {
					return index;
				}
			}
		}
		return -1;
	}

	function createHeader( step, index ) {
		var header = document.createElement( 'button' );
		header.type = 'button';
		header.className = 'dtb-checkout__accordion-header';
		header.dataset.step = step.id;
		header.setAttribute( 'aria-expanded', index === activeStep ? 'true' : 'false' );
		header.innerHTML =
			'<span class="dtb-checkout__accordion-copy">' +
				'<span class="dtb-checkout__accordion-title">' + step.label + '</span>' +
				'<span class="dtb-checkout__accordion-description">' + step.description + '</span>' +
			'</span>' +
			'<span class="dtb-checkout__accordion-state" aria-hidden="true">' +
				'<span class="dtb-checkout__accordion-check">&#10003;</span>' +
				'<span class="dtb-checkout__accordion-chevron"></span>' +
			'</span>';
		header.addEventListener( 'click', function () {
			openStep( index, true );
		} );
		return header;
	}

	function ensurePanelIdentity( node, stepId, index, itemIndex ) {
		if ( ! node.id ) {
			node.id = 'dtb-checkout-' + stepId + '-panel-' + ( itemIndex + 1 );
		}
		node.classList.add( PANEL_CLASS );
		node.dataset.dtbAccordionStep = String( index );
	}

	function mountAccordion() {
		var root = checkoutRoot();
		var groups = classifyStepGroups();
		if ( ! root || accordion ) {
			return;
		}

		var headers = STEPS.map( function ( step, index ) {
			var header = createHeader( step, index );
			var panels = groups[ index ];
			var panelIds = [];

			panels.forEach( function ( panel, itemIndex ) {
				ensurePanelIdentity( panel, step.id, index, itemIndex );
				panelIds.push( panel.id );
			} );

			header.setAttribute( 'aria-controls', panelIds.join( ' ' ) );
			panels[ 0 ].parentNode.insertBefore( header, panels[ 0 ] );
			return header;
		} );

		root.classList.add( 'dtb-checkout--accordion' );
		accordion = { root: root, headers: headers };
		attachSubmitDiscovery();
	}

	function unmountAccordion() {
		window.clearTimeout( autoAdvanceTimer );
		if ( accordion ) {
			accordion.headers.forEach( function ( header ) {
				header.remove();
			} );
			accordion.root.classList.remove( 'dtb-checkout--accordion' );
			accordion = null;
		}

		allTrackedGroups().forEach( function ( node ) {
			node.classList.remove( PANEL_CLASS );
			node.removeAttribute( COLLAPSED_ATTR );
			node.removeAttribute( COMPLETE_ATTR );
			node.removeAttribute( 'aria-hidden' );
			node.removeAttribute( 'inert' );
			delete node.dataset.dtbAccordionStep;
		} );
	}

	function notifyPaymentLayout() {
		window.requestAnimationFrame( function () {
			window.requestAnimationFrame( function () {
				window.dispatchEvent( new Event( 'resize' ) );
				var payment = document.querySelector( '.wp-block-woocommerce-checkout-payment-block' );
				if ( payment ) {
					payment.dispatchEvent( new CustomEvent( 'dtb:payment-visible', { bubbles: true } ) );
				}
			} );
		} );
	}

	function updateAccordionState() {
		if ( ! accordion ) {
			return;
		}

		STEPS.forEach( function ( step, index ) {
			var expanded = index === activeStep;
			var complete = completedSteps[ index ];
			var header = accordion.headers[ index ];
			header.setAttribute( 'aria-expanded', expanded ? 'true' : 'false' );
			header.dataset.state = expanded ? 'active' : complete ? 'complete' : 'idle';

			stepGroups( index ).forEach( function ( panel ) {
				panel.setAttribute( 'aria-hidden', expanded ? 'false' : 'true' );
				if ( expanded ) {
					panel.removeAttribute( COLLAPSED_ATTR );
					panel.removeAttribute( 'inert' );
				} else {
					panel.setAttribute( COLLAPSED_ATTR, 'true' );
					panel.setAttribute( 'inert', '' );
				}
				if ( complete ) {
					panel.setAttribute( COMPLETE_ATTR, 'true' );
				} else {
					panel.removeAttribute( COMPLETE_ATTR );
				}
			} );
		} );
	}

	function scrollHeaderIntoView( index ) {
		if ( ! accordion || ! accordion.headers[ index ] ) {
			return;
		}
		var reduced = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
		accordion.headers[ index ].scrollIntoView( {
			behavior: reduced ? 'auto' : 'smooth',
			block: 'start',
		} );
	}

	function openStep( index, scroll ) {
		activeStep = Math.max( 0, Math.min( index, STEPS.length - 1 ) );
		updateAccordionState();
		if ( activeStep === STEPS.length - 1 ) {
			notifyPaymentLayout();
		}
		if ( scroll ) {
			scrollHeaderIntoView( activeStep );
		}
	}

	function maybeAutoAdvance( source ) {
		window.clearTimeout( autoAdvanceTimer );
		if ( ! accordion || activeStep >= STEPS.length - 1 ) {
			return;
		}
		var sourceStep = indexForNode( source );
		if ( sourceStep !== activeStep ) {
			return;
		}

		autoAdvanceTimer = window.setTimeout( function () {
			if ( ! accordion || sourceStep !== activeStep || ! sectionIsValid( sourceStep ) ) {
				return;
			}
			completedSteps[ sourceStep ] = true;
			openStep( sourceStep + 1, true );
		}, AUTO_ADVANCE_DELAY );
	}

	function revealInvalidControl( control ) {
		var index = indexForNode( control );
		if ( index < 0 ) {
			return;
		}
		completedSteps[ index ] = false;
		openStep( index, true );
		window.requestAnimationFrame( function () {
			control.focus && control.focus( { preventScroll: true } );
			control.reportValidity && control.reportValidity();
			control.scrollIntoView( {
				behavior: window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ? 'auto' : 'smooth',
				block: 'center',
			} );
		} );
	}

	function firstInvalidCheckoutControl() {
		for ( var index = 0; index < STEPS.length; index++ ) {
			var invalid = firstInvalidControl( stepGroups( index ) );
			if ( invalid ) {
				return invalid;
			}
		}
		return null;
	}

	function attachSubmitDiscovery() {
		if ( submitListenerAttached ) {
			return;
		}
		var root = checkoutRoot();
		if ( ! root ) {
			return;
		}
		root.addEventListener( 'click', function ( event ) {
			var submit = event.target.closest( '.wc-block-components-checkout-place-order-button, button[type="submit"]' );
			if ( ! submit || ! isMobile() ) {
				return;
			}
			var invalid = firstInvalidCheckoutControl();
			if ( invalid ) {
				event.preventDefault();
				event.stopPropagation();
				revealInvalidControl( invalid );
			}
		}, true );
		submitListenerAttached = true;
	}

	function reconcile() {
		reconcileScheduled = false;
		var root = checkoutRoot();
		if ( ! root ) {
			return;
		}

		if ( ! isMobile() ) {
			unmountAccordion();
			return;
		}

		var groups = classifyStepGroups();
		if ( ! groups[ 0 ].length || ! groups[ 2 ].length ) {
			unmountAccordion();
			return;
		}

		mountAccordion();
		groups.forEach( function ( panels, index ) {
			panels.forEach( function ( panel, itemIndex ) {
				ensurePanelIdentity( panel, STEPS[ index ].id, index, itemIndex );
			} );
		} );
		updateAccordionState();
	}

	function scheduleReconcile() {
		if ( reconcileScheduled ) {
			return;
		}
		reconcileScheduled = true;
		window.requestAnimationFrame( reconcile );
	}

	function subscribeToStores() {
		if ( storeUnsubscribe || ! window.wp || ! window.wp.data || typeof window.wp.data.subscribe !== 'function' ) {
			return;
		}
		if ( ! selectStore( 'wc/store/cart' ) ) {
			return;
		}
		storeUnsubscribe = window.wp.data.subscribe( function () {
			if ( accordion && activeStep === 1 && ! cartBusy() ) {
				maybeAutoAdvance( accordion.root );
			}
		} );
	}

	var INIT_RETRY_LIMIT = 50;

	function init( attempt ) {
		var root = checkoutRoot();
		if ( ! root ) {
			if ( ( attempt || 0 ) < INIT_RETRY_LIMIT ) {
				window.setTimeout( function () {
					init( ( attempt || 0 ) + 1 );
				}, 200 );
			}
			return;
		}

		mobileMedia = window.matchMedia( MOBILE_QUERY );
		mobileMedia.addEventListener
			? mobileMedia.addEventListener( 'change', scheduleReconcile )
			: mobileMedia.addListener( scheduleReconcile );

		root.addEventListener( 'change', function ( event ) {
			maybeAutoAdvance( event.target );
		} );
		root.addEventListener( 'blur', function ( event ) {
			maybeAutoAdvance( event.target );
		}, true );

		observer = new MutationObserver( scheduleReconcile );
		observer.observe( root, { childList: true, subtree: true } );

		subscribeToStores();
		scheduleReconcile();
		window.setTimeout( scheduleReconcile, 300 );
		window.setTimeout( scheduleReconcile, 900 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', function () {
			init( 0 );
		}, { once: true } );
	} else {
		init( 0 );
	}
} )();