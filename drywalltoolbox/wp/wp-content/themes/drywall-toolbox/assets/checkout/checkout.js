/**
 * Drywall Toolbox — mobile checkout wizard (progressive enhancement only).
 *
 * Presents the single, native WooCommerce Checkout Block as three in-page
 * screens (Contact, Shipping, Payment) with no document navigation, no
 * iframe, and no second form. It never creates, clones, or moves a native
 * field, wallet, or payment control — it only toggles visibility of the
 * *existing* top-level block groups that WooCommerce itself already renders.
 *
 * Groups are classified by DOM position, not by an enumerated list of block
 * names: `data-block-name` attributes are only present in the block editor's
 * own markup, never in this store's actual frontend HTML output, so a
 * selector list built from them silently matches nothing at runtime (see
 * commit 320b536 / PR #44 in this repo's history, which hit and fixed this
 * exact failure mode once already). `.wc-block-components-checkout-step` is
 * WooCommerce Blocks' one stable, version-resilient public class applied to
 * every top-level step wrapper regardless of which concrete step it is, and
 * WooCommerce always renders Contact first and Payment last, with zero or
 * more shipping-related steps in between:
 *
 *   .wc-block-components-express-payment      <- always Contact
 *   .wc-block-components-checkout-step (1st)   <- always Contact
 *   .wc-block-components-checkout-step (last)  <- always Payment
 *   .wc-block-components-checkout-step (any other)  <- Shipping
 *   (non-step siblings: order notes, terms, actions row) <- grouped with
 *     whichever step wrapper precedes them in document order
 *
 * See classifyStepGroups() below.
 *
 * Step gating uses the platform's own HTML5 constraint validation
 * (checkValidity/reportValidity) against the fields *inside the active
 * step only*, plus the documented public WooCommerce Blocks data stores
 * (`wc/store/cart`, `wc/store/checkout`, `wc/store/validation` — see
 * WooCommerce Blocks third-party developer docs) to avoid advancing while
 * shipping/tax totals are recalculating or while Woo has flagged a field
 * invalid. No private/internal object graph is read.
 *
 * The Contact screen also collects first/last name via WooCommerce's
 * Additional Checkout Fields API (registered server-side in
 * mu-plugins/dtb-commerce/Validation/CheckoutFieldPolicy.php as
 * `dtb/first_name` / `dtb/last_name`, location `contact`) — real, native,
 * Woo-rendered inputs, not a client-side duplicate. They are registered
 * `required: false` at the API level so an Apple Pay / Google Pay / Link
 * order (which never touches them) is never blocked; this script instead
 * enforces them as required for the typed/card flow only, by checking their
 * `autocomplete="given-name"`/`"family-name"` inputs before leaving the
 * Contact step (see firstEmptyContactIdentityField()).
 *
 * Runs only under a mobile viewport (matches the scope of this redesign
 * pass). At wider viewports every group is left visible and none of this
 * chrome is mounted, so the page is the plain, accessible single-scroll
 * Woo Blocks checkout. Waits for the checkout root to exist (retrying for
 * up to ~10s in case it renders later than DOMContentLoaded), and if no
 * `.wc-block-components-checkout-step` wrapper is ever found (a Woo Blocks
 * version change, a customized checkout layout), never mounts any chrome —
 * the page stays the plain, unmodified Woo Blocks checkout.
 *
 * Handle: dtb-checkout (see functions.php dtb_enqueue_native_checkout_assets()).
 */
