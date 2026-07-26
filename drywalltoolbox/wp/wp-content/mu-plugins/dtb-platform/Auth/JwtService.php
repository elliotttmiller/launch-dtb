<?php
/**
 * Canonical DTB JWT service.
 *
 * This service is loaded for every WordPress request so REST authentication and
 * native WooCommerce checkout use one verification implementation.
 *
 * @package drywalltoolbox
 */

defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_JwtService' ) ) {
	return;
}

final class DTB_JwtService {
	private const ALGORITHM = 'HS256';
	private const CLOCK_SKEW_SECONDS = 300;

	public static function generate_for_user( WP_User $user ): string {
		$secret = self::secret();
		if ( is_wp_error( $secret ) ) {
			return '';
		}

		$dtb_caps = [];
		foreach ( [ 'DTB_CAP_OPS_ADMIN', 'DTB_CAP_ACCOUNTING', 'DTB_CAP_SUPPORT', 'DTB_CAP_CATALOG' ] as $constant ) {
			if ( defined( $constant ) ) {
				$capability = constant( $constant );
				if ( is_string( $capability ) && $user->has_cap( $capability ) ) {
					$dtb_caps[] = $capability;
				}
			}
		}

		$issued_at = time();
		$header    = self::base64url_encode( (string) wp_json_encode( [ 'alg' => self::ALGORITHM, 'typ' => 'JWT' ] ) );
		$payload   = self::base64url_encode(
			(string) wp_json_encode(
				[
					'sub'      => (int) $user->ID,
					'email'    => (string) $user->user_email,
					'roles'    => array_values( (array) $user->roles ),
					'dtb_caps' => array_values( array_unique( $dtb_caps ) ),
					'iat'      => $issued_at,
					'exp'      => $issued_at + ( 7 * DAY_IN_SECONDS ),
				]
			)
		);
		$signature = self::base64url_encode( hash_hmac( 'sha256', $header . '.' . $payload, $secret, true ) );

		return $header . '.' . $payload . '.' . $signature;
	}

	/** @return object|WP_Error */
	public static function verify( string $token ) {
		$secret = self::secret();
		if ( is_wp_error( $secret ) ) {
			return $secret;
		}

		$parts = explode( '.', trim( $token ) );
		if ( 3 !== count( $parts ) ) {
			return self::error( 'invalid_token', 'Malformed token.' );
		}

		[ $encoded_header, $encoded_payload, $encoded_signature ] = $parts;
		$header_json  = self::base64url_decode( $encoded_header );
		$payload_json = self::base64url_decode( $encoded_payload );
		if ( null === $header_json || null === $payload_json ) {
			return self::error( 'invalid_token', 'Token encoding is invalid.' );
		}

		$header  = json_decode( $header_json );
		$payload = json_decode( $payload_json );
		if ( ! is_object( $header ) || ! is_object( $payload ) ) {
			return self::error( 'invalid_token', 'Token payload is unreadable.' );
		}
		if ( self::ALGORITHM !== ( $header->alg ?? '' ) || 'JWT' !== ( $header->typ ?? 'JWT' ) ) {
			return self::error( 'invalid_token', 'Token header is invalid.' );
		}

		$expected_signature = self::base64url_encode( hash_hmac( 'sha256', $encoded_header . '.' . $encoded_payload, $secret, true ) );
		if ( ! hash_equals( $expected_signature, $encoded_signature ) ) {
			return self::error( 'invalid_token', 'Invalid token signature.' );
		}

		$now = time();
		$sub = isset( $payload->sub ) ? absint( $payload->sub ) : 0;
		$exp = isset( $payload->exp ) ? (int) $payload->exp : 0;
		$iat = isset( $payload->iat ) ? (int) $payload->iat : 0;
		if ( $sub <= 0 || $exp <= 0 ) {
			return self::error( 'invalid_token', 'Required token claims are missing.' );
		}
		if ( $now >= $exp ) {
			return self::error( 'token_expired', 'Token has expired.' );
		}
		if ( $iat > 0 && $iat > $now + self::CLOCK_SKEW_SECONDS ) {
			return self::error( 'invalid_token', 'Token issued-at claim is invalid.' );
		}

		return $payload;
	}

	public static function user_id( string $token ): int {
		$payload = self::verify( $token );
		return is_wp_error( $payload ) ? 0 : absint( $payload->sub ?? 0 );
	}

	public static function permission_check( WP_REST_Request $request ) {
		if ( function_exists( 'dtb_jwt_permission' ) ) {
			return dtb_jwt_permission( $request );
		}
		return self::error( 'auth_runtime_unavailable', 'Authentication runtime is unavailable.', 503 );
	}

	private static function secret() {
		$config = function_exists( 'dtb_get_config' ) ? dtb_get_config() : [];
		$secret = is_array( $config ) ? (string) ( $config['jwt_secret'] ?? '' ) : '';
		return '' === $secret ? self::error( 'auth_configuration_error', 'Authentication is unavailable.', 503 ) : $secret;
	}

	private static function base64url_encode( string $value ): string {
		return rtrim( strtr( base64_encode( $value ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
	}

	private static function base64url_decode( string $value ): ?string {
		if ( '' === $value || ! preg_match( '/^[A-Za-z0-9_-]+$/', $value ) ) {
			return null;
		}
		$padded  = $value . str_repeat( '=', ( 4 - ( strlen( $value ) % 4 ) ) % 4 );
		$decoded = base64_decode( strtr( $padded, '-_', '+/' ), true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		return false === $decoded ? null : $decoded;
	}

	private static function error( string $code, string $message, int $status = 401 ): WP_Error {
		return new WP_Error( $code, $message, [ 'status' => $status ] );
	}
}
