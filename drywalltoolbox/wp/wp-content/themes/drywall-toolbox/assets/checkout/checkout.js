/**
 * Drywall Toolbox — mobile checkout wizard (progressive enhancement only).
 *
 * Presents the single, native WooCommerce Checkout Block as three in-page
 * screens (Contact, Shipping, Payment) with no document navigation, no
 * iframe, and no second form. It never creates, clones, or moves a native
 * field, wallet, or payment control — it only toggles visibility of the
 * *existing* top-level block groups that WooCommerce itself already renders.
 *
 * Groups are classified by WooCommerce Blocks' own stable, semantic CSS
 * classes — not `data-block-name` attributes (only present in the block
 * editor's own markup, never in this store's frontend HTML — see commit
 * 320b536 / PR #44 in this repo's history) and not bare DOM-position/ordinal
 * inference (fragile against extra wrapper elements a payment gateway's own
 * script may inject around its step). Each semantic class below is verified
 * present in the currently-shipping `woocommerce/assets/client/blocks/checkout.css`:
 *
 *   .wc-block-components-express-payment   -> Contact (rendered above it)
 *   .wc-block-checkout__contact-fields     -> Contact
 *   .wc-block-checkout__shipping-fields    -> Shipping
 *   .wc-block-checkout__billing-fields     -> Shipping
 *   .wc-block-checkout__shipping-method    -> Shipping
 *   .wc-block-checkout__pickup-options     -> Shipping
 *   .wc-block-checkout__payment-method     -> Payment
 *   .wc-block-checkout__add-note           -> Payment
 *   .wc-block-checkout__terms              -> Payment
 *   .wc-block-checkout__actions            -> Payment (native "Place order")
 *
 * For each match, the nearest ancestor `.wc-block-components-checkout-step`
 * (WooCommerce Blocks' stable per-step card wrapper) is what actually gets
 * hidden/shown, so the step's heading, border, and card styling move with
 * its fields rather than leaving an empty shell behind. Express payment has
 * no such wrapper and is toggled directly. See classifyStepGroups() below.
 *
 * Any `.wc-block-components-checkout-step` card the selectors above don't
 * match (a markup variant this pass didn't anticipate — e.g. a "Shipping
 * options" placeholder rendered before an address exists) is bucketed with
 * whichever classified step precedes it in document order, so it is always
 * owned by exactly one step instead of staying permanently visible on every
 * step — this was observed live as a "Shipping options" card bleeding
 * through onto the Contact screen.
 *
 * Step gating uses the platform's own HTML5 constraint validation
 * (checkValidity/reportValidity) against the fields *inside the active step
 * only*, plus the documented public `wc/store/cart` and `wc/store/checkout`
 * data stores to avoid advancing while shipping/tax totals are still
 * recalculating. No private/internal object graph is read. An earlier
 * version of this gate also checked `wc/store/validation`'s
 * `hasValidationErrors()` — that selector is global across the *entire*
 * checkout, not scoped to the step being left, so it reported true (and
 * permanently blocked Continue with no visibly invalid field) as soon as any
 * not-yet-visited step's required-but-empty fields existed anywhere in the
 * form. Removed; the scoped HTML5 check above is sufficient.
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

	// Single source of truth for the Contact step's name inputs, selected by
	// their `autocomplete` value (stable regardless of the internal id
	// WooCommerce Blocks assigns) rather than duplicated per call site.
	var CONTACT_GIVEN_NAME_SELECTOR = 'input[autocomplete="given-name"]';
	var CONTACT_FAMILY_NAME_SELECTOR = 'input[autocomplete="family-name"]';
	var CONTACT_IDENTITY_SELECTOR = CONTACT_GIVEN_NAME_SELECTOR + ', ' + CONTACT_FAMILY_NAME_SELECTOR;

	var STEPS = [
		{ id: 'contact', label: 'Contact' },
		{ id: 'shipping', label: 'Shipping' },
		{ id: 'payment', label: 'Payment' },
	];

	var STEP_WRAPPER_SELECTOR = '.wc-block-components-checkout-step';

	// Index into STEPS above. Selectors are matched against elements *inside*
	// the checkout root; each match's nearest `.wc-block-components-checkout-step`
	// ancestor is the node actually shown/hidden. `direct: true` entries have
	// no such wrapper and are toggled as-is.
	var GROUP_DEFINITIONS = [
		{
			index: 0, // contact
			wrapped: [ '.wc-block-checkout__contact-fields' ],
			direct: [ '.wc-block-components-express-payment' ],
		},
		{
			index: 1, // shipping
			wrapped: [
				'.wc-block-checkout__shipping-fields',
				'.wc-block-checkout__billing-fields',
				'.wc-block-checkout__shipping-method',
				'.wc-block-checkout__pickup-options',
			],
			direct: [],
		},
		{
			index: 2, // payment
			wrapped: [ '.wc-block-checkout__payment-method' ],
			direct: [ '.wc-block-checkout__add-note', '.wc-block-checkout__terms', '.wc-block-checkout__actions' ],
		},
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
	 * Payment groups by WooCommerce Blocks' own semantic CSS classes. See the
	 * file header comment for the full selector map and why this replaced an
	 * earlier, broken `data-block-name` selector list and, before that, a
	 * DOM-position/ordinal heuristic that assumed every step wrapper is a
	 * direct child of one common container — an assumption this store's
	 * actual markup did not satisfy.
	 */
	function classifyStepGroups() {
		var root = checkoutRoot();
		var groups = [ [], [], [] ];
		if ( ! root ) {
			return groups;
		}

		GROUP_DEFINITIONS.forEach( function ( group ) {
			group.wrapped.forEach( function ( selector ) {
				root.querySelectorAll( selector ).forEach( function ( inner ) {
					var node = inner.closest( STEP_WRAPPER_SELECTOR ) || inner;
					if ( groups[ group.index ].indexOf( node ) === -1 ) {
						groups[ group.index ].push( node );
					}
				} );
			} );
			group.direct.forEach( function ( selector ) {
				root.querySelectorAll( selector ).forEach( function ( node ) {
					if ( groups[ group.index ].indexOf( node ) === -1 ) {
						groups[ group.index ].push( node );
					}
				} );
			} );
		} );

		// Any `.wc-block-components-checkout-step` card that none of the
		// semantic selectors above matched (a Woo Blocks markup variant this
		// pass didn't anticipate, e.g. a "Shipping options" placeholder
		// rendered before an address exists) must still end up in exactly
		// one group instead of staying permanently unhidden on every step —
		// an unclassified card was observed bleeding through onto the
		// Contact screen. Bucket it with whichever classified step wrapper
		// precedes it in document order (falling back to Contact if none
		// does), so every real WooCommerce step card is always owned by
		// some step and gets hidden/shown with the rest of that step.
		var classified = allGroupNodes( groups );
		var allStepWrappers = root.querySelectorAll( STEP_WRAPPER_SELECTOR );
		var lastGroupIndex = 0;
		allStepWrappers.forEach( function ( wrapper ) {
			var ownerIndex = groupIndexOf( groups, wrapper );
			if ( ownerIndex !== -1 ) {
				lastGroupIndex = ownerIndex;
				return;
			}
			if ( classified.indexOf( wrapper ) !== -1 ) {
				return;
			}
			groups[ lastGroupIndex ].push( wrapper );
			classified.push( wrapper );
		} );

		return groups;
	}

	function allGroupNodes( groups ) {
		var all = [];
		groups.forEach( function ( nodes ) {
			nodes.forEach( function ( node ) {
				if ( all.indexOf( node ) === -1 ) {
					all.push( node );
				}
			} );
		} );
		return all;
	}

	function groupIndexOf( groups, node ) {
		for ( var i = 0; i < groups.length; i++ ) {
			if ( groups[ i ].indexOf( node ) !== -1 ) {
				return i;
			}
		}
		return -1;
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
	 * Documented WooCommerce Blocks data-store access — read selectors, plus
	 * one sanctioned write (see syncContactIdentityToAddresses() below).
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

	function dispatchStore( key ) {
		try {
			return window.wp && window.wp.data && typeof window.wp.data.dispatch === 'function'
				? window.wp.data.dispatch( key )
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
	 * Contact-step identity -> WooCommerce address sync.
	 *
	 * The Contact step collects first/last name through WooCommerce's
	 * Additional Checkout Fields API (`dtb/first_name`, `dtb/last_name` —
	 * see mu-plugins/dtb-commerce/Validation/CheckoutFieldPolicy.php), a
	 * *different* field group than WooCommerce's own canonical billing/
	 * shipping `first_name`/`last_name` — which that same policy file hides
	 * from the shipping/billing address forms, since the Contact step
	 * already collects the name once. CheckoutFieldPolicy.php syncs a
	 * non-empty Contact value onto the canonical billing/shipping name, but
	 * only on the *server*, inside the Store API's checkout-processing
	 * request. Nothing populated WooCommerce Blocks' own *client-side*
	 * billing/shipping address state (`wc/store/cart`'s billingAddress/
	 * shippingAddress) before that point, because nothing ever wrote a
	 * value into it — the native inputs that would normally do that are the
	 * very ones this store hides.
	 *
	 * Two live symptoms traced back to that one gap: Payment Plugins for
	 * Stripe's Payment Element reads `billing_details.name` from that same
	 * client-side billing address state when confirming payment (it has no
	 * knowledge of Woo's Additional Checkout Fields), so an empty name
	 * there surfaced Stripe's own "Missing required param:
	 * payment_method_data[billing_details][name]" error at Payment; and
	 * Stripe's Address Element on the Shipping step reads the same shipping
	 * address state for its own client-side verification, surfacing
	 * "Either Name or Company is required" there too.
	 *
	 * The fix uses `wc/store/cart`'s own documented, public dispatch
	 * actions (`setBillingAddress`/`setShippingAddress` — WooCommerce
	 * Blocks' sanctioned mechanism for a third-party field to feed the
	 * canonical address, the same public data-store surface this file
	 * already reads from elsewhere) to mirror a non-empty Contact name into
	 * both addresses as the customer types, instead of waiting for the
	 * order-processing request. A pure wallet flow (Apple Pay/Google Pay/
	 * Link) never touches the Contact step's name inputs at all — see
	 * firstEmptyContactIdentityField()'s own comment — so this sync simply
	 * never fires for that flow and never touches a wallet-supplied name.
	 * ------------------------------------------------------------------- */

	var IDENTITY_SYNC_DEBOUNCE_MS = 400;
	var identitySyncTimer = null;

	function contactIdentityValues() {
		var root = checkoutRoot();
		var given = root ? root.querySelector( CONTACT_GIVEN_NAME_SELECTOR ) : null;
		var family = root ? root.querySelector( CONTACT_FAMILY_NAME_SELECTOR ) : null;
		return {
			firstName: given ? String( given.value || '' ).trim() : '',
			lastName: family ? String( family.value || '' ).trim() : '',
		};
	}

	function syncContactIdentityToAddresses() {
		var values = contactIdentityValues();
		if ( ! values.firstName && ! values.lastName ) {
			return;
		}

		var cart = selectStore( 'wc/store/cart' );
		var cartDispatch = dispatchStore( 'wc/store/cart' );
		if ( ! cart || ! cartDispatch || typeof cart.getCustomerData !== 'function' ) {
			return;
		}

		var customerData = cart.getCustomerData() || {};
		[
			{ key: 'billingAddress', setter: 'setBillingAddress' },
			{ key: 'shippingAddress', setter: 'setShippingAddress' },
		].forEach( function ( pair ) {
			if ( typeof cartDispatch[ pair.setter ] !== 'function' ) {
				return;
			}
			var current = customerData[ pair.key ] || {};
			var next = Object.assign( {}, current );
			var changed = false;
			if ( values.firstName && current.first_name !== values.firstName ) {
				next.first_name = values.firstName;
				changed = true;
			}
			if ( values.lastName && current.last_name !== values.lastName ) {
				next.last_name = values.lastName;
				changed = true;
			}
			if ( changed ) {
				try {
					cartDispatch[ pair.setter ]( next );
				} catch ( e ) {
					// No-op: a store/version mismatch here should never break checkout.
				}
			}
		} );
	}

	function scheduleIdentitySync() {
		window.clearTimeout( identitySyncTimer );
		identitySyncTimer = window.setTimeout( syncContactIdentityToAddresses, IDENTITY_SYNC_DEBOUNCE_MS );
	}

	function isContactIdentityField( target ) {
		var root = checkoutRoot();
		return Boolean(
			target &&
			target.matches &&
			target.matches( CONTACT_IDENTITY_SELECTOR ) &&
			root &&
			root.contains( target )
		);
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
			group.querySelectorAll( CONTACT_IDENTITY_SELECTOR ).forEach( function ( control ) {
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
		// hydrating) or its selectors no longer match this store's markup.
		// Mounting the wizard chrome in that state would show a Back/Continue
		// bar over a page nothing is actually being hidden on — worse than
		// the plain page — so wait/skip instead.
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
		// on first mount without needing a fixed, blind delay. The same
		// follow-up passes also cover a name pre-filled by browser autofill
		// or restored on back-navigation without the user ever triggering
		// an `input`/`blur` event on the field.
		window.setTimeout( scheduleReconcile, 300 );
		window.setTimeout( scheduleReconcile, 900 );
		window.setTimeout( syncContactIdentityToAddresses, 300 );
		window.setTimeout( syncContactIdentityToAddresses, 900 );
	}

	// Delegated (not bound to specific elements, since the Contact step's
	// fields render asynchronously): mirrors a typed Contact name into
	// WooCommerce's client-side billing/shipping address state — see
	// syncContactIdentityToAddresses()'s own comment above for why. `blur`
	// does not bubble, so it's bound on the capture phase instead.
	document.addEventListener( 'input', function ( event ) {
		if ( isContactIdentityField( event.target ) ) {
			scheduleIdentitySync();
		}
	} );
	document.addEventListener( 'blur', function ( event ) {
		if ( isContactIdentityField( event.target ) ) {
			syncContactIdentityToAddresses();
		}
	}, true );

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', function () {
			init( 0 );
		}, { once: true } );
	} else {
		init( 0 );
	}
} )();
