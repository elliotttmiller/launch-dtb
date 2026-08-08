/**
 * Drywall Toolbox — mobile checkout section navigation.
 *
 * Progressive enhancement only. WooCommerce retains ownership of fields,
 * validation, cart/shipping state, payment surfaces, and checkout submission.
 * DTB mounts navigation outside the React-managed checkout subtree and limits
 * panel mutations to deterministic presentation/accessibility attributes.
 */
( function () {
	'use strict';

	var MOBILE_QUERY = '(max-width: 767px)';
	var STEP_WRAPPER_SELECTOR = '.wc-block-components-checkout-step';
	var PANEL_CLASS = 'dtb-checkout__accordion-panel';
	var ACTIVE_ATTR = 'data-dtb-accordion-active';
	var COMPLETE_ATTR = 'data-dtb-accordion-complete';

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
			'.wc-block-components-express-payment',
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
	var reconcileFrame = 0;
	var observedRoot = null;

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
					if ( root.contains( node ) && groups[ index ].indexOf( node ) === -1 ) {
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

	function controlsForStep( id, groups ) {
		var controls = [];
		groupsForStep( id, groups ).forEach( function ( panel ) {
			panel.querySelectorAll( 'input, select, textarea' ).forEach( function ( control ) {
				if ( controls.indexOf( control ) === -1 ) {
					controls.push( control );
				}
			} );
		} );
		return controls;
	}

	function firstInvalidControl( id, groups ) {
		return controlsForStep( id, groups ).find( function ( control ) {
			return ! control.disabled && control.type !== 'hidden' && control.willValidate !== false && ! control.checkValidity();
		} ) || null;
	}

	function sectionValid( id, groups ) {
		return ! firstInvalidControl( id, groups );
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
				var heading = panelIndex === 0 ? panel.querySelector( '.wc-block-components-checkout-step__heading' ) : null;
				if ( heading ) {
					heading.classList.add( 'dtb-checkout__native-heading--visually-hidden' );
				}
			} );
		} );
	}

	function clearPanelState( panel ) {
		panel.classList.remove( PANEL_CLASS );
		panel.removeAttribute( ACTIVE_ATTR );
		panel.removeAttribute( COMPLETE_ATTR );
		panel.removeAttribute( 'aria-hidden' );
		panel.removeAttribute( 'inert' );
		panel.removeAttribute( 'hidden' );
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

	function setPanelExpanded( panel, expanded ) {
		if ( expanded ) {
			panel.hidden = false;
			panel.removeAttribute( 'inert' );
			panel.setAttribute( 'aria-hidden', 'false' );
			panel.setAttribute( ACTIVE_ATTR, 'true' );
			return;
		}

		panel.removeAttribute( ACTIVE_ATTR );
		panel.setAttribute( 'aria-hidden', 'true' );
		panel.setAttribute( 'inert', '' );
		panel.hidden = true;
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
				header.setAttribute( 'aria-controls', groupsForStep( step.id, groups ).map( function ( panel ) { return panel.id; } ).join( ' ' ) );
				header.dataset.state = expanded ? 'active' : completed[ step.id ] ? 'complete' : 'idle';
			}

			groupsForStep( step.id, groups ).forEach( function ( panel ) {
				if ( completed[ step.id ] ) {
					panel.setAttribute( COMPLETE_ATTR, 'true' );
				} else {
					panel.removeAttribute( COMPLETE_ATTR );
				}
				setPanelExpanded( panel, expanded );
			} );
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

		var signature = steps.map( function ( step ) { return step.id; } ).join( '|' );
		if ( ui && ( ui.root !== root || ui.stepSignature !== signature ) ) {
			unmount();
		}

		if ( ! ui ) {
			var chrome = createNavigation( steps );
			root.parentNode.insertBefore( chrome.nav, root );
			root.classList.add( 'dtb-checkout--accordion' );
			ui = {
				root: root,
				nav: chrome.nav,
				headers: chrome.headers,
				stepSignature: signature,
			};
		}

		ensurePanelMetadata( groups );
		applyState( groups );
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

	function revealInvalid( control ) {
		var groups = classifyStepGroups();
		var id = stepIdForNode( control, groups );
		if ( ! id ) {
			return;
		}

		completed[ id ] = false;
		activeStepId = id;
		applyState( groups );

		window.requestAnimationFrame( function () {
			if ( ! document.documentElement.contains( control ) ) {
				return;
			}
			control.focus( { preventScroll: true } );
			control.scrollIntoView( { behavior: 'auto', block: 'center', inline: 'nearest' } );
		} );
	}

	function firstInvalidAcrossCheckout() {
		var groups = classifyStepGroups();
		var steps = availableSteps( groups );
		for ( var index = 0; index < steps.length; index++ ) {
			var invalid = firstInvalidControl( steps[ index ].id, groups );
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
		var groups = classifyStepGroups();
		var id = stepIdForNode( event.target, groups );
		if ( id && completed[ id ] && ! sectionValid( id, groups ) ) {
			completed[ id ] = false;
			applyState( groups );
		}
	}

	function reconcile() {
		reconcileFrame = 0;
		var root = checkoutRoot();
		if ( ! root ) {
			unmount();
			return;
		}
		if ( ! isMobile() ) {
			unmount();
			return;
		}

		var groups = classifyStepGroups();
		if ( ! groups[ 0 ].length || ! groups[ 2 ].length ) {
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

	function observeRoot( root ) {
		if ( observedRoot === root ) {
			return;
		}
		if ( observer ) {
			observer.disconnect();
		}
		observedRoot = root;
		observer = new MutationObserver( function ( mutations ) {
			var structuralChange = mutations.some( function ( mutation ) {
				return mutation.type === 'childList' && ( mutation.addedNodes.length || mutation.removedNodes.length );
			} );
			if ( structuralChange ) {
				scheduleReconcile();
			}
		} );
		observer.observe( root, { childList: true, subtree: true } );
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
		if ( media.addEventListener ) {
			media.addEventListener( 'change', scheduleReconcile );
		} else {
			media.addListener( scheduleReconcile );
		}

		root.addEventListener( 'invalid', onInvalid, true );
		root.addEventListener( 'submit', onSubmit, true );
		root.addEventListener( 'change', onChange );
		observeRoot( root );
		scheduleReconcile();
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', function () { init( 0 ); }, { once: true } );
	} else {
		init( 0 );
	}
} )();
