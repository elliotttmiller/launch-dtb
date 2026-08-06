/**
 * Drywall Toolbox — mobile checkout wizard (progressive enhancement only).
 *
 * Presents the single, native WooCommerce Checkout Block as three in-page
 * screens (Contact, Shipping, Payment) with no document navigation, no
 * iframe, and no second form. It never creates, clones, or moves a native
 * field, wallet, or payment control — it only toggles visibility of the
 * *existing* top-level block groups that WooCommerce itself already renders.
 *
 * Step membership is built from WooCommerce Blocks' own real, stable
 * per-block identity classes — the standard `wp-block-{namespace}-{block}`
 * convention WordPress core applies automatically to every registered
 * block, confirmed present in the currently-shipping
 * `woocommerce/assets/client/blocks/checkout.css`:
 *
 *   .wp-block-woocommerce-checkout-contact-information-block  -> Contact (email only)
 *   .wp-block-woocommerce-checkout-shipping-address-block     -> Shipping
 *   .wp-block-woocommerce-checkout-shipping-method-block      -> Shipping
 *   .wp-block-woocommerce-checkout-pickup-options-block        -> Shipping (if pickup enabled)
 *   .wp-block-woocommerce-checkout-billing-address-block      -> Shipping (only rendered if
 *                                                                 "billing same as shipping" is unchecked)
 *   .wp-block-woocommerce-checkout-payment-block               -> Payment
 *   .wp-block-woocommerce-checkout-express-payment-block       -> Payment (Apple Pay/Google Pay/Link row)
 *   .wp-block-woocommerce-checkout-order-note-block            -> Payment
 *   .wp-block-woocommerce-checkout-terms-block                 -> Payment
 *   .wp-block-woocommerce-checkout-actions-block                -> Payment (native "Place order")
 *
 * These replace an earlier three-times-rewritten DOM-classification
 * heuristic (`data-block-name` selectors that never render outside the
 * block editor, then DOM-position/ordinal inference, then a semantic
 * `.wc-block-checkout__*` class list with a document-order fallback bucket
 * for anything unmatched) — see docs/checkout/checkout-ui-architecture.md
 * for that history. The classes above are automatic WordPress core block
 * markup, not a WooCommerce-specific implementation detail, so there is no
 * fallback-by-document-order step here: a step's real selector either
 * resolves or it doesn't, and reconcile() below fails safe to the plain
 * single-scroll checkout if Contact or Payment content isn't found.
 *
 * For each match, the nearest ancestor `.wc-block-components-checkout-step`
 * (WooCommerce Blocks' stable per-step card wrapper) is what actually gets
 * hidden/shown, so the step's heading, border, and card styling move with
 * its fields rather than leaving an empty shell behind; a match with no such
 * wrapper (express payment, order note, terms, actions) is toggled directly.
 *
 * Step gating uses the platform's own HTML5 constraint validation
 * (checkValidity/reportValidity) against the fields *inside the active step
 * only*, plus the documented public `wc/store/cart` and `wc/store/checkout`
 * data stores to avoid advancing while shipping/tax totals are still
 * recalculating. No private/internal object graph is read.
 *
 * The Contact step collects email only, matching WooCommerce's own
 * `CheckoutFields.php` contact-location field list (`['email']` — Woo does
 * not support a name field at that location by design). Name is collected
 * on the Shipping step's native address fields, as WooCommerce itself
 * renders them; this script does not fork or duplicate that field, and does
 * not maintain any client-side identity-sync workaround.
 *
 * Runs only under a mobile viewport (matches the scope of this redesign
 * pass). At wider viewports every group is left visible and none of this
 * chrome is mounted, so the page is the plain, accessible single-scroll
 * Woo Blocks checkout. Waits for the checkout root to exist (retrying for
 * up to ~10s in case it renders later than DOMContentLoaded), and never
 * mounts the wizard chrome unless classification actually finds real
 * Contact and Payment content (a Woo Blocks version change or a customized
 * checkout layout could otherwise leave a Back/Continue bar over a page
 * where nothing is actually being hidden — worse than no enhancement).
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

	// Index into STEPS above. Each selector is WooCommerce Blocks' own real,
	// stable per-block identity class (see file header). Every match's
	// nearest `.wc-block-components-checkout-step` ancestor is the node
	// actually shown/hidden; a match with no such ancestor (express payment,
	// order note, terms, actions) is toggled directly.
	var GROUP_SELECTORS = [
		[ '.wp-block-woocommerce-checkout-contact-information-block' ], // contact
		[
			'.wp-block-woocommerce-checkout-shipping-address-block',
			'.wp-block-woocommerce-checkout-shipping-method-block',
			'.wp-block-woocommerce-checkout-pickup-options-block',
			'.wp-block-woocommerce-checkout-billing-address-block',
		], // shipping
		[
			'.wp-block-woocommerce-checkout-payment-block',
			'.wp-block-woocommerce-checkout-express-payment-block',
			'.wp-block-woocommerce-checkout-order-note-block',
			'.wp-block-woocommerce-checkout-terms-block',
			'.wp-block-woocommerce-checkout-actions-block',
		], // payment
	];

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
	 * Classify the checkout's own section wrappers into Contact / Shipping /
	 * Payment groups by WooCommerce Blocks' own real per-block identity
	 * classes. See the file header comment for the full selector map.
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

	/** All groups for a step that currently exist in the DOM. */
	function stepGroups( index ) {
		return classifyStepGroups()[ index ] || [];
	}

	function isMobile() {
		return Boolean( mobileMedia && mobileMedia.matches );
	}

	/* -------------------------------------------------------------------
	 * Documented WooCommerce Blocks data-store access — read selectors only.
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
				'<span class="dtb-checkout__step-dot" aria-hidden="true"><span class="dtb-checkout__step-dot-number">' + ( index + 1 ) + '</span><span class="dtb-checkout__step-dot-check">&#10003;</span></span>' +
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
		setStatus(); // Clear any error/progress message left over from the step being departed.
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

		// Contact and Payment always exist on any checkout regardless of
		// whether the cart needs shipping; if either comes back empty, the
		// classification hasn't found real content yet (Woo Blocks still
		// hydrating) or its selectors no longer match this store's markup
		// (e.g. a WooCommerce Blocks version change renamed the block).
		// Mounting the wizard chrome in that state would show a Back/Continue
		// bar over a page nothing is actually being hidden on — worse than
		// the plain page — so wait/skip instead. This is the primary safety
		// net now that step membership is real-selector-based rather than a
		// document-order heuristic, so it should rarely if ever trigger.
		var groups = classifyStepGroups();
		if ( ! groups[ 0 ].length || ! groups[ 2 ].length ) {
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
