<?php
/**
 * DTB Platform — System Manager "Integration Settings" tab
 *
 * The single home for every integration's credentials/config, replacing the
 * previous scattered state: QuickBooks/Stripe-restricted-key were
 * wp-config.php-only with no UI at all, and Veeqo's settings lived on the
 * generic WooCommerce -> Settings -> Integrations screen. Amazon and eBay
 * already had an encrypted storage backend (DTB_MarketplaceCredentialFacade)
 * but no UI had ever been built to write to it.
 *
 * Each card here writes through whatever storage that integration already
 * uses (see Rest/IntegrationSettingsController.php) -- this file only
 * renders the form and never invents new storage.
 *
 * Surfaced (without owning) from SystemManagerPage.php, the same pattern
 * already used for Release Management tabs (dtb-deployment/Admin/GitControlCenterTabs.php).
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Amazon/eBay marketplace channels are built (encrypted storage, save
 * handlers, cards) but held back from the initial launch — neither channel
 * is live yet, and surfacing settings for something not turned on invites
 * confusion. Flip DTB_MARKETPLACE_SETTINGS_ENABLED to true (wp-config.php
 * constant or the dtb_feature_enabled_DTB_MARKETPLACE_SETTINGS_ENABLED
 * filter) when Amazon/eBay are ready to launch — no other code changes
 * needed.
 */
function dtb_system_manager_render_integration_settings_tab(): void {
	dtb_integration_settings_render_quickbooks_card();
	dtb_integration_settings_render_veeqo_card();

	if ( dtb_feature_enabled( 'DTB_MARKETPLACE_SETTINGS_ENABLED', false ) ) {
		dtb_integration_settings_render_amazon_card();
		dtb_integration_settings_render_ebay_card();
	}

	dtb_integration_settings_render_script();
}

/**
 * @param string $value    Current stored value (plaintext).
 * @param bool   $is_secret Password-masked field; blank submit means "keep existing."
 */
function dtb_integration_settings_field( string $label, string $name, string $value, bool $is_secret = false, string $placeholder = '' ): string {
	$type = $is_secret ? 'password' : 'text';
	$val  = $is_secret ? '' : esc_attr( $value );
	$ph   = $is_secret
		? ( '' !== $value ? __( 'Already set — leave blank to keep', 'drywall-toolbox' ) : __( 'Not set', 'drywall-toolbox' ) )
		: esc_attr( $placeholder );

	return sprintf(
		'<label class="dtb-settings-field"><span>%s</span><input type="%s" name="%s" value="%s" placeholder="%s" autocomplete="off"></label>',
		esc_html( $label ),
		esc_attr( $type ),
		esc_attr( $name ),
		$val,
		esc_attr( $ph )
	);
}

function dtb_integration_settings_toggle( string $label, string $name, bool $checked ): string {
	return sprintf(
		'<label class="dtb-settings-field dtb-settings-field--toggle"><span>%s</span><input type="checkbox" name="%s" value="1" %s></label>',
		esc_html( $label ),
		esc_attr( $name ),
		checked( $checked, true, false )
	);
}

