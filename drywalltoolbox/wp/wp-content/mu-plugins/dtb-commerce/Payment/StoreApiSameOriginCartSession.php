<?php
/**
 * Force cookie-backed WooCommerce Store API sessions for same-origin requests.
 *
 * WooCommerce's Store API treats a valid `Cart-Token` request header as an
 * instruction to abandon the normal cookie-backed WC_Session entirely and
 * resolve the cart from a separate, token-keyed session instead — see
 * Automattic\WooCommerce\StoreApi\Authentication::maybe_use_store_api_session_handler()
 * and AbstractCartRoute::load_cart_session(). This exists to support genuinely
 * headless/cross-origin clients that cannot rely on cookies.
 *
 * This storefront is same-origin only (see frontend/src/api/cart.js —
 * USE_CART_TOKEN_SESSION is explicitly false here, by design: "On the
 * same-origin storefront, WooCommerce's cookie-backed session is the cart
 * authority"). Our own SPA never sends a Cart-Token on this origin. But
 * WooCommerce Blocks' own native checkout runtime (the actual `/checkout/`
 * page, entirely outside our app) manages its own Cart-Token independently of
 * that policy, and can carry a stale token forward from earlier in the same
 * tab (e.g. picked up while browsing before an item was added under the
 * cookie session). When that happens, checkout silently resolves a different,
 * often-empty cart — "Cannot place an order, your cart is empty" — even
 * though the cookie session the rest of the storefront was using has the
 * real cart the whole time.
 *
 * Stripping the header for same-origin requests (Origin absent or matching
 * this site) removes that divergence path entirely: every Store API request
 * from this storefront then resolves the one authoritative cookie session,
 * matching the policy our own client code already commits to. Cross-origin
 * requests (Origin present and not ours) are left untouched.
 *
 * @package drywalltoolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_StoreApiSameOriginCartSession {
	public static function register(): void {
		// Must run before WooCommerce reads $_SERVER['HTTP_CART_TOKEN'] to pick
		// a session handler (StoreApi::init() wires that on 'rest_api_init' at
		// default priority via the 'woocommerce_session_handler' filter, and
		// AbstractCartRoute reads it per-request). 'muplugins_loaded' is the
		// earliest action available and fires well before either.
		add_action( 'muplugins_loaded', [ __CLASS__, 'maybe_strip_cross_context_cart_token' ], 0 );

		// TEMPORARY diagnostic for the "cart empty at checkout" investigation.
		// Logs session/cookie/cart state actually seen by cart and checkout
		// Store API requests so the real session identity at each step is
		// visible in the PHP error log, instead of guessing from the browser
		// side. Safe to remove once the root cause is confirmed — it does not
		// change any request/response behavior.
		add_filter( 'rest_request_after_callbacks', [ __CLASS__, 'log_cart_session_diagnostic' ], 20, 3 );
	}

	public static function log_cart_session_diagnostic( $response, array $handler, \WP_REST_Request $request ) {
		$route = (string) $request->get_route();
		if ( ! preg_match( '#^/wc/store/v1/(cart|checkout)#', $route ) ) {
			return $response;
		}

		$session_cookie_name = '';
		$session_cookie_value = '';
		foreach ( $_COOKIE as $cookie_name => $cookie_value ) {
			if ( 0 === strpos( (string) $cookie_name, 'wp_woocommerce_session_' ) ) {
				$session_cookie_name = (string) $cookie_name;
				$session_cookie_value = substr( (string) $cookie_value, 0, 24 ) . '…';
				break;
			}
		}

		$cart_count = null;
		$customer_id = null;
		if ( function_exists( 'WC' ) && WC()->cart instanceof \WC_Cart ) {
			$cart_count = WC()->cart->get_cart_contents_count();
		}
		if ( function_exists( 'WC' ) && WC()->session ) {
			$customer_id = WC()->session->get_customer_id();
		}

		error_log( sprintf(
			'[DTB_CART_DIAG] route=%s method=%s cart_token_header=%s session_cookie=%s session_cookie_value=%s wc_session_customer_id=%s cart_count=%s',
			$route,
			$request->get_method(),
			empty( $_SERVER['HTTP_CART_TOKEN'] ) ? 'absent' : 'PRESENT',
			$session_cookie_name ?: 'none-found',
			$session_cookie_value ?: 'n/a',
			$customer_id ?? 'n/a',
			$cart_count ?? 'n/a'
		) );

		return $response;
	}

	public static function maybe_strip_cross_context_cart_token(): void {
		if ( empty( $_SERVER['HTTP_CART_TOKEN'] ) ) {
			return;
		}

		if ( ! self::is_store_api_request() ) {
			return;
		}

		if ( self::request_origin_is_foreign() ) {
			return;
		}

		unset( $_SERVER['HTTP_CART_TOKEN'] );
	}

	private static function is_store_api_request(): bool {
		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? (string) wp_unslash( $_SERVER['REQUEST_URI'] )
			: '';
		$path = (string) wp_parse_url( $request_uri, PHP_URL_PATH );

		if ( false !== strpos( $path, '/wp-json/wc/store/' ) ) {
			return true;
		}

		// index.php?rest_route=/wc/store/... form.
		$query = (string) wp_parse_url( $request_uri, PHP_URL_QUERY );
		return false !== strpos( $query, 'rest_route=' ) && false !== strpos( $query, '/wc/store/' );
	}

	/**
	 * True only when an Origin header is present AND does not match this site.
	 * No Origin header at all (same-site navigation, most native fetches) is
	 * treated as same-origin, matching frontend/src/api/cart.js's own
	 * same-origin-by-default posture for this single-domain storefront.
	 */
	private static function request_origin_is_foreign(): bool {
		$origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? (string) wp_unslash( $_SERVER['HTTP_ORIGIN'] ) : '';
		if ( '' === $origin ) {
			return false;
		}

		$request_host = strtolower( (string) wp_parse_url( $origin, PHP_URL_HOST ) );
		$home_host    = strtolower( (string) wp_parse_url( home_url( '/' ), PHP_URL_HOST ) );

		return '' === $request_host || $request_host !== $home_host;
	}
}

DTB_StoreApiSameOriginCartSession::register();
