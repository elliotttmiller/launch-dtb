( function () {
	'use strict';

	/**
	 * Theme-owned checkout presentation controller.
	 *
	 * WooCommerce Checkout Block remains authoritative for customer/address state,
	 * shipping, tax, totals, validation, payment and submission. This controller
	 * owns responsive presentation only: stable Contact -> Shipping -> Payment
	 * navigation, contact-field mirroring, and a read-only live order-summary context
	 * sourced from WooCommerce's registered block data stores.
	 */

	const mobileViewport = window.matchMedia( '(max-width: 767px)' );
	const checkoutRootSelector = '.wc-block-checkout';
	const inactiveStepClass = 'is-dtb-checkout-step-inactive';
	const stepBodyClasses = [
		'dtb-checkout-step-contact',
		'dtb-checkout-step-shipping',
		'dtb-checkout-step-payment',
	];
	const storefrontBasePath = ( () => {
		const params = new URLSearchParams( window.location.search || '' );
		const candidate = String( params.get( 'dtb_storefront_base_path' ) || '' ).replace( /\/+$/, '' );
		return /^\/staging\/[A-Za-z0-9_-]+$/.test( candidate ) ? candidate : '';
	} )();
	const storefrontLoginUrl = `${ storefrontBasePath }/login?returnTo=%2Fcheckout`;

	const contactIdentityFields = [
		{
			id: 'dtb-checkout/contact-first-name',
			nativeSelectors: [ '#shipping-first_name', '#billing_first_name', '[name="shipping_first_name"]', '[name="billing_first_name"]' ],
		},
		{
			id: 'dtb-checkout/contact-last-name',
			nativeSelectors: [ '#shipping-last_name', '#billing_last_name', '[name="shipping_last_name"]', '[name="billing_last_name"]' ],
		},
		{
			id: 'dtb-checkout/contact-phone',
			nativeSelectors: [ '#shipping-phone', '#billing-phone', '#shipping_phone', '#billing_phone', '[name="shipping_phone"]', '[name="billing_phone"]' ],
		},
	];

	/* Prefer stable Checkout inner-block wrappers. Internal class selectors are
	 * compatibility fallbacks only, preventing a nested implementation detail from
	 * accidentally becoming the owner of a whole mobile step. */
	const steps = [
		{
			id: 'contact',
			label: 'Contact',
			blockSelectors: [
				'.wp-block-woocommerce-checkout-express-payment-block',
				'.wp-block-woocommerce-checkout-contact-information-block',
				'.wp-block-woocommerce-checkout-create-account-block',
			],
			fallbackSelectors: [
				'.wc-block-components-express-payment',
				'.wc-block-checkout__contact-fields',
				'[data-block-name="woocommerce/checkout-contact-information-block"]',
			],
		},
		{
			id: 'shipping',
			label: 'Shipping',
			blockSelectors: [
				'.wp-block-woocommerce-checkout-shipping-method-block',
				'.wp-block-woocommerce-checkout-pickup-options-block',
				'.wp-block-woocommerce-checkout-shipping-address-block',
				'.wp-block-woocommerce-checkout-billing-address-block',
				'.wp-block-woocommerce-checkout-shipping-methods-block',
			],
			fallbackSelectors: [
				'.wc-block-checkout__shipping-fields',
				'.wc-block-checkout__shipping-address',
				'.wc-block-checkout__billing-fields',
				'.wc-block-checkout__shipping-option',
				'.wc-block-checkout__shipping-method',
				'[data-block-name="woocommerce/checkout-shipping-address-block"]',
				'[data-block-name="woocommerce/checkout-billing-address-block"]',
				'[data-block-name="woocommerce/checkout-shipping-method-block"]',
			],
		},
		{
			id: 'payment',
			label: 'Payment',
			blockSelectors: [
				'.wp-block-woocommerce-checkout-payment-block',
				'.wp-block-woocommerce-checkout-additional-information-block',
				'.wp-block-woocommerce-checkout-order-note-block',
				'.wp-block-woocommerce-checkout-terms-block',
				'.wp-block-woocommerce-checkout-actions-block',
			],
			fallbackSelectors: [
				'.wc-block-checkout__payment-method',
				'.wc-block-checkout__order-notes',
				'.wc-block-checkout__terms',
				'.wc-block-checkout__actions',
				'[data-block-name="woocommerce/checkout-payment-block"]',
			],
		},
	];

	let activeStep = 0;
	let highestVisitedStep = 0;
	let progress = null;
	let actionBar = null;
	let rootObserver = null;
	let observedRoot = null;
	let bodyObserver = null;
	let commerceUnsubscribe = null;
	let reconcileQueued = false;
	let lastCommerceSignature = '';

	function checkoutRoot() {
		return document.querySelector( checkoutRootSelector );
	}

	function uniqueElements( elements ) {
		return Array.from( new Set( elements.filter( Boolean ) ) );
	}

	function topLevelElements( elements ) {
		return elements.filter( ( candidate ) => ! elements.some( ( parent ) => parent !== candidate && parent.contains( candidate ) ) );
	}

	function queryStepElements( root, selectors ) {
		return topLevelElements( uniqueElements(
			selectors.flatMap( ( selector ) => Array.from( root.querySelectorAll( selector ) ) )
		) ).filter( ( node ) => ! node.classList.contains( 'is-dtb-order-summary-duplicate' ) );
	}

	function stepElements( stepIndex ) {
		const root = checkoutRoot();
		const step = steps[ stepIndex ];
		if ( ! root || ! step ) {
			return [];
		}

		const canonical = queryStepElements( root, step.blockSelectors );
		return canonical.length > 0 ? canonical : queryStepElements( root, step.fallbackSelectors );
	}

	function clearStepMarkers() {
		const root = checkoutRoot();
		if ( ! root ) {
			return;
		}
		root.querySelectorAll( '[data-dtb-checkout-step]' ).forEach( ( node ) => {
			node.classList.remove( inactiveStepClass );
			node.removeAttribute( 'aria-hidden' );
			delete node.dataset.dtbCheckoutStep;
		} );
	}

	function markStepElements() {
		if ( ! mobileViewport.matches ) {
			clearStepMarkers();
			return;
		}

		clearStepMarkers();
		const ownership = new Map();
		steps.forEach( ( step, stepIndex ) => {
			stepElements( stepIndex ).forEach( ( node ) => {
				if ( ! ownership.has( node ) ) {
					ownership.set( node, stepIndex );
				}
			} );
		} );

		ownership.forEach( ( stepIndex, node ) => {
			const inactive = stepIndex !== activeStep;
			node.dataset.dtbCheckoutStep = steps[ stepIndex ].id;
			node.classList.toggle( inactiveStepClass, inactive );
			node.setAttribute( 'aria-hidden', inactive ? 'true' : 'false' );
		} );
	}

	function orderSummaryCandidates() {
		const blockSummaries = Array.from( document.querySelectorAll( '.wp-block-woocommerce-checkout-order-summary-block' ) );
		const standaloneSummaries = Array.from( document.querySelectorAll( '.wc-block-components-order-summary' ) )
			.filter( ( node ) => ! node.closest( '.wp-block-woocommerce-checkout-order-summary-block' ) );
		return topLevelElements( uniqueElements( [ ...blockSummaries, ...standaloneSummaries ] ) );
	}

	function canonicalOrderSummary() {
		const candidates = orderSummaryCandidates().filter( ( node ) => ! node.classList.contains( 'is-dtb-order-summary-duplicate' ) );
		return candidates.find( ( node ) => node.closest( '.wc-block-components-sidebar, .wc-block-checkout__sidebar' ) ) || candidates[ 0 ] || null;
	}

	function markDuplicateOrderSummaries() {
		const candidates = orderSummaryCandidates();
		candidates.forEach( ( node ) => node.classList.remove( 'is-dtb-order-summary-duplicate' ) );
		if ( candidates.length < 2 ) {
			return;
		}

		const canonical = candidates.find( ( node ) => node.closest( '.wc-block-components-sidebar, .wc-block-checkout__sidebar' ) ) || candidates[ 0 ];
		candidates.forEach( ( node ) => {
			if ( node !== canonical ) {
				node.classList.add( 'is-dtb-order-summary-duplicate' );
			}
		} );
	}

	function gatewayOptions( radioControl ) {
		const directOptions = Array.from( radioControl.children ).filter( ( node ) =>
			node.matches( '.wc-block-components-radio-control__option, .wc-block-components-radio-control-accordion-option' )
		);
		if ( directOptions.length > 0 ) {
			return directOptions;
		}

		return uniqueElements(
			Array.from( radioControl.querySelectorAll( 'input[type="radio"]' ) )
				.map( ( input ) => input.closest( '.wc-block-components-radio-control__option, .wc-block-components-radio-control-accordion-option' ) )
		).filter( ( node ) => node && node.closest( '.wc-block-components-radio-control' ) === radioControl );
	}

	function markSingleGatewayPresentation() {
		const root = checkoutRoot();
		if ( ! root ) {
			return;
		}

		root.querySelectorAll( '.wc-block-components-payment-methods.is-dtb-single-gateway-set' ).forEach( ( methods ) => {
			methods.classList.remove( 'is-dtb-single-gateway-set' );
		} );

		root.querySelectorAll( '.wc-block-checkout__payment-method .wc-block-components-radio-control' ).forEach( ( radioControl ) => {
			const isSingleGateway = gatewayOptions( radioControl ).length === 1;
			radioControl.classList.toggle( 'is-dtb-single-gateway', isSingleGateway );
			if ( isSingleGateway ) {
				radioControl.closest( '.wc-block-components-payment-methods' )?.classList.add( 'is-dtb-single-gateway-set' );
			}
		} );
	}

	function setInputValue( input, value ) {
		if ( ! input || input.value === value ) {
			return;
		}
		const descriptor = Object.getOwnPropertyDescriptor( window.HTMLInputElement.prototype, 'value' );
		descriptor?.set?.call( input, value );
		input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
		input.dispatchEvent( new Event( 'change', { bubbles: true } ) );
	}

	function findContactInput( fieldId ) {
		const safeId = window.CSS?.escape ? window.CSS.escape( fieldId ) : fieldId.replace( /([/])/g, '\\$1' );
		const suffix = fieldId.split( '/' ).pop();
		return document.querySelector( `[name="${ fieldId }"]` )
			|| document.querySelector( `[data-field-id="${ fieldId }"] input` )
			|| document.querySelector( `#${ safeId }` )
			|| document.querySelector( `input[id*="${ suffix }"]` );
	}

	function nativeInputsForField( field ) {
		return uniqueElements( field.nativeSelectors.flatMap( ( selector ) => Array.from( document.querySelectorAll( selector ) ) ) );
	}

	function syncOneContactIdentityField( field ) {
		const contactInput = findContactInput( field.id );
		if ( ! contactInput ) {
			return;
		}

		const nativeInputs = nativeInputsForField( field );
		contactInput.closest( '.wc-block-components-text-input, .wc-block-components-checkout-step__container, .wc-block-components-address-form__field' )?.classList.add( 'dtb-contact-identity-field' );
		nativeInputs.forEach( ( input ) => input.closest( '.wc-block-components-text-input, .wc-block-components-address-form__field' )?.classList.add( 'dtb-native-identity-field' ) );

		if ( ! contactInput.value ) {
			const existing = nativeInputs.find( ( input ) => input.value )?.value || '';
			if ( existing ) {
				setInputValue( contactInput, existing );
			}
		}

		nativeInputs.forEach( ( input ) => setInputValue( input, contactInput.value || '' ) );
		if ( ! contactInput.dataset.dtbIdentityBound ) {
			contactInput.dataset.dtbIdentityBound = '1';
			contactInput.addEventListener( 'input', () => {
				/* Resolve current Woo inputs on every edit. Checkout Blocks may replace
				 * address controls after customer/session updates; never retain stale nodes. */
				nativeInputsForField( field ).forEach( ( input ) => setInputValue( input, contactInput.value || '' ) );
			} );
		}
	}

	function syncContactIdentityFields() {
		contactIdentityFields.forEach( syncOneContactIdentityField );
	}

	function rewriteCheckoutLoginLinks() {
		const root = checkoutRoot();
		if ( ! root ) {
			return;
		}
		root.querySelectorAll( 'a[href*="/my-account/"]' ).forEach( ( link ) => {
			link.setAttribute( 'href', storefrontLoginUrl );
			link.dataset.dtbStorefrontLogin = '1';
		} );
	}

	function callSelector( store, method, fallback ) {
		try {
			return store && typeof store[ method ] === 'function' ? store[ method ]() : fallback;
		} catch {
			return fallback;
		}
	}

	function readCommerceSnapshot() {
		const wpData = window.wp?.data;
		const blockData = window.wc?.wcBlocksData;
		if ( ! wpData?.select || ! blockData?.cartStore ) {
			return { available: false };
		}

		try {
			const cartStore = wpData.select( blockData.cartStore );
			const checkoutStore = blockData.checkoutStore ? wpData.select( blockData.checkoutStore ) : null;
			return {
				available: true,
				totals: callSelector( cartStore, 'getCartTotals', {} ) || {},
				customer: callSelector( cartStore, 'getCustomerData', {} ) || {},
				cartMeta: callSelector( cartStore, 'getCartMeta', {} ) || {},
				needsShipping: Boolean( callSelector( cartStore, 'getNeedsShipping', true ) ),
				hasCalculatedShipping: Boolean( callSelector( cartStore, 'getHasCalculatedShipping', false ) ),
				isCalculating: Boolean( callSelector( checkoutStore, 'isCalculating', false ) ),
			};
		} catch {
			return { available: false };
		}
	}

	function commerceIsBusy( snapshot = readCommerceSnapshot() ) {
		return Boolean(
			snapshot.available && (
				snapshot.isCalculating
				|| snapshot.cartMeta?.updatingCustomerData
				|| snapshot.cartMeta?.updatingSelectedRate
			)
		);
	}

	function formatMoney( rawAmount, totals ) {
		const minorUnit = Number.isFinite( Number( totals?.currency_minor_unit ) ) ? Number( totals.currency_minor_unit ) : 2;
		const divisor = 10 ** Math.max( 0, minorUnit );
		const amount = Number( rawAmount || 0 ) / divisor;
		const currency = String( totals?.currency_code || 'USD' ).toUpperCase();
		if ( Number.isFinite( amount ) ) {
			try {
				return new Intl.NumberFormat( undefined, {
					style: 'currency',
					currency,
					minimumFractionDigits: minorUnit,
					maximumFractionDigits: minorUnit,
				} ).format( amount );
			} catch {
				const symbol = String( totals?.currency_symbol || '$' );
				return `${ symbol }${ amount.toFixed( minorUnit ) }`;
			}
		}
		return '—';
	}

	function shippingAddressContext( snapshot ) {
		const address = snapshot.customer?.shippingAddress || snapshot.customer?.shipping_address || {};
		const city = String( address.city || '' ).trim();
		const state = String( address.state || '' ).trim();
		const postcode = String( address.postcode || '' ).trim();
		const location = [ city, state ].filter( Boolean ).join( ', ' );
		return [ location, postcode ].filter( Boolean ).join( ' ' );
	}

	function selectedShippingLabel() {
		const root = checkoutRoot();
		const selected = root?.querySelector( '.wc-block-components-shipping-rates-control input[type="radio"]:checked, .wc-block-components-radio-control input[type="radio"]:checked[name*="shipping"]' );
		if ( ! selected ) {
			return '';
		}
		const option = selected.closest( '.wc-block-components-radio-control__option, .wc-block-components-radio-control-accordion-option' );
		const label = option?.querySelector( '.wc-block-components-radio-control__label, label' );
		return String( label?.textContent || '' ).replace( /\s+/g, ' ' ).trim();
	}

	function createLiveSummaryContext() {
		const section = document.createElement( 'section' );
		section.className = 'dtb-checkout-live-context';
		section.dataset.dtbCheckoutLiveContext = '1';
		section.setAttribute( 'aria-live', 'polite' );
		section.innerHTML = `
			<div class="dtb-checkout-live-context__header">
				<strong>Delivery &amp; tax</strong>
				<span class="dtb-checkout-live-context__status" data-dtb-live-status>Live</span>
			</div>
			<div class="dtb-checkout-live-context__row">
				<span>Ship to</span>
				<strong data-dtb-live-destination>Enter shipping address</strong>
			</div>
			<div class="dtb-checkout-live-context__row">
				<span>Shipping</span>
				<strong data-dtb-live-shipping>Calculated at shipping</strong>
			</div>
			<div class="dtb-checkout-live-context__row">
				<span>Estimated tax</span>
				<strong data-dtb-live-tax>Calculated from address</strong>
			</div>
		`;
		return section;
	}

	function setNodeText( node, text ) {
		if ( node && node.textContent !== text ) {
			node.textContent = text;
		}
	}

	function ensureLiveSummaryContext() {
		const summary = canonicalOrderSummary();
		if ( ! summary ) {
			return null;
		}
		let context = summary.querySelector( '[data-dtb-checkout-live-context]' );
		if ( ! context ) {
			context = createLiveSummaryContext();
			const footer = summary.querySelector( '.wc-block-components-totals-footer-item' )?.closest( '.wc-block-components-totals-wrapper' );
			if ( footer?.parentNode ) {
				footer.parentNode.insertBefore( context, footer );
			} else {
				summary.append( context );
			}
		}
		return context;
	}

	function renderLiveSummaryContext() {
		const context = ensureLiveSummaryContext();
		if ( ! context ) {
			return;
		}

		const snapshot = readCommerceSnapshot();
		const busy = commerceIsBusy( snapshot );
		const totals = snapshot.totals || {};
		const destination = shippingAddressContext( snapshot );
		const shippingLabel = selectedShippingLabel();
		let shippingText = 'Calculated at shipping';
		let taxText = 'Calculated from address';
		let destinationText = destination || 'Enter shipping address';

		if ( snapshot.available && ! snapshot.needsShipping ) {
			shippingText = 'No shipping required';
			destinationText = 'Digital / non-shippable order';
			taxText = formatMoney( totals.total_tax, totals );
		} else if ( snapshot.available && snapshot.hasCalculatedShipping ) {
			const shippingAmount = Number( totals.total_shipping || 0 );
			shippingText = shippingAmount === 0 ? 'FREE' : formatMoney( totals.total_shipping, totals );
			if ( shippingLabel ) {
				shippingText = `${ shippingText } · ${ shippingLabel }`;
			}
			taxText = formatMoney( totals.total_tax, totals );
		}

		context.classList.toggle( 'is-updating', busy );
		setNodeText( context.querySelector( '[data-dtb-live-status]' ), busy ? 'Updating…' : 'Live' );
		setNodeText( context.querySelector( '[data-dtb-live-destination]' ), destinationText );
		setNodeText( context.querySelector( '[data-dtb-live-shipping]' ), busy ? 'Updating…' : shippingText );
		setNodeText( context.querySelector( '[data-dtb-live-tax]' ), busy ? 'Updating…' : taxText );
	}

	function setBodyStepClass() {
		document.body.classList.remove( ...stepBodyClasses );
		if ( mobileViewport.matches ) {
			document.body.classList.add( `dtb-checkout-step-${ steps[ activeStep ].id }` );
		}
	}

	function setActionMessage( message = '', kind = '' ) {
		const status = actionBar?.querySelector( '.dtb-mobile-checkout-actions__status' );
		if ( ! status ) {
			return;
		}
		setNodeText( status, message );
		status.hidden = ! message;
		status.dataset.kind = kind;
	}

	function updateControls() {
		progress?.querySelectorAll( '[data-dtb-checkout-step-target]' ).forEach( ( button ) => {
			const index = Number( button.dataset.dtbCheckoutStepTarget );
			const current = index === activeStep;
			const complete = index < activeStep;
			const item = button.closest( '.dtb-mobile-checkout-progress__item' );
			const number = button.querySelector( '.dtb-mobile-checkout-progress__number' );

			button.disabled = index > highestVisitedStep;
			button.classList.toggle( 'is-current', current );
			button.classList.toggle( 'is-complete', complete );
			item?.classList.toggle( 'is-current', current );
			item?.classList.toggle( 'is-complete', complete );
			if ( number ) {
				number.textContent = complete ? '✓' : String( index + 1 );
			}
			if ( current ) {
				button.setAttribute( 'aria-current', 'step' );
			} else {
				button.removeAttribute( 'aria-current' );
			}
		} );

		if ( ! actionBar ) {
			return;
		}
		const back = actionBar.querySelector( '.dtb-mobile-checkout-actions__back' );
		const next = actionBar.querySelector( '.dtb-mobile-checkout-actions__next' );
		const onPayment = activeStep === steps.length - 1;
		const busy = commerceIsBusy();
		actionBar.hidden = ! mobileViewport.matches;
		actionBar.classList.toggle( 'is-payment-step', onPayment );
		actionBar.classList.toggle( 'is-calculating', busy );
		if ( back ) {
			back.disabled = activeStep === 0 || busy;
			back.setAttribute( 'aria-hidden', activeStep === 0 ? 'true' : 'false' );
		}
		if ( next ) {
			next.disabled = busy;
			next.hidden = onPayment;
			next.textContent = busy ? 'Updating checkout…' : ( activeStep === 0 ? 'Continue to shipping' : 'Continue to payment' );
		}
		if ( busy ) {
			setActionMessage( 'Updating shipping and tax totals…', 'progress' );
		} else if ( actionBar.querySelector( '.dtb-mobile-checkout-actions__status' )?.dataset.kind === 'progress' ) {
			setActionMessage();
		}
	}

	function showStep( requestedStep, shouldScroll = false ) {
		if ( ! mobileViewport.matches ) {
			return;
		}
		activeStep = Math.max( 0, Math.min( requestedStep, steps.length - 1 ) );
		highestVisitedStep = Math.max( highestVisitedStep, activeStep );
		setBodyStepClass();
		markStepElements();
		markSingleGatewayPresentation();
		updateControls();
		renderLiveSummaryContext();

		if ( shouldScroll && progress ) {
			progress.scrollIntoView( {
				behavior: window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ? 'auto' : 'smooth',
				block: 'start',
			} );
		}
	}

	function controlIsEligibleForStepValidation( control ) {
		if ( ! control || control.disabled || control.type === 'hidden' || control.closest( '.dtb-native-identity-field' ) ) {
			return false;
		}
		return control.willValidate !== false;
	}

	function validateVisibleStepInputs( stepIndex ) {
		const controls = uniqueElements( stepElements( stepIndex ).flatMap( ( node ) => Array.from( node.querySelectorAll( 'input, select, textarea' ) ) ) );
		const invalid = controls.find( ( control ) => controlIsEligibleForStepValidation( control ) && typeof control.checkValidity === 'function' && ! control.checkValidity() );
		if ( ! invalid ) {
			return true;
		}

		showStep( stepIndex, false );
		setActionMessage( 'Complete the highlighted fields before continuing.', 'error' );
		window.requestAnimationFrame( () => {
			invalid.reportValidity?.();
			invalid.focus?.( { preventScroll: false } );
		} );
		return false;
	}

	function shippingStepIsReady() {
		const snapshot = readCommerceSnapshot();
		if ( ! snapshot.available || ! snapshot.needsShipping ) {
			return true;
		}
		if ( commerceIsBusy( snapshot ) ) {
			setActionMessage( 'Wait for shipping and tax totals to finish updating.', 'progress' );
			return false;
		}
		if ( ! snapshot.hasCalculatedShipping ) {
			setActionMessage( 'Enter a complete shipping address and select an available delivery method before continuing.', 'error' );
			return false;
		}
		return true;
	}

	function blurActiveStepField() {
		const active = document.activeElement;
		if ( ! ( active instanceof HTMLElement ) ) {
			return;
		}
		if ( stepElements( activeStep ).some( ( node ) => node.contains( active ) ) ) {
			active.blur();
		}
	}

	function goToNextStep() {
		if ( ! mobileViewport.matches || activeStep >= steps.length - 1 ) {
			return;
		}

		setActionMessage();
		syncContactIdentityFields();
		if ( ! validateVisibleStepInputs( activeStep ) ) {
			return;
		}
		if ( activeStep === 1 && ! shippingStepIsReady() ) {
			return;
		}

		blurActiveStepField();
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
			button.setAttribute( 'aria-label', `${ step.label } checkout step` );
			button.addEventListener( 'click', ( event ) => {
				event.preventDefault();
				if ( index <= highestVisitedStep ) {
					setActionMessage();
					showStep( index, true );
				}
			} );

			const number = document.createElement( 'span' );
			number.className = 'dtb-mobile-checkout-progress__number';
			number.setAttribute( 'aria-hidden', 'true' );
			number.textContent = String( index + 1 );

			const label = document.createElement( 'span' );
			label.className = 'dtb-mobile-checkout-progress__label';
			label.textContent = step.label;

			button.append( number, label );
			item.append( button );
			list.append( item );
		} );
		nav.append( list );
		return nav;
	}

	function createActionBar() {
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'dtb-mobile-checkout-actions';
		wrapper.setAttribute( 'data-dtb-mobile-checkout-actions', '1' );

		const status = document.createElement( 'div' );
		status.className = 'dtb-mobile-checkout-actions__status';
		status.setAttribute( 'role', 'status' );
		status.setAttribute( 'aria-live', 'polite' );
		status.hidden = true;

		const inner = document.createElement( 'div' );
		inner.className = 'dtb-mobile-checkout-actions__inner';

		const back = document.createElement( 'button' );
		back.type = 'button';
		back.className = 'dtb-mobile-checkout-actions__back';
		back.dataset.dtbCheckoutAction = 'back';
		back.textContent = 'Back';
		back.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			setActionMessage();
			if ( activeStep > 0 && ! commerceIsBusy() ) {
				blurActiveStepField();
				showStep( activeStep - 1, true );
			}
		} );

		const next = document.createElement( 'button' );
		next.type = 'button';
		next.className = 'dtb-mobile-checkout-actions__next';
		next.dataset.dtbCheckoutAction = 'next';
		next.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			goToNextStep();
		} );

		inner.append( back, next );
		wrapper.append( status, inner );
		return wrapper;
	}

	function clearMobilePresentation() {
		document.body.classList.remove( 'dtb-checkout-enhanced', 'dtb-mobile-checkout-enhanced', ...stepBodyClasses );
		clearStepMarkers();
		progress?.remove();
		progress = null;
		actionBar?.remove();
		actionBar = null;
	}

	function bindCommerceSubscription() {
		if ( commerceUnsubscribe || ! window.wp?.data?.subscribe || ! window.wc?.wcBlocksData?.cartStore ) {
			return;
		}
		commerceUnsubscribe = window.wp.data.subscribe( () => {
			const snapshot = readCommerceSnapshot();
			const totals = snapshot.totals || {};
			const customer = snapshot.customer?.shippingAddress || snapshot.customer?.shipping_address || {};
			const signature = JSON.stringify( [
				snapshot.available,
				snapshot.needsShipping,
				snapshot.hasCalculatedShipping,
				snapshot.isCalculating,
				snapshot.cartMeta?.updatingCustomerData,
				snapshot.cartMeta?.updatingSelectedRate,
				totals.total_shipping,
				totals.total_tax,
				totals.total_price,
				customer.country,
				customer.state,
				customer.city,
				customer.postcode,
			] );
			if ( signature !== lastCommerceSignature ) {
				lastCommerceSignature = signature;
				queueReconcile();
			}
		} );
	}

	function mountProgressiveCheckout() {
		const root = checkoutRoot();
		if ( ! root ) {
			return false;
		}

		rewriteCheckoutLoginLinks();
		syncContactIdentityFields();
		markDuplicateOrderSummaries();
		markSingleGatewayPresentation();
		bindCommerceSubscription();
		renderLiveSummaryContext();

		if ( ! mobileViewport.matches ) {
			clearMobilePresentation();
			return true;
		}

		document.body.classList.add( 'dtb-checkout-enhanced', 'dtb-mobile-checkout-enhanced' );
		if ( ! progress || ! progress.isConnected ) {
			progress = createProgress();
			root.parentNode?.insertBefore( progress, root );
		}
		if ( ! actionBar || ! actionBar.isConnected ) {
			actionBar = createActionBar();
			document.body.append( actionBar );
		}

		bindRootObserver( root );
		showStep( activeStep, false );
		return true;
	}

	function reconcile() {
		reconcileQueued = false;
		if ( ! mountProgressiveCheckout() ) {
			return;
		}
		if ( mobileViewport.matches ) {
			markStepElements();
			markSingleGatewayPresentation();
			updateControls();
		}
		renderLiveSummaryContext();
	}

	function queueReconcile() {
		if ( reconcileQueued ) {
			return;
		}
		reconcileQueued = true;
		window.requestAnimationFrame( reconcile );
	}

	function bindRootObserver( root ) {
		if ( observedRoot === root && rootObserver ) {
			return;
		}
		rootObserver?.disconnect();
		observedRoot = root;
		rootObserver = null;
		if ( ! root ) {
			return;
		}
		rootObserver = new MutationObserver( queueReconcile );
		rootObserver.observe( root, { childList: true, subtree: true } );
	}

	function handleFocusIn( event ) {
		if ( ! mobileViewport.matches || ! ( event.target instanceof Element ) ) {
			return;
		}
		const section = event.target.closest( '[data-dtb-checkout-step]' );
		if ( ! section?.classList.contains( inactiveStepClass ) ) {
			return;
		}
		const stepIndex = steps.findIndex( ( step ) => step.id === section.dataset.dtbCheckoutStep );
		if ( stepIndex >= 0 ) {
			showStep( stepIndex, true );
		}
	}

	function initialize() {
		mobileViewport.addEventListener( 'change', () => {
			activeStep = Math.min( activeStep, steps.length - 1 );
			queueReconcile();
		} );
		document.addEventListener( 'focusin', handleFocusIn );

		bodyObserver = new MutationObserver( () => {
			const root = checkoutRoot();
			if ( root !== observedRoot ) {
				bindRootObserver( root );
			}
			queueReconcile();
		} );
		bodyObserver.observe( document.body, { childList: true, subtree: true } );

		bindRootObserver( checkoutRoot() );
		bindCommerceSubscription();
		queueReconcile();
		window.setTimeout( queueReconcile, 250 );
		window.setTimeout( queueReconcile, 750 );
		window.setTimeout( queueReconcile, 1500 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	} else {
		initialize();
	}
} )();
