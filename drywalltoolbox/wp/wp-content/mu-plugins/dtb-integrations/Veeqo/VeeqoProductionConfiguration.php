<?php
/**
 * DTB Veeqo production configuration.
 *
 * Replaces the legacy credential-centric WooCommerce integration settings UI
 * with a production-safe configuration surface. Secrets remain server-side,
 * operational IDs are explicitly validated, and ambiguous API discovery never
 * silently chooses the first returned channel/location/method.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_VEEQO_CONFIGURATION_DIAGNOSTICS_OPTION = 'dtb_veeqo_configuration_diagnostics';

/**
 * Return true when a server-side API key constant is configured.
 */
function dtb_veeqo_production_api_key_configured(): bool {
	return defined( 'DTB_VEEQO_API_KEY' ) && '' !== trim( (string) DTB_VEEQO_API_KEY );
}

/**
 * Return order-projection readiness without exposing credentials.
 *
 * @return array<string,mixed>
 */
function dtb_veeqo_production_readiness(): array {
	$config = function_exists( 'dtb_veeqo_config' ) ? dtb_veeqo_config() : [];
	$missing = [];

	if ( ! dtb_veeqo_production_api_key_configured() ) {
		$missing[] = 'api_key';
	}
	if ( absint( $config['channel_id'] ?? 0 ) <= 0 ) {
		$missing[] = 'channel_id';
	}
	if ( absint( $config['warehouse_id'] ?? 0 ) <= 0 ) {
		$missing[] = 'warehouse_id';
	}
	if ( absint( $config['delivery_method_id'] ?? 0 ) <= 0 ) {
		$missing[] = 'delivery_method_id';
	}

	return [
		'ready'                => empty( $missing ),
		'missing'              => $missing,
		'api_key_source'       => dtb_veeqo_production_api_key_configured() ? 'server_constant' : 'missing',
		'channel_id'           => absint( $config['channel_id'] ?? 0 ),
		'warehouse_id'         => absint( $config['warehouse_id'] ?? 0 ),
		'delivery_method_id'   => absint( $config['delivery_method_id'] ?? 0 ),
		'webhook_verification' => defined( 'DTB_VEEQO_WEBHOOK_SECRET' ) && '' !== trim( (string) DTB_VEEQO_WEBHOOK_SECRET ) ? 'configured' : 'disabled',
	];
}

/**
 * Fetch selectable Veeqo resources using the configured server-side key.
 *
 * @return array{channels:array<int,array<string,mixed>>,warehouses:array<int,array<string,mixed>>,delivery_methods:array<int,array<string,mixed>>,errors:string[]}
 */
