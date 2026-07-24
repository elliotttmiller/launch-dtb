<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_SessionService' ) ) {
	return;
}

final class DTB_SessionService {
	public static function set_auth_cookie( string $jwt, int $ttl_sec = 604800 ): void {
		dtb_set_auth_cookie( $jwt, $ttl_sec );
	}

	public static function clear_auth_cookie(): void {
		dtb_clear_auth_cookie();
	}

	/**
	 * Rotate an authenticated Woo session to an anonymous cart-only session.
	 *
	 * Logout must not leave the former customer's contact, address, shipping,
	 * coupon, payment, or checkout state available to the next guest using the
	 * browser. Preserve only the cart payload required for checkout continuity.
	 *
	 * @return bool True when the cart was preserved; false when the session was
	 *              cleared without a cart or WooCommerce was unavailable.
	 */
	public static function rotate_woocommerce_session_to_guest(): bool {
		if ( ! function_exists( 'WC' ) || ! WC() ) {
			self::expire_woocommerce_session_cookie();
			return false;
		}

		try {
			if ( function_exists( 'wc_load_cart' ) && ( ! WC()->session || ! WC()->cart ) ) {
				wc_load_cart();
			}

			$session = WC()->session;
			if (
				! is_object( $session )
				|| ! is_callable( [ $session, 'get' ] )
				|| ! is_callable( [ $session, 'set' ] )
				|| ! is_callable( [ $session, 'destroy_session' ] )
			) {
				self::expire_woocommerce_session_cookie();
				return false;
			}

			$cart = $session->get( 'cart', [] );
			$cart = is_array( $cart ) ? $cart : [];

			/*
			 * WC_Session_Handler generates the replacement customer ID according to
			 * the current WordPress user. This request has already been authorized,
			 * so transition it to user 0 before destroying the customer-owned session.
			 */
			wp_set_current_user( 0 );
			$session->destroy_session();

			if ( empty( $cart ) ) {
				return false;
			}

			$session->set( 'cart', $cart );
			if ( is_callable( [ $session, 'set_customer_session_cookie' ] ) ) {
				$session->set_customer_session_cookie( true );
			}
			if ( is_callable( [ $session, 'save_data' ] ) ) {
				$session->save_data();
			}

			return true;
		} catch ( Throwable $error ) {
			self::expire_woocommerce_session_cookie();
			if ( function_exists( 'wc_get_logger' ) ) {
				wc_get_logger()->error(
					'WooCommerce session rotation failed during storefront logout; the session cookie was expired as a privacy-safe fallback.',
					[
						'source'      => 'dtb-auth',
						'error_class' => get_class( $error ),
					]
				);
			}
			return false;
		}
	}

	/**
	 * Discard a Woo session when two authenticated identities conflict.
	 *
	 * This intentionally does not preserve cart/customer/session data. Carrying a
	 * cart from one authenticated customer into another identity would be a data-
	 * isolation violation. The next request may create/migrate a fresh session for
	 * the verified storefront customer through WooCommerce's native lifecycle.
	 */
	public static function discard_woocommerce_session_for_identity_conflict(): void {
		$previous_user_id = function_exists( 'get_current_user_id' ) ? (int) get_current_user_id() : 0;

		try {
			if ( function_exists( 'wp_set_current_user' ) ) {
				wp_set_current_user( 0 );
			}

			if ( function_exists( 'WC' ) && WC() && is_object( WC()->session ) && is_callable( [ WC()->session, 'destroy_session' ] ) ) {
				WC()->session->destroy_session();
			}
		} catch ( Throwable $error ) {
			if ( function_exists( 'wc_get_logger' ) ) {
				wc_get_logger()->warning(
					'WooCommerce session cleanup encountered an error while containing an auth identity conflict.',
					[
						'source'      => 'dtb-auth',
						'error_class' => get_class( $error ),
					]
				);
			}
		} finally {
			self::expire_woocommerce_session_cookie();
			self::expire_cart_marker_cookies();
			if ( $previous_user_id > 0 && function_exists( 'wp_set_current_user' ) ) {
				wp_set_current_user( $previous_user_id );
			}
		}
	}

	/** Expire the current Woo session cookie without exposing its contents. */
	private static function expire_woocommerce_session_cookie(): void {
		if ( ! defined( 'COOKIEHASH' ) ) {
			return;
		}

		$cookie_name = (string) apply_filters( 'woocommerce_cookie', 'wp_woocommerce_session_' . COOKIEHASH );
		if ( function_exists( 'wc_setcookie' ) ) {
			wc_setcookie( $cookie_name, '', time() - YEAR_IN_SECONDS, is_ssl(), true );
		} else {
			setcookie( $cookie_name, '', [
				'expires'  => time() - YEAR_IN_SECONDS,
				'path'     => defined( 'COOKIEPATH' ) && COOKIEPATH ? COOKIEPATH : '/',
				'secure'   => is_ssl(),
				'httponly' => true,
				'samesite' => 'Lax',
			] );
		}
		unset( $_COOKIE[ $cookie_name ] );
	}

	/** Expire Woo's non-authoritative cart marker cookies after identity conflict. */
	private static function expire_cart_marker_cookies(): void {
		foreach ( [ 'woocommerce_cart_hash', 'woocommerce_items_in_cart' ] as $cookie_name ) {
			if ( function_exists( 'wc_setcookie' ) ) {
				wc_setcookie( $cookie_name, '', time() - YEAR_IN_SECONDS );
			} else {
				setcookie( $cookie_name, '', [
					'expires'  => time() - YEAR_IN_SECONDS,
					'path'     => defined( 'COOKIEPATH' ) && COOKIEPATH ? COOKIEPATH : '/',
					'secure'   => is_ssl(),
					'httponly' => false,
					'samesite' => 'Lax',
				] );
			}
			unset( $_COOKIE[ $cookie_name ] );
		}
	}

	public static function is_cross_origin_request(): bool {
		return dtb_is_cross_origin_request();
	}
}
