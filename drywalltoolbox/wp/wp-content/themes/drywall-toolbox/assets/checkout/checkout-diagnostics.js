/**
 * TEMPORARY DIAGNOSTIC — REMOVE BEFORE FINAL LAUNCH.
 *
 * Read-only checkout diagnostics overlay. Only loaded when the URL contains
 * ?dtb_debug=1 (gated both server-side in functions.php and here). Renders a
 * small fixed overlay reporting loaded asset versions, computed styles on
 * key checkout elements, and Stripe iframe presence/size, so live checkout
 * bug reports can be diagnosed from real data instead of guesswork.
 *
 * This script MUST remain strictly observational:
 *  - it never mutates checkout DOM, form state, accordion state, or payment
 *    state;
 *  - it never reads or touches the contents of any Stripe/provider iframe
 *    (cross-origin, and off-limits regardless) — it only reads the iframe
 *    element's own bounding box from the parent document;
 *  - it never creates, submits, or intercepts anything.
 *
 * DELETE THIS FILE and its enqueue block in functions.php
 * (dtb_enqueue_native_checkout_assets) before final production launch.
 */
( function () {
	'use strict';

	function onReady( fn ) {
		if ( document.readyState === 'loading' ) {
			document.addEventListener( 'DOMContentLoaded', fn );
		} else {
			fn();
		}
	}

	function getVersionParam( url ) {
		if ( ! url ) {
			return '(not found)';
		}
		try {
			var qs = url.split( '?' )[ 1 ] || '';
			var params = new URLSearchParams( qs );
			return params.get( 'ver' ) || '(no ver param)';
		} catch ( e ) {
			return '(unparseable)';
		}
	}

	function findLinkHref( fragment ) {
		var links = document.querySelectorAll( 'link[rel="stylesheet"]' );
		for ( var i = 0; i < links.length; i++ ) {
			if ( links[ i ].href && links[ i ].href.indexOf( fragment ) !== -1 ) {
				return links[ i ].href;
			}
		}
		return null;
	}

	function findScriptSrc( fragment ) {
		var scripts = document.querySelectorAll( 'script[src]' );
		for ( var i = 0; i < scripts.length; i++ ) {
			if ( scripts[ i ].src && scripts[ i ].src.indexOf( fragment ) !== -1 ) {
				return scripts[ i ].src;
			}
		}
		return null;
	}

	function computedFontFor( selector ) {
		var el = document.querySelector( selector );
		if ( ! el ) {
			return selector + ': (element not found)';
		}
		var cs = window.getComputedStyle( el );
		return selector + ': ' + cs.fontFamily;
	}

	function paymentPanelReport() {
		var el = document.querySelector( '.dtb-checkout__accordion-panel[data-dtb-accordion-step="2"]' );
		if ( ! el ) {
			return '(payment accordion panel not found in DOM)';
		}
		var cs = window.getComputedStyle( el );
		var collapsed = el.hasAttribute( 'data-dtb-accordion-collapsed' );
		return [
			'position: ' + cs.position,
			'width: ' + cs.width,
			'height: ' + cs.height,
			'max-height: ' + cs.maxHeight,
			'visibility: ' + cs.visibility,
			'opacity: ' + cs.opacity,
			'data-dtb-accordion-collapsed: ' + ( collapsed ? 'present' : 'absent' ),
		].join( '\n    ' );
	}

	function stripeIframeReport() {
		var frames = document.querySelectorAll( 'iframe[name^="__privateStripeFrame"]' );
		if ( ! frames.length ) {
			return '(0 Stripe iframes found)';
		}
		var lines = [ frames.length + ' Stripe iframe(s) found:' ];
		frames.forEach( function ( f, i ) {
			var r = f.getBoundingClientRect();
			lines.push( '  [' + i + '] ' + Math.round( r.width ) + 'x' + Math.round( r.height ) );
		} );
		return lines.join( '\n    ' );
	}

	function build() {
		var cfg = window.dtbCheckoutDiagnostics || {};
		var expectedVersion = cfg.expectedVersion || '(unknown)';

		var cssChecks = [
			[ 'checkout.css', findLinkHref( 'checkout.css' ) ],
			[ 'checkout-desktop.css', findLinkHref( 'checkout-desktop.css' ) ],
		];
		var jsChecks = [
			[ 'checkout.js', findScriptSrc( 'checkout.js' ) ],
			[ 'checkout-order-summary.js', findScriptSrc( 'checkout-order-summary.js' ) ],
		];

		var lines = [];
		lines.push( 'DTB CHECKOUT DIAGNOSTICS (temporary)' );
		lines.push( 'executed at: ' + new Date().toISOString() );
		lines.push( 'expected DTB_VERSION: ' + expectedVersion );
		lines.push( '' );
		lines.push( 'Stylesheets:' );
		cssChecks.forEach( function ( c ) {
			var ver = getVersionParam( c[ 1 ] );
			var match = ver === expectedVersion ? 'OK' : 'MISMATCH/UNKNOWN';
			lines.push( '  ' + c[ 0 ] + ': ver=' + ver + ' [' + match + ']' + ( c[ 1 ] ? '' : ' (not loaded)' ) );
		} );
		lines.push( '' );
		lines.push( 'Scripts:' );
		jsChecks.forEach( function ( c ) {
			var ver = getVersionParam( c[ 1 ] );
			var match = ver === expectedVersion ? 'OK' : 'MISMATCH/UNKNOWN';
			lines.push( '  ' + c[ 0 ] + ': ver=' + ver + ' [' + match + ']' + ( c[ 1 ] ? '' : ' (not loaded)' ) );
		} );
		lines.push( '' );
		lines.push( 'Computed fonts:' );
		lines.push( '  ' + computedFontFor( '.wc-block-components-checkout-step__title' ) );
		lines.push( '  body: ' + window.getComputedStyle( document.body ).fontFamily );
		lines.push( '' );
		lines.push( 'Payment accordion panel (step 2):' );
		lines.push( '    ' + paymentPanelReport() );
		lines.push( '' );
		lines.push( 'Stripe iframes:' );
		lines.push( '    ' + stripeIframeReport() );
		lines.push( '' );
		lines.push( 'Viewport: ' + window.innerWidth + 'x' + window.innerHeight );
		lines.push( 'Mobile accordion mounted (.dtb-checkout--accordion on form): '
			+ ( document.querySelector( 'form.dtb-checkout--accordion' ) ? 'yes' : 'no' ) );

		return lines.join( '\n' );
	}

	function renderOverlay() {
		var wrap = document.createElement( 'div' );
		wrap.id = 'dtb-checkout-diagnostics';
		wrap.setAttribute( 'aria-hidden', 'true' );
		wrap.style.cssText = [
			'position:fixed',
			'left:0',
			'right:0',
			'bottom:0',
			'z-index:2147483647',
			'background:#0a0a0a',
			'color:#7dffb3',
			'font-family:ui-monospace,Menlo,Consolas,monospace',
			'font-size:11px',
			'line-height:1.4',
			'max-height:45vh',
			'overflow:auto',
			'padding:8px 10px',
			'box-sizing:border-box',
			'border-top:2px solid #ff3b6f',
			'pointer-events:auto',
		].join( ';' );

		var header = document.createElement( 'div' );
		header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:pointer;color:#ff3b6f;font-weight:bold;';
		header.textContent = 'DTB DIAGNOSTIC OVERLAY (temporary — click to toggle)';

		var body = document.createElement( 'pre' );
		body.style.cssText = 'white-space:pre-wrap;word-break:break-word;margin:6px 0 0;';
		body.textContent = build();

		var refreshBtn = document.createElement( 'button' );
		refreshBtn.textContent = 'refresh';
		refreshBtn.style.cssText = 'font-family:inherit;font-size:11px;background:#222;color:#7dffb3;border:1px solid #444;border-radius:3px;padding:2px 6px;cursor:pointer;';
		refreshBtn.addEventListener( 'click', function ( e ) {
			e.stopPropagation();
			body.textContent = build();
		} );

		var headerRow = document.createElement( 'div' );
		headerRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
		headerRow.appendChild( header );
		headerRow.appendChild( refreshBtn );

		var collapsed = false;
		headerRow.addEventListener( 'click', function () {
			collapsed = ! collapsed;
			body.style.display = collapsed ? 'none' : 'block';
		} );

		wrap.appendChild( headerRow );
		wrap.appendChild( body );
		document.body.appendChild( wrap );
	}

	onReady( renderOverlay );
} )();