function dtb_integration_settings_card_shell( string $target, string $title, string $status_badge_html, string $fields_html, string $help_html = '' ): void {
	ob_start();
	?>
	<form class="dtb-settings-form" data-dtb-settings-target="<?php echo esc_attr( $target ); ?>">
		<div class="dtb-settings-form__status"><?php echo $status_badge_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
		<div class="dtb-settings-form__grid"><?php echo $fields_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
		<?php if ( '' !== $help_html ) : ?>
			<p class="description"><?php echo $help_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></p>
		<?php endif; ?>
		<div class="dtb-settings-form__actions">
			<button type="button" class="button button-primary" data-dtb-settings-save="<?php echo esc_attr( $target ); ?>"><?php esc_html_e( 'Save', 'drywall-toolbox' ); ?></button>
			<span class="dtb-settings-form__message" data-dtb-settings-message></span>
		</div>
	</form>
	<?php
	$body = ob_get_clean();
	echo dtb_admin_ui_card( $body, [ 'title' => $title ] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

// ── QuickBooks ───────────────────────────────────────────────────────────────

function dtb_integration_settings_render_quickbooks_card(): void {
	$cfg      = function_exists( 'dtb_qbo_config' ) ? dtb_qbo_config() : [ 'client_id' => '', 'client_secret' => '', 'environment' => 'production', 'realm_id' => '' ];
	$stored   = function_exists( 'dtb_qbo_settings_option' ) ? dtb_qbo_settings_option() : [];
	$enabled  = function_exists( 'dtb_qbo_enabled' ) && dtb_qbo_enabled();
	$stripe_set = '' !== ( function_exists( 'dtb_qbo_stripe_restricted_key' ) ? dtb_qbo_stripe_restricted_key() : '' );

	$badge = dtb_admin_ui_badge(
		$enabled ? __( 'Connected', 'drywall-toolbox' ) : __( 'Not Connected', 'drywall-toolbox' ),
		$enabled ? 'success' : 'warning'
	);
	$badge .= ' ' . dtb_admin_ui_badge(
		'sandbox' === $cfg['environment'] ? __( 'Sandbox', 'drywall-toolbox' ) : __( 'Production', 'drywall-toolbox' ),
		'sandbox' === $cfg['environment'] ? 'warning' : 'primary'
	);
	$badge .= ' ' . dtb_admin_ui_badge(
		$stripe_set ? __( 'Settlement Key Set', 'drywall-toolbox' ) : __( 'Settlement Key Missing', 'drywall-toolbox' ),
		$stripe_set ? 'success' : 'danger'
	);

	$fields  = dtb_integration_settings_field( __( 'Client ID', 'drywall-toolbox' ), 'client_id', (string) $cfg['client_id'] );
	$fields .= dtb_integration_settings_field( __( 'Client Secret', 'drywall-toolbox' ), 'client_secret', (string) $cfg['client_secret'], true );
	$fields .= sprintf(
		'<label class="dtb-settings-field"><span>%s</span><select name="environment"><option value="sandbox" %s>%s</option><option value="production" %s>%s</option></select></label>',
		esc_html__( 'Environment', 'drywall-toolbox' ),
		selected( $cfg['environment'], 'sandbox', false ),
		esc_html__( 'Sandbox', 'drywall-toolbox' ),
		selected( $cfg['environment'], 'production', false ),
		esc_html__( 'Production', 'drywall-toolbox' )
	);
	$fields .= dtb_integration_settings_field( __( 'Sandbox Webhook Verifier Token', 'drywall-toolbox' ), 'sandbox_webhook_verifier_token', (string) ( $stored['sandbox_webhook_verifier_token'] ?? '' ), true );
	$fields .= dtb_integration_settings_field( __( 'Production Webhook Verifier Token', 'drywall-toolbox' ), 'production_webhook_verifier_token', (string) ( $stored['production_webhook_verifier_token'] ?? '' ), true );
	$fields .= dtb_integration_settings_field( __( 'Stripe Restricted Reporting Key', 'drywall-toolbox' ), 'stripe_restricted_key', (string) ( $stored['stripe_restricted_key'] ?? '' ), true );

	$help = sprintf(
		/* translators: %s: realm ID or em dash */
		esc_html__( 'Realm ID (set automatically after Connect, via the Overview tab): %s. Any field left blank here keeps its current value.', 'drywall-toolbox' ),
		'<code>' . esc_html( '' !== $cfg['realm_id'] ? $cfg['realm_id'] : '—' ) . '</code>'
	);

	dtb_integration_settings_card_shell( 'quickbooks', __( 'QuickBooks', 'drywall-toolbox' ), $badge, $fields, $help );
}

// ── Veeqo ────────────────────────────────────────────────────────────────────

function dtb_integration_settings_render_veeqo_card(): void {
	$stored  = (array) get_option( 'woocommerce_dtb_veeqo_settings', [] );
	$enabled = function_exists( 'dtb_veeqo_enabled' ) && dtb_veeqo_enabled();

	$badge = dtb_admin_ui_badge(
		$enabled ? __( 'Connected', 'drywall-toolbox' ) : __( 'Not Connected', 'drywall-toolbox' ),
		$enabled ? 'success' : 'warning'
	);

	$fields  = dtb_integration_settings_field( __( 'API Key', 'drywall-toolbox' ), 'api_key', (string) ( $stored['api_key'] ?? '' ), true );
	$fields .= dtb_integration_settings_field( __( 'Webhook Secret', 'drywall-toolbox' ), 'webhook_secret', (string) ( $stored['webhook_secret'] ?? '' ), true );
	$fields .= dtb_integration_settings_field( __( 'Delivery Method ID', 'drywall-toolbox' ), 'delivery_method_id', (string) ( $stored['delivery_method_id'] ?? '' ) );

	$help = sprintf(
		/* translators: 1: channel ID, 2: warehouse ID */
		esc_html__( 'Channel ID: %1$s — Warehouse ID: %2$s (both auto-discovered from the API on save). Any field left blank here keeps its current value.', 'drywall-toolbox' ),
		'<code>' . esc_html( (string) ( $stored['channel_id'] ?? '—' ) ) . '</code>',
		'<code>' . esc_html( (string) ( $stored['warehouse_id'] ?? '—' ) ) . '</code>'
	);

	dtb_integration_settings_card_shell( 'veeqo', __( 'Veeqo', 'drywall-toolbox' ), $badge, $fields, $help );
}

// ── Amazon ───────────────────────────────────────────────────────────────────

function dtb_integration_settings_render_amazon_card(): void {
	$cfg      = class_exists( 'DTB_AmazonConfig' ) ? DTB_AmazonConfig::get() : [];
	$enabled  = class_exists( 'DTB_AmazonConfig' ) && DTB_AmazonConfig::is_configured();

	$badge = dtb_admin_ui_badge(
		$enabled ? __( 'Configured', 'drywall-toolbox' ) : __( 'Not Configured', 'drywall-toolbox' ),
		$enabled ? 'success' : 'warning'
	);

	$fields  = dtb_integration_settings_field( __( 'LWA Client ID', 'drywall-toolbox' ), 'client_id', (string) ( $cfg['client_id'] ?? '' ) );
	$fields .= dtb_integration_settings_field( __( 'LWA Client Secret', 'drywall-toolbox' ), 'client_secret', (string) ( $cfg['client_secret'] ?? '' ), true );
	$fields .= dtb_integration_settings_field( __( 'LWA Refresh Token', 'drywall-toolbox' ), 'refresh_token', (string) ( $cfg['refresh_token'] ?? '' ), true );
	$fields .= dtb_integration_settings_field( __( 'Marketplace ID', 'drywall-toolbox' ), 'marketplace_id', (string) ( $cfg['marketplace_id'] ?? '' ), false, 'ATVPDKIKX0DER' );
	$fields .= dtb_integration_settings_field( __( 'Seller ID', 'drywall-toolbox' ), 'seller_id', (string) ( $cfg['seller_id'] ?? '' ) );
	$fields .= dtb_integration_settings_field( __( 'Notification Endpoint', 'drywall-toolbox' ), 'notification_endpoint', (string) ( $cfg['notification_endpoint'] ?? '' ) );
	$fields .= dtb_integration_settings_toggle( __( 'Use Sandbox', 'drywall-toolbox' ), 'sandbox', ! empty( $cfg['sandbox'] ) );

	$help = esc_html__( 'There is no in-app "Connect" flow for Amazon yet — obtain the refresh token via Seller Central\'s own authorization consent page, then paste it here. Any secret field left blank keeps its current value.', 'drywall-toolbox' );

	dtb_integration_settings_card_shell( 'amazon', __( 'Amazon', 'drywall-toolbox' ), $badge, $fields, $help );
}

// ── eBay ─────────────────────────────────────────────────────────────────────

function dtb_integration_settings_render_ebay_card(): void {
	$cfg           = class_exists( 'DTB_EbayConfig' ) ? DTB_EbayConfig::get() : [];
	$enabled       = class_exists( 'DTB_EbayConfig' ) && DTB_EbayConfig::is_configured();
	$has_refresh   = class_exists( 'DTB_EbayOAuthTokenService' ) && DTB_EbayOAuthTokenService::has_refresh_token();

	$badge = dtb_admin_ui_badge(
		$enabled ? __( 'Configured', 'drywall-toolbox' ) : __( 'Not Configured', 'drywall-toolbox' ),
		$enabled ? 'success' : 'warning'
	);
	$badge .= ' ' . dtb_admin_ui_badge(
		$has_refresh ? __( 'Refresh Token Set', 'drywall-toolbox' ) : __( 'Refresh Token Missing', 'drywall-toolbox' ),
		$has_refresh ? 'success' : 'danger'
	);

	$fields  = dtb_integration_settings_field( __( 'App ID (Client ID)', 'drywall-toolbox' ), 'client_id', (string) ( $cfg['client_id'] ?? '' ) );
	$fields .= dtb_integration_settings_field( __( 'Cert ID (Client Secret)', 'drywall-toolbox' ), 'client_secret', (string) ( $cfg['client_secret'] ?? '' ), true );
	$fields .= dtb_integration_settings_field( __( 'RuName (Redirect URI)', 'drywall-toolbox' ), 'redirect_uri', (string) ( $cfg['redirect_uri'] ?? '' ) );
	$fields .= dtb_integration_settings_field( __( 'Marketplace ID', 'drywall-toolbox' ), 'marketplace_id', (string) ( $cfg['marketplace_id'] ?? 'EBAY_US' ) );
	$fields .= dtb_integration_settings_field( __( 'Deletion Webhook Verify Token', 'drywall-toolbox' ), 'deletion_verify_token', (string) ( $cfg['deletion_verify_token'] ?? '' ), true );
	$fields .= dtb_integration_settings_field( __( 'Refresh Token', 'drywall-toolbox' ), 'refresh_token', '', true, $has_refresh ? __( 'Already set — leave blank to keep', 'drywall-toolbox' ) : __( 'Not set', 'drywall-toolbox' ) );
	$fields .= dtb_integration_settings_toggle( __( 'Use Sandbox', 'drywall-toolbox' ), 'sandbox', ! empty( $cfg['sandbox'] ) );

	$help = esc_html__( 'There is no in-app "Connect" flow for eBay yet — obtain the refresh token via eBay\'s own OAuth consent page using the RuName above, then paste it here. Any secret field left blank keeps its current value.', 'drywall-toolbox' );

	dtb_integration_settings_card_shell( 'ebay', __( 'eBay', 'drywall-toolbox' ), $badge, $fields, $help );
}

// ── Submit handling ──────────────────────────────────────────────────────────

/**
 * Delegated submit handler — this tab lives inside System Manager's
 * auto-refreshing live region, so direct element bindings would go stale on
 * every poll; a delegated `document` listener survives DOM replacement, the
 * same reasoning documented in dtb_deployment_center_render_script().
 */
function dtb_integration_settings_render_script(): void {
	static $printed = false;
	if ( $printed ) {
		return;
	}
	$printed = true;

	$i18n = [
		'saving' => __( 'Saving…', 'drywall-toolbox' ),
		'saveFailed' => __( 'Save failed.', 'drywall-toolbox' ),
	];
	?>
	<script>
	( function () {
		var i18n = <?php echo wp_json_encode( $i18n ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>;

		document.addEventListener( 'click', function ( e ) {
			var btn = e.target.closest( '[data-dtb-settings-save]' );
			if ( ! btn ) {
				return;
			}

			var target = btn.getAttribute( 'data-dtb-settings-save' );
			var form   = btn.closest( '[data-dtb-settings-target]' );
			if ( ! form ) {
				return;
			}

			var messageEl = form.querySelector( '[data-dtb-settings-message]' );
			var fields    = {};
			form.querySelectorAll( '[name]' ).forEach( function ( input ) {
				fields[ input.name ] = input.type === 'checkbox' ? input.checked : input.value;
			} );

			btn.disabled = true;
			if ( messageEl ) messageEl.textContent = i18n.saving;

			window.DtbAdmin.apiFetch( '/dtb/v1/admin/system/integration-settings', {
				method: 'POST',
				body: JSON.stringify( { target: target, fields: fields } ),
			} ).then( function ( data ) {
				if ( messageEl ) messageEl.textContent = data.message || 'Saved.';
				form.querySelectorAll( 'input[type="password"]' ).forEach( function ( input ) {
					input.value = '';
				} );
			} ).catch( function ( err ) {
				if ( messageEl ) messageEl.textContent = ( err && err.message ) || i18n.saveFailed;
			} ).finally( function () {
				btn.disabled = false;
			} );
		} );
	} )();
	</script>
	<?php
}
