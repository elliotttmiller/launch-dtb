<?php
/**
 * Plugin Name: DTB Temporary Veeqo Shipment Identity Diagnostic
 * Description: Read-only, operator-only diagnostic for identifying stable Veeqo shipment/allocation/package identifiers.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 *
 * TEMPORARY TOOL:
 * Upload to wp-content/mu-plugins/, use it for controlled inspection, then delete it.
 *
 * @package drywalltoolbox
 */

defined( 'ABSPATH' ) || exit;

const DTB_VEEQO_IDENTITY_DIAGNOSTIC_SLUG   = 'dtb-veeqo-shipment-identity-diagnostic';
const DTB_VEEQO_IDENTITY_DIAGNOSTIC_ACTION = 'dtb_veeqo_identity_diagnostic_run';
const DTB_VEEQO_IDENTITY_DIAGNOSTIC_NONCE  = 'dtb_veeqo_identity_diagnostic_nonce';

function dtb_veeqo_identity_diagnostic_register_page(): void {
	if ( current_user_can( 'manage_woocommerce' ) ) {
		add_management_page(
			'Veeqo Shipment Identity Diagnostic',
			'Veeqo Shipment Identity',
			'manage_woocommerce',
			DTB_VEEQO_IDENTITY_DIAGNOSTIC_SLUG,
			'dtb_veeqo_identity_diagnostic_render_page'
		);
	}
}
add_action( 'admin_menu', 'dtb_veeqo_identity_diagnostic_register_page', 99 );

function dtb_veeqo_identity_diagnostic_render_page(): void {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		wp_die( esc_html__( 'You are not authorized to use this tool.', 'drywalltoolbox' ), 403 );
	}

	$result   = null;
	$order_id = 0;

	if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) ) {
		check_admin_referer( DTB_VEEQO_IDENTITY_DIAGNOSTIC_ACTION, DTB_VEEQO_IDENTITY_DIAGNOSTIC_NONCE );
		$order_id = isset( $_POST['order_id'] ) ? absint( wp_unslash( $_POST['order_id'] ) ) : 0;
		$result   = dtb_veeqo_identity_diagnostic_run( $order_id );
	}
	?>
	<div class="wrap">
		<h1><?php echo esc_html__( 'Veeqo Shipment Identity Diagnostic', 'drywalltoolbox' ); ?></h1>
		<div class="notice notice-warning inline">
			<p><strong><?php echo esc_html__( 'Temporary diagnostic only.', 'drywalltoolbox' ); ?></strong> <?php echo esc_html__( 'Delete this MU-plugin immediately after the stable Veeqo shipment identity has been confirmed.', 'drywalltoolbox' ); ?></p>
		</div>
		<p><?php echo esc_html__( 'Enter a WooCommerce order ID that is already correlated to Veeqo and has shipped. The tool makes one read-only Veeqo API request and displays only sanitized shipment-identity candidates.', 'drywalltoolbox' ); ?></p>
		<form method="post" action="">
			<?php wp_nonce_field( DTB_VEEQO_IDENTITY_DIAGNOSTIC_ACTION, DTB_VEEQO_IDENTITY_DIAGNOSTIC_NONCE ); ?>
			<table class="form-table" role="presentation"><tr><th scope="row"><label for="dtb-veeqo-diagnostic-order-id"><?php echo esc_html__( 'WooCommerce order ID', 'drywalltoolbox' ); ?></label></th><td><input id="dtb-veeqo-diagnostic-order-id" name="order_id" type="number" min="1" step="1" required value="<?php echo esc_attr( $order_id > 0 ? (string) $order_id : '' ); ?>" class="regular-text" autocomplete="off" /></td></tr></table>
			<?php submit_button( esc_html__( 'Inspect shipment identity candidates', 'drywalltoolbox' ), 'primary', 'submit', false ); ?>
		</form>
		<?php if ( is_array( $result ) ) : ?><hr /><?php dtb_veeqo_identity_diagnostic_render_result( $result ); ?><?php endif; ?>
	</div>
	<?php
}

