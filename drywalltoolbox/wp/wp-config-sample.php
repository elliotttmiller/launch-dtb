<?php

/**
 * Drywall Toolbox production WordPress configuration template.
 *
 * Copy this file to the server-owned wp-config.php and replace every
 * CHANGE_ME value there. Never commit the populated runtime file.
 *
 * WordPress core lives physically under /wp while the public site, wp-admin,
 * authentication entry points, and REST API are exposed from the root origin.
 */

define( 'WP_CACHE', true ); // Managed by SiteGround Speed Optimizer.

/**
 * Database.
 */
define( 'DB_NAME', 'CHANGE_ME_DATABASE_NAME' );
define( 'DB_USER', 'CHANGE_ME_DATABASE_USER' );
define( 'DB_PASSWORD', 'CHANGE_ME_DATABASE_PASSWORD' );
define( 'DB_HOST', 'localhost' );

define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

/**
 * Authentication keys and salts.
 *
 * Generate unique production values at:
 * https://api.wordpress.org/secret-key/1.1/salt/
 */
define( 'AUTH_KEY',         'CHANGE_ME_UNIQUE_PHRASE' );
define( 'SECURE_AUTH_KEY',  'CHANGE_ME_UNIQUE_PHRASE' );
define( 'LOGGED_IN_KEY',    'CHANGE_ME_UNIQUE_PHRASE' );
define( 'NONCE_KEY',        'CHANGE_ME_UNIQUE_PHRASE' );
define( 'AUTH_SALT',        'CHANGE_ME_UNIQUE_PHRASE' );
define( 'SECURE_AUTH_SALT', 'CHANGE_ME_UNIQUE_PHRASE' );
define( 'LOGGED_IN_SALT',   'CHANGE_ME_UNIQUE_PHRASE' );
define( 'NONCE_SALT',       'CHANGE_ME_UNIQUE_PHRASE' );

define( 'WP_CACHE_KEY_SALT', 'CHANGE_ME_UNIQUE_CACHE_SALT' );

/**
 * Database table prefix.
 *
 * This must match the installed database. Changing it on an existing site
 * disconnects WordPress from its current tables.
 */
$table_prefix = 'kf5_';

/**
 * Drywall Toolbox SiteGround production topology.
 */
define( 'WP_HOME', 'https://drywalltoolbox.com' );
define( 'WP_SITEURL', 'https://drywalltoolbox.com/wp' );
define( 'DRYWALL_ALLOWED_ORIGIN', 'https://drywalltoolbox.com' );

/**
 * DTB application security.
 *
 * Generate a unique 64-character hexadecimal JWT secret server-side. Keep
 * external-order write access undefined so WooCommerce REST order creation
 * remains blocked outside the native checkout/order pipeline.
 */
define( 'DRYWALL_JWT_SECRET', 'CHANGE_ME_64_CHARACTER_HEX_JWT_SECRET' );
define( 'DTB_ADMIN_EMAIL', 'CHANGE_ME_OPERATIONAL_ADMIN_EMAIL' );

/**
 * The production frontend and WordPress aliases share the root cookie path.
 * Do not define COOKIE_DOMAIN without a reviewed multi-subdomain requirement.
 */
define( 'COOKIEPATH', '/' );
define( 'SITECOOKIEPATH', '/' );
define( 'ADMIN_COOKIE_PATH', '/' );

/**
 * Existing narrowly scoped topology compatibility switches.
 */
define( 'DTB_ENABLE_WOO_ADMIN_REST_NONCE_COMPAT', true );
define( 'DTB_ENABLE_REST_CORS', true );
define( 'DTB_RESTRICT_USER_ENDPOINTS', true );
define( 'DTB_WC_PUBLIC_READ', true );
define( 'DTB_ENABLE_NONCE_REFRESH', true );
define( 'DTB_SECURITY_LOGGING', true );
define( 'DTB_ENABLE_PROXY_RATE_LIMIT', true );
define( 'DTB_ENABLE_LOGIN_RATE_LIMIT', true );
define( 'DTB_ENABLE_CSP', false );
define( 'DTB_ENABLE_ADMIN_AUTH_DIAGNOSTICS', false );
define( 'DTB_ENABLE_ADMIN_LOGIN_TRACE', false );
define( 'DTB_ENABLE_ADMIN_REST_LOGGING', false );
define( 'DTB_ENABLE_ADMIN_SMOKE_ROUTE', false );

/**
 * HTTPS and production hardening.
 */
define( 'FORCE_SSL_ADMIN', true );
define( 'DISALLOW_FILE_EDIT', true );
define( 'WP_ENVIRONMENT_TYPE', 'production' );
define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );

/**
 * Veeqo integration.
 *
 * Keep resource IDs at 0 until each live identifier is verified. Keep webhook
 * verification disabled unless Veeqo's live signing contract is verified.
 */
// Define DTB_VEEQO_API_KEY only after obtaining a rotated production key.
// Let verified resource IDs persist through the Veeqo settings workflow rather
// than defining guessed IDs here.
define( 'DTB_VEEQO_ENABLE_VERIFIED_WEBHOOKS', false );
define( 'DTB_VEEQO_DEBUG', false );

/**
 * Production-safe debug defaults.
 *
 * Enable WP_DEBUG and WP_DEBUG_LOG only for a bounded diagnostic window.
 */
define( 'WP_DEBUG', false );
define( 'WP_DEBUG_DISPLAY', false );
define( 'WP_DEBUG_LOG', false );
define( 'SCRIPT_DEBUG', false );

@ini_set( 'display_errors', '0' );

/**
 * QuickBooks Online sandbox integration.
 */
// QuickBooks remains unconfigured until a reviewed production or sandbox
// connection is intentionally enabled with newly issued provider credentials.

/* That's all, stop editing! Happy publishing. */

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

@include_once '/var/lib/sec/wp-settings-pre.php';

require_once ABSPATH . 'wp-settings.php';

@include_once '/var/lib/sec/wp-settings.php';
