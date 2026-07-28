<?php
/**
 * QuickBooks operator and OAuth controller.
 *
 * Exposes the permanent administrator REST contract and owns the browser
 * callback for Intuit OAuth. No QuickBooks business logic or accounting writes
 * live in this controller.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_QuickBooksOAuthController' ) ) {
	return;
}

final class DTB_QuickBooksOAuthController {
	private const REST_NAMESPACE = 'dtb/v1';
	private const NOTICE_QUERY   = 'dtb_qbo_notice';

	/** Register hooks and replace legacy orphan admin behavior. */
	public static function register(): void {
		remove_action( 'admin_menu', 'dtb_qbo_register_settings_page', 20 );
		remove_action( 'wp_ajax_dtb_qbo_oauth_callback', 'dtb_qbo_handle_oauth_callback' );
		remove_action( 'rest_api_init', 'dtb_qbo_register_rest_routes' );

		add_action( 'wp_ajax_dtb_qbo_oauth_callback', [ self::class, 'handle_oauth_callback' ] );
		add_action( 'rest_api_init', [ self::class, 'register_rest_routes' ] );
		add_action( 'admin_notices', [ self::class, 'render_admin_notice' ] );
	}

	/** Register the administrator-only QuickBooks operator API. */
	public static function register_rest_routes(): void {
		register_rest_route(
			self::REST_NAMESPACE,
			'/admin/qbo/status',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ self::class, 'rest_status' ],
				'permission_callback' => [ self::class, 'can_manage' ],
			]
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/admin/qbo/connect',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ self::class, 'rest_connect' ],
				'permission_callback' => [ self::class, 'can_manage' ],
			]
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/admin/qbo/test',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ self::class, 'rest_test' ],
				'permission_callback' => [ self::class, 'can_manage' ],
			]
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/admin/qbo/disconnect',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ self::class, 'rest_disconnect' ],
				'permission_callback' => [ self::class, 'can_manage' ],
			]
		);
	}

	/** Require an authenticated administrator for every operator action. */
	public static function can_manage(): bool {
		return current_user_can( 'manage_options' );
	}

	/** Return a redacted connection status snapshot. */
	public static function rest_status(): WP_REST_Response {
		return new WP_REST_Response( dtb_qbo_status(), 200 );
	}

	/** Create a one-time Intuit authorization URL. */
	public static function rest_connect(): WP_REST_Response|WP_Error {
		$status = dtb_qbo_status();
		if ( empty( $status['credentials_configured'] ) ) {
			return new WP_Error(
				'qbo_credentials_missing',
				__( 'QuickBooks development credentials are not configured on the server.', 'dtb' ),
				[ 'status' => 503 ]
			);
		}
		if ( ! empty( $status['connected'] ) ) {
			return new WP_Error(
				'qbo_already_connected',
				__( 'QuickBooks is already connected for the active environment.', 'dtb' ),
				[ 'status' => 409 ]
			);
		}

		$authorization_url = dtb_qbo_get_auth_url();
		if ( '' === $authorization_url ) {
			return new WP_Error(
				'qbo_authorization_unavailable',
				__( 'QuickBooks authorization could not be initialized.', 'dtb' ),
				[ 'status' => 503 ]
			);
		}

		return new WP_REST_Response(
			[
				'ok'                => true,
				'environment'       => dtb_qbo_environment(),
				'authorization_url' => esc_url_raw( $authorization_url ),
				'redirect_uri'      => dtb_qbo_redirect_uri(),
			],
			200
		);
	}

	/** Verify the currently connected QuickBooks company without writing data. */
	public static function rest_test(): WP_REST_Response|WP_Error {
		if ( ! dtb_qbo_enabled() ) {
			return new WP_Error(
				'qbo_not_connected',
				__( 'QuickBooks is not connected for the active environment.', 'dtb' ),
				[ 'status' => 409 ]
			);
		}

		$result = dtb_qbo_verify_company();
		if ( is_wp_error( $result ) ) {
			$result->add_data( [ 'status' => 502 ] );
			return $result;
		}

		return new WP_REST_Response(
			[
				'ok'      => true,
				'company' => $result,
			],
			200
		);
	}

	/** Disconnect only the active environment after explicit confirmation. */
	public static function rest_disconnect( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$confirm = rest_sanitize_boolean( $request->get_param( 'confirm' ) );
		if ( true !== $confirm ) {
			return new WP_Error(
				'qbo_confirmation_required',
				__( 'Set confirm=true to disconnect QuickBooks.', 'dtb' ),
				[ 'status' => 400 ]
			);
		}

		$environment = dtb_qbo_environment();
		dtb_qbo_clear_tokens();

		if ( function_exists( 'dtb_ops_audit_log' ) ) {
			dtb_ops_audit_log( 'qbo_disconnected', [ 'environment' => $environment ] );
		}

		return new WP_REST_Response(
			[
				'ok'          => true,
				'environment' => $environment,
				'connected'   => false,
			],
			200
		);
	}

	/** Complete the Intuit OAuth code exchange and verify the selected company. */
	public static function handle_oauth_callback(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Insufficient permissions.', 'dtb' ), 403 );
		}

		$state = sanitize_text_field( wp_unslash( $_GET['state'] ?? '' ) );
		$key   = 'dtb_qbo_oauth_' . hash( 'sha256', $state );
		$txn   = get_transient( $key );
		delete_transient( $key );

		if (
			'' === $state
			|| ! is_array( $txn )
			|| (int) ( $txn['user_id'] ?? 0 ) !== get_current_user_id()
			|| (string) ( $txn['environment'] ?? '' ) !== dtb_qbo_environment()
			|| (string) ( $txn['redirect_uri'] ?? '' ) !== dtb_qbo_redirect_uri()
		) {
			self::redirect_with_notice( 'invalid_state' );
		}

		if ( isset( $_GET['error'] ) ) {
			self::redirect_with_notice( 'authorization_denied' );
		}

		$code     = sanitize_text_field( wp_unslash( $_GET['code'] ?? '' ) );
		$realm_id = preg_replace( '/[^0-9]/', '', (string) wp_unslash( $_GET['realmId'] ?? '' ) );
		if ( '' === $code || '' === $realm_id ) {
			self::redirect_with_notice( 'invalid_response' );
		}

		$tokens = dtb_qbo_token_request(
			[
				'grant_type'   => 'authorization_code',
				'code'         => $code,
				'redirect_uri' => dtb_qbo_redirect_uri(),
			]
		);
		if ( is_wp_error( $tokens ) ) {
			self::redirect_with_notice( 'token_exchange' );
		}

		$tokens['realm_id'] = $realm_id;
		if ( ! dtb_qbo_save_tokens( $tokens ) ) {
			dtb_qbo_clear_tokens();
			self::redirect_with_notice( 'token_storage' );
		}

		$company = dtb_qbo_verify_company();
		if ( is_wp_error( $company ) ) {
			dtb_qbo_clear_tokens();
			self::redirect_with_notice( 'company_verification' );
		}

		if ( function_exists( 'dtb_ops_audit_log' ) ) {
			dtb_ops_audit_log(
				'qbo_oauth_connected',
				[
					'environment'  => dtb_qbo_environment(),
					'realm_suffix' => substr( $realm_id, -4 ),
				]
			);
		}

		self::redirect_with_notice( 'connected' );
	}

	/** Render a single post-OAuth dashboard notice without exposing secrets. */
	public static function render_admin_notice(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$notice = sanitize_key( wp_unslash( $_GET[ self::NOTICE_QUERY ] ?? '' ) );
		if ( '' === $notice ) {
			return;
		}

		if ( 'connected' === $notice ) {
			echo '<div class="notice notice-success is-dismissible"><p>'
				. esc_html__( 'QuickBooks connected and the selected company was verified.', 'dtb' )
				. '</p></div>';
			return;
		}

		echo '<div class="notice notice-error is-dismissible"><p>'
			. esc_html__( 'QuickBooks connection failed. Verify the registered redirect URI and server-managed development credentials, then retry.', 'dtb' )
			. '</p></div>';
	}

	/** Redirect to the WordPress dashboard with a redacted result code. */
	private static function redirect_with_notice( string $notice ): never {
		wp_safe_redirect(
			add_query_arg(
				self::NOTICE_QUERY,
				sanitize_key( $notice ),
				admin_url( 'index.php' )
			)
		);
		exit;
	}
}

DTB_QuickBooksOAuthController::register();

/** Backward-compatible helper for callers that need a one-time authorization URL. */
function dtb_integrations_qbo_auth_url(): string {
	return function_exists( 'dtb_qbo_get_auth_url' ) ? (string) dtb_qbo_get_auth_url() : '';
}
