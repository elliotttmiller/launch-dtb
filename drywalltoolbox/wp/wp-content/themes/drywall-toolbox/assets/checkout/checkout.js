/**
 * Drywall Toolbox — mobile checkout accordion navigation.
 *
 * Progressive enhancement only. WooCommerce retains ownership of every field,
 * validation rule, cart mutation, payment surface and submit action. DTB owns a
 * navigation shell inserted before (never inside) WooCommerce's React-managed
 * checkout subtree and toggles only presentation attributes on native groups.
 */
( function () {
	'use strict';

	var MOBILE_QUERY = '(max-width: 767px)';
	var STEP_WRAPPER_SELECTOR = '.wc-block-components-checkout-step';
	var PANEL_CLASS = 'dtb-checkout__accordion-panel';
	var COLLAPSED_ATTR = 'data-dtb-accordion-collapsed';
	var ACTIVE_ATTR = 'data-dtb-accordion-active';
	var COMPLETE_ATTR = 'data-dtb-accordion-complete';
	var TRANSITION_MS = 320;

	var STEPS = [
		{ id: 'contact', label: 'Contact', description: 'Email and contact details' },
		{ id: 'shipping', label: 'Shipping', description: 'Address and delivery method' },
		{ id: 'payment', label: 'Payment', description: 'Payment method and order review' },
	];

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

	var media = null;
	var ui = null;
	var activeStepId = 'contact';
	var completed = Object.create( null );
	var observer = null;
	var resizeObserver = null;
	var storeUnsubscribe = null;
	var reconcileFrame = 0;
	var shippingWasBusy = false;
	var shippingInteractionPending = false;

	function checkoutRoot() {
		return document.querySelector( '.wc-block-checkout__form' ) || document.querySelector( '.wc-block-checkout' );
	}

	function isMobile() {
		return Boolean( media && media.matches );
	}

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

	function availableSteps( groups ) {
		return STEPS.filter( function ( _step, index ) {
			return groups[ index ] && groups[ index ].length > 0;
		} );
	}

	function stepIndexById( id ) {
		return STEPS.findIndex( function ( step ) { return step.id === id; } );
	}

	function groupsForStep( id, groups ) {
		var index = stepIndexById( id );
		return index >= 0 ? ( groups || classifyStepGroups() )[ index ] || [] : [];
	}

	function stepIdForNode( node, groups ) {
		var classified = groups || classifyStepGroups();
		for ( var index = 0; index < classified.length; index++ ) {
			for ( var item = 0; item < classified[ index ].length; item++ ) {
				var panel = classified[ index ][ item ];
				if ( panel === node || panel.contains( node ) ) {
					return STEPS[ index ].id;
				}
			}
		}
		return '';
	}

	function controlsForStep( id ) {
		var controls = [];
		groupsForStep( id ).forEach( function ( panel ) {
			panel.querySelectorAll( 'input, select, textarea' ).forEach( function ( control ) {
				if ( controls.indexOf( control ) === -1 ) {
					controls.push( control );
				}
			} );
		} );
		return controls;
	}

	function firstInvalidControl( id ) {
		return controlsForStep( id ).find( function ( control ) {
			return ! control.disabled && control.type !== 'hidden' && control.willValidate !== false && ! control.checkValidity();
		} ) || null;
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
		for ( var index = 0; store && index < names.length; index++ ) {
			if ( typeof store[ names[ index ] ] === 'function' ) {
				try {
					return store[ names[ index ] ]();
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
		var needsShipping = callSelector( cart, [ 'getNeedsShipping' ], groupsForStep( 'shipping' ).length > 0 );
		return ! needsShipping || callSelector( cart, [ 'getHasCalculatedShipping', 'hasCalculatedShipping' ], false );
	}

	function sectionValid( id ) {
		if ( firstInvalidControl( id ) ) {
			return false;
		}
		return id !== 'shipping' || ( ! cartBusy() && shippingReady() );
	}

	function createNavigation( steps ) {
		var nav = document.createElement( 'nav' );
		nav.className = 'dtb-checkout__accordion-nav';
		nav.setAttribute( 'aria-label', 'Checkout sections' );

		var headers = Object.create( null );
		steps.forEach( function ( step ) {
			var button = document.createElement( 'button' );
			button.type = 'button';
			button.className = 'dtb-checkout__accordion-header';
			button.dataset.step = step.id;
			button.innerHTML =
				'<span class="dtb-checkout__accordion-copy">' +
					'<span class="dtb-checkout__accordion-title">' + step.label + '</span>' +
					'<span class="dtb-checkout__accordion-description">' + step.description + '</span>' +
				'</span>' +
				'<span class="dtb-checkout__accordion-state" aria-hidden="true">' +
					'<span class="dtb-checkout__accordion-check">&#10003;</span>' +
					'<span class="dtb-checkout__accordion-chevron"></span>' +
				'</span>';
			button.addEventListener( 'click', function () {
				openStep( step.id, true, false );
			} );
			nav.appendChild( button );
			headers[ step.id ] = button;
		} );
		return { nav: nav, headers: headers };
	}

	function ensurePanelMetadata( groups ) {
		STEPS.forEach( function ( step, index ) {
			( groups[ index ] || [] ).forEach( function ( panel, panelIndex ) {
				panel.classList.add( PANEL_CLASS );
				panel.dataset.dtbAccordionStep = step.id;
				if ( ! panel.id ) {
					panel.id = 'dtb-checkout-' + step.id + '-panel-' + ( panelIndex + 1 );
				}
				var heading = panelIndex === 0 ? panel.querySelector( ':scope > .wc-block-components-checkout-step__heading' ) : null;
				if ( heading ) {
					heading.classList.add( 'dtb-checkout__native-heading--visually-hidden' );
				}
			} );
		} );
	}

	function updateHeaderControls( steps, groups ) {
		steps.forEach( function ( step ) {
			var header = ui && ui.headers[ step.id ];
			if ( ! header ) {
				return;
			}
			header.setAttribute( 'aria-controls', groupsForStep( step.id, groups ).map( function ( panel ) { return panel.id; } ).join( ' ' ) );
		} );
	}

	function mount( groups ) {
		var root = checkoutRoot();
		var steps = availableSteps( groups );
		if ( ! root || ! steps.length ) {
			return;
		}
		if ( ! steps.some( function ( step ) { return step.id === activeStepId; } ) ) {
			activeStepId = steps[ 0 ].id;
		}

		if ( ! ui ) {
			var chrome = createNavigation( steps );
			root.parentNode.insertBefore( chrome.nav, root );
			root.classList.add( 'dtb-checkout--accordion' );
			ui = { root: root, nav: chrome.nav, headers: chrome.headers, stepSignature: steps.map( function ( step ) { return step.id; } ).join( '|' ) };
		} else {
			var signature = steps.map( function ( step ) { return step.id; } ).join( '|' );
			if ( signature !== ui.stepSignature ) {
				unmount();
				mount( groups );
				return;
			}
		}

		ensurePanelMetadata( groups );
		updateHeaderControls( steps, groups );
		applyState( groups );
	}

	function clearPanelState( panel ) {
		panel.classList.remove( PANEL_CLASS );
		panel.removeAttribute( COLLAPSED_ATTR );
		panel.removeAttribute( ACTIVE_ATTR );
		panel.removeAttribute( COMPLETE_ATTR );
		panel.removeAttribute( 'aria-hidden' );
		panel.removeAttribute( 'inert' );
		panel.style.removeProperty( 'height' );
		panel.style.removeProperty( 'overflow' );
		delete panel.dataset.dtbAccordionStep;
		panel.querySelectorAll( '.dtb-checkout__native-heading--visually-hidden' ).forEach( function ( heading ) {
			heading.classList.remove( 'dtb-checkout__native-heading--visually-hidden' );
		} );
	}

	function unmount() {
		if ( ui ) {
			ui.nav.remove();
			ui.root.classList.remove( 'dtb-checkout--accordion' );
			ui = null;
		}
		classifyStepGroups().forEach( function ( panels ) {
			panels.forEach( clearPanelState );
		} );
	}

	function expandPanel( panel ) {
		panel.removeAttribute( COLLAPSED_ATTR );
		panel.setAttribute( ACTIVE_ATTR, 'true' );
		panel.setAttribute( 'aria-hidden', 'false' );
		panel.removeAttribute( 'inert' );
		panel.style.overflow = 'hidden';
		panel.style.height = panel.scrollHeight + 'px';
		window.setTimeout( function () {
			if ( panel.hasAttribute( ACTIVE_ATTR ) ) {
				panel.style.height = 'auto';
				panel.style.overflow = 'visible';
			}
		}, TRANSITION_MS );
	}

	function collapsePanel( panel ) {
		var startHeight = panel.getBoundingClientRect().height || panel.scrollHeight;
		panel.style.height = startHeight + 'px';
		panel.style.overflow = 'hidden';
		panel.removeAttribute( ACTIVE_ATTR );
		panel.setAttribute( 'aria-hidden', 'true' );
		panel.setAttribute( 'inert', '' );
		window.requestAnimationFrame( function () {
			panel.setAttribute( COLLAPSED_ATTR, 'true' );
			panel.style.height = '0px';
		} );
	}

	function applyState( groups ) {
		if ( ! ui ) {
			return;
		}
		availableSteps( groups ).forEach( function ( step ) {
			var expanded = step.id === activeStepId;
			var header = ui.headers[ step.id ];
			if ( header ) {
				header.setAttribute( 'aria-expanded', expanded ? 'true' : 'false' );
				header.dataset.state = expanded ? 'active' : completed[ step.id ] ? 'complete' : 'idle';
			}
			groupsForStep( step.id, groups ).forEach( function ( panel ) {
				if ( completed[ step.id ] ) {
					panel.setAttribute( COMPLETE_ATTR, 'true' );
				} else {
					panel.removeAttribute( COMPLETE_ATTR );
				}
				if ( expanded ) {
					expandPanel( panel );
				} else if ( ! panel.hasAttribute( COLLAPSED_ATTR ) || panel.style.height !== '0px' ) {
					collapsePanel( panel );
				}
			} );
		} );
	}

	function focusHeader( id ) {
		if ( ui && ui.headers[ id ] ) {
			ui.headers[ id ].focus( { preventScroll: true } );
		}
	}

	function openStep( id, scroll, moveFocus ) {
		var groups = classifyStepGroups();
		if ( ! groupsForStep( id, groups ).length ) {
			return;
		}
		activeStepId = id;
		applyState( groups );
		if ( id === 'payment' ) {
			window.requestAnimationFrame( function () {
				window.requestAnimationFrame( function () { window.dispatchEvent( new Event( 'resize' ) ); } );
			} );
		}
		if ( moveFocus ) {
			focusHeader( id );
		}
		if ( scroll && ui && ui.headers[ id ] ) {
			ui.headers[ id ].scrollIntoView( {
				behavior: window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ? 'auto' : 'smooth',
				block: 'start',
			} );
		}
	}

	function nextAvailableStepId( id ) {
		var steps = availableSteps( classifyStepGroups() );
		var current = steps.findIndex( function ( step ) { return step.id === id; } );
		return current >= 0 && steps[ current + 1 ] ? steps[ current + 1 ].id : '';
	}

	function controlledAdvance( id ) {
		if ( activeStepId !== id || ! sectionValid( id ) ) {
			return;
		}
		var next = nextAvailableStepId( id );
		if ( next ) {
			completed[ id ] = true;
			openStep( next, true, true );
		}
	}

	function revealInvalid( control ) {
		var id = stepIdForNode( control );
		if ( ! id ) {
			return;
		}
		completed[ id ] = false;
		openStep( id, true, false );
		window.requestAnimationFrame( function () {
			control.focus( { preventScroll: true } );
			control.scrollIntoView( { behavior: 'auto', block: 'center' } );
			if ( typeof control.reportValidity === 'function' ) {
				control.reportValidity();
			}
		} );
	}

	function firstInvalidAcrossCheckout() {
		var steps = availableSteps( classifyStepGroups() );
		for ( var index = 0; index < steps.length; index++ ) {
			var invalid = firstInvalidControl( steps[ index ].id );
			if ( invalid ) {
				return invalid;
			}
		}
		return null;
	}

	function onInvalid( event ) {
		if ( isMobile() && event.target && event.target.matches( 'input, select, textarea' ) ) {
			revealInvalid( event.target );
		}
	}

	function onSubmit( event ) {
		if ( ! isMobile() ) {
			return;
		}
		var invalid = firstInvalidAcrossCheckout();
		if ( invalid ) {
			event.preventDefault();
			revealInvalid( invalid );
		}
	}

	function onChange( event ) {
		if ( ! isMobile() || ! event.target ) {
			return;
		}
		var id = stepIdForNode( event.target );
		if ( id === 'contact' && event.target.matches( 'input[type="email"]' ) ) {
			window.setTimeout( function () { controlledAdvance( 'contact' ); }, 150 );
		}
		if ( id === 'shipping' && event.target.matches( 'input[type="radio"], select' ) ) {
			shippingInteractionPending = true;
			if ( ! cartBusy() ) {
				window.setTimeout( function () { controlledAdvance( 'shipping' ); }, 150 );
			}
		}
	}

	function subscribeStores() {
		if ( storeUnsubscribe || ! window.wp || ! window.wp.data || typeof window.wp.data.subscribe !== 'function' ) {
			return;
		}
		storeUnsubscribe = window.wp.data.subscribe( function () {
			var busy = cartBusy();
			if ( activeStepId === 'shipping' && shippingInteractionPending && shippingWasBusy && ! busy ) {
				shippingInteractionPending = false;
				window.setTimeout( function () { controlledAdvance( 'shipping' ); }, 150 );
			}
			shippingWasBusy = busy;
		} );
	}

	function reconcile() {
		reconcileFrame = 0;
		var root = checkoutRoot();
		if ( ! root ) {
			return;
		}
		if ( ! isMobile() ) {
			unmount();
			return;
		}
		var groups = classifyStepGroups();
		if ( ! groups[ 0 ].length || ! groups[ 2 ].length ) {
			unmount();
			return;
		}
		mount( groups );
	}

	function scheduleReconcile() {
		if ( reconcileFrame ) {
			return;
		}
		reconcileFrame = window.requestAnimationFrame( reconcile );
	}

	function init( attempt ) {
		var root = checkoutRoot();
		if ( ! root ) {
			if ( ( attempt || 0 ) < 50 ) {
				window.setTimeout( function () { init( ( attempt || 0 ) + 1 ); }, 200 );
			}
			return;
		}

		media = window.matchMedia( MOBILE_QUERY );
		media.addEventListener ? media.addEventListener( 'change', scheduleReconcile ) : media.addListener( scheduleReconcile );

		root.addEventListener( 'invalid', onInvalid, true );
		root.addEventListener( 'submit', onSubmit, true );
		root.addEventListener( 'change', onChange );

		observer = new MutationObserver( scheduleReconcile );
		observer.observe( root, { childList: true, subtree: true } );

		if ( 'ResizeObserver' in window ) {
			resizeObserver = new ResizeObserver( function () {
				if ( ui ) {
					groupsForStep( activeStepId ).forEach( function ( panel ) {
						if ( panel.hasAttribute( ACTIVE_ATTR ) && panel.style.height !== 'auto' ) {
							panel.style.height = panel.scrollHeight + 'px';
						}
					} );
				}
			} );
			resizeObserver.observe( root );
		}

		subscribeStores();
		scheduleReconcile();
		window.setTimeout( scheduleReconcile, 300 );
		window.setTimeout( scheduleReconcile, 900 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', function () { init( 0 ); }, { once: true } );
	} else {
		init( 0 );
	}
} )();
