<?php
/**
 * DTB wp-admin asset ownership policy.
 *
 * BrikPanel owns global wp-admin chrome and theme presentation. DTB owns the
 * shared component system and each registered module owns only its page-scoped
 * component assets. This policy prevents broad source-based stylesheet removal,
 * preserves declared assets, and emits redacted diagnostics for missing files.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// AdminAssets.php historically removed every DTB MU-plugin stylesheet. Remove
// that broad callback after it has been registered and replace it with a bounded
// allowlisted policy at the same final enqueue priority.
remove_action( 'admin_enqueue_scripts', 'dtb_admin_remove_custom_styles', PHP_INT_MAX );
add_action( 'admin_enqueue_scripts', 'dtb_admin_asset_policy_enforce', PHP_INT_MAX );
add_filter( 'admin_body_class', 'dtb_admin_asset_policy_body_class' );

/**
 * Return whether the current request is a registered or migrated DTB admin page.
 */
function dtb_admin_asset_policy_is_dtb_screen(): bool {
	$page_slug = sanitize_key( (string) ( $_GET['page'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return (bool) dtb_current_page_meta() || ( '' !== $page_slug && str_starts_with( $page_slug, 'dtb-' ) );
}

/**
 * Explicit obsolete global-theme handles that may be removed safely.
 *
 * This list must contain handles only. Source-URL pattern matching is forbidden
 * because module component styles live under the same MU-plugin URL namespace.
 *
 * @return string[]
 */
function dtb_admin_asset_policy_obsolete_style_handles(): array {
	$handles = [
		'dtb-admin-legacy-theme',
		'dtb-admin-v1-theme',
		'dtb-admin-global-shell',
	];

	/**
	 * Filter obsolete DTB global-theme handles.
	 *
	 * Callers must supply exact handles; wildcard and source URL rules are not
	 * accepted by the enforcement function.
	 *
	 * @param string[] $handles Obsolete stylesheet handles.
	 */
	return array_values( array_unique( array_filter( array_map( 'sanitize_key', (array) apply_filters( 'dtb_admin_obsolete_style_handles', $handles ) ) ) ) );
}

/**
 * Enforce the BrikPanel → DTB shared components → module components cascade.
 */
function dtb_admin_asset_policy_enforce(): void {
	if ( ! dtb_admin_asset_policy_is_dtb_screen() ) {
		return;
	}

	foreach ( dtb_admin_asset_policy_obsolete_style_handles() as $handle ) {
		if ( wp_style_is( $handle, 'enqueued' ) || wp_style_is( $handle, 'registered' ) ) {
			wp_dequeue_style( $handle );
			wp_deregister_style( $handle );
		}
	}

	$required_styles = [ 'dtb-admin' ];
	$page_meta       = dtb_current_page_meta();

	if ( is_array( $page_meta ) ) {
		foreach ( (array) ( $page_meta['assets']['css'] ?? [] ) as $asset ) {
			$handle = sanitize_key( (string) ( $asset['id'] ?? '' ) );
			if ( '' !== $handle ) {
				$required_styles[] = $handle;
			}
		}
	}

	$required_styles = array_values( array_unique( $required_styles ) );
	$missing         = [];

	foreach ( $required_styles as $handle ) {
		if ( wp_style_is( $handle, 'registered' ) && ! wp_style_is( $handle, 'enqueued' ) ) {
			wp_enqueue_style( $handle );
		}

		if ( ! wp_style_is( $handle, 'registered' ) ) {
			$missing[] = $handle;
		}
	}

	$bridge_file = __DIR__ . '/assets/dtb-brikpanel-bridge.css';
	if ( is_readable( $bridge_file ) ) {
		$dependencies = array_values( array_filter( $required_styles, static fn( string $handle ): bool => wp_style_is( $handle, 'registered' ) ) );
		wp_enqueue_style(
			'dtb-brikpanel-bridge',
			plugin_dir_url( __FILE__ ) . 'assets/dtb-brikpanel-bridge.css',
			$dependencies,
			(string) filemtime( $bridge_file )
		);
	} else {
		$missing[] = 'dtb-brikpanel-bridge';
	}

	$GLOBALS['dtb_admin_asset_diagnostics'] = [
		'page'          => sanitize_key( (string) ( $page_meta['slug'] ?? ( $_GET['page'] ?? '' ) ) ), // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		'declared'      => $required_styles,
		'missing'       => array_values( array_unique( $missing ) ),
		'bridge_loaded' => wp_style_is( 'dtb-brikpanel-bridge', 'enqueued' ),
	];

	if ( $missing && function_exists( 'dtb_log' ) ) {
		dtb_log(
			'warning',
			'DTB admin asset declaration is incomplete.',
			[
				'page'            => $GLOBALS['dtb_admin_asset_diagnostics']['page'],
				'missing_handles' => $GLOBALS['dtb_admin_asset_diagnostics']['missing'],
			]
		);
	}
}

/**
 * Add stable ownership classes without styling global BrikPanel chrome.
 */
function dtb_admin_asset_policy_body_class( string $classes ): string {
	if ( dtb_admin_asset_policy_is_dtb_screen() ) {
		$classes .= ' dtb-brikpanel-components';
	}

	return $classes;
}