function dtb_veeqo_production_discover_resources(): array {
	$result = [
		'channels'         => [],
		'warehouses'       => [],
		'delivery_methods' => [],
		'errors'           => [],
	];

	if ( ! dtb_veeqo_production_api_key_configured() || ! function_exists( 'dtb_veeqo_request' ) ) {
		$result['errors'][] = 'Veeqo API credential is not configured server-side.';
		return $result;
	}

	$channels = dtb_veeqo_request( 'GET', '/channels', [ 'type_code' => 'direct' ] );
	if ( empty( $channels['ok'] ) || ! is_array( $channels['data'] ?? null ) ) {
		$result['errors'][] = 'Unable to load Veeqo Direct channels.';
	} else {
		foreach ( $channels['data'] as $channel ) {
			if ( ! is_array( $channel ) || 'direct' !== (string) ( $channel['type_code'] ?? '' ) || absint( $channel['id'] ?? 0 ) <= 0 ) {
				continue;
			}
			$result['channels'][] = [
				'id'       => absint( $channel['id'] ),
				'name'     => sanitize_text_field( (string) ( $channel['name'] ?? 'Direct channel' ) ),
				'currency' => sanitize_text_field( (string) ( $channel['currency_code'] ?? '' ) ),
				'state'    => sanitize_key( (string) ( $channel['state'] ?? '' ) ),
			];
		}
	}

	$warehouses = dtb_veeqo_request( 'GET', '/warehouses', [ 'page_size' => '100', 'page' => '1' ] );
	if ( empty( $warehouses['ok'] ) || ! is_array( $warehouses['data'] ?? null ) ) {
		$result['errors'][] = 'Unable to load Veeqo warehouses.';
	} else {
		foreach ( $warehouses['data'] as $warehouse ) {
			if ( ! is_array( $warehouse ) || absint( $warehouse['id'] ?? 0 ) <= 0 || ! empty( $warehouse['deleted_at'] ) ) {
				continue;
			}
			$result['warehouses'][] = [
				'id'   => absint( $warehouse['id'] ),
				'name' => sanitize_text_field( (string) ( $warehouse['name'] ?? 'Warehouse' ) ),
			];
		}
	}

	$methods = dtb_veeqo_request( 'GET', '/delivery_methods', [ 'page_size' => '100', 'page' => '1' ] );
	if ( empty( $methods['ok'] ) || ! is_array( $methods['data'] ?? null ) ) {
		$result['errors'][] = 'Unable to load Veeqo delivery methods.';
	} else {
		foreach ( $methods['data'] as $method ) {
			if ( ! is_array( $method ) || absint( $method['id'] ?? 0 ) <= 0 ) {
				continue;
			}
			$result['delivery_methods'][] = [
				'id'   => absint( $method['id'] ),
				'name' => sanitize_text_field( (string) ( $method['name'] ?? 'Delivery method' ) ),
			];
		}
	}

	return $result;
}

/**
 * Validate configured IDs against Veeqo. Empty IDs are auto-filled only when
 * the API returns exactly one valid candidate; ambiguous results require an
 * explicit operator selection.
 *
 * @return array<string,mixed>
 */
function dtb_veeqo_production_validate_configuration( bool $persist = true ): array {
	$settings  = (array) get_option( 'woocommerce_dtb_veeqo_settings', [] );
	$resources = dtb_veeqo_production_discover_resources();
	$errors    = $resources['errors'];

	$definitions = [
		'channel_id'         => 'channels',
		'warehouse_id'       => 'warehouses',
		'delivery_method_id' => 'delivery_methods',
	];

	foreach ( $definitions as $field => $resource_key ) {
		$candidates = (array) $resources[ $resource_key ];
		$valid_ids  = array_values( array_filter( array_map( static fn( array $item ): int => absint( $item['id'] ?? 0 ), $candidates ) ) );
		$current_id = absint( $settings[ $field ] ?? 0 );

		if ( $current_id > 0 && ! in_array( $current_id, $valid_ids, true ) ) {
			$errors[] = sprintf( 'Configured %s %d was not returned by Veeqo.', $field, $current_id );
			$settings[ $field ] = 0;
			$current_id = 0;
		}

		if ( 0 === $current_id && 1 === count( $valid_ids ) ) {
			$settings[ $field ] = $valid_ids[0];
		} elseif ( 0 === $current_id && count( $valid_ids ) > 1 ) {
			$errors[] = sprintf( 'Multiple Veeqo %s candidates exist; select the intended ID explicitly.', $resource_key );
		}
	}

	// Secrets are never persisted by the production settings surface.
	unset( $settings['api_key'], $settings['webhook_secret'] );

	if ( $persist ) {
		update_option( 'woocommerce_dtb_veeqo_settings', $settings, false );
		unset( $GLOBALS['_dtb_veeqo_config'] );
	}

	$readiness = dtb_veeqo_production_readiness();
	$diagnostics = [
		'checked_at'          => gmdate( 'c' ),
		'ready'               => empty( $errors ) && ! empty( $readiness['ready'] ),
		'errors'              => array_values( array_unique( array_map( 'sanitize_text_field', $errors ) ) ),
		'channel_candidates'  => $resources['channels'],
		'warehouse_candidates'=> $resources['warehouses'],
		'delivery_candidates' => $resources['delivery_methods'],
		'readiness'           => $readiness,
	];
	update_option( DTB_VEEQO_CONFIGURATION_DIAGNOSTICS_OPTION, $diagnostics, false );

	return $diagnostics;
}

