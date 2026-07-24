<?php
/**
 * Native checkout identity bridge.
 *
 * The React storefront authenticates customers with the HttpOnly `dtb_auth` JWT.
 * Native WooCommerce checkout is a full WordPress document, so the same verified
 * customer must be resolved before WooCommerce initializes its cookie-backed
 * session. WooCommerce can then perform its own supported guest-session-to-user
 * migration without DTB copying, decoding, or fabricating session rows.
 *
 * Native WordPress cookie auth normally wins only when it represents the same
 * customer or a privileged administrative identity. Non-privileged native customer
 * cookies are compatibility state subordinate to a valid DTB storefront session;
 * stale compatibility cookies are cleared rather than becoming a second auth source.
 *
 * @package drywalltoolbox
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'determine_current_user', 'dtb_native_checkout_resolve_current_user', 25 );

/**
 * Resolve a verified DTB storefront identity for native checkout documents.
 *
 * @param int|false $user_id User resolved by earlier/native auth providers.
 * @return int|false
 */
function dtb_native_checkout_resolve_current_user( $user_id ) {
	if ( ! dtb_native_checkout_identity_bridge_request() ) {
		return $user_id;
	}

	$native_user_id = ! empty( $user_id ) ? absint( $user_id ) : 0;
	$native_user    = $native_user_id > 0 ? get_user_by( 'id', $native_user_id ) : false;
	$native_is_privileged = $native_user instanceof WP_User && dtb_native_checkout_user_is_privileged( $native_user );

	$token = ! empty( $_COOKIE['dtb_auth'] )
		? sanitize_text_field( wp_unslash( (string) $_COOKIE['dtb_auth'] ) )
		: '';

	/* A privileged native session is never cleared/demoted by storefront auth. If
	 * no DTB customer identity exists, preserve that native administrative session. */
	if ( '' === $token ) {
		if ( $native_is_privileged ) {
			return $user_id;
		}
		dtb_native_checkout_clear_stale_customer_cookie( $native_user_id );
		return false;
	}

	$resolved = dtb_native_checkout_verify_user_id( $token );
	if ( $resolved <= 0 ) {
		if ( $native_is_privileged ) {
			return $user_id;
		}
		dtb_native_checkout_clear_stale_customer_cookie( $native_user_id );
		return false;
	}

	$user = get_user_by( 'id', $resolved );
	if ( ! $user instanceof WP_User ) {
		return $user_id;
	}

	/* Storefront JWT compatibility must never mint/assume an administrator or
	 * operator WordPress browser session. Native admin auth remains authoritative. */
	if ( dtb_native_checkout_user_is_privileged( $user ) ) {
		return $user_id;
	}

	if ( $native_user_id > 0 && $native_user_id === $resolved ) {
		return $user_id;
	}

	if ( $native_user_id > 0 && $native_user_id !== $resolved ) {
		if ( $native_is_privileged ) {
			/* Never clear/replace a valid privileged native session from storefront auth.
			 * Checkout remains native-auth-owned and the conflict is observable. */
			dtb_native_checkout_log_security_event( 'native_checkout_privileged_identity_conflict_blocked' );
			return $user_id;
		}

		/* Customer A native cookie + customer B verified DTB JWT: never expose A's
		 * cart/session/customer state to B. Discard browser Woo session without transfer. */
		if ( class_exists( 'DTB_SessionService' ) ) {
			DTB_SessionService::discard_woocommerce_session_for_identity_conflict();
		}
		if ( ! headers_sent() ) {
			wp_clear_auth_cookie();
			wp_set_auth_cookie( $resolved, false, is_ssl() );
		}
		dtb_native_checkout_log_security_event( 'native_checkout_identity_conflict_contained' );
		return $resolved;
	}

	/* A DTB-only customer may arrive directly at checkout before /auth/validate has
	 * established native cookie continuity. Queue a session-scoped WordPress cookie;
	 * persistent storefront identity remains exclusively owned by dtb_auth. */
	if ( ! headers_sent() ) {
		wp_set_auth_cookie( $resolved, false, is_ssl() );
	}

	return $resolved;
}

/** Whether a user crosses the storefront-customer privilege boundary. */
function dtb_native_checkout_user_is_privileged( WP_User $user ): bool {
	return user_can( $user, 'manage_options' ) || user_can( $user, 'edit_users' );
}

/**
 * Clear a stale non-privileged native customer cookie during checkout resolution.
 *
 * WooCommerce remains responsible for rejecting/migrating any session cookie once
 * the request proceeds as a guest. No session rows or cart payloads are copied here.
 */
