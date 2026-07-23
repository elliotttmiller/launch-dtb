( function () {
	'use strict';

	/**
	 * DTB checkout presentation controller.
	 *
	 * WooCommerce Checkout Block remains authoritative for field state, validation,
	 * shipping, totals, payment selection, and submission. This controller only
	 * applies a three-step mobile presentation, progress navigation, and non-submit
	 * continue actions. It never clones, reparents, or recreates Woo/Stripe controls.
	 */

	const mobileViewport = window.matchMedia( '(max-width: 767px)' );
	const checkoutRootSelector = '.wc-block-checkout';
	const inactiveStepClass = 'is-dtb-checkout-step-inactive';
	const stepBodyClasses = [
		'dtb-checkout-step-contact',
		'dtb-checkout-step-shipping',
		'dtb-checkout-step-payment',
	];

	const steps = [
		{
			id: 'contact',
			label: 'Contact',
			selectors: [
				'.wp-block-woocommerce-checkout-express-payment-block',
				'.wc-block-components-express-payment',
				'.wp-block-woocommerce-checkout-contact-information-block',
				'.wc-block-checkout__contact-fields',
				'[data-block-name="woocommerce/checkout-contact-information-block"]',
				'.wp-block-woocommerce-checkout-create-account-block',
			],
		},
		{
			id: 'shipping',
			label: 'Shipping',
			selectors: [
				'.wp-block-woocommerce-checkout-shipping-address-block',
				'.wc-block-checkout__shipping-fields',
				'[data-block-name="woocommerce/checkout-shipping-address-block"]',
				'.wp-block-woocommerce-checkout-billing-address-block',
				'.wc-block-checkout__billing-fields',
				'[data-block-name="woocommerce/checkout-billing-address-block"]',
				'.wp-block-woocommerce-checkout-shipping-method-block',
				'.wp-block-woocommerce-checkout-shipping-methods-block',
				'.wc-block-checkout__shipping-option',
				'.wc-block-checkout__shipping-method',
				'[data-block-name="woocommerce/checkout-shipping-method-block"]',
				'.wp-block-woocommerce-checkout-pickup-options-block',
			],
		},
		{
			id: 'payment',
			label: 'Payment',
			selectors: [
				'.wp-block-woocommerce-checkout-payment-block',
				'.wc-block-checkout__payment-method',
				'[data-block-name="woocommerce/checkout-payment-block"]',
				'.wp-block-woocommerce-checkout-order-note-block',
				'.wc-block-checkout__order-notes',
				'.wp-block-woocommerce-checkout-terms-block',
				'.wc-block-checkout__terms',
				'.wp-block-woocommerce-checkout-actions-block',
				'.wc-block-checkout__actions',
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
	let reconcileQueued = false;

	function checkoutRoot() {
		return document.querySelector( checkoutRootSelector );
	}

	function uniqueElements( elements ) {
		return Array.from( new Set( elements.filter( Boolean ) ) );
	}

	function topLevelElements( elements ) {
		return elements.filter( ( candidate ) => ! elements.some( ( parent ) => parent !== candidate && parent.contains( candidate ) ) );
	}

	function stepElements( stepIndex ) {
		const root = checkoutRoot();
		const step = steps[ stepIndex ];
		if ( ! root || ! step ) {
			return [];
		}

		return topLevelElements( uniqueElements(
			step.selectors.flatMap( ( selector ) => Array.from( root.querySelectorAll( selector ) ) )
		) );
	}

	function clearStepMarkers() {
		document.querySelectorAll( '[data-dtb-checkout-step]' ).forEach( ( node ) => {
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
			button.dataset.step = String( index );
			button.setAttribute( 'aria-label', `${ step.label } checkout step` );
			button.addEventListener( 'click', () => {
				if ( index <= highestVisitedStep ) {
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

		const inner = document.createElement( 'div' );
		inner.className = 'dtb-mobile-checkout-actions__inner';

		const next = document.createElement( 'button' );
		next.type = 'button';
		next.className = 'dtb-mobile-checkout-actions__next';
		next.addEventListener( 'click', () => {
			if ( activeStep >= steps.length - 1 ) {
				return;
			}
			const nextStep = activeStep + 1;
			highestVisitedStep = Math.max( highestVisitedStep, nextStep );
			showStep( nextStep, true );
		} );

		inner.append( next );
		wrapper.append( inner );
		return wrapper;
	}

	function updateControls() {
		progress?.querySelectorAll( '[data-step]' ).forEach( ( button ) => {
			const index = Number( button.dataset.step );
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
		const next = actionBar.querySelector( '.dtb-mobile-checkout-actions__next' );
		const onPayment = activeStep === steps.length - 1;
		actionBar.hidden = onPayment || ! mobileViewport.matches;
		if ( next ) {
			next.textContent = activeStep === 0 ? 'Continue to shipping' : 'Continue to payment';
		}
	}

	function setBodyStepClass() {
		document.body.classList.remove( ...stepBodyClasses );
		if ( mobileViewport.matches ) {
			document.body.classList.add( `dtb-checkout-step-${ steps[ activeStep ].id }` );
		}
	}

	function showStep( requestedStep, shouldScroll = false ) {
		activeStep = Math.max( 0, Math.min( requestedStep, steps.length - 1 ) );
		highestVisitedStep = Math.max( highestVisitedStep, activeStep );
		setBodyStepClass();
		markStepElements();
		updateControls();

		if ( shouldScroll && progress ) {
			progress.scrollIntoView( {
				behavior: window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ? 'auto' : 'smooth',
				block: 'start',
			} );
		}
	}

	function clearMobilePresentation() {
		document.body.classList.remove( 'dtb-checkout-enhanced', 'dtb-mobile-checkout-enhanced', ...stepBodyClasses );
		clearStepMarkers();
		progress?.remove();
		progress = null;
		actionBar?.remove();
		actionBar = null;
	}

	function mountProgressiveCheckout() {
		if ( ! mobileViewport.matches ) {
			clearMobilePresentation();
			return true;
		}

		const root = checkoutRoot();
		if ( ! root ) {
			return false;
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
		if ( ! mobileViewport.matches ) {
			clearMobilePresentation();
			return;
		}
		if ( ! mountProgressiveCheckout() ) {
			return;
		}
		markStepElements();
		updateControls();
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
			if ( root && root !== observedRoot ) {
				bindRootObserver( root );
			}
			queueReconcile();
		} );
		bodyObserver.observe( document.body, { childList: true, subtree: true } );

		queueReconcile();
		window.setTimeout( queueReconcile, 400 );
		window.setTimeout( queueReconcile, 1200 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	} else {
		initialize();
	}
} )();
