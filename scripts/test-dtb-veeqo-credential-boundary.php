<?php
declare(strict_types=1);

/**
 * Executable contract test for the Veeqo credential boundary.
 *
 * This test intentionally uses minimal WordPress stubs so it can run in CI
 * without bootstrapping WordPress or contacting Veeqo.
 */

define( 'ABSPATH', __DIR__ . '/' );

$GLOBALS['dtb_test_veeqo_settings'] = [
	'api_key'            => 'legacy-option-api-key',
	'webhook_secret'     => 'legacy-option-webhook-secret',
	'warehouse_id'       => 101,
	'channel_id'         => 202,
	'delivery_method_id' => 303,
];

if ( ! function_exists( 'get_option' ) ) {
	function get_option( string $name, $default = false ) {
		if ( 'woocommerce_dtb_veeqo_settings' !== $name ) {
			return $default;
		}
		return $GLOBALS['dtb_test_veeqo_settings'];
	}
}

if ( ! function_exists( 'absint' ) ) {
	function absint( $value ): int {
		return abs( (int) $value );
	}
}

function dtb_test_assert_same( $expected, $actual, string $label ): void {
	if ( $expected === $actual ) {
		return;
	}

	fwrite(
		STDERR,
		sprintf(
			"Veeqo credential boundary assertion failed: %s. Expected %s; received %s.%s",
			$label,
			var_export( $expected, true ),
			var_export( $actual, true ),
			PHP_EOL
		)
	);
	exit( 1 );
}

$boundary = dirname( __DIR__ ) . '/drywalltoolbox/wp/wp-content/mu-plugins/dtb-integrations/Veeqo/VeeqoCredentialBoundary.php';
if ( ! is_file( $boundary ) ) {
	fwrite( STDERR, "Veeqo credential boundary file is missing.\n" );
	exit( 1 );
}

require $boundary;

$config = (array) ( $GLOBALS['_dtb_veeqo_config'] ?? [] );
dtb_test_assert_same( '', $config['api_key'] ?? null, 'option-stored API key is ignored' );
dtb_test_assert_same( '', $config['webhook_secret'] ?? null, 'option-stored webhook secret is ignored' );
dtb_test_assert_same( 101, $config['warehouse_id'] ?? null, 'warehouse option fallback is preserved' );
dtb_test_assert_same( 202, $config['channel_id'] ?? null, 'channel option fallback is preserved' );
dtb_test_assert_same( 303, $config['delivery_method_id'] ?? null, 'delivery-method option fallback is preserved' );

define( 'DTB_VEEQO_API_KEY', 'server-api-key' );
define( 'DTB_VEEQO_WEBHOOK_SECRET', 'server-webhook-secret' );
define( 'DTB_VEEQO_WAREHOUSE_ID', 404 );
define( 'DTB_VEEQO_CHANNEL_ID', 505 );
define( 'DTB_VEEQO_DELIVERY_METHOD_ID', 606 );

dtb_veeqo_refresh_credential_boundary();
$config = (array) ( $GLOBALS['_dtb_veeqo_config'] ?? [] );
dtb_test_assert_same( 'server-api-key', $config['api_key'] ?? null, 'server API key becomes authority' );
dtb_test_assert_same( 'server-webhook-secret', $config['webhook_secret'] ?? null, 'server webhook secret becomes authority' );
dtb_test_assert_same( 404, $config['warehouse_id'] ?? null, 'warehouse constant overrides option' );
dtb_test_assert_same( 505, $config['channel_id'] ?? null, 'channel constant overrides option' );
dtb_test_assert_same( 606, $config['delivery_method_id'] ?? null, 'delivery-method constant overrides option' );

$GLOBALS['dtb_test_veeqo_settings']['api_key'] = 'rotated-option-api-key';
$GLOBALS['dtb_test_veeqo_settings']['webhook_secret'] = 'rotated-option-webhook-secret';
dtb_veeqo_refresh_credential_boundary();
$config = (array) ( $GLOBALS['_dtb_veeqo_config'] ?? [] );
dtb_test_assert_same( 'server-api-key', $config['api_key'] ?? null, 'option API key cannot override server authority after refresh' );
dtb_test_assert_same( 'server-webhook-secret', $config['webhook_secret'] ?? null, 'option webhook secret cannot override server authority after refresh' );

echo "Veeqo credential boundary contract passed.\n";
