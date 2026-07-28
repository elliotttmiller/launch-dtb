<?php
/**
 * QuickBooks administrator control-center REST controller.
 *
 * Provides a redacted read model and explicit operator actions. Accounting
 * writes remain queue-owned by the canonical order platform.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_QuickBooksAdminController {
	private const REST_NAMESPACE = 'dtb/v1';

	public static function register(): void {
		add_action( 'rest_api_init', [ self::class, 'register_rest_routes' ] );
		add_action( 'admin_init', [ self::class, 'redirect_oauth_notice' ], 5 );
	}

	/**
	 * Move the legacy OAuth callback landing page into the permanent control
	 * center while preserving the redacted result code.
	 */
	public static function redirect_oauth_notice(): void {
		if ( ! is_admin() || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$notice = sanitize_key( wp_unslash( $_GET['dtb_qbo_notice'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$page   = sanitize_key( wp_unslash( $_GET['page'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		global $pagenow;

		if ( '' === $notice || 'index.php' !== $pagenow || 'dtb-quickbooks' === $page ) {
			return;
		}

		wp_safe_redirect(
			add_query_arg(
				[
					'page'           => 'dtb-quickbooks',
					'dtb_qbo_notice' => $notice,
				],
				admin_url( 'admin.php' )
			)
		);
		exit;
	}

	public static function register_rest_routes(): void {
		register_rest_route(
			self::REST_NAMESPACE,
			'/admin/qbo/dashboard',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ self::class, 'rest_dashboard' ],
				'permission_callback' => [ self::class, 'can_manage' ],
			]
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/admin/qbo/items/discover',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ self::class, 'rest_discover_items' ],
				'permission_callback' => [ self::class, 'can_manage' ],
			]
		);
	}

	public static function can_manage(): bool {
		return current_user_can( 'manage_options' );
	}

	public static function rest_dashboard(): WP_REST_Response {
		return new WP_REST_Response( self::read_model(), 200 );
	}

	public static function rest_discover_items(): WP_REST_Response|WP_Error {
		$result = DTB_QuickBooksItemMappingService::discover_and_store();
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response(
			[
				'ok'        => true,
				'discovery' => $result,
				'dashboard' => self::read_model(),
			],
			200
		);
	}

	/**
	 * Build the redacted control-center read model.
	 *
	 * @return array<string, mixed>
	 */
	public static function read_model(): array {
		$status_response = DTB_QuickBooksOAuthController::rest_status();
		$status          = (array) $status_response->get_data();
		$mappings        = DTB_QuickBooksItemMappingService::status();
		$items_ready     = DTB_QuickBooksItemMappingService::ready();
		$connected       = ! empty( $status['connected'] );
		$company_ready   = ! empty( $status['company_verified'] );
		$webhook_ready   = ! empty( $status['webhook_verifier_configured'] );
		$credentials     = ! empty( $status['credentials_configured'] );
		$token_expires   = (int) ( $status['token_expires_at'] ?? 0 );
		$company         = get_option( dtb_qbo_option_name( 'company' ), [] );
		$mapping_verified_at = '';

		foreach ( $mappings as $mapping ) {
			if ( ! empty( $mapping['verified_at'] ) ) {
				$mapping_verified_at = sanitize_text_field( (string) $mapping['verified_at'] );
				break;
			}
		}

		$checks = [
			'credentials' => [
				'label'       => __( 'Credentials', 'drywall-toolbox' ),
				'complete'    => $credentials,
				'description' => $credentials ? __( 'Client credentials are configured.', 'drywall-toolbox' ) : __( 'Client credentials are missing.', 'drywall-toolbox' ),
			],
			'connection'  => [
				'label'       => __( 'OAuth connection', 'drywall-toolbox' ),
				'complete'    => $connected,
				'description' => $connected ? __( 'Encrypted access and refresh tokens are stored.', 'drywall-toolbox' ) : __( 'QuickBooks is not connected.', 'drywall-toolbox' ),
			],
			'company'     => [
				'label'       => __( 'Company verification', 'drywall-toolbox' ),
				'complete'    => $company_ready,
				'description' => $company_ready ? __( 'The connected company was verified through the Intuit API.', 'drywall-toolbox' ) : __( 'Company access has not been verified.', 'drywall-toolbox' ),
			],
			'items'       => [
				'label'       => __( 'Accounting items', 'drywall-toolbox' ),
				'complete'    => $items_ready,
				'description' => $items_ready ? __( 'All required Service items are mapped and verified for the connected company.', 'drywall-toolbox' ) : __( 'Accounting item mappings are missing, stale, or not verified for the connected company.', 'drywall-toolbox' ),
			],
			'webhook'     => [
				'label'       => __( 'Webhook verification', 'drywall-toolbox' ),
				'complete'    => $webhook_ready,
				'description' => $webhook_ready ? __( 'Signed webhook verification is configured.', 'drywall-toolbox' ) : __( 'Webhook verifier configuration is missing.', 'drywall-toolbox' ),
			],
		];

		$ready = $credentials && $connected && $company_ready && $items_ready && $webhook_ready;

		return [
			'ok'          => true,
			'generatedAt' => gmdate( 'c' ),
			'status'      => $status,
			'readiness'   => [
				'ready'  => $ready,
				'checks' => $checks,
			],
			'items'       => array_values( $mappings ),
			'mapping'     => [
				'ready'      => $items_ready,
				'verifiedAt' => $mapping_verified_at,
			],
			'token'       => [
				'expiresAt'    => $token_expires,
				'expiresAtIso' => $token_expires > 0 ? gmdate( 'c', $token_expires ) : '',
				'expired'      => $token_expires > 0 && $token_expires <= time(),
			],
			'company'     => [
				'name'        => sanitize_text_field( (string) ( $status['company_name'] ?? '' ) ),
				'country'     => is_array( $company ) ? sanitize_text_field( (string) ( $company['country'] ?? '' ) ) : '',
				'verifiedAt'  => is_array( $company ) ? sanitize_text_field( (string) ( $company['verified_at'] ?? '' ) ) : '',
				'realmSuffix' => sanitize_text_field( (string) ( $status['realm_suffix'] ?? '' ) ),
			],
			'links'       => [
				'quickbooks' => 'sandbox' === dtb_qbo_environment() ? 'https://sandbox.qbo.intuit.com/app/homepage' : 'https://qbo.intuit.com/app/homepage',
				'orders'     => admin_url( 'admin.php?page=wc-orders' ),
				'scheduler'  => admin_url( 'tools.php?page=action-scheduler&status=pending&s=quickbooks' ),
			],
		];
	}
}

DTB_QuickBooksAdminController::register();