/**
 * Build select options without exposing any credential material.
 *
 * @param array<int,array<string,mixed>> $items Candidate resources.
 * @return array<string,string>
 */
function dtb_veeqo_production_select_options( array $items ): array {
	$options = [ '' => __( 'Select…', 'woocommerce' ) ];
	foreach ( $items as $item ) {
		$id = absint( $item['id'] ?? 0 );
		if ( $id <= 0 ) {
			continue;
		}
		$name = sanitize_text_field( (string) ( $item['name'] ?? 'Veeqo resource' ) );
		$options[ (string) $id ] = sprintf( '%s (#%d)', $name, $id );
	}
	return $options;
}

/**
 * Replace the legacy Veeqo integration settings class with the production UI.
 */
add_filter(
	'woocommerce_integrations',
	static function ( array $integrations ): array {
		$integrations = array_values( array_filter( $integrations, static fn( $integration ): bool => 'DTB_Veeqo_WC_Integration' !== $integration ) );

		if ( ! class_exists( 'WC_Integration' ) ) {
			return $integrations;
		}

		if ( ! class_exists( 'DTB_Veeqo_Production_Integration' ) ) {
			final class DTB_Veeqo_Production_Integration extends WC_Integration {
				public function __construct() {
					$this->id                 = 'dtb_veeqo';
					$this->method_title       = __( 'Drywall Toolbox Veeqo', 'woocommerce' );
					$this->method_description = __( 'Production Veeqo fulfillment integration. Credentials remain server-side; channel, warehouse, and delivery mappings are validated before order projection.', 'woocommerce' );
					$this->init_form_fields();
					$this->init_settings();
					add_action( 'woocommerce_update_options_integration_' . $this->id, [ $this, 'process_admin_options' ] );
				}

				public function init_form_fields(): void {
					$diagnostics = (array) get_option( DTB_VEEQO_CONFIGURATION_DIAGNOSTICS_OPTION, [] );
					$channels    = dtb_veeqo_production_select_options( (array) ( $diagnostics['channel_candidates'] ?? [] ) );
					$warehouses  = dtb_veeqo_production_select_options( (array) ( $diagnostics['warehouse_candidates'] ?? [] ) );
					$methods     = dtb_veeqo_production_select_options( (array) ( $diagnostics['delivery_candidates'] ?? [] ) );
					$credential_status = dtb_veeqo_production_api_key_configured()
						? __( 'Configured server-side via <code>DTB_VEEQO_API_KEY</code>. The key is never rendered into wp-admin or stored by this settings page.', 'woocommerce' )
						: __( 'Not configured. Add <code>DTB_VEEQO_API_KEY</code> to the server environment/wp-config.php, then save this page to validate the connection.', 'woocommerce' );

					$this->form_fields = [
						'credential_status' => [
							'title'       => __( 'API Credential', 'woocommerce' ),
							'type'        => 'title',
							'description' => $credential_status,
						],
						'channel_id' => [
							'title'       => __( 'Direct Store / Channel', 'woocommerce' ),
							'type'        => count( $channels ) > 1 ? 'select' : 'number',
							'options'     => $channels,
							'description' => __( 'Use a Veeqo Direct channel for DTB API-created orders. Never use an arbitrary first channel returned by the API.', 'woocommerce' ),
							'default'     => '',
						],
						'warehouse_id' => [
							'title'       => __( 'Fulfillment Warehouse', 'woocommerce' ),
							'type'        => count( $warehouses ) > 1 ? 'select' : 'number',
							'options'     => $warehouses,
							'description' => __( 'Primary Veeqo fulfillment location used for DTB allocation and inventory ownership.', 'woocommerce' ),
							'default'     => '',
						],
						'delivery_method_id' => [
							'title'       => __( 'Default Delivery Method', 'woocommerce' ),
							'type'        => count( $methods ) > 1 ? 'select' : 'number',
							'options'     => $methods,
							'description' => __( 'Required by Veeqo order creation. This is the default until DTB shipping-method-to-Veeqo mappings are configured.', 'woocommerce' ),
							'default'     => '',
						],
						'webhook_status' => [
							'title'       => __( 'Inbound Fulfillment Events', 'woocommerce' ),
							'type'        => 'title',
							'description' => defined( 'DTB_VEEQO_WEBHOOK_SECRET' ) && '' !== trim( (string) DTB_VEEQO_WEBHOOK_SECRET )
								? sprintf( __( 'Verification secret configured server-side. Endpoint: <code>%s</code>. Keep disabled until the upstream Veeqo webhook authentication contract is verified for this account.', 'woocommerce' ), esc_url( rest_url( 'dtb/v1/veeqo/webhooks/order' ) ) )
								: __( 'Disabled. Do not invent or store an ad-hoc webhook secret. Fulfillment reconciliation must use a verified Veeqo-supported authentication contract before activation.', 'woocommerce' ),
						],
					];
				}

				public function validate_channel_id_field( $key, $value ): int {
					return absint( $value );
				}

				public function validate_warehouse_id_field( $key, $value ): int {
					return absint( $value );
				}

				public function validate_delivery_method_id_field( $key, $value ): int {
					return absint( $value );
				}

				public function process_admin_options(): bool {
					$saved = parent::process_admin_options();
					$settings = (array) get_option( 'woocommerce_dtb_veeqo_settings', [] );
					unset( $settings['api_key'], $settings['webhook_secret'] );
					update_option( 'woocommerce_dtb_veeqo_settings', $settings, false );
					unset( $GLOBALS['_dtb_veeqo_config'] );

					if ( ! $saved ) {
						return false;
					}

					$diagnostics = dtb_veeqo_production_validate_configuration( true );
					if ( ! empty( $diagnostics['ready'] ) ) {
						WC_Admin_Settings::add_message( __( 'Veeqo production connection validated. Direct channel, warehouse, and delivery method are ready for queued DTB order projection.', 'woocommerce' ) );
					} else {
						foreach ( (array) ( $diagnostics['errors'] ?? [] ) as $error ) {
							WC_Admin_Settings::add_error( esc_html( $error ) );
						}
						$missing = (array) ( $diagnostics['readiness']['missing'] ?? [] );
						if ( ! empty( $missing ) ) {
							WC_Admin_Settings::add_error( sprintf( __( 'Veeqo is not production-ready. Missing: %s.', 'woocommerce' ), esc_html( implode( ', ', $missing ) ) ) );
						}
					}
					return true;
				}
			}
		}

		$integrations[] = 'DTB_Veeqo_Production_Integration';
		return array_values( array_unique( $integrations ) );
	},
	20
);

/**
 * Admin-only connection/readiness endpoint. Never returns credential material.
 */
add_action(
	'rest_api_init',
	static function (): void {
		register_rest_route( 'dtb/v1', '/veeqo/admin/connection', [
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => static fn(): bool => current_user_can( 'manage_woocommerce' ),
			'callback'            => static function (): WP_REST_Response {
				return rest_ensure_response( [
					'readiness'   => dtb_veeqo_production_readiness(),
					'diagnostics' => (array) get_option( DTB_VEEQO_CONFIGURATION_DIAGNOSTICS_OPTION, [] ),
				] );
			},
		] );

		register_rest_route( 'dtb/v1', '/veeqo/admin/connection/test', [
			'methods'             => WP_REST_Server::CREATABLE,
			'permission_callback' => static fn(): bool => current_user_can( 'manage_woocommerce' ),
			'callback'            => static function (): WP_REST_Response {
				$diagnostics = dtb_veeqo_production_validate_configuration( true );
				return new WP_REST_Response( $diagnostics, ! empty( $diagnostics['ready'] ) ? 200 : 409 );
			},
		] );
	},
	30
);
