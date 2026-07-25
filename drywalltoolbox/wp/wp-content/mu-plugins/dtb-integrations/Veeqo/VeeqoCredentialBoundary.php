<?php
declare(strict_types=1);

/**
 * Veeqo credential/configuration boundary.
 *
 * Credentials are resolved exclusively from server-side constants before the
 * historical compatibility client is loaded. Pre-populating its request-local
 * configuration cache prevents the compatibility helper from reading legacy
 * credential fields from WordPress options during bootstrap.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_veeqo_constant_config' ) ) {
	/**
	 * Build the request-local Veeqo configuration from server constants only.
	 *
	 * @return array{api_key:string,webhook_secret:string,warehouse_id:int,channel_id:int,delivery_method_id:int}
	 */
	function dtb_veeqo_constant_config(): array {
		return [
			'api_key'            => defined( 'DTB_VEEQO_API_KEY' )
				? trim( (string) DTB_VEEQO_API_KEY )
				: '',
			'webhook_secret'     => defined( 'DTB_VEEQO_WEBHOOK_SECRET' )
				? trim( (string) DTB_VEEQO_WEBHOOK_SECRET )
				: '',
			'warehouse_id'       => defined( 'DTB_VEEQO_WAREHOUSE_ID' )
				? max( 0, (int) DTB_VEEQO_WAREHOUSE_ID )
				: 0,
			'channel_id'         => defined( 'DTB_VEEQO_CHANNEL_ID' )
				? max( 0, (int) DTB_VEEQO_CHANNEL_ID )
				: 0,
			'delivery_method_id' => defined( 'DTB_VEEQO_DELIVERY_METHOD_ID' )
				? max( 0, (int) DTB_VEEQO_DELIVERY_METHOD_ID )
				: 0,
		];
	}
}

if ( ! function_exists( 'dtb_veeqo_refresh_credential_boundary' ) ) {
	/** Refresh the compatibility client's request-local configuration cache. */
	function dtb_veeqo_refresh_credential_boundary(): void {
		$GLOBALS['_dtb_veeqo_config'] = dtb_veeqo_constant_config();
	}
}

dtb_veeqo_refresh_credential_boundary();
