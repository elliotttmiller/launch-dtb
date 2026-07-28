( function () {
	'use strict';

	/**
	 * Theme-owned checkout presentation controller.
	 *
	 * WooCommerce Checkout Block remains the only owner of customer/address data,
	 * shipping, tax, totals, validation, payment selection, order creation, and
	 * submission. This controller performs read-only classification, accessibility
	 * focus management, login-route handoff, busy-state presentation, and (below
	 * 1024px) a presentation-only Contact -> Shipping -> Payment step wizard.
	 *
	 * The wizard never creates a second form, field, or payment surface. It only
	 * assigns `data-dtb-checkout-step` + `aria-hidden` to top-level WooCommerce
	 * Checkout Block sections and toggles a CSS class that keeps inactive
	 * sections mounted and measurable (zero-height/opacity, not `display:none`)
	 * so the official Stripe gateway's Payment Element and wallet buttons are
	 * never unmounted or remounted while moving between steps. Desktop
	 * (1024px+) never receives step markers and remains one continuous page.
	 */

	const checkoutSelector = '.wc-block-checkout';
	const wizardViewport = window.matchMedia( '(max-width: 1023px)' );
	const wizardInactiveClass = 'is-dtb-checkout-step-inactive';
	const wizardExpressSelector = '.wp-block-woocommerce-checkout-express-payment-block, .wc-block-components-express-payment';
	const wizardStepWrapperSelector = '.wc-block-components-checkout-step';
	const wizardSteps = [
		{ id: 'contact', label: 'Contact', sublabel: 'Your details' },
		{ id: 'shipping', label: 'Shipping', sublabel: 'Delivery options' },
		{ id: 'payment', label: 'Payment', sublabel: 'Review & pay' },
	];

	/**
	 * Classify the WooCommerce Checkout Block's own top-level section wrappers
	 * into Contact / Shipping / Payment groups by structural position rather
	 * than an enumerated list of specific block class names. `.wc-block-
	 * components-checkout-step` is the one stable, version-resilient public
	 * class WooCommerce Blocks applies to every top-level step wrapper
	 * regardless of which concrete step it is; Woo always renders Contact
	 * first and Payment last, with zero or more shipping-related steps (an
	 * address step and/or a method step) in between. Any non-step sibling
	 * (order notes, terms, actions) is grouped with whichever step wrapper it
	 * follows in document order. This avoids depending on undocumented or
	 * version-specific block/element class names.
	 */
	function wizardStepGroups( root ) {
		const main = root.querySelector( '.wc-block-components-main, .wc-block-checkout__main' ) || root;
		const children = Array.from( main.children ).filter( ( node ) => (
			! node.classList.contains( 'dtb-checkout-wizard-actions' )
		) );
		const stepWrappers = children.filter( ( node ) => node.matches( wizardStepWrapperSelector ) );
		if ( stepWrappers.length === 0 ) {
			return [ [], [], [] ];
		}

		const firstStep = stepWrappers[ 0 ];
		const lastStep = stepWrappers[ stepWrappers.length - 1 ];
		const groups = [ [], [], [] ];

		children.forEach( ( node ) => {
			if ( node.matches( wizardExpressSelector ) ) {
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
			if ( stepWrappers.includes( node ) ) {
				groups[ 1 ].push( node );
				return;
			}
			// A non-step sibling (order notes, terms, actions row, etc.)
			// belongs with whichever step wrapper precedes it in the DOM.
			groups[ node.compareDocumentPosition( lastStep ) & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : 2 ].push( node );
		} );

		return groups;
	}
	const paymentRootSelector = '.wp-block-woocommerce-checkout-payment-block, .wc-block-checkout__payment-method';
	const loginSelector = [
		'a[href*="/my-account/"]',
		'a[href*="my-account?"]',
		'.wc-block-components-checkout-step__login-prompt a',
	].join( ', ' );
	const errorSelector = [
		'.wc-block-components-notice-banner.is-error',
		'.wc-block-components-validation-error',
		'.wc-block-store-notice.is-error',
		'.woocommerce-error[role="alert"]',
	].join( ', ' );
	const providerControlSelector = [
		'iframe[name^="__privateStripeFrame"]',
		'.wc-stripe-upe-element iframe',
		'.wcstripe-payment-element iframe',
		'.StripeElement iframe',
		'.wc-block-components-express-payment button:not([disabled])',
		'.wc-block-components-express-payment iframe',
	].join( ', ' );

	const storefrontBasePath = ( () => {
		const params = new URLSearchParams( window.location.search || '' );
		const candidate = String( params.get( 'dtb_storefront_base_path' ) || '' ).replace( /\/+$/, '' );
		return /^\/staging\/[A-Za-z0-9_-]+$/.test( candidate ) ? candidate : '';
	} )();
	const storefrontLoginUrl = `${ storefrontBasePath }/login?returnTo=%2Fcheckout`;

	let rootObserver = null;
	let mountObserver = null;
	let bodyObserver = null;
	let commerceUnsubscribe = null;
	let observedRoot = null;
	let reconcileQueued = false;
	let lastCommerceSignature = '';
	let lastErrorSignature = '';

	let wizardActiveStep = 0;
	let wizardHighestVisitedStep = 0;
	let wizardProgressEl = null;
	let wizardActionsEl = null;
	let wizardAnnounceEl = null;

	function checkoutRoot() {
		return document.querySelector( checkoutSelector );
	}

	function callSelector( store, method, fallback ) {
		try {
			return store && typeof store[ method ] === 'function' ? store[ method ]() : fallback;
		} catch {
			return fallback;
		}
	}

	function commerceSnapshot() {
		try {
			const data = window.wp?.data;
			const blocks = window.wc?.wcBlocksData;
			if ( ! data?.select || ! blocks?.cartStore ) {
				return { available: false, busy: false };
			}

			const cart = data.select( blocks.cartStore );
			const checkout = blocks.checkoutStore ? data.select( blocks.checkoutStore ) : null;
			const cartMeta = callSelector( cart, 'getCartMeta', {} ) || {};
			const busy = Boolean(
				callSelector( checkout, 'isCalculating', false )
				|| callSelector( checkout, 'isProcessing', false )
				|| callSelector( checkout, 'isBeforeProcessing', false )
				|| callSelector( checkout, 'isAfterProcessing', false )
				|| cartMeta.updatingCustomerData
				|| cartMeta.updatingSelectedRate
				|| cartMeta.updatingCart
			);

			return {
				available: true,
				busy,
				totals: callSelector( cart, 'getCartTotals', {} ) || {},
				customer: callSelector( cart, 'getCustomerData', {} ) || {},
				needsShipping: Boolean( callSelector( cart, 'getNeedsShipping', true ) ),
				hasCalculatedShipping: Boolean( callSelector( cart, 'getHasCalculatedShipping', false ) ),
			};
		} catch {
			return { available: false, busy: false };
		}
	}

	function directGatewayOptions( radioControl ) {
		const direct = Array.from( radioControl.children ).filter( ( node ) =>
			node.matches?.( '.wc-block-components-radio-control__option, .wc-block-components-radio-control-accordion-option' )
		);
		if ( direct.length > 0 ) {
			return direct;
		}

		return Array.from( radioControl.querySelectorAll( 'input[type="radio"]' ) )
			.map( ( input ) => input.closest( '.wc-block-components-radio-control__option, .wc-block-components-radio-control-accordion-option' ) )
			.filter( ( node, index, nodes ) =>
				node
				&& nodes.indexOf( node ) === index
				&& node.closest( '.wc-block-components-radio-control' ) === radioControl
			);
	}

	function classifyPaymentSurface( root ) {
		root.querySelectorAll( `${ paymentRootSelector } .wc-block-components-radio-control` ).forEach( ( radioControl ) => {
			const singleGateway = directGatewayOptions( radioControl ).length === 1;
			radioControl.classList.toggle( 'is-dtb-single-gateway', singleGateway );
			radioControl.closest( '.wc-block-components-payment-methods' )
				?.classList.toggle( 'is-dtb-single-gateway-set', singleGateway );
		} );

		const providerReady = Boolean( root.querySelector( providerControlSelector ) );
		document.body.classList.toggle( 'dtb-checkout-provider-ready', providerReady );
	}

	function bindLoginLink( link ) {
		if ( ! ( link instanceof HTMLAnchorElement ) ) {
			return;
		}

		link.href = storefrontLoginUrl;
		link.dataset.dtbStorefrontLogin = '1';
		if ( link.dataset.dtbStorefrontLoginBound === '1' ) {
			return;
		}

		link.dataset.dtbStorefrontLoginBound = '1';
		link.addEventListener( 'click', ( event ) => {
			if ( event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ) {
				return;
			}
			event.preventDefault();
			window.location.assign( storefrontLoginUrl );
		} );
	}

	function rewriteLoginLinks( root ) {
		root.querySelectorAll( loginSelector ).forEach( bindLoginLink );
	}

	function isVisible( element ) {
		return element instanceof HTMLElement
			&& ! element.hidden
			&& element.getClientRects().length > 0
			&& window.getComputedStyle( element ).visibility !== 'hidden';
	}

	function focusNewestError( root ) {
		const errors = Array.from( root.querySelectorAll( errorSelector ) ).filter( isVisible );
		if ( errors.length === 0 ) {
			document.body.classList.remove( 'dtb-checkout-has-error' );
			lastErrorSignature = '';
			return;
		}

		document.body.classList.add( 'dtb-checkout-has-error' );
		const error = errors[ errors.length - 1 ];
		const signature = String( error.textContent || '' ).replace( /\s+/g, ' ' ).trim().slice( 0, 500 );
		if ( ! signature || signature === lastErrorSignature ) {
			return;
		}

		lastErrorSignature = signature;
		if ( ! error.hasAttribute( 'tabindex' ) ) {
			error.setAttribute( 'tabindex', '-1' );
		}

		window.requestAnimationFrame( () => {
			const reducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
			error.scrollIntoView( { behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' } );
			error.focus( { preventScroll: true } );
		} );
	}

	function updateBusyState( root, snapshot = commerceSnapshot() ) {
		const busy = Boolean( snapshot.busy );
		const busyValue = busy ? 'true' : 'false';
		const runtimeValue = snapshot.available ? 'ready' : 'waiting';
		document.body.classList.toggle( 'dtb-checkout-is-busy', busy );
		if ( root.getAttribute( 'aria-busy' ) !== busyValue ) {
			root.setAttribute( 'aria-busy', busyValue );
		}
		if ( root.dataset.dtbCheckoutRuntime !== runtimeValue ) {
			root.dataset.dtbCheckoutRuntime = runtimeValue;
		}
	}

	function uniqueNodes( nodes ) {
		return Array.from( new Set( nodes.filter( Boolean ) ) );
	}

	function wizardStepElements( root, index ) {
		if ( ! root || ! wizardSteps[ index ] ) {
			return [];
		}
		return wizardStepGroups( root )[ index ] || [];
	}

	function clearWizardStepMarkers( root ) {
		root?.querySelectorAll( '[data-dtb-checkout-step]' ).forEach( ( node ) => {
			node.classList.remove( wizardInactiveClass );
			node.removeAttribute( 'aria-hidden' );
			delete node.dataset.dtbCheckoutStep;
		} );
	}

	function markWizardStepOwnership( root ) {
		clearWizardStepMarkers( root );
		const groups = wizardStepGroups( root );
		groups.forEach( ( nodes, index ) => nodes.forEach( ( node ) => {
			const inactive = index !== wizardActiveStep;
			node.dataset.dtbCheckoutStep = wizardSteps[ index ].id;
			node.classList.toggle( wizardInactiveClass, inactive );
			node.setAttribute( 'aria-hidden', inactive ? 'true' : 'false' );
		} ) );
	}

	function wizardStepControls( root, index ) {
		return uniqueNodes( wizardStepElements( root, index ).flatMap( ( node ) => Array.from( node.querySelectorAll( 'input, select, textarea' ) ) ) )
			.filter( ( control ) => ! control.disabled && control.type !== 'hidden' && control.willValidate !== false );
	}

	function setWizardMessage( message = '', kind = '' ) {
		const status = wizardActionsEl?.querySelector( '.dtb-checkout-wizard__status' );
		if ( ! status ) {
			return;
		}
		status.textContent = message;
		status.hidden = ! message;
		status.dataset.kind = kind;
	}

	function validateWizardControls( root, index, message ) {
		const invalid = wizardStepControls( root, index ).find( ( control ) => ! control.checkValidity() );
		if ( ! invalid ) {
			return true;
		}
		setWizardMessage( message, 'error' );
		invalid.reportValidity?.();
		invalid.focus?.();
		return false;
	}

	function validateWizardContactStep( root ) {
		return validateWizardControls( root, 0, 'Complete the highlighted fields before continuing.' );
	}

	function validateWizardShippingStep( root ) {
		if ( ! validateWizardControls( root, 1, 'Complete the highlighted shipping fields before continuing.' ) ) {
			return false;
		}
		const snapshot = commerceSnapshot();
		if ( snapshot.available && snapshot.needsShipping && ( snapshot.busy || ! snapshot.hasCalculatedShipping ) ) {
			setWizardMessage(
				snapshot.busy
					? 'Wait for shipping and tax totals to finish updating.'
					: 'Enter a complete shipping address and select a delivery method before continuing.',
				snapshot.busy ? 'progress' : 'error'
			);
			return false;
		}
		return true;
	}

	function updateWizardControls( root ) {
		wizardProgressEl?.querySelectorAll( '[data-dtb-checkout-step-target]' ).forEach( ( button ) => {
			const index = Number( button.dataset.dtbCheckoutStepTarget );
			const complete = index < wizardActiveStep;
			const current = index === wizardActiveStep;
			button.disabled = index > wizardHighestVisitedStep;
			button.classList.toggle( 'is-current', current );
			button.classList.toggle( 'is-complete', complete );
			button.setAttribute( 'aria-current', current ? 'step' : 'false' );
			button.closest( '.dtb-checkout-wizard__item' )?.classList.toggle( 'is-current', current );
			button.closest( '.dtb-checkout-wizard__item' )?.classList.toggle( 'is-complete', complete );
			const circle = button.querySelector( '.dtb-checkout-wizard__circle' );
			if ( circle ) {
				circle.textContent = complete ? '' : String( index + 1 );
			}
		} );

		if ( ! wizardActionsEl ) {
			return;
		}

		const back = wizardActionsEl.querySelector( '.dtb-checkout-wizard__back' );
		const next = wizardActionsEl.querySelector( '.dtb-checkout-wizard__next' );
		const onPayment = wizardActiveStep === 2;
		const snapshot = commerceSnapshot();
		const busy = wizardActiveStep === 1 && Boolean( snapshot.busy );

		wizardActionsEl.classList.toggle( 'is-payment-step', onPayment );
		back.disabled = wizardActiveStep === 0;
		back.setAttribute( 'aria-hidden', wizardActiveStep === 0 ? 'true' : 'false' );
		next.hidden = onPayment;
		next.disabled = busy;
		next.textContent = busy ? 'Updating checkout…' : ( wizardActiveStep === 0 ? 'Continue to shipping' : 'Continue to payment' );

		if ( busy ) {
			setWizardMessage( 'Updating shipping and tax totals…', 'progress' );
		} else if ( wizardActionsEl.querySelector( '.dtb-checkout-wizard__status' )?.dataset.kind === 'progress' ) {
			setWizardMessage();
		}
	}

	function focusWizardStepHeading( root ) {
		const heading = wizardStepElements( root, wizardActiveStep )
			.flatMap( ( node ) => Array.from( node.querySelectorAll( '.wc-block-components-checkout-step__title, h2, h3' ) ) )
			.find( Boolean );
		if ( ! heading ) {
			return;
		}
		if ( ! heading.hasAttribute( 'tabindex' ) ) {
			heading.setAttribute( 'tabindex', '-1' );
		}
		heading.focus( { preventScroll: true } );
	}

	function announceWizardStep() {
		if ( ! wizardAnnounceEl ) {
			return;
		}
		const step = wizardSteps[ wizardActiveStep ];
		wizardAnnounceEl.textContent = `Step ${ wizardActiveStep + 1 } of ${ wizardSteps.length }: ${ step.label }, ${ step.sublabel }`;
	}

	function showWizardStep( root, index, scroll ) {
		wizardActiveStep = Math.max( 0, Math.min( index, wizardSteps.length - 1 ) );
		wizardHighestVisitedStep = Math.max( wizardHighestVisitedStep, wizardActiveStep );
		markWizardStepOwnership( root );
		updateWizardControls( root );
		if ( scroll ) {
			const reducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
			wizardProgressEl?.scrollIntoView( { behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' } );
			focusWizardStepHeading( root );
			announceWizardStep();
		}
	}

	function goToNextWizardStep( root ) {
		setWizardMessage();
		if ( wizardActiveStep === 0 && ! validateWizardContactStep( root ) ) {
			return;
		}
		if ( wizardActiveStep === 1 && ! validateWizardShippingStep( root ) ) {
			return;
		}
		showWizardStep( root, wizardActiveStep + 1, true );
	}

	function goToPreviousWizardStep( root ) {
		if ( wizardActiveStep > 0 ) {
			showWizardStep( root, wizardActiveStep - 1, true );
		}
	}

	function appendText( parent, tag, className, text ) {
		const node = document.createElement( tag );
		if ( className ) {
			node.className = className;
		}
		if ( text ) {
			node.textContent = text;
		}
		parent.append( node );
		return node;
	}

	function createWizardProgress() {
		const nav = document.createElement( 'nav' );
		nav.className = 'dtb-checkout-wizard-progress';
		nav.setAttribute( 'aria-label', 'Checkout progress' );
		const track = document.createElement( 'ol' );
		track.className = 'dtb-checkout-wizard__track';

		wizardSteps.forEach( ( step, index ) => {
			const item = document.createElement( 'li' );
			item.className = 'dtb-checkout-wizard__item';
			const button = document.createElement( 'button' );
			button.type = 'button';
			button.className = 'dtb-checkout-wizard__button';
			button.dataset.dtbCheckoutStepTarget = String( index );
			appendText( button, 'span', 'dtb-checkout-wizard__circle', String( index + 1 ) ).setAttribute( 'aria-hidden', 'true' );
			const text = appendText( button, 'span', 'dtb-checkout-wizard__text', '' );
			appendText( text, 'span', 'dtb-checkout-wizard__label', step.label );
			appendText( text, 'span', 'dtb-checkout-wizard__sublabel', step.sublabel );
			button.addEventListener( 'click', ( event ) => {
				event.preventDefault();
				const root = checkoutRoot();
				if ( root && index <= wizardHighestVisitedStep ) {
					showWizardStep( root, index, true );
				}
			} );
			item.append( button );
			track.append( item );
		} );

		nav.append( track );
		return nav;
	}

	function createWizardActions() {
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'dtb-checkout-wizard-actions';
		const status = appendText( wrapper, 'div', 'dtb-checkout-wizard__status', '' );
		status.setAttribute( 'role', 'status' );
		status.setAttribute( 'aria-live', 'polite' );
		status.hidden = true;

		const inner = document.createElement( 'div' );
		inner.className = 'dtb-checkout-wizard-actions__inner';
		const back = appendText( inner, 'button', 'dtb-checkout-wizard__back', 'Back' );
		back.type = 'button';
		back.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			const root = checkoutRoot();
			if ( root ) {
				goToPreviousWizardStep( root );
			}
		} );
		const next = appendText( inner, 'button', 'dtb-checkout-wizard__next', '' );
		next.type = 'button';
		next.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			event.stopPropagation();
			const root = checkoutRoot();
			if ( root ) {
				goToNextWizardStep( root );
			}
		} );

		wrapper.append( inner );
		return wrapper;
	}

	function teardownWizard( root ) {
		clearWizardStepMarkers( root );
		document.body.classList.remove( 'dtb-checkout-wizard-enhanced' );
		wizardProgressEl?.remove();
		wizardProgressEl = null;
		wizardActionsEl?.remove();
		wizardActionsEl = null;
		wizardAnnounceEl?.remove();
		wizardAnnounceEl = null;
	}

	function mountWizard( root ) {
		document.body.classList.add( 'dtb-checkout-wizard-enhanced' );
		const main = root.querySelector( '.wc-block-components-main, .wc-block-checkout__main' ) || root;

		if ( ! wizardProgressEl?.isConnected ) {
			wizardProgressEl = createWizardProgress();
			root.parentElement?.insertBefore( wizardProgressEl, root );
		}
		if ( ! wizardActionsEl?.isConnected ) {
			wizardActionsEl = createWizardActions();
			main.append( wizardActionsEl );
		}
		if ( ! wizardAnnounceEl?.isConnected ) {
			wizardAnnounceEl = document.createElement( 'div' );
			wizardAnnounceEl.className = 'dtb-checkout-wizard__announce';
			wizardAnnounceEl.setAttribute( 'role', 'status' );
			wizardAnnounceEl.setAttribute( 'aria-live', 'polite' );
			document.body.append( wizardAnnounceEl );
		}

		showWizardStep( root, wizardActiveStep, false );
	}

	function reconcileWizard( root ) {
		if ( wizardViewport.matches ) {
			mountWizard( root );
		} else {
			teardownWizard( root );
		}
	}

	function reconcile() {
		reconcileQueued = false;
		const root = checkoutRoot();
		if ( ! root ) {
			return;
		}

		if ( root !== observedRoot ) {
			bindRootObserver( root );
		}

		document.body.classList.add( 'dtb-checkout-enhanced' );
		rewriteLoginLinks( root );
		classifyPaymentSurface( root );
		updateBusyState( root );
		focusNewestError( root );
		reconcileWizard( root );
	}

	function queueReconcile() {
		if ( reconcileQueued ) {
			return;
		}
		reconcileQueued = true;
		window.requestAnimationFrame( reconcile );
	}

	function bindRootObserver( root ) {
		rootObserver?.disconnect();
		mountObserver?.disconnect();
		bodyObserver?.disconnect();
		bodyObserver = null;
		observedRoot = root;

		rootObserver = new MutationObserver( queueReconcile );
		rootObserver.observe( root, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: [ 'class', 'aria-invalid', 'role' ],
		} );

		if ( root.parentElement ) {
			mountObserver = new MutationObserver( queueReconcile );
			mountObserver.observe( root.parentElement, { childList: true } );
		}
	}

	function bindCommerceStore() {
		if ( commerceUnsubscribe || ! window.wp?.data?.subscribe || ! window.wc?.wcBlocksData?.cartStore ) {
			return;
		}

		commerceUnsubscribe = window.wp.data.subscribe( () => {
			const snapshot = commerceSnapshot();
			const totals = snapshot.totals || {};
			const shipping = snapshot.customer?.shippingAddress || snapshot.customer?.shipping_address || {};
			const signature = JSON.stringify( [
				snapshot.available,
				snapshot.busy,
				snapshot.needsShipping,
				snapshot.hasCalculatedShipping,
				totals.total_shipping,
				totals.total_tax,
				totals.total_price,
				shipping.country,
				shipping.state,
				shipping.postcode,
			] );
			if ( signature === lastCommerceSignature ) {
				return;
			}
			lastCommerceSignature = signature;
			queueReconcile();
		} );
	}

	function initialize() {
		bindCommerceStore();
		bodyObserver = new MutationObserver( () => {
			if ( checkoutRoot() ) {
				queueReconcile();
			}
		} );
		bodyObserver.observe( document.body, { childList: true, subtree: true } );
		wizardViewport.addEventListener( 'change', queueReconcile );
		queueReconcile();
		window.setTimeout( queueReconcile, 250 );
		window.setTimeout( queueReconcile, 1000 );
	}

	function cleanup() {
		rootObserver?.disconnect();
		mountObserver?.disconnect();
		bodyObserver?.disconnect();
		wizardViewport.removeEventListener( 'change', queueReconcile );
		if ( typeof commerceUnsubscribe === 'function' ) {
			commerceUnsubscribe();
		}
	}

	window.addEventListener( 'pagehide', cleanup, { once: true } );
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	} else {
		initialize();
	}
} )();