function dtb_veeqo_identity_diagnostic_run( int $order_id ): array {
	if ( $order_id <= 0 ) {
		return [ 'ok' => false, 'message' => 'Enter a valid WooCommerce order ID.' ];
	}
	if ( ! function_exists( 'wc_get_order' ) ) {
		return [ 'ok' => false, 'message' => 'WooCommerce is unavailable.' ];
	}
	if ( ! function_exists( 'dtb_veeqo_request' ) ) {
		return [ 'ok' => false, 'message' => 'The DTB Veeqo client is unavailable. Confirm the normal DTB MU-plugin loader is active.' ];
	}

	$order = wc_get_order( $order_id );
	if ( ! $order instanceof WC_Order ) {
		return [ 'ok' => false, 'message' => 'WooCommerce order not found.' ];
	}

	$veeqo_order_id = absint( $order->get_meta( '_dtb_veeqo_order_id', true ) );
	if ( $veeqo_order_id <= 0 ) {
		$veeqo_order_id = absint( $order->get_meta( '_veeqo_order_id', true ) );
	}
	if ( $veeqo_order_id <= 0 ) {
		return [ 'ok' => false, 'message' => 'This WooCommerce order has no correlated Veeqo order ID in _dtb_veeqo_order_id or _veeqo_order_id.' ];
	}

	$response = dtb_veeqo_request( 'GET', '/orders/' . $veeqo_order_id );
	if ( empty( $response['ok'] ) ) {
		return [
			'ok'             => false,
			'message'        => 'The Veeqo order request failed: ' . sanitize_text_field( (string) ( $response['error'] ?? 'Unknown error.' ) ),
			'order_id'       => $order_id,
			'veeqo_order_id' => $veeqo_order_id,
		];
	}

	$payload = $response['data'] ?? null;
	if ( ! is_array( $payload ) ) {
		return [ 'ok' => false, 'message' => 'Veeqo returned an unexpected non-object response.', 'order_id' => $order_id, 'veeqo_order_id' => $veeqo_order_id ];
	}

	$candidates = [];
	dtb_veeqo_identity_diagnostic_scan( $payload, '$', $candidates, 0 );
	usort( $candidates, static function ( array $left, array $right ): int {
		$priority = [ 'shipment_identity' => 10, 'allocation_identity' => 20, 'package_identity' => 30, 'other_identity' => 40, 'tracking_reference' => 50, 'status_or_time' => 60 ];
		$lp = $priority[ $left['category'] ] ?? 999;
		$rp = $priority[ $right['category'] ] ?? 999;
		return $lp === $rp ? strcmp( (string) $left['path'], (string) $right['path'] ) : $lp <=> $rp;
	} );

	return [
		'ok'              => true,
		'message'         => empty( $candidates ) ? 'No identity candidate fields were found in the allowlisted shipment-related structures.' : 'Sanitized candidate fields found.',
		'order_id'        => $order_id,
		'veeqo_order_id'  => $veeqo_order_id,
		'candidate_count' => count( $candidates ),
		'candidates'      => $candidates,
	];
}

function dtb_veeqo_identity_diagnostic_scan( $value, string $path, array &$candidates, int $depth ): void {
	if ( $depth > 12 || ! is_array( $value ) ) {
		return;
	}
	foreach ( $value as $key => $child ) {
		$key_string = (string) $key;
		$child_path = is_int( $key ) ? $path . '[' . $key . ']' : $path . '.' . $key_string;
		if ( is_array( $child ) ) {
			dtb_veeqo_identity_diagnostic_scan( $child, $child_path, $candidates, $depth + 1 );
			continue;
		}
		$category = dtb_veeqo_identity_diagnostic_classify_field( $key_string, $path );
		if ( null === $category ) {
			continue;
		}
		$sanitized = dtb_veeqo_identity_diagnostic_sanitize_value( $child, $category );
		if ( null === $sanitized ) {
			continue;
		}
		$candidates[] = [ 'path' => $child_path, 'parent_path' => $path, 'field' => sanitize_key( $key_string ), 'category' => $category, 'type' => gettype( $child ), 'value' => $sanitized ];
	}
}

function dtb_veeqo_identity_diagnostic_classify_field( string $field, string $parent_path ): ?string {
	$field_lower  = strtolower( $field );
	$parent_lower = strtolower( $parent_path );
	if ( in_array( $field_lower, [ 'tracking_number', 'tracking_code', 'tracking_reference', 'tracking_url' ], true ) ) {
		return 'tracking_reference';
	}
	if ( in_array( $field_lower, [ 'status', 'state', 'created_at', 'updated_at', 'shipped_at', 'fulfilled_at', 'dispatched_at' ], true ) && preg_match( '/shipment|allocation|package|parcel|consignment|fulfillment|delivery|tracking/i', $parent_lower ) ) {
		return 'status_or_time';
	}
	if ( ! preg_match( '/(^|_)(id|uuid|guid|reference|reference_id)$/i', $field_lower ) && ! preg_match( '/(shipment|allocation|package|parcel|consignment|fulfillment|delivery)(_?id|_?uuid|_?guid|_?reference)?$/i', $field_lower ) ) {
		return null;
	}
	$context = $field_lower . ' ' . $parent_lower;
	if ( preg_match( '/shipment|fulfillment|consignment/', $context ) ) {
		return 'shipment_identity';
	}
	if ( preg_match( '/allocation/', $context ) ) {
		return 'allocation_identity';
	}
	if ( preg_match( '/package|parcel/', $context ) ) {
		return 'package_identity';
	}
	if ( preg_match( '/delivery/', $context ) ) {
		return 'other_identity';
	}
	return null;
}