function dtb_native_checkout_clear_stale_customer_cookie( int $native_user_id ): void {
	if ( $native_user_id <= 0 || headers_sent() ) {
		return;
	}

	$native_user = get_user_by( 'id', $native_user_id );
	if ( $native_user instanceof WP_User && dtb_native_checkout_user_is_privileged( $native_user ) ) {
		return;
	}

	wp_clear_auth_cookie();
	dtb_native_checkout_log_security_event( 'native_checkout_stale_customer_cookie_cleared' );
}

/**
 * Log a redacted event without calling get_current_user_id().
 *
 * This bridge runs inside `determine_current_user`; invoking the normal security
 * logger there would recurse because that logger resolves the current user.
 */
function dtb_native_checkout_log_security_event( string $event ): void {
	error_log(
		(string) wp_json_encode(
			[
				'source' => 'dtb-security',
				'event'  => sanitize_key( $event ),
			],
			JSON_UNESCAPED_SLASHES
		)
	);
}

/** Whether this request is a native Woo checkout/payment document request. */
function dtb_native_checkout_identity_bridge_request(): bool {
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return false;
	}

	$method = isset( $_SERVER['REQUEST_METHOD'] )
		? strtoupper( sanitize_key( wp_unslash( (string) $_SERVER['REQUEST_METHOD'] ) ) )
		: 'GET';
	if ( ! in_array( $method, [ 'GET', 'POST' ], true ) ) {
		return false;
	}

	$request_uri = isset( $_SERVER['REQUEST_URI'] )
		? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';
	$path = (string) wp_parse_url( $request_uri, PHP_URL_PATH );

	if ( preg_match( '#^/(?:staging/[A-Za-z0-9_-]+/)?checkout(?:/|$)#i', $path ) ) {
		return true;
	}

	if ( '/wp/index.php' === rtrim( $path, '/' ) || '/index.php' === rtrim( $path, '/' ) ) {
		$pagename = isset( $_GET['pagename'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			? sanitize_key( wp_unslash( (string) $_GET['pagename'] ) ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			: '';
		return 'checkout' === $pagename;
	}

	return false;
}

/**
 * Verify the existing DTB HS256 cookie contract and return its WordPress user ID.
 *
 * AuthRoutes.php is REST/admin-scoped, so its procedural helpers are not defined
 * during a normal checkout document request. This verifier mirrors only the
 * signed-cookie trust boundary needed before WooCommerce session initialization;
 * it does not accept bearer tokens or caller-supplied customer identities.
 */
function dtb_native_checkout_verify_user_id( string $token ): int {
	$parts = explode( '.', $token );
	if ( 3 !== count( $parts ) ) {
		return 0;
	}

	[ $encoded_header, $encoded_payload, $encoded_signature ] = $parts;
	$header_json  = dtb_native_checkout_base64url_decode( $encoded_header );
	$payload_json = dtb_native_checkout_base64url_decode( $encoded_payload );
	if ( null === $header_json || null === $payload_json ) {
		return 0;
	}

	$header  = json_decode( $header_json );
	$payload = json_decode( $payload_json );
	if ( ! is_object( $header ) || ! is_object( $payload ) || 'HS256' !== ( $header->alg ?? '' ) ) {
		return 0;
	}

	$config = function_exists( 'dtb_get_config' ) ? dtb_get_config() : [];
	$secret = is_array( $config ) ? (string) ( $config['jwt_secret'] ?? '' ) : '';
	if ( '' === $secret ) {
		return 0;
	}

	$expected = rtrim(
		strtr(
			base64_encode( hash_hmac( 'sha256', $encoded_header . '.' . $encoded_payload, $secret, true ) ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
			'+/',
			'-_'
		),
		'='
	);
	if ( ! hash_equals( $expected, $encoded_signature ) ) {
		return 0;
	}

	$now = time();
	$sub = isset( $payload->sub ) ? absint( $payload->sub ) : 0;
	$exp = isset( $payload->exp ) ? (int) $payload->exp : 0;
	$iat = isset( $payload->iat ) ? (int) $payload->iat : 0;
	if ( $sub <= 0 || $exp <= $now || ( $iat > 0 && $iat > $now + 300 ) ) {
		return 0;
	}

	return $sub;
}

/** Strict base64url decode. */
function dtb_native_checkout_base64url_decode( string $value ): ?string {
	if ( '' === $value || ! preg_match( '/^[A-Za-z0-9_-]+$/', $value ) ) {
		return null;
	}

	$padded  = $value . str_repeat( '=', ( 4 - ( strlen( $value ) % 4 ) ) % 4 );
	$decoded = base64_decode( strtr( $padded, '-_', '+/' ), true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
	return false === $decoded ? null : $decoded;
}
