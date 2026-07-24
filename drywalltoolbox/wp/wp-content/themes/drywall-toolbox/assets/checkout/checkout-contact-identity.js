( function () {
	'use strict';

	/**
	 * Mobile contact identity presentation bridge.
	 *
	 * WooCommerce remains the only customer/address data authority. These theme-owned
	 * inputs are presentation proxies for canonical Woo shipping/billing properties;
	 * they are not registered Additional Checkout Fields and never create a second
	 * validation/persistence domain. The proxy values are mirrored into the currently
	 * mounted Woo inputs using native input/change events so Checkout Blocks retain
	 * their normal Store API lifecycle.
	 */

	const mobileViewport = window.matchMedia( '(max-width: 767px)' );
	const checkoutRootSelector = '.wc-block-checkout';
	const contactBlockSelector = '.wp-block-woocommerce-checkout-contact-information-block, [data-block-name="woocommerce/checkout-contact-information-block"], .wc-block-checkout__contact-fields';
	const proxyGroupSelector = '[data-dtb-contact-identity-proxy]';
	const nativeIdentityClass = 'dtb-native-identity-field';

	const fields = [
		{
			key: 'first_name',
			id: 'dtb-contact-first-name',
			label: 'First name',
			autocomplete: 'given-name',
			required: true,
			selectors: [ '#shipping-first_name', '#billing_first_name', '[name="shipping_first_name"]', '[name="billing_first_name"]' ],
		},
		{
			key: 'last_name',
			id: 'dtb-contact-last-name',
			label: 'Last name',
			autocomplete: 'family-name',
			required: true,
			selectors: [ '#shipping-last_name', '#billing_last_name', '[name="shipping_last_name"]', '[name="billing_last_name"]' ],
		},
		{
			key: 'phone',
			id: 'dtb-contact-phone',
			label: 'Phone (optional)',
			autocomplete: 'tel',
			inputmode: 'tel',
			required: false,
			selectors: [ '#shipping-phone', '#billing-phone', '#shipping_phone', '#billing_phone', '[name="shipping_phone"]', '[name="billing_phone"]' ],
		},
	];

	let bodyObserver = null;
	let actionObserver = null;
	let observedActionBar = null;
	let commerceUnsubscribe = null;
	let reconcileQueued = false;

	function uniqueElements( elements ) {
		return Array.from( new Set( elements.filter( Boolean ) ) );
	}

	function checkoutRoot() {
		return document.querySelector( checkoutRootSelector );
	}

	function contactBlock() {
		return checkoutRoot()?.querySelector( contactBlockSelector ) || null;
	}

	function nativeInputs( field ) {
		return uniqueElements( field.selectors.flatMap( ( selector ) => Array.from( document.querySelectorAll( selector ) ) ) );
	}

	function nativeWrapper( input ) {
		return input?.closest( '.wc-block-components-text-input, .wc-block-components-address-form__field' ) || null;
	}

	function setNativeInputValue( input, value ) {
		if ( ! input || input.value === value ) {
			return;
		}
		const descriptor = Object.getOwnPropertyDescriptor( window.HTMLInputElement.prototype, 'value' );
		descriptor?.set?.call( input, value );
		input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
		input.dispatchEvent( new Event( 'change', { bubbles: true } ) );
	}

	function customerData() {
		try {
			const wpData = window.wp?.data;
			const cartStoreDescriptor = window.wc?.wcBlocksData?.cartStore;
			if ( ! wpData?.select || ! cartStoreDescriptor ) {
				return {};
			}
			return wpData.select( cartStoreDescriptor )?.getCustomerData?.() || {};
		} catch {
			return {};
		}
	}

	function canonicalValue( field ) {
		const fromDom = nativeInputs( field ).find( ( input ) => String( input.value || '' ).trim() );
		if ( fromDom ) {
			return String( fromDom.value || '' );
		}
		const customer = customerData();
		const shipping = customer.shippingAddress || customer.shipping_address || {};
		const billing = customer.billingAddress || customer.billing_address || {};
		return String( shipping[ field.key ] || billing[ field.key ] || '' );
	}

	function createProxyField( field ) {
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'dtb-contact-proxy-field dtb-contact-identity-field';

		const label = document.createElement( 'label' );
		label.setAttribute( 'for', field.id );
		label.textContent = field.label;

		const input = document.createElement( 'input' );
		input.id = field.id;
		input.type = field.key === 'phone' ? 'tel' : 'text';
		input.autocomplete = field.autocomplete;
		input.required = field.required;
		input.maxLength = field.key === 'phone' ? 32 : 80;
		input.dataset.dtbCanonicalContactKey = field.key;
		if ( field.inputmode ) {
			input.inputMode = field.inputmode;
		}
		input.value = canonicalValue( field );
		input.addEventListener( 'input', () => {
			nativeInputs( field ).forEach( ( nativeInput ) => setNativeInputValue( nativeInput, input.value ) );
		} );
		input.addEventListener( 'change', () => {
			nativeInputs( field ).forEach( ( nativeInput ) => setNativeInputValue( nativeInput, input.value ) );
		} );

		wrapper.append( label, input );
		return wrapper;
	}

	function ensureProxyGroup() {
		if ( ! mobileViewport.matches ) {
			document.querySelectorAll( proxyGroupSelector ).forEach( ( node ) => node.remove() );
			document.querySelectorAll( `.${ nativeIdentityClass }` ).forEach( ( node ) => node.classList.remove( nativeIdentityClass ) );
			return null;
		}

		const block = contactBlock();
		const container = block?.querySelector( '.wc-block-components-checkout-step__container' ) || block;
		if ( ! container ) {
			return null;
		}

		let group = container.querySelector( proxyGroupSelector );
		if ( ! group ) {
			group = document.createElement( 'div' );
			group.className = 'dtb-contact-proxy-grid';
			group.dataset.dtbContactIdentityProxy = '1';
			fields.forEach( ( field ) => group.append( createProxyField( field ) ) );

			const emailInput = container.querySelector( 'input[type="email"], input[autocomplete="email"]' );
			const emailWrapper = emailInput?.closest( '.wc-block-components-text-input, .wc-block-components-checkout-step__container > *' );
			if ( emailWrapper?.parentNode === container ) {
				emailWrapper.insertAdjacentElement( 'afterend', group );
			} else {
				container.append( group );
			}
		}
		return group;
	}

	function synchronizeCanonicalIdentity() {
		const group = ensureProxyGroup();
		if ( ! group ) {
			return;
		}

		fields.forEach( ( field ) => {
			const proxy = group.querySelector( `[data-dtb-canonical-contact-key="${ field.key }"]` );
			const natives = nativeInputs( field );
			natives.forEach( ( input ) => nativeWrapper( input )?.classList.add( nativeIdentityClass ) );

			if ( proxy && ! proxy.value ) {
				const current = canonicalValue( field );
				if ( current ) {
					proxy.value = current;
				}
			}
			if ( proxy && proxy.value ) {
				natives.forEach( ( input ) => setNativeInputValue( input, proxy.value ) );
			}
		} );
	}

	function hardenContactNextButton() {
		const actionBar = document.querySelector( '.dtb-mobile-checkout-actions' );
		const next = actionBar?.querySelector( '.dtb-mobile-checkout-actions__next' );
		if ( ! actionBar || ! next ) {
			return;
		}

		if ( observedActionBar !== actionBar ) {
			actionObserver?.disconnect();
			observedActionBar = actionBar;
			actionObserver = new MutationObserver( queueReconcile );
			actionObserver.observe( actionBar, { attributes: true, subtree: true, attributeFilter: [ 'disabled', 'hidden', 'class' ] } );
		}

		if ( document.body.classList.contains( 'dtb-checkout-step-contact' ) ) {
			/* Contact progression is presentation-only and must never be blocked by a
			 * background Woo totals calculation triggered by wallets/order summary.
			 * Required visible contact inputs are still validated by checkout-ui.js. */
			if ( next.disabled ) {
				next.disabled = false;
			}
			next.removeAttribute( 'aria-disabled' );
			if ( ! next.dataset.dtbContactSyncBound ) {
				next.dataset.dtbContactSyncBound = '1';
				next.addEventListener( 'click', synchronizeCanonicalIdentity, true );
			}
		}
	}

	function reconcile() {
		reconcileQueued = false;
		ensureProxyGroup();
		synchronizeCanonicalIdentity();
		hardenContactNextButton();
	}

	function queueReconcile() {
		if ( reconcileQueued ) {
			return;
		}
		reconcileQueued = true;
		window.requestAnimationFrame( reconcile );
	}

	function bindCommerceSubscription() {
		if ( commerceUnsubscribe || ! window.wp?.data?.subscribe ) {
			return;
		}
		commerceUnsubscribe = window.wp.data.subscribe( queueReconcile );
	}

	function initialize() {
		mobileViewport.addEventListener( 'change', queueReconcile );
		bodyObserver = new MutationObserver( queueReconcile );
		bodyObserver.observe( document.body, { childList: true, subtree: true } );
		bindCommerceSubscription();
		queueReconcile();
		window.setTimeout( queueReconcile, 250 );
		window.setTimeout( queueReconcile, 750 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	} else {
		initialize();
	}
} )();
