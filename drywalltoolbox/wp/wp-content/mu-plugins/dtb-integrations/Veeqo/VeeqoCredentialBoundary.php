<?php
declare(strict_types=1);

/**
 * Veeqo credential/configuration boundary.
 *
 * Secrets are resolved exclusively from server-side constants before the
 * historical compatibility client is loaded. Non-secret resource identifiers
 * retain their supported constant-first, WordPress-option fallback.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_veeqo_boundary_config' ) ) {
	/**
	 * Build the request-local Veeqo configuration without option-stored secrets.
	 *
	 * @return array{api_key:string,webhook_secret:string,warehouse_id:int,channel_id:int,delivery_method_id:int}
	 */
	function dtb_veeqo_boundary_config(): array {
		$stored = (array) get_option( 'woocommerce_dtb_veeqo_settings', [] );

		return [
			'api_key'            => defined( 'DTB_VEEQO_API_KEY' )
				? trim( (string) DTB_VEEQO_API_KEY )
				: '',
			'webhook_secret'     => defined( 'DTB_VEEQO_WEBHOOK_SECRET' )
				? trim( (string) DTB_VEEQO_WEBHOOK_SECRET )
				: '',
			'warehouse_id'       => defined( 'DTB_VEEQO_WAREHOUSE_ID' ) && (int) DTB_VEEQO_WAREHOUSE_ID > 0
				? (int) DTB_VEEQO_WAREHOUSE_ID
				: absint( $stored['warehouse_id'] ?? 0 ),
			'channel_id'         => defined( 'DTB_VEEQO_CHANNEL_ID' ) && (int) DTB_VEEQO_CHANNEL_ID > 0
				? (int) DTB_VEEQO_CHANNEL_ID
				: absint( $stored['channel_id'] ?? 0 ),
			'delivery_method_id' => defined( 'DTB_VEEQO_DELIVERY_METHOD_ID' ) && (int) DTB_VEEQO_DELIVERY_METHOD_ID > 0
				? (int) DTB_VEEQO_DELIVERY_METHOD_ID
				: absint( $stored['delivery_method_id'] ?? 0 ),
		];
	}
}

if ( ! function_exists( 'dtb_veeqo_refresh_credential_boundary' ) ) {
	/** Refresh the compatibility client's request-local configuration cache. */
	function dtb_veeqo_refresh_credential_boundary(): void {
		$GLOBALS['_dtb_veeqo_config'] = dtb_veeqo_boundary_config();
	}
}

dtb_veeqo_refresh_credential_boundary();
