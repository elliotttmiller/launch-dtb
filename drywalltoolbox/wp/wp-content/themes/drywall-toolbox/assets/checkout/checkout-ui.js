( function () {
	'use strict';

	/**
	 * Theme-owned checkout presentation controller.
	 * WooCommerce owns customer/address state, shipping, tax, totals, validation,
	 * payment and submission. DTB owns only responsive presentation and read-only UI.
	 */

	const mobileViewport = window.matchMedia( '(max-width: 767px)' );
	const rootSelector = '.wc-block-checkout';
	const inactiveClass = 'is-dtb-checkout-step-inactive';
	const bodyStepClasses = [ 'dtb-checkout-step-contact', 'dtb-checkout-step-shipping', 'dtb-checkout-step-payment' ];
	const proxySelector = '[data-dtb-contact-identity-proxy]';
	const storefrontBasePath = ( () => {
		const params = new URLSearchParams( window.location.search || '' );
		const candidate = String( params.get( 'dtb_storefront_base_path' ) || '' ).replace( /\/+$/, '' );
		return /^\/staging\/[A-Za-z0-9_-]+$/.test( candidate ) ? candidate : '';
	} )();
	const storefrontLoginUrl = `${ storefrontBasePath }/login?returnTo=%2Fcheckout`;

	const steps = [
		{
			id: 'contact', label: 'Contact', selectors: [
				'.wp-block-woocommerce-checkout-express-payment-block',
				'.wp-block-woocommerce-checkout-contact-information-block',
				'.wp-block-woocommerce-checkout-create-account-block',
				'[data-block-name="woocommerce/checkout-contact-information-block"]',
				'.wc-block-checkout__contact-fields',
			],
		},
		{
			id: 'shipping', label: 'Shipping', selectors: [
				'.wp-block-woocommerce-checkout-shipping-method-block',
				'.wp-block-woocommerce-checkout-pickup-options-block',
				'.wp-block-woocommerce-checkout-shipping-address-block',
				'.wp-block-woocommerce-checkout-billing-address-block',
				'.wp-block-woocommerce-checkout-shipping-methods-block',
				'[data-block-name="woocommerce/checkout-shipping-address-block"]',
				'[data-block-name="woocommerce/checkout-billing-address-block"]',
				'.wc-block-checkout__shipping-fields',
				'.wc-block-checkout__shipping-address',
				'.wc-block-checkout__billing-fields',
				'.wc-block-checkout__shipping-option',
				'.wc-block-checkout__shipping-method',
			],
		},
		{
			id: 'payment', label: 'Payment', selectors: [
				'.wp-block-woocommerce-checkout-payment-block',
				'.wp-block-woocommerce-checkout-additional-information-block',
				'.wp-block-woocommerce-checkout-order-note-block',
				'.wp-block-woocommerce-checkout-terms-block',
				'.wp-block-woocommerce-checkout-actions-block',
				'[data-block-name="woocommerce/checkout-payment-block"]',
				'.wc-block-checkout__payment-method',
				'.wc-block-checkout__order-notes',
				'.wc-block-checkout__terms',
				'.wc-block-checkout__actions',
			],
		},
	];

	const contactFields = [
		{ key: 'first_name', id: 'dtb-contact-first-name', label: 'First name', autocomplete: 'given-name', required: true, selectors: [ '#shipping-first_name', '#billing_first_name', '[name="shipping_first_name"]', '[name="billing_first_name"]' ] },
		{ key: 'last_name', id: 'dtb-contact-last-name', label: 'Last name', autocomplete: 'family-name', required: true, selectors: [ '#shipping-last_name', '#billing_last_name', '[name="shipping_last_name"]', '[name="billing_last_name"]' ] },
		{ key: 'phone', id: 'dtb-contact-phone', label: 'Phone (optional)', autocomplete: 'tel', required: false, selectors: [ '#shipping-phone', '#billing-phone', '#shipping_phone', '#billing_phone', '[name="shipping_phone"]', '[name="billing_phone"]' ] },
	];

	let activeStep = 0;
	let highestVisitedStep = 0;
	let progress = null;
	let actionBar = null;
	let observer = null;
	let commerceUnsubscribe = null;
	let reconcileQueued = false;
	let lastCommerceSignature = '';

	const root = () => document.querySelector( rootSelector );
	const unique = ( values ) => Array.from( new Set( values.filter( Boolean ) ) );
	const topLevel = ( nodes ) => nodes.filter( ( node ) => ! nodes.some( ( other ) => other !== node && other.contains( node ) ) );

	function stepElements( index ) {
		const checkout = root();
		const step = steps[ index ];
		if ( ! checkout || ! step ) return [];
		return topLevel( unique( step.selectors.flatMap( ( selector ) => Array.from( checkout.querySelectorAll( selector ) ) ) ) );
	}

	function clearMarkers() {
		root()?.querySelectorAll( '[data-dtb-checkout-step]' ).forEach( ( node ) => {
			node.classList.remove( inactiveClass );
			node.removeAttribute( 'aria-hidden' );
			delete node.dataset.dtbCheckoutStep;
		} );
	}

	function markSteps() {
		if ( ! mobileViewport.matches ) {
			clearMarkers();
			return;
		}
		clearMarkers();
		const ownership = new Map();
		steps.forEach( ( step, index ) => stepElements( index ).forEach( ( node ) => {
			if ( ! ownership.has( node ) ) ownership.set( node, index );
		} ) );
		ownership.forEach( ( index, node ) => {
			const inactive = index !== activeStep;
			node.dataset.dtbCheckoutStep = steps[ index ].id;
			node.classList.toggle( inactiveClass, inactive );
			node.setAttribute( 'aria-hidden', inactive ? 'true' : 'false' );
		} );
	}

	function nativeInputs( field ) {
		return unique( field.selectors.flatMap( ( selector ) => Array.from( document.querySelectorAll( selector ) ) ) );
	}

	function setNativeValue( input, value ) {
		if ( ! input || input.value === value ) return;
		const descriptor = Object.getOwnPropertyDescriptor( window.HTMLInputElement.prototype, 'value' );
		descriptor?.set?.call( input, value );
		input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
		input.dispatchEvent( new Event( 'change', { bubbles: true } ) );
	}

	function customerData() {
		try {
			const descriptor = window.wc?.wcBlocksData?.cartStore;
			return descriptor && window.wp?.data?.select ? window.wp.data.select( descriptor )?.getCustomerData?.() || {} : {};
		} catch { return {}; }
	}

	function canonicalValue( field ) {
		const live = nativeInputs( field ).find( ( input ) => String( input.value || '' ).trim() );
		if ( live ) return String( live.value || '' );
		const customer = customerData();
		const shipping = customer.shippingAddress || customer.shipping_address || {};
		const billing = customer.billingAddress || customer.billing_address || {};
		return String( shipping[ field.key ] || billing[ field.key ] || '' );
	}

	function contactBlock() {
		const checkout = root();
		return checkout?.querySelector( '.wp-block-woocommerce-checkout-contact-information-block, [data-block-name="woocommerce/checkout-contact-information-block"], .wc-block-checkout__contact-fields' ) || null;
	}

	function createProxyField( field ) {
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'dtb-contact-proxy-field dtb-contact-identity-field';
		const label = document.createElement( 'label' );
		label.htmlFor = field.id;
		label.textContent = field.label;
		const input = document.createElement( 'input' );
		input.id = field.id;
		input.type = field.key === 'phone' ? 'tel' : 'text';
		input.autocomplete = field.autocomplete;
		input.required = field.required;
		input.maxLength = field.key === 'phone' ? 32 : 80;
		input.dataset.dtbCanonicalContactKey = field.key;
		input.value = canonicalValue( field );
		const sync = () => nativeInputs( field ).forEach( ( native ) => setNativeValue( native, input.value ) );
		input.addEventListener( 'input', sync );
		input.addEventListener( 'change', sync );
		wrapper.append( label, input );
		return wrapper;
	}

	function ensureContactProxy() {
		if ( ! mobileViewport.matches ) {
			document.querySelectorAll( proxySelector ).forEach( ( node ) => node.remove() );
			return null;
		}
		const block = contactBlock();
		const container = block?.querySelector( '.wc-block-components-checkout-step__container' ) || block;
		if ( ! container ) return null;
		let group = container.querySelector( proxySelector );
		if ( ! group ) {
			group = document.createElement( 'div' );
			group.className = 'dtb-contact-proxy-grid';
			group.dataset.dtbContactIdentityProxy = '1';
			contactFields.forEach( ( field ) => group.append( createProxyField( field ) ) );
			const email = container.querySelector( 'input[type="email"], input[autocomplete="email"]' );
			const emailWrapper = email?.closest( '.wc-block-components-text-input' );
			if ( emailWrapper?.parentNode === container ) emailWrapper.insertAdjacentElement( 'afterend', group );
			else container.append( group );
		}
		contactFields.forEach( ( field ) => {
			const proxy = group.querySelector( `[data-dtb-canonical-contact-key="${ field.key }"]` );
			const current = canonicalValue( field );
			if ( proxy && ! proxy.value && current ) proxy.value = current;
			if ( proxy?.value ) nativeInputs( field ).forEach( ( native ) => setNativeValue( native, proxy.value ) );
		} );
		return group;
	}

	function rewriteLoginLinks() {
		root()?.querySelectorAll( 'a[href*="/my-account/"]' ).forEach( ( link ) => {
			link.href = storefrontLoginUrl;
			link.dataset.dtbStorefrontLogin = '1';
		} );
	}

	function callSelector( store, method, fallback ) {
		try { return store && typeof store[ method ] === 'function' ? store[ method ]() : fallback; } catch { return fallback; }
	}

	function commerceSnapshot() {
		try {
			const wpData = window.wp?.data;
			const blocks = window.wc?.wcBlocksData;
			if ( ! wpData?.select || ! blocks?.cartStore ) return { available: false };
			const cart = wpData.select( blocks.cartStore );
			const checkout = blocks.checkoutStore ? wpData.select( blocks.checkoutStore ) : null;
			return {
				available: true,
				totals: callSelector( cart, 'getCartTotals', {} ) || {},
				customer: callSelector( cart, 'getCustomerData', {} ) || {},
				cartMeta: callSelector( cart, 'getCartMeta', {} ) || {},
				needsShipping: Boolean( callSelector( cart, 'getNeedsShipping', true ) ),
				hasCalculatedShipping: Boolean( callSelector( cart, 'getHasCalculatedShipping', false ) ),
				isCalculating: Boolean( callSelector( checkout, 'isCalculating', false ) ),
			};
		} catch { return { available: false }; }
	}

	function commerceBusy( snapshot = commerceSnapshot() ) {
		return Boolean( snapshot.available && ( snapshot.isCalculating || snapshot.cartMeta?.updatingCustomerData || snapshot.cartMeta?.updatingSelectedRate ) );
	}

	function formatMoney( raw, totals ) {
		const minor = Number.isFinite( Number( totals?.currency_minor_unit ) ) ? Number( totals.currency_minor_unit ) : 2;
		const amount = Number( raw || 0 ) / ( 10 ** Math.max( 0, minor ) );
		try { return new Intl.NumberFormat( undefined, { style: 'currency', currency: String( totals?.currency_code || 'USD' ), minimumFractionDigits: minor, maximumFractionDigits: minor } ).format( amount ); }
		catch { return `${ totals?.currency_symbol || '$' }${ amount.toFixed( minor ) }`; }
	}

	function canonicalSummary() {
		const nodes = topLevel( unique( [ ...document.querySelectorAll( '.wp-block-woocommerce-checkout-order-summary-block' ), ...document.querySelectorAll( '.wc-block-components-order-summary' ) ] ) );
		return nodes.find( ( node ) => node.closest( '.wc-block-components-sidebar, .wc-block-checkout__sidebar' ) ) || nodes[ 0 ] || null;
	}

	function renderLiveContext() {
		const summary = canonicalSummary();
		if ( ! summary ) return;
		let context = summary.querySelector( '[data-dtb-checkout-live-context]' );
		if ( ! context ) {
			context = document.createElement( 'section' );
			context.className = 'dtb-checkout-live-context';
			context.dataset.dtbCheckoutLiveContext = '1';
			context.setAttribute( 'aria-live', 'polite' );
			context.innerHTML = '<div class="dtb-checkout-live-context__header"><strong>Delivery &amp; tax</strong><span class="dtb-checkout-live-context__status" data-dtb-live-status>Live</span></div><div class="dtb-checkout-live-context__row"><span>Ship to</span><strong data-dtb-live-destination>Enter shipping address</strong></div><div class="dtb-checkout-live-context__row"><span>Shipping</span><strong data-dtb-live-shipping>Calculated at shipping</strong></div><div class="dtb-checkout-live-context__row"><span>Estimated tax</span><strong data-dtb-live-tax>Calculated from address</strong></div>';
			const footer = summary.querySelector( '.wc-block-components-totals-footer-item' )?.closest( '.wc-block-components-totals-wrapper' );
			footer?.parentNode ? footer.parentNode.insertBefore( context, footer ) : summary.append( context );
		}
		const snapshot = commerceSnapshot();
		const totals = snapshot.totals || {};
		const address = snapshot.customer?.shippingAddress || snapshot.customer?.shipping_address || {};
		const destination = [ [ address.city, address.state ].filter( Boolean ).join( ', ' ), address.postcode ].filter( Boolean ).join( ' ' ) || 'Enter shipping address';
		const busy = commerceBusy( snapshot );
		const shipping = snapshot.available && snapshot.hasCalculatedShipping ? ( Number( totals.total_shipping || 0 ) === 0 ? 'FREE' : formatMoney( totals.total_shipping, totals ) ) : 'Calculated at shipping';
		const tax = snapshot.available && snapshot.hasCalculatedShipping ? formatMoney( totals.total_tax, totals ) : 'Calculated from address';
		context.classList.toggle( 'is-updating', busy );
		context.querySelector( '[data-dtb-live-status]' ).textContent = busy ? 'Updating…' : 'Live';
		context.querySelector( '[data-dtb-live-destination]' ).textContent = destination;
		context.querySelector( '[data-dtb-live-shipping]' ).textContent = busy ? 'Updating…' : shipping;
		context.querySelector( '[data-dtb-live-tax]' ).textContent = busy ? 'Updating…' : tax;
	}

	function setBodyStep() {
		document.body.classList.remove( ...bodyStepClasses );
		if ( mobileViewport.matches ) document.body.classList.add( `dtb-checkout-step-${ steps[ activeStep ].id }` );
	}

	function setActionMessage( message = '', kind = '' ) {
		const status = actionBar?.querySelector( '.dtb-mobile-checkout-actions__status' );
		if ( ! status ) return;
		status.textContent = message;
		status.hidden = ! message;
		status.dataset.kind = kind;
	}

	function updateControls() {
		progress?.querySelectorAll( '[data-dtb-checkout-step-target]' ).forEach( ( button ) => {
			const index = Number( button.dataset.dtbCheckoutStepTarget );
			button.disabled = index > highestVisitedStep;
			button.classList.toggle( 'is-current', index === activeStep );
			button.classList.toggle( 'is-complete', index < activeStep );
			button.closest( '.dtb-mobile-checkout-progress__item' )?.classList.toggle( 'is-current', index === activeStep );
		} );
		if ( ! actionBar ) return;
		const back = actionBar.querySelector( '.dtb-mobile-checkout-actions__back' );
		const next = actionBar.querySelector( '.dtb-mobile-checkout-actions__next' );
		const payment = activeStep === 2;
		const busy = activeStep === 1 && commerceBusy();
		actionBar.hidden = ! mobileViewport.matches;
		back.disabled = activeStep === 0 || busy;
		back.setAttribute( 'aria-hidden', activeStep === 0 ? 'true' : 'false' );
		next.hidden = payment;
		next.disabled = busy;
		next.textContent = busy ? 'Updating checkout…' : ( activeStep === 0 ? 'Continue to shipping' : 'Continue to payment' );
		if ( busy ) setActionMessage( 'Updating shipping and tax totals…', 'progress' );
		else if ( actionBar.querySelector( '.dtb-mobile-checkout-actions__status' )?.dataset.kind === 'progress' ) setActionMessage();
	}

	function showStep( index, scroll = false ) {
		if ( ! mobileViewport.matches ) return;
		activeStep = Math.max( 0, Math.min( index, 2 ) );
		highestVisitedStep = Math.max( highestVisitedStep, activeStep );
		setBodyStep();
		markSteps();
		updateControls();
		renderLiveContext();
		if ( scroll ) progress?.scrollIntoView( { behavior: window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ? 'auto' : 'smooth', block: 'start' } );
	}

	function validateContact() {
		const controls = [
			contactBlock()?.querySelector( 'input[type="email"], input[autocomplete="email"]' ),
			...Array.from( document.querySelectorAll( `${ proxySelector } input` ) ),
		].filter( Boolean );
		const invalid = controls.find( ( control ) => control.required && ! control.checkValidity() );
		if ( ! invalid ) return true;
		setActionMessage( 'Complete the highlighted fields before continuing.', 'error' );
		invalid.reportValidity?.();
		invalid.focus?.();
		return false;
	}

	function validateShipping() {
		const controls = unique( stepElements( 1 ).flatMap( ( node ) => Array.from( node.querySelectorAll( 'input, select, textarea' ) ) ) );
		const invalid = controls.find( ( control ) => ! control.disabled && control.type !== 'hidden' && control.willValidate !== false && ! control.checkValidity() );
		if ( invalid ) {
			setActionMessage( 'Complete the highlighted shipping fields before continuing.', 'error' );
			invalid.reportValidity?.();
			invalid.focus?.();
			return false;
		}
		const snapshot = commerceSnapshot();
		if ( snapshot.available && snapshot.needsShipping && ( commerceBusy( snapshot ) || ! snapshot.hasCalculatedShipping ) ) {
			setActionMessage( commerceBusy( snapshot ) ? 'Wait for shipping and tax totals to finish updating.' : 'Enter a complete shipping address and select a delivery method before continuing.', commerceBusy( snapshot ) ? 'progress' : 'error' );
			return false;
		}
		return true;
	}

	function goNext() {
		setActionMessage();
		ensureContactProxy();
		if ( activeStep === 0 && ! validateContact() ) return;
		if ( activeStep === 1 && ! validateShipping() ) return;
		showStep( activeStep + 1, true );
		queueReconcile();
	}

	function createProgress() {
		const nav = document.createElement( 'nav' );
		nav.className = 'dtb-mobile-checkout-progress';
		nav.setAttribute( 'aria-label', 'Checkout progress' );
		const list = document.createElement( 'ol' );
		list.className = 'dtb-mobile-checkout-progress__track';
		steps.forEach( ( step, index ) => {
			const item = document.createElement( 'li' );
			item.className = 'dtb-mobile-checkout-progress__item';
			const button = document.createElement( 'button' );
			button.type = 'button';
			button.className = 'dtb-mobile-checkout-progress__button';
			button.dataset.dtbCheckoutStepTarget = String( index );
			button.innerHTML = `<span class="dtb-mobile-checkout-progress__number">${ index + 1 }</span><span class="dtb-mobile-checkout-progress__label">${ step.label }</span>`;
			button.addEventListener( 'click', ( event ) => { event.preventDefault(); if ( index <= highestVisitedStep ) showStep( index, true ); } );
			item.append( button );
			list.append( item );
		} );
		nav.append( list );
		return nav;
	}

	function createActionBar() {
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'dtb-mobile-checkout-actions';
		wrapper.dataset.dtbMobileCheckoutActions = '1';
		const status = document.createElement( 'div' );
		status.className = 'dtb-mobile-checkout-actions__status';
		status.setAttribute( 'role', 'status' );
		status.setAttribute( 'aria-live', 'polite' );
		status.hidden = true;
		const inner = document.createElement( 'div' );
		inner.className = 'dtb-mobile-checkout-actions__inner';
		const back = document.createElement( 'button' );
		back.type = 'button'; back.className = 'dtb-mobile-checkout-actions__back'; back.textContent = 'Back';
		back.addEventListener( 'click', ( event ) => { event.preventDefault(); if ( activeStep > 0 ) showStep( activeStep - 1, true ); } );
		const next = document.createElement( 'button' );
		next.type = 'button'; next.className = 'dtb-mobile-checkout-actions__next';
		next.addEventListener( 'click', ( event ) => { event.preventDefault(); event.stopPropagation(); goNext(); } );
		inner.append( back, next );
		wrapper.append( status, inner );
		return wrapper;
	}

	function bindCommerce() {
		if ( commerceUnsubscribe || ! window.wp?.data?.subscribe || ! window.wc?.wcBlocksData?.cartStore ) return;
		commerceUnsubscribe = window.wp.data.subscribe( () => {
			const snapshot = commerceSnapshot();
			const totals = snapshot.totals || {};
			const customer = snapshot.customer?.shippingAddress || snapshot.customer?.shipping_address || {};
			const signature = JSON.stringify( [ snapshot.available, snapshot.needsShipping, snapshot.hasCalculatedShipping, snapshot.isCalculating, snapshot.cartMeta?.updatingCustomerData, snapshot.cartMeta?.updatingSelectedRate, totals.total_shipping, totals.total_tax, totals.total_price, customer.country, customer.state, customer.city, customer.postcode ] );
			if ( signature !== lastCommerceSignature ) { lastCommerceSignature = signature; queueReconcile(); }
		} );
	}

	function mount() {
		const checkout = root();
		if ( ! checkout ) return false;
		rewriteLoginLinks();
		ensureContactProxy();
		renderLiveContext();
		bindCommerce();
		if ( ! mobileViewport.matches ) {
			document.body.classList.remove( 'dtb-checkout-enhanced', 'dtb-mobile-checkout-enhanced', ...bodyStepClasses );
			clearMarkers(); progress?.remove(); progress = null; actionBar?.remove(); actionBar = null;
			return true;
		}
		document.body.classList.add( 'dtb-checkout-enhanced', 'dtb-mobile-checkout-enhanced' );
		if ( ! progress?.isConnected ) { progress = createProgress(); checkout.parentNode?.insertBefore( progress, checkout ); }
		if ( ! actionBar?.isConnected ) { actionBar = createActionBar(); document.body.append( actionBar ); }
		showStep( activeStep, false );
		return true;
	}

	function reconcile() {
		reconcileQueued = false;
		if ( ! mount() ) return;
		ensureContactProxy(); markSteps(); updateControls(); renderLiveContext(); rewriteLoginLinks();
	}

	function queueReconcile() {
		if ( reconcileQueued ) return;
		reconcileQueued = true;
		window.requestAnimationFrame( reconcile );
	}

	function initialize() {
		mobileViewport.addEventListener( 'change', queueReconcile );
		observer = new MutationObserver( queueReconcile );
		observer.observe( document.body, { childList: true, subtree: true } );
		bindCommerce();
		queueReconcile();
		window.setTimeout( queueReconcile, 250 );
		window.setTimeout( queueReconcile, 750 );
		window.setTimeout( queueReconcile, 1500 );
	}

	if ( document.readyState === 'loading' ) document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	else initialize();
} )();