( function () {
	'use strict';

	var MOBILE_QUERY = '(max-width: 767px)';
	var HIDDEN_ATTR = 'data-dtb-step-hidden';

	var STEPS = [
		{ id: 'contact', label: 'Contact' },
		{ id: 'shipping', label: 'Shipping' },
		{ id: 'payment', label: 'Payment' },
	];

	var STEP_WRAPPER_SELECTOR = '.wc-block-components-checkout-step';
	var EXPRESS_PAYMENT_SELECTOR = '.wc-block-components-express-payment';

	var mobileMedia = null;
	var wizard = null; // { root, rail, actions, statusEl, backBtn, continueBtn, railButtons: [] }
	var activeStep = 0;
	var highestVisited = 0;
	var observer = null;
	var reconcileScheduled = false;
	var storeUnsubscribe = null;

	function checkoutRoot() {
		return document.querySelector( '.wc-block-checkout__form' ) || document.querySelector( '.wc-block-checkout' );
	}

	/**
	 * Classify the checkout's own top-level section wrappers into
	 * Contact / Shipping / Payment groups by structural position. See the
	 * file header comment for why this replaced an earlier, broken
	 * `data-block-name` selector list.
	 */
	function classifyStepGroups() {
		var root = checkoutRoot();
		var groups = [ [], [], [] ];
		if ( ! root ) {
			return groups;
		}
		var main = root.querySelector( '.wc-block-components-main, .wc-block-checkout__main' ) || root;
		var children = Array.prototype.slice.call( main.children );
		var stepWrappers = children.filter( function ( node ) {
			return node.matches( STEP_WRAPPER_SELECTOR );
		} );
		if ( ! stepWrappers.length ) {
			return groups;
		}

		var firstStep = stepWrappers[ 0 ];
		var lastStep = stepWrappers[ stepWrappers.length - 1 ];

		children.forEach( function ( node ) {
			if ( node.matches( EXPRESS_PAYMENT_SELECTOR ) ) {
				groups[ 0 ].push( node );
				return;
			}
			if ( node === firstStep ) {
				groups[ 0 ].push( node );
				return;
			}
			if ( node === lastStep ) {
				groups[ 2 ].push( node );
				return;
			}
			if ( stepWrappers.indexOf( node ) !== -1 ) {
				groups[ 1 ].push( node );
				return;
			}
			// A non-step sibling (order notes, terms, actions row, etc.)
			// belongs with whichever step wrapper precedes it in the DOM.
			var precedesLastStep = Boolean( node.compareDocumentPosition( lastStep ) & Node.DOCUMENT_POSITION_FOLLOWING );
			groups[ precedesLastStep ? 1 : 2 ].push( node );
		} );

		return groups;
	}

	/** All groups for a step that currently exist in the DOM. */
	function stepGroups( index ) {
		return classifyStepGroups()[ index ] || [];
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

	function isMobile() {
		return Boolean( mobileMedia && mobileMedia.matches );
	}

	/* -------------------------------------------------------------------
	 * Documented WooCommerce Blocks data-store access (read-only).
	 * ------------------------------------------------------------------- */

	function selectStore( key ) {
		try {
			return window.wp && window.wp.data && typeof window.wp.data.select === 'function'
				? window.wp.data.select( key )
				: null;
		} catch ( e ) {
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
				} catch ( e ) {
					return fallback;
				}
			}
		}
		return fallback;
	}

	function cartBusy() {
		var cart = selectStore( 'wc/store/cart' );
		var checkout = selectStore( 'wc/store/checkout' );
		return (
			callSelector( checkout, [ 'isCalculating' ], false ) ||
			callSelector( cart, [ 'isCustomerDataUpdating' ], false ) ||
			callSelector( cart, [ 'isLoadingRates' ], false ) ||
			callSelector( cart, [ 'isAddressFieldsForShippingRatesUpdating' ], false )
		);
	}

	function shippingReady() {
		var cart = selectStore( 'wc/store/cart' );
		var needsShipping = callSelector( cart, [ 'getNeedsShipping' ], true );
		if ( ! needsShipping ) {
			return true;
		}
		return callSelector( cart, [ 'getHasCalculatedShipping', 'hasCalculatedShipping' ], false );
	}

	function hasStoreValidationErrors() {
		var validation = selectStore( 'wc/store/validation' );
		return callSelector( validation, [ 'hasValidationErrors' ], false );
	}

	/* -------------------------------------------------------------------
	 * Native constraint validation, scoped to the fields visible in the
	 * step being left — never touches fields belonging to other steps.
	 * ------------------------------------------------------------------- */

	function firstInvalidControl( groups ) {
		var controls = [];
		groups.forEach( function ( group ) {
			group.querySelectorAll( 'input, select, textarea' ).forEach( function ( control ) {
				if ( controls.indexOf( control ) === -1 ) {
					controls.push( control );
				}
			} );
		} );
		return controls.find( function ( control ) {
			return ! control.disabled && control.type !== 'hidden' && control.willValidate !== false && ! control.checkValidity();
		} );
	}

	/**
	 * First name / last name are registered as WooCommerce Additional
	 * Checkout Fields (see mu-plugins/dtb-commerce/Validation/CheckoutFieldPolicy.php)
	 * with `required: false` at the API level, on purpose — a required
	 * Contact-location field would fail Store API validation for an Apple
	 * Pay / Google Pay / Link order, which never populates it. "Required"
	 * for the typed/card flow is therefore enforced only here, client-side,
	 * scoped to the Contact step; the wallet flow never runs through this
	 * gate at all. Selected by the field's own `autocomplete` value (set at
	 * registration) rather than an id/name, since that is stable regardless
	 * of the internal id WooCommerce Blocks assigns the input.
	 */
	function firstEmptyContactIdentityField( groups, stepId ) {
		if ( stepId !== 'contact' ) {
			return null;
		}
		var controls = [];
		groups.forEach( function ( group ) {
			group.querySelectorAll( 'input[autocomplete="given-name"], input[autocomplete="family-name"]' ).forEach( function ( control ) {
				if ( controls.indexOf( control ) === -1 ) {
					controls.push( control );
				}
			} );
		} );
		return controls.find( function ( control ) {
			return ! control.disabled && ! String( control.value || '' ).trim();
		} );
	}

	function setStatus( message, kind ) {
		if ( ! wizard || ! wizard.statusEl ) {
			return;
		}
		wizard.statusEl.textContent = message || '';
		wizard.statusEl.hidden = ! message;
		wizard.statusEl.dataset.kind = kind || '';
	}

	function canAdvanceFrom( index ) {
		var groups = stepGroups( index );
		var invalid = firstInvalidControl( groups );
		if ( invalid ) {
			setStatus( 'Complete the highlighted fields before continuing.', 'error' );
			invalid.reportValidity && invalid.reportValidity();
			invalid.focus && invalid.focus();
			return false;
		}
		var missingIdentity = firstEmptyContactIdentityField( groups, STEPS[ index ].id );
		if ( missingIdentity ) {
			setStatus( 'Enter your first and last name to continue.', 'error' );
			missingIdentity.focus && missingIdentity.focus();
			return false;
		}
		if ( STEPS[ index ].id === 'shipping' ) {
			if ( cartBusy() ) {
				setStatus( 'Updating shipping and tax totals…', 'progress' );
				return false;
			}
			if ( ! shippingReady() ) {
				setStatus( 'Enter a complete shipping address before continuing.', 'error' );
				return false;
			}
		}
		if ( hasStoreValidationErrors() ) {
			setStatus( 'Review the highlighted fields before continuing.', 'error' );
			return false;
		}
		setStatus();
		return true;
	}

	/* -------------------------------------------------------------------
	 * Wizard chrome (progress rail + sticky action bar). Built once,
	 * reused across reconciliations; never rebuilt from scratch while
	 * mounted so focus/scroll state isn't disturbed mid-interaction.
	 * ------------------------------------------------------------------- */

	function buildRail() {
		var nav = document.createElement( 'nav' );
		nav.className = 'dtb-checkout__steps';
		nav.setAttribute( 'aria-label', 'Checkout progress' );

		var buttons = STEPS.map( function ( step, index ) {
			var wrapper = document.createElement( 'button' );
			wrapper.type = 'button';
			wrapper.className = 'dtb-checkout__step';
			wrapper.dataset.state = 'upcoming';
			wrapper.innerHTML =
				'<span class="dtb-checkout__step-dot" aria-hidden="true">' + ( index + 1 ) + '</span>' +
				'<span class="dtb-checkout__step-label">' + step.label + '</span>';
			wrapper.addEventListener( 'click', function () {
				if ( index <= highestVisited ) {
					goToStep( index, true );
				}
			} );
			nav.appendChild( wrapper );
			return wrapper;
		} );

		return { nav: nav, buttons: buttons };
	}

	function buildActionBar() {
		var bar = document.createElement( 'div' );
		bar.className = 'dtb-checkout__actions';

		var status = document.createElement( 'p' );
		status.className = 'dtb-checkout__actions-status';
		status.setAttribute( 'role', 'status' );
		status.setAttribute( 'aria-live', 'polite' );
		status.hidden = true;

		var row = document.createElement( 'div' );
		row.className = 'dtb-checkout__actions-row';

		var back = document.createElement( 'button' );
		back.type = 'button';
		back.className = 'dtb-checkout__actions-back';
		back.textContent = 'Back';
		back.addEventListener( 'click', function () {
			if ( activeStep > 0 ) {
				goToStep( activeStep - 1, true );
			}
		} );

		var next = document.createElement( 'button' );
		next.type = 'button';
		next.className = 'dtb-checkout__actions-continue';
		next.addEventListener( 'click', function () {
			if ( canAdvanceFrom( activeStep ) ) {
				goToStep( activeStep + 1, true );
			}
		} );

		row.appendChild( back );
		row.appendChild( next );
		bar.appendChild( status );
		bar.appendChild( row );

		return { bar: bar, status: status, back: back, next: next };
	}

	function mountWizard() {
		var root = checkoutRoot();
		if ( ! root || wizard ) {
			return;
		}
		var rail = buildRail();
		var actions = buildActionBar();

		var topbar = document.querySelector( '.dtb-checkout__topbar' );
		if ( topbar && topbar.parentNode ) {
			topbar.insertAdjacentElement( 'afterend', rail.nav );
		} else {
			root.parentNode.insertBefore( rail.nav, root );
		}
		document.body.appendChild( actions.bar );

		wizard = {
			root: root,
			rail: rail.nav,
			railButtons: rail.buttons,
			actions: actions.bar,
			statusEl: actions.status,
			backBtn: actions.back,
			continueBtn: actions.next,
		};
	}

	function unmountWizard() {
		if ( ! wizard ) {
			return;
		}
		wizard.rail.remove();
		wizard.actions.remove();
		wizard = null;
	}

	/* -------------------------------------------------------------------
	 * Visibility + chrome state application.
	 * ------------------------------------------------------------------- */

	function applyVisibility() {
		STEPS.forEach( function ( _step, index ) {
			var active = index === activeStep;
			stepGroups( index ).forEach( function ( node ) {
				if ( active ) {
					node.removeAttribute( HIDDEN_ATTR );
					node.removeAttribute( 'inert' );
				} else {
					node.setAttribute( HIDDEN_ATTR, 'true' );
					node.setAttribute( 'inert', '' );
				}
			} );
		} );
	}

	function clearVisibility() {
		allTrackedGroups().forEach( function ( node ) {
			node.removeAttribute( HIDDEN_ATTR );
			node.removeAttribute( 'inert' );
		} );
	}

	function updateChrome() {
		if ( ! wizard ) {
			return;
		}
		wizard.railButtons.forEach( function ( button, index ) {
			button.disabled = index > highestVisited;
			button.dataset.state = index === activeStep ? 'active' : index < activeStep ? 'done' : 'upcoming';
		} );

		var onPaymentStep = activeStep === STEPS.length - 1;
		var busy = STEPS[ activeStep ].id === 'shipping' && cartBusy();

		wizard.backBtn.disabled = activeStep === 0;
		wizard.backBtn.setAttribute( 'aria-hidden', activeStep === 0 ? 'true' : 'false' );

		// The final step reveals Woo's own native "Place order" button inside
		// the payment group; this bar's Continue action has no role there.
		wizard.continueBtn.hidden = onPaymentStep;
		wizard.continueBtn.disabled = busy;
		wizard.continueBtn.textContent = busy
			? 'Updating checkout…'
			: 'Continue to ' + ( STEPS[ activeStep + 1 ] ? STEPS[ activeStep + 1 ].label.toLowerCase() : '' );

		if ( busy ) {
			setStatus( 'Updating shipping and tax totals…', 'progress' );
		} else if ( wizard.statusEl.dataset.kind === 'progress' ) {
			setStatus();
		}
	}

	function goToStep( index, scroll ) {
		activeStep = Math.max( 0, Math.min( index, STEPS.length - 1 ) );
		highestVisited = Math.max( highestVisited, activeStep );
		applyVisibility();
		updateChrome();
		if ( scroll ) {
			var main = document.getElementById( 'primary' );
			var behavior = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ? 'auto' : 'smooth';
			( main || window ).scrollIntoView ? main.scrollIntoView( { behavior: behavior, block: 'start' } ) : window.scrollTo( { top: 0, behavior: behavior } );
		}
	}

	/* -------------------------------------------------------------------
	 * Reconciliation — Woo Blocks re-renders sections as the customer
	 * fills the form (e.g. the shipping-method block only appears once a
	 * valid address is entered and rates are fetched), so step membership
	 * is re-evaluated on every relevant DOM mutation, debounced to one
	 * animation frame.
	 * ------------------------------------------------------------------- */

	function reconcile() {
		reconcileScheduled = false;
		var root = checkoutRoot();
		if ( ! root ) {
			return;
		}

		if ( ! isMobile() ) {
			unmountWizard();
			clearVisibility();
			return;
		}

		mountWizard();
		applyVisibility();
		updateChrome();
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
			if ( wizard ) {
				updateChrome();
			}
		} );
	}

	var INIT_RETRY_LIMIT = 50; // ~10s at 200ms, bounding worst-case retry cost.

	/**
	 * The checkout root is expected in the initial server-rendered HTML, but
	 * this retries rather than bailing permanently on the first miss —
	 * belt-and-suspenders against any deferred/delayed render of the
	 * Checkout block on a given page load.
	 */
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

		observer = new MutationObserver( scheduleReconcile );
		observer.observe( root, { childList: true, subtree: true } );

		subscribeToStores();
		scheduleReconcile();

		// Woo Blocks hydrates asynchronously after wp-footer scripts run;
		// a few follow-up passes catch groups that were not yet in the DOM
		// on first mount without needing a fixed, blind delay.
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