function dtb_veeqo_identity_diagnostic_sanitize_value( $value, string $category ): ?string {
	if ( is_bool( $value ) ) {
		return $value ? 'true' : 'false';
	}
	if ( is_int( $value ) || is_float( $value ) ) {
		return (string) $value;
	}
	if ( ! is_string( $value ) ) {
		return null;
	}
	$value = trim( $value );
	if ( '' === $value ) {
		return null;
	}
	if ( 'tracking_reference' === $category ) {
		if ( false !== filter_var( $value, FILTER_VALIDATE_URL ) ) {
			$parts = wp_parse_url( $value );
			$host  = isset( $parts['host'] ) ? sanitize_text_field( (string) $parts['host'] ) : 'tracking URL';
			return '[redacted URL on ' . $host . ']';
		}
		return dtb_veeqo_identity_diagnostic_mask_reference( $value );
	}
	return mb_substr( sanitize_text_field( $value ), 0, 160 );
}

function dtb_veeqo_identity_diagnostic_mask_reference( string $value ): string {
	$value  = sanitize_text_field( $value );
	$length = strlen( $value );
	if ( $length <= 6 ) {
		return str_repeat( '•', $length );
	}
	return substr( $value, 0, 3 ) . str_repeat( '•', max( 4, $length - 7 ) ) . substr( $value, -4 );
}

function dtb_veeqo_identity_diagnostic_render_result( array $result ): void {
	$notice_class = ! empty( $result['ok'] ) ? 'notice-success' : 'notice-error';
	?>
	<div class="notice <?php echo esc_attr( $notice_class ); ?> inline"><p><?php echo esc_html( (string) ( $result['message'] ?? '' ) ); ?></p></div>
	<?php
	if ( empty( $result['ok'] ) ) {
		return;
	}
	?>
	<h2><?php echo esc_html__( 'Inspection summary', 'drywalltoolbox' ); ?></h2>
	<table class="widefat striped" style="max-width:900px"><tbody>
	<tr><th><?php echo esc_html__( 'WooCommerce order ID', 'drywalltoolbox' ); ?></th><td><?php echo esc_html( (string) ( $result['order_id'] ?? '' ) ); ?></td></tr>
	<tr><th><?php echo esc_html__( 'Veeqo order ID', 'drywalltoolbox' ); ?></th><td><?php echo esc_html( (string) ( $result['veeqo_order_id'] ?? '' ) ); ?></td></tr>
	<tr><th><?php echo esc_html__( 'Candidate fields', 'drywalltoolbox' ); ?></th><td><?php echo esc_html( (string) ( $result['candidate_count'] ?? 0 ) ); ?></td></tr>
	</tbody></table>
	<p><strong><?php echo esc_html__( 'Important:', 'drywalltoolbox' ); ?></strong> <?php echo esc_html__( 'Tracking numbers and tracking URLs are shown only as redacted references. They are not eligible as the immutable native Fulfillment identity.', 'drywalltoolbox' ); ?></p>
	<h2><?php echo esc_html__( 'Sanitized candidate fields', 'drywalltoolbox' ); ?></h2>
	<?php if ( empty( $result['candidates'] ) || ! is_array( $result['candidates'] ) ) : ?><p><?php echo esc_html__( 'No candidates found.', 'drywalltoolbox' ); ?></p><?php return; endif; ?>
	<table class="widefat striped"><thead><tr><th><?php echo esc_html__( 'Category', 'drywalltoolbox' ); ?></th><th><?php echo esc_html__( 'JSON path', 'drywalltoolbox' ); ?></th><th><?php echo esc_html__( 'Type', 'drywalltoolbox' ); ?></th><th><?php echo esc_html__( 'Sanitized value', 'drywalltoolbox' ); ?></th></tr></thead><tbody>
	<?php foreach ( $result['candidates'] as $candidate ) : ?>
	<tr><td><code><?php echo esc_html( (string) ( $candidate['category'] ?? '' ) ); ?></code></td><td><code><?php echo esc_html( (string) ( $candidate['path'] ?? '' ) ); ?></code></td><td><?php echo esc_html( (string) ( $candidate['type'] ?? '' ) ); ?></td><td><code><?php echo esc_html( (string) ( $candidate['value'] ?? '' ) ); ?></code></td></tr>
	<?php endforeach; ?>
	</tbody></table>
	<h2><?php echo esc_html__( 'Selection criteria', 'drywalltoolbox' ); ?></h2>
	<p><?php echo esc_html__( 'A valid immutable shipment identity must remain unchanged when tracking or carrier data changes, must differ between distinct shipments/packages, must be present on repeated observations, and must not collide across orders.', 'drywalltoolbox' ); ?></p>
	<?php
}
